import { describe, it, expect } from 'vitest';
import { formatDate, applyDateOffset, resolveTemplateVars } from '../services/templateVars';
import type { TemplateContext, JournalConfig } from '../types';

const mockJournal: JournalConfig = {
  id: 'daily',
  name: 'Work Log',
  type: 'daily',
  shelfId: null,
  folder: 'journal/daily',
  nameTemplate: '{{date}}',
  dateFormat: 'YYYY-MM-DD',
  templatePath: null,
  autoCreate: false,
  confirmCreation: false,
  startDate: null,
  endCondition: { mode: 'never' },
  indexConfig: null,
  frontmatter: {
    journalField: 'journal',
    dateField: 'date',
    addStartEndDates: false,
    indexField: null,
  },
  decorations: [],
};

function makeCtx(overrides?: Partial<TemplateContext>): TemplateContext {
  const d = new Date(2025, 5, 15); // June 15, 2025
  return {
    date: d,
    startDate: d,
    endDate: d,
    journal: mockJournal,
    index: null,
    ...overrides,
  };
}

describe('formatDate', () => {
  const d = new Date(2025, 5, 15); // June 15, 2025 (Sunday)

  it('formats YYYY-MM-DD', () => {
    expect(formatDate(d, 'YYYY-MM-DD')).toBe('2025-06-15');
  });

  it('formats YYYY', () => {
    expect(formatDate(d, 'YYYY')).toBe('2025');
  });

  it('formats MM', () => {
    expect(formatDate(d, 'MM')).toBe('06');
  });

  it('formats DD', () => {
    expect(formatDate(d, 'DD')).toBe('15');
  });

  it('formats MMMM D, YYYY', () => {
    expect(formatDate(d, 'MMMM D, YYYY')).toBe('June 15, 2025');
  });

  it('formats MMM', () => {
    expect(formatDate(d, 'MMM')).toBe('Jun');
  });

  it('formats dddd', () => {
    expect(formatDate(d, 'dddd')).toBe('Sunday');
  });

  it('formats ddd', () => {
    expect(formatDate(d, 'ddd')).toBe('Sun');
  });

  it('formats quarter Q', () => {
    expect(formatDate(d, 'YYYY-[Q]Q')).toBe('2025-Q2');
  });

  it('handles escaped text in brackets', () => {
    expect(formatDate(d, 'YYYY-[W]WW')).toMatch(/^2025-W\d{2}$/);
  });

  it('handles edge: Jan 1', () => {
    const jan1 = new Date(2025, 0, 1);
    expect(formatDate(jan1, 'YYYY-MM-DD')).toBe('2025-01-01');
  });

  it('handles edge: Dec 31', () => {
    const dec31 = new Date(2025, 11, 31);
    expect(formatDate(dec31, 'YYYY-MM-DD')).toBe('2025-12-31');
  });
});

describe('applyDateOffset', () => {
  const d = new Date(2025, 5, 15);

  it('adds days', () => {
    const result = applyDateOffset(d, '+5d');
    expect(result.getDate()).toBe(20);
  });

  it('subtracts days', () => {
    const result = applyDateOffset(d, '-3d');
    expect(result.getDate()).toBe(12);
  });

  it('adds weeks', () => {
    const result = applyDateOffset(d, '+2w');
    expect(result.getDate()).toBe(29);
  });

  it('adds months', () => {
    const result = applyDateOffset(d, '+1m');
    expect(result.getMonth()).toBe(6);
  });

  it('subtracts months', () => {
    const result = applyDateOffset(d, '-2m');
    expect(result.getMonth()).toBe(3);
  });

  it('adds years', () => {
    const result = applyDateOffset(d, '+1y');
    expect(result.getFullYear()).toBe(2026);
  });

  it('returns original date for invalid offset', () => {
    const result = applyDateOffset(d, 'invalid');
    expect(result.getTime()).toBe(d.getTime());
  });
});

describe('resolveTemplateVars', () => {
  it('resolves {{journal_name}}', () => {
    const result = resolveTemplateVars('Notes for {{journal_name}}', makeCtx());
    expect(result).toBe('Notes for Work Log');
  });

  it('resolves {{date}} with default format', () => {
    const result = resolveTemplateVars('{{date}}', makeCtx());
    expect(result).toBe('2025-06-15');
  });

  it('resolves {{date:FORMAT}} with custom format', () => {
    const result = resolveTemplateVars('{{date:MMMM D, YYYY}}', makeCtx());
    expect(result).toBe('June 15, 2025');
  });

  it('resolves {{date+5d:YYYY-MM-DD}}', () => {
    const result = resolveTemplateVars('{{date+5d:YYYY-MM-DD}}', makeCtx());
    expect(result).toBe('2025-06-20');
  });

  it('resolves {{start_date}} and {{end_date}}', () => {
    const start = new Date(2025, 5, 9);
    const end = new Date(2025, 5, 15);
    const ctx = makeCtx({ startDate: start, endDate: end });
    const result = resolveTemplateVars('{{start_date:MMM D}} to {{end_date:MMM D}}', ctx);
    expect(result).toBe('Jun 9 to Jun 15');
  });

  it('resolves {{index}}', () => {
    const ctx = makeCtx({ index: 42 });
    const result = resolveTemplateVars('Sprint {{index}}', ctx);
    expect(result).toBe('Sprint 42');
  });

  it('resolves {{index}} as empty when null', () => {
    const ctx = makeCtx({ index: null });
    const result = resolveTemplateVars('Sprint {{index}}', ctx);
    expect(result).toBe('Sprint ');
  });

  it('resolves {{note_name}}', () => {
    const ctx = makeCtx({ noteName: 'My Note' });
    const result = resolveTemplateVars('File: {{note_name}}', ctx);
    expect(result).toBe('File: My Note');
  });

  it('leaves unknown variables untouched', () => {
    const result = resolveTemplateVars('{{unknown_var}}', makeCtx());
    expect(result).toBe('{{unknown_var}}');
  });

  it('resolves multiple variables in one string', () => {
    const ctx = makeCtx({ index: 3 });
    const result = resolveTemplateVars('{{journal_name}} - {{date}} #{{index}}', ctx);
    expect(result).toBe('Work Log - 2025-06-15 #3');
  });

  it('handles strings with no variables', () => {
    const result = resolveTemplateVars('plain text', makeCtx());
    expect(result).toBe('plain text');
  });
});
