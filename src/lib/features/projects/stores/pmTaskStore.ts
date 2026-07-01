/**
 * PM Task store — task CRUD, filtering, sorting, bulk operations.
 * Works within a single active project context.
 */
import { writable, derived, get } from 'svelte/store';
import { log } from '@/utils/logger';
import type { PMTask, PMTaskFilter, PMTaskSort, PMStatus, PMPriority } from '../types';
import { readTaskFile, writeTaskFile, deleteTaskFile, generateId } from '../services/projectIO';
import { autoSchedule, wouldCreateCycle } from '../services/scheduling';
import { activeProject, pmSettings } from './projectStore';

// ─── Stores ──────────────────────────────────────────────────────────────────

export const pmTasks = writable<PMTask[]>([]);
export const pmTaskFilter = writable<PMTaskFilter>({});
export const pmTaskSort = writable<PMTaskSort>({ field: 'priority', direction: 'asc' });
export const pmTasksLoading = writable(false);
export const selectedTaskIds = writable<Set<string>>(new Set());

// ─── Sort helpers ────────────────────────────────────────────────────────────

const STATUS_ORDER: Record<PMStatus, number> = {
  'blocked': 0, 'in-progress': 1, 'todo': 2, 'in-review': 3, 'done': 4, 'cancelled': 5,
};
const PRIORITY_ORDER: Record<PMPriority, number> = {
  'critical': 0, 'high': 1, 'medium': 2, 'low': 3,
};

function compareField(a: PMTask, b: PMTask, field: PMTaskSort['field']): number {
  switch (field) {
    case 'title': return a.title.localeCompare(b.title);
    case 'status': return (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
    case 'priority': return (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9);
    case 'dueDate': return (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999');
    case 'progress': return a.progress - b.progress;
    case 'assignee': return (a.assignees[0] ?? '').localeCompare(b.assignees[0] ?? '');
    default: return 0;
  }
}

// ─── Derived ─────────────────────────────────────────────────────────────────

export const filteredPMTasks = derived(
  [pmTasks, pmTaskFilter, pmTaskSort],
  ([$tasks, $filter, $sort]) => {
    let result = $tasks.filter(t => {
      if (!$filter.showArchived && t.archived) return false;
      if ($filter.status?.length && !$filter.status.includes(t.status)) return false;
      if ($filter.priority?.length && !$filter.priority.includes(t.priority)) return false;
      if ($filter.assignee?.length && !t.assignees.some(a => $filter.assignee!.includes(a))) return false;
      if ($filter.tag?.length && !t.tags.some(tag => $filter.tag!.includes(tag))) return false;
      if ($filter.type?.length && !$filter.type.includes(t.type)) return false;
      if ($filter.search) {
        const q = $filter.search.toLowerCase();
        if (!t.title.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) return false;
      }
      return true;
    });

    result.sort((a, b) => {
      const cmp = compareField(a, b, $sort.field);
      return $sort.direction === 'desc' ? -cmp : cmp;
    });

    return result;
  },
);

export const pmTaskStats = derived(pmTasks, ($tasks) => {
  const active = $tasks.filter(t => !t.archived);
  return {
    total: active.length,
    todo: active.filter(t => t.status === 'todo').length,
    inProgress: active.filter(t => t.status === 'in-progress').length,
    blocked: active.filter(t => t.status === 'blocked').length,
    inReview: active.filter(t => t.status === 'in-review').length,
    done: active.filter(t => t.status === 'done').length,
    cancelled: active.filter(t => t.status === 'cancelled').length,
    archived: $tasks.filter(t => t.archived).length,
  };
});

export const rootTasks = derived(pmTasks, ($tasks) =>
  $tasks.filter(t => !t.parentId && !t.archived),
);

// ─── Load tasks ──────────────────────────────────────────────────────────────

export async function loadProjectTasks(projectFolder: string): Promise<void> {
  pmTasksLoading.set(true);
  try {
    const { scanVault } = await import('@/services/vault/vault');
    const allNotes = await scanVault();
    const taskNotes = allNotes.filter(n =>
      n.path.startsWith(projectFolder) && n.frontmatter?.['pm-task'] === true,
    );

    const loaded: PMTask[] = [];
    for (const note of taskNotes) {
      const task = await readTaskFile(note.path);
      if (task) loaded.push(task);
    }
    pmTasks.set(loaded);
    log.info('Loaded PM tasks', { count: loaded.length, folder: projectFolder });
  } catch (error) {
    log.error('Failed to load PM tasks', error as Error);
  } finally {
    pmTasksLoading.set(false);
  }
}

// ─── CRUD ────────────────────────────────────────────────────────────────────

export async function createPMTask(title: string, overrides?: Partial<PMTask>): Promise<PMTask> {
  const project = get(activeProject);
  if (!project) throw new Error('No active project');

  const id = generateId();
  const now = new Date().toISOString();
  const slug = title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').toLowerCase();

  const task: PMTask = {
    id, path: `${project.folder}/${slug}.md`, title,
    description: '', type: 'task', status: 'todo', priority: 'medium',
    startDate: null, dueDate: null, progress: 0,
    timeEstimate: null, timeLogs: [], assignees: [], tags: [],
    parentId: null, subtaskIds: [], dependencies: [],
    recurrence: null, customFields: {}, archived: false,
    createdAt: now, updatedAt: now,
    ...overrides,
  };

  await writeTaskFile(task);
  pmTasks.update(list => [...list, task]);
  log.info('Created PM task', { id, title });
  return task;
}

export async function updatePMTask(updated: PMTask): Promise<void> {
  const settings = get(pmSettings);
  await writeTaskFile(updated);

  if (settings.autoSchedule) {
    const all = get(pmTasks).map(t => t.id === updated.id ? updated : t);
    const rescheduled = autoSchedule(all, updated.id);
    for (const t of rescheduled) {
      if (t.id !== updated.id) {
        const orig = all.find(o => o.id === t.id);
        if (orig && (orig.startDate !== t.startDate || orig.dueDate !== t.dueDate)) {
          await writeTaskFile(t);
        }
      }
    }
    pmTasks.set(rescheduled);
  } else {
    pmTasks.update(list => list.map(t => t.id === updated.id ? updated : t));
  }
}

export async function deletePMTask(id: string): Promise<void> {
  const list = get(pmTasks);
  const task = list.find(t => t.id === id);
  if (!task) return;
  await deleteTaskFile(task.path);
  pmTasks.update(l => l.filter(t => t.id !== id));
  log.info('Deleted PM task', { id });
}

// ─── Dependencies ────────────────────────────────────────────────────────────

export async function addDependency(taskId: string, depId: string): Promise<boolean> {
  const tasks = get(pmTasks);
  if (wouldCreateCycle(tasks, taskId, depId)) return false;
  const task = tasks.find(t => t.id === taskId);
  if (!task || task.dependencies.includes(depId)) return false;
  await updatePMTask({ ...task, dependencies: [...task.dependencies, depId] });
  return true;
}

export async function removeDependency(taskId: string, depId: string): Promise<void> {
  const tasks = get(pmTasks);
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;
  await updatePMTask({ ...task, dependencies: task.dependencies.filter(d => d !== depId) });
}

// ─── Bulk operations ─────────────────────────────────────────────────────────

export async function bulkSetStatus(ids: string[], status: PMStatus): Promise<void> {
  const tasks = get(pmTasks);
  for (const id of ids) {
    const task = tasks.find(t => t.id === id);
    if (task && task.status !== status) await updatePMTask({ ...task, status });
  }
  selectedTaskIds.set(new Set());
}

export async function bulkSetPriority(ids: string[], priority: PMPriority): Promise<void> {
  const tasks = get(pmTasks);
  for (const id of ids) {
    const task = tasks.find(t => t.id === id);
    if (task && task.priority !== priority) await updatePMTask({ ...task, priority });
  }
  selectedTaskIds.set(new Set());
}

export async function bulkArchive(ids: string[], archive: boolean): Promise<void> {
  const tasks = get(pmTasks);
  for (const id of ids) {
    const task = tasks.find(t => t.id === id);
    if (task && task.archived !== archive) await updatePMTask({ ...task, archived: archive });
  }
  selectedTaskIds.set(new Set());
}

export async function bulkDelete(ids: string[]): Promise<void> {
  for (const id of ids) await deletePMTask(id);
  selectedTaskIds.set(new Set());
}
