import {
  Decoration,
  type DecorationSet,
  EditorView,
  type PluginValue,
  ViewPlugin,
  type ViewUpdate,
} from '@codemirror/view';

// ── Patterns ─────────────────────────────────────────────────────────────────

const HIGHLIGHT_RE = /==(.*?)==/g;
const MARK_INLINE_RE = /<mark\s+style="background:\s*([^"]+)">([\s\S]*?)<\/mark>/g;
const MARK_CLASS_RE = /<mark\s+class="hltr-([^"]+)">([\s\S]*?)<\/mark>/g;
const MARK_PLAIN_RE = /<mark>([\s\S]*?)<\/mark>/g;

const defaultMark = Decoration.mark({ class: 'cm-highlight-mark' });

// ── Decoration builder ───────────────────────────────────────────────────────

function buildDecorations(view: EditorView): DecorationSet {
  const items: { from: number; to: number; deco: Decoration }[] = [];
  const seen = new Set<string>();

  for (const { from, to } of view.visibleRanges) {
    const text = view.state.doc.sliceString(from, to);
    let match: RegExpExecArray | null;

    HIGHLIGHT_RE.lastIndex = 0;
    while ((match = HIGHLIGHT_RE.exec(text)) !== null) {
      const start = from + match.index;
      const end = start + match[0].length;
      const key = `${start}:${end}`;
      if (!seen.has(key)) {
        seen.add(key);
        items.push({ from: start, to: end, deco: defaultMark });
      }
    }

    MARK_INLINE_RE.lastIndex = 0;
    while ((match = MARK_INLINE_RE.exec(text)) !== null) {
      const start = from + match.index;
      const end = start + match[0].length;
      const key = `${start}:${end}`;
      if (!seen.has(key)) {
        seen.add(key);
        const color = match[1].trim();
        items.push({
          from: start,
          to: end,
          deco: Decoration.mark({
            class: 'cm-highlight-mark',
            attributes: { style: `background: ${color}` },
          }),
        });
      }
    }

    MARK_CLASS_RE.lastIndex = 0;
    while ((match = MARK_CLASS_RE.exec(text)) !== null) {
      const start = from + match.index;
      const end = start + match[0].length;
      const key = `${start}:${end}`;
      if (!seen.has(key)) {
        seen.add(key);
        items.push({
          from: start,
          to: end,
          deco: Decoration.mark({ class: `cm-highlight-mark hltr-${match[1]}` }),
        });
      }
    }

    MARK_PLAIN_RE.lastIndex = 0;
    while ((match = MARK_PLAIN_RE.exec(text)) !== null) {
      const start = from + match.index;
      const end = start + match[0].length;
      const key = `${start}:${end}`;
      if (!seen.has(key)) {
        seen.add(key);
        items.push({ from: start, to: end, deco: defaultMark });
      }
    }
  }

  items.sort((a, b) => a.from - b.from);
  return Decoration.set(
    items.map((i) => i.deco.range(i.from, i.to)),
    true
  );
}

// ── Plugin ───────────────────────────────────────────────────────────────────

class HighlightPluginValue implements PluginValue {
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

const highlightPlugin = ViewPlugin.fromClass(HighlightPluginValue, {
  decorations: (v) => v.decorations,
});

const highlightTheme = EditorView.baseTheme({
  '.cm-highlight-mark': {
    backgroundColor: 'oklch(from var(--color-warning) l c h / 0.25)',
    color: 'var(--color-text)',
    borderRadius: '2px',
    padding: '0 1px',
  },
});

export function highlightExtension() {
  return [highlightPlugin, highlightTheme];
}
