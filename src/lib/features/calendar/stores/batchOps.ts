/**
 * Batch Operations & Undo/Redo — multi-select events, batch actions,
 * and full action history with undo/redo support.
 */
import { writable, derived, get } from 'svelte/store';
import { log } from '@/utils/logger';
import { generatePrefixedId } from '@/utils/id';
import {
  calendarEvents,
  addCalendarEvent,
  deleteCalendarEvent,
  updateCalendarEvent,
} from './calendarStore';
import type { CalendarEvent } from '../types';
import type { UndoEntry } from '../types/prisma';

// ─── Selection state ─────────────────────────────────────────────────────────

export const selectedEventIds = writable<Set<string>>(new Set());
export const selectionMode = writable(false);

export const selectedCount = derived(selectedEventIds, ($s) => $s.size);

export function toggleEventSelection(id: string): void {
  selectedEventIds.update((s) => {
    const next = new Set(s);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
}

export function selectEvent(id: string): void {
  selectedEventIds.update((s) => new Set(s).add(id));
}

export function deselectEvent(id: string): void {
  selectedEventIds.update((s) => {
    const n = new Set(s);
    n.delete(id);
    return n;
  });
}

export function clearSelection(): void {
  selectedEventIds.set(new Set());
  selectionMode.set(false);
}

export function selectAll(): void {
  const all = get(calendarEvents);
  selectedEventIds.set(new Set(all.map((e) => e.id)));
}

// ─── Undo / Redo history ─────────────────────────────────────────────────────

const MAX_HISTORY = 50;

export const undoStack = writable<UndoEntry[]>([]);
export const redoStack = writable<UndoEntry[]>([]);

export const canUndo = derived(undoStack, ($s) => $s.length > 0);
export const canRedo = derived(redoStack, ($s) => $s.length > 0);

function pushUndo(entry: UndoEntry): void {
  undoStack.update((s) => [...s.slice(-(MAX_HISTORY - 1)), entry]);
  redoStack.set([]);
}

function snapshotEvents(ids: string[]): CalendarEvent[] {
  const all = get(calendarEvents);
  return all.filter((e) => ids.includes(e.id));
}

export function undo(): void {
  const stack = get(undoStack);
  if (!stack.length) return;
  const entry = stack[stack.length - 1];

  // Restore "before" state
  calendarEvents.update((events) => {
    let result = events.filter((e) => !entry.after.some((a) => a.id === e.id));
    result = [...result, ...entry.before];
    return result;
  });

  undoStack.update((s) => s.slice(0, -1));
  redoStack.update((s) => [...s, entry]);
  log.info('Undo', { label: entry.label });
}

export function redo(): void {
  const stack = get(redoStack);
  if (!stack.length) return;
  const entry = stack[stack.length - 1];

  calendarEvents.update((events) => {
    let result = events.filter((e) => !entry.before.some((b) => b.id === e.id));
    result = [...result, ...entry.after];
    return result;
  });

  redoStack.update((s) => s.slice(0, -1));
  undoStack.update((s) => [...s, entry]);
  log.info('Redo', { label: entry.label });
}

// ─── Batch actions ───────────────────────────────────────────────────────────

export function batchDelete(): void {
  const ids = [...get(selectedEventIds)];
  if (!ids.length) return;

  const before = snapshotEvents(ids);
  pushUndo({
    id: generatePrefixedId('undo'),
    type: 'batch',
    label: `Delete ${ids.length} events`,
    timestamp: Date.now(),
    before,
    after: [],
  });

  for (const id of ids) deleteCalendarEvent(id);
  clearSelection();
  log.info('Batch delete', { count: ids.length });
}

export function batchComplete(): void {
  const ids = [...get(selectedEventIds)];
  if (!ids.length) return;

  const before = snapshotEvents(ids);
  for (const id of ids) updateCalendarEvent(id, { completed: true });
  const after = snapshotEvents(ids);

  pushUndo({
    id: generatePrefixedId('undo'),
    type: 'batch',
    label: `Complete ${ids.length} events`,
    timestamp: Date.now(),
    before,
    after,
  });
  clearSelection();
}

export function batchDuplicate(): void {
  const ids = [...get(selectedEventIds)];
  if (!ids.length) return;
  const originals = snapshotEvents(ids);
  const copies: CalendarEvent[] = [];

  for (const e of originals) {
    const copy = { ...e, id: generatePrefixedId('ev'), title: `${e.title} (copy)` };
    addCalendarEvent(copy);
    copies.push(copy);
  }

  pushUndo({
    id: generatePrefixedId('undo'),
    type: 'batch',
    label: `Duplicate ${ids.length} events`,
    timestamp: Date.now(),
    before: [],
    after: copies,
  });
  clearSelection();
  log.info('Batch duplicate', { count: copies.length });
}

export function batchShift(days: number): void {
  const ids = [...get(selectedEventIds)];
  if (!ids.length) return;

  const before = snapshotEvents(ids);
  for (const id of ids) {
    const evt = before.find((e) => e.id === id);
    if (!evt) continue;
    const d = new Date(evt.date);
    d.setDate(d.getDate() + days);
    const newDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    updateCalendarEvent(id, { date: newDate });
  }
  const after = snapshotEvents(ids);

  const label =
    days > 0
      ? `Shift ${ids.length} events forward ${days}d`
      : `Shift ${ids.length} events back ${Math.abs(days)}d`;
  pushUndo({
    id: generatePrefixedId('undo'),
    type: 'batch',
    label,
    timestamp: Date.now(),
    before,
    after,
  });
  clearSelection();
  log.info('Batch shift', { count: ids.length, days });
}

export function batchMove(targetDate: string): void {
  const ids = [...get(selectedEventIds)];
  if (!ids.length) return;

  const before = snapshotEvents(ids);
  for (const id of ids) updateCalendarEvent(id, { date: targetDate });
  const after = snapshotEvents(ids);

  pushUndo({
    id: generatePrefixedId('undo'),
    type: 'batch',
    label: `Move ${ids.length} events to ${targetDate}`,
    timestamp: Date.now(),
    before,
    after,
  });
  clearSelection();
}

// ─── Tracked single actions (for undo) ───────────────────────────────────────

export function trackedAdd(event: CalendarEvent): void {
  addCalendarEvent(event);
  pushUndo({
    id: generatePrefixedId('undo'),
    type: 'add',
    label: `Add "${event.title}"`,
    timestamp: Date.now(),
    before: [],
    after: [event],
  });
}

export function trackedDelete(id: string): void {
  const before = snapshotEvents([id]);
  deleteCalendarEvent(id);
  pushUndo({
    id: generatePrefixedId('undo'),
    type: 'delete',
    label: `Delete "${before[0]?.title ?? id}"`,
    timestamp: Date.now(),
    before,
    after: [],
  });
}

export function trackedUpdate(id: string, updates: Partial<CalendarEvent>): void {
  const before = snapshotEvents([id]);
  updateCalendarEvent(id, updates);
  const after = snapshotEvents([id]);
  pushUndo({
    id: generatePrefixedId('undo'),
    type: 'update',
    label: `Edit "${before[0]?.title ?? id}"`,
    timestamp: Date.now(),
    before,
    after,
  });
}
