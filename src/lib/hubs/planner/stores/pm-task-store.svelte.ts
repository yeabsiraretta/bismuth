/**
 * Project Manager task store — reactive Svelte 5 $state store.
 * Persists tasks and settings to localStorage.
 */

import { PM_SETTINGS_KEY, PM_TASKS_KEY } from '@/constants/storage-keys';
import { awardTaskCompleteXp } from '@/hubs/core/stores/gamification-store.svelte';
import type {
  PMPriority,
  PMSettings,
  PMStatus,
  PMTask,
  TaskQuery,
  TaskSortField,
} from '@/hubs/planner/types/pm-types';
import { DEFAULT_PM_SETTINGS } from '@/hubs/planner/types/pm-types';

// ── State ────────────────────────────────────────────────────────

let tasks = $state<PMTask[]>([]);
let settings = $state<PMSettings>({ ...DEFAULT_PM_SETTINGS });
let initialized = false;

// ── Persistence ──────────────────────────────────────────────────

function loadTasks(): PMTask[] {
  try {
    const raw = localStorage.getItem(PM_TASKS_KEY);
    return raw ? (JSON.parse(raw) as PMTask[]) : [];
  } catch {
    return [];
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function saveTasks(): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      localStorage.setItem(PM_TASKS_KEY, JSON.stringify(tasks));
    } catch {
      /* quota */
    }
  }, 200);
}

function loadSettings(): PMSettings {
  try {
    const raw = localStorage.getItem(PM_SETTINGS_KEY);
    return raw
      ? { ...DEFAULT_PM_SETTINGS, ...(JSON.parse(raw) as Partial<PMSettings>) }
      : { ...DEFAULT_PM_SETTINGS };
  } catch {
    return { ...DEFAULT_PM_SETTINGS };
  }
}

function saveSettings(): void {
  localStorage.setItem(PM_SETTINGS_KEY, JSON.stringify(settings));
}

// ── Init ─────────────────────────────────────────────────────────

export function initPMStore(): void {
  if (initialized) return;
  tasks = loadTasks();
  settings = loadSettings();
  // Rehydrate taskNumber counter from persisted tasks
  const maxNum = tasks.reduce((max, t) => Math.max(max, t.taskNumber ?? 0), 0);
  taskNumberCounter = maxNum;
  initialized = true;
}

// ── Getters ──────────────────────────────────────────────────────

export function getPMTasks(): PMTask[] {
  return tasks;
}

export function getPMSettings(): PMSettings {
  return settings;
}

export function getFilteredTasks(opts?: {
  status?: PMStatus[];
  priority?: PMPriority[];
  project?: string;
  hideDone?: boolean;
}): PMTask[] {
  let result = tasks;
  if (opts?.status?.length) result = result.filter((t) => opts.status!.includes(t.status));
  if (opts?.priority?.length) result = result.filter((t) => opts.priority!.includes(t.priority));
  if (opts?.project) result = result.filter((t) => t.project === opts.project);
  if (opts?.hideDone)
    result = result.filter((t) => t.status !== 'done' && t.status !== 'cancelled');
  return result;
}

export function getTasksByStatus(): Record<PMStatus, PMTask[]> {
  const groups: Record<PMStatus, PMTask[]> = {
    todo: [],
    'in-progress': [],
    blocked: [],
    'in-review': [],
    done: [],
    cancelled: [],
  };
  for (const t of tasks) groups[t.status].push(t);
  return groups;
}

export function getTasksByProject(): Record<string, PMTask[]> {
  const groups: Record<string, PMTask[]> = {};
  for (const t of tasks) {
    const key = t.project || '(none)';
    (groups[key] ??= []).push(t);
  }
  return groups;
}

// ── Mutations ────────────────────────────────────────────────────

let idCounter = 0;
let taskNumberCounter = 0;

function generateId(): string {
  return `pm-${Date.now()}-${++idCounter}`;
}

function nextTaskNumber(): number {
  return ++taskNumberCounter;
}

export function formatTaskId(taskNumber: number): string {
  return `TASK-${String(taskNumber).padStart(3, '0')}`;
}

export function getTaskByNumber(taskNumber: number): PMTask | undefined {
  return tasks.find((t) => t.taskNumber === taskNumber);
}

export function addTask(partial: Partial<PMTask> & { title: string }): PMTask {
  const now = new Date().toISOString();
  const task: PMTask = {
    id: generateId(),
    taskNumber: partial.taskNumber ?? nextTaskNumber(),
    title: partial.title,
    description: partial.description ?? '',
    status: partial.status ?? 'todo',
    priority: partial.priority ?? 'medium',
    type: partial.type ?? 'task',
    project: partial.project ?? '',
    notePath: partial.notePath ?? null,
    startDate: partial.startDate ?? null,
    dueDate: partial.dueDate ?? null,
    scheduledDate: partial.scheduledDate ?? null,
    doneDate: partial.doneDate ?? null,
    recurrence: partial.recurrence ?? null,
    progress: partial.progress ?? 0,
    parentId: partial.parentId ?? null,
    subtaskIds: partial.subtaskIds ?? [],
    dependencies: partial.dependencies ?? [],
    tags: partial.tags ?? [],
    createdAt: now,
    updatedAt: now,
  };
  tasks = [...tasks, task];
  saveTasks();
  return task;
}

export function updateTask(id: string, updates: Partial<Omit<PMTask, 'id' | 'createdAt'>>): void {
  tasks = tasks.map((t) =>
    t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
  );
  saveTasks();
}

export function removeTask(id: string): void {
  const target = tasks.find((t) => t.id === id);
  if (!target) return;
  // Remove from parent's subtaskIds
  if (target.parentId) {
    const parent = tasks.find((t) => t.id === target.parentId);
    if (parent) {
      parent.subtaskIds = parent.subtaskIds.filter((sid) => sid !== id);
    }
  }
  // Remove subtasks recursively
  const subtaskIds = [...target.subtaskIds];
  tasks = tasks.filter((t) => t.id !== id && !subtaskIds.includes(t.id));
  saveTasks();
}

export function toggleDone(id: string): void {
  const t = tasks.find((x) => x.id === id);
  if (!t) return;
  const now = new Date().toISOString();
  if (t.status === 'done') {
    updateTask(id, { status: 'todo', doneDate: null });
  } else {
    updateTask(id, { status: 'done', doneDate: now });
    awardTaskCompleteXp(t.title);
    if (t.recurrence) {
      advanceRecurrence(t);
    }
  }
}

function advanceRecurrence(task: PMTask): void {
  const rec = task.recurrence;
  if (!rec) return;
  const base = task.dueDate ?? task.scheduledDate ?? todayISOLocal();
  const next = computeNextDate(base, rec.frequency, rec.interval);
  if (rec.endDate && next > rec.endDate) return;
  addTask({
    title: task.title,
    description: task.description,
    priority: task.priority,
    type: task.type,
    project: task.project,
    notePath: task.notePath,
    dueDate: task.dueDate ? next : null,
    scheduledDate: task.scheduledDate ? next : null,
    recurrence: { ...rec },
    tags: [...task.tags],
    parentId: task.parentId,
  });
}

function todayISOLocal(): string {
  return new Date().toISOString().slice(0, 10);
}

function computeNextDate(base: string, freq: string, interval: number): string {
  const d = new Date(base);
  if (freq === 'daily') d.setDate(d.getDate() + interval);
  else if (freq === 'weekly') d.setDate(d.getDate() + 7 * interval);
  else if (freq === 'monthly') d.setMonth(d.getMonth() + interval);
  else if (freq === 'yearly') d.setFullYear(d.getFullYear() + interval);
  return d.toISOString().slice(0, 10);
}

function queryTasks(q: TaskQuery): PMTask[] {
  let result = tasks;
  if (q.status?.length) result = result.filter((t) => q.status!.includes(t.status));
  if (q.priority?.length) result = result.filter((t) => q.priority!.includes(t.priority));
  if (q.project) result = result.filter((t) => t.project === q.project);
  if (q.tags?.length) result = result.filter((t) => q.tags!.some((tag) => t.tags.includes(tag)));
  if (q.search) {
    const s = q.search.toLowerCase();
    result = result.filter(
      (t) => t.title.toLowerCase().includes(s) || t.description.toLowerCase().includes(s)
    );
  }
  if (q.dueBefore) result = result.filter((t) => t.dueDate !== null && t.dueDate <= q.dueBefore!);
  if (q.dueAfter) result = result.filter((t) => t.dueDate !== null && t.dueDate >= q.dueAfter!);
  if (q.doneBefore)
    result = result.filter((t) => t.doneDate !== null && t.doneDate <= q.doneBefore!);
  if (q.doneAfter) result = result.filter((t) => t.doneDate !== null && t.doneDate >= q.doneAfter!);
  if (q.hideDone) result = result.filter((t) => t.status !== 'done' && t.status !== 'cancelled');
  if (q.notePath) result = result.filter((t) => t.notePath === q.notePath);
  if (q.sortBy) result = sortTasks(result, q.sortBy, q.sortDir ?? 'asc');
  return result;
}

const PRIORITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
const STATUS_ORDER: Record<string, number> = {
  todo: 0,
  'in-progress': 1,
  blocked: 2,
  'in-review': 3,
  done: 4,
  cancelled: 5,
};

function sortTasks(
  list: PMTask[],
  field: TaskSortField,
  dir: 'asc' | 'desc' = 'asc'
): PMTask[] {
  const sorted = [...list].sort((a, b) => {
    let cmp = 0;
    if (field === 'title') cmp = a.title.localeCompare(b.title);
    else if (field === 'dueDate') cmp = (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999');
    else if (field === 'priority')
      cmp = (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99);
    else if (field === 'status')
      cmp = (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99);
    else if (field === 'createdAt') cmp = a.createdAt.localeCompare(b.createdAt);
    else if (field === 'doneDate') cmp = (a.doneDate ?? '9999').localeCompare(b.doneDate ?? '9999');
    else if (field === 'updatedAt') cmp = a.updatedAt.localeCompare(b.updatedAt);
    return cmp;
  });
  return dir === 'desc' ? sorted.reverse() : sorted;
}

export function getOverdueTasks(): PMTask[] {
  const today = todayISOLocal();
  return tasks.filter(
    (t) =>
      t.dueDate !== null && t.dueDate < today && t.status !== 'done' && t.status !== 'cancelled'
  );
}

export function getDueTodayTasks(): PMTask[] {
  const today = todayISOLocal();
  return tasks.filter(
    (t) => t.dueDate === today && t.status !== 'done' && t.status !== 'cancelled'
  );
}

export function getUpcomingTasks(days: number = 7): PMTask[] {
  const today = todayISOLocal();
  const d = new Date();
  d.setDate(d.getDate() + days);
  const cutoff = d.toISOString().slice(0, 10);
  return tasks.filter(
    (t) =>
      t.dueDate !== null &&
      t.dueDate > today &&
      t.dueDate <= cutoff &&
      t.status !== 'done' &&
      t.status !== 'cancelled'
  );
}

export function updatePMSettings(updates: Partial<PMSettings>): void {
  settings = { ...settings, ...updates };
  saveSettings();
}

/** @internal — test-only reset */
export function _resetPMStore(): void {
  tasks = [];
  settings = { ...DEFAULT_PM_SETTINGS };
  initialized = false;
  taskNumberCounter = 0;
}
