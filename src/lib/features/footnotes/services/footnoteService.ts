/**
 * Footnote service — core logic for inserting, navigating, and managing
 * markdown footnotes in the editor.
 *
 * Supports:
 *   - Auto-numbered footnotes [^1], [^2], ...
 *   - Named footnotes [^name]
 *   - Jump between reference ↔ detail
 *   - Extract all existing footnote IDs from document
 *   - Optional section heading insertion
 */

import type { EditorView } from '@codemirror/view';
import { EditorSelection } from '@codemirror/state';

const FN_REF_RE = /\[\^([^\]]+)\]/g;
const FN_DETAIL_RE = /^\[\^([^\]]+)\]:\s?/;
const FN_NUMBERED_RE = /\[\^(\d+)\]/g;

export interface FootnoteInfo {
  id: string;
  refPositions: number[];
  detailLine: number | null;
}

/** Extract all footnote IDs present in the document. */
export function extractFootnotes(doc: string): FootnoteInfo[] {
  const map = new Map<string, FootnoteInfo>();

  // Find all references
  let m: RegExpExecArray | null;
  const refRe = new RegExp(FN_REF_RE.source, 'g');
  while ((m = refRe.exec(doc)) !== null) {
    const lineStart = doc.lastIndexOf('\n', m.index - 1) + 1;
    const lineEnd = doc.indexOf('\n', m.index);
    const lineText = doc.substring(lineStart, lineEnd === -1 ? doc.length : lineEnd);
    // Skip detail lines
    if (FN_DETAIL_RE.test(lineText)) continue;
    const id = m[1];
    if (!map.has(id)) map.set(id, { id, refPositions: [], detailLine: null });
    map.get(id)!.refPositions.push(m.index);
  }

  // Find all detail definitions
  const lines = doc.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const dm = lines[i].match(FN_DETAIL_RE);
    if (dm) {
      const id = dm[1];
      if (!map.has(id)) map.set(id, { id, refPositions: [], detailLine: null });
      map.get(id)!.detailLine = i;
    }
  }

  return [...map.values()];
}

/** Find the next available numbered footnote index. */
export function nextFootnoteIndex(doc: string): number {
  const used = new Set<number>();
  let m: RegExpExecArray | null;
  const re = new RegExp(FN_NUMBERED_RE.source, 'g');
  while ((m = re.exec(doc)) !== null) {
    used.add(parseInt(m[1], 10));
  }
  let n = 1;
  while (used.has(n)) n++;
  return n;
}

/** Get the footnote section heading text (empty string = disabled). */
export function getFootnoteSectionHeading(): string {
  try {
    const stored = localStorage.getItem('bismuth-footnote-heading');
    return stored ?? '';
  } catch {
    return '';
  }
}

export function setFootnoteSectionHeading(heading: string): void {
  try {
    localStorage.setItem('bismuth-footnote-heading', heading);
  } catch {
    /* noop */
  }
}

/**
 * Insert footnote detail at the bottom of the document.
 * Adds a section heading if configured and not already present.
 * Returns the cursor position at the end of the detail marker.
 */
function insertDetail(view: EditorView, id: string): number {
  const doc = view.state.doc;
  const text = doc.toString();
  const heading = getFootnoteSectionHeading();
  const detailMarker = `[^${id}]: `;

  let insertAt = doc.length;
  let insert = '';

  // Check if we need the heading
  if (heading && !text.includes(heading)) {
    insert += '\n\n' + heading + '\n';
  }

  // Ensure blank line before detail
  const lastChar = text.charAt(text.length - 1);
  if (lastChar !== '\n') insert += '\n';
  const secondLast = text.charAt(text.length - 2);
  if (lastChar === '\n' && secondLast !== '\n') insert += '\n';

  insert += detailMarker;

  view.dispatch({
    changes: { from: insertAt, insert },
    selection: EditorSelection.cursor(insertAt + insert.length),
    scrollIntoView: true,
    userEvent: 'input.footnote',
  });

  return insertAt + insert.length;
}

/** Insert an auto-numbered footnote at the cursor position. */
export function insertNumberedFootnote(view: EditorView): boolean {
  const doc = view.state.doc.toString();
  const cursor = view.state.selection.main.head;

  // If cursor is on a detail line, jump to the reference
  const cursorLine = view.state.doc.lineAt(cursor);
  const detailMatch = cursorLine.text.match(FN_DETAIL_RE);
  if (detailMatch) {
    return jumpToReference(view, detailMatch[1]);
  }

  // If cursor is on/next-to a reference, jump to the detail
  const nearRef = findNearbyRef(view, cursor);
  if (nearRef) {
    return jumpToDetail(view, nearRef);
  }

  // Insert new numbered footnote
  const idx = nextFootnoteIndex(doc);
  const marker = `[^${idx}]`;

  // Insert reference at cursor, then detail at bottom
  view.dispatch({
    changes: { from: cursor, insert: marker },
    userEvent: 'input.footnote',
  });

  // After inserting ref, insert detail at bottom
  insertDetail(view, String(idx));
  return true;
}

/** Insert a named footnote at the cursor position. */
export function insertNamedFootnote(view: EditorView): boolean {
  const cursor = view.state.selection.main.head;

  // If cursor is on a detail line, jump to the reference
  const cursorLine = view.state.doc.lineAt(cursor);
  const detailMatch = cursorLine.text.match(FN_DETAIL_RE);
  if (detailMatch) {
    return jumpToReference(view, detailMatch[1]);
  }

  // If cursor is inside [^name] (with content), create the detail
  const nearRef = findNearbyRef(view, cursor);
  if (nearRef) {
    // Check if detail already exists
    const lines = view.state.doc.toString().split('\n');
    const hasDetail = lines.some((l) => l.startsWith(`[^${nearRef}]: `));
    if (hasDetail) {
      return jumpToDetail(view, nearRef);
    }
    insertDetail(view, nearRef);
    return true;
  }

  // Insert empty [^] placeholder for user to type name
  const marker = '[^]';
  view.dispatch({
    changes: { from: cursor, insert: marker },
    selection: EditorSelection.cursor(cursor + 2), // between ^ and ]
    scrollIntoView: true,
    userEvent: 'input.footnote',
  });
  return true;
}

/** Find a footnote reference ID near the cursor position. */
function findNearbyRef(view: EditorView, pos: number): string | null {
  const line = view.state.doc.lineAt(pos);
  const lineText = line.text;
  const col = pos - line.from;

  // Search for [^...] patterns in the line
  const re = /\[\^([^\]]+)\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(lineText)) !== null) {
    const start = m.index;
    const end = start + m[0].length;
    // Cursor is within or immediately adjacent to the reference
    if (col >= start && col <= end) {
      return m[1];
    }
  }
  return null;
}

/** Jump from a footnote detail line to the first reference occurrence. */
export function jumpToReference(view: EditorView, id: string): boolean {
  const doc = view.state.doc.toString();
  const marker = `[^${id}]`;
  const lines = doc.split('\n');

  // Find first occurrence that is NOT a detail line
  let offset = 0;
  for (const line of lines) {
    if (!FN_DETAIL_RE.test(line)) {
      const idx = line.indexOf(marker);
      if (idx !== -1) {
        const target = offset + idx + marker.length;
        view.dispatch({
          selection: EditorSelection.cursor(target),
          scrollIntoView: true,
        });
        view.focus();
        return true;
      }
    }
    offset += line.length + 1;
  }
  return false;
}

/** Jump from a footnote reference to its detail definition. */
export function jumpToDetail(view: EditorView, id: string): boolean {
  const doc = view.state.doc.toString();
  const detailPrefix = `[^${id}]: `;
  const lines = doc.split('\n');

  let offset = 0;
  for (const line of lines) {
    if (line.startsWith(detailPrefix)) {
      const target = offset + detailPrefix.length;
      view.dispatch({
        selection: EditorSelection.cursor(target),
        scrollIntoView: true,
      });
      view.focus();
      return true;
    }
    offset += line.length + 1;
  }
  return false;
}

/** Get all footnote IDs for autocomplete suggestions. */
export function getFootnoteIds(doc: string): string[] {
  const ids = new Set<string>();
  const re = new RegExp(FN_REF_RE.source, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(doc)) !== null) {
    ids.add(m[1]);
  }
  return [...ids].sort();
}
