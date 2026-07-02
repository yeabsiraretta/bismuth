import { describe, it, expect, vi } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('@/utils/logger', () => ({
  log: { info: vi.fn(), debug: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));
vi.mock('@/stores/vault/vault', () => ({
  currentVault: {
    subscribe: vi.fn((cb: (v: unknown) => void) => {
      cb({ root_path: '/vault' });
      return () => {};
    }),
  },
}));

import {
  getPeriodBounds,
  computeIndex,
  resolveNotePath,
  buildFrontmatter,
  navigatePeriod,
} from '../services/journalService';
import type { JournalConfig } from '../types';
import {
  DEFAULT_DAILY_JOURNAL,
  DEFAULT_WEEKLY_JOURNAL,
  DEFAULT_MONTHLY_JOURNAL,
} from '../types/defaults';

function makeJournal(overrides?: Partial<JournalConfig>): JournalConfig {
  return { ...DEFAULT_DAILY_JOURNAL, ...overrides };
}

describe('getPeriodBounds', () => {
  it('daily: same start and end', () => {
    const d = new Date(2025, 5, 15);
    const { start, end } = getPeriodBounds(d, DEFAULT_DAILY_JOURNAL);
    expect(start.getDate()).toBe(15);
    expect(end.getDate()).toBe(15);
  });

  it('weekly: Sunday to Saturday', () => {
    const d = new Date(2025, 5, 18); // Wednesday
    const { start, end } = getPeriodBounds(d, DEFAULT_WEEKLY_JOURNAL);
    expect(start.getDay()).toBe(0); // Sunday
    expect(end.getDay()).toBe(6); // Saturday
  });

  it('monthly: first to last day', () => {
    const d = new Date(2025, 1, 15); // February
    const { start, end } = getPeriodBounds(d, DEFAULT_MONTHLY_JOURNAL);
    expect(start.getDate()).toBe(1);
    expect(end.getDate()).toBe(28);
  });

  it('quarterly: 3-month span', () => {
    const d = new Date(2025, 4, 15); // May = Q2
    const journal = makeJournal({ type: 'quarterly' });
    const { start, end } = getPeriodBounds(d, journal);
    expect(start.getMonth()).toBe(3); // April
    expect(end.getMonth()).toBe(5); // June
  });

  it('yearly: Jan 1 to Dec 31', () => {
    const d = new Date(2025, 5, 15);
    const journal = makeJournal({ type: 'yearly' });
    const { start, end } = getPeriodBounds(d, journal);
    expect(start.getMonth()).toBe(0);
    expect(start.getDate()).toBe(1);
    expect(end.getMonth()).toBe(11);
    expect(end.getDate()).toBe(31);
  });

  it('custom interval: 2-week sprints', () => {
    const journal = makeJournal({
      type: 'custom',
      customInterval: { every: 2, unit: 'week' },
      startDate: '2025-01-06',
    });
    const d = new Date(2025, 0, 15); // Jan 15
    const { start, end } = getPeriodBounds(d, journal);
    expect(start.getDate()).toBe(6);
    // End should be Jan 19 (13 days after start, since 2 weeks = 14 days, last day = 13 offset)
    expect(end.getDate()).toBe(19);
  });
});

describe('computeIndex', () => {
  it('returns null when indexConfig is null', () => {
    expect(computeIndex(new Date(), DEFAULT_DAILY_JOURNAL)).toBeNull();
  });

  it('computes daily index from anchor', () => {
    const journal = makeJournal({
      indexConfig: { anchorDate: '2025-01-01', startIndex: 1, resetMode: 'continuous' },
    });
    const d = new Date(2025, 0, 10); // Jan 10 = 9 days after anchor
    expect(computeIndex(d, journal)).toBe(10);
  });

  it('computes monthly index from anchor', () => {
    const journal = makeJournal({
      type: 'monthly',
      indexConfig: { anchorDate: '2025-01-01', startIndex: 1, resetMode: 'continuous' },
    });
    const d = new Date(2025, 2, 15); // March
    expect(computeIndex(d, journal)).toBe(3);
  });

  it('resets yearly', () => {
    const journal = makeJournal({
      type: 'monthly',
      indexConfig: { anchorDate: '2024-01-01', startIndex: 1, resetMode: 'yearly' },
    });
    const d = new Date(2025, 2, 15); // March 2025
    expect(computeIndex(d, journal)).toBe(3);
  });

  it('computes custom interval index', () => {
    const journal = makeJournal({
      type: 'custom',
      customInterval: { every: 2, unit: 'week' },
      startDate: '2025-01-06',
      indexConfig: { anchorDate: '2025-01-06', startIndex: 1, resetMode: 'continuous' },
    });
    const d = new Date(2025, 0, 20); // Jan 20 = in second sprint
    expect(computeIndex(d, journal)).toBe(2);
  });
});

describe('resolveNotePath', () => {
  it('resolves daily path', () => {
    const d = new Date(2025, 5, 15);
    const path = resolveNotePath(d, DEFAULT_DAILY_JOURNAL);
    expect(path).toBe('journal/daily/2025-06-15.md');
  });

  it('resolves weekly path', () => {
    const d = new Date(2025, 5, 18);
    const path = resolveNotePath(d, DEFAULT_WEEKLY_JOURNAL);
    expect(path).toMatch(/^journal\/weekly\/\d{4}-W\d{2}\.md$/);
  });

  it('resolves path with journal_name variable in folder', () => {
    const journal = makeJournal({
      folder: 'projects/{{journal_name}}/notes',
      nameTemplate: '{{date}}',
      name: 'Sprint Log',
    });
    const d = new Date(2025, 5, 15);
    const path = resolveNotePath(d, journal);
    expect(path).toBe('projects/Sprint Log/notes/2025-06-15.md');
  });

  it('resolves path with index in name', () => {
    const journal = makeJournal({
      nameTemplate: 'Sprint {{index}}',
      indexConfig: { anchorDate: '2025-01-01', startIndex: 1, resetMode: 'continuous' },
    });
    const d = new Date(2025, 0, 10);
    const path = resolveNotePath(d, journal);
    expect(path).toContain('Sprint 10');
  });

  it('sanitizes illegal path characters', () => {
    const journal = makeJournal({
      nameTemplate: '{{date:MM/DD/YYYY}}',
    });
    const d = new Date(2025, 5, 15);
    const path = resolveNotePath(d, journal);
    expect(path).not.toContain('/06/15/');
    expect(path).toContain('06_15_2025');
  });
});

describe('buildFrontmatter', () => {
  it('builds basic frontmatter', () => {
    const d = new Date(2025, 5, 15);
    const fm = buildFrontmatter(d, DEFAULT_DAILY_JOURNAL);
    expect(fm).toContain('---');
    expect(fm).toContain('journal: "Daily Notes"');
    expect(fm).toContain('date: 2025-06-15');
  });

  it('includes start/end dates when configured', () => {
    const journal = makeJournal({
      type: 'weekly',
      frontmatter: {
        journalField: 'journal',
        dateField: 'date',
        addStartEndDates: true,
        indexField: null,
      },
    });
    const d = new Date(2025, 5, 18);
    const fm = buildFrontmatter(d, journal);
    expect(fm).toContain('start_date:');
    expect(fm).toContain('end_date:');
  });

  it('includes index when configured', () => {
    const journal = makeJournal({
      indexConfig: { anchorDate: '2025-01-01', startIndex: 1, resetMode: 'continuous' },
      frontmatter: {
        journalField: 'journal',
        dateField: 'date',
        addStartEndDates: false,
        indexField: 'index',
      },
    });
    const d = new Date(2025, 0, 5);
    const fm = buildFrontmatter(d, journal);
    expect(fm).toContain('index: 5');
  });

  it('omits fields set to null', () => {
    const journal = makeJournal({
      frontmatter: {
        journalField: null,
        dateField: null,
        addStartEndDates: false,
        indexField: null,
      },
    });
    const d = new Date(2025, 5, 15);
    const fm = buildFrontmatter(d, journal);
    expect(fm).toBe('---\n---');
  });
});

describe('navigatePeriod', () => {
  const d = new Date(2025, 5, 15);

  it('navigates daily forward', () => {
    const next = navigatePeriod(d, DEFAULT_DAILY_JOURNAL, 'next');
    expect(next.getDate()).toBe(16);
  });

  it('navigates daily backward', () => {
    const prev = navigatePeriod(d, DEFAULT_DAILY_JOURNAL, 'prev');
    expect(prev.getDate()).toBe(14);
  });

  it('navigates weekly forward', () => {
    const next = navigatePeriod(d, DEFAULT_WEEKLY_JOURNAL, 'next');
    expect(next.getDate()).toBe(22);
  });

  it('navigates monthly forward', () => {
    const next = navigatePeriod(d, DEFAULT_MONTHLY_JOURNAL, 'next');
    expect(next.getMonth()).toBe(6);
  });

  it('navigates custom interval forward', () => {
    const journal = makeJournal({
      type: 'custom',
      customInterval: { every: 2, unit: 'week' },
    });
    const next = navigatePeriod(d, journal, 'next');
    expect(next.getDate()).toBe(29);
  });
});
