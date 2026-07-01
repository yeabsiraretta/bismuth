/**
 * Highlight click extension for CodeMirror 6.
 *
 * Makes ==highlighted== text clickable. Clicking a highlight shows a small
 * popup with a "Remove Highlight" button that strips the surrounding == markers.
 */

import { ViewPlugin, EditorView } from '@codemirror/view';
import type { ViewUpdate } from '@codemirror/view';
import { log } from '@/utils/logger';

const HIGHLIGHT_RE = /==(.+?)==/g;

/** Find the ==...== range in the document that contains `pos`. */
function findHighlightAt(doc: string, pos: number): { from: number; to: number; text: string } | null {
  HIGHLIGHT_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = HIGHLIGHT_RE.exec(doc)) !== null) {
    const from = m.index;
    const to = from + m[0].length;
    // Content spans from+2 .. to-2 (inside the == markers)
    if (pos >= from + 2 && pos <= to - 2) {
      return { from, to, text: m[1] };
    }
  }
  return null;
}

export const highlightClickPlugin = ViewPlugin.fromClass(
  class {
    constructor(_view: EditorView) {}
    update(_update: ViewUpdate) {}
    destroy() {}
  },
  {
    eventHandlers: {
      mousedown(event: MouseEvent, view: EditorView) {
        const target = event.target as HTMLElement;
        if (!target.closest('.cm-lp-highlight') && !target.classList.contains('cm-lp-highlight')) return;

        const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
        if (pos === null) return;

        const docText = view.state.doc.toString();
        const hit = findHighlightAt(docText, pos);
        if (!hit) return;

        event.preventDefault();
        event.stopPropagation();

        view.dispatch({
          changes: { from: hit.from, to: hit.to, insert: hit.text },
          userEvent: 'delete.highlight',
        });
        log.debug('Highlight removed on click', { from: hit.from, to: hit.to });
      },
    },
  }
);

export const highlightClickTheme = EditorView.theme({
  '.cm-lp-highlight': {
    cursor: 'pointer',
    transition: 'background 0.15s ease',
  },
  '.cm-lp-highlight:hover': {
    background: 'var(--text-highlight-bg-hover, rgba(255, 208, 0, 0.6))',
  },
});
