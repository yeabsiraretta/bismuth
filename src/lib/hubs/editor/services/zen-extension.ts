import { type EditorState, StateField } from '@codemirror/state';
import { Decoration, type DecorationSet, EditorView } from '@codemirror/view';

import { selectionCrossedLine } from '@/hubs/editor/services/cursor-utils';

const dimDecoration = Decoration.line({ class: 'cm-zen-dim' });

function buildZenDecorations(state: EditorState, visibleLines: number): DecorationSet {
  const cursorLine = state.doc.lineAt(state.selection.main.head).number;
  const totalLines = state.doc.lines;
  const decorations: { from: number; decoration: Decoration }[] = [];

  for (let i = 1; i <= totalLines; i++) {
    if (Math.abs(i - cursorLine) > visibleLines) {
      decorations.push({ from: state.doc.line(i).from, decoration: dimDecoration });
    }
  }

  return Decoration.set(
    decorations.map((d) => d.decoration.range(d.from)),
    true
  );
}

export function zenExtension(visibleLines = 5, dimOpacity = 0.25) {
  const zenField = StateField.define<DecorationSet>({
    create(state) {
      return buildZenDecorations(state, visibleLines);
    },
    update(value, tr) {
      if (tr.docChanged) return buildZenDecorations(tr.state, visibleLines);
      if (tr.selection && selectionCrossedLine(tr.startState, tr.state)) {
        return buildZenDecorations(tr.state, visibleLines);
      }
      return value;
    },
    provide: (f) => EditorView.decorations.from(f),
  });

  return [
    zenField,
    EditorView.baseTheme({
      '.cm-zen-dim': {
        opacity: String(dimOpacity),
        transition: 'opacity 0.2s ease',
      },
    }),
  ];
}
