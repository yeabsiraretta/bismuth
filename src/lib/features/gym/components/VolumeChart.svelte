<script lang="ts">
  /**
   * VolumeChart — CSS-only horizontal bar chart showing weekly volume by muscle group.
   * No Chart.js dependency; bars use proportional CSS widths.
   */
  import { onMount } from 'svelte';
  import { weeklyVolume, loadWeeklyVolume } from '../stores/gymStore';
  import type { VolumeEntry } from '../types/gym';

  export let vaultRoot: string;
  export let vaultId: string;

  const muscleGroupColors: Record<string, string> = {
    chest: 'var(--color-red, #e74c3c)',
    back: 'var(--color-blue, #3498db)',
    legs: 'var(--color-green, #2ecc71)',
    shoulders: 'var(--color-orange, #e67e22)',
    arms: 'var(--color-purple, #9b59b6)',
    core: 'var(--color-yellow, #f1c40f)',
    cardio: 'var(--color-teal, #1abc9c)',
    full_body: 'var(--interactive-accent)',
  };

  $: entries = $weeklyVolume;
  $: maxVolume = entries.length > 0 ? Math.max(...entries.map((e) => e.totalVolumeKg)) : 1;

  function barWidth(entry: VolumeEntry): string {
    if (maxVolume <= 0) return '0%';
    const pct = Math.round((entry.totalVolumeKg / maxVolume) * 100);
    return `${pct}%`;
  }

  function barColor(muscleGroup: string): string {
    return muscleGroupColors[muscleGroup] ?? 'var(--interactive-accent)';
  }

  function formatVolume(kg: number): string {
    if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`;
    return `${Math.round(kg)}kg`;
  }

  onMount(async () => {
    await loadWeeklyVolume(vaultRoot, vaultId);
  });
</script>

<div class="volume-chart">
  <h4 class="chart-title">Weekly Volume by Muscle Group</h4>
  {#if entries.length === 0}
    <p class="empty-state">No workout data for this week.</p>
  {:else}
    <div class="chart-body" role="img" aria-label="Weekly volume bar chart">
      {#each entries as entry (entry.muscleGroup)}
        <div class="chart-row">
          <span class="muscle-label">{entry.muscleGroup.replace('_', ' ')}</span>
          <div class="bar-track">
            <div
              class="bar"
              style="width: {barWidth(entry)}; background: {barColor(entry.muscleGroup)};"
              title="{entry.muscleGroup}: {formatVolume(entry.totalVolumeKg)}"
            ></div>
          </div>
          <span class="volume-label">{formatVolume(entry.totalVolumeKg)}</span>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .volume-chart {
    padding: var(--spacing-m);
  }
  .chart-title {
    font-size: var(--font-ui-small);
    font-weight: 600;
    color: var(--text-normal);
    margin: 0 0 var(--spacing-m);
  }
  .empty-state {
    color: var(--text-muted);
    font-size: var(--font-ui-small);
    text-align: center;
    padding: var(--spacing-l);
  }
  .chart-body {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-s);
  }
  .chart-row {
    display: grid;
    grid-template-columns: 80px 1fr 60px;
    align-items: center;
    gap: var(--spacing-s);
  }
  .muscle-label {
    font-size: var(--font-ui-small);
    color: var(--text-muted);
    text-align: right;
    text-transform: capitalize;
  }
  .bar-track {
    background: var(--background-secondary);
    border-radius: 999px;
    height: 14px;
    overflow: hidden;
  }
  .bar {
    height: 100%;
    border-radius: 999px;
    transition: width 0.3s ease;
    min-width: 4px;
  }
  .volume-label {
    font-size: var(--font-smallest);
    color: var(--text-muted);
    font-variant-numeric: tabular-nums;
  }
</style>
