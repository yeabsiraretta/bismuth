import { writable, derived } from 'svelte/store';
import type { Task, TaskFilter, TaskStatus } from '@/types/data/task';
import { getAllTasks, updateTaskStatus } from '../services/tasks';
import { log } from '@/utils/logger';

const STORAGE_KEY = 'bismuth-task-filter';

function loadFilter(): TaskFilter {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/** All tasks from the vault */
export const tasks = writable<Task[]>([]);

/** Current active filter */
export const taskFilter = writable<TaskFilter>(loadFilter());

/** Loading state */
export const tasksLoading = writable(false);

/** Derived: filtered tasks based on active filter */
export const filteredTasks = derived(
  [tasks, taskFilter],
  ([$tasks, $filter]) => {
    return $tasks.filter(task => {
      if ($filter.status && task.status !== $filter.status) return false;
      if ($filter.priority && task.priority !== $filter.priority) return false;
      if ($filter.project && task.project !== $filter.project) return false;
      if ($filter.tag && !task.tags.includes($filter.tag)) return false;
      if ($filter.search) {
        const lower = $filter.search.toLowerCase();
        if (!task.text.toLowerCase().includes(lower)) return false;
      }
      return true;
    });
  }
);

/** Derived: task counts by status */
export const taskStats = derived(tasks, ($tasks) => ({
  total: $tasks.length,
  open: $tasks.filter(t => t.status === 'open').length,
  done: $tasks.filter(t => t.status === 'done').length,
  inprogress: $tasks.filter(t => t.status === 'inprogress').length,
  onhold: $tasks.filter(t => t.status === 'onhold').length,
  cancelled: $tasks.filter(t => t.status === 'cancelled').length,
}));

/** Derived: distinct projects from tasks */
export const taskProjects = derived(tasks, ($tasks) => {
  const projects = new Set<string>();
  $tasks.forEach(t => { if (t.project) projects.add(t.project); });
  return [...projects].sort();
});

/** Fetch all tasks from the backend */
export async function refreshTasks(): Promise<void> {
  tasksLoading.set(true);
  try {
    const result = await getAllTasks();
    tasks.set(result);
  } catch (error) {
    log.error('Failed to refresh tasks', error);
  } finally {
    tasksLoading.set(false);
  }
}

const STATUS_CYCLE: TaskStatus[] = ['open', 'inprogress', 'done'];

/** Cycle a task's status: open -> inprogress -> done (or back to open from done/cancelled/onhold) */
export async function toggleTask(task: Task): Promise<void> {
  const idx = STATUS_CYCLE.indexOf(task.status);
  const newStatus: TaskStatus = idx >= 0 ? STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length] : 'open';
  try {
    await updateTaskStatus(task.source_path, task.line, newStatus);
    // Optimistic update
    tasks.update(all => all.map(t =>
      t.source_path === task.source_path && t.line === task.line
        ? { ...t, status: newStatus }
        : t
    ));
    // Award XP when completing a task
    if (newStatus === 'done') {
      const { recordTaskCompleted } = await import('@/features/gamify');
      recordTaskCompleted(task.text, task.priority);
    }
  } catch (error) {
    log.error('Failed to toggle task', error);
    await refreshTasks();
  }
}

/** Persist filter to localStorage when it changes */
taskFilter.subscribe(filter => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filter));
  } catch (e) { log.warn('Failed to persist task filter to localStorage', { error: String(e) }); }
});
