<script lang="ts">
  import { SvelteMap } from 'svelte/reactivity';
  import {
    formatTaskId,
    updateTask,
    removeTask,
    toggleDone,
  } from '@/hubs/planner/stores/pm-task-store.svelte';
  import { DEFAULT_STATUSES, DEFAULT_PRIORITIES } from '@/hubs/planner/types/pm-types';
  import type { PMStatus, PMTask } from '@/hubs/planner/types/pm-types';
  import { isOverdue, isDueToday } from '@/hubs/planner/services/task-service';
  import ContextMenu from '@/ui/context-menu.svelte';

  interface Props {
    tasks: PMTask[];
    columns?: PMStatus[];
  }

  let { tasks, columns = ['todo', 'in-progress', 'in-review', 'done'] }: Props = $props();

  let columnTasks = $derived.by(() => {
    const map = new SvelteMap<PMStatus, PMTask[]>();
    for (const col of columns) map.set(col, []);
    for (const t of tasks) {
      const bucket = map.get(t.status);
      if (bucket) bucket.push(t);
    }
    return map;
  });

  function columnLabel(status: PMStatus): string {
    return DEFAULT_STATUSES.find((s) => s.id === status)?.label ?? status;
  }

  function columnColor(status: PMStatus): string {
    return DEFAULT_STATUSES.find((s) => s.id === status)?.color ?? '#6b7280';
  }

  function priorityColor(p: string): string {
    return DEFAULT_PRIORITIES.find((c) => c.id === p)?.color ?? '#6b7280';
  }

  function formatRelDate(d: string | null): string {
    if (!d) return '';
    const today = new Date().toISOString().slice(0, 10);
    if (d === today) return 'Today';
    const diff = Math.round((new Date(d).getTime() - new Date(today).getTime()) / 86_400_000);
    if (diff === 1) return 'Tomorrow';
    if (diff === -1) return 'Yesterday';
    if (diff < 0) return `${Math.abs(diff)}d ago`;
    if (diff <= 7) return `In ${diff}d`;
    return d;
  }

  // Drag and drop
  let dragTaskId: string | null = $state(null);
  let dragOverCol: PMStatus | null = $state(null);
  let dragEnterCount = 0;

  function onDragStart(e: globalThis.DragEvent, taskId: string) {
    dragTaskId = taskId;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', taskId);
    }
  }

  function onDragEnter(e: globalThis.DragEvent, col: PMStatus) {
    e.preventDefault();
    dragEnterCount++;
    dragOverCol = col;
  }

  function onDragOver(e: globalThis.DragEvent, col: PMStatus) {
    e.preventDefault();
    dragOverCol = col;
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
  }

  function onDragLeave() {
    dragEnterCount--;
    if (dragEnterCount <= 0) {
      dragEnterCount = 0;
      dragOverCol = null;
    }
  }

  function onDrop(e: globalThis.DragEvent, col: PMStatus) {
    e.preventDefault();
    dragEnterCount = 0;
    dragOverCol = null;
    if (dragTaskId) {
      updateTask(dragTaskId, {
        status: col,
        doneDate: col === 'done' ? new Date().toISOString() : null,
      });
    }
    dragTaskId = null;
  }

  function onDragEnd() {
    dragTaskId = null;
    dragOverCol = null;
    dragEnterCount = 0;
  }

  // Context menu
  let ctxTask: PMTask | null = $state(null);
  let ctxX = $state(0);
  let ctxY = $state(0);

  function handleContext(e: MouseEvent, task: PMTask) {
    e.preventDefault();
    ctxTask = task;
    ctxX = e.clientX;
    ctxY = e.clientY;
  }
  function closeCtx() {
    ctxTask = null;
  }
</script>

<div class="kanban-board">
  {#each columns as col (col)}
    {@const colTasks = columnTasks.get(col) ?? []}
    <div
      class="kanban-column"
      class:drag-over={dragOverCol === col}
      ondragenter={(e) => onDragEnter(e, col)}
      ondragover={(e) => onDragOver(e, col)}
      ondragleave={onDragLeave}
      ondrop={(e) => onDrop(e, col)}
      role="list"
    >
      <div class="kanban-col-header">
        <span class="kanban-col-dot" style="background:{columnColor(col)}"></span>
        <span class="kanban-col-label">{columnLabel(col)}</span>
        <span class="kanban-col-count">{colTasks.length}</span>
      </div>
      <div class="kanban-col-body">
        {#each colTasks as task (task.id)}
          <div
            class="kanban-card"
            class:dragging={dragTaskId === task.id}
            class:overdue-card={isOverdue(task)}
            class:today-card={isDueToday(task)}
            draggable="true"
            ondragstart={(e) => onDragStart(e, task.id)}
            ondragend={onDragEnd}
            oncontextmenu={(e) => handleContext(e, task)}
            role="listitem"
          >
            <div class="card-header">
              <button
                class="card-check"
                onclick={() => toggleDone(task.id)}
                aria-label={task.status === 'done' ? 'Reopen' : 'Done'}
              >
                <span class="check-box" class:checked={task.status === 'done'}></span>
              </button>
              <span class="card-title" class:done-title={task.status === 'done'}
                ><span class="card-id">{formatTaskId(task.taskNumber)}</span> {task.title}</span
              >
            </div>
            <div class="card-meta">
              <span class="card-prio" style="color:{priorityColor(task.priority)}"
                >{task.priority}</span
              >
              {#if task.dueDate}
                <span
                  class="card-due"
                  class:overdue-text={isOverdue(task)}
                  class:today-text={isDueToday(task)}
                >
                  {formatRelDate(task.dueDate)}
                </span>
              {/if}
              {#if task.recurrence}
                <span class="card-recur">Rec</span>
              {/if}
            </div>
            {#if task.tags.length > 0}
              <div class="card-tags">
                {#each task.tags.slice(0, 3) as tag (tag)}
                  <span class="card-tag">#{tag}</span>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/each}
</div>

<ContextMenu x={ctxX} y={ctxY} show={!!ctxTask} onclose={closeCtx}>
  <button
    class="ctx-item"
    onclick={() => {
      if (ctxTask) toggleDone(ctxTask.id);
      closeCtx();
    }}
    role="menuitem"
  >
    {ctxTask?.status === 'done' ? 'Reopen' : 'Mark Done'}
  </button>
  <button
    class="ctx-item"
    onclick={() => {
      if (ctxTask) navigator.clipboard.writeText(formatTaskId(ctxTask.taskNumber));
      closeCtx();
    }}
    role="menuitem">Copy ID</button
  >
  <button
    class="ctx-item"
    onclick={() => {
      if (ctxTask) navigator.clipboard.writeText(ctxTask.title);
      closeCtx();
    }}
    role="menuitem">Copy Title</button
  >
  <button
    class="ctx-item ctx-danger"
    onclick={() => {
      if (ctxTask) removeTask(ctxTask.id);
      closeCtx();
    }}
    role="menuitem">Delete</button
  >
</ContextMenu>

<style>
  .kanban-board {
    display: flex;
    gap: 8px;
    height: 100%;
    overflow-x: auto;
    padding: 8px;
  }
  .kanban-column {
    flex: 1;
    min-width: 180px;
    max-width: 320px;
    display: flex;
    flex-direction: column;
    background: var(--color-surface);
    border-radius: var(--radius-m);
    border: 1px solid var(--color-border);
    transition: border-color var(--transition-base);
  }
  .kanban-column.drag-over {
    border-color: var(--color-accent);
    background: oklch(from var(--color-accent) l c h / 0.05);
  }
  .kanban-col-header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 10px;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }
  .kanban-col-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .kanban-col-label {
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--color-text);
    flex: 1;
  }
  .kanban-col-count {
    font-size: 0.6rem;
    color: var(--color-text-muted);
    background: var(--color-surface-hover);
    padding: 1px 5px;
    border-radius: var(--radius-m);
  }
  .kanban-col-body {
    flex: 1;
    overflow-y: auto;
    padding: 6px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .kanban-card {
    padding: 8px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-background);
    cursor: grab;
    transition: all var(--transition-base);
    border-left: 2px solid transparent;
  }
  .kanban-card:hover {
    box-shadow: var(--shadow-s);
    border-color: var(--color-accent);
  }
  .kanban-card.dragging {
    opacity: 0.4;
  }
  .kanban-card.overdue-card {
    border-left-color: var(--color-error);
  }
  .kanban-card.today-card {
    border-left-color: var(--color-accent);
  }
  .card-header {
    display: flex;
    align-items: flex-start;
    gap: 5px;
  }
  .card-check {
    width: 16px;
    height: 16px;
    border: none;
    background: transparent;
    cursor: pointer;
    flex-shrink: 0;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .check-box {
    width: 10px;
    height: 10px;
    border: 1.5px solid var(--color-border);
    border-radius: 2px;
    display: inline-block;
    transition: all var(--transition-base);
  }
  .check-box.checked {
    background: var(--color-accent);
    border-color: var(--color-accent);
  }
  .card-check:hover .check-box {
    border-color: var(--color-accent);
  }
  .card-title {
    font-size: 0.7rem;
    color: var(--color-text);
    line-height: 1.3;
    word-break: break-word;
  }
  .card-id {
    font-size: 0.55rem;
    font-weight: 600;
    color: var(--color-text-muted);
    font-family: var(--font-mono, monospace);
    margin-right: 3px;
  }
  .done-title {
    text-decoration: line-through;
    opacity: 0.5;
  }
  .card-meta {
    display: flex;
    gap: 5px;
    align-items: center;
    margin-top: 4px;
    flex-wrap: wrap;
  }
  .card-prio {
    font-size: 0.55rem;
    text-transform: uppercase;
    font-weight: 600;
  }
  .card-due {
    font-size: 0.55rem;
    color: var(--color-text-subtle);
  }
  .overdue-text {
    color: var(--color-error);
    font-weight: 600;
  }
  .today-text {
    color: var(--color-accent);
    font-weight: 600;
  }
  .card-recur {
    font-size: 0.5rem;
    color: var(--color-text-subtle);
    padding: 0 3px;
    border: 1px solid var(--color-border);
    border-radius: 2px;
  }
  .card-tags {
    display: flex;
    gap: 3px;
    margin-top: 3px;
    flex-wrap: wrap;
  }
  .card-tag {
    font-size: 0.5rem;
    color: var(--color-accent);
  }
  .ctx-danger {
    color: var(--color-error);
  }
</style>
