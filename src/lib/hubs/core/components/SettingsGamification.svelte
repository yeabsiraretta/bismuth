<script lang="ts">
  import type { GamificationSettings } from '@/hubs/core/types/settings';
  import {
    destroyGamification,
    initGamification,
  } from '@/hubs/core/stores/gamification-store.svelte';
  import SettingRow from '@/ui/settings-controls.svelte';

  let {
    gamification = $bindable(),
  }: {
    gamification: GamificationSettings;
  } = $props();

  async function safeConfirm(message: string): Promise<boolean> {
    try {
      const { confirm } = await import('@tauri-apps/plugin-dialog');
      return await confirm(message, { title: 'Bismuth', kind: 'warning' });
    } catch {
      return window.confirm(message);
    }
  }

  async function resetProgress() {
    const ok = await safeConfirm(
      'This will permanently reset all XP, levels, achievements, and streaks. Are you sure?'
    );
    if (ok) {
      destroyGamification();
      initGamification();
    }
  }
</script>

<div class="space-y-6">
  <section>
    <h3 class="text-s font-semibold text-text mb-3">XP & Levels</h3>

    <SettingRow
      label="Enable gamification"
      hint="Track XP, levels, and streaks as you use the app"
      id="gm-enabled"
    >
      <input id="gm-enabled" type="checkbox" bind:checked={gamification.gamificationEnabled} />
    </SettingRow>

    {#if gamification.gamificationEnabled}
      <SettingRow
        label="Show XP notifications"
        hint="Display a toast when you earn XP"
        id="gm-xp-notify"
      >
        <input id="gm-xp-notify" type="checkbox" bind:checked={gamification.showXpNotifications} />
      </SettingRow>
    {/if}
  </section>

  {#if gamification.gamificationEnabled}
    <section>
      <h3 class="text-s font-semibold text-text mb-3">Features</h3>

      <SettingRow
        label="Enable achievements"
        hint="Unlock achievements as you reach milestones"
        id="gm-achievements"
      >
        <input
          id="gm-achievements"
          type="checkbox"
          bind:checked={gamification.enableAchievements}
        />
      </SettingRow>

      <SettingRow
        label="Enable daily challenges"
        hint="Get a new rotating challenge each day for bonus XP"
        id="gm-challenges"
      >
        <input
          id="gm-challenges"
          type="checkbox"
          bind:checked={gamification.enableDailyChallenges}
        />
      </SettingRow>
    </section>

    <section>
      <h3 class="text-s font-semibold text-text mb-3">XP Rates</h3>

      <SettingRow label="XP per edit" hint="XP earned for each document save" id="gm-xp-edit">
        <input id="gm-xp-edit" type="number" min="0" max="50" bind:value={gamification.xpPerEdit} />
      </SettingRow>

      <SettingRow label="XP per flashcard" hint="XP earned for each card reviewed" id="gm-xp-card">
        <input id="gm-xp-card" type="number" min="0" max="50" bind:value={gamification.xpPerCard} />
      </SettingRow>

      <SettingRow
        label="XP per note created"
        hint="XP earned when creating a new note"
        id="gm-xp-note"
      >
        <input
          id="gm-xp-note"
          type="number"
          min="0"
          max="50"
          bind:value={gamification.xpPerNoteCreate}
        />
      </SettingRow>

      <SettingRow
        label="XP per task completed"
        hint="XP earned when completing a task"
        id="gm-xp-task"
      >
        <input
          id="gm-xp-task"
          type="number"
          min="0"
          max="50"
          bind:value={gamification.xpPerTaskComplete}
        />
      </SettingRow>

      <SettingRow
        label="XP per 100 words"
        hint="XP earned for writing progress (per 100 words)"
        id="gm-xp-words"
      >
        <input
          id="gm-xp-words"
          type="number"
          min="0"
          max="50"
          bind:value={gamification.xpPer100Words}
        />
      </SettingRow>

      <SettingRow
        label="Daily login XP"
        hint="XP earned just for opening the app each day"
        id="gm-xp-login"
      >
        <input
          id="gm-xp-login"
          type="number"
          min="0"
          max="100"
          bind:value={gamification.dailyLoginXp}
        />
      </SettingRow>
    </section>

    <section>
      <h3 class="text-s font-semibold text-text mb-3">Streaks</h3>

      <SettingRow
        label="Show streak reminders"
        hint="Remind you to maintain your daily streak"
        id="gm-streak-remind"
      >
        <input
          id="gm-streak-remind"
          type="checkbox"
          bind:checked={gamification.showStreakReminders}
        />
      </SettingRow>

      <SettingRow
        label="Streak bonus XP"
        hint="Bonus XP for maintaining a streak"
        id="gm-streak-xp"
      >
        <input
          id="gm-streak-xp"
          type="number"
          min="0"
          max="100"
          bind:value={gamification.streakBonusXp}
        />
      </SettingRow>

      <SettingRow
        label="Streak bonus threshold"
        hint="Minimum consecutive days to earn the streak bonus"
        id="gm-streak-thresh"
      >
        <input
          id="gm-streak-thresh"
          type="number"
          min="1"
          max="30"
          bind:value={gamification.streakBonusThreshold}
        />
      </SettingRow>
    </section>

    <section>
      <h3 class="text-s font-semibold text-text mb-3">Data</h3>

      <SettingRow
        label="Reset all progress"
        hint="Permanently reset XP, levels, achievements, and streaks"
        id="gm-reset"
      >
        <button class="gm-reset-btn" onclick={resetProgress}>Reset</button>
      </SettingRow>
    </section>
  {/if}
</div>

<style>
  .gm-reset-btn {
    padding: 5px 14px;
    font-size: 0.72rem;
    font-weight: 500;
    font-family: inherit;
    color: var(--color-error, #f38ba8);
    background: oklch(from var(--color-error, #f38ba8) l c h / 0.08);
    border: 1px solid oklch(from var(--color-error, #f38ba8) l c h / 0.25);
    border-radius: var(--radius-s);
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  .gm-reset-btn:hover {
    background: oklch(from var(--color-error, #f38ba8) l c h / 0.15);
    border-color: var(--color-error, #f38ba8);
  }
</style>
