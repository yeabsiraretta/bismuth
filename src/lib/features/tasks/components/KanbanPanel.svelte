<script lang="ts">
  import PanelHeader from '@/components/ui/layout/PanelHeader.svelte';
  import ActionButton from '@/components/ui/actions/ActionButton.svelte';
  import Icon from '@/components/icons/Icon.svelte';
  import { tasks } from '@/features/tasks';
  import { getColumns, type KanbanGroupBy } from '@/features/canvas';

  let groupBy: KanbanGroupBy = 'status';

  $: columns = getColumns($tasks, groupBy);
  $: totalTasks = $tasks.length;

  function cycleGroupBy() {
    const modes: KanbanGroupBy[] = ['status', 'priority', 'project'];
    const idx = modes.indexOf(groupBy);
    groupBy = modes[(idx + 1) % modes.length];
  }
</script>

<div class="kanban-panel" role="tabpanel" aria-label="Kanban Board">
  <PanelHeader icon="columns" title="Kanban" count={totalTasks || undefined}>
    <svelte:fragment slot="actions">
      <ActionButton icon="layout" title="Group: {groupBy}" on:click={cycleGroupBy} />
    </svelte:fragment>
  </PanelHeader>

  <div class="board-content">
    {#if columns.length === 0}
      <div class="empty-state">
        <Icon name="columns" size={28} />
        <p>No tasks found</p>
        <p class="hint">Create tasks in your notes to see them here</p>
      </div>
    {:else}
      <div class="board-columns">
        {#each columns as column (column.id)}
          <div class="column">
            <div class="column-header">
              <span class="column-title">{column.title}</span>
              <span class="column-count">{column.cards.length}</span>
            </div>
            <div class="column-items">
              {#each column.cards as task}
                <div
                  class="task-card"
                  class:done={task.status === 'done'}
                  class:cancelled={task.status === 'cancelled'}
                >
                  <span class="task-text">{task.text}</span>
                  <div class="card-meta">
                    {#if task.status === 'inprogress' || task.status === 'onhold' || task.status === 'cancelled'}
                      <span class="task-status status-{task.status}"
                        >{task.status === 'inprogress' ? 'active' : task.status}</span
                      >
                    {/if}
                    {#if task.priority && task.priority !== 'none'}
                      <span class="task-priority priority-{task.priority}">{task.priority}</span>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .kanban-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .board-content {
    flex: 1;
    overflow-x: auto;
    overflow-y: auto;
    padding: var(--space-2, 4px);
  }

  .board-columns {
    display: flex;
    gap: var(--space-2, 4px);
    min-height: 100%;
  }

  .column {
    min-width: 140px;
    flex: 1;
    display: flex;
    flex-direction: column;
    background: var(--background-secondary);
    border-radius: var(--radius-s);
    overflow: hidden;
  }

  .column-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-2, 4px) var(--space-3, 8px);
    border-bottom: 1px solid var(--border-color);
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .column-count {
    font-size: 0.65rem;
    background: var(--background-modifier-hover);
    padding: 1px 5px;
    border-radius: 8px;
  }

  .column-items {
    flex: 1;
    padding: var(--space-2, 4px);
    display: flex;
    flex-direction: column;
    gap: var(--space-1, 2px);
    overflow-y: auto;
  }

  .task-card {
    padding: var(--space-2, 4px) var(--space-3, 8px);
    background: var(--background-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    font-size: 0.8rem;
    color: var(--text-normal);
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .task-priority {
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    width: fit-content;
    padding: 1px 4px;
    border-radius: 3px;
  }

  .task-priority.priority-critical {
    color: var(--text-error);
    background: color-mix(in srgb, var(--text-error) 10%, transparent);
  }
  .task-priority.priority-high {
    color: var(--text-error);
    background: color-mix(in srgb, var(--text-error) 10%, transparent);
  }
  .task-priority.priority-medium {
    color: var(--text-warning, #f59e0b);
    background: color-mix(in srgb, var(--text-warning, #f59e0b) 10%, transparent);
  }
  .task-priority.priority-low {
    color: var(--text-muted);
    background: var(--background-modifier-hover);
  }

  .card-meta {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }
  .task-card.done .task-text {
    text-decoration: line-through;
    color: var(--text-muted);
  }
  .task-card.cancelled .task-text {
    text-decoration: line-through;
    color: var(--text-muted);
    opacity: 0.6;
  }

  .task-status {
    font-size: 0.6rem;
    font-weight: 600;
    text-transform: uppercase;
    padding: 1px 4px;
    border-radius: 3px;
    width: fit-content;
  }
  .task-status.status-inprogress {
    color: var(--text-accent, #3b82f6);
    background: color-mix(in srgb, var(--text-accent, #3b82f6) 12%, transparent);
  }
  .task-status.status-onhold {
    color: var(--text-warning, #f59e0b);
    background: color-mix(in srgb, var(--text-warning, #f59e0b) 12%, transparent);
  }
  .task-status.status-cancelled {
    color: var(--text-error, #ef4444);
    background: color-mix(in srgb, var(--text-error, #ef4444) 12%, transparent);
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-2, 4px);
    padding: var(--space-6, 24px);
    color: var(--text-muted);
    text-align: center;
  }

  .empty-state p {
    margin: 0;
    font-size: 0.875rem;
  }

  .hint {
    font-size: 0.75rem;
    opacity: 0.7;
  }
</style>
