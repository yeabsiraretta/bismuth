/**
 * CodeMirror 6 Wikilink Extension
 *
 * Provides [[wikilink]] syntax decoration and click-to-navigate behavior.
 * Scans the document for `[[...]]` patterns and applies decorations.
 */

import {
  ViewPlugin,
  Decoration,
  EditorView,
} from '@codemirror/view';
import type { DecorationSet, ViewUpdate } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';

const WIKILINK_RE = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

function buildDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const doc = view.state.doc;

  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i);
    let match: RegExpExecArray | null;
    WIKILINK_RE.lastIndex = 0;

    while ((match = WIKILINK_RE.exec(line.text)) !== null) {
      const from = line.from + match.index;
      const to = from + match[0].length;

      builder.add(
        from,
        to,
        Decoration.mark({ class: 'cm-wikilink', attributes: { 'data-wikilink-title': match[1] } })
      );
    }
  }

  return builder.finish();
}

/**
 * Creates a wikilink ViewPlugin that decorates [[links]] and handles clicks.
 *
 * @param onWikilinkClick - Callback invoked with the wikilink title on click.
 */
export function wikilinkExtension(onWikilinkClick: (title: string) => void) {
  const plugin = ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = buildDecorations(view);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = buildDecorations(update.view);
        }
      }
    },
    {
      decorations: (instance: { decorations: DecorationSet }) => instance.decorations,
      eventHandlers: {
        click(event: MouseEvent, _view: EditorView) {
          const target = event.target as HTMLElement;
          if (target.classList.contains('cm-wikilink') || target.closest('.cm-wikilink')) {
            const el = target.classList.contains('cm-wikilink')
              ? target
              : (target.closest('.cm-wikilink') as HTMLElement);
            const title = el?.dataset['wikilinkTitle'];
            if (title) {
              event.preventDefault();
              onWikilinkClick(title);
            }
          }
        },
      },
    }
  );

  const theme = [
    EditorView.baseTheme({
      '.cm-wikilink': {
        color: 'var(--interactive-accent, #89b4fa)',
        cursor: 'pointer',
        textDecoration: 'none',
        borderBottom: '1px solid transparent',
        transition: 'border-color 0.15s',
      },
      '.cm-wikilink:hover': {
        borderBottomColor: 'var(--interactive-accent, #89b4fa)',
      },
    }),
  ];

  return [plugin, ...theme];
}
