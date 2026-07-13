<script lang="ts">
  import { getCalendar } from '@/hubs/core/stores/settings-store.svelte';
  import {
    formatDateStr,
    getDayEvents,
    getFocusDate,
    toggleEventComplete,
  } from '@/hubs/planner/stores/calendar-store.svelte';
  import { onMount } from 'svelte';

  let {
    onCreateEvent = undefined,
    onEventClick = undefined,
  }: {
    onCreateEvent?: ((detail: { date: string; startMinute: number | null }) => void) | undefined;
    onEventClick?: ((eventId: string) => void) | undefined;
  } = $props();

  const HOURS = Array.from({ length: 24 }, (_, i) => i);

  let dayEvents = $derived(getDayEvents());
  let dateStr = $derived(formatDateStr(getFocusDate()));

  function formatHour(h: number): string {
    if (h === 0) return '12 AM';
    if (h < 12) return `${h} AM`;
    if (h === 12) return '12 PM';
    return `${h - 12} PM`;
  }

  let nowMinute = $state(getCurrentMinute());

  function getCurrentMinute(): number {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }

  let isToday = $derived(dateStr === new Date().toISOString().slice(0, 10));

  onMount(() => {
    const timer = setInterval(() => {
      nowMinute = getCurrentMinute();
    }, 60_000);
    return () => clearInterval(timer);
  });

  function handleSlotClick(hour: number) {
    onCreateEvent?.({ date: dateStr, startMinute: hour * 60 });
  }
</script>

<div class="day-container">
  <div class="day-body">
    <div class="time-gutter">
      {#each HOURS as hour (hour)}
        <div class="hour-label">{formatHour(hour)}</div>
      {/each}
    </div>

    <div class="day-column">
      {#each HOURS as hour (hour)}
        <button
          class="hour-slot"
          onclick={() => handleSlotClick(hour)}
          aria-label={formatHour(hour)}
        ></button>
      {/each}

      {#if isToday}
        <div class="now-indicator" style="top: {(nowMinute / 60) * 48}px" aria-hidden="true"></div>
      {/if}

      {#each dayEvents as event (event.id)}
        {@const top = event.startMinute != null ? (event.startMinute / 60) * 48 : 0}
        {@const rawH =
          event.durationMinutes != null ? Math.max((event.durationMinutes / 60) * 48, 20) : 24}
        {@const height = Math.min(rawH, 24 * 48 - top)}
        {@const hasBlurb = getCalendar().showNoteBlurbs && !!event.description && height >= 36}
        <div
          class="event-chip"
          class:completed={event.completed}
          class:has-blurb={hasBlurb}
          style="top: {top}px; height: {height}px; {event.color
            ? `border-left-color: ${event.color}`
            : ''}"
          title="{event.title}{event.description ? ` — ${event.description}` : ''}"
          role="button"
          tabindex="0"
          onclick={(e) => {
            e.stopPropagation();
            onEventClick?.(event.id);
          }}
          onkeydown={(e) => {
            if (e.key === 'Enter') onEventClick?.(event.id);
          }}
        >
          <button
            class="event-check"
            onclick={(e) => {
              e.stopPropagation();
              toggleEventComplete(event.id);
            }}
            aria-label={event.completed ? 'Mark incomplete' : 'Mark complete'}
          >
            <span class="check-box" class:checked={event.completed}></span>
          </button>
          <div class="event-text">
            <span class="event-title">{event.title}</span>
            {#if hasBlurb}
              <span class="event-blurb">{event.description}</span>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .day-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }
  .day-body {
    display: grid;
    grid-template-columns: 56px 1fr;
    overflow-y: auto;
    flex: 1;
  }
  .time-gutter {
    border-right: 1px solid var(--color-border);
  }
  .hour-label {
    height: 48px;
    display: flex;
    align-items: flex-start;
    justify-content: flex-end;
    padding: 2px 6px 0 0;
    font-size: 0.6rem;
    color: var(--color-text-subtle);
    border-bottom: 1px solid var(--color-border);
  }
  .day-column {
    position: relative;
  }
  .hour-slot {
    display: block;
    width: 100%;
    height: 48px;
    border: none;
    border-bottom: 1px solid var(--color-border);
    background: transparent;
    cursor: pointer;
    padding: 0;
  }
  .hour-slot:hover {
    background: var(--color-surface-hover);
  }
  .event-chip {
    position: absolute;
    left: 4px;
    right: 4px;
    border-radius: var(--radius-s);
    background: oklch(from var(--color-primary) l c h / 0.2);
    border-left: 3px solid var(--color-primary);
    padding: 4px 6px;
    font-size: 0.7rem;
    overflow: hidden;
    display: flex;
    align-items: flex-start;
    gap: 4px;
    z-index: var(--z-raised);
    cursor: pointer;
  }
  .event-chip:hover {
    background: oklch(from var(--color-primary) l c h / 0.3);
  }
  .event-chip.completed {
    opacity: 0.5;
    text-decoration: line-through;
  }
  .event-check {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    flex-shrink: 0;
    line-height: 1;
    display: flex;
    align-items: center;
  }
  .check-box {
    width: 12px;
    height: 12px;
    border: 1.5px solid var(--color-border);
    border-radius: 2px;
    display: inline-block;
    transition: all var(--transition-base);
  }
  .check-box.checked {
    background: var(--color-accent);
    border-color: var(--color-accent);
  }
  .event-check:hover .check-box {
    border-color: var(--color-accent);
  }
  .event-text {
    overflow: hidden;
    min-width: 0;
    flex: 1;
  }
  .event-chip.has-blurb {
    flex-direction: row;
    align-items: flex-start;
  }
  .event-chip.has-blurb .event-text {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .event-title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--color-text);
    display: block;
  }
  .event-blurb {
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 0.6rem;
    color: var(--color-text-muted);
    line-height: 1.2;
  }
  .now-indicator {
    position: absolute;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--color-error);
    z-index: calc(var(--z-raised) + 1);
    pointer-events: none;
  }
  .now-indicator::before {
    content: '';
    position: absolute;
    left: -4px;
    top: -3px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-error);
  }
</style>
