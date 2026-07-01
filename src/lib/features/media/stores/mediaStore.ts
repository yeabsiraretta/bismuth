/**
 * Media store — reactive state for the active media file and its edit chain.
 * Provides undo/redo history, operation management, and derived preview URL.
 */

import { writable, derived, get } from 'svelte/store';
import { log } from '@/utils/logger';
import type { MediaEditChain, PhotoOperation, VideoOperation } from '../types/media';

// --- Stores ---

export const activeMediaPath = writable<string | null>(null);
export const editChain = writable<MediaEditChain | null>(null);
export const previewDataUrl = writable<string | null>(null);
export const isProcessing = writable<boolean>(false);

/** History stack for undo — stores snapshots of the operations array. */
const historyStack = writable<(PhotoOperation | VideoOperation)[][]>([]);
const redoStack = writable<(PhotoOperation | VideoOperation)[][]>([]);

/** Whether the current chain has unsaved edits. */
export const isDirty = derived(
  [editChain],
  ([$chain]) => $chain !== null && $chain.operations.length > 0
);

// --- Actions ---

/** Load a media file path into the store and initialize an empty edit chain. */
export function loadMediaFile(path: string): void {
  activeMediaPath.set(path);
  historyStack.set([]);
  redoStack.set([]);
  editChain.set({
    sourceHash: '',
    sourcePath: path,
    operations: [],
    exportFormat: path.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg',
    exportQuality: 0.92,
    isVideo: false,
    createdAt: Date.now(),
    modifiedAt: Date.now(),
  });
  previewDataUrl.set(null);
  log.info('mediaStore: loaded media file', { path });
}

/** Add an operation to the chain, pushing current state onto undo stack. */
export function addOperation(op: PhotoOperation | VideoOperation): void {
  const current = get(editChain);
  if (!current) {
    log.warn('mediaStore: addOperation called with no active chain');
    return;
  }
  // Save current ops for undo
  historyStack.update((h) => [...h, [...current.operations]]);
  redoStack.set([]);

  editChain.update((c) => {
    if (!c) return c;
    return { ...c, operations: [...c.operations, op], modifiedAt: Date.now() };
  });
  log.debug('mediaStore: operation added', { type: op.type });
}

/** Remove a specific operation by index, pushing current state onto undo stack. */
export function removeOperation(index: number): void {
  const current = get(editChain);
  if (!current) return;
  historyStack.update((h) => [...h, [...current.operations]]);
  redoStack.set([]);

  editChain.update((c) => {
    if (!c) return c;
    const ops = [...c.operations];
    ops.splice(index, 1);
    return { ...c, operations: ops, modifiedAt: Date.now() };
  });
}

/** Undo the last operation by popping the undo stack. */
export function undoOperation(): void {
  const history = get(historyStack);
  if (history.length === 0) return;

  const current = get(editChain);
  if (current) {
    redoStack.update((r) => [...r, [...current.operations]]);
  }

  const previous = history[history.length - 1];
  historyStack.update((h) => h.slice(0, -1));
  editChain.update((c) => {
    if (!c) return c;
    return { ...c, operations: previous, modifiedAt: Date.now() };
  });
  log.debug('mediaStore: undo applied');
}

/** Redo the last undone operation. */
export function redoOperation(): void {
  const redo = get(redoStack);
  if (redo.length === 0) return;

  const current = get(editChain);
  if (current) {
    historyStack.update((h) => [...h, [...current.operations]]);
  }

  const next = redo[redo.length - 1];
  redoStack.update((r) => r.slice(0, -1));
  editChain.update((c) => {
    if (!c) return c;
    return { ...c, operations: next, modifiedAt: Date.now() };
  });
  log.debug('mediaStore: redo applied');
}

/** Clear all operations and history. */
export function clearChain(): void {
  historyStack.set([]);
  redoStack.set([]);
  editChain.update((c) => {
    if (!c) return c;
    return { ...c, operations: [], modifiedAt: Date.now() };
  });
  previewDataUrl.set(null);
  log.debug('mediaStore: chain cleared');
}

/** Reset the entire store to its initial state. */
export function resetChain(): void {
  activeMediaPath.set(null);
  editChain.set(null);
  previewDataUrl.set(null);
  isProcessing.set(false);
  historyStack.set([]);
  redoStack.set([]);
  log.info('mediaStore: reset');
}
