import type { CanvasElement } from '@/hubs/canvas/types/canvas-types';

const MAX_HISTORY = 50;

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

let undoStack: CanvasElement[][] = [];
let redoStack: CanvasElement[][] = [];
let batching = false;
let batchBase: CanvasElement[] | null = null;

export function pushState(elements: CanvasElement[]) {
  if (batching) {
    if (!batchBase) batchBase = deepClone(elements);
    return;
  }
  undoStack = [...undoStack.slice(-(MAX_HISTORY - 1)), deepClone(elements)];
  redoStack = [];
}

export function undo(currentElements: CanvasElement[]): CanvasElement[] | null {
  if (undoStack.length === 0) return null;
  redoStack = [...redoStack, deepClone(currentElements)];
  const prev = undoStack[undoStack.length - 1];
  undoStack = undoStack.slice(0, -1);
  return prev;
}

export function redo(currentElements: CanvasElement[]): CanvasElement[] | null {
  if (redoStack.length === 0) return null;
  undoStack = [...undoStack, deepClone(currentElements)];
  const next = redoStack[redoStack.length - 1];
  redoStack = redoStack.slice(0, -1);
  return next;
}

export function canUndo(): boolean {
  return undoStack.length > 0;
}

export function canRedo(): boolean {
  return redoStack.length > 0;
}

export function beginBatch() {
  batching = true;
  batchBase = null;
}

export function endBatch(currentElements: CanvasElement[]) {
  batching = false;
  if (batchBase) {
    undoStack = [...undoStack.slice(-(MAX_HISTORY - 1)), batchBase];
    redoStack = [];
  }
  batchBase = null;
  void currentElements;
}

export function clearHistory() {
  undoStack = [];
  redoStack = [];
  batching = false;
  batchBase = null;
}

export function getUndoStackSize(): number {
  return undoStack.length;
}

export function getRedoStackSize(): number {
  return redoStack.length;
}
