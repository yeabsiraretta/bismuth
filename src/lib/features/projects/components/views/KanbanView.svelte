<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { pmTasks, updatePMTask } from '../../stores/pmTaskStore';
  import { pmSettings } from '../../stores/projectStore';
  import { DEFAULT_STATUSES, DEFAULT_PRIORITIES } from '../../types';
  import type { PMTask, PMStatus } from '../../types';

  $: showSubtasks = $pmSettings.showSubtasksInKanban;
  $: visibleTasks = showSubtasks
    ? $pmTasks.filter((t) => !t.archived)
    : $pmTasks.filter((t) => !t.archived && !t.parentId);

  $: columns = DEFAULT_STATUSES.map((status) => ({
    ...status,
    cards: visibleTasks.filter((t) => t.status === status.id),
  }));

  let dragId: string | null = null;

  function handleDragStart(e: DragEvent, taskId: string) {
    dragId = taskId;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', taskId);
    }
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
  }

  async function handleDrop(e: DragEvent, newStatus: PMStatus) {
    e.preventDefault();
    if (!dragId) return;
    const task = $pmTasks.find((t) => t.id === dragId);
    if (task && task.status !== newStatus) {
      await updatePMTask({ ...task, status: newStatus });
    }
    dragId = null;
  }

  function priorityColor(p: string): string {
    return DEFAULT_PRIORITIES.find((pr) => pr.id === p)?.color ?? '#6b7280';
  }

  function subtaskCount(task: PMTask): number {
    return $pmTasks.filter((t) => t.parentId === task.id).length;
  }
</script>

<div class="kanban-view">
  <div class="kanban-board">
    {#each columns as col (col.id)}
      <div
        class="kanban-column"
        on:dragover={handleDragOver}
        on:drop={(e) => handleDrop(e, col.id)}
        role="listbox"
        aria-label="{col.label} column"
        tabindex="0"
      >
        <div class="column-header" style="border-top-color:{col.color}">
          <span class="column-title">{col.label}</span>
          <span class="column-count">{col.cards.length}</span>
        </div>
        <div class="column-body">
          {#each col.cards as task (task.id)}
            <div
              class="kanban-card"
              class:dragging={dragId === task.id}
              draggable="true"
              on:dragstart={(e) => handleDragStart(e, task.id)}
              role="option"
              aria-selected="false"
              tabindex="0"
            >
              <div class="card-title">
                {#if task.type === 'milestone'}<Icon name="diamond" size={10} />{/if}
                {task.title}
              </div>
              <div class="card-meta">
                <span class="card-priority" style="color:{priorityColor(task.priority)}"
                  >{task.priority}</span
                >
                {#if task.assignees.length > 0}
                  <span class="card-assignee"
                    >{task.assignees[0]}{task.assignees.length > 1
                      ? ` +${task.assignees.length - 1}`
                      : ''}</span
                  >
                {/if}
                {#if task.tags.length > 0}
                  <span class="card-tag">{task.tags[0]}</span>
                {/if}
              </div>
              {#if task.progress > 0}
                <div class="card-progress">
                  <div class="card-progress-fill" style="width:{task.progress}%"></div>
                </div>
              {/if}
              {#if subtaskCount(task) > 0}
                <span class="card-subtasks">{subtaskCount(task)} subtasks</span>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .kanban-view {
    height: 100%;
    overflow: hidden;
  }
  .kanban-board {
    display: flex;
    gap: var(--spacing-s);
    padding: var(--spacing-s);
    height: 100%;
    overflow-x: auto;
  }
  .kanban-column {
    display: flex;
    flex-direction: column;
    min-width: 220px;
    max-width: 280px;
    flex: 1;
    background: var(--background-secondary);
    border-radius: var(--radius-m);
    border-top: 3px solid var(--border-color);
    overflow: hidden;
  }
  .column-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-s) var(--spacing-s);
  }
  .column-title {
    font-size: var(--font-ui-small);
    font-weight: 600;
    color: var(--text-normal);
  }
  .column-count {
    font-size: 11px;
    background: var(--background-primary);
    color: var(--text-muted);
    padding: 0 6px;
    border-radius: var(--radius-full, 9999px);
    line-height: 18px;
  }
  .column-body {
    flex: 1;
    overflow-y: auto;
    padding: 0 var(--spacing-xs) var(--spacing-xs);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }
  .kanban-card {
    padding: var(--spacing-s);
    background: var(--background-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    cursor: grab;
    transition:
      box-shadow 0.15s,
      transform 0.1s;
  }
  .kanban-card:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  .kanban-card.dragging {
    opacity: 0.5;
    transform: rotate(2deg);
  }
  .card-title {
    font-size: var(--font-ui-small);
    font-weight: 500;
    color: var(--text-normal);
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .card-meta {
    display: flex;
    gap: var(--spacing-xs);
    flex-wrap: wrap;
  }
  .card-priority {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
  }
  .card-assignee {
    font-size: 10px;
    color: var(--text-muted);
  }
  .card-tag {
    font-size: 10px;
    background: var(--background-secondary);
    padding: 0 4px;
    border-radius: 3px;
    color: var(--text-muted);
  }
  .card-progress {
    height: 3px;
    background: var(--background-modifier-border);
    border-radius: 2px;
    margin-top: 6px;
  }
  .card-progress-fill {
    height: 100%;
    background: var(--interactive-accent);
    border-radius: 2px;
  }
  .card-subtasks {
    font-size: 10px;
    color: var(--text-faint);
    margin-top: 4px;
  }
</style>
