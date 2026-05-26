import { ViewPlugin, Decoration, EditorView, ViewUpdate } from '@codemirror/view';
import type { DecorationSet } from '@codemirror/view';
import { Range } from '@codemirror/state';

const wikilinkRegex = /\[\[([^\]]+)\]\]/g;

class WikilinkPlugin {
  decorations: DecorationSet;

  constructor(view: EditorView) {
    this.decorations = this.buildDecorations(view);
  }

  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged) {
      this.decorations = this.buildDecorations(update.view);
    }
  }

  buildDecorations(view: EditorView): DecorationSet {
    const decorations: Range<Decoration>[] = [];
    const doc = view.state.doc;

    for (let i = 1; i <= doc.lines; i++) {
      const line = doc.line(i);
      const text = line.text;
      let match: RegExpExecArray | null;

      wikilinkRegex.lastIndex = 0;
      while ((match = wikilinkRegex.exec(text)) !== null) {
        const from = line.from + match.index;
        const to = from + match[0].length;

        decorations.push(
          Decoration.mark({
            class: 'cm-wikilink',
            attributes: {
              'data-wikilink': match[1],
            },
          }).range(from, to)
        );
      }
    }

    return Decoration.set(decorations);
  }
}

export const wikilinkPlugin = ViewPlugin.fromClass(WikilinkPlugin, {
  decorations: (v) => v.decorations,
});

export const wikilinkClickHandler = EditorView.domEventHandlers({
  click: (event, view) => {
    const target = event.target as HTMLElement;

    if (target.classList.contains('cm-wikilink')) {
      const wikilinkText = target.getAttribute('data-wikilink');

      if (wikilinkText) {
        event.preventDefault();

        const customEvent = new CustomEvent('wikilink-click', {
          detail: { target: wikilinkText },
          bubbles: true,
          composed: true,
        });

        view.dom.dispatchEvent(customEvent);
      }
    }
  },
});

export const wikilinkTheme = EditorView.baseTheme({
  '.cm-wikilink': {
    color: 'var(--interactive-accent)',
    cursor: 'pointer',
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
});
