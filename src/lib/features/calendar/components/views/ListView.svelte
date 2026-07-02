<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import EventChip from '../atoms/EventChip.svelte';
  import { allCalendarItems, calendarFocusDate } from '../../stores/calendarStore';
  import { selectedEventIds, toggleEventSelection, selectionMode } from '../../stores/batchOps';

  $: events = getUpcomingEvents($allCalendarItems, $calendarFocusDate);

  interface DayGroup {
    date: string;
    label: string;
    dayName: string;
    isToday: boolean;
    events: typeof $allCalendarItems;
  }

  function getUpcomingEvents(items: typeof $allCalendarItems, focus: Date): DayGroup[] {
    const today = formatDate(new Date());
    const startDate = formatDate(focus);

    // Show 14 days from focus date
    const dates: string[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(focus);
      d.setDate(d.getDate() + i);
      dates.push(formatDate(d));
    }

    const groups: DayGroup[] = [];
    for (const date of dates) {
      const dayEvents = items
        .filter((e) => e.date === date)
        .sort((a, b) => (a.startMinute ?? 0) - (b.startMinute ?? 0));

      if (dayEvents.length === 0) continue;

      const d = new Date(date + 'T12:00:00');
      groups.push({
        date,
        label: d.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' }),
        dayName: d.toLocaleDateString('default', { weekday: 'long' }),
        isToday: date === today,
        events: dayEvents,
      });
    }
    return groups;
  }

  function formatDate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function formatTime(minutes: number | null): string {
    if (minutes === null) return 'All day';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
  }
</script>

<div class="list-view">
  {#if events.length === 0}
    <div class="list-empty">
      <Icon name="calendar" size={32} />
      <p>No upcoming events</p>
    </div>
  {:else}
    {#each events as group}
      <div class="day-group" class:is-today={group.isToday}>
        <div class="day-header">
          <span class="day-name">{group.dayName}</span>
          <span class="day-date">{group.label}</span>
          {#if group.isToday}
            <span class="today-badge">Today</span>
          {/if}
        </div>
        <div class="day-events">
          {#each group.events as event}
            <button
              class="list-event"
              class:selected={$selectedEventIds.has(event.id)}
              class:completed={event.completed}
              on:click={() => ($selectionMode ? toggleEventSelection(event.id) : null)}
            >
              <span class="event-time">{formatTime(event.startMinute)}</span>
              <span
                class="event-dot"
                style="background: {event.color ?? 'var(--interactive-accent)'}"
              ></span>
              <span class="event-title">{event.title}</span>
              {#if event.durationMinutes}
                <span class="event-duration">{event.durationMinutes}m</span>
              {/if}
              {#if event.type !== 'event'}
                <span class="event-type-badge">{event.type}</span>
              {/if}
            </button>
          {/each}
        </div>
      </div>
    {/each}
  {/if}
</div>

<style>
  .list-view {
    padding: var(--spacing-sm);
    overflow-y: auto;
    height: 100%;
  }

  .list-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-xl);
    color: var(--text-muted);
  }

  .day-group {
    margin-bottom: var(--spacing-md);
  }
  .day-group.is-today .day-header {
    color: var(--interactive-accent);
  }

  .day-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) 0;
    border-bottom: 1px solid var(--background-modifier-border);
    margin-bottom: var(--spacing-xs);
  }

  .day-name {
    font-weight: 600;
    font-size: var(--font-ui-small);
  }
  .day-date {
    font-size: var(--font-smallest);
    color: var(--text-muted);
  }

  .today-badge {
    font-size: 9px;
    padding: 1px 6px;
    border-radius: 8px;
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .day-events {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .list-event {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-s);
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    width: 100%;
    font: inherit;
    color: var(--text-normal);
  }

  .list-event:hover {
    background: var(--background-modifier-hover);
  }
  .list-event.selected {
    background: var(--interactive-accent-hover);
    outline: 1px solid var(--interactive-accent);
  }
  .list-event.completed .event-title {
    text-decoration: line-through;
    color: var(--text-muted);
  }

  .event-time {
    font-size: var(--font-smallest);
    color: var(--text-muted);
    min-width: 65px;
    flex-shrink: 0;
  }

  .event-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .event-title {
    flex: 1;
    font-size: var(--font-ui-small);
  }

  .event-duration {
    font-size: var(--font-smallest);
    color: var(--text-faint);
  }

  .event-type-badge {
    font-size: 9px;
    padding: 0 4px;
    border-radius: 4px;
    background: var(--background-secondary);
    color: var(--text-faint);
    text-transform: uppercase;
  }
</style>
