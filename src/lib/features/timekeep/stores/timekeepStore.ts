/**
 * Timekeep store — reactive state for all timekeep instances, active timers,
 * and settings with localStorage persistence.
 */

import { writable, derived } from 'svelte/store';
import type { Timekeep, TimekeepEntry, TimekeepSettings } from '../types/timekeep';
import { DEFAULT_TIMEKEEP_SETTINGS } from '../types/timekeep';
import {
  loadTimekeeps, saveTimekeeps, createTimekeep, createEntry,
  startEntry, stopEntry, isRunning, addSubEntry, removeSubEntry,
  toggleCollapsed, getRunningEntries, generateTimekeepId,
} from '../services/timekeepService';
import { log } from '@/utils/logger';

const SETTINGS_KEY = 'bismuth-timekeep-settings';

// ─── Settings store ─────────────────────────────────────────────────────────

function loadSettings(): TimekeepSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    return stored ? { ...DEFAULT_TIMEKEEP_SETTINGS, ...JSON.parse(stored) } : { ...DEFAULT_TIMEKEEP_SETTINGS };
  } catch { return { ...DEFAULT_TIMEKEEP_SETTINGS }; }
}

export const timekeepSettings = writable<TimekeepSettings>(loadSettings());
timekeepSettings.subscribe(s => {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch { /* noop */ }
});

// ─── Timekeeps store ────────────────────────────────────────────────────────

export const timekeeps = writable<Timekeep[]>(loadTimekeeps());
timekeeps.subscribe(saveTimekeeps);

// ─── Derived: active (running) entries across all timekeeps ─────────────────

export const activeTimers = derived(timekeeps, ($tks) => {
  const result: Array<{ timekeepId: string; timekeepTitle: string; entry: TimekeepEntry }> = [];
  for (const tk of $tks) {
    for (const entry of getRunningEntries(tk.data)) {
      result.push({ timekeepId: tk.id, timekeepTitle: tk.title, entry });
    }
  }
  return result;
});

export const hasActiveTimers = derived(activeTimers, ($at) => $at.length > 0);

// ─── Actions ────────────────────────────────────────────────────────────────

function updateTimekeep(id: string, fn: (tk: Timekeep) => Timekeep) {
  timekeeps.update(tks =>
    tks.map(tk => tk.id === id ? fn({ ...tk, updatedAt: new Date().toISOString() }) : tk),
  );
}

function updateEntry(tkId: string, entryIdx: number, fn: (e: TimekeepEntry) => TimekeepEntry) {
  updateTimekeep(tkId, tk => ({
    ...tk,
    data: { entries: tk.data.entries.map((e, i) => i === entryIdx ? fn(e) : e) },
  }));
}

export function addTimekeep(title?: string): string {
  const tk = createTimekeep(title);
  timekeeps.update(tks => [...tks, tk]);
  log.info('Timekeep created', { id: tk.id, title: tk.title });
  return tk.id;
}

export function removeTimekeep(id: string): void {
  timekeeps.update(tks => tks.filter(tk => tk.id !== id));
}

export function renameTimekeep(id: string, title: string): void {
  updateTimekeep(id, tk => ({ ...tk, title }));
}

export function addEntry(tkId: string, name: string): void {
  updateTimekeep(tkId, tk => ({
    ...tk,
    data: { entries: [...tk.data.entries, createEntry(name)] },
  }));
}

export function removeEntry(tkId: string, entryIdx: number): void {
  updateTimekeep(tkId, tk => ({
    ...tk,
    data: { entries: tk.data.entries.filter((_, i) => i !== entryIdx) },
  }));
}

export function startEntryTimer(tkId: string, entryIdx: number): void {
  updateEntry(tkId, entryIdx, startEntry);
}

export function stopEntryTimer(tkId: string, entryIdx: number): void {
  updateEntry(tkId, entryIdx, stopEntry);
}

export function editEntryName(tkId: string, entryIdx: number, name: string): void {
  updateEntry(tkId, entryIdx, e => ({ ...e, name }));
}

export function editEntryTimes(
  tkId: string, entryIdx: number,
  startTime: string | null, endTime: string | null,
): void {
  updateEntry(tkId, entryIdx, e => ({ ...e, startTime, endTime }));
}

export function toggleEntryCollapsed(tkId: string, entryIdx: number): void {
  updateEntry(tkId, entryIdx, toggleCollapsed);
}

// ── Sub-entries ──

export function addSubEntryAction(tkId: string, entryIdx: number, subName: string): void {
  updateEntry(tkId, entryIdx, e => addSubEntry(e, subName));
}

export function removeSubEntryAction(tkId: string, entryIdx: number, subIdx: number): void {
  updateEntry(tkId, entryIdx, e => removeSubEntry(e, subIdx));
}

export function startSubEntryTimer(tkId: string, entryIdx: number, subIdx: number): void {
  updateEntry(tkId, entryIdx, e => ({
    ...e,
    subEntries: e.subEntries?.map((s, i) => i === subIdx ? startEntry(s) : s) ?? null,
  }));
}

export function stopSubEntryTimer(tkId: string, entryIdx: number, subIdx: number): void {
  updateEntry(tkId, entryIdx, e => ({
    ...e,
    subEntries: e.subEntries?.map((s, i) => i === subIdx ? stopEntry(s) : s) ?? null,
  }));
}

// ── Stop all running timers ──

export function stopAllTimers(): void {
  timekeeps.update(tks => tks.map(tk => ({
    ...tk,
    updatedAt: new Date().toISOString(),
    data: {
      entries: tk.data.entries.map(e => {
        const stopped = isRunning(e) ? stopEntry(e) : e;
        if (stopped.subEntries) {
          return { ...stopped, subEntries: stopped.subEntries.map(s => isRunning(s) ? stopEntry(s) : s) };
        }
        return stopped;
      }),
    },
  })));
}
