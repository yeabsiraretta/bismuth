<script lang="ts">
  import { onDestroy } from 'svelte';
  import Icon from '@/components/icons/Icon.svelte';
  import {
    activeClocks,
    stopClock,
    cancelClock,
    formatDuration,
    getElapsedMinutes,
  } from '../../services/timeClock';
  import type { ClockRecord } from '../../types';

  $: clocks = $activeClocks;

  let tick = 0;
  const interval = setInterval(() => { tick++; }, 10000);
  onDestroy(() => clearInterval(interval));

  function elapsed(clock: ClockRecord): string {
    void tick;
    return formatDuration(getElapsedMinutes(clock));
  }

  function handleStop(id: string) {
    stopClock(id);
  }

  function handleCancel(id: string) {
    cancelClock(id);
  }
</script>

{#if clocks.length > 0}
  <div class="active-clocks" aria-label="Running time clocks">
    {#each clocks as clock (clock.id)}
      <div class="clock-widget">
        <div class="clock-indicator" aria-hidden="true">
          <Icon name="clock" size={12} />
        </div>
        <div class="clock-details">
          <span class="clock-task">{clock.taskText}</span>
          <span class="clock-time">{elapsed(clock)}</span>
        </div>
        <div class="clock-controls">
          <button
            class="btn-stop"
            on:click={() => handleStop(clock.id)}
            title="Stop clock"
            aria-label="Stop clock"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </button>
          <button
            class="btn-cancel"
            on:click={() => handleCancel(clock.id)}
            title="Cancel clock"
            aria-label="Cancel clock"
          >
            <Icon name="x" size={10} />
          </button>
        </div>
      </div>
    {/each}
  </div>
{/if}

<style>
  .active-clocks {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .clock-widget {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    border-radius: var(--radius-s);
    background: color-mix(in srgb, var(--color-warning, #d97706) 8%, transparent);
    border-left: 2px solid var(--color-warning, #d97706);
    font-size: 0.72rem;
  }

  .clock-indicator {
    color: var(--color-warning, #d97706);
    flex-shrink: 0;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  .clock-details {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }

  .clock-task {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--text-normal);
  }

  .clock-time {
    font-weight: 600;
    color: var(--color-warning, #d97706);
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
  }

  .clock-controls {
    display: flex;
    gap: 2px;
    flex-shrink: 0;
  }

  .btn-stop, .btn-cancel {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border: none;
    border-radius: 3px;
    background: none;
    color: var(--text-muted);
    cursor: pointer;
  }

  .btn-stop:hover {
    background: var(--background-modifier-hover);
    color: var(--color-error, #ef4444);
  }

  .btn-cancel:hover {
    background: var(--background-modifier-hover);
    color: var(--text-normal);
  }
</style>
