import {
  Decoration,
  type DecorationSet,
  EditorView,
  type PluginValue,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from '@codemirror/view';

const WIKILINK_RE = /\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g;

class WikilinkWidget extends WidgetType {
  constructor(
    readonly target: string,
    readonly display: string
  ) {
    super();
  }

  toDOM(): HTMLElement {
    const span = document.createElement('span');
    span.className = 'cm-wikilink';
    span.textContent = this.display;
    span.title = this.target;
    span.dataset['target'] = this.target;
    span.setAttribute('role', 'link');
    span.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.dispatchEvent(new CustomEvent('wikilink-click', { detail: { target: this.target } }));
    });
    return span;
  }

  ignoreEvent(): boolean {
    return true;
  }

  eq(other: WikilinkWidget): boolean {
    return this.target === other.target && this.display === other.display;
  }
}

function buildDecorations(view: EditorView): DecorationSet {
  const widgets: { from: number; to: number; widget: WikilinkWidget }[] = [];
  for (const { from, to } of view.visibleRanges) {
    const text = view.state.doc.sliceString(from, to);
    let match: RegExpExecArray | null;
    WIKILINK_RE.lastIndex = 0;
    while ((match = WIKILINK_RE.exec(text)) !== null) {
      const idx = match.index;
      if (idx > 0 && text[idx - 1] === '!') continue;
      const start = from + idx;
      const end = start + match[0].length;
      const target = match[1].trim();
      const display = (match[2] ?? match[1]).trim();
      widgets.push({ from: start, to: end, widget: new WikilinkWidget(target, display) });
    }
  }
  return Decoration.set(
    widgets.map((w) => Decoration.replace({ widget: w.widget }).range(w.from, w.to)),
    true
  );
}

class WikilinkPluginValue implements PluginValue {
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

const wikilinkPlugin = ViewPlugin.fromClass(WikilinkPluginValue, {
  decorations: (v) => v.decorations,
});

const wikilinkClickHandler = EditorView.domEventHandlers({
  click(event: MouseEvent, view: EditorView) {
    const target = event.target as HTMLElement;
    if (target.classList.contains('cm-wikilink') && target.dataset['target']) {
      void view;
      window.dispatchEvent(
        new CustomEvent('wikilink-click', { detail: { target: target.dataset['target'] } })
      );
      event.preventDefault();
      return true;
    }
    return false;
  },
});

const wikilinkTheme = EditorView.baseTheme({
  '.cm-wikilink': {
    color: 'var(--color-accent)',
    cursor: 'pointer',
    textDecoration: 'underline',
    textDecorationStyle: 'dotted',
  },
  '.cm-wikilink:hover': {
    textDecorationStyle: 'solid',
  },
});

export function wikilinkExtension() {
  return [wikilinkPlugin, wikilinkClickHandler, wikilinkTheme];
}
