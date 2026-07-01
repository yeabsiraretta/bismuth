<script lang="ts">
  import EventChip from '../atoms/EventChip.svelte';
  import {
    calendarFocusDate,
    allCalendarItems,
    toggleCalendarEventComplete,
  } from '../../stores/calendarStore';
  import type { CalendarEvent } from '../../types';

  export let onDayClick: ((detail: { date: string }) => void) | undefined = undefined;

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  $: year = $calendarFocusDate.getFullYear();
  $: month = $calendarFocusDate.getMonth();
  $: calendarWeeks = buildMonthGrid(year, month, $allCalendarItems);

  interface MonthCell {
    date: string;
    day: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    events: CalendarEvent[];
  }

  function formatDateStr(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function buildMonthGrid(y: number, m: number, items: CalendarEvent[]): MonthCell[][] {
    const today = formatDateStr(new Date());
    const firstDay = new Date(y, m, 1);
    const startOffset = firstDay.getDay();
    const start = new Date(y, m, 1 - startOffset);

    const weeks: MonthCell[][] = [];
    let current = new Date(start);

    for (let w = 0; w < 6; w++) {
      const week: MonthCell[] = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = formatDateStr(current);
        week.push({
          date: dateStr,
          day: current.getDate(),
          isCurrentMonth: current.getMonth() === m,
          isToday: dateStr === today,
          events: items.filter((e) => e.date === dateStr),
        });
        current.setDate(current.getDate() + 1);
      }
      weeks.push(week);
      // Stop early if we've passed the current month
      if (current.getMonth() > m && current.getDate() > 7) break;
    }
    return weeks;
  }

  function handleDayClick(date: string) {
    onDayClick?.({ date });
  }
</script>

<div class="month-view">
  <div class="month-header">
    {#each weekdays as day}
      <div class="weekday-cell">{day}</div>
    {/each}
  </div>
  <div class="month-grid">
    {#each calendarWeeks as week}
      <div class="month-row">
        {#each week as cell}
          <button
            class="month-cell"
            class:other-month={!cell.isCurrentMonth}
            class:today={cell.isToday}
            on:click={() => handleDayClick(cell.date)}
          >
            <span class="cell-day" class:today-badge={cell.isToday}>{cell.day}</span>
            <div class="cell-events">
              {#each cell.events.slice(0, 3) as event (event.id)}
                <EventChip {event} compact onToggle={() => toggleCalendarEventComplete(event.id)} />
              {/each}
              {#if cell.events.length > 3}
                <span class="more-events">+{cell.events.length - 3} more</span>
              {/if}
            </div>
          </button>
        {/each}
      </div>
    {/each}
  </div>
</div>

<style>
  .month-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .month-header {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    border-bottom: 1px solid var(--border-color);
    flex-shrink: 0;
  }

  .weekday-cell {
    padding: 8px;
    text-align: center;
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .month-grid {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }

  .month-row {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    flex: 1;
    min-height: 80px;
  }

  .month-cell {
    display: flex;
    flex-direction: column;
    padding: 4px;
    border: none;
    border-right: 1px solid var(--border-color);
    border-bottom: 1px solid var(--border-color);
    background: var(--background-primary);
    cursor: pointer;
    text-align: left;
    min-height: 80px;
    overflow: hidden;
  }

  .month-cell:hover {
    background: var(--background-modifier-hover);
  }

  .month-cell.other-month {
    opacity: 0.4;
  }

  .month-cell.today {
    background: color-mix(in srgb, var(--interactive-accent) 5%, var(--background-primary));
  }

  .cell-day {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--text-normal);
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    margin-bottom: 2px;
  }

  .cell-day.today-badge {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    font-weight: 600;
  }

  .cell-events {
    display: flex;
    flex-direction: column;
    gap: 1px;
    overflow: hidden;
    flex: 1;
  }

  .more-events {
    font-size: 0.6rem;
    color: var(--text-faint);
    padding: 1px 4px;
  }
</style>
