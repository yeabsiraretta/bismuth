import {
  Decoration,
  type DecorationSet,
  EditorView,
  type PluginValue,
  ViewPlugin,
  ViewUpdate,
} from '@codemirror/view';

const STRIKE_RE = /~~(.+?)~~/g;

const strikeMark = Decoration.mark({ class: 'cm-strikethrough-mark' });

function buildDecorations(view: EditorView): DecorationSet {
  const decorations: { from: number; to: number }[] = [];
  for (const { from, to } of view.visibleRanges) {
    const text = view.state.doc.sliceString(from, to);
    let match: RegExpExecArray | null;
    STRIKE_RE.lastIndex = 0;
    while ((match = STRIKE_RE.exec(text)) !== null) {
      const start = from + match.index;
      const end = start + match[0].length;
      decorations.push({ from: start, to: end });
    }
  }
  return Decoration.set(
    decorations.map((d) => strikeMark.range(d.from, d.to)),
    true
  );
}

class StrikethroughPluginValue implements PluginValue {
  decorations: DecorationSet;

  constructor(view: EditorView) {
    this.decorations = buildDecorations(view);
  }

  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged) {
      this.decorations = buildDecorations(update.view);
    }
  }
}

const strikethroughPlugin = ViewPlugin.fromClass(StrikethroughPluginValue, {
  decorations: (v) => v.decorations,
});

const strikethroughTheme = EditorView.baseTheme({
  '.cm-strikethrough-mark': {
    textDecoration: 'line-through',
    color: 'var(--color-text-subtle)',
  },
});

export function strikethroughExtension() {
  return [strikethroughPlugin, strikethroughTheme];
}
