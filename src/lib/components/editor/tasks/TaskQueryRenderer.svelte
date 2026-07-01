<script lang="ts">
  import TaskQueryGroup from './TaskQueryGroup.svelte';
  import TaskQueryItem from './TaskQueryItem.svelte';
  import type { TaskQueryResult } from '@/types/data/task';

  export let result: TaskQueryResult;
  export let onToggle: ((sourcePath: string, line: number, newStatus: string) => void) | undefined = undefined;
  export let onNavigate: ((sourcePath: string, line: number) => void) | undefined = undefined;

  $: hasGroups = result.groups.length > 1 || (result.groups.length === 1 && result.groups[0].name !== '');
  $: flatTasks = result.groups.length === 1 && result.groups[0].name === '' ? result.groups[0].tasks : [];
</script>

<div class="task-query-result">
  {#if result.explain}
    <div class="query-explain">
      <pre>{result.explain}</pre>
    </div>
  {/if}

  {#if hasGroups}
    {#each result.groups as group (group.name)}
      <TaskQueryGroup {group} display={result.display} {onToggle} {onNavigate} />
    {/each}
  {:else}
    {#each flatTasks as task (task.source_path + ':' + task.line)}
      <TaskQueryItem {task} display={result.display} {onToggle} {onNavigate} />
    {/each}
  {/if}

  {#if result.total_count === 0}
    <div class="query-empty">No matching tasks found.</div>
  {/if}

  <div class="query-footer">
    <span class="task-count">{result.total_count} task{result.total_count !== 1 ? 's' : ''}</span>
  </div>
</div>

<style>
  .task-query-result {
    font-size: var(--font-size-sm, 13px);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-m);
    padding: var(--spacing-s);
    margin: var(--spacing-s) 0;
    background: var(--background-secondary);
  }

  .query-explain {
    padding: var(--spacing-xs) var(--spacing-s);
    margin-bottom: var(--spacing-s);
    background: var(--background-secondary-alt);
    border-radius: var(--radius-s);
    font-family: var(--font-mono);
    font-size: var(--font-ui-badge);
    color: var(--text-muted);
  }

  .query-explain pre {
    margin: 0;
    white-space: pre-wrap;
  }

  .query-empty {
    padding: var(--spacing-m);
    text-align: center;
    color: var(--text-muted);
    font-style: italic;
  }

  .query-footer {
    padding-top: var(--spacing-xs);
    border-top: 1px solid var(--border-color);
    margin-top: var(--spacing-xs);
    font-size: var(--font-ui-badge);
    color: var(--text-muted);
  }
</style>
