/**
 * Dataview API — high-level JavaScript API for querying the note index.
 *
 * Provides the `dv.*` interface similar to Obsidian Dataview's DataviewJS.
 * Also exposes `runDataviewQuery()` for DQL string execution and
 * `renderQueryResult()` for HTML output.
 */

import {
  executeDataviewQuery,
  type QueryResult,
  type QueryResultRow,
} from '@/hubs/knowledge/services/dataview-executor';
import { parseDataviewQuery } from '@/hubs/knowledge/services/dataview-query';
import {
  buildNoteIndex,
  getFieldValue,
  type NoteRecord,
} from '@/hubs/knowledge/services/note-index';

// ── DQL execution ────────────────────────────────────────────────────────────

export function runDataviewQuery(dql: string): QueryResult {
  const query = parseDataviewQuery(dql);
  const index = buildNoteIndex();
  return executeDataviewQuery(query, index);
}

// ── DataviewJS-style API ─────────────────────────────────────────────────────

class DataviewAPI {
  private index: NoteRecord[];
  private currentPath: string | null;

  constructor(currentPath?: string) {
    this.index = buildNoteIndex();
    this.currentPath = currentPath ?? null;
  }

  pages(source?: string): PageArray {
    let records = this.index;

    if (source) {
      if (source.startsWith('#')) {
        const tag = source.slice(1);
        records = records.filter((r) =>
          r.file.tags.some((t) => t === tag || t.startsWith(tag + '/'))
        );
      } else if (source.startsWith('"') && source.endsWith('"')) {
        const folder = source.slice(1, -1);
        records = records.filter(
          (r) => r.file.path.startsWith(folder + '/') || r.file.folder === folder
        );
      }
    }

    return new PageArray(records);
  }

  page(pathOrName: string): NoteRecord | undefined {
    return this.index.find(
      (r) =>
        r.file.path === pathOrName ||
        r.file.name.toLowerCase() === pathOrName.toLowerCase().replace(/\.md$/, '')
    );
  }

  current(): NoteRecord | undefined {
    if (!this.currentPath) return undefined;
    return this.index.find((r) => r.file.path === this.currentPath);
  }

  list(items: unknown[]): string {
    if (items.length === 0) return '<p class="dv-empty">No results</p>';
    const lis = items.map((item) => `<li>${escapeHtml(String(item))}</li>`).join('\n');
    return `<ul class="dv-list">\n${lis}\n</ul>`;
  }

  table(headers: string[], rows: unknown[][]): string {
    if (rows.length === 0) return '<p class="dv-empty">No results</p>';

    const ths = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('');
    const thead = `<thead><tr>${ths}</tr></thead>`;

    const trs = rows
      .map((row) => {
        const tds = row.map((cell) => `<td>${formatCell(cell)}</td>`).join('');
        return `<tr>${tds}</tr>`;
      })
      .join('\n');
    const tbody = `<tbody>\n${trs}\n</tbody>`;

    return `<table class="dv-table">\n${thead}\n${tbody}\n</table>`;
  }

  taskList(tasks: { text: string; completed: boolean }[]): string {
    if (tasks.length === 0) return '<p class="dv-empty">No tasks</p>';
    const lis = tasks
      .map((t) => {
        const checked = t.completed ? ' checked' : '';
        return `<li class="dv-task"><input type="checkbox"${checked} disabled /> ${escapeHtml(t.text)}</li>`;
      })
      .join('\n');
    return `<ul class="dv-task-list">\n${lis}\n</ul>`;
  }

  header(level: number, text: string): string {
    const tag = `h${Math.min(Math.max(level, 1), 6)}`;
    return `<${tag} class="dv-header">${escapeHtml(text)}</${tag}>`;
  }

  paragraph(text: string): string {
    return `<p class="dv-paragraph">${escapeHtml(text)}</p>`;
  }
}

// ── PageArray (chainable queries) ────────────────────────────────────────────

class PageArray {
  constructor(public records: NoteRecord[]) {}

  where(predicate: (p: NoteRecord) => boolean): PageArray {
    return new PageArray(this.records.filter(predicate));
  }

  sort(key: (p: NoteRecord) => unknown, order: 'asc' | 'desc' = 'asc'): PageArray {
    const sorted = [...this.records].sort((a, b) => {
      const av = key(a);
      const bv = key(b);
      if (av === bv) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp =
        typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv));
      return order === 'desc' ? -cmp : cmp;
    });
    return new PageArray(sorted);
  }

  limit(n: number): PageArray {
    return new PageArray(this.records.slice(0, n));
  }

  groupBy(key: (p: NoteRecord) => unknown): Map<unknown, NoteRecord[]> {
    const groups = new Map<unknown, NoteRecord[]>();
    for (const r of this.records) {
      const k = key(r);
      const arr = groups.get(k) ?? [];
      arr.push(r);
      groups.set(k, arr);
    }
    return groups;
  }

  flatMap<T>(fn: (p: NoteRecord) => T[]): T[] {
    return this.records.flatMap(fn);
  }

  map<T>(fn: (p: NoteRecord) => T): T[] {
    return this.records.map(fn);
  }

  get length(): number {
    return this.records.length;
  }

  get file(): { tasks: { text: string; completed: boolean; path: string }[] } {
    return {
      tasks: this.records.flatMap((r) => r.tasks),
    };
  }
}

// ── DQL result renderer ─────────────────────────────────────────────────────

export function renderQueryResult(result: QueryResult): string {
  switch (result.mode) {
    case 'TABLE':
      return renderTable(result);
    case 'LIST':
      return renderList(result);
    case 'TASK':
      return renderTaskList(result);
    case 'CALENDAR':
      return renderCalendar(result);
  }
}

function renderTable(result: QueryResult): string {
  if (result.groups.length > 0) {
    return result.groups
      .map((g) => {
        const header = `<h4 class="dv-group-header">${escapeHtml(String(g.key))}</h4>`;
        const table = buildTable(result.fields, g.rows);
        return header + '\n' + table;
      })
      .join('\n');
  }
  return buildTable(result.fields, result.rows);
}

function buildTable(fields: { path: string; alias?: string }[], rows: QueryResultRow[]): string {
  if (rows.length === 0) return '<p class="dv-empty">No results</p>';

  const headers = ['File', ...fields.map((f) => f.alias ?? f.path)];
  const ths = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('');

  const trs = rows
    .map((row) => {
      const link = `<td><a class="dv-file-link" data-path="${escapeHtml(row.record.file.path)}">${escapeHtml(row.record.file.name)}</a></td>`;
      const vals = fields
        .map((f) => {
          const key = f.alias ?? f.path;
          const val = row.values.get(key) ?? getFieldValue(row.record, f.path);
          return `<td>${formatCell(val)}</td>`;
        })
        .join('');
      return `<tr>${link}${vals}</tr>`;
    })
    .join('\n');

  return `<table class="dv-table">\n<thead><tr>${ths}</tr></thead>\n<tbody>\n${trs}\n</tbody>\n</table>`;
}

function renderList(result: QueryResult): string {
  if (result.rows.length === 0) return '<p class="dv-empty">No results</p>';

  const lis = result.rows
    .map((row) => {
      const name = row.record.file.name;
      const extra =
        result.fields.length > 0
          ? ': ' +
            result.fields.map((f) => formatCell(row.values.get(f.alias ?? f.path))).join(', ')
          : '';
      return `<li><a class="dv-file-link" data-path="${escapeHtml(row.record.file.path)}">${escapeHtml(name)}</a>${extra}</li>`;
    })
    .join('\n');

  return `<ul class="dv-list">\n${lis}\n</ul>`;
}

function renderTaskList(result: QueryResult): string {
  if (result.tasks.length === 0) return '<p class="dv-empty">No tasks</p>';

  const lis = result.tasks
    .map((t) => {
      const checked = t.completed ? ' checked' : '';
      return `<li class="dv-task"><input type="checkbox"${checked} disabled /> ${escapeHtml(t.text)}</li>`;
    })
    .join('\n');

  return `<ul class="dv-task-list">\n${lis}\n</ul>`;
}

function renderCalendar(result: QueryResult): string {
  if (!result.calendarField) return '<p class="dv-empty">No date field specified</p>';

  const dates = new Map<string, string[]>();
  for (const row of result.rows) {
    const dateVal = getFieldValue(row.record, result.calendarField);
    if (!dateVal) continue;
    const dateStr = String(dateVal).slice(0, 10);
    const list = dates.get(dateStr) ?? [];
    list.push(row.record.file.name);
    dates.set(dateStr, list);
  }

  const entries = Array.from(dates.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([date, names]) =>
        `<li><strong>${escapeHtml(date)}</strong>: ${names.map(escapeHtml).join(', ')}</li>`
    )
    .join('\n');

  return `<ul class="dv-calendar">\n${entries}\n</ul>`;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return '<span class="dv-null">-</span>';
  if (Array.isArray(value)) return value.map((v) => escapeHtml(String(v))).join(', ');
  if (typeof value === 'boolean') return value ? '✓' : '✗';
  return escapeHtml(String(value));
}
