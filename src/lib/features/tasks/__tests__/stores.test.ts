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
  setItem: vi.fn((key: string, value: string) => { mockStorage[key] = value; }),
  removeItem: vi.fn((key: string) => { delete mockStorage[key]; }),
});

import {
  tasks,
  taskFilter,
  tasksLoading,
  filteredTasks,
  taskStats,
  taskProjects,
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

const mockTask = makeTask({
  text: 'Buy milk',
  tags: ['grocery'],
  project: 'personal',
  source_path: '/vault/todo.md',
  line: 5,
});

const mockTask2 = makeTask({
  text: 'Write tests',
  status: 'done',
  status_symbol: '[x]',
  status_type: 'DONE',
  priority: 'high',
  tags: ['dev'],
  project: 'bismuth',
  source_path: '/vault/dev.md',
  line: 10,
});

describe('tasks store', () => {
  beforeEach(() => {
    tasks.set([]);
    taskFilter.set({});
    tasksLoading.set(false);
    vi.clearAllMocks();
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  });

  describe('filteredTasks', () => {
    it('returns all tasks when no filter is set', () => {
      tasks.set([mockTask, mockTask2]);
      taskFilter.set({});
      expect(get(filteredTasks)).toHaveLength(2);
    });

    it('filters by status', () => {
      tasks.set([mockTask, mockTask2]);
      taskFilter.set({ status: 'open' });
      const result = get(filteredTasks);
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Buy milk');
    });

    it('filters by priority', () => {
      tasks.set([mockTask, mockTask2]);
      taskFilter.set({ priority: 'high' });
      const result = get(filteredTasks);
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Write tests');
    });

    it('filters by project', () => {
      tasks.set([mockTask, mockTask2]);
      taskFilter.set({ project: 'bismuth' });
      expect(get(filteredTasks)).toHaveLength(1);
    });

    it('filters by tag', () => {
      tasks.set([mockTask, mockTask2]);
      taskFilter.set({ tag: 'grocery' });
      expect(get(filteredTasks)).toHaveLength(1);
    });

    it('filters by search text', () => {
      tasks.set([mockTask, mockTask2]);
      taskFilter.set({ search: 'milk' });
      expect(get(filteredTasks)).toHaveLength(1);
    });

    it('search is case-insensitive', () => {
      tasks.set([mockTask, mockTask2]);
      taskFilter.set({ search: 'MILK' });
      expect(get(filteredTasks)).toHaveLength(1);
    });

    it('combines multiple filters', () => {
      tasks.set([mockTask, mockTask2]);
      taskFilter.set({ status: 'open', project: 'personal' });
      expect(get(filteredTasks)).toHaveLength(1);
    });
  });

  describe('taskStats', () => {
    it('computes correct counts', () => {
      const cancelled = makeTask({ status: 'cancelled', text: 'Nope' });
      tasks.set([mockTask, mockTask2, cancelled]);
      const stats = get(taskStats);
      expect(stats.total).toBe(3);
      expect(stats.open).toBe(1);
      expect(stats.done).toBe(1);
      expect(stats.cancelled).toBe(1);
    });

    it('returns zeros for empty tasks', () => {
      const stats = get(taskStats);
      expect(stats.total).toBe(0);
      expect(stats.open).toBe(0);
    });
  });

  describe('taskProjects', () => {
    it('extracts unique sorted projects', () => {
      tasks.set([mockTask, mockTask2]);
      const projects = get(taskProjects);
      expect(projects).toEqual(['bismuth', 'personal']);
    });

    it('returns empty array when no tasks', () => {
      expect(get(taskProjects)).toEqual([]);
    });
  });

  describe('refreshTasks', () => {
    it('calls getAllTasks and sets result', async () => {
      vi.mocked(taskService.getAllTasks).mockResolvedValue([mockTask]);
      await refreshTasks();
      expect(get(tasks)).toHaveLength(1);
      expect(get(tasksLoading)).toBe(false);
    });

    it('sets loading true during fetch', async () => {
      let capturedLoading = false;
      vi.mocked(taskService.getAllTasks).mockImplementation(async () => {
        capturedLoading = get(tasksLoading);
        return [];
      });
      await refreshTasks();
      expect(capturedLoading).toBe(true);
      expect(get(tasksLoading)).toBe(false);
    });

    it('handles errors gracefully', async () => {
      vi.mocked(taskService.getAllTasks).mockRejectedValue(new Error('fail'));
      await refreshTasks();
      expect(get(tasksLoading)).toBe(false);
      expect(get(tasks)).toHaveLength(0);
    });
  });

  describe('toggleTask', () => {
    it('toggles open to done', async () => {
      tasks.set([mockTask]);
      vi.mocked(taskService.updateTaskStatus).mockResolvedValue(undefined);
      await toggleTask(mockTask);
      const result = get(tasks);
      expect(result[0].status).toBe('done');
    });

    it('toggles done to open', async () => {
      tasks.set([mockTask2]);
      vi.mocked(taskService.updateTaskStatus).mockResolvedValue(undefined);
      await toggleTask(mockTask2);
      expect(get(tasks)[0].status).toBe('open');
    });

    it('calls updateTaskStatus with correct args', async () => {
      tasks.set([mockTask]);
      vi.mocked(taskService.updateTaskStatus).mockResolvedValue(undefined);
      await toggleTask(mockTask);
      expect(taskService.updateTaskStatus).toHaveBeenCalledWith(
        mockTask.source_path,
        mockTask.line,
        'done'
      );
    });

    it('refreshes tasks on error', async () => {
      tasks.set([mockTask]);
      vi.mocked(taskService.updateTaskStatus).mockRejectedValue(new Error('fail'));
      vi.mocked(taskService.getAllTasks).mockResolvedValue([mockTask]);
      await toggleTask(mockTask);
      expect(taskService.getAllTasks).toHaveBeenCalled();
    });
  });
});
