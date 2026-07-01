/**
 * CodeMirror extension for rendering ```chords fenced code blocks
 * with highlighted chords, diagrams, transposition, and instrument switching.
 *
 * Follows the same ViewPlugin + WidgetType pattern as abcExtension.ts.
 */
import {
  Decoration,
  ViewPlugin,
} from '@codemirror/view';
import type { DecorationSet, ViewUpdate, EditorView } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import { findChordBlocks } from './chordParser';
import { ChordSheetWidget } from './chordWidget';
import type { ChordInstrument } from '../../types/chords';

/**
 * Creates the chord sheet CodeMirror extension.
 * Renders chord sheets with highlighted chords, diagrams, and controls
 * below each ```chords code block.
 */
export function chordSheetExtension(
  defaultInstrument: ChordInstrument = 'guitar',
  blockLanguage: string = 'chords',
) {
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
        const blocks = findChordBlocks(text, blockLanguage);

        for (const block of blocks) {
          const widget = new ChordSheetWidget(
            block,
            block.instrument ?? defaultInstrument,
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
