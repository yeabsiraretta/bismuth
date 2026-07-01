<script lang="ts">
  import { onMount } from 'svelte';
  import Icon from '@/components/icons/Icon.svelte';
  import PanelHeader from '@/components/ui/layout/PanelHeader.svelte';
  import ActionButton from '@/components/ui/actions/ActionButton.svelte';
  import FilterChip from '@/components/ui/actions/FilterChip.svelte';
  import { refreshTasks, toggleTask, tasksLoading } from '../stores/tasks';
  import {
    checklistConfig,
    checklistGroups,
    checklistTasks,
    checklistTags,
    type ChecklistGroupBy,
    type ChecklistSort,
  } from '../stores/checklist';
  import type { Task } from '@/types/data/task';
  import { openNote } from '@/appNavigation';

  let showSettings = false;

  onMount(() => { refreshTasks(); });

  function handleToggle(task: Task) { toggleTask(task); }

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

  function setGroupBy(g: ChecklistGroupBy) {
    $checklistConfig = { ...$checklistConfig, groupBy: g };
  }

  function setSort(s: ChecklistSort) {
    $checklistConfig = { ...$checklistConfig, sort: s };
  }

  function isOverdue(task: Task): boolean {
    if (!task.due_date || task.status !== 'open') return false;
    return new Date(task.due_date) < new Date();
  }

  function formatDue(date: string | null): string {
    if (!date) return '';
    const due = new Date(date);
    const diff = Math.floor((due.getTime() - Date.now()) / 86400000);
    if (diff < 0) return `${Math.abs(diff)}d overdue`;
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    return `${diff}d`;
  }

  $: taskCount = $checklistTasks.length;
  $: groups = $checklistGroups;
</script>

<div class="checklist-panel" role="tabpanel" aria-label="Checklist">
  <PanelHeader icon="list-checks" title="Checklist" count={taskCount || undefined}>
    <svelte:fragment slot="actions">
      <ActionButton icon="settings" title="Settings" on:click={() => showSettings = !showSettings} />
      <ActionButton icon="refresh-cw" title="Refresh" on:click={refreshTasks} />
    </svelte:fragment>
  </PanelHeader>

  {#if showSettings}
    <div class="settings-area">
      <div class="setting-row">
        <label class="setting-label" for="cl-tag">Tag</label>
        <div class="tag-input-wrap">
          <span class="tag-hash">#</span>
          <input
            id="cl-tag"
            class="setting-input"
            type="text"
            bind:value={$checklistConfig.tagName}
            placeholder="todo"
          />
        </div>
      </div>

      <div class="setting-row">
        <label class="setting-label" for="cl-completed">Show completed</label>
        <input id="cl-completed" type="checkbox" bind:checked={$checklistConfig.showCompleted} />
      </div>

      <div class="setting-row">
        <label class="setting-label" for="cl-allfile">All todos in file</label>
        <input id="cl-allfile" type="checkbox" bind:checked={$checklistConfig.showAllInFile} />
      </div>

      <div class="setting-row">
        <label class="setting-label" for="cl-glob">Include files</label>
        <input
          id="cl-glob"
          class="setting-input wide"
          type="text"
          bind:value={$checklistConfig.includeGlob}
          placeholder="e.g. Projects/**"
        />
      </div>

      <div class="setting-row">
        <span class="setting-label">Group by</span>
        <div class="chip-row">
          <FilterChip label="File" active={$checklistConfig.groupBy === 'file'} on:click={() => setGroupBy('file')} />
          <FilterChip label="Tag" active={$checklistConfig.groupBy === 'tag'} on:click={() => setGroupBy('tag')} />
          <FilterChip label="Priority" active={$checklistConfig.groupBy === 'priority'} on:click={() => setGroupBy('priority')} />
          <FilterChip label="None" active={$checklistConfig.groupBy === 'none'} on:click={() => setGroupBy('none')} />
        </div>
      </div>

      <div class="setting-row">
        <span class="setting-label">Sort</span>
        <div class="chip-row">
          <FilterChip label="Oldest" active={$checklistConfig.sort === 'oldest'} on:click={() => setSort('oldest')} />
          <FilterChip label="Newest" active={$checklistConfig.sort === 'newest'} on:click={() => setSort('newest')} />
          <FilterChip label="Priority" active={$checklistConfig.sort === 'priority'} on:click={() => setSort('priority')} />
          <FilterChip label="A-Z" active={$checklistConfig.sort === 'alphabetical'} on:click={() => setSort('alphabetical')} />
        </div>
      </div>

      {#if $checklistTags.length > 0}
        <div class="setting-row">
          <span class="setting-label">Quick tags</span>
          <div class="chip-row wrap">
            {#each $checklistTags.slice(0, 12) as tag}
              <button
                class="tag-chip"
                class:active={$checklistConfig.tagName === tag}
                on:click={() => $checklistConfig = { ...$checklistConfig, tagName: tag }}
              >#{tag}</button>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {/if}

  <div class="checklist-body">
    {#if $tasksLoading}
      <div class="empty-state"><span>Loading tasks...</span></div>
    {:else if groups.length === 0}
      <div class="empty-state">
        <Icon name="list-checks" size={24} />
        <p>No checklist items found</p>
        <p class="hint">Tag tasks with #{$checklistConfig.tagName} to see them here</p>
      </div>
    {:else}
      {#each groups as group (group.key)}
        <div class="group">
          <button class="group-header" on:click={() => openNote(group.tasks[0]?.source_path ?? '')}>
            <span class="group-label">{group.label}</span>
            <span class="group-count">{group.tasks.length}</span>
          </button>
          <div class="group-items">
            {#each group.tasks as task (task.source_path + ':' + task.line)}
              <div class="task-row" class:done={task.status === 'done'} class:cancelled={task.status === 'cancelled'} class:overdue={isOverdue(task)}>
                <button
                  class="checkbox status-{task.status}"
                  on:click={() => handleToggle(task)}
                  title="{getStatusLabel(task.status)} — click to cycle"
                  aria-label="{getStatusLabel(task.status)} — click to cycle"
                >
                  <Icon name={getStatusIcon(task.status)} size={14} />
                </button>
                <button class="task-text-btn" on:click={() => openNote(task.source_path)} title="Open note">
                  <span class="task-text">{task.text}</span>
                </button>
                {#if task.due_date}
                  <span class="due" class:overdue={isOverdue(task)}>{formatDue(task.due_date)}</span>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
  .checklist-panel { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
  .settings-area { padding: 8px 12px; border-bottom: 1px solid var(--background-modifier-border, rgba(0,0,0,0.1)); display: flex; flex-direction: column; gap: 6px; font-size: 0.8rem; }
  .setting-row { display: flex; align-items: center; gap: 8px; min-height: 24px; }
  .setting-label { font-size: 0.75rem; color: var(--text-muted, #6b7280); min-width: 80px; flex-shrink: 0; }
  .tag-input-wrap { display: flex; align-items: center; gap: 2px; flex: 1; }
  .tag-hash { color: var(--text-muted, #6b7280); font-size: 0.8rem; }
  .setting-input { flex: 1; padding: 2px 6px; border: 1px solid var(--background-modifier-border, rgba(0,0,0,0.15)); border-radius: var(--radius-s, 4px); background: var(--background-primary, #fff); color: var(--text-normal); font-size: 0.75rem; min-width: 0; }
  .setting-input.wide { width: 100%; }
  .chip-row { display: flex; gap: 4px; flex-wrap: nowrap; }
  .chip-row.wrap { flex-wrap: wrap; }
  .tag-chip { padding: 1px 6px; font-size: 0.7rem; border: 1px solid var(--background-modifier-border, rgba(0,0,0,0.15)); border-radius: 10px; background: transparent; color: var(--text-muted); cursor: pointer; }
  .tag-chip.active { background: var(--interactive-accent, #3b82f6); color: #fff; border-color: var(--interactive-accent, #3b82f6); }
  .checklist-body { flex: 1; overflow-y: auto; padding: 4px 0; }
  .group { margin-bottom: 4px; }
  .group-header { display: flex; align-items: center; gap: 6px; padding: 4px 12px; width: 100%; background: var(--background-secondary, #f9fafb); border: none; cursor: pointer; text-align: left; }
  .group-header:hover { background: var(--background-modifier-hover, #f3f4f6); }
  .group-label { font-size: 0.75rem; font-weight: 600; color: var(--text-normal); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; min-width: 0; }
  .group-count { font-size: 0.7rem; color: var(--text-muted); background: var(--background-modifier-border, rgba(0,0,0,0.08)); padding: 0 5px; border-radius: 8px; flex-shrink: 0; }
  .group-items { padding: 0 4px; }
  .task-row { display: flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: var(--radius-s, 4px); min-height: 24px; }
  .task-row:hover { background: var(--background-modifier-hover, #f3f4f6); }
  .task-row.done .task-text { text-decoration: line-through; color: var(--text-muted, #9ca3af); }
  .task-row.overdue { border-left: 2px solid var(--text-error, #e53e3e); }
  .checkbox { display: flex; background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 0; flex-shrink: 0; }
  .checkbox.status-done { color: var(--interactive-accent, #10b981); }
  .checkbox.status-inprogress { color: var(--text-accent, #3b82f6); }
  .checkbox.status-onhold { color: var(--text-warning, #f59e0b); }
  .checkbox.status-cancelled { color: var(--text-error, #ef4444); }
  .task-row.cancelled .task-text { text-decoration: line-through; opacity: 0.6; }
  .task-text-btn { flex: 1; min-width: 0; background: none; border: none; text-align: left; cursor: pointer; padding: 0; color: inherit; }
  .task-text { font-size: 0.8rem; color: var(--text-normal); word-break: break-word; }
  .due { font-size: 0.65rem; color: var(--text-muted); flex-shrink: 0; }
  .due.overdue { color: var(--text-error, #e53e3e); font-weight: 500; }
  .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 32px 16px; color: var(--text-muted, #6b7280); font-size: 0.8rem; gap: 6px; text-align: center; }
  .hint { font-size: 0.7rem; color: var(--text-faint, #9ca3af); margin: 0; }
</style>
