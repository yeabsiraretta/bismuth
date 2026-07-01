/**
 * CodeMirror extension for rendering ```smiles fenced code blocks
 * as chemical structure diagrams.
 *
 * Pattern follows abcExtension.ts / dataviewExtension.ts.
 */

import { Decoration, ViewPlugin } from '@codemirror/view';
import type { DecorationSet, ViewUpdate, EditorView } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import { findSmilesBlocks, findInlineSmiles } from './smilesParser';
import { SmilesBlockWidget, SmilesInlineWidget, setChemWidgetConfig } from './smilesWidget';
import { onChemConfigChange, getChemConfig } from '../stores/chemStore';
import type { ChemConfig } from '../types';
import { DEFAULT_CHEM_CONFIG } from '../types';

let extensionConfig: ChemConfig = { ...DEFAULT_CHEM_CONFIG };
let listenerRegistered = false;

/** Update the rendering config for all SMILES widgets. */
export function updateSmilesExtensionConfig(config: ChemConfig): void {
  extensionConfig = config;
  setChemWidgetConfig(config);
}

/**
 * Creates the SMILES CodeMirror extension.
 * Renders chemical structures as live widgets below each ```smiles code block,
 * and optionally replaces inline SMILES syntax with rendered structures.
 */
export function smilesExtension() {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet = Decoration.none;

      constructor(private view: EditorView) {
        if (!listenerRegistered) {
          extensionConfig = getChemConfig();
          setChemWidgetConfig(extensionConfig);
          onChemConfigChange((config) => {
            updateSmilesExtensionConfig(config);
          });
          listenerRegistered = true;
        }
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

        // Block widgets
        const blocks = findSmilesBlocks(text);
        for (const block of blocks) {
          const widget = new SmilesBlockWidget(block.entries);
          builder.add(block.to, block.to, Decoration.widget({ widget, side: 1 }));
        }

        // Inline widgets
        if (extensionConfig.inlineEnabled) {
          const inlines = findInlineSmiles(text, extensionConfig.inlinePrefix);
          for (const inline of inlines) {
            const widget = new SmilesInlineWidget(inline.smiles);
            builder.add(inline.to, inline.to, Decoration.widget({ widget, side: 1 }));
          }
        }

        this.decorations = builder.finish();
      }
    },
    { decorations: (v) => v.decorations }
  );
}
