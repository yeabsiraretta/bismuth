import { type Range, StateEffect, StateField } from '@codemirror/state';
import { Decoration, type DecorationSet, EditorView, WidgetType } from '@codemirror/view';

// ── Tree node model ──────────────────────────────────────────────────────────

interface TreeNode {
  name: string;
  comment: string;
  isDir: boolean;
  children: TreeNode[];
  depth: number;
}

// ── Parser: text → tree ──────────────────────────────────────────────────────

const TREE_CHARS_RE = /^[\s│├└─┬┤┌┐┘┼|`\-+\\/ ]*/;
const DIR_SUFFIX_RE = /[/\\]$/;
const INLINE_COMMENT_RE = /\s+(?:\/\/|#)\s(.+)$/;

function parseTreeText(text: string): TreeNode[] {
  const lines = text.split('\n').filter((l) => l.trim().length > 0);
  const root: TreeNode[] = [];
  const stack: { node: TreeNode; depth: number }[] = [];

  for (const line of lines) {
    const prefixMatch = TREE_CHARS_RE.exec(line);
    const prefix = prefixMatch ? prefixMatch[0] : '';
    let name = line.slice(prefix.length).trim();
    if (!name) continue;

    const depth = Math.floor(prefix.replace(/\t/g, '    ').length / 2);

    let comment = '';
    const commentMatch = INLINE_COMMENT_RE.exec(name);
    if (commentMatch) {
      comment = commentMatch[1].trim();
      name = name.slice(0, commentMatch.index).trim();
    }

    const cleanName = name.replace(/[/\\]$/, '');
    const node: TreeNode = {
      name: cleanName,
      comment,
      isDir: DIR_SUFFIX_RE.test(name) || !cleanName.includes('.'),
      children: [],
      depth,
    };

    while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
      stack.pop();
    }

    if (stack.length > 0) {
      stack[stack.length - 1].node.children.push(node);
    } else {
      root.push(node);
    }

    stack.push({ node, depth });
  }

  return root;
}

// ── File icon lookup ─────────────────────────────────────────────────────────

function fileIcon(name: string): string {
  const ext = name.includes('.') ? name.split('.').pop()?.toLowerCase() : '';
  const map: Record<string, string> = {
    ts: 'TS',
    tsx: 'TX',
    js: 'JS',
    jsx: 'JX',
    json: '{}',
    svelte: 'SV',
    vue: 'VU',
    css: 'CS',
    scss: 'SC',
    html: '<>',
    md: 'MD',
    txt: 'TX',
    py: 'PY',
    rs: 'RS',
    go: 'GO',
    toml: 'TM',
    yaml: 'YM',
    yml: 'YM',
    lock: 'LK',
    png: 'IM',
    jpg: 'IM',
    svg: 'SG',
    gif: 'IM',
    sh: 'SH',
    bash: 'SH',
    zsh: 'SH',
  };
  return map[ext ?? ''] ?? '--';
}

// ── Widget ───────────────────────────────────────────────────────────────────

class TreeWidget extends WidgetType {
  constructor(readonly nodes: TreeNode[]) {
    super();
  }

  toDOM(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'cm-tree-widget';

    const header = document.createElement('div');
    header.className = 'cm-tree-header';

    const toggle = document.createElement('button');
    toggle.className = 'cm-tree-toggle';
    toggle.textContent = '\u25BC';
    toggle.title = 'Collapse';
    toggle.setAttribute('aria-label', 'Toggle tree');

    const label = document.createElement('span');
    label.className = 'cm-tree-label';
    label.textContent = 'File Tree';

    header.appendChild(toggle);
    header.appendChild(label);
    wrapper.appendChild(header);

    const body = document.createElement('div');
    body.className = 'cm-tree-body';
    this.renderNodes(this.nodes, body, 0);
    wrapper.appendChild(body);

    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const collapsed = wrapper.classList.toggle('cm-tree-collapsed');
      toggle.textContent = collapsed ? '\u25B6' : '\u25BC';
      toggle.title = collapsed ? 'Expand' : 'Collapse';
    });

    return wrapper;
  }

  private renderNodes(nodes: TreeNode[], parent: HTMLElement, depth: number): void {
    for (const node of nodes) {
      const row = document.createElement('div');
      row.className = 'cm-tree-row';
      row.style.paddingLeft = `${depth * 18 + 8}px`;

      const icon = document.createElement('span');
      icon.className = 'cm-tree-icon';
      const hasChildren = node.isDir || node.children.length > 0;

      if (hasChildren) {
        icon.textContent = '\u25BE';
        row.classList.add('cm-tree-dir');
      } else {
        icon.textContent = fileIcon(node.name);
      }

      const name = document.createElement('span');
      name.className = 'cm-tree-name';
      name.textContent = node.name;

      row.appendChild(icon);
      row.appendChild(name);

      if (node.comment) {
        const comment = document.createElement('span');
        comment.className = 'cm-tree-comment';
        comment.textContent = node.comment;
        row.appendChild(comment);
      }

      parent.appendChild(row);

      if (node.children.length > 0) {
        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'cm-tree-children';
        this.renderNodes(node.children, childrenContainer, depth + 1);
        parent.appendChild(childrenContainer);

        row.classList.add('cm-tree-foldable');
        row.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const folded = row.classList.toggle('cm-tree-folded');
          childrenContainer.style.display = folded ? 'none' : '';
          icon.textContent = folded ? '\u25B8' : '\u25BE';
        });
      }
    }
  }

  eq(other: TreeWidget): boolean {
    return JSON.stringify(this.nodes) === JSON.stringify(other.nodes);
  }

  ignoreEvent(): boolean {
    return true;
  }
}

// ── Code block detection ─────────────────────────────────────────────────────

const FENCE_OPEN_RE = /^(`{3,}|~{3,})(tree|folder|directory|filetree)\s*$/i;
const FENCE_CLOSE_RE = /^(`{3,}|~{3,})\s*$/;

interface TreeBlock {
  from: number;
  to: number;
  text: string;
}

function findTreeBlocks(view: EditorView): TreeBlock[] {
  const doc = view.state.doc;
  const blocks: TreeBlock[] = [];
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
    const contentLines: string[] = [];
    const blockFrom = line.from;
    i++;

    let closed = false;
    while (i <= doc.lines) {
      const inner = doc.line(i);
      if (
        FENCE_CLOSE_RE.test(inner.text) &&
        inner.text.trim()[0] === fenceChar &&
        inner.text.trim().length >= fenceLen
      ) {
        closed = true;
        i++;
        break;
      }
      contentLines.push(inner.text);
      i++;
    }

    if (closed && contentLines.length > 0) {
      blocks.push({
        from: blockFrom,
        to: doc.line(i - 1).to,
        text: contentLines.join('\n'),
      });
    }
  }

  return blocks;
}

// ── StateField (required for cross-line Decoration.replace) ─────────────────

const setTreeDecos = StateEffect.define<DecorationSet>();
const toggleEditBlock = StateEffect.define<{ from: number; enter: boolean }>();

const editingBlocksField = StateField.define<Set<number>>({
  create() {
    return new Set();
  },
  update(prev, tr) {
    let editing = prev;
    for (const e of tr.effects) {
      if (e.is(toggleEditBlock)) {
        editing = new Set(editing);
        if (e.value.enter) editing.add(e.value.from);
        else editing.delete(e.value.from);
      }
    }
    if (tr.docChanged && editing.size > 0) {
      const mapped = new Set<number>();
      for (const from of editing) mapped.add(tr.changes.mapPos(from, 1));
      return mapped;
    }
    return editing;
  },
});

function buildDecorations(blocks: TreeBlock[], editing: Set<number>): DecorationSet {
  const decos: Range<Decoration>[] = [];
  for (const block of blocks) {
    if (editing.has(block.from)) continue;
    const nodes = parseTreeText(block.text);
    decos.push(
      Decoration.replace({
        widget: new TreeWidget(nodes),
        block: true,
      }).range(block.from, block.to)
    );
  }
  return Decoration.set(decos, true);
}

const treeDecoField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(decos, tr) {
    for (const e of tr.effects) {
      if (e.is(setTreeDecos)) return e.value;
    }
    return tr.docChanged ? Decoration.none : decos;
  },
  provide: (f) => EditorView.decorations.from(f),
});

const treePlugin = EditorView.updateListener.of((update) => {
  if (update.transactions.some((tr) => tr.effects.some((e) => e.is(setTreeDecos)))) return;

  const hasToggle = update.transactions.some((tr) => tr.effects.some((e) => e.is(toggleEditBlock)));
  if (!update.docChanged && !update.selectionSet && !hasToggle) return;

  const view = update.view;
  const blocks = findTreeBlocks(view);
  const editing = new Set(view.state.field(editingBlocksField));

  // Auto-exit edit mode for blocks the cursor has left
  const exitEffects: StateEffect<{ from: number; enter: boolean }>[] = [];
  if (editing.size > 0) {
    const { head } = view.state.selection.main;
    for (const from of editing) {
      const block = blocks.find((b) => b.from === from);
      if (!block || head < block.from || head > block.to) {
        exitEffects.push(toggleEditBlock.of({ from, enter: false }));
        editing.delete(from);
      }
    }
  }

  const newDecos = buildDecorations(blocks, editing);

  queueMicrotask(() => {
    view.dispatch({ effects: [...exitEffects, setTreeDecos.of(newDecos)] });
  });
});

const treeEventHandler = EditorView.domEventHandlers({
  contextmenu(event, view) {
    if (!event.shiftKey) return false;
    const target = event.target as HTMLElement;
    const widgetEl = target.closest('.cm-tree-widget');
    if (!widgetEl) return false;

    event.preventDefault();

    let pos: number;
    try {
      pos = view.posAtDOM(widgetEl);
    } catch {
      return false;
    }

    const blocks = findTreeBlocks(view);
    const block = blocks.find((b) => pos >= b.from && pos <= b.to);
    if (!block) return false;

    view.dispatch({
      effects: toggleEditBlock.of({ from: block.from, enter: true }),
      selection: { anchor: block.from },
    });
    return true;
  },
});

// ── Theme ────────────────────────────────────────────────────────────────────

const treeTheme = EditorView.baseTheme({
  '.cm-tree-widget': {
    display: 'block',
    margin: '4px 0',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '6px',
    overflow: 'hidden',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.82rem',
  },
  '.cm-tree-header': {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    background: 'color-mix(in srgb, var(--color-surface-hover) 50%, transparent)',
    borderBottom: '1px solid var(--color-border)',
    cursor: 'default',
  },
  '.cm-tree-toggle': {
    background: 'none',
    border: 'none',
    padding: '0 2px',
    fontSize: '0.65rem',
    color: 'var(--color-text-subtle)',
    cursor: 'pointer',
    lineHeight: '1',
  },
  '.cm-tree-label': {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase' as string,
    letterSpacing: '0.05em',
  },
  '.cm-tree-body': {
    padding: '6px 0',
  },
  '.cm-tree-row': {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '2px 8px',
    lineHeight: '1.6',
    cursor: 'default',
  },
  '.cm-tree-row:hover': {
    background: 'var(--color-surface-hover)',
  },
  '.cm-tree-foldable': {
    cursor: 'pointer',
  },
  '.cm-tree-icon': {
    flexShrink: '0',
    fontSize: '0.9em',
    width: '18px',
    textAlign: 'center' as string,
    transition: 'transform 0.12s',
  },
  '.cm-tree-name': {
    color: 'var(--color-text)',
  },
  '.cm-tree-dir .cm-tree-name': {
    fontWeight: '600',
  },
  '.cm-tree-comment': {
    marginLeft: 'auto',
    fontSize: '0.78em',
    color: 'var(--color-text-subtle)',
    fontStyle: 'italic',
    opacity: '0',
    transition: 'opacity 0.15s',
    whiteSpace: 'nowrap' as string,
  },
  '.cm-tree-row:hover .cm-tree-comment': {
    opacity: '1',
  },
  '.cm-tree-children': {/* container for foldable children — no extra styles needed */},
  '.cm-tree-collapsed .cm-tree-body': {
    display: 'none',
  },
  '.cm-tree-collapsed .cm-tree-header': {
    borderBottom: 'none',
  },
});

export function treeExtension() {
  return [editingBlocksField, treeDecoField, treePlugin, treeEventHandler, treeTheme];
}
