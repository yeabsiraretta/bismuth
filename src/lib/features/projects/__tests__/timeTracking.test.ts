import { describe, it, expect } from 'vitest';
import {
  totalLoggedHours, logTime, timeBasedProgress, setProgress,
  isOverdue, daysUntilDue,
  subtaskProgress, subtaskCounts,
  formatHours, formatDate, formatDateShort,
} from '../services/timeTracking';
import type { PMTask } from '../types';

function mockTask(overrides: Partial<PMTask> = {}): PMTask {
  return {
    id: 'task-1', path: 'p/t.md', title: 'Test', description: '',
    type: 'task', status: 'todo', priority: 'medium',
    startDate: null, dueDate: null, progress: 0,
    timeEstimate: null, timeLogs: [], assignees: [], tags: [],
    parentId: null, subtaskIds: [], dependencies: [],
    recurrence: null, customFields: {}, archived: false,
    createdAt: '2026-01-01', updatedAt: '2026-01-01',
    ...overrides,
  };
}

describe('totalLoggedHours', () => {
  it('sums time logs', () => {
    const task = mockTask({ timeLogs: [{ date: '2026-01-01', hours: 2 }, { date: '2026-01-02', hours: 3.5 }] });
    expect(totalLoggedHours(task)).toBe(5.5);
  });

  it('returns 0 for no logs', () => {
    expect(totalLoggedHours(mockTask())).toBe(0);
  });
});

describe('logTime', () => {
  it('adds a time log entry', () => {
    const task = mockTask();
    const updated = logTime(task, 2, 'setup');
    expect(updated.timeLogs).toHaveLength(1);
    expect(updated.timeLogs[0].hours).toBe(2);
    expect(updated.timeLogs[0].note).toBe('setup');
  });
});

describe('timeBasedProgress', () => {
  it('calculates progress from estimate', () => {
    const task = mockTask({ timeEstimate: 10, timeLogs: [{ date: '2026-01-01', hours: 3 }] });
    expect(timeBasedProgress(task)).toBe(30);
  });

  it('caps at 100', () => {
    const task = mockTask({ timeEstimate: 5, timeLogs: [{ date: '2026-01-01', hours: 10 }] });
    expect(timeBasedProgress(task)).toBe(100);
  });

  it('returns 0 without estimate', () => {
    expect(timeBasedProgress(mockTask())).toBe(0);
  });
});

describe('setProgress', () => {
  it('clamps to 0-100', () => {
    expect(setProgress(mockTask(), -10).progress).toBe(0);
    expect(setProgress(mockTask(), 150).progress).toBe(100);
    expect(setProgress(mockTask(), 50).progress).toBe(50);
  });
});

describe('isOverdue', () => {
  it('returns true for past due date', () => {
    expect(isOverdue(mockTask({ dueDate: '2020-01-01' }))).toBe(true);
  });

  it('returns false for done tasks', () => {
    expect(isOverdue(mockTask({ dueDate: '2020-01-01', status: 'done' }))).toBe(false);
  });

  it('returns false without due date', () => {
    expect(isOverdue(mockTask())).toBe(false);
  });
});

describe('daysUntilDue', () => {
  it('returns null without due date', () => {
    expect(daysUntilDue(mockTask())).toBeNull();
  });

  it('returns negative for past dates', () => {
    const days = daysUntilDue(mockTask({ dueDate: '2020-01-01' }));
    expect(days).toBeLessThan(0);
  });
});

describe('subtaskProgress', () => {
  it('averages child progress', () => {
    const tasks = [
      mockTask({ id: 'parent', parentId: null }),
      mockTask({ id: 'c1', parentId: 'parent', progress: 50 }),
      mockTask({ id: 'c2', parentId: 'parent', progress: 100 }),
    ];
    expect(subtaskProgress(tasks, 'parent')).toBe(75);
  });

  it('returns 0 with no children', () => {
    expect(subtaskProgress([], 'x')).toBe(0);
  });
});

describe('subtaskCounts', () => {
  it('counts by status', () => {
    const tasks = [
      mockTask({ id: 'c1', parentId: 'p', status: 'todo' }),
      mockTask({ id: 'c2', parentId: 'p', status: 'done' }),
      mockTask({ id: 'c3', parentId: 'p', status: 'done' }),
    ];
    const counts = subtaskCounts(tasks, 'p');
    expect(counts['todo']).toBe(1);
    expect(counts['done']).toBe(2);
  });
});

describe('formatHours', () => {
  it('formats sub-hour as minutes', () => {
    expect(formatHours(0.5)).toBe('30m');
  });

  it('formats whole hours', () => {
    expect(formatHours(3)).toBe('3h');
  });

  it('formats mixed', () => {
    expect(formatHours(2.5)).toBe('2h 30m');
  });
});

describe('formatDate', () => {
  it('formats a date string', () => {
    const result = formatDate('2026-04-15');
    expect(result.length).toBeGreaterThan(0);
    expect(result).toBeTruthy();
  });

  it('returns empty for null', () => {
    expect(formatDate(null)).toBe('');
  });
});

describe('formatDateShort', () => {
  it('formats a short date', () => {
    const result = formatDateShort('2026-12-25');
    expect(result.length).toBeGreaterThan(0);
    expect(result).toBeTruthy();
  });
});
