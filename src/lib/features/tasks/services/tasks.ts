import { invoke } from '@tauri-apps/api/core';
import type { Task, TaskFilter, TaskSort, TaskQueryResult } from '@/types/data/task';

/**
 * Gets all tasks from the vault.
 */
export async function getAllTasks(): Promise<Task[]> {
  try {
    return await invoke<Task[]>('get_all_tasks');
  } catch (error) {
    throw new Error(`Failed to get tasks: ${error}`);
  }
}

/**
 * Gets tasks matching the given filter and sort criteria.
 */
export async function getTasksFiltered(filter: TaskFilter, sort?: TaskSort): Promise<Task[]> {
  try {
    return await invoke<Task[]>('get_tasks_filtered', { filter, sort });
  } catch (error) {
    throw new Error(`Failed to get filtered tasks: ${error}`);
  }
}

/**
 * Gets distinct project names from tasks.
 */
export async function getTaskProjects(): Promise<string[]> {
  try {
    return await invoke<string[]>('get_task_projects');
  } catch (error) {
    throw new Error(`Failed to get task projects: ${error}`);
  }
}

/**
 * Updates the status of a task in its source file.
 */
export async function updateTaskStatus(
  sourcePath: string,
  line: number,
  newStatus: 'open' | 'done' | 'cancelled' | 'inprogress' | 'onhold'
): Promise<void> {
  try {
    await invoke('update_task_status', { sourcePath, line, newStatus });
  } catch (error) {
    throw new Error(`Failed to update task status: ${error}`);
  }
}

/**
 * Executes a task query DSL string against all vault tasks.
 */
export async function executeTaskQuery(
  query: string,
  contextPath?: string
): Promise<TaskQueryResult> {
  try {
    return await invoke<TaskQueryResult>('execute_task_query', {
      query,
      contextPath: contextPath ?? null,
    });
  } catch (error) {
    throw new Error(`Failed to execute task query: ${error}`);
  }
}
