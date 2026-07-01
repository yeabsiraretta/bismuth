/**
 * CodeMirror extension for rendering ```progressbar fenced code blocks
 * as visual progress bars. Same ViewPlugin + WidgetType pattern as other
 * fenced block extensions (abc, chords, audio-player).
 */
import {
  Decoration, EditorView,
  ViewPlugin,
} from '@codemirror/view';
import type { DecorationSet, ViewUpdate } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import { findProgressBarBlocks } from './progressbarParser';
import { ProgressBarWidget } from './progressbarWidget';

/**
 * Creates the progressbar CodeMirror extension.
 * Includes the ViewPlugin for block detection and the theme for styling.
 */
export function progressBarExtension() {
  const plugin = ViewPlugin.fromClass(
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
        const blocks = findProgressBarBlocks(text);

        for (const block of blocks) {
          const widget = new ProgressBarWidget(block);
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

  return [plugin, progressBarTheme];
}

/** Theme styles for progress bar widgets */
const progressBarTheme = EditorView.baseTheme({
  '.cm-progressbar-widget': {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '8px 12px',
    margin: '4px 0',
    borderRadius: '6px',
    background: 'var(--background-secondary, #1e1e2e)',
    border: '1px solid var(--background-modifier-border, #313244)',
    fontFamily: 'var(--font-interface)',
  },
  '.cm-progressbar-label-row': {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  '.cm-progressbar-label': {
    fontSize: '12px',
    fontWeight: '500',
    color: 'var(--text-normal, #cdd6f4)',
  },
  '.cm-progressbar-pct': {
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--text-muted, #a6adc8)',
  },
  '.cm-progressbar-bar': {
    width: '100%',
    height: '10px',
    borderRadius: '5px',
    background: 'var(--background-modifier-border, #45475a)',
    overflow: 'hidden',
  },
  '.cm-progressbar-fill': {
    height: '100%',
    borderRadius: '5px',
    transition: 'width 0.3s ease',
  },
  '.cm-progressbar-fill-low': {
    background: 'var(--color-red, #f38ba8)',
  },
  '.cm-progressbar-fill-mid': {
    background: 'var(--color-yellow, #f9e2af)',
  },
  '.cm-progressbar-fill-high': {
    background: 'var(--color-green, #a6e3a1)',
  },
  '.cm-progressbar-detail': {
    fontSize: '10px',
    color: 'var(--text-faint, #6c7086)',
    textAlign: 'right',
  },
  '.cm-progressbar-buttons': {
    display: 'flex',
    gap: '6px',
    justifyContent: 'center',
    marginTop: '2px',
  },
  '.cm-progressbar-btn': {
    padding: '2px 12px',
    border: '1px solid var(--background-modifier-border, #45475a)',
    borderRadius: '4px',
    background: 'var(--background-primary, #1e1e2e)',
    color: 'var(--text-normal, #cdd6f4)',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    lineHeight: '1.2',
    '&:hover': {
      background: 'var(--background-modifier-hover, #313244)',
    },
  },
});
