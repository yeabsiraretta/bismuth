<script lang="ts">
  import type { Task } from '@/types/data/task';

  export let task: Task;

  const priorityColors: Record<string, string> = {
    critical: 'var(--status-deleted)',
    high: 'var(--status-warning)',
    medium: 'var(--status-info)',
    low: 'var(--text-muted)',
    none: 'var(--text-muted)',
  };
</script>

<div class="kanban-card" draggable="true">
  <div class="card-header">
    <span class="card-text">{task.text}</span>
    {#if task.priority !== 'none'}
      <span class="priority-badge" style="background-color: {priorityColors[task.priority]}">
        {task.priority}
      </span>
    {/if}
  </div>
  <div class="card-meta">
    {#if task.due_date}
      <span class="due-date">Due: {task.due_date}</span>
    {/if}
    {#if task.project}
      <span class="project">{task.project}</span>
    {/if}
  </div>
  <span class="source-path">{task.source_path}</span>
</div>

<style>
  .kanban-card {
    padding: var(--spacing-s);
    background: var(--background-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    cursor: grab;
    transition:
      box-shadow var(--transition-fast),
      transform var(--transition-fast);
  }

  .kanban-card:hover {
    box-shadow: var(--shadow-m);
    transform: translateY(-1px);
  }

  .kanban-card:active {
    cursor: grabbing;
  }

  .card-header {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-xs);
  }

  .card-text {
    flex: 1;
    font-size: var(--font-ui-small);
    color: var(--text-normal);
    line-height: 1.4;
  }

  .priority-badge {
    font-size: var(--font-ui-xs);
    color: var(--text-on-accent);
    padding: 1px var(--spacing-xs);
    border-radius: var(--radius-xs);
    text-transform: uppercase;
    font-weight: 600;
    white-space: nowrap;
  }

  .card-meta {
    display: flex;
    gap: var(--spacing-s);
    margin-top: var(--spacing-xs);
  }

  .due-date,
  .project {
    font-size: var(--font-ui-badge);
    color: var(--text-muted);
  }

  .source-path {
    display: block;
    font-size: var(--font-ui-xs);
    color: var(--text-faint);
    margin-top: var(--spacing-xs);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
