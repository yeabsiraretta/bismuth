/**
 * Widget classes and table rendering for live preview extension.
 * Extracted from livePreviewDecorators.ts for 300-line compliance.
 */

import { WidgetType, type EditorView } from '@codemirror/view';

// ─── Widgets ─────────────────────────────────────────────────────────────────

export class TableWidget extends WidgetType {
  constructor(private html: string) {
    super();
  }
  toDOM(): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'cm-table-rendered';
    wrap.innerHTML = this.html;
    return wrap;
  }
  ignoreEvent() {
    return false;
  }
}

export class HrWidget extends WidgetType {
  toDOM(): HTMLElement {
    const hr = document.createElement('hr');
    hr.className = 'cm-lp-hr-rendered';
    return hr;
  }
  eq() {
    return true;
  }
}

export class ImageWidget extends WidgetType {
  constructor(
    private src: string,
    private alt: string
  ) {
    super();
  }
  toDOM(): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'cm-lp-image-wrap';
    const img = document.createElement('img');
    img.src = this.src;
    img.alt = this.alt;
    img.className = 'cm-lp-image';
    img.title = this.alt || this.src;
    wrap.appendChild(img);
    return wrap;
  }
  eq(other: ImageWidget) {
    return this.src === other.src && this.alt === other.alt;
  }
}

export type TaskState = 'open' | 'done' | 'inprogress' | 'onhold' | 'cancelled';

const TASK_CYCLE: TaskState[] = ['open', 'done', 'inprogress', 'onhold', 'cancelled'];

const TASK_CHAR: Record<TaskState, string> = {
  open: ' ',
  done: 'x',
  inprogress: '/',
  onhold: '>',
  cancelled: '-',
};

const TASK_META: Record<TaskState, { label: string; cls: string; path: string }> = {
  open: { label: 'Open', cls: 'cm-task-open', path: 'M3 3h18v18H3z' },
  done: { label: 'Done', cls: 'cm-task-done', path: 'M3 3h18v18H3zM9 12l2 2 4-4' },
  inprogress: { label: 'In Progress', cls: 'cm-task-inprogress', path: 'M3 3h18v18H3zM12 8v4l2 2' },
  onhold: { label: 'On Hold', cls: 'cm-task-onhold', path: 'M3 3h18v18H3zM10 9v6m4-6v6' },
  cancelled: {
    label: 'Cancelled',
    cls: 'cm-task-cancelled',
    path: 'M3 3h18v18H3zM9 9l6 6m0-6-6 6',
  },
};

export function charToTaskState(ch: string): TaskState {
  switch (ch) {
    case 'x':
    case 'X':
      return 'done';
    case '/':
      return 'inprogress';
    case '>':
      return 'onhold';
    case '-':
      return 'cancelled';
    default:
      return 'open';
  }
}

export class CheckboxWidget extends WidgetType {
  constructor(
    private state: TaskState,
    private pos: number
  ) {
    super();
  }
  toDOM(view: EditorView): HTMLElement {
    const meta = TASK_META[this.state];
    const btn = document.createElement('button');
    btn.className = `cm-lp-checkbox ${meta.cls}`;
    btn.setAttribute('aria-label', `Task: ${meta.label} — click to cycle`);
    btn.title = meta.label;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '16');
    svg.setAttribute('height', '16');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    for (const d of meta.path.split('z').filter(Boolean)) {
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', d + 'z');
      svg.appendChild(p);
    }
    btn.appendChild(svg);
    btn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const idx = TASK_CYCLE.indexOf(this.state);
      const next = TASK_CYCLE[(idx + 1) % TASK_CYCLE.length];
      view.dispatch({ changes: { from: this.pos, to: this.pos + 1, insert: TASK_CHAR[next] } });
    });
    return btn;
  }
  eq(other: CheckboxWidget) {
    return this.state === other.state && this.pos === other.pos;
  }
}

// ─── Callout icons (SVG path data for common callout types) ─────────────────

const CALLOUT_META: Record<string, { icon: string; color: string; label: string }> = {
  note: {
    icon: 'M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z',
    color: '#448aff',
    label: 'Note',
  },
  info: {
    icon: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 5v2m0 4h.01',
    color: '#448aff',
    label: 'Info',
  },
  tip: {
    icon: 'M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2ZM10 21h4',
    color: '#00bfa5',
    label: 'Tip',
  },
  hint: {
    icon: 'M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2ZM10 21h4',
    color: '#00bfa5',
    label: 'Hint',
  },
  important: {
    icon: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 5v6m0 4h.01',
    color: '#a855f7',
    label: 'Important',
  },
  success: {
    icon: 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3',
    color: '#00c853',
    label: 'Success',
  },
  check: {
    icon: 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3',
    color: '#00c853',
    label: 'Check',
  },
  question: {
    icon: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 14h.01M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3',
    color: '#64b5f6',
    label: 'Question',
  },
  faq: {
    icon: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 14h.01M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3',
    color: '#64b5f6',
    label: 'FAQ',
  },
  warning: {
    icon: 'M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0ZM12 9v4m0 4h.01',
    color: '#ff9100',
    label: 'Warning',
  },
  caution: {
    icon: 'M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0ZM12 9v4m0 4h.01',
    color: '#ff9100',
    label: 'Caution',
  },
  attention: {
    icon: 'M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0ZM12 9v4m0 4h.01',
    color: '#ff9100',
    label: 'Attention',
  },
  danger: {
    icon: 'M13 3a1 1 0 0 0-2 0 1 1 0 0 0 2 0ZM12 8v8m0 4h.01',
    color: '#ff1744',
    label: 'Danger',
  },
  error: {
    icon: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.93 14.93L8.46 8.46m0 8.47 8.47-8.47',
    color: '#ff1744',
    label: 'Error',
  },
  failure: {
    icon: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.93 14.93L8.46 8.46m0 8.47 8.47-8.47',
    color: '#ff1744',
    label: 'Failure',
  },
  bug: {
    icon: 'M8 2l1.88 1.88M14.12 3.88 16 2M9 7.13v-1a3.003 3.003 0 1 1 6 0v1M12 20c-3.3 0-6-2.7-6-6v-3a6 6 0 0 1 12 0v3c0 3.3-2.7 6-6 6ZM12 20v-9M6.53 9C4.6 8.8 3 7.1 3 5m17.53 4c1.93-.2 3.53-1.9 3.53-4M6 13H2m20 0h-4',
    color: '#ff1744',
    label: 'Bug',
  },
  example: { icon: 'M4 6h16M4 12h16M4 18h7', color: '#7c4dff', label: 'Example' },
  quote: {
    icon: 'M3 21c3 0 7-1 7-8V5c0-1.25-.76-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21ZM15 21c3 0 7-1 7-8V5c0-1.25-.757-2-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1Z',
    color: '#9e9e9e',
    label: 'Quote',
  },
  cite: {
    icon: 'M3 21c3 0 7-1 7-8V5c0-1.25-.76-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21ZM15 21c3 0 7-1 7-8V5c0-1.25-.757-2-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1Z',
    color: '#9e9e9e',
    label: 'Cite',
  },
  abstract: { icon: 'M4 6h16M4 12h10M4 18h14', color: '#00b0ff', label: 'Abstract' },
  summary: { icon: 'M4 6h16M4 12h10M4 18h14', color: '#00b0ff', label: 'Summary' },
  todo: {
    icon: 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3',
    color: '#00b0ff',
    label: 'Todo',
  },
};

export function getCalloutMeta(type: string) {
  return CALLOUT_META[type.toLowerCase()] ?? CALLOUT_META['note'];
}

export class CalloutWidget extends WidgetType {
  constructor(
    private calloutType: string,
    private title: string,
    private bodyLines: string[],
    private foldable: boolean,
    private collapsed: boolean
  ) {
    super();
  }

  toDOM(): HTMLElement {
    const meta = getCalloutMeta(this.calloutType);
    const wrap = document.createElement('div');
    wrap.className = `cm-callout cm-callout-${this.calloutType.toLowerCase()}`;
    wrap.style.borderLeftColor = meta.color;

    // Header row: icon + title
    const header = document.createElement('div');
    header.className = 'cm-callout-header';

    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('width', '18');
    icon.setAttribute('height', '18');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('fill', 'none');
    icon.setAttribute('stroke', meta.color);
    icon.setAttribute('stroke-width', '2');
    icon.setAttribute('stroke-linecap', 'round');
    icon.setAttribute('stroke-linejoin', 'round');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', meta.icon);
    icon.appendChild(path);
    header.appendChild(icon);

    const titleSpan = document.createElement('span');
    titleSpan.className = 'cm-callout-title';
    titleSpan.textContent = this.title || meta.label;
    titleSpan.style.color = meta.color;
    header.appendChild(titleSpan);

    if (this.foldable) {
      const chevron = document.createElement('span');
      chevron.className = `cm-callout-fold ${this.collapsed ? 'collapsed' : ''}`;
      chevron.textContent = '›';
      header.appendChild(chevron);
    }

    wrap.appendChild(header);

    // Body
    if (!this.collapsed && this.bodyLines.length > 0) {
      const body = document.createElement('div');
      body.className = 'cm-callout-body';
      body.textContent = this.bodyLines.join('\n');
      wrap.appendChild(body);
    }

    return wrap;
  }

  eq(other: CalloutWidget) {
    return (
      this.calloutType === other.calloutType &&
      this.title === other.title &&
      this.bodyLines.join('\n') === other.bodyLines.join('\n') &&
      this.collapsed === other.collapsed
    );
  }
}

// ─── Table rendering ─────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str.replace(
    /[<>&"']/g,
    (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' })[c]!
  );
}

/** Split a table row on `|` while preserving `|` inside `[[…]]` wikilinks. */
export function splitTableRow(row: string): string[] {
  const PLACEHOLDER = '\x00PIPE\x00';
  const masked = row.replace(/\[\[[^\]]*\]\]/g, (m) => m.replace(/\|/g, PLACEHOLDER));
  return masked.split('|').map((c) => c.replace(/\x00PIPE\x00/g, '|'));
}

function isSeparatorRow(line: string): boolean {
  const inner = line.trim().replace(/^\||\|$/g, '');
  const cells = splitTableRow(inner);
  return cells.length > 0 && cells.every((c) => /^\s*:?-+:?\s*$/.test(c));
}

export function renderTable(lines: string[]): string {
  const rows = lines
    .filter((l) => !isSeparatorRow(l))
    .map((l) => {
      const inner = l.trim().replace(/^\||\|$/g, '');
      return splitTableRow(inner).map((c) => c.trim());
    });

  if (rows.length === 0) return '';

  const header = rows[0];
  const body = rows.slice(1);

  let html = '<table class="cm-lp-table"><thead><tr>';
  for (const cell of header) {
    html += `<th>${escapeHtml(cell)}</th>`;
  }
  html += '</tr></thead><tbody>';
  for (const row of body) {
    html += '<tr>';
    for (const cell of row) {
      html += `<td>${escapeHtml(cell)}</td>`;
    }
    html += '</tr>';
  }
  html += '</tbody></table>';
  return html;
}
