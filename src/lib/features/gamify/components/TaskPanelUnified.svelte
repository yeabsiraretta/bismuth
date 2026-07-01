<script lang="ts">
  import PanelHeader from '@/components/ui/layout/PanelHeader.svelte';
  import ActionButton from '@/components/ui/actions/ActionButton.svelte';
  import Icon from '@/components/icons/Icon.svelte';
  import TodayView from './TodayView.svelte';
  import StatsView from './StatsView.svelte';
  import { gamifyTasks, addGamifiedTask } from '../stores/gamifyStore';
  import { questProfile, questLevel } from '../stores/questStore';
  import { featureFlags } from '@/stores/settings/features';
  import type { TaskDifficulty } from '../types';

  type TabView = 'today' | 'all' | 'stats';

  let activeView: TabView = 'today';
  let showAddForm = false;
  let newTaskText = '';
  let newTaskDifficulty: TaskDifficulty = 'medium';
  let celebrating = false;
  let prevLevel: number | null = null;
  let celebrateTimer: ReturnType<typeof setTimeout> | null = null;

  $: gamifyEnabled = $featureFlags['gamify'];
  $: pendingCount = $gamifyTasks.filter(t => !t.completed).length;
  $: streak = $questProfile.streak;

  // Watch for level-up
  $: {
    const currentLevel = $questLevel;
    if (prevLevel !== null && currentLevel > prevLevel) {
      celebrating = true;
      if (celebrateTimer) clearTimeout(celebrateTimer);
      celebrateTimer = setTimeout(() => { celebrating = false; }, 1500);
    }
    prevLevel = currentLevel;
  }

  function handleAddTask() {
    if (!newTaskText.trim()) return;
    addGamifiedTask(newTaskText.trim(), newTaskDifficulty);
    newTaskText = '';
    showAddForm = false;
  }
</script>

<div class="task-panel-unified" class:celebrating role="tabpanel" aria-label="Tasks">
  <PanelHeader icon="check-square" title="Tasks" count={pendingCount || undefined}>
    <svelte:fragment slot="actions">
      {#if gamifyEnabled && streak > 0}
        <span class="streak-badge" title="{streak}-day streak" aria-label="{streak} day streak">
          <Icon name="flame" size={11} />
          {streak}d
        </span>
      {/if}
      <ActionButton icon="plus" title="Add task" on:click={() => { showAddForm = !showAddForm; }} />
    </svelte:fragment>
  </PanelHeader>

  <div class="panel-body">
    <div class="view-tabs">
      <button class="view-tab" class:active={activeView === 'today'} on:click={() => { activeView = 'today'; }}>
        <Icon name="sun" size={12} />
        Today
      </button>
      <button class="view-tab" class:active={activeView === 'all'} on:click={() => { activeView = 'all'; }}>
        <Icon name="list" size={12} />
        All
      </button>
      {#if gamifyEnabled}
        <button class="view-tab" class:active={activeView === 'stats'} on:click={() => { activeView = 'stats'; }}>
          <Icon name="bar-chart-2" size={12} />
          Stats
        </button>
      {/if}
    </div>

    {#if showAddForm}
      <div class="add-form">
        <input
          class="add-input"
          bind:value={newTaskText}
          placeholder="New task..."
          on:keydown={(e) => e.key === 'Enter' && handleAddTask()}
        />
        {#if gamifyEnabled}
          <select class="difficulty-select" bind:value={newTaskDifficulty}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        {/if}
        <button class="add-btn" on:click={handleAddTask} disabled={!newTaskText.trim()}>
          <Icon name="plus" size={12} />
        </button>
      </div>
    {/if}

    <div class="view-content">
      {#if activeView === 'today'}
        <TodayView />
      {:else if activeView === 'all'}
        <div class="all-tasks">
          {#each $gamifyTasks as task}
            <div class="task-row" class:completed={task.completed}>
              <Icon name={task.completed ? 'check-circle' : 'circle'} size={14} />
              <span class="task-text">{task.text}</span>
              {#if gamifyEnabled && !task.completed}
                <span class="badge" style="font-size: 10px">{task.difficulty}</span>
              {/if}
            </div>
          {/each}
          {#if $gamifyTasks.length === 0}
            <div class="empty">No tasks yet. Click + to add one.</div>
          {/if}
        </div>
      {:else if activeView === 'stats'}
        <StatsView />
      {/if}
    </div>
  </div>
</div>

<style>
  .task-panel-unified { display: flex; flex-direction: column; height: 100%; }
  .task-panel-unified.celebrating { animation: celebrate 1.5s ease forwards; }
  @keyframes celebrate {
    0%   { transform: scale(1); }
    25%  { transform: scale(1.2); }
    60%  { transform: scale(0.95); }
    80%  { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
  .streak-badge {
    display: flex; align-items: center; gap: 2px;
    font-size: 11px; font-weight: 600; color: var(--warning-color, #f59e0b);
    padding: 2px 6px; border-radius: 10px;
    background: rgba(245, 158, 11, 0.12);
  }
  .panel-body { padding: 8px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 8px; }
  .view-tabs {
    display: flex; gap: 2px; background: var(--panel-bg-alt, #181825);
    border-radius: 6px; padding: 2px;
  }
  .view-tab {
    flex: 1; display: flex; align-items: center; justify-content: center; gap: 4px;
    padding: 6px 8px; border: none; border-radius: 4px;
    background: none; color: var(--text-muted); cursor: pointer; font-size: 11px;
  }
  .view-tab:hover { color: var(--text-primary); }
  .view-tab.active { background: var(--accent-color, #6366f1); color: white; }
  .add-form {
    display: flex; gap: 4px; padding: 4px 0;
  }
  .add-input {
    flex: 1; padding: 6px 8px; border: 1px solid var(--border-color);
    border-radius: 4px; background: var(--input-bg); color: var(--text-primary); font-size: 12px;
  }
  .difficulty-select {
    padding: 4px 6px; border: 1px solid var(--border-color); border-radius: 4px;
    background: var(--input-bg); color: var(--text-primary); font-size: 11px;
  }
  .add-btn {
    padding: 6px 10px; border: none; border-radius: 4px;
    background: var(--accent-color, #6366f1); color: white; cursor: pointer;
  }
  .add-btn:disabled { opacity: 0.5; }
  .view-content { flex: 1; overflow-y: auto; }
  .all-tasks { display: flex; flex-direction: column; gap: 4px; }
  .task-row {
    display: flex; align-items: center; gap: 8px; padding: 8px 10px;
    border-radius: 4px; border: 1px solid var(--border-color);
  }
  .task-row.completed { opacity: 0.5; }
  .task-row.completed .task-text { text-decoration: line-through; }
  .task-text { flex: 1; font-size: 12px; }
  .badge { padding: 1px 6px; border-radius: 8px; background: var(--panel-bg-alt); font-weight: 500; }
  .empty { font-size: 12px; color: var(--text-muted); text-align: center; padding: 16px; }
</style>
