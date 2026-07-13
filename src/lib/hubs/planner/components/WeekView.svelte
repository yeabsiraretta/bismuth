<script lang="ts">
  import { getWeekColumns, toggleEventComplete } from '@/hubs/planner/stores/calendar-store.svelte';
  import { onMount } from 'svelte';

  let {
    onCreateEvent = undefined,
    onEventClick = undefined,
  }: {
    onCreateEvent?: ((detail: { date: string; startMinute: number | null }) => void) | undefined;
    onEventClick?: ((eventId: string) => void) | undefined;
  } = $props();

  const HOURS = Array.from({ length: 24 }, (_, i) => i);

  let columns = $derived(getWeekColumns());
  let nowMinute = $state(getCurrentMinute());

  function getCurrentMinute(): number {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }

  onMount(() => {
    const timer = setInterval(() => {
      nowMinute = getCurrentMinute();
    }, 60_000);
    return () => clearInterval(timer);
  });

  function formatHour(h: number): string {
    if (h === 0) return '12 AM';
    if (h < 12) return `${h} AM`;
    if (h === 12) return '12 PM';
    return `${h - 12} PM`;
  }

  function handleSlotClick(date: string, hour: number) {
    onCreateEvent?.({ date, startMinute: hour * 60 });
  }
</script>

<div class="week-container">
  <div class="week-scroll">
    <div class="week-header">
      <div class="time-gutter-header"></div>
      {#each columns as col (col.date)}
        <div class="col-header" class:today={col.isToday}>
          <span class="day-name">{col.dayName}</span>
          <span class="day-number" class:today-number={col.isToday}>{col.dayNumber}</span>
        </div>
      {/each}
    </div>

    <div class="week-body">
      <div class="time-gutter">
        {#each HOURS as hour (hour)}
          <div class="hour-label">{formatHour(hour)}</div>
        {/each}
      </div>

      {#each columns as col (col.date)}
        <div class="day-column" class:today-col={col.isToday}>
          {#each HOURS as hour (hour)}
            <button
              class="hour-slot"
              onclick={() => handleSlotClick(col.date, hour)}
              aria-label="{col.dayName} {formatHour(hour)}"
            ></button>
          {/each}

          {#if col.isToday}
            <div
              class="now-indicator"
              style="top: {(nowMinute / 60) * 48}px"
              aria-hidden="true"
            ></div>
          {/if}

          {#each col.events as event (event.id)}
            {@const top = event.startMinute != null ? (event.startMinute / 60) * 48 : 0}
            {@const rawH =
              event.durationMinutes != null ? Math.max((event.durationMinutes / 60) * 48, 20) : 24}
            {@const height = Math.min(rawH, 24 * 48 - top)}
            <div
              class="event-chip"
              class:completed={event.completed}
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
              <span class="event-title">{event.title}</span>
            </div>
          {/each}
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .week-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }
  .week-scroll {
    flex: 1;
    overflow-y: auto;
  }
  .week-header {
    display: grid;
    grid-template-columns: 56px repeat(7, 1fr);
    border-bottom: 1px solid var(--color-border);
    position: sticky;
    top: 0;
    z-index: var(--z-raised);
    background: var(--color-surface);
  }
  .time-gutter-header {
    border-right: 1px solid var(--color-border);
  }
  .col-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 0;
    border-right: 1px solid var(--color-border);
    font-size: 0.75rem;
  }
  .col-header.today {
    background: oklch(from var(--color-accent) l c h / 0.1);
  }
  .day-name {
    color: var(--color-text-subtle);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-size: 0.65rem;
  }
  .day-number {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--color-text);
    line-height: 1.2;
  }
  .today-number {
    background: var(--color-accent);
    color: var(--color-background);
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .week-body {
    display: grid;
    grid-template-columns: 56px repeat(7, 1fr);
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
    border-right: 1px solid var(--color-border);
  }
  .today-col {
    background: oklch(from var(--color-accent) l c h / 0.04);
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
    left: 2px;
    right: 2px;
    border-radius: var(--radius-s);
    background: oklch(from var(--color-primary) l c h / 0.2);
    border-left: 3px solid var(--color-primary);
    padding: 2px 4px;
    font-size: 0.65rem;
    overflow: hidden;
    display: flex;
    align-items: flex-start;
    gap: 3px;
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
  .event-title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--color-text);
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
