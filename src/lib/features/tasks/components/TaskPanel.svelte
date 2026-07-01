<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import PanelHeader from '@/components/ui/layout/PanelHeader.svelte';
  import SearchInput from '@/components/ui/forms/SearchInput.svelte';
  import FilterChip from '@/components/ui/actions/FilterChip.svelte';
  import { filteredTasks, taskFilter, taskStats, tasksLoading, refreshTasks, toggleTask } from '../stores/tasks';
  import type { Task } from '@/types/data/task';
  import { openNote } from '@/appNavigation';
  import { onMount } from 'svelte';

  let searchQuery = '';

  onMount(() => {
    refreshTasks();
  });

  function handleSearch() {
    $taskFilter = { ...$taskFilter, search: searchQuery || undefined };
  }

  function handleToggle(task: Task) {
    toggleTask(task);
  }

  function clearFilters() {
    searchQuery = '';
    $taskFilter = {};
  }

  function formatDueDate(date: string | null): string {
    if (!date) return '';
    const due = new Date(date);
    const now = new Date();
    const diff = Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return `${Math.abs(diff)}d overdue`;
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    return `${diff}d`;
  }

  function isOverdue(task: Task): boolean {
    if (!task.due_date || task.status !== 'open') return false;
    return new Date(task.due_date) < new Date();
  }

  function getPriorityIcon(priority: string): string {
    switch (priority) {
      case 'critical': return 'alert-circle';
      case 'high': return 'arrow-up';
      case 'medium': return 'minus';
      case 'low': return 'arrow-down';
      default: return '';
    }
  }

  function getStatusIcon(status: string): string {
    switch (status) {
      case 'done': return 'check-square';
      case 'inprogress': return 'play';
      case 'onhold': return 'pause';
      case 'cancelled': return 'x-square';
      default: return 'square';
    }
  }

  function getStatusLabel(status: string): string {
    switch (status) {
      case 'done': return 'Done';
      case 'inprogress': return 'In Progress';
      case 'onhold': return 'On Hold';
      case 'cancelled': return 'Cancelled';
      default: return 'Open';
    }
  }
</script>

<div class="task-panel" role="tabpanel" aria-label="Tasks">
  <PanelHeader icon="check-square" title="Tasks" count={$taskStats.open || undefined}>
    <svelte:fragment slot="actions">
      <button class="icon-btn" on:click={refreshTasks} title="Refresh">
        <Icon name="refresh-cw" size={14} />
      </button>
    </svelte:fragment>
  </PanelHeader>

  <div class="search-area">
    <SearchInput
      bind:value={searchQuery}
      placeholder="Filter tasks..."
      onInput={handleSearch}
      onClear={clearFilters}
    />
  </div>

  <div class="filter-bar">
    <FilterChip label="All ({$taskStats.total})" active={!$taskFilter.status} on:click={() => $taskFilter = { ...$taskFilter, status: undefined }} />
    <FilterChip label="Open ({$taskStats.open})" active={$taskFilter.status === 'open'} on:click={() => $taskFilter = { ...$taskFilter, status: 'open' }} />
    <FilterChip label="Active ({$taskStats.inprogress})" active={$taskFilter.status === 'inprogress'} on:click={() => $taskFilter = { ...$taskFilter, status: 'inprogress' }} />
    <FilterChip label="Done ({$taskStats.done})" active={$taskFilter.status === 'done'} on:click={() => $taskFilter = { ...$taskFilter, status: 'done' }} />
  </div>
  <div class="filter-bar">
    <FilterChip label="On Hold ({$taskStats.onhold})" active={$taskFilter.status === 'onhold'} on:click={() => $taskFilter = { ...$taskFilter, status: 'onhold' }} />
    <FilterChip label="Cancelled ({$taskStats.cancelled})" active={$taskFilter.status === 'cancelled'} on:click={() => $taskFilter = { ...$taskFilter, status: 'cancelled' }} />
  </div>

  <div class="task-list">
    {#if $tasksLoading}
      <div class="loading">Loading tasks...</div>
    {:else if $filteredTasks.length === 0}
      <div class="empty-state">
        <Icon name="check-square" size={24} />
        <p>No tasks found</p>
      </div>
    {:else}
      {#each $filteredTasks as task (task.source_path + ':' + task.line)}
        <div class="task-item" class:done={task.status === 'done'} class:cancelled={task.status === 'cancelled'} class:overdue={isOverdue(task)}>
          <button
            class="checkbox status-{task.status}"
            on:click={() => handleToggle(task)}
            title="{getStatusLabel(task.status)} — click to cycle"
          >
            <Icon name={getStatusIcon(task.status)} size={16} />
          </button>
          <div class="task-content" on:click={() => openNote(task.source_path)} on:keydown={(e) => e.key === 'Enter' && openNote(task.source_path)} role="button" tabindex="0">
            <span class="task-text">{task.text}</span>
            <div class="task-meta">
              {#if task.status !== 'open' && task.status !== 'done'}
                <span class="status-badge status-{task.status}">{getStatusLabel(task.status)}</span>
              {/if}
              {#if task.priority !== 'none'}
                <span class="priority priority-{task.priority}" title={task.priority}>
                  <Icon name={getPriorityIcon(task.priority)} size={10} />
                </span>
              {/if}
              {#if task.due_date}
                <span class="due-date" class:overdue={isOverdue(task)}>
                  {formatDueDate(task.due_date)}
                </span>
              {/if}
              {#if task.project}
                <span class="project">{task.project}</span>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
  .task-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: none;
    border: none;
    border-radius: var(--radius-s);
    color: var(--text-muted);
    cursor: pointer;
  }

  .icon-btn:hover {
    background-color: var(--interactive-hover);
    color: var(--text-normal);
  }

  .search-area {
    padding: 0 12px 8px;
  }

  .filter-bar {
    display: flex;
    gap: 4px;
    padding: 0 12px 8px;
  }

  .task-list {
    flex: 1;
    overflow-y: auto;
    padding: 0 8px;
  }

  .task-item {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-xs);
    min-height: 22px;
    padding: 0 var(--spacing-l);
    border-radius: var(--radius-s);
    cursor: default;
  }

  .task-item:hover {
    background-color: var(--background-secondary);
  }

  .task-item.done .task-text {
    text-decoration: line-through;
    color: var(--text-muted);
  }

  .task-item.overdue {
    border-left: 2px solid var(--text-error, #e53e3e);
    padding-left: 6px;
  }

  .checkbox {
    display: flex;
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 0;
    margin-top: 1px;
    flex-shrink: 0;
  }

  .checkbox.status-done { color: var(--interactive-accent, #10b981); }
  .checkbox.status-inprogress { color: var(--text-accent, #3b82f6); }
  .checkbox.status-onhold { color: var(--text-warning, #f59e0b); }
  .checkbox.status-cancelled { color: var(--text-error, #ef4444); }

  .task-item.cancelled .task-text { text-decoration: line-through; color: var(--text-muted); opacity: 0.6; }

  .status-badge { font-size: 9px; font-weight: 600; padding: 0 4px; border-radius: 3px; text-transform: uppercase; letter-spacing: 0.03em; }
  .status-badge.status-inprogress { color: var(--text-accent, #3b82f6); background: color-mix(in srgb, var(--text-accent, #3b82f6) 12%, transparent); }
  .status-badge.status-onhold { color: var(--text-warning, #f59e0b); background: color-mix(in srgb, var(--text-warning, #f59e0b) 12%, transparent); }
  .status-badge.status-cancelled { color: var(--text-error, #ef4444); background: color-mix(in srgb, var(--text-error, #ef4444) 12%, transparent); }

  .task-content {
    flex: 1;
    min-width: 0;
  }

  .task-text {
    font-size: 12px;
    color: var(--text-normal);
    word-break: break-word;
  }

  .task-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 2px;
  }

  .priority {
    font-size: 10px;
  }

  .priority-critical { color: var(--text-error, #e53e3e); }
  .priority-high { color: var(--text-warning, #dd6b20); }
  .priority-medium { color: var(--text-normal); }
  .priority-low { color: var(--text-muted); }

  .due-date {
    font-size: 10px;
    color: var(--text-muted);
  }

  .due-date.overdue {
    color: var(--text-error, #e53e3e);
    font-weight: 500;
  }

  .project {
    font-size: 10px;
    color: var(--text-muted);
    background: var(--background-secondary);
    padding: 0 4px;
    border-radius: 3px;
  }

  .loading, .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;
    color: var(--text-muted);
    font-size: 12px;
    gap: 8px;
  }
</style>
