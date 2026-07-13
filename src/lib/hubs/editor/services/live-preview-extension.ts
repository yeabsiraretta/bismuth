import { type EditorState, StateField } from '@codemirror/state';
import { Decoration, type DecorationSet, EditorView, WidgetType } from '@codemirror/view';

import { selectionCrossedLine } from '@/hubs/editor/services/cursor-utils';

// ── Cursor helpers ───────────────────────────────────────────────────────────

function cursorLineRanges(state: EditorState): Set<number> {
  const lines = new Set<number>();
  for (const range of state.selection.ranges) {
    const startLine = state.doc.lineAt(range.from).number;
    const endLine = state.doc.lineAt(range.to).number;
    for (let l = startLine; l <= endLine; l++) lines.add(l);
  }
  return lines;
}

// ── Widgets ──────────────────────────────────────────────────────────────────

class BulletWidget extends WidgetType {
  toDOM(): HTMLElement {
    const span = document.createElement('span');
    span.className = 'cm-lp-bullet';
    span.textContent = '\u2022';
    return span;
  }
  eq(): boolean {
    return true;
  }
}

class HrWidget extends WidgetType {
  toDOM(): HTMLElement {
    const hr = document.createElement('hr');
    hr.className = 'cm-lp-hr';
    return hr;
  }
  eq(): boolean {
    return true;
  }
}

class LinkWidget extends WidgetType {
  constructor(
    readonly text: string,
    readonly url: string
  ) {
    super();
  }
  toDOM(): HTMLElement {
    const a = document.createElement('a');
    a.className = 'cm-lp-link';
    a.textContent = this.text;
    a.title = this.url;
    a.href = this.url;
    a.addEventListener('click', (e) => {
      e.preventDefault();
      if (this.url.startsWith('http')) {
        window.open(this.url, '_blank', 'noopener');
      }
    });
    return a;
  }
  eq(other: LinkWidget): boolean {
    return this.text === other.text && this.url === other.url;
  }
}

class TableWidget extends WidgetType {
  constructor(
    readonly rows: string[],
    readonly tableFrom: number,
    readonly tableTo: number
  ) {
    super();
  }

  ignoreEvent(): boolean {
    return true;
  }

  toDOM(view: EditorView): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'cm-lp-table-wrap';
    const table = document.createElement('table');
    table.className = 'cm-lp-table';

    const parseCells = (row: string): string[] => {
      const s = row.replace(/^\|/, '').replace(/\|$/, '');
      const cells: string[] = [];
      let cur = '';
      let depth = 0;
      for (let j = 0; j < s.length; j++) {
        const ch = s[j];
        if (ch === '[') depth++;
        else if (ch === ']') depth = Math.max(0, depth - 1);
        if (ch === '|' && depth === 0) {
          cells.push(cur.trim());
          cur = '';
        } else {
          cur += ch;
        }
      }
      cells.push(cur.trim());
      return cells;
    };

    const isSep = (row: string): boolean =>
      /^\|?[\s:]*-{2,}[\s:]*(?:\|[\s:]*-{2,}[\s:]*)*\|?$/.test(row.trim());

    const hasHeader = this.rows.length >= 2 && isSep(this.rows[1]);
    const headerCells = hasHeader ? parseCells(this.rows[0]) : null;
    const bodyRowTexts = hasHeader ? this.rows.slice(2) : this.rows;

    const renderCellContent = (el: HTMLElement, text: string) => {
      const WIKILINK_CELL_RE = /\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g;
      let lastIndex = 0;
      let m: RegExpExecArray | null;
      WIKILINK_CELL_RE.lastIndex = 0;
      const frag = document.createDocumentFragment();
      let hasWikilink = false;
      while ((m = WIKILINK_CELL_RE.exec(text)) !== null) {
        hasWikilink = true;
        if (m.index > lastIndex) {
          frag.appendChild(document.createTextNode(text.slice(lastIndex, m.index)));
        }
        const target = m[1].trim();
        const display = (m[2] ?? m[1]).trim();
        const link = document.createElement('span');
        link.className = 'cm-wikilink';
        link.contentEditable = 'false';
        link.textContent = display;
        link.title = target;
        link.dataset['target'] = target;
        link.setAttribute('role', 'link');
        link.addEventListener('mousedown', (e) => {
          e.preventDefault();
          e.stopPropagation();
        });
        link.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          window.dispatchEvent(new CustomEvent('wikilink-click', { detail: { target } }));
        });
        frag.appendChild(link);
        lastIndex = m.index + m[0].length;
      }
      if (!hasWikilink) {
        el.textContent = text;
      } else {
        if (lastIndex < text.length) {
          frag.appendChild(document.createTextNode(text.slice(lastIndex)));
        }
        el.appendChild(frag);
      }
    };

    const makeCell = (tag: 'th' | 'td', text: string): HTMLElement => {
      const el = document.createElement(tag);
      renderCellContent(el, text);
      el.contentEditable = 'true';
      el.setAttribute('spellcheck', 'false');
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          e.preventDefault();
          const all = Array.from(table.querySelectorAll<HTMLElement>('th, td'));
          const cur = all.indexOf(el);
          const nxt = e.shiftKey ? cur - 1 : cur + 1;
          if (nxt >= 0 && nxt < all.length) {
            all[nxt].focus();
            window.getSelection()?.selectAllChildren(all[nxt]);
          }
        } else if (e.key === 'Escape') {
          e.preventDefault();
          el.blur();
          view.focus();
        } else if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          el.blur();
        }
      });
      return el;
    };

    if (headerCells) {
      const thead = document.createElement('thead');
      const tr = document.createElement('tr');
      for (const c of headerCells) tr.appendChild(makeCell('th', c));
      thead.appendChild(tr);
      table.appendChild(thead);
    }

    const tbody = document.createElement('tbody');
    for (const row of bodyRowTexts) {
      const tr = document.createElement('tr');
      for (const c of parseCells(row)) tr.appendChild(makeCell('td', c));
      tbody.appendChild(tr);
    }
    if (tbody.children.length > 0) table.appendChild(tbody);

    wrap.addEventListener('focusout', () => {
      setTimeout(() => {
        if (!wrap.contains(document.activeElement)) {
          this.syncToDoc(view, table, hasHeader);
        }
      }, 0);
    });

    wrap.appendChild(table);
    return wrap;
  }

  private serializeCell(cell: HTMLElement): string {
    let result = '';
    for (const node of Array.from(cell.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE) {
        result += node.textContent ?? '';
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (el.classList.contains('cm-wikilink') && el.dataset['target']) {
          const target = el.dataset['target'];
          const display = (el.textContent ?? '').trim();
          if (display !== target) {
            result += `[[${target}|${display}]]`;
          } else {
            result += `[[${target}]]`;
          }
        } else {
          result += el.textContent ?? '';
        }
      }
    }
    return result.trim();
  }

  private syncToDoc(view: EditorView, table: HTMLTableElement, hasHeader: boolean) {
    const trs = table.querySelectorAll('tr');
    let maxCols = 0;
    trs.forEach((tr) => {
      maxCols = Math.max(maxCols, tr.cells.length);
    });

    const newLines: string[] = [];
    trs.forEach((tr, idx) => {
      const cells: string[] = [];
      for (let c = 0; c < maxCols; c++) {
        cells.push(c < tr.cells.length ? this.serializeCell(tr.cells[c]) : '');
      }
      const widths = cells.map((t) => Math.max(t.length, 3));
      newLines.push('| ' + cells.map((t, j) => t.padEnd(widths[j])).join(' | ') + ' |');
      if (hasHeader && idx === 0) {
        newLines.push('| ' + widths.map((w) => '-'.repeat(w)).join(' | ') + ' |');
      }
    });

    const newText = newLines.join('\n');
    const oldText = view.state.doc.sliceString(this.tableFrom, this.tableTo);
    if (newText !== oldText) {
      view.dispatch({
        changes: { from: this.tableFrom, to: this.tableTo, insert: newText },
      });
    }
  }

  eq(other: TableWidget): boolean {
    return (
      this.tableFrom === other.tableFrom &&
      this.tableTo === other.tableTo &&
      this.rows.length === other.rows.length &&
      this.rows.every((r, i) => r === other.rows[i])
    );
  }
}

// ── Regex patterns ───────────────────────────────────────────────────────────

const HEADING_RE = /^(#{1,6})\s+(.+)$/;
const BOLD_RE = /\*\*(.+?)\*\*/g;
const ITALIC_RE = /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g;
const STRIKE_RE = /~~(.+?)~~/g;
const INLINE_CODE_RE = /`([^`]+)`/g;
const LINK_RE = /\[([^\]]+)\]\(([^)]+)\)/g;
const HR_RE = /^(---+|\*\*\*+|___+)\s*$/;
const SKIP_LINE_RE = /!\[\[[^\]]+\]\]|!\[[^\]]*\]\([^)]+\)/;
const LIST_RE = /^(\s*)([-*+])\s/;
const CHECKBOX_LIST_RE = /^\s*[-*+]\s\[[ x]\]/;
const FENCE_RE = /^(`{3,}|~{3,})/;
const TABLE_LINE_RE = /^\s*\|/;

// ── Decoration builder ───────────────────────────────────────────────────────

function buildLiveDecorations(state: EditorState): DecorationSet {
  const activeLines = cursorLineRanges(state);
  const doc = state.doc;
  const builder: { from: number; to: number; deco: Decoration }[] = [];

  // ── Detect frontmatter range (tables still rendered inside it) ──
  let frontmatterEnd = 0;
  if (doc.lines >= 1 && doc.line(1).text.trim() === '---') {
    for (let j = 2; j <= doc.lines; j++) {
      if (doc.line(j).text.trim() === '---') {
        frontmatterEnd = j;
        break;
      }
    }
  }

  let inFence = false;
  let fenceChar = '';

  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i);
    const text = line.text;
    const inFrontmatter = frontmatterEnd > 0 && i <= frontmatterEnd;

    // ── Track fenced code blocks ──
    const fenceMatch = FENCE_RE.exec(text);
    if (fenceMatch) {
      if (!inFence) {
        inFence = true;
        fenceChar = fenceMatch[1][0];
      } else if (text.trim()[0] === fenceChar) {
        inFence = false;
        fenceChar = '';
      }
      continue;
    }
    if (inFence) continue;

    // ── Table blocks (always rendered, including in frontmatter) ──
    if (TABLE_LINE_RE.test(text)) {
      const tableStart = i;
      const tableRows: string[] = [text];
      while (i + 1 <= doc.lines && TABLE_LINE_RE.test(doc.line(i + 1).text)) {
        i++;
        tableRows.push(doc.line(i).text);
      }
      if (tableRows.length >= 2) {
        const from = doc.line(tableStart).from;
        const to = doc.line(i).to;
        builder.push({
          from,
          to,
          deco: Decoration.replace({ widget: new TableWidget(tableRows, from, to), block: true }),
        });
      }
      continue;
    }

    // Skip non-table decorations for frontmatter lines
    if (inFrontmatter) continue;
    if (activeLines.has(i)) continue;
    if (SKIP_LINE_RE.test(text)) continue;

    // ── Horizontal rule ──
    if (HR_RE.test(text)) {
      builder.push({
        from: line.from,
        to: line.to,
        deco: Decoration.replace({ widget: new HrWidget() }),
      });
      continue;
    }

    // ── Headings: hide hashes, apply heading class ──
    const headingMatch = text.match(HEADING_RE);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const hashEnd = line.from + headingMatch[1].length + 1;
      builder.push({
        from: line.from,
        to: hashEnd,
        deco: Decoration.replace({}),
      });
      builder.push({
        from: line.from,
        to: line.from,
        deco: Decoration.line({ class: `cm-lp-h${level}` }),
      });
      // Continue processing inline syntax within the heading text
    }

    // ── Unordered list bullets ──
    const listMatch = text.match(LIST_RE);
    if (listMatch && !CHECKBOX_LIST_RE.test(text)) {
      const markerStart = line.from + listMatch[1].length;
      builder.push({
        from: markerStart,
        to: markerStart + 1,
        deco: Decoration.replace({ widget: new BulletWidget() }),
      });
    }

    // ── Inline decorations ──
    processInline(text, line.from, builder);
  }

  return Decoration.set(
    builder.map((d) => d.deco.range(d.from, d.to)),
    true
  );
}

function processInline(
  text: string,
  lineFrom: number,
  builder: { from: number; to: number; deco: Decoration }[]
) {
  const used = new Set<string>();

  // ── Bold ──
  let m: RegExpExecArray | null;
  BOLD_RE.lastIndex = 0;
  while ((m = BOLD_RE.exec(text)) !== null) {
    const start = lineFrom + m.index;
    const end = start + m[0].length;
    const key = `${start}:${end}`;
    if (used.has(key)) continue;
    used.add(key);
    // Hide opening **
    builder.push({ from: start, to: start + 2, deco: Decoration.replace({}) });
    // Mark content as bold
    builder.push({ from: start + 2, to: end - 2, deco: Decoration.mark({ class: 'cm-lp-bold' }) });
    // Hide closing **
    builder.push({ from: end - 2, to: end, deco: Decoration.replace({}) });
  }

  // ── Italic (single *) ──
  ITALIC_RE.lastIndex = 0;
  while ((m = ITALIC_RE.exec(text)) !== null) {
    const start = lineFrom + m.index;
    const end = start + m[0].length;
    const key = `${start}:${end}`;
    if (used.has(key)) continue;
    // Check overlap with bold ranges
    let overlaps = false;
    for (const u of used) {
      const [us, ue] = u.split(':').map(Number);
      if (start >= us && end <= ue) {
        overlaps = true;
        break;
      }
    }
    if (overlaps) continue;
    used.add(key);
    builder.push({ from: start, to: start + 1, deco: Decoration.replace({}) });
    builder.push({
      from: start + 1,
      to: end - 1,
      deco: Decoration.mark({ class: 'cm-lp-italic' }),
    });
    builder.push({ from: end - 1, to: end, deco: Decoration.replace({}) });
  }

  // ── Strikethrough ──
  STRIKE_RE.lastIndex = 0;
  while ((m = STRIKE_RE.exec(text)) !== null) {
    const start = lineFrom + m.index;
    const end = start + m[0].length;
    builder.push({ from: start, to: start + 2, deco: Decoration.replace({}) });
    builder.push({
      from: start + 2,
      to: end - 2,
      deco: Decoration.mark({ class: 'cm-lp-strike' }),
    });
    builder.push({ from: end - 2, to: end, deco: Decoration.replace({}) });
  }

  // ── Inline code ──
  INLINE_CODE_RE.lastIndex = 0;
  while ((m = INLINE_CODE_RE.exec(text)) !== null) {
    const start = lineFrom + m.index;
    const end = start + m[0].length;
    builder.push({ from: start, to: start + 1, deco: Decoration.replace({}) });
    builder.push({ from: start + 1, to: end - 1, deco: Decoration.mark({ class: 'cm-lp-code' }) });
    builder.push({ from: end - 1, to: end, deco: Decoration.replace({}) });
  }

  // ── Links [text](url) — replace entire syntax with a widget ──
  LINK_RE.lastIndex = 0;
  while ((m = LINK_RE.exec(text)) !== null) {
    const start = lineFrom + m.index;
    const end = start + m[0].length;
    const linkText = m[1];
    const url = m[2];
    builder.push({
      from: start,
      to: end,
      deco: Decoration.replace({ widget: new LinkWidget(linkText, url) }),
    });
  }
}

// ── StateField ──────────────────────────────────────────────────────────────

const livePreviewField = StateField.define<DecorationSet>({
  create(state) {
    return buildLiveDecorations(state);
  },
  update(value, tr) {
    if (tr.docChanged) return buildLiveDecorations(tr.state);
    if (tr.selection && selectionCrossedLine(tr.startState, tr.state)) {
      return buildLiveDecorations(tr.state);
    }
    return value;
  },
  provide: (f) => EditorView.decorations.from(f),
});

// ── Theme ────────────────────────────────────────────────────────────────────

const livePreviewTheme = EditorView.baseTheme({
  '.cm-lp-h1': { fontSize: '1.6em', fontWeight: '700', lineHeight: '1.3' },
  '.cm-lp-h2': { fontSize: '1.35em', fontWeight: '650', lineHeight: '1.35' },
  '.cm-lp-h3': { fontSize: '1.15em', fontWeight: '600', lineHeight: '1.4' },
  '.cm-lp-h4': { fontSize: '1.05em', fontWeight: '600', lineHeight: '1.45' },
  '.cm-lp-h5': { fontSize: '0.95em', fontWeight: '600', lineHeight: '1.5' },
  '.cm-lp-h6': {
    fontSize: '0.9em',
    fontWeight: '600',
    lineHeight: '1.5',
    color: 'var(--color-text-muted)',
  },
  '.cm-lp-bold': { fontWeight: '700' },
  '.cm-lp-italic': { fontStyle: 'italic' },
  '.cm-lp-strike': { textDecoration: 'line-through', color: 'var(--color-text-subtle)' },
  '.cm-lp-code': {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.88em',
    padding: '1px 4px',
    background: 'var(--color-surface)',
    borderRadius: '3px',
  },
  '.cm-lp-link': {
    color: 'var(--color-accent)',
    textDecoration: 'underline',
    cursor: 'pointer',
  },
  '.cm-lp-bullet': {
    color: 'var(--color-accent)',
    fontWeight: '700',
  },
  '.cm-lp-hr': {
    border: 'none',
    borderTop: '1px solid var(--color-border)',
    margin: '0.75em 0',
    display: 'block',
  },
  '.cm-lp-table-wrap': {
    margin: '0.5em 0',
  },
  '.cm-lp-table': {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.85em',
  },
  '.cm-lp-table th, .cm-lp-table td': {
    border: '1px solid var(--color-border)',
    padding: '6px 10px',
    textAlign: 'left',
    outline: 'none',
    minWidth: '3em',
    cursor: 'text',
  },
  '.cm-lp-table th:focus, .cm-lp-table td:focus': {
    boxShadow: 'inset 0 0 0 2px var(--color-accent)',
  },
  '.cm-lp-table th': {
    background: 'var(--color-surface)',
    fontWeight: '600',
  },
  '.cm-lp-table tr:hover': {
    background: 'var(--color-surface-hover)',
  },
  '.cm-lp-table .cm-wikilink': {
    cursor: 'pointer',
    userSelect: 'none',
  },
});

// ── Export ────────────────────────────────────────────────────────────────────

export function livePreviewExtension() {
  return [livePreviewField, livePreviewTheme];
}
