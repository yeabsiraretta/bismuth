<script lang="ts">
  import './+page.css';
  import { pageTitle, SITE_URL } from '@/constants/seo';
  import {
    ACHIEVEMENTS,
    getGamification,
    getLockedAchievements,
    getTierForLevel,
    getTodayChallenge,
    getTodayXp,
    getUnlockedAchievements,
    TIER_RANGES,
    xpToNextLevel,
  } from '@/hubs/core/stores/gamification-store.svelte';
  import type { XpEvent } from '@/hubs/core/stores/gamification-store.svelte';
  import { MetaTags } from 'svelte-meta-tags';

  let gamification = $derived(getGamification());
  let todayXpAmount = $derived(getTodayXp());
  let levelProgress = $derived(xpToNextLevel(gamification.xp, gamification.level));
  let tier = $derived(getTierForLevel(gamification.level));
  let dailyChallenge = $derived(getTodayChallenge());
  let unlocked = $derived(getUnlockedAchievements());
  let locked = $derived(getLockedAchievements());

  type Tab = 'overview' | 'achievements' | 'history';
  let activeTab: Tab = $state('overview');

  let recentHistory = $derived([...gamification.history].reverse().slice(0, 50));

  function eventIcon(type: string): string {
    switch (type) {
      case 'edit':
        return '✏️';
      case 'flashcard':
        return '🃏';
      case 'daily-login':
        return '☀️';
      case 'streak-bonus':
        return '🔥';
      case 'note-create':
        return '📝';
      case 'task-complete':
        return '✅';
      case 'writing-progress':
        return '✍️';
      case 'achievement':
        return '🏆';
      default:
        return '⭐';
    }
  }

  function eventLabel(evt: XpEvent): string {
    if (evt.label) return evt.label;
    switch (evt.type) {
      case 'edit':
        return 'Edit saved';
      case 'flashcard':
        return 'Cards reviewed';
      case 'daily-login':
        return 'Daily login';
      case 'streak-bonus':
        return 'Streak bonus';
      case 'note-create':
        return 'Note created';
      case 'task-complete':
        return 'Task completed';
      case 'writing-progress':
        return 'Writing progress';
      case 'achievement':
        return 'Achievement';
      default:
        return evt.type;
    }
  }

  function challengeProgress(): number {
    if (!dailyChallenge.challenge.target) return 0;
    return Math.min(100, (dailyChallenge.progress.current / dailyChallenge.challenge.target) * 100);
  }
</script>

<MetaTags title={pageTitle('Gamification')} canonical="{SITE_URL}/gamification" />

<div class="gd">
  <div class="gd-content">
    <header class="gd-header">
      <h1 class="gd-title">Gamification Dashboard</h1>
      <nav class="gd-tabs">
        <button
          class="gd-tab"
          class:active={activeTab === 'overview'}
          onclick={() => (activeTab = 'overview')}>Overview</button
        >
        <button
          class="gd-tab"
          class:active={activeTab === 'achievements'}
          onclick={() => (activeTab = 'achievements')}>Achievements</button
        >
        <button
          class="gd-tab"
          class:active={activeTab === 'history'}
          onclick={() => (activeTab = 'history')}>XP History</button
        >
      </nav>
    </header>

    {#if activeTab === 'overview'}
      <div class="gd-overview">
        <!-- Level & Tier Card -->
        <div class="gd-card gd-hero-card">
          <div class="gd-hero-badge">
            <span class="gd-hero-level">Lv.{gamification.level}</span>
            <span class="gd-hero-tier">{tier.name}</span>
          </div>
          <div class="gd-hero-info">
            <div class="gd-hero-xp">{gamification.xp.toLocaleString()} XP</div>
            <div class="gd-xp-bar-wrap">
              <div class="gd-xp-bar">
                <div class="gd-xp-fill" style="width: {levelProgress.progress}%"></div>
              </div>
              <span class="gd-xp-label"
                >{levelProgress.needed -
                  Math.round((levelProgress.progress * levelProgress.needed) / 100)} XP to Lv.{gamification.level +
                  1}</span
              >
            </div>
          </div>
          <div class="gd-hero-stats">
            <div class="gd-mini-stat">
              <span class="gd-mini-value">+{todayXpAmount}</span>
              <span class="gd-mini-label">Today</span>
            </div>
            <div class="gd-mini-stat gd-mini-streak">
              <span class="gd-mini-value">{gamification.currentStreak}</span>
              <span class="gd-mini-label">Streak</span>
            </div>
            <div class="gd-mini-stat">
              <span class="gd-mini-value">{gamification.longestStreak}</span>
              <span class="gd-mini-label">Best</span>
            </div>
          </div>
        </div>

        <!-- Daily Challenge Card -->
        <div class="gd-card">
          <h2 class="gd-card-title">Daily Challenge</h2>
          <div class="gd-challenge">
            <div class="gd-challenge-desc">{dailyChallenge.challenge.description}</div>
            <div class="gd-challenge-bar-wrap">
              <div class="gd-challenge-bar">
                <div
                  class="gd-challenge-fill"
                  class:completed={dailyChallenge.progress.completed}
                  style="width: {challengeProgress()}%"
                ></div>
              </div>
              <div class="gd-challenge-meta">
                <span class="gd-challenge-count"
                  >{dailyChallenge.progress.current} / {dailyChallenge.challenge.target}</span
                >
                {#if dailyChallenge.progress.completed}
                  <span class="gd-challenge-done">Completed!</span>
                {:else}
                  <span class="gd-challenge-reward">+{dailyChallenge.challenge.xpReward} XP</span>
                {/if}
              </div>
            </div>
          </div>
        </div>

        <!-- Stats Grid -->
        <div class="gd-card">
          <h2 class="gd-card-title">Lifetime Stats</h2>
          <div class="gd-stats-grid">
            <div class="gd-stat">
              <span class="gd-stat-value">{gamification.totalEdits.toLocaleString()}</span>
              <span class="gd-stat-label">Edits</span>
            </div>
            <div class="gd-stat">
              <span class="gd-stat-value">{gamification.totalNotesCreated.toLocaleString()}</span>
              <span class="gd-stat-label">Notes Created</span>
            </div>
            <div class="gd-stat">
              <span class="gd-stat-value">{gamification.totalTasksCompleted.toLocaleString()}</span>
              <span class="gd-stat-label">Tasks Done</span>
            </div>
            <div class="gd-stat">
              <span class="gd-stat-value">{gamification.totalCardsReviewed.toLocaleString()}</span>
              <span class="gd-stat-label">Cards Reviewed</span>
            </div>
            <div class="gd-stat">
              <span class="gd-stat-value">{gamification.totalWordsWritten.toLocaleString()}</span>
              <span class="gd-stat-label">Words Written</span>
            </div>
            <div class="gd-stat">
              <span class="gd-stat-value">{unlocked.length}/{ACHIEVEMENTS.length}</span>
              <span class="gd-stat-label">Achievements</span>
            </div>
          </div>
        </div>

        <!-- Tier Progress -->
        <div class="gd-card">
          <h2 class="gd-card-title">Tier Progression</h2>
          <div class="gd-tiers">
            {#each TIER_RANGES as t (t.name)}
              <div
                class="gd-tier-row"
                class:current={t.name === tier.name}
                class:achieved={gamification.level >= t.max}
              >
                <span class="gd-tier-name">{t.name}</span>
                <span class="gd-tier-range">Lv.{t.min}–{t.max}</span>
                {#if gamification.level >= t.max}
                  <span class="gd-tier-check">✓</span>
                {:else if t.name === tier.name}
                  <span class="gd-tier-current">Current</span>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      </div>
    {:else if activeTab === 'achievements'}
      <div class="gd-achievements">
        {#if unlocked.length > 0}
          <h2 class="gd-section-title">Unlocked ({unlocked.length})</h2>
          <div class="gd-achievement-grid">
            {#each unlocked as ach (ach.id)}
              <div class="gd-ach-card gd-ach-unlocked">
                <span class="gd-ach-icon">{ach.icon}</span>
                <div class="gd-ach-info">
                  <span class="gd-ach-name">{ach.name}</span>
                  <span class="gd-ach-desc">{ach.description}</span>
                </div>
                <span class="gd-ach-xp">+{ach.xpReward} XP</span>
              </div>
            {/each}
          </div>
        {/if}

        {#if locked.length > 0}
          <h2 class="gd-section-title">Locked ({locked.length})</h2>
          <div class="gd-achievement-grid">
            {#each locked as ach (ach.id)}
              <div class="gd-ach-card gd-ach-locked">
                <span class="gd-ach-icon gd-ach-icon-locked">{ach.icon}</span>
                <div class="gd-ach-info">
                  <span class="gd-ach-name">{ach.name}</span>
                  <span class="gd-ach-desc">{ach.description}</span>
                </div>
                <span class="gd-ach-xp">+{ach.xpReward} XP</span>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {:else if activeTab === 'history'}
      <div class="gd-history">
        {#if recentHistory.length === 0}
          <p class="gd-empty">No XP events yet. Start using the app to earn XP!</p>
        {:else}
          <div class="gd-history-list">
            {#each recentHistory as evt, i (i)}
              <div class="gd-history-item">
                <span class="gd-history-icon">{eventIcon(evt.type)}</span>
                <div class="gd-history-info">
                  <span class="gd-history-label">{eventLabel(evt)}</span>
                  {#if evt.filePath}
                    <span class="gd-history-path">{evt.filePath}</span>
                  {/if}
                </div>
                <span class="gd-history-xp">+{evt.amount}</span>
                <span class="gd-history-date">{evt.date}</span>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>
