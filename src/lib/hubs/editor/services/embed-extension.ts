import { type EditorState, StateField } from '@codemirror/state';
import { Decoration, type DecorationSet, EditorView, WidgetType } from '@codemirror/view';

import { getNotes } from '@/hubs/core/stores/vault-store.svelte';
import { cursorLineNumbers, selectionCrossedLine } from '@/hubs/editor/services/cursor-utils';
import { getCachedContent } from '@/hubs/editor/services/file-ops';
import { renderMarkdown } from '@/hubs/editor/services/markdown-renderer';

const EMBED_RE = /!\[\[([^\]]+?)\]\]/g;

function resolveEmbedPath(target: string): string | null {
  const notes = getNotes();
  const lower = target.toLowerCase();
  const note = notes.find(
    (n) =>
      n.title.toLowerCase() === lower ||
      n.path.toLowerCase() === `${lower}.md` ||
      n.path.toLowerCase().endsWith(`/${lower}.md`)
  );
  return note?.path ?? null;
}

class EmbedWidget extends WidgetType {
  constructor(
    readonly target: string,
    readonly content: string | null,
    readonly sourceFrom: number
  ) {
    super();
  }

  toDOM(view: EditorView): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'cm-embed-widget';
    wrapper.setAttribute('role', 'region');
    wrapper.setAttribute('aria-label', `Embedded: ${this.target}`);

    // ── Header with toggle ──
    const header = document.createElement('div');
    header.className = 'cm-embed-header';

    const toggle = document.createElement('button');
    toggle.className = 'cm-embed-toggle';
    toggle.textContent = '\u25BC';
    toggle.title = 'Collapse';
    toggle.setAttribute('aria-label', 'Toggle embed');

    const title = document.createElement('span');
    title.className = 'cm-embed-title';
    title.textContent = this.target;
    title.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('wikilink-click', { detail: { target: this.target } }));
    });

    header.appendChild(toggle);
    header.appendChild(title);
    wrapper.appendChild(header);

    // ── Content body ──
    const body = document.createElement('div');
    body.className = 'cm-embed-body';

    if (this.content !== null) {
      body.innerHTML = renderMarkdown(this.content);
    } else {
      body.textContent = `Note "${this.target}" not found`;
      body.classList.add('cm-embed-missing');
    }

    wrapper.appendChild(body);

    // ── Toggle collapse ──
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const collapsed = wrapper.classList.toggle('cm-embed-collapsed');
      toggle.textContent = collapsed ? '\u25B6' : '\u25BC';
      toggle.title = collapsed ? 'Expand' : 'Collapse';
    });

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

  eq(other: EmbedWidget): boolean {
    return (
      this.target === other.target &&
      this.content === other.content &&
      this.sourceFrom === other.sourceFrom
    );
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
    EMBED_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = EMBED_RE.exec(line.text)) !== null) {
      const start = line.from + match.index;
      const end = start + match[0].length;
      const target = match[1].trim();
      const resolvedPath = resolveEmbedPath(target);
      const content = resolvedPath ? (getCachedContent(resolvedPath) ?? null) : null;
      const widget = new EmbedWidget(target, content, start);
      decos.push({ from: start, to: end, deco: Decoration.replace({ widget }) });
    }
  }

  decos.sort((a, b) => a.from - b.from || a.to - b.to);
  return Decoration.set(
    decos.map((d) => d.deco.range(d.from, d.to)),
    true
  );
}

const embedField = StateField.define<DecorationSet>({
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

const embedTheme = EditorView.baseTheme({
  '.cm-embed-widget': {
    display: 'block',
    margin: '4px 0',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '6px',
    overflow: 'hidden',
    fontSize: '0.85rem',
    color: 'var(--color-text)',
    transition: 'border-color 0.15s',
  },
  '.cm-embed-widget:hover': {
    borderColor: 'var(--color-accent)',
  },
  '.cm-embed-header': {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    background: 'color-mix(in srgb, var(--color-surface-hover) 50%, transparent)',
    borderBottom: '1px solid var(--color-border)',
    cursor: 'default',
  },
  '.cm-embed-toggle': {
    background: 'none',
    border: 'none',
    padding: '0 2px',
    fontSize: '0.65rem',
    color: 'var(--color-text-subtle)',
    cursor: 'pointer',
    lineHeight: '1',
  },
  '.cm-embed-title': {
    color: 'var(--color-accent)',
    fontWeight: '500',
    cursor: 'pointer',
    textDecoration: 'underline',
    textDecorationColor: 'transparent',
    transition: 'text-decoration-color 0.15s',
  },
  '.cm-embed-title:hover': {
    textDecorationColor: 'var(--color-accent)',
  },
  '.cm-embed-body': {
    padding: '10px 14px',
    lineHeight: '1.6',
    maxHeight: '300px',
    overflow: 'auto',
  },
  '.cm-embed-body p': { margin: '0.4em 0' },
  '.cm-embed-body h1, .cm-embed-body h2, .cm-embed-body h3': {
    margin: '0.6em 0 0.3em',
    fontWeight: '600',
  },
  '.cm-embed-body h1': { fontSize: '1.3em' },
  '.cm-embed-body h2': { fontSize: '1.15em' },
  '.cm-embed-body h3': { fontSize: '1.05em' },
  '.cm-embed-body code': {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.85em',
    padding: '1px 4px',
    background: 'var(--color-background)',
    borderRadius: '3px',
  },
  '.cm-embed-body ul, .cm-embed-body ol': { paddingLeft: '1.4em', margin: '0.3em 0' },
  '.cm-embed-body blockquote': {
    borderLeft: '3px solid var(--color-accent)',
    paddingLeft: '10px',
    margin: '0.4em 0',
    color: 'var(--color-text-muted)',
  },
  '.cm-embed-missing': {
    color: 'var(--color-text-subtle)',
    fontStyle: 'italic',
  },
  '.cm-embed-collapsed .cm-embed-body': {
    display: 'none',
  },
  '.cm-embed-collapsed .cm-embed-header': {
    borderBottom: 'none',
  },
});

export function embedExtension() {
  return [embedField, embedTheme];
}
