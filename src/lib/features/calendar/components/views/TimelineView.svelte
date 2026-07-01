<script lang="ts">
  import { onDestroy } from 'svelte';
  import EventChip from '../atoms/EventChip.svelte';
  import { expandedEvents, calendarFocusDate } from '../../stores/calendarStore';
  import { activeClocks, formatDuration, getElapsedMinutes, stopClock } from '../../services/timeClock';
  import type { CalendarEvent, ClockRecord } from '../../types';

  export let showClocks: boolean = true;

  const HOURS = Array.from({ length: 24 }, (_, i) => i);

  $: focusDateStr = toDateStr($calendarFocusDate);
  $: dayEvents = $expandedEvents.filter(e => e.date === focusDateStr);
  $: allDayEvents = dayEvents.filter(e => e.startMinute === null);
  $: timedEvents = dayEvents
    .filter(e => e.startMinute !== null)
    .sort((a, b) => (a.startMinute ?? 0) - (b.startMinute ?? 0));
  $: running = $activeClocks;

  function toDateStr(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function hourLabel(h: number): string {
    if (h === 0) return '12 AM';
    if (h === 12) return '12 PM';
    return h < 12 ? `${h} AM` : `${h - 12} PM`;
  }

  function topPx(startMinute: number): number {
    return (startMinute / 60) * 48;
  }

  function heightPx(durationMinutes: number): number {
    return Math.max((durationMinutes / 60) * 48, 20);
  }

  function nowTopPx(): number {
    const now = new Date();
    if (toDateStr(now) !== focusDateStr) return -100;
    return topPx(now.getHours() * 60 + now.getMinutes());
  }

  function getTypeColor(event: CalendarEvent): string {
    if (event.color) return event.color;
    switch (event.type) {
      case 'ics': return 'var(--color-info, #2563eb)';
      case 'planner': return 'var(--interactive-accent)';
      case 'clock': return 'var(--color-warning, #d97706)';
      case 'task': return 'var(--color-task, #f9e2af)';
      default: return 'var(--interactive-accent)';
    }
  }

  function handleStopClock(clock: ClockRecord) {
    stopClock(clock.id);
  }

  // Auto-refresh for running clock elapsed times
  let clockTick = 0;
  const clockInterval = setInterval(() => { clockTick++; }, 30000);
  onDestroy(() => clearInterval(clockInterval));
  $: void clockTick; // force reactivity on tick
</script>

<div class="timeline-view">
  <!-- Active Clocks -->
  {#if showClocks && running.length > 0}
    <div class="active-clocks" aria-label="Active time clocks">
      <div class="section-label">Active Clocks</div>
      {#each running as clock (clock.id)}
        <div class="clock-entry running">
          <span class="clock-task">{clock.taskText}</span>
          <span class="clock-elapsed">{formatDuration(getElapsedMinutes(clock))}</span>
          <button
            class="clock-stop"
            on:click={() => handleStopClock(clock)}
            title="Stop clock"
            aria-label="Stop clock for {clock.taskText}"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </button>
        </div>
      {/each}
    </div>
  {/if}

  <!-- All-day events -->
  {#if allDayEvents.length > 0}
    <div class="all-day-section" aria-label="All-day events">
      <div class="section-label">All day</div>
      {#each allDayEvents as event (event.id)}
        <EventChip {event} compact />
      {/each}
    </div>
  {/if}

  <!-- Hourly timeline -->
  <div class="time-grid" role="region" aria-label="Timeline">
    {#each HOURS as hour}
      <div class="hour-row" data-hour={hour}>
        <span class="hour-label">{hourLabel(hour)}</span>
        <div class="hour-track"></div>
      </div>
    {/each}

    <!-- Now indicator -->
    <div class="now-indicator" style="top: {nowTopPx()}px" aria-label="Current time">
      <div class="now-dot"></div>
      <div class="now-line"></div>
    </div>

    <!-- Timed events -->
    {#each timedEvents as event (event.id)}
      <div
        class="timeline-event"
        class:completed={event.completed}
        style="
          top: {topPx(event.startMinute ?? 0)}px;
          height: {heightPx(event.durationMinutes ?? 60)}px;
          border-left-color: {getTypeColor(event)};
        "
        title="{event.title}"
      >
        <EventChip {event} compact />
      </div>
    {/each}
  </div>
</div>

<style>
  .timeline-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow-y: auto;
    background: var(--background-primary);
    padding: 0;
  }

  .section-label {
    font-size: var(--font-smallest);
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 6px 12px 2px;
  }

  .active-clocks {
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 6px;
    flex-shrink: 0;
  }

  .clock-entry {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    font-size: 0.75rem;
  }

  .clock-entry.running {
    background: color-mix(in srgb, var(--color-warning, #d97706) 8%, transparent);
  }

  .clock-task {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--text-normal);
  }

  .clock-elapsed {
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--color-warning, #d97706);
    font-variant-numeric: tabular-nums;
  }

  .clock-stop {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border: none;
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-muted);
    cursor: pointer;
    flex-shrink: 0;
  }

  .clock-stop:hover {
    background: var(--background-modifier-hover);
    color: var(--color-error, #ef4444);
  }

  .all-day-section {
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 6px;
    flex-shrink: 0;
  }

  .all-day-section :global(.event-chip) {
    margin: 1px 12px;
  }

  .time-grid {
    position: relative;
    flex: 1;
    min-height: calc(24 * 48px);
  }

  .hour-row {
    display: flex;
    height: 48px;
    border-bottom: 1px solid var(--border-color);
  }

  .hour-label {
    width: 48px;
    flex-shrink: 0;
    font-size: 0.65rem;
    color: var(--text-faint);
    text-align: right;
    padding: 2px 6px 0 0;
  }

  .hour-track {
    flex: 1;
    border-left: 1px solid var(--border-color);
  }

  .now-indicator {
    position: absolute;
    left: 0;
    right: 0;
    z-index: 10;
    pointer-events: none;
    display: flex;
    align-items: center;
  }

  .now-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--interactive-accent);
    margin-left: 44px;
    flex-shrink: 0;
  }

  .now-line {
    flex: 1;
    height: 2px;
    background: var(--interactive-accent);
  }

  .timeline-event {
    position: absolute;
    left: 54px;
    right: 4px;
    border-left: 3px solid var(--interactive-accent);
    background: var(--background-secondary);
    border-radius: var(--radius-s);
    overflow: hidden;
    z-index: 5;
    min-height: 20px;
  }

  .timeline-event:hover {
    background: var(--background-modifier-hover);
    z-index: 6;
  }

  .timeline-event.completed {
    opacity: 0.5;
  }
</style>
