/**
 * CodeMirror extension for rendering ```dataview fenced code blocks.
 *
 * Detects dataview code blocks, parses the DQL query, executes it
 * against the vault-wide dataview index, and renders results as
 * widget decorations below the code block.
 *
 * Pattern follows taskQueryExtension.ts.
 */

import {
  Decoration,
  EditorView,
  ViewPlugin,
} from '@codemirror/view';
import type { DecorationSet, ViewUpdate } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import { DataviewResultWidget } from '@/features/dataview/extensions/dataviewWidgets';
import { runDataviewQuery } from '@/features/dataview/stores/dataviewStore';
import type { DvResult } from '@/features/dataview/types/dataview';
import { log } from '@/utils/logger';

interface DataviewBlock {
  from: number;
  to: number;
  query: string;
}

/** Find all ```dataview ... ``` fenced code blocks. */
function findDataviewBlocks(view: EditorView): DataviewBlock[] {
  const blocks: DataviewBlock[] = [];
  const text = view.state.doc.toString();
  const regex = /^```dataview\s*\n([\s\S]*?)^```/gm;
  let match;

  while ((match = regex.exec(text)) !== null) {
    blocks.push({
      from: match.index,
      to: match.index + match[0].length,
      query: match[1].trim(),
    });
  }

  return blocks;
}

/**
 * Creates the Dataview CodeMirror extension.
 * Renders query results as live widgets below each ```dataview code block.
 */
export function dataviewExtension() {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet = Decoration.none;
      private results = new Map<string, DvResult | string>();
      private pending = new Set<string>();

      constructor(private view: EditorView) {
        this.computeDecorations();
        this.executeQueries();
      }

      update(update: ViewUpdate) {
        if (update.docChanged) {
          this.computeDecorations();
          this.executeQueries();
        }
      }

      private computeDecorations() {
        const builder = new RangeSetBuilder<Decoration>();
        const blocks = findDataviewBlocks(this.view);

        for (const block of blocks) {
          const widget = new DataviewResultWidget(block.query);
          const cached = this.results.get(block.query);
          if (cached) {
            if (typeof cached === 'string') {
              widget.setError(cached);
            } else {
              widget.setResult(cached);
            }
          }
          builder.add(
            block.to,
            block.to,
            Decoration.widget({ widget, side: 1 }),
          );
        }

        this.decorations = builder.finish();
      }

      private async executeQueries() {
        const blocks = findDataviewBlocks(this.view);
        for (const block of blocks) {
          if (this.results.has(block.query) || this.pending.has(block.query)) continue;
          this.pending.add(block.query);
          try {
            const result = runDataviewQuery(block.query);
            this.results.set(block.query, result);
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            this.results.set(block.query, msg);
            log.warn('Dataview query failed', { query: block.query, error: msg });
          } finally {
            this.pending.delete(block.query);
          }
          this.computeDecorations();
          this.view.dispatch({});
        }
      }
    },
    { decorations: (v) => v.decorations },
  );
}
