/**
 * Timekeep service — CRUD, duration calculation, parsing, and entry management.
 */

import type { TimekeepEntry, TimekeepData, Timekeep, DurationParts } from '../types/timekeep';
import { log } from '@/utils/logger';

const STORAGE_KEY = 'bismuth-timekeeps';

// ─── ID generation ──────────────────────────────────────────────────────────

export function generateTimekeepId(): string {
  return `tk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// ─── Persistence ────────────────────────────────────────────────────────────

export function loadTimekeeps(): Timekeep[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    log.warn('Failed to load timekeeps', { error: String(e) });
    return [];
  }
}

export function saveTimekeeps(timekeeps: Timekeep[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timekeeps));
  } catch (e) {
    log.warn('Failed to save timekeeps', { error: String(e) });
  }
}

// ─── Entry CRUD ─────────────────────────────────────────────────────────────

export function createEntry(name: string): TimekeepEntry {
  return { name, startTime: null, endTime: null, subEntries: null };
}

export function startEntry(entry: TimekeepEntry): TimekeepEntry {
  return { ...entry, startTime: new Date().toISOString(), endTime: null };
}

export function stopEntry(entry: TimekeepEntry): TimekeepEntry {
  if (!entry.startTime || entry.endTime) return entry;
  return { ...entry, endTime: new Date().toISOString() };
}

export function isRunning(entry: TimekeepEntry): boolean {
  return entry.startTime !== null && entry.endTime === null;
}

export function isCompleted(entry: TimekeepEntry): boolean {
  return entry.startTime !== null && entry.endTime !== null;
}

export function isNotStarted(entry: TimekeepEntry): boolean {
  return entry.startTime === null;
}

// ─── Duration calculation ───────────────────────────────────────────────────

export function getEntryDurationMs(entry: TimekeepEntry, now?: Date): number {
  if (!entry.startTime) return 0;
  const start = new Date(entry.startTime).getTime();
  const end = entry.endTime ? new Date(entry.endTime).getTime() : (now ?? new Date()).getTime();
  return Math.max(0, end - start);
}

export function getEntryDurationWithSubs(entry: TimekeepEntry, now?: Date): number {
  let total = getEntryDurationMs(entry, now);
  if (entry.subEntries) {
    for (const sub of entry.subEntries) {
      total += getEntryDurationWithSubs(sub, now);
    }
  }
  return total;
}

export function getTotalDuration(entries: TimekeepEntry[], now?: Date): number {
  return entries.reduce((sum, e) => sum + getEntryDurationWithSubs(e, now), 0);
}

export function parseDuration(ms: number): DurationParts {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { hours, minutes, seconds, totalMs: ms };
}

export function formatDuration(ms: number): string {
  const { hours, minutes, seconds } = parseDuration(ms);
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function formatDurationShort(ms: number): string {
  const { hours, minutes, seconds } = parseDuration(ms);
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (hours === 0) parts.push(`${seconds}s`);
  return parts.join(' ') || '0s';
}

// ─── Date formatting ────────────────────────────────────────────────────────

export function formatTimestamp(isoStr: string, pattern: string = 'YY-MM-DD HH:mm:ss'): string {
  const d = new Date(isoStr);
  const yy = String(d.getFullYear()).slice(-2);
  const yyyy = String(d.getFullYear());
  const MM = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const HH = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return pattern
    .replace('YYYY', yyyy)
    .replace('YY', yy)
    .replace('MM', MM)
    .replace('DD', dd)
    .replace('HH', HH)
    .replace('mm', mm)
    .replace('ss', ss);
}

// ─── Sub-entry management ───────────────────────────────────────────────────

export function addSubEntry(entry: TimekeepEntry, subName: string): TimekeepEntry {
  const sub = createEntry(subName);
  return { ...entry, subEntries: [...(entry.subEntries ?? []), sub] };
}

export function removeSubEntry(entry: TimekeepEntry, index: number): TimekeepEntry {
  if (!entry.subEntries) return entry;
  return { ...entry, subEntries: entry.subEntries.filter((_, i) => i !== index) };
}

export function toggleCollapsed(entry: TimekeepEntry): TimekeepEntry {
  return { ...entry, collapsed: !entry.collapsed };
}

// ─── Timekeep-level operations ──────────────────────────────────────────────

export function createTimekeep(title: string = 'Untitled Timekeep'): Timekeep {
  const now = new Date().toISOString();
  return {
    id: generateTimekeepId(),
    title,
    data: { entries: [] },
    createdAt: now,
    updatedAt: now,
  };
}

export function hasRunningEntry(data: TimekeepData): boolean {
  return data.entries.some(
    (e) => isRunning(e) || (e.subEntries?.some((s) => isRunning(s)) ?? false)
  );
}

export function getRunningEntries(data: TimekeepData): TimekeepEntry[] {
  const running: TimekeepEntry[] = [];
  for (const e of data.entries) {
    if (isRunning(e)) running.push(e);
    if (e.subEntries) {
      for (const s of e.subEntries) {
        if (isRunning(s)) running.push(s);
      }
    }
  }
  return running;
}

// ─── JSON parsing (for code block compatibility) ────────────────────────────

export function parseTimekeepJson(json: string): TimekeepData | null {
  try {
    const parsed = JSON.parse(json);
    if (parsed && Array.isArray(parsed.entries)) return parsed as TimekeepData;
    return null;
  } catch {
    return null;
  }
}

export function serializeTimekeepJson(data: TimekeepData): string {
  return JSON.stringify(data);
}
