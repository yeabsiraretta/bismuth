/**
 * Footnote CodeMirror extension — keybindings, autocomplete, and
 * click-to-jump behavior for markdown footnotes.
 *
 * Keybindings:
 *   Alt-0  → Insert/navigate auto-numbered footnote
 *   Alt--  → Insert/navigate named footnote
 *
 * Autocomplete:
 *   Typing [^ triggers footnote ID suggestions from existing footnotes.
 *
 * Click-to-jump:
 *   Clicking a rendered footnote ref in live preview jumps to its detail.
 */

import { keymap, type KeyBinding, ViewPlugin, type ViewUpdate, EditorView } from '@codemirror/view';
import {
  autocompletion,
  type CompletionContext,
  type CompletionResult,
} from '@codemirror/autocomplete';
import {
  insertNumberedFootnote,
  insertNamedFootnote,
  getFootnoteIds,
  jumpToDetail,
  jumpToReference,
} from '../services/footnoteService';

const FN_DETAIL_RE = /^\[\^([^\]]+)\]:\s?/;

/** Footnote autocomplete source — triggers on [^ */
function footnoteCompletions(context: CompletionContext): CompletionResult | null {
  const before = context.matchBefore(/\[\^[^\]]*$/);
  if (!before) return null;

  const prefix = before.text.slice(2); // after [^
  const doc = context.state.doc.toString();
  const ids = getFootnoteIds(doc);

  const options = ids
    .filter(id => id.toLowerCase().startsWith(prefix.toLowerCase()))
    .map(id => ({
      label: `[^${id}]`,
      apply: `[^${id}]`,
      type: 'text' as const,
      detail: 'footnote',
    }));

  if (options.length === 0) return null;

  return {
    from: before.from,
    options,
    validFor: /^\[\^[^\]]*$/,
  };
}

/** Click handler: clicking a footnote ref in live preview jumps to detail */
const footnoteClickPlugin = ViewPlugin.fromClass(
  class {
    constructor(readonly view: EditorView) {
      this.handleClick = this.handleClick.bind(this);
      view.dom.addEventListener('click', this.handleClick);
    }
    handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      // Check if clicking a rendered footnote ref (cm-lp-footnote-ref)
      if (!target.classList.contains('cm-lp-footnote-ref')) return;
      const id = target.textContent?.trim();
      if (!id) return;
      e.preventDefault();
      e.stopPropagation();

      // Check if we're in the detail section — if so, jump to ref
      const pos = this.view.posAtDOM(target);
      const line = this.view.state.doc.lineAt(pos);
      if (FN_DETAIL_RE.test(line.text)) {
        jumpToReference(this.view, id);
      } else {
        jumpToDetail(this.view, id);
      }
    }
    update(_update: ViewUpdate) { /* no-op */ }
    destroy() {
      this.view.dom.removeEventListener('click', this.handleClick);
    }
  }
);

export const footnoteKeymap: KeyBinding[] = [
  { key: 'Alt-0', run: insertNumberedFootnote },
  { key: 'Alt--', run: insertNamedFootnote },
];

/** Full footnote extension bundle: keybindings + autocomplete + click handler */
export function footnoteExtension() {
  return [
    keymap.of(footnoteKeymap),
    autocompletion({
      override: [footnoteCompletions],
      activateOnTyping: true,
    }),
    footnoteClickPlugin,
  ];
}
