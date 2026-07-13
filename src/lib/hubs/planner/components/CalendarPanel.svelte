<script lang="ts">
  import { goto } from '$app/navigation';
  import type { DayCell } from '@/hubs/planner/types/calendar-types';
  import Panel from '@/ui/panel.svelte';
  import BIcon from '@/ui/b-icon.svelte';
  import {
    formatDateStr,
    getEventCountMap,
    getMonthGrid,
    getHeaderLabel,
    navigateCalendar,
    goToToday,
    setFocusDate,
    setViewMode,
  } from '@/hubs/planner/stores/calendar-store.svelte';

  const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  let today = $derived(formatDateStr(new Date()));
  let flatGrid = $derived(getMonthGrid());
  let grid = $derived(chunkRows(flatGrid));
  let headerLabel = $derived(getHeaderLabel());
  let eventCounts = $derived(getEventCountMap());

  function chunkRows(cells: DayCell[]): DayCell[][] {
    const rows: DayCell[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      rows.push(cells.slice(i, i + 7));
    }
    return rows;
  }

  function selectDate(date: string | null) {
    if (!date) return;
    const [y, m, d] = date.split('-').map(Number);
    setFocusDate(new Date(y, m - 1, d));
    setViewMode('day');
    goto('/calendar');
  }
</script>

<Panel title="Calendar">
  {#snippet actions()}
    <button class="panel-action" onclick={() => goto('/calendar')} title="Open Calendar">
      <BIcon name="externalLink" size={14} />
    </button>
  {/snippet}
  <div class="cal-nav">
    <button class="nav-btn" onclick={() => navigateCalendar('prev')} aria-label="Previous month"
      >&lt;</button
    >
    <button class="nav-label" onclick={() => goToToday()}>{headerLabel}</button>
    <button class="nav-btn" onclick={() => navigateCalendar('next')} aria-label="Next month"
      >&gt;</button
    >
  </div>
  <div class="cal-grid">
    {#each WEEKDAYS as day (day)}
      <span class="weekday">{day}</span>
    {/each}
    {#each grid as row, ri (ri)}
      {#each row as cell, ci (ci)}
        {#if cell.day}
          <button
            class="cal-day"
            class:today={cell.date === today}
            class:has-events={cell.date != null && (eventCounts[cell.date] ?? 0) > 0}
            onclick={() => selectDate(cell.date)}
          >
            {cell.day}
            {#if cell.date != null && (eventCounts[cell.date] ?? 0) > 0}
              <span class="event-dot"></span>
            {/if}
          </button>
        {:else}
          <span class="cal-day empty"></span>
        {/if}
      {/each}
    {/each}
  </div>
</Panel>

<style>
  .cal-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 8px;
    border-bottom: 1px solid var(--color-border);
  }
  .nav-btn {
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    border-radius: var(--radius-s);
    font-size: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .nav-btn:hover {
    background: var(--color-surface-hover);
  }
  .nav-label {
    border: none;
    background: transparent;
    color: var(--color-text);
    font-size: 0.75rem;
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    padding: 2px 8px;
    border-radius: var(--radius-s);
  }
  .nav-label:hover {
    background: var(--color-surface-hover);
  }
  .cal-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
    padding: 6px 8px 8px;
  }
  .weekday {
    text-align: center;
    font-size: 0.6rem;
    font-weight: 600;
    color: var(--color-text-subtle);
    padding: 2px 0 4px;
  }
  .cal-day {
    display: flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 1;
    border: none;
    background: transparent;
    color: var(--color-text);
    font-size: 0.7rem;
    font-family: inherit;
    cursor: pointer;
    border-radius: 50%;
    padding: 0;
  }
  .cal-day:hover:not(.empty) {
    background: var(--color-surface-hover);
  }
  .cal-day.today {
    background: var(--color-accent);
    color: var(--color-background);
    font-weight: 600;
  }
  .cal-day.empty {
    cursor: default;
  }
  .cal-day.has-events {
    position: relative;
  }
  .event-dot {
    position: absolute;
    bottom: 2px;
    left: 50%;
    transform: translateX(-50%);
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--color-accent);
  }
  .cal-day.today .event-dot {
    background: white;
  }
</style>
