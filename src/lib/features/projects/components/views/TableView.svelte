<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { filteredPMTasks, pmTaskFilter, pmTaskSort, selectedTaskIds, createPMTask, updatePMTask, bulkSetStatus, bulkSetPriority, bulkArchive, bulkDelete } from '../../stores/pmTaskStore';
  import { DEFAULT_STATUSES, DEFAULT_PRIORITIES } from '../../types';
  import type { PMTask, PMTaskSort, PMStatus, PMPriority } from '../../types';
  import { formatDateShort } from '../../services/timeTracking';

  let newTaskTitle = '';
  let editingId: string | null = null;
  let editTitle = '';

  async function handleAdd() {
    if (!newTaskTitle.trim()) return;
    await createPMTask(newTaskTitle.trim());
    newTaskTitle = '';
  }

  function toggleSort(field: PMTaskSort['field']) {
    if ($pmTaskSort.field === field) {
      $pmTaskSort = { field, direction: $pmTaskSort.direction === 'asc' ? 'desc' : 'asc' };
    } else {
      $pmTaskSort = { field, direction: 'asc' };
    }
  }

  function sortIcon(field: string): string {
    if ($pmTaskSort.field !== field) return '';
    return $pmTaskSort.direction === 'asc' ? 'chevron-up' : 'chevron-down';
  }

  function toggleSelect(id: string) {
    selectedTaskIds.update(s => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    const all = $filteredPMTasks.map(t => t.id);
    const allSelected = all.every(id => $selectedTaskIds.has(id));
    selectedTaskIds.set(allSelected ? new Set() : new Set(all));
  }

  function startEdit(task: PMTask) { editingId = task.id; editTitle = task.title; }

  async function finishEdit(task: PMTask) {
    if (editTitle.trim() && editTitle !== task.title) {
      await updatePMTask({ ...task, title: editTitle.trim() });
    }
    editingId = null;
  }

  async function cycleStatus(task: PMTask) {
    const order: PMStatus[] = ['todo', 'in-progress', 'in-review', 'done'];
    const idx = order.indexOf(task.status);
    const next = order[(idx + 1) % order.length];
    await updatePMTask({ ...task, status: next });
  }

  function statusColor(status: PMStatus): string {
    return DEFAULT_STATUSES.find(s => s.id === status)?.color ?? '#6b7280';
  }

  function priorityColor(priority: PMPriority): string {
    return DEFAULT_PRIORITIES.find(p => p.id === priority)?.color ?? '#6b7280';
  }

  $: hasSelection = $selectedTaskIds.size > 0;
</script>

<div class="table-view">
  <div class="add-row">
    <input bind:value={newTaskTitle} placeholder="+ Add task..." class="add-input" on:keydown={(e) => e.key === 'Enter' && handleAdd()} />
  </div>

  {#if hasSelection}
    <div class="bulk-bar">
      <span class="bulk-count">{$selectedTaskIds.size} selected</span>
      <button class="bulk-btn" on:click={() => bulkSetStatus([...$selectedTaskIds], 'done')}>Done</button>
      <button class="bulk-btn" on:click={() => bulkSetPriority([...$selectedTaskIds], 'high')}>High</button>
      <button class="bulk-btn" on:click={() => bulkArchive([...$selectedTaskIds], true)}>Archive</button>
      <button class="bulk-btn danger" on:click={() => bulkDelete([...$selectedTaskIds])}>Delete</button>
      <button class="bulk-btn" on:click={() => selectedTaskIds.set(new Set())}>Clear</button>
    </div>
  {/if}

  <div class="table-wrapper">
    <table class="task-table">
      <thead>
        <tr>
          <th class="col-check"><input type="checkbox" checked={$filteredPMTasks.length > 0 && $filteredPMTasks.every(t => $selectedTaskIds.has(t.id))} on:change={toggleSelectAll} /></th>
          <th class="col-status" on:click={() => toggleSort('status')}>Status {#if sortIcon('status')}<Icon name={sortIcon('status')} size={10} />{/if}</th>
          <th class="col-title" on:click={() => toggleSort('title')}>Title {#if sortIcon('title')}<Icon name={sortIcon('title')} size={10} />{/if}</th>
          <th class="col-priority" on:click={() => toggleSort('priority')}>Priority {#if sortIcon('priority')}<Icon name={sortIcon('priority')} size={10} />{/if}</th>
          <th class="col-assignee" on:click={() => toggleSort('assignee')}>Assignee</th>
          <th class="col-due" on:click={() => toggleSort('dueDate')}>Due {#if sortIcon('dueDate')}<Icon name={sortIcon('dueDate')} size={10} />{/if}</th>
          <th class="col-progress" on:click={() => toggleSort('progress')}>Progress</th>
        </tr>
      </thead>
      <tbody>
        {#each $filteredPMTasks as task (task.id)}
          <tr class:selected={$selectedTaskIds.has(task.id)} class:done={task.status === 'done'}>
            <td class="col-check"><input type="checkbox" checked={$selectedTaskIds.has(task.id)} on:change={() => toggleSelect(task.id)} /></td>
            <td class="col-status">
              <button class="status-chip" style="color:{statusColor(task.status)}" on:click={() => cycleStatus(task)} title="Click to cycle status">
                <Icon name={DEFAULT_STATUSES.find(s => s.id === task.status)?.icon ?? 'circle'} size={12} />
                <span>{DEFAULT_STATUSES.find(s => s.id === task.status)?.label ?? task.status}</span>
              </button>
            </td>
            <td class="col-title">
              {#if editingId === task.id}
                <input class="edit-input" bind:value={editTitle} on:blur={() => finishEdit(task)} on:keydown={(e) => e.key === 'Enter' && finishEdit(task)} />
              {:else}
                <button class="title-btn" on:dblclick={() => startEdit(task)}>
                  {#if task.type === 'milestone'}<Icon name="diamond" size={10} />{/if}
                  {task.title}
                </button>
              {/if}
            </td>
            <td class="col-priority">
              <span class="priority-badge" style="color:{priorityColor(task.priority)}">
                {task.priority}
              </span>
            </td>
            <td class="col-assignee">
              {#if task.assignees.length > 0}
                <span class="assignee-list">{task.assignees.join(', ')}</span>
              {/if}
            </td>
            <td class="col-due">{formatDateShort(task.dueDate)}</td>
            <td class="col-progress">
              <div class="progress-bar">
                <div class="progress-fill" style="width:{task.progress}%"></div>
              </div>
              <span class="progress-text">{task.progress}%</span>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<style>
  .table-view { display: flex; flex-direction: column; height: 100%; }
  .add-row { padding: var(--spacing-xs) var(--spacing-s); border-bottom: 1px solid var(--border-color); }
  .add-input { width: 100%; padding: var(--spacing-xs) var(--spacing-s); border: 1px solid var(--border-color); border-radius: var(--radius-s); background: var(--background-primary); color: var(--text-normal); font-size: var(--font-ui-small); }
  .bulk-bar { display: flex; align-items: center; gap: var(--spacing-xs); padding: var(--spacing-xs) var(--spacing-s); background: var(--interactive-accent); color: var(--text-on-accent); font-size: 11px; }
  .bulk-count { font-weight: 600; margin-right: auto; }
  .bulk-btn { padding: 2px 8px; border: 1px solid rgba(255,255,255,0.3); border-radius: var(--radius-s); background: none; color: inherit; font-size: 11px; cursor: pointer; }
  .bulk-btn.danger { border-color: #ef4444; color: #fca5a5; }
  .table-wrapper { flex: 1; overflow: auto; }
  .task-table { width: 100%; border-collapse: collapse; font-size: var(--font-ui-small); }
  th { position: sticky; top: 0; background: var(--background-secondary); padding: var(--spacing-xs) var(--spacing-s); text-align: left; font-weight: 600; font-size: 11px; color: var(--text-muted); cursor: pointer; border-bottom: 1px solid var(--border-color); white-space: nowrap; user-select: none; }
  td { padding: var(--spacing-xs) var(--spacing-s); border-bottom: 1px solid var(--background-modifier-border, rgba(0,0,0,0.05)); vertical-align: middle; }
  tr.selected { background: var(--background-modifier-hover); }
  tr.done { opacity: 0.6; }
  .col-check { width: 28px; text-align: center; }
  .col-status { width: 110px; }
  .col-priority { width: 80px; }
  .col-assignee { width: 100px; }
  .col-due { width: 80px; color: var(--text-muted); }
  .col-progress { width: 100px; }
  .status-chip { display: inline-flex; align-items: center; gap: 4px; background: none; border: none; cursor: pointer; font-size: 11px; padding: 2px 6px; border-radius: var(--radius-s); }
  .status-chip:hover { background: var(--background-modifier-hover); }
  .title-btn { background: none; border: none; color: var(--text-normal); text-align: left; cursor: pointer; padding: 0; font-size: var(--font-ui-small); }
  .edit-input { width: 100%; padding: 2px 4px; border: 1px solid var(--interactive-accent); border-radius: var(--radius-s); font-size: var(--font-ui-small); background: var(--background-primary); color: var(--text-normal); }
  .priority-badge { font-size: 11px; font-weight: 500; text-transform: capitalize; }
  .assignee-list { font-size: 11px; color: var(--text-muted); }
  .progress-bar { width: 60px; height: 4px; background: var(--background-modifier-border); border-radius: 2px; display: inline-block; vertical-align: middle; }
  .progress-fill { height: 100%; background: var(--interactive-accent); border-radius: 2px; transition: width 0.2s; }
  .progress-text { font-size: 10px; color: var(--text-muted); margin-left: 4px; }
</style>
