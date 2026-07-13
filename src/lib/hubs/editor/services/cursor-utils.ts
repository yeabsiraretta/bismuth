import type { EditorState } from '@codemirror/state';

export function cursorLineNumbers(state: EditorState): Set<number> {
  const lines = new Set<number>();
  for (const range of state.selection.ranges) {
    const start = state.doc.lineAt(range.from).number;
    const end = state.doc.lineAt(range.to).number;
    for (let l = start; l <= end; l++) lines.add(l);
  }
  return lines;
}

function cursorLineKey(state: EditorState): string {
  return state.selection.ranges
    .map((r) => {
      const sl = state.doc.lineAt(r.from).number;
      const el = state.doc.lineAt(r.to).number;
      return `${sl}-${el}`;
    })
    .join(',');
}

export function selectionCrossedLine(oldState: EditorState, newState: EditorState): boolean {
  return cursorLineKey(oldState) !== cursorLineKey(newState);
}
