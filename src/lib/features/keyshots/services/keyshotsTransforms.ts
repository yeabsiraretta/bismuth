/**
 * Keyshots text transform and cursor actions.
 *
 * Case transforms (upper/lower/title/toggle/snake/kebab),
 * URI encode/decode, trim, split by lines, expand selection,
 * add caret cursor, select word instances, insert code block.
 */

import { EditorSelection } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';

// ─── Case transforms ──────────────────────────────────────────────────────────

export function transformUppercase(view: EditorView): boolean {
  return transformSelection(view, t => t.toUpperCase());
}

export function transformLowercase(view: EditorView): boolean {
  return transformSelection(view, t => t.toLowerCase());
}

export function transformTitlecase(view: EditorView): boolean {
  return transformSelection(view, t =>
    t.replace(/\b\w/g, c => c.toUpperCase()),
  );
}

export function toggleCase(view: EditorView): boolean {
  return transformSelection(view, t => {
    if (t === t.toUpperCase()) return t.toLowerCase();
    return t.toUpperCase();
  });
}

export function toggleSnakecase(view: EditorView): boolean {
  return transformSelection(view, t => {
    if (t.includes('_')) {
      return t.replace(/_(.)/g, (_, c: string) => c.toUpperCase());
    }
    return t.replace(/[A-Z]/g, c => '_' + c.toLowerCase())
            .replace(/^_/, '');
  });
}

export function toggleKebabcase(view: EditorView): boolean {
  return transformSelection(view, t => {
    if (t.includes('-')) {
      return t.replace(/-(.)/g, (_, c: string) => c.toUpperCase());
    }
    return t.replace(/[A-Z]/g, c => '-' + c.toLowerCase())
            .replace(/^-/, '');
  });
}

// ─── URI encode/decode ─────────────────────────────────────────────────────────

export function encodeUri(view: EditorView): boolean {
  return transformSelection(view, t => {
    try {
      const decoded = decodeURIComponent(t);
      if (decoded !== t) return decoded;
    } catch { /* not encoded */ }
    return encodeURIComponent(t);
  });
}

// ─── Trim / split ──────────────────────────────────────────────────────────────

export function trimSelection(view: EditorView): boolean {
  return transformSelection(view, t => t.trim());
}

export function splitByLines(view: EditorView): boolean {
  const { state } = view;
  const sel = state.selection.main;
  if (sel.empty) return false;
  const text = state.sliceDoc(sel.from, sel.to);
  const lines = text.split('\n');
  const ranges = [];
  let offset = sel.from;
  for (const line of lines) {
    if (line.trim()) {
      ranges.push(EditorSelection.range(offset, offset + line.length));
    }
    offset += line.length + 1;
  }
  if (ranges.length < 2) return false;
  view.dispatch({
    selection: EditorSelection.create(ranges),
  });
  return true;
}

// ─── Expand line selection ─────────────────────────────────────────────────────

export function expandLineSelection(view: EditorView): boolean {
  const { state } = view;
  const sel = state.selection.main;
  const firstLine = state.doc.lineAt(sel.from);
  const lastLine = state.doc.lineAt(sel.to);
  // If already selecting full lines, expand by one more
  if (sel.from === firstLine.from && sel.to === lastLine.to) {
    if (lastLine.number < state.doc.lines) {
      const next = state.doc.line(lastLine.number + 1);
      view.dispatch({
        selection: EditorSelection.range(firstLine.from, next.to),
      });
      return true;
    }
    return false;
  }
  view.dispatch({
    selection: EditorSelection.range(firstLine.from, lastLine.to),
  });
  return true;
}

// ─── Caret cursors ─────────────────────────────────────────────────────────────

export function addCursorUp(view: EditorView): boolean {
  return addCaret(view, -1);
}

export function addCursorDown(view: EditorView): boolean {
  return addCaret(view, 1);
}

function addCaret(view: EditorView, direction: -1 | 1): boolean {
  const { state } = view;
  const ranges = [...state.selection.ranges];
  const anchor = direction === -1 ? ranges[0] : ranges[ranges.length - 1];
  const line = state.doc.lineAt(anchor.head);
  const targetLineNum = line.number + direction;
  if (targetLineNum < 1 || targetLineNum > state.doc.lines) return false;
  const targetLine = state.doc.line(targetLineNum);
  const col = anchor.head - line.from;
  const newPos = targetLine.from + Math.min(col, targetLine.length);
  const newRange = EditorSelection.cursor(newPos);
  if (direction === -1) {
    ranges.unshift(newRange);
  } else {
    ranges.push(newRange);
  }
  view.dispatch({ selection: EditorSelection.create(ranges) });
  return true;
}

// ─── Select word instances ─────────────────────────────────────────────────────

export function selectAllInstances(view: EditorView): boolean {
  const { state } = view;
  const sel = state.selection.main;
  const word = sel.empty ? wordAt(state.doc.toString(), sel.from) : state.sliceDoc(sel.from, sel.to);
  if (!word) return false;
  const doc = state.doc.toString();
  const ranges: Array<{ from: number; to: number }> = [];
  let idx = 0;
  while ((idx = doc.indexOf(word, idx)) !== -1) {
    ranges.push({ from: idx, to: idx + word.length });
    idx += word.length;
  }
  if (ranges.length === 0) return false;
  view.dispatch({
    selection: EditorSelection.create(
      ranges.map(r => EditorSelection.range(r.from, r.to)),
    ),
  });
  return true;
}

function wordAt(doc: string, pos: number): string {
  const re = /\w+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(doc)) !== null) {
    if (m.index <= pos && m.index + m[0].length >= pos) return m[0];
    if (m.index > pos) break;
  }
  return '';
}

// ─── Insert code block ─────────────────────────────────────────────────────────

export function insertCodeBlock(view: EditorView): boolean {
  const { state } = view;
  const sel = state.selection.main;
  const text = sel.empty ? '' : state.sliceDoc(sel.from, sel.to);
  const block = '```\n' + text + '\n```';
  view.dispatch({
    changes: { from: sel.from, to: sel.to, insert: block },
    selection: EditorSelection.cursor(sel.from + 4),
    userEvent: 'input.codeblock',
  });
  return true;
}

// ─── Indent / outdent ──────────────────────────────────────────────────────────

export function indent(view: EditorView): boolean {
  return indentLines(view, true);
}

export function outdent(view: EditorView): boolean {
  return indentLines(view, false);
}

function indentLines(view: EditorView, add: boolean): boolean {
  const { state } = view;
  const sel = state.selection.main;
  const firstLine = state.doc.lineAt(sel.from);
  const lastLine = state.doc.lineAt(sel.to);
  const changes: Array<{ from: number; to: number; insert: string }> = [];
  for (let i = firstLine.number; i <= lastLine.number; i++) {
    const line = state.doc.line(i);
    if (add) {
      changes.push({ from: line.from, to: line.from, insert: '  ' });
    } else {
      const strip = line.text.startsWith('  ') ? 2 : line.text.startsWith(' ') ? 1 : 0;
      if (strip) changes.push({ from: line.from, to: line.from + strip, insert: '' });
    }
  }
  if (changes.length === 0) return false;
  view.dispatch({ changes, userEvent: add ? 'input.indent' : 'input.outdent' });
  return true;
}

// ─── Helper ────────────────────────────────────────────────────────────────────

function transformSelection(
  view: EditorView,
  fn: (text: string) => string,
): boolean {
  const { state } = view;
  const sel = state.selection.main;
  if (sel.empty) return false;
  const text = state.sliceDoc(sel.from, sel.to);
  const result = fn(text);
  if (result === text) return false;
  view.dispatch({
    changes: { from: sel.from, to: sel.to, insert: result },
    selection: EditorSelection.range(sel.from, sel.from + result.length),
    userEvent: 'input.transform',
  });
  return true;
}
