<script lang="ts">
  import type { Task, DisplayOptions } from '@/types/data/task';

  export let task: Task;
  export let display: DisplayOptions;
  export let onToggle: ((sourcePath: string, line: number, newStatus: string) => void) | undefined =
    undefined;
  export let onNavigate: ((sourcePath: string, line: number) => void) | undefined = undefined;

  $: isHidden = (field: string) => display.hidden_fields.includes(field);
  $: priorityClass = task.priority !== 'none' ? `priority-${task.priority}` : '';

  const STATUS_CYCLE = ['open', 'inprogress', 'done'];
  function handleCheckbox() {
    if (!onToggle) return;
    const idx = STATUS_CYCLE.indexOf(task.status);
    const newStatus = idx >= 0 ? STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length] : 'open';
    onToggle(task.source_path, task.line, newStatus);
  }

  function handleNavigate() {
    if (onNavigate) {
      onNavigate(task.source_path, task.line);
    }
  }

  function formatDate(date: string | null): string {
    if (!date) return '';
    return date;
  }
</script>

<div
  class="task-item {priorityClass}"
  class:done={task.status === 'done'}
  class:cancelled={task.status === 'cancelled'}
>
  <button class="task-checkbox" on:click={handleCheckbox} title="Toggle status">
    {#if task.status === 'done'}
      <span class="check">&#10003;</span>
    {:else if task.status === 'cancelled'}
      <span class="cancel">&#215;</span>
    {:else if task.status === 'inprogress'}
      <span class="progress">/</span>
    {:else if task.status === 'onhold'}
      <span class="onhold">&#x23F8;</span>
    {:else}
      <span class="empty"></span>
    {/if}
  </button>

  <button class="task-text" on:click={handleNavigate} title={task.source_path}>
    {#if display.short_mode}
      {task.text.slice(0, 60)}{task.text.length > 60 ? '…' : ''}
    {:else}
      {task.text}
    {/if}
  </button>

  <div class="task-meta">
    {#if !isHidden('Priority') && task.priority !== 'none'}
      <span class="badge priority-badge {priorityClass}">{task.priority}</span>
    {/if}

    {#if !isHidden('DueDate') && task.due_date}
      <span class="badge date-badge" title="Due date">Due: {formatDate(task.due_date)}</span>
    {/if}

    {#if !isHidden('ScheduledDate') && task.scheduled_date}
      <span class="badge date-badge" title="Scheduled"
        >Sched: {formatDate(task.scheduled_date)}</span
      >
    {/if}

    {#if !isHidden('StartDate') && task.start_date}
      <span class="badge date-badge" title="Starts">Start: {formatDate(task.start_date)}</span>
    {/if}

    {#if !isHidden('RecurrenceRule') && task.recurrence}
      <span class="badge recurrence-badge" title="Recurrence">Repeat: {task.recurrence}</span>
    {/if}

    {#if !isHidden('Tags') && task.tags.length > 0}
      {#each task.tags as tag}
        <span class="badge tag-badge">#{tag}</span>
      {/each}
    {/if}
  </div>
</div>

<style>
  .task-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-xxs) var(--spacing-xs);
    border-radius: var(--radius-s);
    min-height: var(--status-bar-height);
  }

  .task-item:hover {
    background: var(--background-modifier-hover);
  }

  .task-item.done .task-text {
    text-decoration: line-through;
    opacity: 0.6;
  }

  .task-item.cancelled .task-text {
    text-decoration: line-through;
    opacity: 0.4;
  }

  .task-checkbox {
    width: 16px;
    height: 16px;
    border: 1.5px solid var(--text-muted);
    border-radius: var(--radius-xs);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
    background: transparent;
    padding: 0;
    font-size: var(--font-ui-xs);
  }

  .task-checkbox .check {
    color: var(--interactive-success);
  }

  .task-checkbox .cancel {
    color: var(--text-error);
  }

  .task-checkbox .progress {
    color: var(--status-info);
  }

  .task-checkbox .onhold {
    color: var(--text-warning, #f59e0b);
    font-size: 10px;
  }

  .task-text {
    flex: 1;
    cursor: pointer;
    background: none;
    border: none;
    color: inherit;
    font: inherit;
    text-align: left;
    padding: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .task-text:hover {
    text-decoration: underline;
  }

  .task-meta {
    display: flex;
    gap: var(--spacing-xs);
    flex-shrink: 0;
    align-items: center;
  }

  .badge {
    font-size: var(--font-ui-xs);
    padding: 1px var(--spacing-xs);
    border-radius: var(--radius-xs);
    white-space: nowrap;
  }

  .priority-badge {
    font-weight: var(--font-semibold);
  }

  .priority-highest {
    color: var(--text-error);
  }
  .priority-high {
    color: var(--status-warning);
  }
  .priority-medium {
    color: var(--status-info);
  }
  .priority-low {
    color: var(--text-muted);
  }
  .priority-lowest {
    color: var(--text-muted);
    opacity: 0.6;
  }

  .date-badge {
    color: var(--text-muted);
  }

  .recurrence-badge {
    color: var(--status-info);
  }

  .tag-badge {
    color: var(--text-accent);
    background: var(--background-secondary-alt);
  }
</style>
