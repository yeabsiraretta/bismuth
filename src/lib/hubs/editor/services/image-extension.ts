import { type EditorState, StateField } from '@codemirror/state';
import { Decoration, type DecorationSet, EditorView, WidgetType } from '@codemirror/view';

import { cursorLineNumbers, selectionCrossedLine } from '@/hubs/editor/services/cursor-utils';

const IMAGE_RE = /!\[([^\]]*)\]\(([^)]+)\)/g;

class ImageWidget extends WidgetType {
  constructor(
    readonly alt: string,
    readonly src: string,
    readonly sourceFrom: number
  ) {
    super();
  }

  toDOM(view: EditorView): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'cm-image-widget';

    const img = document.createElement('img');
    img.src = this.src;
    img.alt = this.alt;
    img.className = 'cm-image-preview';
    img.loading = 'lazy';

    img.addEventListener('error', () => {
      wrapper.classList.add('cm-image-error');
      img.style.display = 'none';
      const fallback = document.createElement('span');
      fallback.className = 'cm-image-fallback';
      fallback.textContent = `Image not found: ${this.alt || this.src}`;
      wrapper.appendChild(fallback);
    });

    wrapper.appendChild(img);

    if (this.alt) {
      const caption = document.createElement('span');
      caption.className = 'cm-image-caption';
      caption.textContent = this.alt;
      wrapper.appendChild(caption);
    }

    const srcFrom = this.sourceFrom;
    wrapper.addEventListener('click', (e) => {
      if (e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        view.dispatch({ selection: { anchor: srcFrom } });
        view.focus();
      }
    });

    return wrapper;
  }

  eq(other: ImageWidget): boolean {
    return this.src === other.src && this.alt === other.alt && this.sourceFrom === other.sourceFrom;
  }

  ignoreEvent(): boolean {
    return true;
  }
}

function buildDecorations(state: EditorState): DecorationSet {
  const activeLines = cursorLineNumbers(state);
  const doc = state.doc;
  const decos: { from: number; to: number; deco: Decoration }[] = [];

  for (let i = 1; i <= doc.lines; i++) {
    if (activeLines.has(i)) continue;
    const line = doc.line(i);
    IMAGE_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = IMAGE_RE.exec(line.text)) !== null) {
      const alt = match[1];
      const src = match[2];
      if (src.startsWith('http') || src.startsWith('/') || src.startsWith('.')) {
        const start = line.from + match.index;
        const end = start + match[0].length;
        const widget = new ImageWidget(alt, src, start);
        decos.push({ from: start, to: end, deco: Decoration.replace({ widget, block: true }) });
      }
    }
  }

  decos.sort((a, b) => a.from - b.from || a.to - b.to);
  return Decoration.set(
    decos.map((d) => d.deco.range(d.from, d.to)),
    true
  );
}

const imageField = StateField.define<DecorationSet>({
  create(state) {
    return buildDecorations(state);
  },
  update(value, tr) {
    if (tr.docChanged) return buildDecorations(tr.state);
    if (tr.selection && selectionCrossedLine(tr.startState, tr.state)) {
      return buildDecorations(tr.state);
    }
    return value;
  },
  provide: (f) => EditorView.decorations.from(f),
});

const imageTheme = EditorView.baseTheme({
  '.cm-image-widget': {
    display: 'block',
    textAlign: 'center' as string,
    padding: '8px 0',
    margin: '4px 0',
  },
  '.cm-image-preview': {
    maxWidth: '100%',
    maxHeight: '400px',
    borderRadius: '6px',
    border: '1px solid var(--color-border)',
    objectFit: 'contain',
  },
  '.cm-image-caption': {
    fontSize: '0.75rem',
    color: 'var(--color-text-subtle)',
    fontStyle: 'italic',
  },
  '.cm-image-fallback': {
    fontSize: '0.8rem',
    color: 'var(--color-text-subtle)',
    padding: '12px 16px',
    background: 'var(--color-surface)',
    border: '1px dashed var(--color-border)',
    borderRadius: '6px',
  },
});

export function imageExtension() {
  return [imageField, imageTheme];
}
