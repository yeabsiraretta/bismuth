/**
 * Keyshots editor actions — pure CodeMirror editor operations.
 *
 * Move lines, duplicate, join, sort, reverse, shuffle, transform case,
 * add caret cursors, expand selection, encode URI, trim, split.
 */

import { EditorSelection } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';

// ─── Line movement ─────────────────────────────────────────────────────────────

export function moveLineUp(view: EditorView): boolean {
  const { state } = view;
  const sel = state.selection.main;
  const firstLine = state.doc.lineAt(sel.from);
  if (firstLine.number === 1) return false;
  const lastLine = state.doc.lineAt(sel.to);
  const above = state.doc.line(firstLine.number - 1);
  const text = state.sliceDoc(firstLine.from, lastLine.to);
  view.dispatch({
    changes: [{ from: above.from, to: lastLine.to, insert: text + '\n' + above.text }],
    selection: EditorSelection.range(
      sel.from - above.text.length - 1,
      sel.to - above.text.length - 1
    ),
    userEvent: 'move.line',
  });
  return true;
}

export function moveLineDown(view: EditorView): boolean {
  const { state } = view;
  const sel = state.selection.main;
  const firstLine = state.doc.lineAt(sel.from);
  const lastLine = state.doc.lineAt(sel.to);
  if (lastLine.number === state.doc.lines) return false;
  const below = state.doc.line(lastLine.number + 1);
  const text = state.sliceDoc(firstLine.from, lastLine.to);
  view.dispatch({
    changes: [{ from: firstLine.from, to: below.to, insert: below.text + '\n' + text }],
    selection: EditorSelection.range(
      sel.from + below.text.length + 1,
      sel.to + below.text.length + 1
    ),
    userEvent: 'move.line',
  });
  return true;
}

// ─── Duplicate ─────────────────────────────────────────────────────────────────

export function duplicateLineUp(view: EditorView): boolean {
  return duplicateLine(view, 'up');
}

export function duplicateLineDown(view: EditorView): boolean {
  return duplicateLine(view, 'down');
}

function duplicateLine(view: EditorView, direction: 'up' | 'down'): boolean {
  const { state } = view;
  const sel = state.selection.main;
  const firstLine = state.doc.lineAt(sel.from);
  const lastLine = state.doc.lineAt(sel.to);
  const text = state.sliceDoc(firstLine.from, lastLine.to);
  if (direction === 'down') {
    view.dispatch({
      changes: { from: lastLine.to, insert: '\n' + text },
      selection: EditorSelection.range(sel.from + text.length + 1, sel.to + text.length + 1),
      userEvent: 'input.duplicate',
    });
  } else {
    view.dispatch({
      changes: { from: firstLine.from, insert: text + '\n' },
      userEvent: 'input.duplicate',
    });
  }
  return true;
}

export function duplicateSelection(view: EditorView): boolean {
  const { state } = view;
  const sel = state.selection.main;
  if (sel.empty) return duplicateLineDown(view);
  const text = state.sliceDoc(sel.from, sel.to);
  view.dispatch({
    changes: { from: sel.to, insert: text },
    selection: EditorSelection.range(sel.to, sel.to + text.length),
    userEvent: 'input.duplicate',
  });
  return true;
}

// ─── Insert line ───────────────────────────────────────────────────────────────

export function insertLineAbove(view: EditorView): boolean {
  const { state } = view;
  const line = state.doc.lineAt(state.selection.main.from);
  view.dispatch({
    changes: { from: line.from, insert: '\n' },
    selection: EditorSelection.cursor(line.from),
    userEvent: 'input.insertLine',
  });
  return true;
}

export function insertLineBelow(view: EditorView): boolean {
  const { state } = view;
  const line = state.doc.lineAt(state.selection.main.to);
  view.dispatch({
    changes: { from: line.to, insert: '\n' },
    selection: EditorSelection.cursor(line.to + 1),
    userEvent: 'input.insertLine',
  });
  return true;
}

// ─── Join lines ────────────────────────────────────────────────────────────────

export function joinLines(view: EditorView): boolean {
  const { state } = view;
  const sel = state.selection.main;
  const firstLine = state.doc.lineAt(sel.from);
  const lastLine = state.doc.lineAt(sel.to);
  if (firstLine.number === lastLine.number && lastLine.number < state.doc.lines) {
    const next = state.doc.line(lastLine.number + 1);
    view.dispatch({
      changes: { from: firstLine.to, to: next.from + leadingSpaces(next.text), insert: ' ' },
      userEvent: 'input.join',
    });
    return true;
  }
  const changes: Array<{ from: number; to: number; insert: string }> = [];
  for (let i = firstLine.number; i < lastLine.number; i++) {
    const cur = state.doc.line(i);
    const nxt = state.doc.line(i + 1);
    changes.push({ from: cur.to, to: nxt.from + leadingSpaces(nxt.text), insert: ' ' });
  }
  view.dispatch({ changes, userEvent: 'input.join' });
  return true;
}

function leadingSpaces(text: string): number {
  const m = text.match(/^\s*/);
  return m ? m[0].length : 0;
}

// ─── Sort / reverse / shuffle ──────────────────────────────────────────────────

export function sortLines(view: EditorView, caseSensitive = false): boolean {
  return transformSelectedLines(view, (lines) => {
    const cmp = caseSensitive
      ? (a: string, b: string) => a.localeCompare(b)
      : (a: string, b: string) => a.toLowerCase().localeCompare(b.toLowerCase());
    return [...lines].sort(cmp);
  });
}

export function reverseLines(view: EditorView): boolean {
  return transformSelectedLines(view, (lines) => [...lines].reverse());
}

export function shuffleLines(view: EditorView): boolean {
  return transformSelectedLines(view, (lines) => {
    const arr = [...lines];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  });
}

function transformSelectedLines(view: EditorView, fn: (lines: string[]) => string[]): boolean {
  const { state } = view;
  const sel = state.selection.main;
  const firstLine = state.doc.lineAt(sel.from);
  const lastLine = state.doc.lineAt(sel.to);
  const lines: string[] = [];
  for (let i = firstLine.number; i <= lastLine.number; i++) {
    lines.push(state.doc.line(i).text);
  }
  if (lines.length < 2) return false;
  const result = fn(lines).join('\n');
  view.dispatch({
    changes: { from: firstLine.from, to: lastLine.to, insert: result },
    userEvent: 'input.transform',
  });
  return true;
}
