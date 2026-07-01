/**
 * Time tracking utilities — estimates, logging, progress calculation.
 * Pure functions; no I/O or side effects.
 */
import type { PMTask, TimeLog } from '../types';

// ─── Time log helpers ────────────────────────────────────────────────────────

export function totalLoggedHours(task: PMTask): number {
  return task.timeLogs.reduce((sum, log) => sum + log.hours, 0);
}

export function logTime(task: PMTask, hours: number, note?: string): PMTask {
  const entry: TimeLog = {
    date: new Date().toISOString().slice(0, 10),
    hours,
    note,
  };
  return {
    ...task,
    timeLogs: [...task.timeLogs, entry],
    updatedAt: new Date().toISOString(),
  };
}

// ─── Progress helpers ────────────────────────────────────────────────────────

/** Calculate progress from logged vs estimated time (0-100) */
export function timeBasedProgress(task: PMTask): number {
  if (!task.timeEstimate || task.timeEstimate <= 0) return 0;
  const logged = totalLoggedHours(task);
  return Math.min(100, Math.round((logged / task.timeEstimate) * 100));
}

/** Set progress value (clamped 0-100) */
export function setProgress(task: PMTask, progress: number): PMTask {
  return {
    ...task,
    progress: Math.max(0, Math.min(100, progress)),
    updatedAt: new Date().toISOString(),
  };
}

// ─── Due date helpers ────────────────────────────────────────────────────────

export function isOverdue(task: PMTask): boolean {
  if (!task.dueDate || task.status === 'done' || task.status === 'cancelled') return false;
  return new Date(task.dueDate) < new Date();
}

export function isDueSoon(task: PMTask, leadDays: number): boolean {
  if (!task.dueDate || task.status === 'done' || task.status === 'cancelled') return false;
  const due = new Date(task.dueDate);
  const now = new Date();
  const diff = (due.getTime() - now.getTime()) / 86400000;
  return diff >= 0 && diff <= leadDays;
}

export function daysUntilDue(task: PMTask): number | null {
  if (!task.dueDate) return null;
  return Math.round((new Date(task.dueDate).getTime() - Date.now()) / 86400000);
}

// ─── Subtask progress ────────────────────────────────────────────────────────

/** Aggregate progress from subtasks */
export function subtaskProgress(tasks: PMTask[], parentId: string): number {
  const children = tasks.filter((t) => t.parentId === parentId);
  if (children.length === 0) return 0;
  const total = children.reduce((sum, t) => sum + t.progress, 0);
  return Math.round(total / children.length);
}

/** Count subtasks by status */
export function subtaskCounts(tasks: PMTask[], parentId: string): Record<string, number> {
  const children = tasks.filter((t) => t.parentId === parentId);
  const counts: Record<string, number> = {};
  for (const child of children) {
    counts[child.status] = (counts[child.status] ?? 0) + 1;
  }
  return counts;
}

// ─── Formatting ──────────────────────────────────────────────────────────────

export function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatDate(date: string | null): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateShort(date: string | null): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
