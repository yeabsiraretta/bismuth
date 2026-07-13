import {
  Decoration,
  type DecorationSet,
  EditorView,
  type PluginValue,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from '@codemirror/view';

const FENCE_OPEN_RE = /^(`{3,}|~{3,})(\w*)/;
const WIDGET_LANGS = new Set(['tree', 'folder', 'directory', 'filetree', 'tasks', 'dataview']);
const FENCE_CLOSE = /^(`{3,}|~{3,})\s*$/;

class CodeBlockControlsWidget extends WidgetType {
  constructor(
    readonly code: string,
    readonly lang: string
  ) {
    super();
  }

  toDOM(): HTMLElement {
    const wrapper = document.createElement('span');
    wrapper.className = 'cm-codeblock-controls';

    // ── Toggle button ──
    const toggle = document.createElement('button');
    toggle.className = 'cm-codeblock-toggle';
    toggle.textContent = '\u25BC';
    toggle.title = 'Collapse';
    toggle.setAttribute('aria-label', 'Toggle code block');
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const line = toggle.closest('.cm-line');
      if (!line) return;
      const container = line.parentElement;
      if (!container) return;
      const collapsed = container.classList.toggle('cm-codeblock-collapsed');
      toggle.textContent = collapsed ? '\u25B6' : '\u25BC';
      toggle.title = collapsed ? 'Expand' : 'Collapse';
    });

    // ── Copy button ──
    const copy = document.createElement('button');
    copy.className = 'cm-codeblock-copy';
    copy.setAttribute('aria-label', 'Copy code');
    copy.title = 'Copy';
    copy.textContent = 'Copy';
    copy.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      navigator.clipboard.writeText(this.code).then(() => {
        copy.textContent = 'Copied';
        setTimeout(() => {
          copy.textContent = 'Copy';
        }, 1500);
      });
    });

    wrapper.appendChild(toggle);
    wrapper.appendChild(copy);
    return wrapper;
  }

  eq(other: CodeBlockControlsWidget): boolean {
    return this.code === other.code && this.lang === other.lang;
  }

  ignoreEvent(): boolean {
    return true;
  }
}

interface CodeBlockInfo {
  fenceFrom: number;
  lang: string;
  code: string;
}

function findCodeBlocks(view: EditorView): CodeBlockInfo[] {
  const doc = view.state.doc;
  const blocks: CodeBlockInfo[] = [];
  let i = 1;

  while (i <= doc.lines) {
    const line = doc.line(i);
    const openMatch = FENCE_OPEN_RE.exec(line.text);
    if (!openMatch) {
      i++;
      continue;
    }

    const fenceChar = openMatch[1][0];
    const fenceLen = openMatch[1].length;
    const lang = openMatch[2] || '';
    if (WIDGET_LANGS.has(lang.toLowerCase())) {
      i++;
      continue;
    }
    const codeLines: string[] = [];
    let closed = false;

    const fenceFrom = line.from;
    i++;

    while (i <= doc.lines) {
      const innerLine = doc.line(i);
      if (
        FENCE_CLOSE.test(innerLine.text) &&
        innerLine.text.trim()[0] === fenceChar &&
        innerLine.text.trim().length >= fenceLen
      ) {
        closed = true;
        i++;
        break;
      }
      codeLines.push(innerLine.text);
      i++;
    }

    if (closed) {
      blocks.push({
        fenceFrom,
        lang,
        code: codeLines.join('\n'),
      });
    }
  }

  return blocks;
}

function buildDecorations(view: EditorView): DecorationSet {
  const blocks = findCodeBlocks(view);
  const widgets = blocks.map((block) =>
    Decoration.widget({
      widget: new CodeBlockControlsWidget(block.code, block.lang),
      side: 1,
    }).range(block.fenceFrom)
  );
  return Decoration.set(widgets, true);
}

class CodeBlockPluginValue implements PluginValue {
  decorations: DecorationSet;

  constructor(view: EditorView) {
    this.decorations = buildDecorations(view);
  }

  update(update: ViewUpdate) {
    if (update.docChanged) {
      this.decorations = buildDecorations(update.view);
    }
  }
}

const codeblockPlugin = ViewPlugin.fromClass(CodeBlockPluginValue, {
  decorations: (v) => v.decorations,
});

const codeblockTheme = EditorView.baseTheme({
  '.cm-line:has(.cm-codeblock-controls)': {
    position: 'relative',
  },
  '.cm-codeblock-controls': {
    position: 'absolute',
    right: '8px',
    top: '2px',
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
    opacity: '0',
    transition: 'opacity 0.15s',
    zIndex: '2',
  },
  '.cm-line:hover > .cm-codeblock-controls, .cm-codeblock-controls:focus-within': {
    opacity: '1',
  },
  '.cm-codeblock-copy': {
    padding: '2px 8px',
    fontSize: '0.7rem',
    fontFamily: 'var(--font-sans)',
    color: 'var(--color-text-subtle)',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  '.cm-codeblock-toggle': {
    background: 'none',
    border: 'none',
    padding: '2px 4px',
    fontSize: '0.6rem',
    color: 'var(--color-text-subtle)',
    cursor: 'pointer',
    lineHeight: '1',
  },
});

export function codeblockExtension() {
  return [codeblockPlugin, codeblockTheme];
}
