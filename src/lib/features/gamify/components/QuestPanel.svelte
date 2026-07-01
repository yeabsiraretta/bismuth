<script lang="ts">
  import { onMount } from 'svelte';
  import PanelHeader from '@/components/ui/layout/PanelHeader.svelte';
  import {
    questProfile,
    questLevel,
    questTier,
    questProgress,
    unlockedAchievements,
    recentActivity,
    recordDailyPresence,
  } from '../stores/questStore';
  import { ACHIEVEMENTS } from '@/types/data/quest';
  import { taskStats } from '@/features/tasks';

  onMount(() => {
    recordDailyPresence();
  });

  $: progressBar = `${Math.min($questProgress.percent, 100).toFixed(0)}%`;
  $: streakDisplay = $questProfile.streak > 0 ? `${$questProfile.streak}d` : '—';
</script>

<div class="quest-panel" role="tabpanel" aria-label="Quest">
  <PanelHeader icon="zap" title="Quest" />

  <div class="panel-body">
    <!-- Tier + Level Badge -->
    <div class="level-badge">
      <span class="tier-icon">{$questTier.name[0]}</span>
      <div class="level-info">
        <span class="level-label">Lv {$questLevel} · {$questTier.name}</span>
        <span class="xp-label">{$questProfile.totalXp.toLocaleString()} XP</span>
      </div>
    </div>

    <!-- XP Progress Bar -->
    <div class="progress-section">
      <div class="progress-track">
        <div class="progress-fill" style="width: {progressBar}"></div>
      </div>
      <div class="progress-meta">
        <span>{$questProgress.xpInLevel} / {$questProgress.xpNeeded} XP</span>
        <span>Lv {$questLevel + 1}</span>
      </div>
    </div>

    <!-- Today Stats -->
    <div class="stats-row">
      <div class="stat-chip">
        <span class="stat-value">+{$questProfile.todayXp}</span>
        <span class="stat-label">today</span>
      </div>
      <div class="stat-chip">
        <span class="stat-value">{$questProfile.wordCountToday}</span>
        <span class="stat-label">words</span>
      </div>
      <div class="stat-chip">
        <span class="stat-value">{streakDisplay}</span>
        <span class="stat-label">streak</span>
      </div>
      <div class="stat-chip">
        <span class="stat-value">{$taskStats.done}</span>
        <span class="stat-label">done</span>
      </div>
    </div>

    <!-- Achievements -->
    <div class="section">
      <div class="section-header">
        <span class="section-title">Achievements</span>
        <span class="section-count">{$unlockedAchievements.length}/{ACHIEVEMENTS.length}</span>
      </div>
      <div class="achievement-grid">
        {#each ACHIEVEMENTS as achievement}
          <span
            class="achievement-chip"
            class:unlocked={$unlockedAchievements.includes(achievement.id)}
            title="{achievement.name}: {achievement.description}"
          >
            {achievement.name[0]}
          </span>
        {/each}
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="section">
      <div class="section-header">
        <span class="section-title">Recent Activity</span>
      </div>
      <div class="activity-list">
        {#each $recentActivity as entry}
          <div class="activity-item">
            <span class="activity-xp">+{entry.xp}</span>
            <span class="activity-label">{entry.label}</span>
          </div>
        {:else}
          <p class="empty-hint">No activity yet — complete a task to earn XP!</p>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  .quest-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .panel-body {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-s);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-m);
  }

  .level-badge {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
    padding: var(--spacing-s);
    background: var(--background-primary);
    border-radius: var(--radius-m);
    border: 1px solid var(--border-color);
  }

  .tier-icon {
    font-size: 28px;
    line-height: 1;
  }

  .level-info {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .level-label {
    font-size: var(--font-ui-small);
    font-weight: var(--font-semibold);
    color: var(--text-normal);
  }

  .xp-label {
    font-size: var(--font-smallest);
    color: var(--text-muted);
  }

  .progress-section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .progress-track {
    height: 6px;
    background: var(--background-modifier-hover);
    border-radius: 3px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: var(--interactive-accent);
    border-radius: 3px;
    transition: width 0.3s ease;
  }

  .progress-meta {
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    color: var(--text-faint);
  }

  .stats-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--spacing-xs);
  }

  .stat-chip {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--spacing-xs);
    background: var(--background-primary);
    border-radius: var(--radius-s);
    border: 1px solid var(--border-color);
  }

  .stat-value {
    font-size: var(--font-ui-small);
    font-weight: var(--font-semibold);
    color: var(--text-normal);
  }

  .stat-label {
    font-size: 9px;
    color: var(--text-faint);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .section-title {
    font-size: var(--font-smallest);
    font-weight: var(--font-semibold);
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .section-count {
    font-size: 10px;
    color: var(--text-faint);
  }

  .achievement-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .achievement-chip {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    border-radius: var(--radius-s);
    background: var(--background-modifier-hover);
    opacity: 0.3;
    filter: grayscale(1);
    cursor: default;
    transition:
      opacity 0.2s,
      filter 0.2s;
  }

  .achievement-chip.unlocked {
    opacity: 1;
    filter: none;
    background: var(--background-primary);
    border: 1px solid var(--border-color);
  }

  .activity-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    max-height: 200px;
    overflow-y: auto;
  }

  .activity-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: 2px var(--spacing-xs);
    border-radius: var(--radius-s);
    font-size: 11px;
  }

  .activity-xp {
    font-weight: var(--font-medium);
    color: var(--interactive-accent);
    flex-shrink: 0;
    min-width: 32px;
  }

  .activity-label {
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .empty-hint {
    font-size: var(--font-smallest);
    color: var(--text-faint);
    text-align: center;
    padding: var(--spacing-m);
    margin: 0;
  }
</style>
