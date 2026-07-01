<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { getXpSummary } from '../stores/questStore';
  import { gamifyHistory, gamifyCoins } from '../stores/gamifyStore';

  $: xp = getXpSummary();
  $: progressToNext = ((xp.totalXp % 1000) / 10);
</script>

<div class="stats-view">
  <div class="stat-card primary">
    <div class="stat-icon"><Icon name="zap" size={18} /></div>
    <div class="stat-content">
      <span class="stat-value">{xp.totalXp.toLocaleString()}</span>
      <span class="stat-label">Total XP</span>
    </div>
  </div>

  <div class="stat-grid">
    <div class="stat-card">
      <span class="stat-value">{xp.level}</span>
      <span class="stat-label">Level</span>
    </div>
    <div class="stat-card">
      <span class="stat-value">{xp.streak}d</span>
      <span class="stat-label">Streak</span>
    </div>
    <div class="stat-card">
      <span class="stat-value">{$gamifyCoins}</span>
      <span class="stat-label">Coins</span>
    </div>
    <div class="stat-card">
      <span class="stat-value">{xp.todayXp}</span>
      <span class="stat-label">Today</span>
    </div>
  </div>

  <div class="progress-section">
    <div class="progress-header">
      <span>Level {xp.level}</span>
      <span>Level {xp.level + 1}</span>
    </div>
    <div class="progress-bar">
      <div class="progress-fill" style="width: {progressToNext}%"></div>
    </div>
    <span class="progress-text">{xp.totalXp % 1000} / 1000 XP</span>
  </div>

  {#if $gamifyHistory.length > 0}
    <div class="history-section">
      <span class="section-label">Recent Activity</span>
      {#each $gamifyHistory.slice(0, 8) as entry}
        <div class="history-item">
          <Icon name={entry.type === 'earn' ? 'plus-circle' : 'minus-circle'} size={12} />
          <span class="history-desc">{entry.description}</span>
          <span class="history-amount" class:earn={entry.type === 'earn'} class:spend={entry.type === 'spend'}>
            {entry.type === 'earn' ? '+' : '-'}{entry.amount}
          </span>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .stats-view { display: flex; flex-direction: column; gap: 12px; }
  .stat-card {
    padding: 12px; border-radius: 6px; border: 1px solid var(--border-color);
    display: flex; flex-direction: column; align-items: center; gap: 4px;
  }
  .stat-card.primary {
    flex-direction: row; gap: 12px; align-items: center;
    background: var(--accent-bg, rgba(99, 102, 241, 0.1));
    border-color: var(--accent-color, #6366f1);
  }
  .stat-icon { color: var(--accent-color, #6366f1); }
  .stat-content { display: flex; flex-direction: column; }
  .stat-value { font-size: 16px; font-weight: 700; }
  .stat-label { font-size: 10px; color: var(--text-muted); text-transform: uppercase; }
  .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .progress-section { padding: 8px 0; }
  .progress-header { display: flex; justify-content: space-between; font-size: 10px; color: var(--text-muted); margin-bottom: 4px; }
  .progress-bar { height: 6px; background: var(--border-color); border-radius: 3px; overflow: hidden; }
  .progress-fill { height: 100%; background: var(--accent-color, #6366f1); transition: width 0.3s; }
  .progress-text { font-size: 10px; color: var(--text-muted); margin-top: 4px; display: block; }
  .history-section { display: flex; flex-direction: column; gap: 4px; }
  .section-label { font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; padding: 4px 0; }
  .history-item { display: flex; align-items: center; gap: 8px; padding: 4px 0; font-size: 12px; }
  .history-desc { flex: 1; color: var(--text-primary); }
  .history-amount { font-weight: 600; font-variant-numeric: tabular-nums; }
  .history-amount.earn { color: var(--success-color, #22c55e); }
  .history-amount.spend { color: var(--error-color, #ef4444); }
</style>
