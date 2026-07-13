import {
  Decoration,
  type DecorationSet,
  EditorView,
  type PluginValue,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from '@codemirror/view';

const CHECKBOX_RE = /^(\s*[-*+]\s)\[( |x)\]/gm;

class CheckboxWidget extends WidgetType {
  constructor(
    readonly checked: boolean,
    readonly pos: number
  ) {
    super();
  }

  toDOM(): HTMLElement {
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = this.checked;
    input.className = 'cm-checkbox-widget';
    input.setAttribute('aria-label', this.checked ? 'Completed task' : 'Pending task');
    return input;
  }

  eq(other: CheckboxWidget): boolean {
    return this.checked === other.checked;
  }

  ignoreEvent(): boolean {
    return false;
  }
}

function buildDecorations(view: EditorView): DecorationSet {
  const widgets: { from: number; to: number; widget: CheckboxWidget }[] = [];
  const doc = view.state.doc;

  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i);
    CHECKBOX_RE.lastIndex = 0;
    const match = CHECKBOX_RE.exec(line.text);
    if (match) {
      const checked = match[2] === 'x';
      const bracketStart = line.from + match[1].length;
      const bracketEnd = bracketStart + 3;
      widgets.push({
        from: bracketStart,
        to: bracketEnd,
        widget: new CheckboxWidget(checked, bracketStart),
      });
    }
  }

  return Decoration.set(
    widgets.map((w) => Decoration.replace({ widget: w.widget }).range(w.from, w.to)),
    true
  );
}

class CheckboxPluginValue implements PluginValue {
  decorations: DecorationSet;

  constructor(view: EditorView) {
    this.decorations = buildDecorations(view);
  }

  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged) {
      this.decorations = buildDecorations(update.view);
    }
  }
}

const checkboxPlugin = ViewPlugin.fromClass(CheckboxPluginValue, {
  decorations: (v) => v.decorations,
});

const checkboxClickHandler = EditorView.domEventHandlers({
  mousedown(event: MouseEvent, view: EditorView) {
    const target = event.target as HTMLElement;
    if (!(target instanceof HTMLInputElement) || !target.classList.contains('cm-checkbox-widget')) {
      return false;
    }

    event.preventDefault();
    const pos = view.posAtDOM(target);
    const line = view.state.doc.lineAt(pos);
    CHECKBOX_RE.lastIndex = 0;
    const match = CHECKBOX_RE.exec(line.text);
    if (!match) return false;

    const bracketStart = line.from + match[1].length;
    const isChecked = match[2] === 'x';
    const replacement = isChecked ? '[ ]' : '[x]';

    view.dispatch({
      changes: { from: bracketStart, to: bracketStart + 3, insert: replacement },
    });

    return true;
  },
});

const checkboxTheme = EditorView.baseTheme({
  '.cm-checkbox-widget': {
    cursor: 'pointer',
    verticalAlign: 'middle',
    marginRight: '4px',
    width: '14px',
    height: '14px',
    accentColor: 'var(--color-accent)',
  },
});

export function checkboxExtension() {
  return [checkboxPlugin, checkboxClickHandler, checkboxTheme];
}
