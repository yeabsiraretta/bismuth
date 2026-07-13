<script lang="ts">
  import {
    deleteEvent,
    getUpcomingEvents,
    toggleEventComplete,
  } from '@/hubs/planner/stores/calendar-store.svelte';

  let {
    onEventClick = undefined,
  }: {
    onEventClick?: ((eventId: string) => void) | undefined;
  } = $props();

  let events = $derived(getUpcomingEvents(50));

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  function formatTime(startMinute: number | null): string {
    if (startMinute == null) return '';
    const h = Math.floor(startMinute / 60);
    const m = startMinute % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hh = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${hh}:${String(m).padStart(2, '0')} ${ampm}`;
  }

  let grouped = $derived(groupByDate(events));

  function groupByDate(
    list: typeof events
  ): { date: string; label: string; items: typeof events }[] {
    const map: Record<string, typeof events> = {};
    for (const e of list) {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    }
    return Object.entries(map).map(([date, items]) => ({
      date,
      label: formatDate(date),
      items,
    }));
  }
</script>

<div class="list-view">
  {#if events.length === 0}
    <div class="list-empty">
      <p>No upcoming events</p>
      <p class="list-hint">Create an event to see it here</p>
    </div>
  {:else}
    {#each grouped as group (group.date)}
      <div class="list-group">
        <h3 class="list-date">{group.label}</h3>
        <ul class="list-items">
          {#each group.items as event (event.id)}
            <li class="list-item" class:completed={event.completed}>
              <button
                class="list-check"
                onclick={(e) => {
                  e.stopPropagation();
                  toggleEventComplete(event.id);
                }}
                aria-label={event.completed ? 'Mark incomplete' : 'Mark complete'}
              >
                <span class="check-box" class:checked={event.completed}></span>
              </button>
              <button class="list-content" onclick={() => onEventClick?.(event.id)}>
                <span class="list-title">{event.title}</span>
                {#if event.startMinute != null}
                  <span class="list-time">{formatTime(event.startMinute)}</span>
                {/if}
                {#if event.description}
                  <span class="list-desc">{event.description}</span>
                {/if}
              </button>
              <span class="list-type">{event.type}</span>
              <button
                class="list-delete"
                onclick={() => deleteEvent(event.id)}
                aria-label="Delete event"
              >
                ×
              </button>
            </li>
          {/each}
        </ul>
      </div>
    {/each}
  {/if}
</div>

<style>
  .list-view {
    padding: 12px 16px;
    overflow-y: auto;
    height: 100%;
  }
  .list-empty {
    padding: 48px 16px;
    text-align: center;
    color: var(--color-text-muted);
    font-size: 0.85rem;
  }
  .list-hint {
    font-size: 0.7rem;
    color: var(--color-text-subtle);
    margin-top: 4px;
  }
  .list-group {
    margin-bottom: 16px;
  }
  .list-date {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--color-text-muted);
    margin: 0 0 6px;
    padding-bottom: 4px;
    border-bottom: 1px solid var(--color-border);
  }
  .list-items {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .list-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    border-radius: var(--radius-s);
  }
  .list-item:hover {
    background: var(--color-surface-hover);
  }
  .list-item.completed {
    opacity: 0.5;
  }
  .list-item.completed .list-title {
    text-decoration: line-through;
  }
  .list-check {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    flex-shrink: 0;
    width: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
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
  .list-check:hover .check-box {
    border-color: var(--color-accent);
  }
  .list-content {
    flex: 1;
    display: flex;
    align-items: baseline;
    gap: 8px;
    min-width: 0;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    text-align: left;
  }
  .list-content:hover .list-title {
    color: var(--color-accent);
  }
  .list-title {
    font-size: 0.8rem;
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .list-time {
    font-size: 0.65rem;
    color: var(--color-text-subtle);
    flex-shrink: 0;
  }
  .list-desc {
    font-size: 0.65rem;
    color: var(--color-text-subtle);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .list-type {
    font-size: 0.55rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-subtle);
    background: var(--color-surface);
    padding: 1px 5px;
    border-radius: var(--radius-s);
    flex-shrink: 0;
  }
  .list-delete {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    font-size: 0.9rem;
    color: var(--color-text-subtle);
    opacity: 0;
    flex-shrink: 0;
  }
  .list-item:hover .list-delete {
    opacity: 1;
  }
  .list-delete:hover {
    color: var(--color-error);
  }
</style>
