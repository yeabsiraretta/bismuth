<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { unlockedAchievements } from '../stores/questStore';
  import { ACHIEVEMENTS } from '@/types/data/quest';

  $: unlocked = ACHIEVEMENTS.filter(a => $unlockedAchievements.includes(a.id));
  $: locked = ACHIEVEMENTS.filter(a => !$unlockedAchievements.includes(a.id));
</script>

<div class="quests-view">
  <div class="quest-header">
    <Icon name="trophy" size={16} />
    <span class="quest-title">Achievements</span>
    <span class="quest-count">{unlocked.length}/{ACHIEVEMENTS.length}</span>
  </div>

  {#if unlocked.length > 0}
    <div class="achievement-section">
      <span class="section-label">Unlocked</span>
      {#each unlocked as achievement}
        <div class="achievement-item unlocked">
          <span class="ach-icon">{achievement.name[0]}</span>
          <div class="ach-info">
            <span class="ach-name">{achievement.name}</span>
            <span class="ach-desc">{achievement.description}</span>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  {#if locked.length > 0}
    <div class="achievement-section">
      <span class="section-label">Locked</span>
      {#each locked as achievement}
        <div class="achievement-item locked">
          <span class="ach-icon locked-icon">?</span>
          <div class="ach-info">
            <span class="ach-name">{achievement.name}</span>
            <span class="ach-desc">{achievement.description}</span>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  {#if ACHIEVEMENTS.length === 0}
    <div class="empty">
      <Icon name="trophy" size={24} />
      <p>Complete tasks to unlock achievements</p>
    </div>
  {/if}
</div>

<style>
  .quests-view { display: flex; flex-direction: column; gap: 12px; }
  .quest-header { display: flex; align-items: center; gap: 8px; padding: 8px 0; }
  .quest-title { flex: 1; font-size: 13px; font-weight: 600; }
  .quest-count { font-size: 11px; color: var(--text-muted); }
  .achievement-section { display: flex; flex-direction: column; gap: 4px; }
  .section-label { font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; padding: 4px 0; }
  .achievement-item {
    display: flex; align-items: center; gap: 10px; padding: 8px 10px;
    border-radius: 6px; border: 1px solid var(--border-color);
  }
  .achievement-item.unlocked { border-color: var(--accent-color, #6366f1); background: var(--accent-bg, rgba(99, 102, 241, 0.05)); }
  .achievement-item.locked { opacity: 0.6; }
  .ach-icon { font-size: 18px; width: 28px; text-align: center; }
  .locked-icon { color: var(--text-muted); font-weight: 700; }
  .ach-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
  .ach-name { font-size: 12px; font-weight: 500; }
  .ach-desc { font-size: 10px; color: var(--text-muted); }
  .empty { text-align: center; padding: 24px; color: var(--text-muted); }
  .empty p { font-size: 12px; margin-top: 8px; }
</style>
