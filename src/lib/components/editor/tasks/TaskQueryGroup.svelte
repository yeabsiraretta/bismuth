<script lang="ts">
  import TaskQueryItem from './TaskQueryItem.svelte';
  import type { TaskGroup, DisplayOptions } from '@/types/data/task';

  export let group: TaskGroup;
  export let display: DisplayOptions;
  export let onToggle: ((sourcePath: string, line: number, newStatus: string) => void) | undefined =
    undefined;
  export let onNavigate: ((sourcePath: string, line: number) => void) | undefined = undefined;

  let collapsed = false;

  function toggle() {
    collapsed = !collapsed;
  }
</script>

<div class="task-group">
  <button class="group-header" on:click={toggle}>
    <span class="collapse-icon">{collapsed ? '▸' : '▾'}</span>
    <span class="group-name">{group.name || '(ungrouped)'}</span>
    {#if !display.hidden_fields.includes('TaskCount')}
      <span class="group-count">({group.count})</span>
    {/if}
  </button>

  {#if !collapsed}
    <div class="group-tasks">
      {#each group.tasks as task (task.source_path + ':' + task.line)}
        <TaskQueryItem {task} {display} {onToggle} {onNavigate} />
      {/each}
    </div>
  {/if}
</div>

<style>
  .task-group {
    margin-bottom: var(--spacing-xs);
  }

  .group-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-xs);
    border-radius: var(--radius-s);
    cursor: pointer;
    font-weight: var(--font-semibold);
    font-size: var(--font-size-sm, 13px);
    width: 100%;
    background: none;
    border: none;
    color: inherit;
    text-align: left;
  }

  .group-header:hover {
    background: var(--background-modifier-hover);
  }

  .collapse-icon {
    width: 12px;
    font-size: var(--font-ui-xs);
    color: var(--text-muted);
  }

  .group-name {
    flex: 1;
  }

  .group-count {
    font-weight: normal;
    color: var(--text-muted);
    font-size: var(--font-ui-badge);
  }

  .group-tasks {
    padding-left: var(--spacing-m);
  }
</style>
