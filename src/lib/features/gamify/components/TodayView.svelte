<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { gamifyTasks, completeGamifiedTask } from '../stores/gamifyStore';
  import type { GamifiedTask } from '../types';
  import { questProfile, getXpSummary } from '../stores/questStore';
  import { featureFlags } from '@/stores/settings/features';

  $: todayTasks = $gamifyTasks.filter(t => !t.completed);
  $: completedToday = $gamifyTasks.filter(t => t.completed);
  $: xpSummary = getXpSummary();
  $: gamifyEnabled = $featureFlags['gamify'];

  function handleComplete(task: GamifiedTask) {
    completeGamifiedTask(task.id);
  }

  function getDifficultyColor(d: string): string {
    switch (d) {
      case 'easy': return 'var(--success-color, #22c55e)';
      case 'medium': return 'var(--warning-color, #f59e0b)';
      case 'hard': return 'var(--error-color, #ef4444)';
      default: return 'var(--text-muted)';
    }
  }
</script>

<div class="today-view">
  {#if gamifyEnabled}
    <div class="xp-bar">
      <div class="xp-info">
        <span class="level">Lv {xpSummary.level}</span>
        <span class="xp-text">{xpSummary.todayXp} XP today</span>
        {#if $questProfile.streak > 0}
          <span class="streak">{$questProfile.streak}d streak</span>
        {/if}
      </div>
      <div class="xp-progress">
        <div class="xp-fill" style="width: {(xpSummary.totalXp % 1000) / 10}%"></div>
      </div>
    </div>
  {/if}

  <div class="task-section">
    <span class="section-label">Active ({todayTasks.length})</span>
    {#each todayTasks as task}
      <div class="task-item">
        <button class="check-btn" on:click={() => handleComplete(task)} title="Complete">
          <Icon name="circle" size={14} />
        </button>
        <span class="task-text">{task.text}</span>
        {#if gamifyEnabled}
          <span class="difficulty-badge" style="color: {getDifficultyColor(task.difficulty)}">
            {task.difficulty.charAt(0).toUpperCase()}
          </span>
        {/if}
        {#if task.counter}
          <div class="counter-wrap">
            <span class="counter">{task.counter.current}/{task.counter.target}</span>
            <progress
              class="counter-bar"
              value={task.counter.current}
              max={task.counter.target}
              aria-label="Task progress {task.counter.current} of {task.counter.target}"
            ></progress>
          </div>
        {/if}
      </div>
    {/each}
    {#if todayTasks.length === 0}
      <div class="empty-section">All done for today!</div>
    {/if}
  </div>

  {#if completedToday.length > 0}
    <div class="task-section">
      <span class="section-label">Completed ({completedToday.length})</span>
      {#each completedToday.slice(0, 5) as task}
        <div class="task-item completed">
          <Icon name="check-circle" size={14} />
          <span class="task-text">{task.text}</span>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .today-view { display: flex; flex-direction: column; gap: 12px; }
  .xp-bar {
    padding: 10px; background: var(--panel-bg-alt, #181825);
    border-radius: 6px;
  }
  .xp-info { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
  .level { font-size: 12px; font-weight: 700; color: var(--accent-color, #6366f1); }
  .xp-text { font-size: 11px; color: var(--text-muted); flex: 1; }
  .streak { font-size: 11px; color: var(--warning-color, #f59e0b); }
  .xp-progress {
    height: 4px; background: var(--border-color); border-radius: 2px; overflow: hidden;
  }
  .xp-fill { height: 100%; background: var(--accent-color, #6366f1); transition: width 0.3s; }
  .task-section { display: flex; flex-direction: column; gap: 4px; }
  .section-label { font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; padding: 4px 0; }
  .task-item {
    display: flex; align-items: center; gap: 8px; padding: 8px 10px;
    border-radius: 4px; border: 1px solid var(--border-color);
  }
  .task-item:hover { background: var(--hover-bg); }
  .task-item.completed { opacity: 0.6; }
  .task-item.completed .task-text { text-decoration: line-through; }
  .check-btn {
    background: none; border: none; padding: 0; cursor: pointer;
    color: var(--text-muted);
  }
  .check-btn:hover { color: var(--success-color, #22c55e); }
  .task-text { flex: 1; font-size: 12px; }
  .difficulty-badge { font-size: 10px; font-weight: 700; }
  .counter { font-size: 10px; color: var(--text-muted); font-variant-numeric: tabular-nums; }
  .counter-wrap { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
  .counter-bar { width: 48px; height: 4px; border-radius: 2px; appearance: none; border: none; background: var(--border-color); }
  .counter-bar::-webkit-progress-bar { background: var(--border-color); border-radius: 2px; }
  .counter-bar::-webkit-progress-value { background: var(--accent-color, #6366f1); border-radius: 2px; }
  .counter-bar::-moz-progress-bar { background: var(--accent-color, #6366f1); border-radius: 2px; }
  .empty-section { font-size: 12px; color: var(--text-muted); padding: 12px; text-align: center; }
</style>
