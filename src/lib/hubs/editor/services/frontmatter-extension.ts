import { StateField, type Text } from '@codemirror/state';
import { Decoration, type DecorationSet, EditorView, WidgetType } from '@codemirror/view';

// ── Shared helpers ──────────────────────────────────────────────────────────

function findFrontmatterEnd(doc: Text): number {
  if (doc.lineAt(0).text.trim() !== '---') return -1;
  for (let i = 2; i <= doc.lines; i++) {
    if (doc.line(i).text.trim() === '---') return i;
  }
  return -1;
}

// ── Fold widget (hidden mode) ───────────────────────────────────────────────

class FrontmatterFoldWidget extends WidgetType {
  constructor(readonly lineCount: number) {
    super();
  }

  toDOM(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'cm-frontmatter-fold';
    return el;
  }

  eq(other: FrontmatterFoldWidget): boolean {
    return this.lineCount === other.lineCount;
  }
}

function buildFoldDecorations(doc: Text): DecorationSet {
  const endLine = findFrontmatterEnd(doc);
  if (endLine < 0) return Decoration.none;
  const from = doc.line(1).from;
  const to = doc.line(endLine).to;
  const fieldCount = endLine - 2;
  return Decoration.set(
    [Decoration.replace({ widget: new FrontmatterFoldWidget(fieldCount) }).range(from, to)],
    true
  );
}

const foldField = StateField.define<DecorationSet>({
  create(state) {
    return buildFoldDecorations(state.doc);
  },
  update(value, tr) {
    if (tr.docChanged) return buildFoldDecorations(tr.state.doc);
    return value;
  },
  provide: (f) => EditorView.decorations.from(f),
});

// ── Styled plugin (visible mode) ────────────────────────────────────────────

const fmLineDecoration = Decoration.line({ class: 'cm-frontmatter-line' });
const fmFenceDecoration = Decoration.line({ class: 'cm-frontmatter-fence' });

function buildStyledDecorations(doc: Text): DecorationSet {
  const endLine = findFrontmatterEnd(doc);
  if (endLine < 0) return Decoration.none;
  const decorations: { from: number; decoration: Decoration }[] = [];
  decorations.push({ from: doc.line(1).from, decoration: fmFenceDecoration });
  for (let i = 2; i <= endLine; i++) {
    const line = doc.line(i);
    decorations.push({
      from: line.from,
      decoration: i === endLine ? fmFenceDecoration : fmLineDecoration,
    });
  }
  return Decoration.set(
    decorations.map((d) => d.decoration.range(d.from)),
    true
  );
}

const styledField = StateField.define<DecorationSet>({
  create(state) {
    return buildStyledDecorations(state.doc);
  },
  update(value, tr) {
    if (tr.docChanged) return buildStyledDecorations(tr.state.doc);
    return value;
  },
  provide: (f) => EditorView.decorations.from(f),
});

// ── Properties widget (properties mode) ─────────────────────────────────────

function parseFmEntries(doc: Text, endLine: number): { key: string; value: string }[] {
  const entries: { key: string; value: string }[] = [];
  let currentKey = '';
  let arrayItems: string[] = [];

  for (let i = 2; i < endLine; i++) {
    const text = doc.line(i).text;
    const trimmed = text.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const arrayMatch = trimmed.match(/^-\s+(.+)/);
    if (arrayMatch && currentKey) {
      arrayItems.push(arrayMatch[1]);
      continue;
    }

    if (currentKey && arrayItems.length > 0) {
      entries.push({ key: currentKey, value: arrayItems.join(', ') });
      arrayItems = [];
      currentKey = '';
    }

    const kvMatch = trimmed.match(/^([^:]+?):\s*(.*)/);
    if (kvMatch) {
      if (currentKey && arrayItems.length === 0) {
        entries.push({ key: currentKey, value: '' });
      }
      currentKey = kvMatch[1].trim();
      const val = kvMatch[2].trim();
      if (val) {
        entries.push({ key: currentKey, value: val.replace(/^["']|["']$/g, '') });
        currentKey = '';
      }
    }
  }

  if (currentKey && arrayItems.length > 0) {
    entries.push({ key: currentKey, value: arrayItems.join(', ') });
  } else if (currentKey) {
    entries.push({ key: currentKey, value: '' });
  }

  return entries;
}

class FrontmatterPropsWidget extends WidgetType {
  constructor(readonly entries: { key: string; value: string }[]) {
    super();
  }

  toDOM(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'cm-fm-props';

    if (this.entries.length === 0) {
      wrapper.textContent = 'No properties';
      return wrapper;
    }

    const table = document.createElement('table');
    table.className = 'cm-fm-props-table';
    for (const e of this.entries) {
      const row = document.createElement('tr');
      const keyCell = document.createElement('td');
      keyCell.className = 'cm-fm-props-key';
      keyCell.textContent = e.key;
      const valCell = document.createElement('td');
      valCell.className = 'cm-fm-props-val';
      valCell.textContent = e.value;
      row.appendChild(keyCell);
      row.appendChild(valCell);
      table.appendChild(row);
    }
    wrapper.appendChild(table);
    return wrapper;
  }

  eq(other: FrontmatterPropsWidget): boolean {
    if (this.entries.length !== other.entries.length) return false;
    return this.entries.every(
      (e, i) => e.key === other.entries[i].key && e.value === other.entries[i].value
    );
  }
}

function buildPropsDecorations(doc: Text): DecorationSet {
  const endLine = findFrontmatterEnd(doc);
  if (endLine < 0) return Decoration.none;
  const from = doc.line(1).from;
  const to = doc.line(endLine).to;
  const entries = parseFmEntries(doc, endLine);
  return Decoration.set(
    [Decoration.replace({ widget: new FrontmatterPropsWidget(entries) }).range(from, to)],
    true
  );
}

const propsField = StateField.define<DecorationSet>({
  create(state) {
    return buildPropsDecorations(state.doc);
  },
  update(value, tr) {
    if (tr.docChanged) return buildPropsDecorations(tr.state.doc);
    return value;
  },
  provide: (f) => EditorView.decorations.from(f),
});

// ── Theme ───────────────────────────────────────────────────────────────────

const frontmatterTheme = EditorView.baseTheme({
  '.cm-frontmatter-fence': {
    color: 'var(--color-text-subtle)',
    opacity: '0.6',
  },
  '.cm-frontmatter-line': {
    color: 'var(--color-text-muted)',
    fontStyle: 'italic',
    opacity: '0.75',
  },
  '.cm-frontmatter-fold': {
    display: 'none',
  },
  '.cm-fm-props': {
    display: 'block',
    padding: '8px 12px',
    background: 'var(--color-surface)',
    borderBottom: '1px solid var(--color-border)',
    fontSize: '0.75rem',
    lineHeight: '1.6',
    userSelect: 'none',
  },
  '.cm-fm-props-table': {
    width: '100%',
    borderCollapse: 'collapse' as string,
  },
  '.cm-fm-props-key': {
    color: 'var(--color-accent)',
    fontWeight: '500',
    paddingRight: '12px',
    paddingTop: '2px',
    paddingBottom: '2px',
    verticalAlign: 'top',
    whiteSpace: 'nowrap' as string,
    width: '1%',
  },
  '.cm-fm-props-val': {
    color: 'var(--color-text)',
    paddingTop: '2px',
    paddingBottom: '2px',
  },
});

// ── Exports ─────────────────────────────────────────────────────────────────

export function frontmatterFoldExtension() {
  return [foldField];
}

export function frontmatterStyledExtension() {
  return [styledField];
}

export function frontmatterPropertiesExtension() {
  return [propsField];
}

export function frontmatterThemeExtension() {
  return [frontmatterTheme];
}
