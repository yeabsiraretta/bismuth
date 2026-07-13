<script lang="ts">
  import { formatTaskId, toggleDone } from '@/hubs/planner/stores/pm-task-store.svelte';
  import { DEFAULT_PRIORITIES, DEFAULT_STATUSES } from '@/hubs/planner/types/pm-types';
  import type { PMPriority, PMStatus, PMTask } from '@/hubs/planner/types/pm-types';
  import { isOverdue, isDueToday } from '@/hubs/planner/services/task-service';

  let {
    task,
    oncontextmenu,
    ondblclick,
    oncyclestatus,
    oncyclepriority,
  }: {
    task: PMTask;
    oncontextmenu: (e: MouseEvent) => void;
    ondblclick: () => void;
    oncyclestatus: () => void;
    oncyclepriority: () => void;
  } = $props();

  function statusLabel(s: PMStatus): string {
    return DEFAULT_STATUSES.find((c) => c.id === s)?.label ?? s;
  }

  function statusColor(s: PMStatus): string {
    return DEFAULT_STATUSES.find((c) => c.id === s)?.color ?? '#6b7280';
  }

  function priorityColor(p: PMPriority): string {
    return DEFAULT_PRIORITIES.find((c) => c.id === p)?.color ?? '#6b7280';
  }

  function priorityLabel(p: PMPriority): string {
    return DEFAULT_PRIORITIES.find((c) => c.id === p)?.label ?? p;
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
</script>

<li
  class="task-item"
  class:completed={task.status === 'done'}
  class:overdue-item={isOverdue(task)}
  class:today-item={isDueToday(task)}
  {oncontextmenu}
  {ondblclick}
  role="listitem"
>
  <button
    class="task-check"
    onclick={() => toggleDone(task.id)}
    aria-label={task.status === 'done' ? 'Mark incomplete' : 'Mark complete'}
  >
    <span class="check-box" class:checked={task.status === 'done'}></span>
  </button>
  <div class="task-info">
    <span class="task-title"
      ><span class="task-id">{formatTaskId(task.taskNumber)}</span> {task.title}</span
    >
    <div class="task-meta">
      <button
        class="task-status-badge"
        style="color:{statusColor(task.status)}"
        onclick={oncyclestatus}
        title="Click to cycle status"
      >
        {statusLabel(task.status)}
      </button>
      <button
        class="task-prio-badge"
        style="color:{priorityColor(task.priority)}"
        onclick={oncyclepriority}
        title="Click to cycle priority"
      >
        {priorityLabel(task.priority)}
      </button>
      {#if task.dueDate}
        <span
          class="task-due"
          class:overdue-text={isOverdue(task)}
          class:today-text={isDueToday(task)}
        >
          {formatRelDate(task.dueDate)}
        </span>
      {/if}
      {#if task.recurrence}
        <span class="task-recur">Recurring</span>
      {/if}
      {#each task.tags.slice(0, 3) as tag (tag)}
        <span class="task-tag">#{tag}</span>
      {/each}
    </div>
  </div>
</li>

<style>
  .task-item {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    padding: 5px 6px;
    border-radius: var(--radius-s);
    border-left: 2px solid transparent;
  }
  .task-item:hover {
    background: var(--color-surface-hover);
  }
  .task-item.completed {
    opacity: 0.45;
  }
  .task-item.overdue-item {
    border-left-color: var(--color-error);
  }
  .task-item.today-item {
    border-left-color: var(--color-accent);
  }

  .task-check {
    width: 18px;
    height: 18px;
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
    width: 12px;
    height: 12px;
    border: 1.5px solid var(--color-border);
    border-radius: 2px;
    display: inline-block;
    transition: all var(--transition-base);
  }
  .check-box.checked {
    background: var(--color-accent);
    border-color: var(--color-accent);
  }
  .task-check:hover .check-box {
    border-color: var(--color-accent);
  }

  .task-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
    gap: 1px;
  }
  .task-title {
    font-size: 0.75rem;
    color: var(--color-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .task-id {
    font-size: 0.6rem;
    font-weight: 600;
    color: var(--color-text-muted);
    font-family: var(--font-mono, monospace);
    margin-right: 4px;
  }
  .completed .task-title {
    text-decoration: line-through;
  }

  .task-meta {
    display: flex;
    gap: 4px;
    align-items: center;
    flex-wrap: wrap;
  }
  .task-status-badge,
  .task-prio-badge {
    font-size: 0.55rem;
    text-transform: uppercase;
    font-weight: 600;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    font-family: inherit;
    letter-spacing: 0.02em;
  }
  .task-status-badge:hover,
  .task-prio-badge:hover {
    text-decoration: underline;
  }

  .task-due {
    font-size: 0.6rem;
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

  .task-recur {
    font-size: 0.55rem;
    color: var(--color-text-subtle);
    padding: 0 3px;
    border: 1px solid var(--color-border);
    border-radius: 2px;
  }
  .task-tag {
    font-size: 0.55rem;
    color: var(--color-accent);
  }
</style>
