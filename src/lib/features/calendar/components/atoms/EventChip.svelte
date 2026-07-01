<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { settings } from '@/features/settings';
  import type { CalendarEvent } from '../../types';

  export let event: CalendarEvent;
  export let compact: boolean = false;
  export let onToggle: (() => void) | undefined = undefined;

  function handleCheckbox(e: MouseEvent) {
    e.stopPropagation();
    onToggle?.();
  }

  $: isTask = event.type === 'task';
  $: isTimeBlock = event.type === 'time-block';
  $: showCheckbox = isTask || isTimeBlock;
  $: hasLinks = (event.linkedNotePaths?.length ?? 0) > 0;

  $: categoryColor = (() => {
    if (!event.categoryId) return null;
    const cat = $settings.calendarCategories.find((c) => c.id === event.categoryId);
    return cat?.color ?? null;
  })();

  $: chipStyle = categoryColor
    ? `background: ${categoryColor}22; border-left: 3px solid ${categoryColor};`
    : '';

  function formatTime(minutes: number | null): string {
    if (minutes === null) return '';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return m === 0 ? `${hour} ${period}` : `${hour}:${String(m).padStart(2, '0')} ${period}`;
  }
</script>

<div
  class="event-chip"
  class:compact
  class:completed={event.completed}
  class:task={isTask && !categoryColor}
  class:time-block={isTimeBlock && !categoryColor}
  style={chipStyle}
  title={event.title}
>
  {#if showCheckbox}
    <button
      class="chip-checkbox"
      on:click={handleCheckbox}
      aria-label={event.completed ? 'Mark incomplete' : 'Mark complete'}
    >
      <Icon name={event.completed ? 'check-square' : 'square'} size={compact ? 12 : 14} />
    </button>
  {/if}
  <span class="chip-title" class:line-through={event.completed}>{event.title}</span>
  {#if !compact && event.startMinute !== null}
    <span class="chip-time">{formatTime(event.startMinute)}</span>
  {/if}
  {#if hasLinks}
    <span
      class="link-badge"
      aria-label="{event.linkedNotePaths?.length} linked note{event.linkedNotePaths?.length === 1
        ? ''
        : 's'}"
    >
      <svg
        width="10"
        height="10"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
      >
        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
      </svg>
    </span>
  {/if}
</div>

<style>
  .event-chip {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 0.72rem;
    color: var(--text-normal);
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    min-height: 20px;
  }

  .event-chip.compact {
    font-size: 0.65rem;
    padding: 1px 4px;
    min-height: 16px;
  }

  .chip-checkbox {
    display: flex;
    align-items: center;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    color: var(--text-muted);
    flex-shrink: 0;
  }

  .chip-checkbox:hover {
    color: var(--interactive-accent);
  }

  .chip-title {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .chip-title.line-through {
    text-decoration: line-through;
    opacity: 0.6;
  }

  .chip-time {
    font-size: 0.6rem;
    color: var(--text-faint);
    flex-shrink: 0;
  }

  .link-badge {
    display: flex;
    align-items: center;
    color: var(--text-faint);
    flex-shrink: 0;
    opacity: 0.7;
  }

  .event-chip.task {
    border-left: 2px solid var(--color-task, #f9e2af);
  }

  .event-chip.time-block {
    border-left: 2px solid var(--color-timeblock, #89dceb);
    background: color-mix(in srgb, var(--color-timeblock, #89dceb) 8%, transparent);
  }
</style>
