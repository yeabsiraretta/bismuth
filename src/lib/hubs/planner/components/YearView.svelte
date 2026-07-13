<script lang="ts">
  import {
    formatDateStr,
    getEventCountMap,
    getYearMonths,
  } from '@/hubs/planner/stores/calendar-store.svelte';

  const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  let months = $derived(getYearMonths());
  let eventCounts = $derived(getEventCountMap());
  let todayStr = formatDateStr(new Date());

  function intensityClass(date: string | null): string {
    if (!date) return '';
    const c = eventCounts[date] ?? 0;
    if (c === 0) return '';
    if (c === 1) return 'heat-1';
    if (c <= 3) return 'heat-2';
    if (c <= 5) return 'heat-3';
    return 'heat-4';
  }

  function openNote(date: string) {
    window.dispatchEvent(new CustomEvent('calendar-day-click', { detail: { date } }));
  }
</script>

<div class="year-grid">
  {#each months as m (m.month)}
    <div class="mini-month">
      <h3 class="mini-month-name">{m.name}</h3>
      <div class="mini-header">
        {#each WEEKDAYS as wd, i (i)}
          <span class="mini-wd">{wd}</span>
        {/each}
      </div>
      <div class="mini-days">
        {#each m.days as cell, i (i)}
          {#if cell.day}
            <button
              class="mini-day {intensityClass(cell.date)}"
              class:today={cell.date === todayStr}
              onclick={() => cell.date && openNote(cell.date)}
              title={cell.date && (eventCounts[cell.date] ?? 0) > 0
                ? `${eventCounts[cell.date!]} event${(eventCounts[cell.date!] ?? 0) > 1 ? 's' : ''}`
                : undefined}
            >
              {cell.day}
            </button>
          {:else}
            <span class="mini-day empty"></span>
          {/if}
        {/each}
      </div>
    </div>
  {/each}

  <div class="heatmap-legend">
    <span class="legend-label">Less</span>
    <span class="legend-swatch"></span>
    <span class="legend-swatch heat-1"></span>
    <span class="legend-swatch heat-2"></span>
    <span class="legend-swatch heat-3"></span>
    <span class="legend-swatch heat-4"></span>
    <span class="legend-label">More</span>
  </div>
</div>

<style>
  .year-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 16px;
    padding: 16px;
  }
  .mini-month {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .mini-month-name {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text);
    margin: 0;
    padding: 0 2px;
  }
  .mini-header {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 1px;
  }
  .mini-wd {
    font-size: 0.55rem;
    text-align: center;
    color: var(--color-text-subtle);
    font-weight: 500;
  }
  .mini-days {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 1px;
  }
  .mini-day {
    font-size: 0.6rem;
    width: 100%;
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    color: var(--color-text);
    cursor: pointer;
    border-radius: var(--radius-s);
    font-family: inherit;
    padding: 0;
  }
  .mini-day:hover:not(.empty) {
    background: var(--color-surface-hover);
  }
  .mini-day.empty {
    cursor: default;
  }
  .mini-day.today {
    background: var(--color-accent);
    color: var(--color-background);
    font-weight: 600;
    border-radius: 50%;
  }
  .mini-day.heat-1:not(.today) {
    background: oklch(from var(--color-accent) l c h / 0.12);
  }
  .mini-day.heat-2:not(.today) {
    background: oklch(from var(--color-accent) l c h / 0.25);
  }
  .mini-day.heat-3:not(.today) {
    background: oklch(from var(--color-accent) l c h / 0.4);
    color: var(--color-background);
  }
  .mini-day.heat-4:not(.today) {
    background: oklch(from var(--color-accent) l c h / 0.6);
    color: var(--color-background);
    font-weight: 600;
  }
  .heatmap-legend {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 3px;
    padding: 12px 16px;
    grid-column: 1 / -1;
  }
  .legend-label {
    font-size: 0.6rem;
    color: var(--color-text-subtle);
    margin: 0 4px;
  }
  .legend-swatch {
    width: 12px;
    height: 12px;
    border-radius: var(--radius-s);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
  }
  .legend-swatch.heat-1 {
    background: oklch(from var(--color-accent) l c h / 0.12);
    border-color: transparent;
  }
  .legend-swatch.heat-2 {
    background: oklch(from var(--color-accent) l c h / 0.25);
    border-color: transparent;
  }
  .legend-swatch.heat-3 {
    background: oklch(from var(--color-accent) l c h / 0.4);
    border-color: transparent;
  }
  .legend-swatch.heat-4 {
    background: oklch(from var(--color-accent) l c h / 0.6);
    border-color: transparent;
  }
</style>
