import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

import {
  getAllTasks,
  getTasksFiltered,
  getTaskProjects,
  updateTaskStatus,
  executeTaskQuery,
} from '../services/tasks';
import { invoke } from '@tauri-apps/api/core';

describe('tasks service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllTasks', () => {
    it('calls invoke with correct command', async () => {
      vi.mocked(invoke).mockResolvedValue([]);
      const result = await getAllTasks();
      expect(invoke).toHaveBeenCalledWith('get_all_tasks');
      expect(result).toEqual([]);
    });

    it('throws on failure', async () => {
      vi.mocked(invoke).mockRejectedValue('db error');
      await expect(getAllTasks()).rejects.toThrow('Failed to get tasks');
    });
  });

  describe('getTasksFiltered', () => {
    it('calls invoke with filter', async () => {
      vi.mocked(invoke).mockResolvedValue([]);
      await getTasksFiltered({ status: 'open' });
      expect(invoke).toHaveBeenCalledWith('get_tasks_filtered', {
        filter: { status: 'open' },
        sort: undefined,
      });
    });

    it('passes sort parameter', async () => {
      vi.mocked(invoke).mockResolvedValue([]);
      await getTasksFiltered({ priority: 'high' }, 'duedate');
      expect(invoke).toHaveBeenCalledWith('get_tasks_filtered', {
        filter: { priority: 'high' },
        sort: 'duedate',
      });
    });
  });

  describe('getTaskProjects', () => {
    it('returns project names', async () => {
      vi.mocked(invoke).mockResolvedValue(['bismuth', 'personal']);
      const result = await getTaskProjects();
      expect(invoke).toHaveBeenCalledWith('get_task_projects');
      expect(result).toEqual(['bismuth', 'personal']);
    });
  });

  describe('updateTaskStatus', () => {
    it('calls invoke with sourcePath, line, and newStatus', async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);
      await updateTaskStatus('/vault/todo.md', 5, 'done');
      expect(invoke).toHaveBeenCalledWith('update_task_status', {
        sourcePath: '/vault/todo.md',
        line: 5,
        newStatus: 'done',
      });
    });

    it('throws on failure', async () => {
      vi.mocked(invoke).mockRejectedValue('write error');
      await expect(updateTaskStatus('/x', 1, 'open')).rejects.toThrow(
        'Failed to update task status'
      );
    });
  });

  describe('executeTaskQuery', () => {
    it('calls invoke with query and null contextPath', async () => {
      const mockResult = { groups: [], total_count: 0, display: {}, explain: null };
      vi.mocked(invoke).mockResolvedValue(mockResult);
      const result = await executeTaskQuery('status:open');
      expect(invoke).toHaveBeenCalledWith('execute_task_query', {
        query: 'status:open',
        contextPath: null,
      });
      expect(result).toEqual(mockResult);
    });

    it('passes contextPath when provided', async () => {
      vi.mocked(invoke).mockResolvedValue({
        groups: [],
        total_count: 0,
        display: {},
        explain: null,
      });
      await executeTaskQuery('priority:high', '/vault/project.md');
      expect(invoke).toHaveBeenCalledWith('execute_task_query', {
        query: 'priority:high',
        contextPath: '/vault/project.md',
      });
    });

    it('throws on failure', async () => {
      vi.mocked(invoke).mockRejectedValue('parse error');
      await expect(executeTaskQuery('bad query')).rejects.toThrow('Failed to execute task query');
    });
  });
});
