/**
 * CodeMirror extension for interactive cloze deletions.
 *
 * Replaces cloze patterns (==text==, {text}, **bold**, <u>underlined</u>,
 * custom spans) with clickable toggle widgets in live preview.
 *
 * Pattern follows abcExtension.ts / smilesExtension.ts.
 */

import {
  Decoration,
  ViewPlugin,
  EditorView,
} from '@codemirror/view';
import type { DecorationSet, ViewUpdate } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import { findClozes, noteHasTag } from './clozeService';
import { InteractiveClozeWidget } from './clozeWidget';
import { getClozeConfig } from '../stores/clozeStore';
import { getAllClozesRevealed } from '../stores/clozeStore';

/**
 * Creates the interactive cloze CodeMirror extension.
 * Replaces cloze patterns with clickable toggle blanks.
 */
export function clozeExtension() {
  const plugin = ViewPlugin.fromClass(
    class {
      decorations: DecorationSet = Decoration.none;
      private handleToggle: () => void;

      constructor(private view: EditorView) {
        this.computeDecorations();
        this.handleToggle = () => this.computeDecorations();
        window.addEventListener('cloze-toggle-all', this.handleToggle);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.computeDecorations();
        }
      }

      destroy() {
        window.removeEventListener('cloze-toggle-all', this.handleToggle);
      }

      private computeDecorations() {
        const config = getClozeConfig();
        if (!config.enabled) {
          this.decorations = Decoration.none;
          return;
        }

        const text = this.view.state.doc.toString();

        // Check required tag
        if (config.requiredTag && !noteHasTag(text, config.requiredTag)) {
          this.decorations = Decoration.none;
          return;
        }

        const globalRevealed = getAllClozesRevealed();
        const builder = new RangeSetBuilder<Decoration>();
        const lines = text.split('\n');
        let offset = 0;

        for (const line of lines) {
          const clozes = findClozes(line, config.autoConvert);
          for (const cloze of clozes) {
            const from = offset + cloze.from;
            const to = offset + cloze.to;
            const widget = new InteractiveClozeWidget(
              cloze.text,
              cloze.hint,
              config,
              globalRevealed,
            );
            builder.add(from, to, Decoration.replace({ widget }));
          }
          offset += line.length + 1; // +1 for newline
        }

        this.decorations = builder.finish();
      }
    },
    { decorations: (v) => v.decorations },
  );

  return [plugin, clozeTheme];
}

// ─── Theme ─────────────────────────────────────────────────────────────────────

const clozeTheme = EditorView.theme({
  '.cm-cloze-interactive': {
    cursor: 'pointer',
    borderRadius: '3px',
    padding: '0 4px',
    transition: 'all 0.15s ease',
    userSelect: 'none',
  },
  '.cm-cloze-hidden': {
    background: 'var(--cloze-underline-color, var(--background-modifier-border))',
    color: 'var(--cloze-hint-color, var(--text-faint))',
    fontSize: 'var(--cloze-hint-font-size, inherit)',
    borderBottom: 'var(--cloze-underline-width, 2px) var(--cloze-underline-style, dashed) var(--cloze-underline-color, rgba(245, 158, 11, 0.5))',
    fontFamily: 'var(--font-monospace)',
  },
  '.cm-cloze-hidden:hover': {
    background: 'rgba(245, 158, 11, 0.2)',
  },
  '.cm-cloze-hidden[data-cloze-hover]:hover::after': {
    content: 'attr(data-cloze-hover)',
    position: 'absolute',
    bottom: '100%',
    left: '0',
    padding: '4px 8px',
    background: 'var(--background-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: '4px',
    fontSize: '12px',
    color: 'var(--text-normal)',
    whiteSpace: 'nowrap',
    zIndex: '100',
    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
  },
  '.cm-cloze-revealed': {
    background: 'rgba(245, 158, 11, 0.15)',
    borderBottom: '2px solid rgba(245, 158, 11, 0.6)',
    fontWeight: '500',
  },
});
