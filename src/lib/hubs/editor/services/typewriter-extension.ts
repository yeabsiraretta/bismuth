import { EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view';

class TypewriterPluginValue {
  private view: EditorView;
  private offset: number;
  private keyboardOnly: boolean;
  private lastTriggeredByKeyboard = false;

  constructor(view: EditorView, offset: number, keyboardOnly: boolean) {
    this.view = view;
    this.offset = offset;
    this.keyboardOnly = keyboardOnly;
  }

  update(update: ViewUpdate) {
    if (!update.selectionSet && !update.docChanged) return;

    if (update.transactions.some((t) => t.isUserEvent('input') || t.isUserEvent('delete'))) {
      this.lastTriggeredByKeyboard = true;
    } else if (update.transactions.some((t) => t.isUserEvent('select.pointer'))) {
      this.lastTriggeredByKeyboard = false;
    }

    if (this.keyboardOnly && !this.lastTriggeredByKeyboard) return;

    this.scrollCursorToCenter();
  }

  private scrollCursorToCenter() {
    const head = this.view.state.selection.main.head;
    const coords = this.view.coordsAtPos(head);
    if (!coords) return;

    const scroller = this.view.scrollDOM;
    const scrollerRect = scroller.getBoundingClientRect();
    const targetY = scrollerRect.top + scrollerRect.height * this.offset;
    const delta = coords.top - targetY;

    if (Math.abs(delta) > 2) {
      scroller.scrollBy({ top: delta, behavior: 'smooth' });
    }
  }
}

export function typewriterExtension(offset = 0.5, keyboardOnly = true) {
  return ViewPlugin.define((view) => new TypewriterPluginValue(view, offset, keyboardOnly));
}

export const typewriterTheme = EditorView.baseTheme({
  '.cm-scroller': {
    scrollBehavior: 'smooth',
  },
});
