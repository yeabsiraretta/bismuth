/**
 * Auto-pair markdown syntax when text is selected.
 * Typing certain characters while text is selected wraps it with the pair.
 * Pairs: ** (bold), __ (underline), ` (code), [[ (wikilink)
 */

import { EditorView } from '@codemirror/view';
import { EditorSelection } from '@codemirror/state';

const PAIR_MAP: Record<string, { prefix: string; suffix: string }> = {
  '*': { prefix: '*', suffix: '*' },
  '_': { prefix: '_', suffix: '_' },
  '`': { prefix: '`', suffix: '`' },
  '[': { prefix: '[[', suffix: ']]' },
  '~': { prefix: '~~', suffix: '~~' },
  '=': { prefix: '==', suffix: '==' },
};

export const markdownAutoPair = EditorView.inputHandler.of(
  (view, _from, _to, text) => {
    // Only act when there's a selection (from !== to)
    const { state } = view;
    const mainRange = state.selection.main;
    if (mainRange.from === mainRange.to) return false;

    const pair = PAIR_MAP[text];
    if (!pair) return false;

    const selected = state.sliceDoc(mainRange.from, mainRange.to);
    if (!selected) return false;

    const replacement = `${pair.prefix}${selected}${pair.suffix}`;
    view.dispatch({
      changes: { from: mainRange.from, to: mainRange.to, insert: replacement },
      selection: EditorSelection.range(
        mainRange.from + pair.prefix.length,
        mainRange.from + pair.prefix.length + selected.length,
      ),
      userEvent: 'input.format.autopair',
    });
    return true;
  }
);
