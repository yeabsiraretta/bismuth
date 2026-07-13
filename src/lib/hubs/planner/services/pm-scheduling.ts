/**
 * Gantt scheduling helpers — date math, column generation, bar positioning.
 * Pure functions, no side effects or IPC.
 */

import type { GanttGranularity, PMTask } from '@/hubs/planner/types/pm-types';

// ─── Date arithmetic ─────────────────────────────────────────────

export function diffDays(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

export function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Milestone detection ─────────────────────────────────────────

export function isMilestone(task: PMTask): boolean {
  return task.type === 'milestone' || (task.startDate === task.dueDate && task.dueDate !== null);
}

// ─── Column generation ──────────────────────────────────────────

export interface GanttColumn {
  label: string;
  left: number;
  width: number;
}

function getWeekNumber(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - start.getTime()) / 86_400_000 + start.getDay() + 1) / 7);
}

function daysInMonth(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

export function generateColumns(
  paddedMin: string,
  paddedMax: string,
  totalDays: number,
  granularity: GanttGranularity
): GanttColumn[] {
  const cols: GanttColumn[] = [];
  const d = new Date(paddedMin);
  const end = new Date(paddedMax);

  while (d <= end) {
    const start = d.toISOString().slice(0, 10);
    let label: string;
    let days: number;

    if (granularity === 'day') {
      label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      days = 1;
      d.setDate(d.getDate() + 1);
    } else if (granularity === 'week') {
      label = `W${getWeekNumber(d)}`;
      days = 7;
      d.setDate(d.getDate() + 7);
    } else if (granularity === 'month') {
      label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      days = daysInMonth(d);
      d.setMonth(d.getMonth() + 1);
      d.setDate(1);
    } else {
      label = `Q${Math.ceil((d.getMonth() + 1) / 3)} ${d.getFullYear()}`;
      days = 90;
      d.setMonth(d.getMonth() + 3);
      d.setDate(1);
    }

    const leftPx = diffDays(paddedMin, start);
    cols.push({ label, left: (leftPx / totalDays) * 100, width: (days / totalDays) * 100 });
  }
  return cols;
}

// ─── Bar positioning ─────────────────────────────────────────────

export function barStyle(
  task: PMTask,
  paddedMin: string,
  totalDays: number,
  statusColor: string
): string {
  const today = todayISO();
  const start = task.startDate ?? task.dueDate ?? today;
  const end = task.dueDate ?? task.startDate ?? today;
  const left = Math.max(0, diffDays(paddedMin, start));
  const width = Math.max(1, diffDays(start, end));
  return `left:${(left / totalDays) * 100}%;width:${(width / totalDays) * 100}%;background:${statusColor}`;
}

// ─── Timeline range ──────────────────────────────────────────────

export interface TimelineRange {
  paddedMin: string;
  paddedMax: string;
  totalDays: number;
  todayOffset: number;
}

export function computeTimeline(tasks: PMTask[]): TimelineRange {
  const today = todayISO();
  const allDates = tasks.flatMap((t) => [t.startDate, t.dueDate].filter(Boolean) as string[]);

  const minDate = allDates.length > 0 ? allDates.reduce((a, b) => (a < b ? a : b)) : today;
  const maxDate =
    allDates.length > 0 ? allDates.reduce((a, b) => (a > b ? a : b)) : addDays(today, 30);

  const paddedMin = addDays(minDate, -7);
  const paddedMax = addDays(maxDate, 14);
  const totalDays = Math.max(1, diffDays(paddedMin, paddedMax));
  const todayOffset = Math.max(0, diffDays(paddedMin, today));

  return { paddedMin, paddedMax, totalDays, todayOffset };
}
