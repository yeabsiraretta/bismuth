/**
 * Tasks code-block widget — renders ```tasks blocks as a live task list.
 *
 * Scans all vault notes for checklist items matching task-service patterns,
 * renders them in an interactive widget with status icons, due date badges,
 * and priority indicators. Shows a friendly empty state when no tasks are found
 * or vault content hasn't been hydrated yet.
 */
import { type Range, StateEffect, StateField } from '@codemirror/state';
import { Decoration, type DecorationSet, EditorView, WidgetType } from '@codemirror/view';

import { getNotes } from '@/hubs/core/stores/vault-store.svelte';
import { getCachedContent } from '@/hubs/editor/services/file-ops';
import {
  isDueToday,
  isOverdue,
  type ParsedTask,
  parseTasksFromContent,
} from '@/hubs/planner/services/task-service';

// ── Fence detection ──────────────────────────────────────────────────────────

const FENCE_OPEN_RE = /^(`{3,}|~{3,})tasks\s*$/i;
const FENCE_CLOSE_RE = /^(`{3,}|~{3,})\s*$/;

interface TasksBlock {
  from: number;
  to: number;
  body: string;
}

function findTasksBlocks(view: EditorView): TasksBlock[] {
  const doc = view.state.doc;
  const blocks: TasksBlock[] = [];
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

    if (closed) {
      blocks.push({
        from: blockFrom,
        to: doc.line(i - 1).to,
        body: contentLines.join('\n'),
      });
    }
  }

  return blocks;
}

// ── Query parser ─────────────────────────────────────────────────────────────

interface TaskQuery {
  notDone: boolean;
  done: boolean;
  dueBefore?: string;
  dueAfter?: string;
  pathContains?: string;
  tagFilter?: string;
  sortBy: 'due' | 'priority' | 'status';
  limit: number;
}

function parseTaskQuery(body: string): TaskQuery {
  const q: TaskQuery = { notDone: false, done: false, sortBy: 'due', limit: 50 };
  const lines = body
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower === 'not done') q.notDone = true;
    else if (lower === 'done') q.done = true;
    else if (lower.startsWith('due before ')) q.dueBefore = line.slice(11).trim();
    else if (lower.startsWith('due after ')) q.dueAfter = line.slice(10).trim();
    else if (lower.startsWith('path includes '))
      q.pathContains = line.slice(14).trim().toLowerCase();
    else if (lower.startsWith('tag ') || lower.startsWith('#'))
      q.tagFilter = line.replace(/^(tag\s+|#)/, '').trim();
    else if (lower.startsWith('sort by '))
      q.sortBy = (line.slice(8).trim() as TaskQuery['sortBy']) || 'due';
    else if (lower.startsWith('limit ')) q.limit = Math.max(1, parseInt(line.slice(6), 10) || 50);
  }

  return q;
}

// ── Gather tasks from vault ─────────────────────────────────────────────────

interface VaultTask extends ParsedTask {
  notePath: string;
  noteName: string;
}

function gatherTasks(query: TaskQuery): VaultTask[] {
  const notes = getNotes();
  const tasks: VaultTask[] = [];

  for (const note of notes) {
    if (query.pathContains && !note.path.toLowerCase().includes(query.pathContains)) continue;

    const content = getCachedContent(note.path);
    if (!content) continue;

    const parsed = parseTasksFromContent(content, note.path);
    for (const t of parsed) {
      // Filter by status
      if (query.notDone && (t.status === 'done' || t.status === 'cancelled')) continue;
      if (query.done && t.status !== 'done') continue;

      // Filter by due date
      if (query.dueBefore && t.dueDate && t.dueDate >= query.dueBefore) continue;
      if (query.dueAfter && t.dueDate && t.dueDate <= query.dueAfter) continue;

      // Filter by tag
      if (
        query.tagFilter &&
        !t.tags.some((tag) => tag.toLowerCase() === query.tagFilter!.toLowerCase())
      )
        continue;

      const name = note.path.split('/').pop()?.replace(/\.md$/, '') ?? note.path;
      tasks.push({ ...t, notePath: note.path, noteName: name });
    }
  }

  // Sort
  tasks.sort((a, b) => {
    if (query.sortBy === 'due') {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    }
    if (query.sortBy === 'priority') {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return (order[a.priority] ?? 2) - (order[b.priority] ?? 2);
    }
    // status
    const sOrder = { blocked: 0, todo: 1, 'in-progress': 2, 'in-review': 3, done: 4, cancelled: 5 };
    return (sOrder[a.status] ?? 1) - (sOrder[b.status] ?? 1);
  });

  return tasks.slice(0, query.limit);
}

// ── Status helpers ───────────────────────────────────────────────────────────

function statusIcon(status: string): string {
  switch (status) {
    case 'done':
      return '✓';
    case 'cancelled':
      return '✕';
    case 'in-progress':
      return '◐';
    case 'in-review':
      return '▸';
    case 'blocked':
      return '!';
    default:
      return '○';
  }
}

function statusClass(status: string): string {
  return `cm-tasks-status-${status}`;
}

function priorityDot(priority: string): string {
  switch (priority) {
    case 'critical':
      return '🔴';
    case 'high':
      return '🟠';
    case 'low':
      return '🔵';
    default:
      return '';
  }
}

// ── Widget ───────────────────────────────────────────────────────────────────

class TasksWidget extends WidgetType {
  constructor(
    readonly query: TaskQuery,
    readonly bodyText: string
  ) {
    super();
  }

  toDOM(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'cm-tasks-widget';

    // Header
    const header = document.createElement('div');
    header.className = 'cm-tasks-header';

    const toggle = document.createElement('button');
    toggle.className = 'cm-tasks-toggle';
    toggle.textContent = '\u25BC';
    toggle.title = 'Collapse';
    toggle.setAttribute('aria-label', 'Toggle tasks');

    const label = document.createElement('span');
    label.className = 'cm-tasks-label';
    label.textContent = 'Tasks';

    const refresh = document.createElement('button');
    refresh.className = 'cm-tasks-refresh';
    refresh.textContent = '↻';
    refresh.title = 'Refresh tasks';
    refresh.setAttribute('aria-label', 'Refresh tasks');

    header.appendChild(toggle);
    header.appendChild(label);
    header.appendChild(refresh);
    wrapper.appendChild(header);

    // Body
    const body = document.createElement('div');
    body.className = 'cm-tasks-body';
    wrapper.appendChild(body);

    // Render tasks
    const renderTasks = () => {
      body.innerHTML = '';
      const tasks = gatherTasks(this.query);

      if (getNotes().length === 0) {
        const empty = document.createElement('div');
        empty.className = 'cm-tasks-empty';
        empty.innerHTML =
          '<span class="cm-tasks-empty-icon">📋</span>' +
          '<span class="cm-tasks-empty-title">No vault loaded</span>' +
          '<span class="cm-tasks-empty-hint">Open a vault to scan for tasks</span>';
        body.appendChild(empty);
        return;
      }

      if (tasks.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'cm-tasks-empty';
        empty.innerHTML =
          '<span class="cm-tasks-empty-icon">✨</span>' +
          '<span class="cm-tasks-empty-title">No tasks found</span>' +
          '<span class="cm-tasks-empty-hint">No tasks match the current query</span>';
        body.appendChild(empty);
        return;
      }

      const count = document.createElement('div');
      count.className = 'cm-tasks-count';
      count.textContent = `${tasks.length} task${tasks.length === 1 ? '' : 's'}`;
      body.appendChild(count);

      for (const task of tasks) {
        const row = document.createElement('div');
        row.className = `cm-tasks-row ${statusClass(task.status)}`;

        if (isOverdue(task)) row.classList.add('cm-tasks-overdue');
        else if (isDueToday(task)) row.classList.add('cm-tasks-today');

        // Status icon
        const icon = document.createElement('span');
        icon.className = 'cm-tasks-icon';
        icon.textContent = statusIcon(task.status);
        row.appendChild(icon);

        // Title
        const title = document.createElement('span');
        title.className = 'cm-tasks-title';
        title.textContent = task.title;
        row.appendChild(title);

        // Priority dot
        const prio = priorityDot(task.priority);
        if (prio) {
          const prioEl = document.createElement('span');
          prioEl.className = 'cm-tasks-priority';
          prioEl.textContent = prio;
          prioEl.title = task.priority;
          row.appendChild(prioEl);
        }

        // Due date badge
        if (task.dueDate) {
          const due = document.createElement('span');
          due.className = 'cm-tasks-due';
          due.textContent = task.dueDate;
          if (isOverdue(task)) due.classList.add('cm-tasks-due-overdue');
          else if (isDueToday(task)) due.classList.add('cm-tasks-due-today');
          row.appendChild(due);
        }

        // Tags
        if (task.tags.length > 0) {
          const tagsEl = document.createElement('span');
          tagsEl.className = 'cm-tasks-tags';
          tagsEl.textContent = task.tags.map((t) => `#${t}`).join(' ');
          row.appendChild(tagsEl);
        }

        // Note name
        const note = document.createElement('span');
        note.className = 'cm-tasks-note';
        note.textContent = task.noteName;
        note.title = task.notePath;
        note.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          window.dispatchEvent(new CustomEvent('open-note', { detail: { path: task.notePath } }));
        });
        row.appendChild(note);

        body.appendChild(row);
      }
    };

    renderTasks();

    // Refresh button
    refresh.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      renderTasks();
    });

    // Collapse/expand
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const collapsed = wrapper.classList.toggle('cm-tasks-collapsed');
      toggle.textContent = collapsed ? '\u25B6' : '\u25BC';
      toggle.title = collapsed ? 'Expand' : 'Collapse';
    });

    return wrapper;
  }

  eq(other: TasksWidget): boolean {
    return this.bodyText === other.bodyText;
  }

  ignoreEvent(): boolean {
    return true;
  }
}

// ── StateField (cross-line Decoration.replace) ───────────────────────────────

const setTasksDecos = StateEffect.define<DecorationSet>();
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

function buildDecorations(blocks: TasksBlock[], editing: Set<number>): DecorationSet {
  const decos: Range<Decoration>[] = [];
  for (const block of blocks) {
    if (editing.has(block.from)) continue;
    const query = parseTaskQuery(block.body);
    decos.push(
      Decoration.replace({
        widget: new TasksWidget(query, block.body),
        block: true,
      }).range(block.from, block.to)
    );
  }
  return Decoration.set(decos, true);
}

const tasksDecoField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(decos, tr) {
    for (const e of tr.effects) {
      if (e.is(setTasksDecos)) return e.value;
    }
    return tr.docChanged ? Decoration.none : decos;
  },
  provide: (f) => EditorView.decorations.from(f),
});

const tasksPlugin = EditorView.updateListener.of((update) => {
  if (update.transactions.some((tr) => tr.effects.some((e) => e.is(setTasksDecos)))) return;

  const hasToggle = update.transactions.some((tr) => tr.effects.some((e) => e.is(toggleEditBlock)));
  if (!update.docChanged && !update.selectionSet && !hasToggle) return;

  const view = update.view;
  const blocks = findTasksBlocks(view);
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
    view.dispatch({ effects: [...exitEffects, setTasksDecos.of(newDecos)] });
  });
});

const tasksEventHandler = EditorView.domEventHandlers({
  contextmenu(event, view) {
    if (!event.shiftKey) return false;
    const target = event.target as HTMLElement;
    const widgetEl = target.closest('.cm-tasks-widget');
    if (!widgetEl) return false;

    event.preventDefault();

    let pos: number;
    try {
      pos = view.posAtDOM(widgetEl);
    } catch {
      return false;
    }

    const blocks = findTasksBlocks(view);
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

const tasksTheme = EditorView.baseTheme({
  '.cm-tasks-widget': {
    display: 'block',
    margin: '4px 0',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '6px',
    overflow: 'hidden',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.82rem',
  },
  '.cm-tasks-header': {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    background: 'color-mix(in srgb, var(--color-surface-hover) 50%, transparent)',
    borderBottom: '1px solid var(--color-border)',
    cursor: 'default',
  },
  '.cm-tasks-toggle': {
    background: 'none',
    border: 'none',
    padding: '0 2px',
    fontSize: '0.65rem',
    color: 'var(--color-text-subtle)',
    cursor: 'pointer',
    lineHeight: '1',
  },
  '.cm-tasks-label': {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase' as string,
    letterSpacing: '0.05em',
    flex: '1',
  },
  '.cm-tasks-refresh': {
    background: 'none',
    border: 'none',
    padding: '2px 4px',
    fontSize: '0.8rem',
    color: 'var(--color-text-subtle)',
    cursor: 'pointer',
    borderRadius: '3px',
  },
  '.cm-tasks-refresh:hover': {
    background: 'var(--color-surface-hover)',
    color: 'var(--color-text)',
  },
  '.cm-tasks-body': {
    padding: '6px 0',
  },
  '.cm-tasks-count': {
    padding: '2px 12px 6px',
    fontSize: '0.7rem',
    color: 'var(--color-text-subtle)',
  },
  '.cm-tasks-row': {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px 12px',
    lineHeight: '1.5',
    cursor: 'default',
  },
  '.cm-tasks-row:hover': {
    background: 'var(--color-surface-hover)',
  },
  '.cm-tasks-icon': {
    flexShrink: '0',
    width: '16px',
    textAlign: 'center' as string,
    fontSize: '0.85em',
    color: 'var(--color-text-subtle)',
  },
  '.cm-tasks-status-done .cm-tasks-icon': {
    color: 'var(--color-success, #a6e3a1)',
  },
  '.cm-tasks-status-done .cm-tasks-title': {
    textDecoration: 'line-through',
    opacity: '0.6',
  },
  '.cm-tasks-status-cancelled .cm-tasks-icon': {
    color: 'var(--color-text-muted)',
  },
  '.cm-tasks-status-cancelled .cm-tasks-title': {
    textDecoration: 'line-through',
    opacity: '0.5',
  },
  '.cm-tasks-status-in-progress .cm-tasks-icon': {
    color: 'var(--color-accent)',
  },
  '.cm-tasks-status-blocked .cm-tasks-icon': {
    color: 'var(--color-error, #f38ba8)',
  },
  '.cm-tasks-title': {
    flex: '1',
    minWidth: '0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as string,
    color: 'var(--color-text)',
  },
  '.cm-tasks-priority': {
    flexShrink: '0',
    fontSize: '0.7em',
  },
  '.cm-tasks-due': {
    flexShrink: '0',
    fontSize: '0.72rem',
    padding: '1px 6px',
    borderRadius: '3px',
    background: 'color-mix(in srgb, var(--color-text-subtle) 15%, transparent)',
    color: 'var(--color-text-subtle)',
    fontVariantNumeric: 'tabular-nums',
  },
  '.cm-tasks-due-overdue': {
    background: 'color-mix(in srgb, var(--color-error, #f38ba8) 20%, transparent)',
    color: 'var(--color-error, #f38ba8)',
  },
  '.cm-tasks-due-today': {
    background: 'color-mix(in srgb, var(--color-warning, #f9e2af) 20%, transparent)',
    color: 'var(--color-warning, #f9e2af)',
  },
  '.cm-tasks-tags': {
    flexShrink: '0',
    fontSize: '0.7rem',
    color: 'var(--color-accent)',
    opacity: '0.8',
  },
  '.cm-tasks-note': {
    flexShrink: '0',
    fontSize: '0.7rem',
    color: 'var(--color-text-subtle)',
    cursor: 'pointer',
    opacity: '0',
    transition: 'opacity 0.15s',
  },
  '.cm-tasks-row:hover .cm-tasks-note': {
    opacity: '1',
  },
  '.cm-tasks-note:hover': {
    color: 'var(--color-accent)',
    textDecoration: 'underline',
  },
  '.cm-tasks-overdue': {
    borderLeft: '2px solid var(--color-error, #f38ba8)',
  },
  '.cm-tasks-today': {
    borderLeft: '2px solid var(--color-warning, #f9e2af)',
  },
  '.cm-tasks-empty': {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    padding: '20px 12px',
    textAlign: 'center' as string,
  },
  '.cm-tasks-empty-icon': {
    fontSize: '1.5rem',
  },
  '.cm-tasks-empty-title': {
    fontSize: '0.82rem',
    fontWeight: '600',
    color: 'var(--color-text-muted)',
  },
  '.cm-tasks-empty-hint': {
    fontSize: '0.72rem',
    color: 'var(--color-text-subtle)',
  },
  '.cm-tasks-collapsed .cm-tasks-body': {
    display: 'none',
  },
  '.cm-tasks-collapsed .cm-tasks-header': {
    borderBottom: 'none',
  },
});

export function tasksExtension() {
  return [editingBlocksField, tasksDecoField, tasksPlugin, tasksEventHandler, tasksTheme];
}
