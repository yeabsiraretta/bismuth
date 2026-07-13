import { afterEach, describe, expect, it } from 'vitest';

import {
  canRedo,
  canUndo,
  clearHistory,
  getRedoStackSize,
  getUndoStackSize,
  pushState,
  redo,
  undo,
} from '@/hubs/canvas/services/canvas-history';
import type { CanvasElement } from '@/hubs/canvas/types/canvas-types';
import { createCard } from '@/hubs/canvas/types/canvas-types';

function makeEls(count: number): CanvasElement[] {
  return Array.from({ length: count }, (_, i) =>
    createCard({ x: i * 100, y: 0, title: `Card ${i}` })
  );
}

afterEach(() => clearHistory());

// ── pushState / undo / redo ──────────────────────────────────────

describe('pushState + undo + redo', () => {
  it('starts with empty stacks', () => {
    expect(canUndo()).toBe(false);
    expect(canRedo()).toBe(false);
    expect(getUndoStackSize()).toBe(0);
    expect(getRedoStackSize()).toBe(0);
  });

  it('pushState makes undo available', () => {
    const els = makeEls(2);
    pushState(els);
    expect(canUndo()).toBe(true);
    expect(getUndoStackSize()).toBe(1);
  });

  it('undo returns previous state', () => {
    const v1 = makeEls(1);
    const v2 = makeEls(2);
    pushState(v1);
    const result = undo(v2);
    expect(result).toHaveLength(1);
    expect(result![0].id).toBe(v1[0].id);
  });

  it('undo pushes current state to redo stack', () => {
    const v1 = makeEls(1);
    const v2 = makeEls(2);
    pushState(v1);
    undo(v2);
    expect(canRedo()).toBe(true);
    expect(getRedoStackSize()).toBe(1);
  });

  it('redo returns next state after undo', () => {
    const v1 = makeEls(1);
    const v2 = makeEls(2);
    pushState(v1);
    const afterUndo = undo(v2);
    expect(afterUndo).toHaveLength(1);
    const afterRedo = redo(afterUndo!);
    expect(afterRedo).toHaveLength(2);
  });

  it('undo returns null when stack is empty', () => {
    expect(undo(makeEls(1))).toBeNull();
  });

  it('redo returns null when stack is empty', () => {
    expect(redo(makeEls(1))).toBeNull();
  });

  it('pushState clears redo stack', () => {
    const v1 = makeEls(1);
    const v2 = makeEls(2);
    const v3 = makeEls(3);
    pushState(v1);
    undo(v2);
    expect(canRedo()).toBe(true);
    pushState(v3);
    expect(canRedo()).toBe(false);
  });

  it('multiple undo/redo cycles work', () => {
    const v1 = makeEls(1);
    const v2 = makeEls(2);
    const v3 = makeEls(3);
    pushState(v1);
    pushState(v2);
    const r1 = undo(v3);
    expect(r1).toHaveLength(2);
    const r2 = undo(r1!);
    expect(r2).toHaveLength(1);
    const r3 = redo(r2!);
    expect(r3).toHaveLength(2);
    const r4 = redo(r3!);
    expect(r4).toHaveLength(3);
  });
});

// ── clearHistory ─────────────────────────────────────────────────

describe('clearHistory', () => {
  it('resets all stacks', () => {
    pushState(makeEls(1));
    pushState(makeEls(2));
    undo(makeEls(3));
    clearHistory();
    expect(canUndo()).toBe(false);
    expect(canRedo()).toBe(false);
    expect(getUndoStackSize()).toBe(0);
    expect(getRedoStackSize()).toBe(0);
  });
});

// ── Deep clone safety ────────────────────────────────────────────

describe('deep clone safety', () => {
  it('undo state is not affected by mutations to original', () => {
    const els = makeEls(1);
    pushState(els);
    (els[0] as { x: number }).x = 9999;
    const undone = undo(makeEls(1));
    expect(undone![0].x).toBe(0);
  });
});
