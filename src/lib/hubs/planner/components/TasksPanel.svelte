<script lang="ts">
  import {
    addTask,
    formatTaskId,
    getDueTodayTasks,
    getFilteredTasks,
    getOverdueTasks,
    getPMTasks,
    getUpcomingTasks,
    initPMStore,
    removeTask,
    toggleDone,
    updateTask,
  } from '@/hubs/planner/stores/pm-task-store.svelte';
  import type { PMPriority, PMStatus, PMTask } from '@/hubs/planner/types/pm-types';
  import ContextMenu from '@/ui/context-menu.svelte';
  import Panel from '@/ui/panel.svelte';
  import BIcon from '@/ui/b-icon.svelte';
  import { goto } from '$app/navigation';
  import TaskAddForm from '@/hubs/planner/components/TaskAddForm.svelte';
  import TaskEditForm from '@/hubs/planner/components/TaskEditForm.svelte';
  import TaskItem from '@/hubs/planner/components/TaskItem.svelte';

  type FilterTab = 'all' | 'today' | 'upcoming' | 'overdue' | 'done';

  initPMStore();

  let filter = $state<FilterTab>('all');
  let searchText = $state('');
  let showAdd = $state(false);
  let newTitle = $state('');
  let newDue = $state('');
  let newPriority = $state<PMPriority>('medium');

  let allTasks = $derived(getPMTasks());
  let overdueTasks = $derived(getOverdueTasks());
  let todayTasks = $derived(getDueTodayTasks());
  let upcomingTasks = $derived(getUpcomingTasks(7));
  let doneTasks = $derived(allTasks.filter((t) => t.status === 'done'));

  let filteredTasks = $derived.by(() => {
    let base: PMTask[];
    if (filter === 'today') base = todayTasks;
    else if (filter === 'upcoming') base = upcomingTasks;
    else if (filter === 'overdue') base = overdueTasks;
    else if (filter === 'done') base = doneTasks;
    else base = getFilteredTasks({ hideDone: true });

    if (searchText.trim()) {
      const s = searchText.toLowerCase();
      base = base.filter(
        (t) => t.title.toLowerCase().includes(s) || t.description.toLowerCase().includes(s)
      );
    }
    return base;
  });

  let activeCount = $derived(
    allTasks.filter((t) => t.status !== 'done' && t.status !== 'cancelled').length
  );

  function handleAddTask() {
    if (!newTitle.trim()) return;
    addTask({ title: newTitle.trim(), dueDate: newDue || null, priority: newPriority });
    newTitle = '';
    newDue = '';
    newPriority = 'medium';
    showAdd = false;
  }

  function cyclePriority(task: PMTask) {
    const order: PMPriority[] = ['low', 'medium', 'high', 'critical'];
    const idx = order.indexOf(task.priority);
    const next = order[(idx + 1) % order.length];
    updateTask(task.id, { priority: next });
  }

  function cycleStatus(task: PMTask) {
    const order: PMStatus[] = ['todo', 'in-progress', 'in-review', 'done'];
    const idx = order.indexOf(task.status);
    const next = order[(idx + 1) % order.length];
    updateTask(task.id, {
      status: next,
      doneDate: next === 'done' ? new Date().toISOString() : null,
    });
  }

  let ctxTask: PMTask | null = $state(null);
  let ctxX = $state(0);
  let ctxY = $state(0);

  function handleContext(e: MouseEvent, task: PMTask) {
    e.preventDefault();
    ctxTask = task;
    ctxX = e.clientX;
    ctxY = e.clientY;
  }
  function closeCtx() {
    ctxTask = null;
  }

  let editTask: PMTask | null = $state(null);
  let editTitle = $state('');
  let editDesc = $state('');
  let editDue = $state('');
  let editPriority = $state<PMPriority>('medium');

  function startEdit(task: PMTask) {
    editTask = task;
    editTitle = task.title;
    editDesc = task.description;
    editDue = task.dueDate ?? '';
    editPriority = task.priority;
  }

  function saveEdit() {
    if (!editTask || !editTitle.trim()) return;
    updateTask(editTask.id, {
      title: editTitle.trim(),
      description: editDesc,
      dueDate: editDue || null,
      priority: editPriority,
    });
    editTask = null;
  }

  function cancelEdit() {
    editTask = null;
  }
</script>

<Panel title="Tasks">
  {#snippet badge()}<span class="panel-badge">{activeCount} active</span>{/snippet}
  {#snippet actions()}
    <button class="panel-action" onclick={() => goto('/projects')} title="Open Projects">
      <BIcon name="externalLink" size={14} />
    </button>
  {/snippet}

  <!-- Search and Add -->
  <div class="tasks-toolbar">
    <input class="tasks-search" type="text" placeholder="Search tasks..." bind:value={searchText} />
    <button
      class="tasks-add-btn"
      onclick={() => {
        showAdd = !showAdd;
      }}
      title="Add task">+</button
    >
  </div>

  <!-- Inline add -->
  {#if showAdd}
    <TaskAddForm
      bind:title={newTitle}
      bind:dueDate={newDue}
      bind:priority={newPriority}
      onadd={handleAddTask}
    />
  {/if}

  <!-- Filter tabs -->
  <div class="tasks-filters">
    <button class="filter-btn" class:active={filter === 'all'} onclick={() => (filter = 'all')}
      >All ({activeCount})</button
    >
    <button class="filter-btn" class:active={filter === 'today'} onclick={() => (filter = 'today')}
      >Today ({todayTasks.length})</button
    >
    <button
      class="filter-btn"
      class:active={filter === 'upcoming'}
      onclick={() => (filter = 'upcoming')}>Soon ({upcomingTasks.length})</button
    >
    <button
      class="filter-btn"
      class:overdue={overdueTasks.length > 0}
      class:active={filter === 'overdue'}
      onclick={() => (filter = 'overdue')}>Overdue ({overdueTasks.length})</button
    >
    <button class="filter-btn" class:active={filter === 'done'} onclick={() => (filter = 'done')}
      >Done ({doneTasks.length})</button
    >
  </div>

  <!-- Task list -->
  <div class="tasks-body">
    {#if filteredTasks.length === 0}
      <div class="panel-empty">
        {filter === 'all' ? 'No active tasks' : `No ${filter} tasks`}
      </div>
    {:else}
      <ul class="task-list">
        {#each filteredTasks as task (task.id)}
          {#if editTask?.id === task.id}
            <TaskEditForm
              bind:title={editTitle}
              bind:description={editDesc}
              bind:dueDate={editDue}
              bind:priority={editPriority}
              onsave={saveEdit}
              oncancel={cancelEdit}
            />
          {:else}
            <TaskItem
              {task}
              oncontextmenu={(e) => handleContext(e, task)}
              ondblclick={() => startEdit(task)}
              oncyclestatus={() => cycleStatus(task)}
              oncyclepriority={() => cyclePriority(task)}
            />
          {/if}
        {/each}
      </ul>
    {/if}
  </div>
</Panel>

<ContextMenu x={ctxX} y={ctxY} show={!!ctxTask} onclose={closeCtx}>
  <button
    class="ctx-item"
    onclick={() => {
      if (ctxTask) toggleDone(ctxTask.id);
      closeCtx();
    }}
    role="menuitem"
  >
    {ctxTask?.status === 'done' ? 'Mark Incomplete' : 'Mark Complete'}
  </button>
  <button
    class="ctx-item"
    onclick={() => {
      if (ctxTask) startEdit(ctxTask);
      closeCtx();
    }}
    role="menuitem">Edit</button
  >
  <button
    class="ctx-item"
    onclick={() => {
      if (ctxTask) cyclePriority(ctxTask);
      closeCtx();
    }}
    role="menuitem">Cycle Priority</button
  >
  <button
    class="ctx-item"
    onclick={() => {
      if (ctxTask) cycleStatus(ctxTask);
      closeCtx();
    }}
    role="menuitem">Cycle Status</button
  >
  <button
    class="ctx-item"
    onclick={() => {
      if (ctxTask) navigator.clipboard.writeText(formatTaskId(ctxTask.taskNumber));
      closeCtx();
    }}
    role="menuitem">Copy ID</button
  >
  <button
    class="ctx-item"
    onclick={() => {
      if (ctxTask) navigator.clipboard.writeText(ctxTask.title);
      closeCtx();
    }}
    role="menuitem">Copy Title</button
  >
  <button
    class="ctx-item ctx-danger"
    onclick={() => {
      if (ctxTask) removeTask(ctxTask.id);
      closeCtx();
    }}
    role="menuitem">Delete</button
  >
</ContextMenu>

<style>
  .tasks-toolbar {
    display: flex;
    gap: 4px;
    padding: 6px 8px;
    border-bottom: 1px solid var(--color-border);
  }
  .tasks-search {
    flex: 1;
    padding: 3px 6px;
    font-size: 0.7rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-background);
    color: var(--color-text);
    font-family: inherit;
  }
  .tasks-add-btn {
    width: 24px;
    height: 24px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--color-text-muted);
    font-size: 0.85rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .tasks-add-btn:hover {
    background: var(--color-accent);
    color: var(--color-background);
    border-color: var(--color-accent);
  }

  .tasks-filters {
    display: flex;
    gap: 2px;
    padding: 6px 8px;
    border-bottom: 1px solid var(--color-border);
    flex-wrap: wrap;
  }
  .filter-btn {
    flex: 1;
    padding: 3px 4px;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    font-size: 0.6rem;
    font-family: inherit;
    cursor: pointer;
    border-radius: var(--radius-s);
    white-space: nowrap;
  }
  .filter-btn:hover {
    background: var(--color-surface-hover);
  }
  .filter-btn.active {
    background: var(--color-surface);
    color: var(--color-text);
    font-weight: 500;
  }
  .filter-btn.overdue {
    color: var(--color-error);
  }

  .task-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .ctx-danger {
    color: var(--color-error);
  }
</style>
