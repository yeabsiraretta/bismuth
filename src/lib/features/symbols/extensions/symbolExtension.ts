/**
 * CodeMirror extension for live symbol prettification.
 *
 * Listens for text input transactions and checks whether the text
 * ending at the cursor matches a symbol trigger. If so, replaces
 * the trigger with its Unicode equivalent in the same transaction.
 *
 * Skips replacement inside code blocks and inline code.
 */

import { EditorView } from '@codemirror/view';
import { EditorSelection } from '@codemirror/state';
import type { Extension } from '@codemirror/state';
import { syntaxTree } from '@codemirror/language';
import { findMatch } from '../services/prettifier';
import { getRules, isEnabled } from '../stores/symbolStore';

/** Check if the cursor is inside a code block or inline code. */
function isInsideCode(view: EditorView, pos: number): boolean {
  try {
    const tree = syntaxTree(view.state);
    let node = tree.resolveInner(pos, -1);
    while (node) {
      const name = node.type.name.toLowerCase();
      if (name.includes('codeblock') || name.includes('codetext') ||
          name.includes('fencedcode') || name.includes('inlinecode') ||
          name === 'codemark') {
        return true;
      }
      if (!node.parent || node.parent === node) break;
      node = node.parent;
    }
  } catch {
    // Syntax tree may not be available
  }
  return false;
}

/**
 * The symbol prettifier extension.
 * Returns an array of CodeMirror extensions to include in the editor.
 */
export function symbolPrettifierExtension(): Extension {
  return EditorView.inputHandler.of((view, from, to, inserted) => {
    if (!isEnabled()) return false;
    if (!inserted || inserted.length > 2) return false;

    // Don't prettify inside code
    if (isInsideCode(view, from)) return false;

    const rules = getRules();
    if (rules.length === 0) return false;

    // Get the text before the cursor on the current line
    const line = view.state.doc.lineAt(from);
    const textBefore = view.state.sliceDoc(line.from, from);

    // Character after insertion point (for word boundary check)
    const charAfter = to < view.state.doc.length ? view.state.sliceDoc(to, to + 1) : '';

    const match = findMatch(textBefore, inserted, rules, charAfter);
    if (!match) return false;

    // Calculate positions in the document
    const replaceFrom = line.from + match.triggerStart;
    const replaceTo = from + inserted.length;

    // Dispatch the replacement
    view.dispatch({
      changes: { from: replaceFrom, to: replaceTo, insert: match.replacement },
      selection: EditorSelection.cursor(replaceFrom + match.replacement.length),
      userEvent: 'input.symbol-prettify',
    });

    return true;
  });
}
