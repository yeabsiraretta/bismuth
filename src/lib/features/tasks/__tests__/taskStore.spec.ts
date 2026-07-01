/**
 * Task store tests — loading, status transitions, and query filtering.
 * Spec 021 T016 — stored at feature module path per project conventions.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';

vi.mock('@tauri-apps/api/core');
vi.mock('@tauri-apps/api/event');
vi.mock('../services/tasks', () => ({
  getAllTasks: vi.fn(),
  updateTaskStatus: vi.fn(),
}));
vi.mock('@/utils/logger', () => ({
  log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock('@/features/gamify', () => ({
  recordTaskCompleted: vi.fn(),
}));

const mockStorage: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: vi.fn((key: string) => mockStorage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    mockStorage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockStorage[key];
  }),
});

import {
  tasks,
  taskFilter,
  tasksLoading,
  filteredTasks,
  taskStats,
  refreshTasks,
  toggleTask,
} from '../stores/tasks';
import * as taskService from '../services/tasks';
import type { Task } from '@/types/data/task';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    text: 'Default task',
    status: 'open',
    status_symbol: '[ ]',
    status_type: 'TODO',
    priority: 'medium',
    due_date: null,
    created_date: null,
    start_date: null,
    scheduled_date: null,
    done_date: null,
    cancelled_date: null,
    recurrence: null,
    id: null,
    depends_on: [],
    tags: [],
    line: 1,
    source_path: '/vault/note.md',
    project: null,
    heading: null,
    on_completion: null,
    ...overrides,
  };
}

describe('taskStore', () => {
  beforeEach(() => {
    tasks.set([]);
    taskFilter.set({});
    tasksLoading.set(false);
    vi.clearAllMocks();
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  });

  // ---------------------------------------------------------------------------
  // Task list loading
  // ---------------------------------------------------------------------------

  describe('task list loading', () => {
    it('starts with empty task list', () => {
      expect(get(tasks)).toHaveLength(0);
    });

    it('refreshTasks populates the store from service', async () => {
      const t1 = makeTask({ text: 'Alpha', status: 'open' });
      const t2 = makeTask({ text: 'Beta', status: 'done', source_path: '/vault/b.md', line: 2 });
      vi.mocked(taskService.getAllTasks).mockResolvedValue([t1, t2]);

      await refreshTasks();

      expect(get(tasks)).toHaveLength(2);
      expect(get(tasks)[0].text).toBe('Alpha');
      expect(get(tasks)[1].text).toBe('Beta');
    });

    it('sets loading true during fetch, then false when done', async () => {
      let loadingDuring = false;
      vi.mocked(taskService.getAllTasks).mockImplementation(async () => {
        loadingDuring = get(tasksLoading);
        return [];
      });

      await refreshTasks();

      expect(loadingDuring).toBe(true);
      expect(get(tasksLoading)).toBe(false);
    });

    it('leaves loading false and tasks empty on service error', async () => {
      vi.mocked(taskService.getAllTasks).mockRejectedValue(new Error('network error'));

      await refreshTasks();

      expect(get(tasksLoading)).toBe(false);
      expect(get(tasks)).toHaveLength(0);
    });

    it('replaces previous tasks on subsequent refresh', async () => {
      tasks.set([makeTask({ text: 'Stale' })]);
      vi.mocked(taskService.getAllTasks).mockResolvedValue([makeTask({ text: 'Fresh' })]);

      await refreshTasks();

      const result = get(tasks);
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Fresh');
    });
  });

  // ---------------------------------------------------------------------------
  // Status transitions (pending → done and back)
  // ---------------------------------------------------------------------------

  describe('status transitions', () => {
    it('toggleTask changes open to done optimistically', async () => {
      const task = makeTask({ text: 'Pending', status: 'open' });
      tasks.set([task]);
      vi.mocked(taskService.updateTaskStatus).mockResolvedValue(undefined);

      await toggleTask(task);

      expect(get(tasks)[0].status).toBe('done');
    });

    it('toggleTask changes done back to open', async () => {
      const task = makeTask({
        text: 'Done task',
        status: 'done',
        status_symbol: '[x]',
        status_type: 'DONE',
      });
      tasks.set([task]);
      vi.mocked(taskService.updateTaskStatus).mockResolvedValue(undefined);

      await toggleTask(task);

      expect(get(tasks)[0].status).toBe('open');
    });

    it('toggleTask invokes updateTaskStatus with correct status arg', async () => {
      const task = makeTask({ source_path: '/v/n.md', line: 3, status: 'open' });
      tasks.set([task]);
      vi.mocked(taskService.updateTaskStatus).mockResolvedValue(undefined);

      await toggleTask(task);

      expect(taskService.updateTaskStatus).toHaveBeenCalledWith('/v/n.md', 3, 'done');
    });

    it('toggleTask reverts via refreshTasks on service error', async () => {
      const task = makeTask({ text: 'Flaky', status: 'open' });
      tasks.set([task]);
      vi.mocked(taskService.updateTaskStatus).mockRejectedValue(new Error('timeout'));
      vi.mocked(taskService.getAllTasks).mockResolvedValue([task]);

      await toggleTask(task);

      expect(taskService.getAllTasks).toHaveBeenCalled();
    });

    it('taskStats reflects correct counts after toggle', async () => {
      const open1 = makeTask({ text: 'A', status: 'open' });
      const open2 = makeTask({ text: 'B', status: 'open', line: 2 });
      tasks.set([open1, open2]);
      vi.mocked(taskService.updateTaskStatus).mockResolvedValue(undefined);

      await toggleTask(open1);

      const stats = get(taskStats);
      expect(stats.open).toBe(1);
      expect(stats.done).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Query filtering
  // ---------------------------------------------------------------------------

  describe('query filtering', () => {
    const taskOpen = makeTask({
      text: 'Buy groceries',
      status: 'open',
      tags: ['shopping'],
      project: 'home',
      due_date: '2026-07-01',
    });
    const taskDone = makeTask({
      text: 'Write report',
      status: 'done',
      status_symbol: '[x]',
      status_type: 'DONE',
      priority: 'high',
      tags: ['work'],
      project: 'bismuth',
      line: 2,
    });
    const taskCancelled = makeTask({
      text: 'Old todo',
      status: 'cancelled',
      tags: [],
      line: 3,
      due_date: '2026-06-01',
    });

    beforeEach(() => {
      tasks.set([taskOpen, taskDone, taskCancelled]);
    });

    it('no filter returns all tasks', () => {
      taskFilter.set({});
      expect(get(filteredTasks)).toHaveLength(3);
    });

    it('filter by status=open returns only open tasks', () => {
      taskFilter.set({ status: 'open' });
      const result = get(filteredTasks);
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Buy groceries');
    });

    it('filter by status=done returns only done tasks', () => {
      taskFilter.set({ status: 'done' });
      const result = get(filteredTasks);
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Write report');
    });

    it('filter by tag returns matching tasks', () => {
      taskFilter.set({ tag: 'shopping' });
      const result = get(filteredTasks);
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Buy groceries');
    });

    it('filter by tag with no match returns empty list', () => {
      taskFilter.set({ tag: 'nonexistent' });
      expect(get(filteredTasks)).toHaveLength(0);
    });

    it('filter by priority=high returns only high-priority tasks', () => {
      taskFilter.set({ priority: 'high' });
      const result = get(filteredTasks);
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Write report');
    });

    it('filter by project returns tasks in that project', () => {
      taskFilter.set({ project: 'bismuth' });
      const result = get(filteredTasks);
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Write report');
    });

    it('filter by search text is case-insensitive', () => {
      taskFilter.set({ search: 'REPORT' });
      const result = get(filteredTasks);
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Write report');
    });

    it('combined status + tag filter narrows results correctly', () => {
      taskFilter.set({ status: 'open', tag: 'shopping' });
      expect(get(filteredTasks)).toHaveLength(1);
    });

    it('combined status + tag with no intersection returns empty', () => {
      taskFilter.set({ status: 'done', tag: 'shopping' });
      expect(get(filteredTasks)).toHaveLength(0);
    });

    it('taskStats total matches full tasks list regardless of filter', () => {
      taskFilter.set({ status: 'open' });
      const stats = get(taskStats);
      expect(stats.total).toBe(3);
    });
  });
});
