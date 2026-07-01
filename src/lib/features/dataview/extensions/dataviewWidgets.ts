/**
 * Widget classes for rendering Dataview query results inside CodeMirror.
 *
 * Renders TABLE, LIST, and TASK results with editable inline field support.
 */

import { WidgetType } from '@codemirror/view';
import type { EditorView } from '@codemirror/view';
import type { DvResult, DvValue, DvLink, DvTask } from '@/features/dataview/types/dataview';
import { escapeHtml } from '@/utils/html';

export class DataviewResultWidget extends WidgetType {
  private result: DvResult | null = null;
  private error: string | null = null;
  private loading = true;

  constructor(private query: string) { super(); }

  setResult(result: DvResult) {
    this.result = result;
    this.error = null;
    this.loading = false;
  }

  setError(error: string) {
    this.error = error;
    this.result = null;
    this.loading = false;
  }

  toDOM(_view: EditorView): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'cm-dv-result';

    if (this.loading) {
      wrap.innerHTML = '<div class="dv-loading"><span class="dv-spinner"></span> Querying vault…</div>';
      return wrap;
    }

    if (this.error) {
      wrap.innerHTML = `<div class="dv-error"><strong>Dataview Error:</strong> ${escapeHtml(this.error)}</div>`;
      return wrap;
    }

    if (!this.result) return wrap;

    switch (this.result.type) {
      case 'table': wrap.appendChild(renderTable(this.result.headers, this.result.rows)); break;
      case 'list': wrap.appendChild(renderList(this.result.items)); break;
      case 'task': wrap.appendChild(renderTasks(this.result.tasks)); break;
    }

    // Footer
    const footer = document.createElement('div');
    footer.className = 'dv-footer';
    footer.textContent = `${this.result.totalCount} result${this.result.totalCount !== 1 ? 's' : ''}`;
    wrap.appendChild(footer);

    return wrap;
  }

  eq(other: DataviewResultWidget): boolean {
    return this.query === other.query;
  }
}

// ─── Table renderer ──────────────────────────────────────────────────────────

function renderTable(headers: string[], rows: DvValue[][]): HTMLElement {
  const table = document.createElement('table');
  table.className = 'dv-table';

  // Header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  for (const h of headers) {
    const th = document.createElement('th');
    th.textContent = h;
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Body
  const tbody = document.createElement('tbody');
  for (const row of rows) {
    const tr = document.createElement('tr');
    for (const cell of row) {
      const td = document.createElement('td');
      td.appendChild(renderValue(cell));
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);

  return table;
}

// ─── List renderer ───────────────────────────────────────────────────────────

function renderList(items: Array<{ value: DvValue; page: DvLink }>): HTMLElement {
  const ul = document.createElement('ul');
  ul.className = 'dv-list';

  for (const item of items) {
    const li = document.createElement('li');
    li.className = 'dv-list-item';

    const link = document.createElement('a');
    link.className = 'dv-link';
    link.textContent = item.page.display ?? item.page.path;
    link.setAttribute('data-dv-path', item.page.path);
    link.href = '#';
    li.appendChild(link);

    if (item.value !== null && item.value !== item.page.display) {
      const sep = document.createTextNode(' — ');
      li.appendChild(sep);
      li.appendChild(renderValue(item.value));
    }

    ul.appendChild(li);
  }

  return ul;
}

// ─── Task renderer ───────────────────────────────────────────────────────────

function renderTasks(tasks: DvTask[]): HTMLElement {
  const ul = document.createElement('ul');
  ul.className = 'dv-task-list';

  for (const task of tasks) {
    const li = document.createElement('li');
    li.className = `dv-task-item${task.completed ? ' dv-done' : ''}`;

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = task.completed;
    cb.className = 'dv-task-checkbox';
    cb.disabled = true;
    li.appendChild(cb);

    const text = document.createElement('span');
    text.className = 'dv-task-text';
    text.textContent = task.text;
    li.appendChild(text);

    if (task.tags.length > 0) {
      const tags = document.createElement('span');
      tags.className = 'dv-task-tags';
      tags.innerHTML = task.tags.map((t) => `<span class="dv-tag">#${escapeHtml(t)}</span>`).join(' ');
      li.appendChild(tags);
    }

    const src = document.createElement('a');
    src.className = 'dv-task-source dv-link';
    src.textContent = task.path.split('/').pop() ?? task.path;
    src.setAttribute('data-dv-path', task.path);
    src.href = '#';
    li.appendChild(src);

    ul.appendChild(li);
  }

  return ul;
}

// ─── Value renderer ──────────────────────────────────────────────────────────

function renderValue(value: DvValue): Node {
  if (value === null) {
    const em = document.createElement('em');
    em.className = 'dv-null';
    em.textContent = '–';
    return em;
  }

  if (typeof value === 'boolean') {
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = value;
    cb.disabled = true;
    cb.className = 'dv-bool';
    return cb;
  }

  if (value instanceof Date) {
    const span = document.createElement('span');
    span.className = 'dv-date';
    span.textContent = value.toLocaleDateString();
    return span;
  }

  if (typeof value === 'object' && 'type' in value && value.type === 'link') {
    const link = value as DvLink;
    const a = document.createElement('a');
    a.className = 'dv-link';
    a.textContent = link.display ?? link.path;
    a.setAttribute('data-dv-path', link.path);
    a.href = '#';
    return a;
  }

  if (Array.isArray(value)) {
    const span = document.createElement('span');
    span.className = 'dv-array';
    for (let i = 0; i < value.length; i++) {
      if (i > 0) span.appendChild(document.createTextNode(', '));
      span.appendChild(renderValue(value[i]));
    }
    return span;
  }

  return document.createTextNode(String(value));
}
