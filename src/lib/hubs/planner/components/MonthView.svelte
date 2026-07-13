<script lang="ts">
  import {
    formatDateStr,
    getEventsForDate,
    getMonthGrid,
  } from '@/hubs/planner/stores/calendar-store.svelte';
  import type { CalendarEvent } from '@/hubs/planner/types/calendar-types';

  let {
    onDayClick = undefined,
    onEventClick = undefined,
  }: {
    onDayClick?: ((date: string) => void) | undefined;
    onEventClick?: ((eventId: string) => void) | undefined;
  } = $props();

  const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const MAX_VISIBLE_EVENTS = 3;

  let today = $derived(formatDateStr(new Date()));
  let rawCells = $derived(getMonthGrid());
  let cells = $derived(padToFullRows(rawCells));
  let selectedDate: string | null = $state(null);

  function getDayEvents(date: string | null): CalendarEvent[] {
    if (!date) return [];
    return getEventsForDate(date);
  }

  function padToFullRows(grid: typeof rawCells) {
    const remainder = grid.length % 7;
    if (remainder === 0) return grid;
    const padding = 7 - remainder;
    return [...grid, ...Array.from({ length: padding }, () => ({ day: null, date: null }))];
  }

  function selectDay(date: string | null) {
    if (!date) return;
    selectedDate = date;
    onDayClick?.(date);
  }

  function handleEventClick(e: MouseEvent, eventId: string) {
    e.stopPropagation();
    onEventClick?.(eventId);
  }
</script>

<div class="month-container">
  <div class="weekday-row">
    {#each WEEKDAYS as day (day)}
      <div class="weekday-header">{day}</div>
    {/each}
  </div>
  <div class="month-grid">
    {#each cells as cell, i (cell.date ?? `empty-${i}`)}
      {#if cell.day === null}
        <div class="day-cell empty"></div>
      {:else}
        {@const dayEvts = getDayEvents(cell.date)}
        <button
          class="day-cell"
          class:today={cell.date === today}
          class:selected={cell.date === selectedDate}
          class:has-events={dayEvts.length > 0}
          onclick={() => selectDay(cell.date)}
          aria-label={cell.date}
        >
          <span class="day-number">{cell.day}</span>
          {#if dayEvts.length > 0}
            <div class="day-events">
              {#each dayEvts.slice(0, MAX_VISIBLE_EVENTS) as evt (evt.id)}
                <span
                  class="event-pill"
                  class:completed={evt.completed}
                  style={evt.color ? `border-left-color: ${evt.color}` : ''}
                  role="button"
                  tabindex="-1"
                  onclick={(e) => handleEventClick(e, evt.id)}
                  onkeydown={(e) => {
                    if (e.key === 'Enter') {
                      e.stopPropagation();
                      onEventClick?.(evt.id);
                    }
                  }}>{evt.title}</span
                >
              {/each}
              {#if dayEvts.length > MAX_VISIBLE_EVENTS}
                <span class="event-more">+{dayEvts.length - MAX_VISIBLE_EVENTS} more</span>
              {/if}
            </div>
          {/if}
        </button>
      {/if}
    {/each}
  </div>
</div>

<style>
  .month-container {
    padding: 8px;
  }
  .weekday-row {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
    margin-bottom: 2px;
  }
  .weekday-header {
    text-align: center;
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--color-text-subtle);
    padding: 4px 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .month-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
  }
  .day-cell {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    min-height: 80px;
    border-radius: var(--radius-m);
    font-size: 0.8rem;
    color: var(--color-text);
    background: none;
    border: 1px solid transparent;
    cursor: pointer;
    transition: all var(--transition-base);
    padding: 4px;
  }
  .day-cell.empty {
    cursor: default;
  }
  .day-cell:not(.empty):hover {
    background: var(--color-surface-hover);
    border-color: var(--color-border);
  }
  .day-cell.has-events {
    background: oklch(from var(--color-primary) l c h / 0.04);
  }
  .day-cell.today .day-number {
    background: var(--color-accent);
    color: var(--color-background);
    font-weight: 700;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .day-cell.today:hover {
    background: oklch(from var(--color-accent) l c h / 0.1);
  }
  .day-cell.selected {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 1px var(--color-primary);
  }
  .day-number {
    font-size: 0.72rem;
    font-weight: 500;
    line-height: 1;
    margin-bottom: 2px;
  }
  .day-events {
    display: flex;
    flex-direction: column;
    gap: 1px;
    overflow: hidden;
    flex: 1;
  }
  .event-pill {
    font-size: 0.6rem;
    padding: 1px 4px;
    border-radius: var(--radius-s);
    background: oklch(from var(--color-primary) l c h / 0.15);
    border-left: 2px solid var(--color-primary);
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: pointer;
    text-align: left;
  }
  .event-pill:hover {
    background: oklch(from var(--color-primary) l c h / 0.3);
  }
  .event-pill.completed {
    opacity: 0.5;
    text-decoration: line-through;
  }
  .event-more {
    font-size: 0.55rem;
    color: var(--color-text-muted);
    padding: 0 4px;
  }
</style>
