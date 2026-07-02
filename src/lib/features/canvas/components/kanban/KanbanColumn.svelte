<script lang="ts">
  import KanbanCard from './KanbanCard.svelte';
  import type { KanbanColumn } from './kanbanLogic';

  export let column: KanbanColumn;
</script>

<div class="kanban-column">
  <div class="column-header">
    <h4>{column.title}</h4>
    <span class="count">{column.cards.length}</span>
  </div>
  <div class="column-cards">
    {#each column.cards as task (task.source_path + ':' + task.line)}
      <KanbanCard {task} />
    {/each}
    {#if column.cards.length === 0}
      <div class="empty-column">No tasks</div>
    {/if}
  </div>
</div>

<style>
  .kanban-column {
    flex: 1;
    min-width: 220px;
    max-width: 340px;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-s);
    background: var(--background-secondary);
    border-radius: var(--radius-m);
    padding: var(--spacing-s);
  }

  .column-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--spacing-xs);
  }

  .column-header h4 {
    font-size: var(--font-ui-small);
    font-weight: 600;
    color: var(--text-normal);
    margin: 0;
  }

  .count {
    font-size: 11px;
    color: var(--text-faint);
    background: var(--background-primary);
    border-radius: 10px;
    padding: 1px 6px;
  }

  .column-cards {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    min-height: 60px;
    overflow-y: auto;
    max-height: 500px;
  }

  .empty-column {
    font-size: var(--font-ui-small);
    color: var(--text-faint);
    font-style: italic;
    text-align: center;
    padding: var(--spacing-l) 0;
  }
</style>
