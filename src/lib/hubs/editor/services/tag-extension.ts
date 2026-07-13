import {
  Decoration,
  type DecorationSet,
  EditorView,
  type PluginValue,
  ViewPlugin,
  ViewUpdate,
} from '@codemirror/view';

const TAG_RE = /(?<=\s|^)#([a-zA-Z][\w/-]*)/g;

const tagMark = Decoration.mark({ class: 'cm-tag-mark' });

function buildDecorations(view: EditorView): DecorationSet {
  const decorations: { from: number; to: number }[] = [];
  for (const { from, to } of view.visibleRanges) {
    const text = view.state.doc.sliceString(from, to);
    let match: RegExpExecArray | null;
    TAG_RE.lastIndex = 0;
    while ((match = TAG_RE.exec(text)) !== null) {
      const start = from + match.index;
      const end = start + match[0].length;
      decorations.push({ from: start, to: end });
    }
  }
  return Decoration.set(
    decorations.map((d) => tagMark.range(d.from, d.to)),
    true
  );
}

class TagPluginValue implements PluginValue {
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

const tagPlugin = ViewPlugin.fromClass(TagPluginValue, {
  decorations: (v) => v.decorations,
});

function getTagFromTarget(target: HTMLElement): string | null {
  const el = target.closest('.cm-tag-mark');
  if (!el) return null;
  const text = el.textContent?.trim();
  return text ? text.replace(/^#/, '') : null;
}

const tagClickHandler = EditorView.domEventHandlers({
  click(event: MouseEvent) {
    const tag = getTagFromTarget(event.target as HTMLElement);
    if (!tag) return false;

    if (event.altKey || event.metaKey) {
      event.preventDefault();
      event.stopPropagation();
      window.dispatchEvent(new CustomEvent('tag-page:open', { detail: { tag } }));
    } else {
      window.dispatchEvent(new CustomEvent('tag-click', { detail: { tag } }));
    }
    return false;
  },
  contextmenu(event: MouseEvent) {
    const tag = getTagFromTarget(event.target as HTMLElement);
    if (!tag) return false;

    event.preventDefault();
    event.stopPropagation();
    window.dispatchEvent(
      new CustomEvent('tag-context', {
        detail: { tag, x: event.clientX, y: event.clientY },
      })
    );
    return true;
  },
});

const tagTheme = EditorView.baseTheme({
  '.cm-tag-mark': {
    color: 'var(--color-accent)',
    cursor: 'pointer',
    borderRadius: '3px',
    padding: '0 2px',
    background: 'color-mix(in srgb, var(--color-accent) 10%, transparent)',
  },
  '.cm-tag-mark:hover': {
    textDecoration: 'underline',
  },
});

export function tagExtension() {
  return [tagPlugin, tagClickHandler, tagTheme];
}
