<script lang="ts">
  import EventChip from '../atoms/EventChip.svelte';
  import { expandedEvents, calendarFocusDate } from '../../stores/calendarStore';
  import { settings } from '@/features/settings';
  import type { CalendarEvent, CalendarCategory } from '../../types';

  const HOURS = Array.from({ length: 24 }, (_, i) => i);

  $: focusDateStr = toDateStr($calendarFocusDate);
  $: dayEvents = $expandedEvents.filter(e => e.date === focusDateStr);
  $: allDayEvents = dayEvents.filter(e => e.startMinute === null);
  $: timedEvents = dayEvents.filter(e => e.startMinute !== null);
  $: categories = $settings.calendarCategories ?? [];

  function toDateStr(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function topPct(startMinute: number): string {
    return `${(startMinute / 1440) * 100}%`;
  }

  function heightPct(durationMinutes: number): string {
    return `${Math.max((durationMinutes / 1440) * 100, 1.5)}%`;
  }

  function hourLabel(h: number): string {
    if (h === 0) return '12 AM';
    if (h === 12) return '12 PM';
    return h < 12 ? `${h} AM` : `${h - 12} PM`;
  }

  function nowTopPct(): string {
    const now = new Date();
    const todayStr = toDateStr(now);
    if (todayStr !== focusDateStr) return '-100%';
    return topPct(now.getHours() * 60 + now.getMinutes());
  }

  function getCategoryColor(event: CalendarEvent): string | undefined {
    if (!event.categoryId) return event.color;
    return categories.find((c: CalendarCategory) => c.id === event.categoryId)?.color ?? event.color;
  }
</script>

<div class="day-view">
  {#if allDayEvents.length > 0}
    <div class="all-day-band" aria-label="All-day events">
      <span class="band-label">All day</span>
      <div class="all-day-events">
        {#each allDayEvents as event (event.id)}
          <EventChip {event} />
        {/each}
      </div>
    </div>
  {/if}

  <div class="time-grid">
    <div class="hour-labels" aria-hidden="true">
      {#each HOURS as hour}
        <div class="hour-label">{hourLabel(hour)}</div>
      {/each}
    </div>

    <div class="event-column" role="region" aria-label="Timed events">
      {#each HOURS as hour}
        <div class="hour-slot" data-hour={hour}></div>
      {/each}

      <div class="now-line" style="top: {nowTopPct()}" aria-label="Current time"></div>

      {#each timedEvents as event (event.id)}
        <div
          class="timed-event"
          style="
            top: {topPct(event.startMinute ?? 0)};
            height: {heightPct(event.durationMinutes ?? 60)};
            border-left-color: {getCategoryColor(event) ?? 'var(--interactive-accent)'};
          "
          aria-label="{event.title}"
        >
          <EventChip {event} compact />
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .day-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .all-day-band {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-s);
    border-bottom: 1px solid var(--border-color);
    background: var(--background-secondary);
    flex-shrink: 0;
  }

  .band-label {
    font-size: var(--font-smallest);
    color: var(--text-muted);
    min-width: 44px;
    padding-top: 2px;
  }

  .all-day-events { display: flex; flex-wrap: wrap; gap: 2px; flex: 1; }

  .time-grid {
    display: flex;
    flex: 1;
    overflow-y: auto;
    position: relative;
  }

  .hour-labels {
    display: flex;
    flex-direction: column;
    min-width: 48px;
    flex-shrink: 0;
  }

  .hour-label {
    height: calc(100% / 24);
    min-height: 40px;
    display: flex;
    align-items: flex-start;
    padding: 2px 4px 0;
    font-size: var(--font-smallest);
    color: var(--text-muted);
    border-top: 1px solid var(--border-color);
  }

  .event-column {
    flex: 1;
    position: relative;
    border-left: 1px solid var(--border-color);
  }

  .hour-slot {
    height: 40px;
    border-top: 1px solid var(--border-color);
  }

  .now-line {
    position: absolute;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--interactive-accent);
    z-index: 10;
    pointer-events: none;
  }

  .timed-event {
    position: absolute;
    left: 4px;
    right: 4px;
    border-left: 3px solid var(--interactive-accent);
    background: var(--background-secondary);
    border-radius: var(--radius-s);
    overflow: hidden;
    z-index: 5;
    min-height: 18px;
  }

  .timed-event:hover {
    background: var(--background-modifier-hover);
    z-index: 6;
  }
</style>
