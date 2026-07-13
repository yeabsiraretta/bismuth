import { type CompletionContext, type CompletionResult } from '@codemirror/autocomplete';
import { EditorView, type KeyBinding, keymap, ViewPlugin, type ViewUpdate } from '@codemirror/view';

import {
  getFootnoteIds,
  insertNamedFootnote,
  insertNumberedFootnote,
  jumpToDetail,
  jumpToReference,
} from '@/hubs/editor/services/footnote-service';

const FN_DETAIL_RE = /^\[\^([^\]]+)\]:\s?/;

function footnoteCompletions(context: CompletionContext): CompletionResult | null {
  const before = context.matchBefore(/\[\^[^\]]*$/);
  if (!before) return null;

  const prefix = before.text.slice(2);
  const doc = context.state.doc.toString();
  const ids = getFootnoteIds(doc);

  const options = ids
    .filter((id) => id.toLowerCase().startsWith(prefix.toLowerCase()))
    .map((id) => ({
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

const footnoteClickPlugin = ViewPlugin.fromClass(
  class {
    private boundClick: (e: MouseEvent) => void;
    constructor(readonly view: EditorView) {
      this.boundClick = this.handleClick.bind(this);
      view.dom.addEventListener('click', this.boundClick);
    }
    handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.classList.contains('cm-lp-footnote-ref')) return;
      const id = target.textContent?.trim();
      if (!id) return;
      e.preventDefault();
      e.stopPropagation();

      const pos = this.view.posAtDOM(target);
      const line = this.view.state.doc.lineAt(pos);
      if (FN_DETAIL_RE.test(line.text)) {
        jumpToReference(this.view, id);
      } else {
        jumpToDetail(this.view, id);
      }
    }
    update(_update: ViewUpdate) {
      /* no-op */
    }
    destroy() {
      this.view.dom.removeEventListener('click', this.boundClick);
    }
  }
);

const footnoteKeymap: KeyBinding[] = [
  { key: 'Alt-0', run: insertNumberedFootnote },
  { key: 'Alt--', run: insertNamedFootnote },
];

export { footnoteCompletions };

export function footnoteExtension() {
  return [keymap.of(footnoteKeymap), footnoteClickPlugin];
}
