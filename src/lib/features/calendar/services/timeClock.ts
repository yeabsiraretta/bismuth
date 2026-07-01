/**
 * Time clock service — start/stop time tracking on tasks,
 * persist clock records, provide active clock state.
 */

import { writable, derived } from 'svelte/store';
import { log } from '@/utils/logger';
import type { ClockRecord, CalendarEvent } from '../types';

const STORAGE_KEY = 'bismuth-time-clocks';

function generateId(): string {
  return `clock-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function loadClocks(): ClockRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/** All clock records. */
export const clockRecords = writable<ClockRecord[]>(loadClocks());

/** Derived: currently running clocks. */
export const activeClocks = derived(clockRecords, ($records) =>
  $records.filter((r) => r.status === 'running')
);

/** Derived: stopped clock records (for timeline display). */
export const completedClocks = derived(clockRecords, ($records) =>
  $records.filter((r) => r.status === 'stopped')
);

/** Derived: clock records as CalendarEvents for timeline display. */
export const clockEvents = derived(completedClocks, ($clocks): CalendarEvent[] =>
  $clocks
    .filter((c) => c.stoppedAt !== null && c.durationMinutes !== null)
    .map((c) => {
      const started = new Date(c.startedAt);
      const date = `${started.getFullYear()}-${String(started.getMonth() + 1).padStart(2, '0')}-${String(started.getDate()).padStart(2, '0')}`;
      const startMinute = started.getHours() * 60 + started.getMinutes();
      return {
        id: `clock-${c.id}`,
        title: c.taskText,
        type: 'clock' as const,
        date,
        startMinute,
        durationMinutes: c.durationMinutes,
        completed: true,
        taskSourcePath: c.sourcePath,
        taskLine: c.sourceLine,
        project: c.project,
        readonly: true,
        color: 'var(--color-warning, #d97706)',
      };
    })
);

// Persist clocks
clockRecords.subscribe((records) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    log.warn('Failed to persist clock records', { error: String(e) });
  }
});

/** Start a clock for a task. */
export function startClock(
  taskText: string,
  sourcePath: string,
  sourceLine: number,
  project?: string
): string {
  const id = generateId();
  const record: ClockRecord = {
    id,
    taskText,
    sourcePath,
    sourceLine,
    startedAt: new Date().toISOString(),
    stoppedAt: null,
    status: 'running',
    durationMinutes: null,
    project,
  };
  clockRecords.update((records) => [...records, record]);
  log.info('Clock started', { id, taskText });
  return id;
}

/** Stop a running clock. */
export function stopClock(id: string): void {
  const now = new Date();
  clockRecords.update((records) =>
    records.map((r) => {
      if (r.id !== id || r.status !== 'running') return r;
      const started = new Date(r.startedAt);
      const duration = Math.round((now.getTime() - started.getTime()) / 60000);
      return {
        ...r,
        stoppedAt: now.toISOString(),
        status: 'stopped' as const,
        durationMinutes: duration,
      };
    })
  );
  log.info('Clock stopped', { id });
}

/** Cancel a running clock (discard the record). */
export function cancelClock(id: string): void {
  clockRecords.update((records) =>
    records.map((r) =>
      r.id === id && r.status === 'running'
        ? { ...r, status: 'cancelled' as const, stoppedAt: new Date().toISOString() }
        : r
    )
  );
  log.info('Clock cancelled', { id });
}

/** Delete a clock record. */
export function deleteClock(id: string): void {
  clockRecords.update((records) => records.filter((r) => r.id !== id));
}

/** Get elapsed minutes for a running clock. */
export function getElapsedMinutes(record: ClockRecord): number {
  if (record.status !== 'running') return record.durationMinutes ?? 0;
  const started = new Date(record.startedAt);
  return Math.round((Date.now() - started.getTime()) / 60000);
}

/** Format minutes as "Xh Ym". */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Get today's total tracked time in minutes. */
export function getTodayTrackedMinutes(records: ClockRecord[]): number {
  const today = new Date().toISOString().slice(0, 10);
  return records
    .filter((r) => r.status === 'stopped' && r.startedAt.startsWith(today))
    .reduce((sum, r) => sum + (r.durationMinutes ?? 0), 0);
}
