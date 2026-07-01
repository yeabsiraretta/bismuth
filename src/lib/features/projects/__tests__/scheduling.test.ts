import { describe, it, expect } from 'vitest';
import {
  hasCycle, wouldCreateCycle, topologicalSort,
  autoSchedule, nextOccurrence, isMilestone,
  buildDepGraph, diffDays, taskDuration,
} from '../services/scheduling';
import type { PMTask, Recurrence } from '../types';

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

describe('hasCycle', () => {
  it('returns false for acyclic graph', () => {
    const tasks = [
      mockTask({ id: 'a', dependencies: [] }),
      mockTask({ id: 'b', dependencies: ['a'] }),
      mockTask({ id: 'c', dependencies: ['b'] }),
    ];
    expect(hasCycle(tasks)).toBe(false);
  });

  it('detects direct cycle', () => {
    const tasks = [
      mockTask({ id: 'a', dependencies: ['b'] }),
      mockTask({ id: 'b', dependencies: ['a'] }),
    ];
    expect(hasCycle(tasks)).toBe(true);
  });

  it('detects indirect cycle', () => {
    const tasks = [
      mockTask({ id: 'a', dependencies: ['c'] }),
      mockTask({ id: 'b', dependencies: ['a'] }),
      mockTask({ id: 'c', dependencies: ['b'] }),
    ];
    expect(hasCycle(tasks)).toBe(true);
  });
});

describe('wouldCreateCycle', () => {
  it('returns true if new dep creates cycle', () => {
    const tasks = [
      mockTask({ id: 'a', dependencies: [] }),
      mockTask({ id: 'b', dependencies: ['a'] }),
    ];
    expect(wouldCreateCycle(tasks, 'a', 'b')).toBe(true);
  });

  it('returns false if new dep is safe', () => {
    const tasks = [
      mockTask({ id: 'a', dependencies: [] }),
      mockTask({ id: 'b', dependencies: [] }),
    ];
    expect(wouldCreateCycle(tasks, 'b', 'a')).toBe(false);
  });
});

describe('topologicalSort', () => {
  it('sorts tasks in dependency order', () => {
    const tasks = [
      mockTask({ id: 'c', dependencies: ['b'] }),
      mockTask({ id: 'a', dependencies: [] }),
      mockTask({ id: 'b', dependencies: ['a'] }),
    ];
    const sorted = topologicalSort(tasks);
    const ids = sorted.map(t => t.id);
    expect(ids.indexOf('a')).toBeLessThan(ids.indexOf('b'));
    expect(ids.indexOf('b')).toBeLessThan(ids.indexOf('c'));
  });
});

describe('buildDepGraph', () => {
  it('builds edges from dependencies', () => {
    const tasks = [
      mockTask({ id: 'a', dependencies: [] }),
      mockTask({ id: 'b', dependencies: ['a'] }),
    ];
    const edges = buildDepGraph(tasks);
    expect(edges).toEqual([{ from: 'a', to: 'b' }]);
  });
});

describe('diffDays', () => {
  it('computes difference between two dates', () => {
    expect(diffDays('2026-01-01', '2026-01-10')).toBe(9);
  });

  it('returns negative for reversed dates', () => {
    expect(diffDays('2026-01-10', '2026-01-01')).toBe(-9);
  });
});

describe('taskDuration', () => {
  it('computes duration from start and due', () => {
    const t = mockTask({ startDate: '2026-01-01', dueDate: '2026-01-06' });
    expect(taskDuration(t)).toBe(5);
  });

  it('defaults to 1 when no dates', () => {
    expect(taskDuration(mockTask())).toBe(1);
  });
});

describe('autoSchedule', () => {
  it('shifts dependent tasks when blocker moves', () => {
    const tasks = [
      mockTask({ id: 'a', startDate: '2026-01-01', dueDate: '2026-01-05', dependencies: [] }),
      mockTask({ id: 'b', startDate: '2026-01-02', dueDate: '2026-01-04', dependencies: ['a'] }),
    ];
    const result = autoSchedule(tasks, 'a');
    const taskB = result.find(t => t.id === 'b')!;
    expect(taskB.startDate).toBe('2026-01-06');
  });

  it('does not shift tasks without dependencies', () => {
    const tasks = [
      mockTask({ id: 'a', startDate: '2026-01-01', dueDate: '2026-01-05', dependencies: [] }),
      mockTask({ id: 'b', startDate: '2026-01-02', dueDate: '2026-01-04', dependencies: [] }),
    ];
    const result = autoSchedule(tasks, 'a');
    const taskB = result.find(t => t.id === 'b')!;
    expect(taskB.startDate).toBe('2026-01-02');
  });
});

describe('nextOccurrence', () => {
  it('computes daily next', () => {
    const r: Recurrence = { interval: 'daily' };
    expect(nextOccurrence('2026-01-01', r)).toBe('2026-01-02');
  });

  it('computes weekly next', () => {
    const r: Recurrence = { interval: 'weekly' };
    expect(nextOccurrence('2026-01-01', r)).toBe('2026-01-08');
  });

  it('returns null if past endDate', () => {
    const r: Recurrence = { interval: 'daily', endDate: '2026-01-01' };
    expect(nextOccurrence('2026-01-01', r)).toBeNull();
  });
});

describe('isMilestone', () => {
  it('identifies milestone type', () => {
    expect(isMilestone(mockTask({ type: 'milestone' }))).toBe(true);
  });

  it('identifies zero-duration milestone', () => {
    expect(isMilestone(mockTask({ startDate: '2026-01-01', dueDate: '2026-01-01' }))).toBe(true);
  });

  it('returns false for regular task', () => {
    expect(isMilestone(mockTask({ startDate: '2026-01-01', dueDate: '2026-01-05' }))).toBe(false);
  });
});
