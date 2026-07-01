/**
 * CodeMirror extension for rendering ```abc fenced code blocks as
 * sheet music notation using abcjs.
 *
 * Pattern follows dataviewExtension.ts — detects code blocks, creates
 * widget decorations after each block.
 */

import {
  Decoration,
  ViewPlugin,
} from '@codemirror/view';
import type { DecorationSet, ViewUpdate, EditorView } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import { findAbcBlocks } from './abcParser';
import { AbcNotationWidget } from './abcWidget';

/**
 * Creates the ABC notation CodeMirror extension.
 * Renders sheet music as live widgets below each ```abc code block.
 */
export function abcNotationExtension() {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet = Decoration.none;

      constructor(private view: EditorView) {
        this.computeDecorations();
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.computeDecorations();
        }
      }

      private computeDecorations() {
        const builder = new RangeSetBuilder<Decoration>();
        const text = this.view.state.doc.toString();
        const blocks = findAbcBlocks(text);

        for (const block of blocks) {
          const widget = new AbcNotationWidget(
            block.notation,
            block.options,
            block.optionsError,
          );
          builder.add(
            block.to,
            block.to,
            Decoration.widget({ widget, side: 1 }),
          );
        }

        this.decorations = builder.finish();
      }
    },
    { decorations: (v) => v.decorations },
  );
}
