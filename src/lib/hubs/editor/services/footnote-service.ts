import { EditorSelection } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';

const FN_REF_RE = /\[\^([^\]]+)\]/g;
const FN_DETAIL_RE = /^\[\^([^\]]+)\]:\s?/;
const FN_NUMBERED_RE = /\[\^(\d+)\]/g;

export interface FootnoteInfo {
  id: string;
  refPositions: number[];
  detailLine: number | null;
}

export function extractFootnotes(doc: string): FootnoteInfo[] {
  const map = new Map<string, FootnoteInfo>();

  let m: RegExpExecArray | null;
  const refRe = new RegExp(FN_REF_RE.source, 'g');
  while ((m = refRe.exec(doc)) !== null) {
    const lineStart = doc.lastIndexOf('\n', m.index - 1) + 1;
    const lineEnd = doc.indexOf('\n', m.index);
    const lineText = doc.substring(lineStart, lineEnd === -1 ? doc.length : lineEnd);
    if (FN_DETAIL_RE.test(lineText)) continue;
    const id = m[1];
    if (!map.has(id)) map.set(id, { id, refPositions: [], detailLine: null });
    map.get(id)!.refPositions.push(m.index);
  }

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

export function getFootnoteIds(doc: string): string[] {
  const ids = new Set<string>();
  const re = new RegExp(FN_REF_RE.source, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(doc)) !== null) {
    ids.add(m[1]);
  }
  return [...ids].sort();
}

function insertDetail(view: EditorView, id: string): number {
  const doc = view.state.doc;
  const text = doc.toString();
  const detailMarker = `[^${id}]: `;
  const insertAt = doc.length;
  let insert = '';

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

function findNearbyRef(view: EditorView, pos: number): string | null {
  const line = view.state.doc.lineAt(pos);
  const lineText = line.text;
  const col = pos - line.from;
  const re = /\[\^([^\]]+)\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(lineText)) !== null) {
    const start = m.index;
    const end = start + m[0].length;
    if (col >= start && col <= end) return m[1];
  }
  return null;
}

export function jumpToReference(view: EditorView, id: string): boolean {
  const doc = view.state.doc.toString();
  const marker = `[^${id}]`;
  const lines = doc.split('\n');

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

export function insertNumberedFootnote(view: EditorView): boolean {
  const doc = view.state.doc.toString();
  const cursor = view.state.selection.main.head;

  const cursorLine = view.state.doc.lineAt(cursor);
  const detailMatch = cursorLine.text.match(FN_DETAIL_RE);
  if (detailMatch) return jumpToReference(view, detailMatch[1]);

  const nearRef = findNearbyRef(view, cursor);
  if (nearRef) return jumpToDetail(view, nearRef);

  const idx = nextFootnoteIndex(doc);
  const marker = `[^${idx}]`;
  view.dispatch({
    changes: { from: cursor, insert: marker },
    userEvent: 'input.footnote',
  });
  insertDetail(view, String(idx));
  return true;
}

export function insertNamedFootnote(view: EditorView): boolean {
  const cursor = view.state.selection.main.head;

  const cursorLine = view.state.doc.lineAt(cursor);
  const detailMatch = cursorLine.text.match(FN_DETAIL_RE);
  if (detailMatch) return jumpToReference(view, detailMatch[1]);

  const nearRef = findNearbyRef(view, cursor);
  if (nearRef) {
    const lines = view.state.doc.toString().split('\n');
    const hasDetail = lines.some((l) => l.startsWith(`[^${nearRef}]: `));
    if (hasDetail) return jumpToDetail(view, nearRef);
    insertDetail(view, nearRef);
    return true;
  }

  const marker = '[^]';
  view.dispatch({
    changes: { from: cursor, insert: marker },
    selection: EditorSelection.cursor(cursor + 2),
    scrollIntoView: true,
    userEvent: 'input.footnote',
  });
  return true;
}
