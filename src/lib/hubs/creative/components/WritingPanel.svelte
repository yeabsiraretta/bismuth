<script lang="ts">
  import { goto } from '$app/navigation';
  import { formatNumber, formatTimer } from '@/hubs/creative/services/writing-service';
  import {
    endFocus,
    getFocusRemaining,
    getFocusState,
    getRecentHistory,
    getStreak,
    getTodayWords,
    getWeekWords,
    pauseFocus,
    recordWords,
    resumeFocus,
    startFocus,
  } from '@/hubs/creative/stores/writing-store.svelte';
  import BIcon from '@/ui/b-icon.svelte';
  import Panel from '@/ui/panel.svelte';

  let wordsInput = $state(0);
  let todayWords = $derived(getTodayWords());
  let weekWords = $derived(getWeekWords());
  let streak = $derived(getStreak());
  let focusState = $derived(getFocusState());
  let focusRemaining = $derived(getFocusRemaining());
  let recentDays = $derived(getRecentHistory().slice(0, 7));

  function logWords() {
    if (wordsInput <= 0) return;
    recordWords(wordsInput);
    wordsInput = 0;
  }
</script>

<Panel title="Writing">
  {#snippet actions()}
    <button class="panel-action" onclick={() => goto('/writing')} title="Open Writing">
      <BIcon name="externalLink" size={14} />
    </button>
  {/snippet}

  <!-- Today / Week / Streak -->
  <div class="wr-stats">
    <div class="wr-mini">
      <span class="wr-mv">{formatNumber(todayWords)}</span><span class="wr-ml">today</span>
    </div>
    <div class="wr-mini">
      <span class="wr-mv">{formatNumber(weekWords)}</span><span class="wr-ml">week</span>
    </div>
    {#if streak > 0}
      <div class="wr-mini wr-accent">
        <span class="wr-mv">{streak}d</span><span class="wr-ml">streak</span>
      </div>
    {/if}
  </div>

  <!-- Log words -->
  <div class="wr-log">
    <input type="number" bind:value={wordsInput} min="0" placeholder="Words" class="wr-num" />
    <button class="wr-btn" onclick={logWords} disabled={wordsInput <= 0}>Log</button>
  </div>

  <!-- Focus timer -->
  <div class="wr-focus">
    <span class="wr-focus-label">Focus</span>
    {#if focusState === 'idle'}
      <button class="wr-btn" onclick={startFocus}>Start</button>
    {:else}
      <span class="wr-timer">{formatTimer(focusRemaining)}</span>
      <span class="wr-focus-mode">{focusState}</span>
      {#if focusState === 'working'}
        <button class="panel-action" onclick={pauseFocus} title="Pause"
          ><BIcon name="pause" size={12} /></button
        >
      {:else if focusState === 'paused'}
        <button class="panel-action" onclick={resumeFocus} title="Resume"
          ><BIcon name="play" size={12} /></button
        >
      {/if}
      <button class="panel-action" onclick={endFocus} title="End"
        ><BIcon name="x" size={12} /></button
      >
    {/if}
  </div>

  <!-- Recent history -->
  {#if recentDays.some((d) => d.words > 0)}
    <ul class="wr-history">
      {#each recentDays as d (d.date)}
        <li class="wr-row">
          <span class="wr-date">{d.date.slice(5)}</span>
          <span class="wr-words">{formatNumber(d.words)}w</span>
        </li>
      {/each}
    </ul>
  {/if}
</Panel>

<style>
  .wr-stats {
    display: flex;
    gap: 10px;
    margin-bottom: 8px;
  }
  .wr-mini {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .wr-mv {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--color-accent);
  }
  .wr-ml {
    font-size: 0.55rem;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }
  .wr-accent .wr-mv {
    color: var(--color-warning);
  }
  .wr-log {
    display: flex;
    gap: 4px;
    margin-bottom: 8px;
  }
  .wr-num {
    flex: 1;
    width: 60px;
    padding: 3px 6px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-background);
    color: var(--color-text);
    font-size: 0.72rem;
  }
  .wr-btn {
    padding: 3px 8px;
    border: none;
    background: var(--color-accent);
    color: var(--color-background);
    border-radius: var(--radius-s);
    font-size: 0.68rem;
    cursor: pointer;
  }
  .wr-btn:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .wr-focus {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
  }
  .wr-focus-label {
    font-size: 0.68rem;
    color: var(--color-text-muted);
    font-weight: 600;
  }
  .wr-timer {
    font-size: 0.75rem;
    color: var(--color-text);
    font-variant-numeric: tabular-nums;
    font-weight: 600;
  }
  .wr-focus-mode {
    font-size: 0.6rem;
    color: var(--color-text-muted);
    text-transform: capitalize;
  }
  .wr-history {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .wr-row {
    display: flex;
    justify-content: space-between;
    padding: 2px 0;
    border-bottom: 1px solid var(--color-border);
    font-size: 0.65rem;
  }
  .wr-date {
    color: var(--color-text);
  }
  .wr-words {
    color: var(--color-text-muted);
  }
</style>
