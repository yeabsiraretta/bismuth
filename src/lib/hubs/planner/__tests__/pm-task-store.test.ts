import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  _resetPMStore,
  addTask,
  formatTaskId,
  getFilteredTasks,
  getPMSettings,
  getPMTasks,
  getTaskByNumber,
  getTasksByProject,
  getTasksByStatus,
  initPMStore,
  removeTask,
  updatePMSettings,
  updateTask,
} from '@/hubs/planner/stores/pm-task-store.svelte';

describe('pm-task-store', () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        Object.keys(store).forEach((k) => delete store[k]);
      },
    });
    _resetPMStore();
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('initializes with empty tasks', () => {
    initPMStore();
    expect(getPMTasks()).toEqual([]);
  });

  it('adds a task with auto-incrementing taskNumber', () => {
    initPMStore();
    const task1 = addTask({ title: 'First' });
    const task2 = addTask({ title: 'Second' });
    expect(task1.taskNumber).toBe(1);
    expect(task2.taskNumber).toBe(2);
    expect(task1.id).toBeTruthy();
    expect(task1.title).toBe('First');
    expect(task1.status).toBe('todo');
    expect(task1.priority).toBe('medium');
    expect(getPMTasks()).toHaveLength(2);
  });

  it('formatTaskId formats task number with zero padding', () => {
    expect(formatTaskId(1)).toBe('TASK-001');
    expect(formatTaskId(42)).toBe('TASK-042');
    expect(formatTaskId(999)).toBe('TASK-999');
    expect(formatTaskId(1234)).toBe('TASK-1234');
  });

  it('getTaskByNumber returns the correct task', () => {
    initPMStore();
    const task = addTask({ title: 'Lookup test' });
    expect(getTaskByNumber(task.taskNumber)).toStrictEqual(task);
    expect(getTaskByNumber(9999)).toBeUndefined();
  });

  it('updates a task', () => {
    initPMStore();
    const task = addTask({ title: 'Original' });
    updateTask(task.id, { title: 'Updated', status: 'in-progress' });
    const updated = getPMTasks().find((t) => t.id === task.id);
    expect(updated?.title).toBe('Updated');
    expect(updated?.status).toBe('in-progress');
  });

  it('removes a task', () => {
    initPMStore();
    const task = addTask({ title: 'To Remove' });
    expect(getPMTasks()).toHaveLength(1);
    removeTask(task.id);
    expect(getPMTasks()).toHaveLength(0);
  });

  it('filters tasks by status', () => {
    initPMStore();
    addTask({ title: 'A', status: 'todo' });
    addTask({ title: 'B', status: 'done' });
    addTask({ title: 'C', status: 'in-progress' });

    const todoOnly = getFilteredTasks({ status: ['todo'] });
    expect(todoOnly).toHaveLength(1);
    expect(todoOnly[0].title).toBe('A');
  });

  it('filters out done tasks with hideDone', () => {
    initPMStore();
    addTask({ title: 'A', status: 'todo' });
    addTask({ title: 'B', status: 'done' });
    addTask({ title: 'C', status: 'cancelled' });

    const active = getFilteredTasks({ hideDone: true });
    expect(active).toHaveLength(1);
    expect(active[0].title).toBe('A');
  });

  it('groups tasks by status', () => {
    initPMStore();
    addTask({ title: 'A', status: 'todo' });
    addTask({ title: 'B', status: 'done' });

    const groups = getTasksByStatus();
    expect(groups['todo']).toHaveLength(1);
    expect(groups['done']).toHaveLength(1);
    expect(groups['in-progress']).toHaveLength(0);
  });

  it('groups tasks by project', () => {
    initPMStore();
    addTask({ title: 'A', project: 'alpha' });
    addTask({ title: 'B', project: 'alpha' });
    addTask({ title: 'C', project: 'beta' });

    const groups = getTasksByProject();
    expect(groups['alpha']).toHaveLength(2);
    expect(groups['beta']).toHaveLength(1);
  });

  it('updates settings', () => {
    initPMStore();
    updatePMSettings({ ganttGranularity: 'month' });
    expect(getPMSettings().ganttGranularity).toBe('month');
  });

  it('persists tasks to localStorage', () => {
    vi.useFakeTimers();
    initPMStore();
    addTask({ title: 'Persisted' });
    vi.advanceTimersByTime(300);
    const raw = localStorage.getItem('bismuth:pm-tasks');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].title).toBe('Persisted');
    expect(parsed[0].taskNumber).toBe(1);
    vi.useRealTimers();
  });

  it('rehydrates taskNumber counter from persisted tasks', () => {
    vi.useFakeTimers();
    initPMStore();
    addTask({ title: 'A' });
    addTask({ title: 'B' });
    vi.advanceTimersByTime(300);
    // Reset and re-init — counter should resume from max persisted taskNumber
    _resetPMStore();
    initPMStore();
    const task3 = addTask({ title: 'C' });
    expect(task3.taskNumber).toBe(3);
    vi.useRealTimers();
  });
});
