<script lang="ts">
  /**
   * GymPanel — tab navigation for Workout / Nutrition / Volume / History.
   * Derives vaultRoot and vaultId from the global vault store (same pattern as GitPanel).
   */
  import WorkoutLogger from './WorkoutLogger.svelte';
  import VolumeChart from './VolumeChart.svelte';
  import NutritionLogger from './NutritionLogger.svelte';
  import { listSessions } from '../services/gym';
  import { onMount } from 'svelte';
  import type { WorkoutSession } from '../types/gym';
  import { log } from '@/utils/logger';

  type Tab = 'workout' | 'nutrition' | 'volume' | 'history';
  let activeTab: Tab = 'workout';
  let recentSessions: WorkoutSession[] = [];
  let vaultRoot = '';
  let vaultId = '';

  const tabs: { id: Tab; label: string }[] = [
    { id: 'workout', label: 'Workout' },
    { id: 'nutrition', label: 'Nutrition' },
    { id: 'volume', label: 'Volume' },
    { id: 'history', label: 'History' },
  ];

  onMount(async () => {
    try {
      const { currentVault } = await import('@/stores/vault/vault');
      const { get } = await import('svelte/store');
      const vault = get(
        currentVault as import('svelte/store').Readable<{ root_path: string; id?: string } | null>
      );
      vaultRoot = vault?.root_path ?? '';
      vaultId = vault?.id ?? vault?.root_path ?? '';

      if (vaultRoot && vaultId) {
        recentSessions = await listSessions(vaultRoot, vaultId, 10);
      }
    } catch (err) {
      log.error('Failed to initialize GymPanel', err as Error);
    }
  });

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }
</script>

<div class="gym-panel">
  <div class="tab-bar" role="tablist" aria-label="Gym sections">
    {#each tabs as tab}
      <button
        class="tab-btn {activeTab === tab.id ? 'active' : ''}"
        role="tab"
        aria-selected={activeTab === tab.id}
        on:click={() => (activeTab = tab.id)}>{tab.label}</button
      >
    {/each}
  </div>

  <div class="tab-content">
    {#if activeTab === 'workout'}
      {#if vaultRoot && vaultId}
        <WorkoutLogger {vaultRoot} {vaultId} />
      {:else}
        <div class="loading-vault">Loading vault...</div>
      {/if}
    {:else if activeTab === 'nutrition'}
      {#if vaultRoot && vaultId}
        <NutritionLogger {vaultRoot} {vaultId} />
      {:else}
        <div class="loading-vault">Loading vault...</div>
      {/if}
    {:else if activeTab === 'volume'}
      {#if vaultRoot && vaultId}
        <VolumeChart {vaultRoot} {vaultId} />
      {:else}
        <div class="loading-vault">Loading vault...</div>
      {/if}
    {:else if activeTab === 'history'}
      <div class="history-tab">
        <h4 class="history-title">Recent Sessions</h4>
        {#if recentSessions.length === 0}
          <p class="empty-state">No sessions logged yet.</p>
        {:else}
          <ul class="session-list">
            {#each recentSessions as session (session.id)}
              <li class="session-item">
                <span class="session-date">{formatDate(session.date)}</span>
                {#if session.durationMin}
                  <span class="session-duration">{session.durationMin} min</span>
                {/if}
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .gym-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .tab-bar {
    display: flex;
    border-bottom: 1px solid var(--background-modifier-border);
  }
  .tab-btn {
    flex: 1;
    padding: var(--spacing-s) var(--spacing-xs);
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--text-muted);
    cursor: pointer;
    font-size: var(--font-ui-small);
    transition: color 0.15s;
  }
  .tab-btn:hover {
    color: var(--text-normal);
  }
  .tab-btn.active {
    color: var(--interactive-accent);
    border-bottom-color: var(--interactive-accent);
  }
  .tab-content {
    flex: 1;
    overflow-y: auto;
  }
  .loading-vault {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--text-muted);
    font-size: var(--font-ui-small);
  }
  .history-tab {
    padding: var(--spacing-m);
  }
  .history-title {
    font-size: var(--font-ui-small);
    font-weight: 600;
    color: var(--text-normal);
    margin: 0 0 var(--spacing-m);
  }
  .empty-state {
    color: var(--text-muted);
    font-size: var(--font-ui-small);
  }
  .session-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }
  .session-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-s) var(--spacing-m);
    background: var(--background-secondary);
    border-radius: var(--radius-s);
  }
  .session-date {
    font-size: var(--font-ui-small);
    color: var(--text-normal);
  }
  .session-duration {
    font-size: var(--font-ui-small);
    color: var(--text-muted);
  }
</style>
