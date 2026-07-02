/**
 * CodeMirror extension for rendering ```audio-player fenced code blocks
 * as interactive audio players with waveform, controls, and bookmarks.
 *
 * Same ViewPlugin + WidgetType pattern as abcExtension and chordExtension.
 */
import { Decoration, ViewPlugin } from '@codemirror/view';
import type { DecorationSet, ViewUpdate, EditorView } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import { findAudioPlayerBlocks } from './audioPlayerParser';
import { AudioPlayerWidget } from './audioPlayerWidget';

/**
 * Creates the audio player CodeMirror extension.
 * Renders playable audio widgets below each ```audio-player code block.
 */
export function audioPlayerExtension() {
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
        const blocks = findAudioPlayerBlocks(text);

        for (const block of blocks) {
          const widget = new AudioPlayerWidget(block);
          builder.add(block.to, block.to, Decoration.widget({ widget, side: 1 }));
        }

        this.decorations = builder.finish();
      }
    },
    { decorations: (v) => v.decorations }
  );
}
