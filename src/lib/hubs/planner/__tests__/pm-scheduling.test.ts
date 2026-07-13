import { describe, expect, it } from 'vitest';

import {
  addDays,
  barStyle,
  computeTimeline,
  diffDays,
  generateColumns,
  isMilestone,
  todayISO,
} from '@/hubs/planner/services/pm-scheduling';
import type { PMTask } from '@/hubs/planner/types/pm-types';

function makeTask(overrides: Partial<PMTask> = {}): PMTask {
  return {
    id: 'test-1',
    taskNumber: 1,
    title: 'Test Task',
    description: '',
    status: 'todo',
    priority: 'medium',
    type: 'task',
    project: '',
    notePath: null,
    startDate: '2026-07-01',
    dueDate: '2026-07-10',
    scheduledDate: null,
    doneDate: null,
    recurrence: null,
    progress: 0,
    parentId: null,
    subtaskIds: [],
    dependencies: [],
    tags: [],
    createdAt: '2026-07-01T00:00:00Z',
    updatedAt: '2026-07-01T00:00:00Z',
    ...overrides,
  };
}

describe('diffDays', () => {
  it('returns positive difference for later date', () => {
    expect(diffDays('2026-07-01', '2026-07-10')).toBe(9);
  });

  it('returns 0 for same date', () => {
    expect(diffDays('2026-07-05', '2026-07-05')).toBe(0);
  });

  it('returns negative for earlier date', () => {
    expect(diffDays('2026-07-10', '2026-07-01')).toBe(-9);
  });
});

describe('addDays', () => {
  it('adds positive days', () => {
    expect(addDays('2026-07-01', 5)).toBe('2026-07-06');
  });

  it('adds negative days (subtracts)', () => {
    expect(addDays('2026-07-10', -3)).toBe('2026-07-07');
  });

  it('crosses month boundary', () => {
    expect(addDays('2026-07-29', 5)).toBe('2026-08-03');
  });
});

describe('todayISO', () => {
  it('returns ISO date string of length 10', () => {
    const today = todayISO();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('isMilestone', () => {
  it('returns true for milestone type', () => {
    expect(isMilestone(makeTask({ type: 'milestone' }))).toBe(true);
  });

  it('returns true when startDate === dueDate', () => {
    expect(isMilestone(makeTask({ startDate: '2026-07-05', dueDate: '2026-07-05' }))).toBe(true);
  });

  it('returns false for normal task with date range', () => {
    expect(isMilestone(makeTask())).toBe(false);
  });

  it('returns false when dueDate is null', () => {
    expect(isMilestone(makeTask({ startDate: null, dueDate: null }))).toBe(false);
  });
});

describe('generateColumns', () => {
  it('generates day columns', () => {
    const cols = generateColumns('2026-07-01', '2026-07-03', 3, 'day');
    expect(cols.length).toBeGreaterThanOrEqual(3);
    // Label format: "Jun 30" or "Jul 1" depending on timezone
    expect(cols[0].label).toMatch(/^[A-Z][a-z]{2}\s\d+$/);
  });

  it('generates week columns', () => {
    const cols = generateColumns('2026-07-01', '2026-07-28', 28, 'week');
    expect(cols.length).toBeGreaterThanOrEqual(3);
    // First column label is a week number like W27
    expect(cols[0].label).toMatch(/^W\d+/);
  });

  it('generates month columns', () => {
    const cols = generateColumns('2026-07-01', '2026-09-30', 92, 'month');
    expect(cols.length).toBeGreaterThanOrEqual(3);
    // Month label format: "Jul 26" or "Aug 26" etc.
    expect(cols[0].label).toMatch(/^[A-Z][a-z]{2}\s/);
  });

  it('generates quarter columns', () => {
    const cols = generateColumns('2026-01-01', '2026-12-31', 365, 'quarter');
    expect(cols.length).toBeGreaterThanOrEqual(3);
    expect(cols[0].label).toMatch(/^Q\d\s\d{4}$/);
  });

  it('column left + width values are percentages', () => {
    const cols = generateColumns('2026-07-01', '2026-07-07', 7, 'day');
    for (const col of cols) {
      expect(col.left).toBeGreaterThanOrEqual(0);
      expect(col.left).toBeLessThanOrEqual(100);
      expect(col.width).toBeGreaterThan(0);
    }
  });
});

describe('barStyle', () => {
  it('returns CSS string with left, width, and background', () => {
    const style = barStyle(makeTask(), '2026-06-24', 30, '#3b82f6');
    expect(style).toContain('left:');
    expect(style).toContain('width:');
    expect(style).toContain('background:#3b82f6');
  });

  it('uses dueDate when startDate is null', () => {
    const task = makeTask({ startDate: null, dueDate: '2026-07-05' });
    const style = barStyle(task, '2026-07-01', 30, '#ccc');
    expect(style).toContain('left:');
  });
});

describe('computeTimeline', () => {
  it('computes range from task dates', () => {
    const tasks = [
      makeTask({ startDate: '2026-07-01', dueDate: '2026-07-10' }),
      makeTask({ id: 'test-2', startDate: '2026-07-05', dueDate: '2026-07-20' }),
    ];
    const tl = computeTimeline(tasks);
    expect(tl.paddedMin).toBe(addDays('2026-07-01', -7));
    expect(tl.paddedMax).toBe(addDays('2026-07-20', 14));
    expect(tl.totalDays).toBeGreaterThan(0);
    expect(tl.todayOffset).toBeGreaterThanOrEqual(0);
  });

  it('handles empty task list with defaults', () => {
    const tl = computeTimeline([]);
    expect(tl.totalDays).toBeGreaterThan(0);
  });

  it('handles tasks without dates', () => {
    const tasks = [makeTask({ startDate: null, dueDate: null })];
    const tl = computeTimeline(tasks);
    expect(tl.totalDays).toBeGreaterThan(0);
  });
});
