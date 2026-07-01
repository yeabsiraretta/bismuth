import { describe, it, expect } from 'vitest';
import {
  extractDataPoints,
  extractDate,
  timeFrameRange,
  isInTimeFrame,
} from '../services/dataExtractor';
import type { NoteMeta } from '../services/dataExtractor';
import type { PropertyDefinition } from '../types';

function propDef(overrides: Partial<PropertyDefinition> = {}): PropertyDefinition {
  return {
    id: 'p1',
    name: 'mood',
    type: 'number',
    order: 0,
    ...overrides,
  };
}

function note(path: string, fm: Record<string, unknown>): NoteMeta {
  return { path, frontmatter: fm };
}

describe('extractDate', () => {
  it('extracts from frontmatter property', () => {
    expect(extractDate({ date: '2026-01-15' }, 'test.md', 'date')).toBe('2026-01-15');
  });

  it('extracts from filename', () => {
    expect(extractDate({}, '2026-03-20.md', 'date')).toBe('2026-03-20');
  });

  it('extracts datetime as date-only', () => {
    expect(extractDate({ date: '2026-04-01T10:30:00' }, 'test.md', 'date')).toBe('2026-04-01');
  });

  it('returns null when no date found', () => {
    expect(extractDate({}, 'random-note.md', 'date')).toBeNull();
  });
});

describe('timeFrameRange', () => {
  it('returns null for "all"', () => {
    expect(timeFrameRange('all')).toBeNull();
  });

  it('returns a range for last-7', () => {
    const range = timeFrameRange('last-7');
    expect(range).not.toBeNull();
    expect(range!.start).toBeTruthy();
    expect(range!.end).toBeTruthy();
    expect(range!.start < range!.end).toBe(true);
  });

  it('returns a range for this-month', () => {
    const range = timeFrameRange('this-month');
    expect(range).not.toBeNull();
    expect(range!.start).toMatch(/^\d{4}-\d{2}-01$/);
  });
});

describe('isInTimeFrame', () => {
  it('always returns true for "all"', () => {
    expect(isInTimeFrame('2000-01-01', 'all')).toBe(true);
  });

  it('filters dates outside range', () => {
    expect(isInTimeFrame('2000-01-01', 'last-7')).toBe(false);
  });

  it('includes dates within range', () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(isInTimeFrame(today, 'last-30')).toBe(true);
  });
});

describe('extractDataPoints', () => {
  it('extracts numeric values', () => {
    const notes = [
      note('2026-01-01.md', { mood: 8 }),
      note('2026-01-02.md', { mood: 6 }),
      note('2026-01-03.md', {}),
    ];
    const points = extractDataPoints(notes, propDef(), 'date', 'all');
    expect(points).toHaveLength(2);
    expect(points[0].numericValue).toBe(8);
    expect(points[1].numericValue).toBe(6);
  });

  it('applies value mappings', () => {
    const def = propDef({
      name: 'mood',
      type: 'text',
      valueMappings: [
        { display: 'great', numeric: 10 },
        { display: 'ok', numeric: 5 },
      ],
    });
    const notes = [note('2026-01-01.md', { mood: 'great' })];
    const points = extractDataPoints(notes, def, 'date', 'all');
    expect(points[0].numericValue).toBe(10);
  });

  it('applies note filter by folder', () => {
    const def = propDef({ noteFilter: { folder: 'journal/' } });
    const notes = [
      note('journal/2026-01-01.md', { mood: 5 }),
      note('notes/2026-01-02.md', { mood: 7 }),
    ];
    const points = extractDataPoints(notes, def, 'date', 'all');
    expect(points).toHaveLength(1);
    expect(points[0].sourcePath).toBe('journal/2026-01-01.md');
  });

  it('sorts by date', () => {
    const notes = [
      note('2026-03-01.md', { mood: 1 }),
      note('2026-01-01.md', { mood: 2 }),
      note('2026-02-01.md', { mood: 3 }),
    ];
    const points = extractDataPoints(notes, propDef(), 'date', 'all');
    expect(points.map((p) => p.date)).toEqual(['2026-01-01', '2026-02-01', '2026-03-01']);
  });

  it('converts boolean to 0/1', () => {
    const def = propDef({ name: 'exercise', type: 'checkbox' });
    const notes = [note('2026-01-01.md', { exercise: true })];
    const points = extractDataPoints(notes, def, 'date', 'all');
    expect(points[0].numericValue).toBe(1);
  });
});
