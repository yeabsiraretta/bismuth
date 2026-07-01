<script lang="ts">
  import EventChip from '../atoms/EventChip.svelte';
  import { weekColumns, toggleCalendarEventComplete } from '../../stores/calendarStore';
  import type { CalendarEvent } from '../../types';

  export let onCreateEvent:
    ((detail: { date: string; startMinute: number | null }) => void) | undefined = undefined;

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const HOUR_HEIGHT = 60; // px per hour

  function formatHour(h: number): string {
    if (h === 0) return '12 AM';
    if (h < 12) return `${h} AM`;
    if (h === 12) return '12 PM';
    return `${h - 12} PM`;
  }

  function handleSlotClick(date: string, hour: number) {
    onCreateEvent?.({ date, startMinute: hour * 60 });
  }

  function getEventStyle(event: CalendarEvent): string {
    if (event.startMinute === null) return '';
    const top = (event.startMinute / 60) * HOUR_HEIGHT;
    const height = ((event.durationMinutes ?? 60) / 60) * HOUR_HEIGHT;
    return `top: ${top}px; height: ${Math.max(height, 20)}px;`;
  }

  function isAllDay(event: CalendarEvent): boolean {
    return event.startMinute === null;
  }

  function getEventColor(event: CalendarEvent): string {
    if (event.color) return event.color;
    if (event.type === 'task') return 'var(--color-task)';
    if (event.type === 'time-block') return 'var(--color-timeblock)';
    return 'var(--interactive-accent)';
  }
</script>

<div class="week-view">
  <!-- All-day row -->
  <div class="all-day-row">
    <div class="time-gutter all-day-label">All day</div>
    {#each $weekColumns as col}
      <div class="all-day-cell" class:today={col.isToday}>
        {#each col.events.filter(isAllDay) as event}
          <EventChip {event} compact onToggle={() => toggleCalendarEventComplete(event.id)} />
        {/each}
      </div>
    {/each}
  </div>

  <!-- Header row -->
  <div class="header-row">
    <div class="time-gutter"></div>
    {#each $weekColumns as col}
      <div class="day-header" class:today={col.isToday}>
        <span class="day-name">{col.dayName}</span>
        <span class="day-number" class:today-circle={col.isToday}>{col.dayNumber}</span>
      </div>
    {/each}
  </div>

  <!-- Time grid -->
  <div class="time-grid">
    <div class="grid-body">
      <!-- Hour labels -->
      <div class="time-gutter">
        {#each hours as hour}
          <div class="hour-label" style="height: {HOUR_HEIGHT}px">
            <span>{formatHour(hour)}</span>
          </div>
        {/each}
      </div>

      <!-- Day columns -->
      {#each $weekColumns as col}
        <div class="day-column" class:today={col.isToday}>
          <!-- Hour slots (clickable) -->
          {#each hours as hour}
            <button
              class="hour-slot"
              style="height: {HOUR_HEIGHT}px"
              on:click={() => handleSlotClick(col.date, hour)}
              aria-label="Create event at {formatHour(hour)} on {col.date}"
            ></button>
          {/each}

          <!-- Timed events overlay -->
          <div class="events-overlay">
            {#each col.events.filter((e) => !isAllDay(e)) as event (event.id)}
              <div
                class="timed-event"
                style="{getEventStyle(event)} --event-color: {getEventColor(event)};"
              >
                <EventChip {event} onToggle={() => toggleCalendarEventComplete(event.id)} />
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .week-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .header-row {
    display: grid;
    grid-template-columns: 64px repeat(7, 1fr);
    border-bottom: 1px solid var(--border-color);
    flex-shrink: 0;
  }

  .all-day-row {
    display: grid;
    grid-template-columns: 64px repeat(7, 1fr);
    border-bottom: 1px solid var(--border-color);
    min-height: 32px;
    flex-shrink: 0;
  }

  .all-day-label {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.65rem;
    color: var(--text-faint);
  }

  .all-day-cell {
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
    padding: 2px 4px;
    border-left: 1px solid var(--border-color);
    min-height: 28px;
  }

  .all-day-cell.today {
    background: var(--background-modifier-hover);
  }

  .time-gutter {
    width: 64px;
    min-width: 64px;
    flex-shrink: 0;
  }

  .day-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 0;
    border-left: 1px solid var(--border-color);
  }

  .day-name {
    font-size: 0.7rem;
    font-weight: 500;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .day-number {
    font-size: 1.3rem;
    font-weight: 400;
    color: var(--text-normal);
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  }

  .day-number.today-circle {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    font-weight: 600;
  }

  .day-header.today .day-name {
    color: var(--interactive-accent);
  }

  .time-grid {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .grid-body {
    display: grid;
    grid-template-columns: 64px repeat(7, 1fr);
    position: relative;
  }

  .hour-label {
    display: flex;
    align-items: flex-start;
    justify-content: flex-end;
    padding-right: 8px;
    color: var(--text-faint);
    font-size: 0.65rem;
    position: relative;
  }

  .hour-label span {
    transform: translateY(-50%);
  }

  .day-column {
    position: relative;
    border-left: 1px solid var(--border-color);
  }

  .day-column.today {
    background: color-mix(in srgb, var(--interactive-accent) 4%, transparent);
  }

  .hour-slot {
    display: block;
    width: 100%;
    border: none;
    border-bottom: 1px solid var(--border-color);
    background: none;
    cursor: pointer;
    padding: 0;
  }

  .hour-slot:hover {
    background: var(--background-modifier-hover);
  }

  .events-overlay {
    position: absolute;
    top: 0;
    left: 4px;
    right: 4px;
    pointer-events: none;
  }

  .timed-event {
    position: absolute;
    left: 0;
    right: 0;
    border-radius: var(--radius-s);
    background: color-mix(
      in srgb,
      var(--event-color, var(--interactive-accent)) 15%,
      var(--background-primary)
    );
    border-left: 3px solid var(--event-color, var(--interactive-accent));
    overflow: hidden;
    pointer-events: auto;
    cursor: pointer;
    transition: box-shadow 0.15s;
  }

  .timed-event:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    z-index: 1;
  }
</style>
