/**
 * Scheduling service — dependency resolution, cycle detection, smart rescheduling.
 * Operates on in-memory task arrays; does not perform I/O.
 */
import type { PMTask, Recurrence, RecurrenceInterval } from '../types';

// ─── Dependency graph ────────────────────────────────────────────────────────

export interface DepEdge {
  from: string;
  to: string;
}

export function buildDepGraph(tasks: PMTask[]): DepEdge[] {
  const edges: DepEdge[] = [];
  for (const task of tasks) {
    for (const dep of task.dependencies) {
      edges.push({ from: dep, to: task.id });
    }
  }
  return edges;
}

// ─── Cycle detection (DFS-based) ─────────────────────────────────────────────

export function hasCycle(tasks: PMTask[]): boolean {
  const adj = new Map<string, string[]>();
  for (const t of tasks) {
    if (!adj.has(t.id)) adj.set(t.id, []);
    for (const dep of t.dependencies) {
      if (!adj.has(dep)) adj.set(dep, []);
      adj.get(dep)!.push(t.id);
    }
  }

  const visited = new Set<string>();
  const stack = new Set<string>();

  function dfs(node: string): boolean {
    if (stack.has(node)) return true;
    if (visited.has(node)) return false;
    visited.add(node);
    stack.add(node);
    for (const neighbor of adj.get(node) ?? []) {
      if (dfs(neighbor)) return true;
    }
    stack.delete(node);
    return false;
  }

  for (const id of adj.keys()) {
    if (dfs(id)) return true;
  }
  return false;
}

/** Check if adding a dependency would create a cycle */
export function wouldCreateCycle(tasks: PMTask[], taskId: string, newDepId: string): boolean {
  const virtualTasks = tasks.map((t) =>
    t.id === taskId ? { ...t, dependencies: [...t.dependencies, newDepId] } : t
  );
  return hasCycle(virtualTasks);
}

// ─── Topological sort ────────────────────────────────────────────────────────

export function topologicalSort(tasks: PMTask[]): PMTask[] {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  for (const t of tasks) {
    inDegree.set(t.id, 0);
    adj.set(t.id, []);
  }
  for (const t of tasks) {
    for (const dep of t.dependencies) {
      if (adj.has(dep)) {
        adj.get(dep)!.push(t.id);
        inDegree.set(t.id, (inDegree.get(t.id) ?? 0) + 1);
      }
    }
  }

  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  const result: PMTask[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    const task = byId.get(id);
    if (task) result.push(task);
    for (const neighbor of adj.get(id) ?? []) {
      const newDeg = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) queue.push(neighbor);
    }
  }
  return result;
}

// ─── Smart scheduling ────────────────────────────────────────────────────────

function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function diffDays(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

/** Duration of a task in days (default 1 if not set) */
export function taskDuration(task: PMTask): number {
  if (task.startDate && task.dueDate) {
    return Math.max(1, diffDays(task.startDate, task.dueDate));
  }
  return 1;
}

/**
 * Auto-schedule dependents when a blocker's dates change.
 * Returns updated task list; does not mutate input.
 */
export function autoSchedule(tasks: PMTask[], changedId: string): PMTask[] {
  const byId = new Map(tasks.map((t) => [t.id, { ...t }]));
  const changed = byId.get(changedId);
  if (!changed?.dueDate) return tasks;

  const sorted = topologicalSort(tasks);
  for (const task of sorted) {
    if (task.id === changedId) continue;
    const deps = task.dependencies.filter((d) => byId.has(d));
    if (deps.length === 0) continue;

    const latestBlockerEnd = deps.reduce((latest, depId) => {
      const dep = byId.get(depId)!;
      const end = dep.dueDate ?? dep.startDate;
      if (!end) return latest;
      return !latest || end > latest ? end : latest;
    }, '' as string);

    if (!latestBlockerEnd) continue;

    const current = byId.get(task.id)!;
    const dur = taskDuration(current);
    const newStart = addDays(latestBlockerEnd, 1);

    if (!current.startDate || newStart > current.startDate) {
      current.startDate = newStart;
      current.dueDate = addDays(newStart, dur);
      byId.set(task.id, current);
    }
  }

  return tasks.map((t) => byId.get(t.id) ?? t);
}

// ─── Recurrence ──────────────────────────────────────────────────────────────

function addInterval(date: string, interval: RecurrenceInterval): string {
  const d = new Date(date);
  switch (interval) {
    case 'daily':
      d.setDate(d.getDate() + 1);
      break;
    case 'weekly':
      d.setDate(d.getDate() + 7);
      break;
    case 'monthly':
      d.setMonth(d.getMonth() + 1);
      break;
    case 'yearly':
      d.setFullYear(d.getFullYear() + 1);
      break;
  }
  return d.toISOString().slice(0, 10);
}

/** Compute next occurrence date; returns null if past endDate */
export function nextOccurrence(baseDate: string, recurrence: Recurrence): string | null {
  const next = addInterval(baseDate, recurrence.interval);
  if (recurrence.endDate && next > recurrence.endDate) return null;
  return next;
}

// ─── Milestone detection ─────────────────────────────────────────────────────

export function isMilestone(task: PMTask): boolean {
  return task.type === 'milestone' || (task.startDate === task.dueDate && task.dueDate !== null);
}
