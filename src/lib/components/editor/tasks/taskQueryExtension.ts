/**
 * CodeMirror extension for rendering ```tasks fenced code blocks.
 *
 * Detects tasks code blocks, executes the query DSL via the backend,
 * and renders results as a widget decoration below the code block.
 */

import {
  Decoration,
  EditorView,
  ViewPlugin,
  WidgetType,
} from '@codemirror/view';
import type { DecorationSet, ViewUpdate } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import { executeTaskQuery } from '@/features/tasks';
import type { TaskQueryResult } from '@/types/data/task';
import { log } from '@/utils/logger';
import { escapeHtml } from '@/utils/html';

interface TasksBlock {
  from: number;
  to: number;
  query: string;
}

class TaskQueryWidget extends WidgetType {
  private result: TaskQueryResult | null = null;
  private error: string | null = null;
  private loading = true;

  constructor(
    private query: string,
  ) {
    super();
  }

  setResult(result: TaskQueryResult) {
    this.result = result;
    this.error = null;
    this.loading = false;
  }

  setError(error: string) {
    this.error = error;
    this.result = null;
    this.loading = false;
  }

  toDOM(): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'cm-task-query-result';

    if (this.loading) {
      wrap.innerHTML = '<div class="task-query-loading">Running query…</div>';
      return wrap;
    }

    if (this.error) {
      wrap.innerHTML = `<div class="task-query-error">Query error: ${escapeHtml(this.error)}</div>`;
      return wrap;
    }

    if (!this.result) {
      return wrap;
    }

    if (this.result.total_count === 0) {
      wrap.innerHTML = '<div class="task-query-empty">No matching tasks.</div>';
      return wrap;
    }

    // Render groups/tasks
    const html = renderResult(this.result);
    wrap.innerHTML = html;
    return wrap;
  }

  eq(other: TaskQueryWidget): boolean {
    return this.query === other.query;
  }
}

function renderResult(result: TaskQueryResult): string {
  let html = '';

  for (const group of result.groups) {
    if (group.name) {
      html += `<div class="tq-group-header">${escapeHtml(group.name)} <span class="tq-count">(${group.count})</span></div>`;
    }
    for (const task of group.tasks) {
      const statusIcon = task.status === 'done' ? '&#10003;'
        : task.status === 'cancelled' ? '&#215;'
        : task.status === 'inprogress' ? '/'
        : '&#9675;';
      const doneClass = task.status === 'done' ? ' tq-done' : '';
      const cancelledClass = task.status === 'cancelled' ? ' tq-cancelled' : '';

      let meta = '';
      if (!result.display.hidden_fields.includes('Priority') && task.priority !== 'none') {
        meta += `<span class="tq-priority tq-priority-${task.priority}">${task.priority}</span>`;
      }
      if (!result.display.hidden_fields.includes('DueDate') && task.due_date) {
        meta += `<span class="tq-date">Due: ${task.due_date}</span>`;
      }
      if (!result.display.hidden_fields.includes('Tags') && task.tags.length > 0) {
        meta += task.tags.map(t => `<span class="tq-tag">#${escapeHtml(t)}</span>`).join('');
      }

      const text = result.display.short_mode
        ? escapeHtml(task.text.slice(0, 60)) + (task.text.length > 60 ? '…' : '')
        : escapeHtml(task.text);

      html += `<div class="tq-item${doneClass}${cancelledClass}">`;
      html += `<span class="tq-status">${statusIcon}</span>`;
      html += `<span class="tq-text">${text}</span>`;
      if (meta) html += `<span class="tq-meta">${meta}</span>`;
      html += `</div>`;
    }
  }

  html += `<div class="tq-footer">${result.total_count} task${result.total_count !== 1 ? 's' : ''}</div>`;
  return html;
}


function findTasksBlocks(view: EditorView): TasksBlock[] {
  const blocks: TasksBlock[] = [];
  const doc = view.state.doc;
  const text = doc.toString();

  // Find ```tasks ... ``` blocks via regex on raw text
  const regex = /^```tasks\s*\n([\s\S]*?)^```/gm;
  let match;

  while ((match = regex.exec(text)) !== null) {
    blocks.push({
      from: match.index,
      to: match.index + match[0].length,
      query: match[1].trim(),
    });
  }

  return blocks;
}

/**
 * Creates the tasks query CodeMirror extension.
 * @param contextPath - The path of the current note for template variable resolution.
 */
export function taskQueryExtension(contextPath?: string) {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet = Decoration.none;
      private results = new Map<string, TaskQueryResult | string>();
      private pending = new Set<string>();

      constructor(private view: EditorView) {
        this.computeDecorations();
        this.executeQueries();
      }

      update(update: ViewUpdate) {
        if (update.docChanged) {
          this.computeDecorations();
          this.executeQueries();
        }
      }

      private computeDecorations() {
        const builder = new RangeSetBuilder<Decoration>();
        const blocks = findTasksBlocks(this.view);

        for (const block of blocks) {
          const widget = new TaskQueryWidget(block.query);
          const cached = this.results.get(block.query);
          if (cached) {
            if (typeof cached === 'string') {
              widget.setError(cached);
            } else {
              widget.setResult(cached);
            }
          }
          builder.add(
            block.to,
            block.to,
            Decoration.widget({ widget, side: 1 }),
          );
        }

        this.decorations = builder.finish();
      }

      private async executeQueries() {
        const blocks = findTasksBlocks(this.view);
        for (const block of blocks) {
          if (this.results.has(block.query) || this.pending.has(block.query)) {
            continue;
          }
          this.pending.add(block.query);
          try {
            const result = await executeTaskQuery(block.query, contextPath);
            this.results.set(block.query, result);
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            this.results.set(block.query, msg);
            log.warn('Task query execution failed', { query: block.query, error: msg });
          } finally {
            this.pending.delete(block.query);
          }
          // Re-render
          this.computeDecorations();
          this.view.dispatch({});
        }
      }
    },
    {
      decorations: (v) => v.decorations,
    },
  );
}
