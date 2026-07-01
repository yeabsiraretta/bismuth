<script lang="ts">
  import PanelHeader from '@/components/ui/layout/PanelHeader.svelte';
  import Icon from '@/components/icons/Icon.svelte';
  import {
    gamifyCoins,
    gamifyRewards,
    gamifyHistory,
    pendingTasks,
    completedTasks,
    addGamifiedTask,
    completeGamifiedTask,
    incrementCounter,
    deleteGamifiedTask,
    purchaseReward,
    resetReward,
  } from '../stores/gamifyStore';
  import { DIFFICULTY_META, DIFFICULTY_COINS } from '../types';
  import type { TaskDifficulty } from '../types';

  type PanelView = 'tasks' | 'rewards' | 'history';
  let view: PanelView = 'tasks';

  // New task form
  let newTaskText = '';
  let newTaskDifficulty: TaskDifficulty = 'medium';
  let showForm = false;

  const DIFFICULTIES: TaskDifficulty[] = ['trivial', 'easy', 'medium', 'hard', 'epic'];

  function handleAddTask() {
    if (!newTaskText.trim()) return;
    addGamifiedTask(newTaskText.trim(), newTaskDifficulty);
    newTaskText = '';
    showForm = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTask();
    }
    if (e.key === 'Escape') {
      showForm = false;
    }
  }
</script>

<div class="gamify-panel" role="tabpanel" aria-label="Gamified Tasks">
  <PanelHeader icon="zap" title="Tasks">
    <svelte:fragment slot="actions">
      <span class="coin-badge">
        <Icon name="star" size={12} />{$gamifyCoins}
      </span>
    </svelte:fragment>
  </PanelHeader>

  <!-- Tab bar -->
  <div class="view-tabs">
    <button
      class="tab"
      class:active={view === 'tasks'}
      on:click={() => {
        view = 'tasks';
      }}>Tasks</button
    >
    <button
      class="tab"
      class:active={view === 'rewards'}
      on:click={() => {
        view = 'rewards';
      }}>Rewards</button
    >
    <button
      class="tab"
      class:active={view === 'history'}
      on:click={() => {
        view = 'history';
      }}>History</button
    >
  </div>

  <div class="panel-body">
    {#if view === 'tasks'}
      <!-- Add task button / form -->
      {#if showForm}
        <div class="add-form">
          <input
            class="task-input"
            bind:value={newTaskText}
            placeholder="Task description..."
            on:keydown={handleKeydown}
          />
          <div class="difficulty-row">
            {#each DIFFICULTIES as diff}
              <button
                class="diff-btn"
                class:active={newTaskDifficulty === diff}
                style="--diff-color: {DIFFICULTY_META[diff].color}"
                on:click={() => {
                  newTaskDifficulty = diff;
                }}
                title="{DIFFICULTY_META[diff].label} ({DIFFICULTY_COINS[diff]} coins)"
              >
                {DIFFICULTY_META[diff].label[0]}
              </button>
            {/each}
          </div>
          <button class="submit-btn" on:click={handleAddTask} disabled={!newTaskText.trim()}
            >Add</button
          >
        </div>
      {:else}
        <button
          class="add-btn"
          on:click={() => {
            showForm = true;
          }}
        >
          <Icon name="plus" size={14} /> New Task
        </button>
      {/if}

      <!-- Pending tasks -->
      {#each $pendingTasks as task}
        <div class="task-item">
          <button class="check-btn" on:click={() => completeGamifiedTask(task.id)} title="Complete">
            <Icon name="check-square" size={14} />
          </button>
          <div class="task-body">
            <span class="task-text">{task.text}</span>
            <div class="task-meta">
              <span class="diff-badge" style="color: {DIFFICULTY_META[task.difficulty].color}">
                {DIFFICULTY_META[task.difficulty].label}
              </span>
              <span class="coin-hint">+{DIFFICULTY_COINS[task.difficulty]}</span>
              {#if task.counter}
                <button class="counter-btn" on:click={() => incrementCounter(task.id)}>
                  {task.counter.current}/{task.counter.target}
                </button>
              {/if}
            </div>
          </div>
          <button class="del-btn" on:click={() => deleteGamifiedTask(task.id)} title="Delete">
            <Icon name="x" size={12} />
          </button>
        </div>
      {:else}
        <p class="empty-hint">No pending tasks. Add one above!</p>
      {/each}

      <!-- Completed -->
      {#if $completedTasks.length > 0}
        <div class="section-label">Completed ({$completedTasks.length})</div>
        {#each $completedTasks.slice(0, 5) as task}
          <div class="task-item done">
            <Icon name="check-circle" size={14} />
            <span class="task-text">{task.text}</span>
          </div>
        {/each}
      {/if}
    {:else if view === 'rewards'}
      <div class="balance-banner">
        <Icon name="star" size={16} />
        <span>{$gamifyCoins} coins available</span>
      </div>

      {#each $gamifyRewards as reward}
        <div class="reward-item" class:purchased={reward.purchased}>
          <div class="reward-info">
            <span class="reward-name">{reward.name}</span>
            <span class="reward-desc">{reward.description}</span>
          </div>
          <div class="reward-action">
            <span class="reward-cost">{reward.cost}</span>
            {#if reward.purchased}
              <button class="reset-btn" on:click={() => resetReward(reward.id)}>Reset</button>
            {:else}
              <button
                class="buy-btn"
                on:click={() => purchaseReward(reward.id)}
                disabled={$gamifyCoins < reward.cost}>Buy</button
              >
            {/if}
          </div>
        </div>
      {/each}
    {:else if view === 'history'}
      {#each $gamifyHistory.slice().reverse().slice(0, 20) as entry}
        <div
          class="history-item"
          class:earn={entry.type === 'earn'}
          class:spend={entry.type === 'spend'}
        >
          <span class="history-amount">{entry.type === 'earn' ? '+' : '-'}{entry.amount}</span>
          <span class="history-desc">{entry.description}</span>
        </div>
      {:else}
        <p class="empty-hint">No history yet. Complete tasks to earn coins!</p>
      {/each}
    {/if}
  </div>
</div>

<style>
  .gamify-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }
  .panel-body {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-xs);
  }
  .coin-badge {
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: 11px;
    font-weight: 600;
    color: var(--status-warning);
    background: color-mix(in srgb, var(--status-warning) 10%, transparent);
    padding: 2px 6px;
    border-radius: var(--radius-s);
  }
  .view-tabs {
    display: flex;
    border-bottom: 1px solid var(--border-color);
    padding: 0 var(--spacing-xs);
  }
  .tab {
    flex: 1;
    padding: var(--spacing-xs) 0;
    font-size: 11px;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--text-muted);
    cursor: pointer;
    text-align: center;
    transition: all var(--transition-fast);
  }
  .tab:hover {
    color: var(--text-normal);
  }
  .tab.active {
    color: var(--interactive-accent);
    border-bottom-color: var(--interactive-accent);
  }
  .add-btn {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    width: 100%;
    padding: var(--spacing-xs) var(--spacing-s);
    border: 1px dashed var(--border-color);
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-muted);
    font-size: var(--font-ui-small);
    cursor: pointer;
    margin-bottom: var(--spacing-xs);
    transition: all var(--transition-fast);
  }
  .add-btn:hover {
    border-color: var(--interactive-accent);
    color: var(--interactive-accent);
  }
  .add-form {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    margin-bottom: var(--spacing-xs);
  }
  .task-input {
    width: 100%;
    padding: var(--spacing-xs);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    background: var(--background-primary);
    color: var(--text-normal);
    font-size: var(--font-ui-small);
  }
  .difficulty-row {
    display: flex;
    gap: 4px;
  }
  .diff-btn {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 1px solid var(--border-color);
    background: none;
    color: var(--text-muted);
    font-size: 10px;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  .diff-btn:hover {
    border-color: var(--diff-color);
    color: var(--diff-color);
  }
  .diff-btn.active {
    background: var(--diff-color);
    color: var(--text-on-accent);
    border-color: var(--diff-color);
  }
  .submit-btn {
    padding: var(--spacing-xs) var(--spacing-s);
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    border: none;
    border-radius: var(--radius-s);
    font-size: var(--font-ui-small);
    cursor: pointer;
  }
  .submit-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .task-item {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-s);
    border-bottom: 1px solid var(--border-color);
  }
  .task-item.done {
    opacity: 0.5;
  }
  .task-body {
    flex: 1;
    min-width: 0;
  }
  .task-text {
    font-size: var(--font-ui-small);
    color: var(--text-normal);
    word-break: break-word;
  }
  .task-meta {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    margin-top: 2px;
  }
  .diff-badge {
    font-size: 10px;
    font-weight: 600;
  }
  .coin-hint {
    font-size: 10px;
    color: var(--status-warning);
  }
  .counter-btn {
    font-size: 10px;
    padding: 1px 4px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-muted);
    cursor: pointer;
  }
  .counter-btn:hover {
    border-color: var(--interactive-accent);
  }
  .check-btn,
  .del-btn {
    border: none;
    background: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 2px;
    border-radius: var(--radius-s);
  }
  .check-btn:hover {
    color: var(--status-added);
  }
  .del-btn:hover {
    color: var(--text-error);
  }
  .section-label {
    font-size: 10px;
    color: var(--text-faint);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: var(--spacing-xs) var(--spacing-s);
    margin-top: var(--spacing-xs);
  }
  .empty-hint {
    font-size: var(--font-smallest);
    color: var(--text-faint);
    text-align: center;
    padding: var(--spacing-l);
    margin: 0;
  }
  .balance-banner {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    justify-content: center;
    padding: var(--spacing-s);
    background: color-mix(in srgb, var(--status-warning) 8%, transparent);
    border-radius: var(--radius-s);
    margin-bottom: var(--spacing-s);
    color: var(--status-warning);
    font-weight: 600;
    font-size: var(--font-ui-small);
  }
  .reward-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-xs) var(--spacing-s);
    border-bottom: 1px solid var(--border-color);
  }
  .reward-item.purchased {
    opacity: 0.5;
  }
  .reward-info {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .reward-name {
    font-size: var(--font-ui-small);
    font-weight: 500;
    color: var(--text-normal);
  }
  .reward-desc {
    font-size: 10px;
    color: var(--text-faint);
  }
  .reward-action {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }
  .reward-cost {
    font-size: 11px;
    font-weight: 600;
    color: var(--status-warning);
  }
  .buy-btn,
  .reset-btn {
    font-size: 10px;
    padding: 2px 8px;
    border-radius: var(--radius-s);
    border: 1px solid var(--border-color);
    background: none;
    color: var(--text-muted);
    cursor: pointer;
  }
  .buy-btn:hover {
    border-color: var(--interactive-accent);
    color: var(--interactive-accent);
  }
  .buy-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .reset-btn:hover {
    border-color: var(--text-muted);
  }
  .history-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-s);
    font-size: var(--font-ui-small);
  }
  .history-amount {
    font-weight: 600;
    min-width: 32px;
  }
  .history-item.earn .history-amount {
    color: var(--status-added);
  }
  .history-item.spend .history-amount {
    color: var(--text-error);
  }
  .history-desc {
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
