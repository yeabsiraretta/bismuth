<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import PanelHeader from '@/components/ui/layout/PanelHeader.svelte';
  import ActionButton from '@/components/ui/actions/ActionButton.svelte';
  import {
    periodicNotesInRange,
    fetchNotesForMonth,
    activeJournal,
    activeJournalDate,
    createJournalNote,
  } from '@/features/periodic';
  import { allCalendarItems } from '../../stores/calendarStore';
  import { openNote } from '@/appNavigation';
  import { log } from '@/utils/logger';

  export let onDaySelect: ((date: string) => void) | undefined = undefined;

  let currentDate = new Date();
  let selectedDate: string | null = null;

  $: year = currentDate.getFullYear();
  $: month = currentDate.getMonth();
  $: monthName = currentDate.toLocaleString('default', { month: 'long' });
  $: daysInMonth = new Date(year, month + 1, 0).getDate();
  $: firstDayOfWeek = new Date(year, month, 1).getDay();
  $: today = formatDate(new Date());

  $: calendarDays = buildCalendar(year, month, daysInMonth, firstDayOfWeek);

  // Fetch periodic notes whenever the displayed month changes
  $: fetchNotesForMonth(year, month + 1);

  // Build a Set of dates that have a daily note for O(1) lookup
  // periodicNotesInRange contains path strings like 'Periodic Notes/daily/2024-01-15.md'
  $: dailyNoteDates = new Set(
    $periodicNotesInRange
      .map((p) => p.replace(/^.*\//, '').replace(/\.md$/, ''))
      .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
  );

  $: eventCounts = (() => {
    const counts = new Map<string, number>();
    for (const item of $allCalendarItems) counts.set(item.date, (counts.get(item.date) ?? 0) + 1);
    return counts;
  })();

  function intensityClass(date: string | null): string {
    if (!date) return '';
    const c = eventCounts.get(date) ?? 0;
    if (c === 0) return '';
    if (c <= 2) return 'intensity-1';
    if (c <= 5) return 'intensity-2';
    return 'intensity-3';
  }

  const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  function buildCalendar(
    y: number,
    m: number,
    days: number,
    offset: number
  ): Array<{ day: number | null; date: string | null }> {
    const cells: Array<{ day: number | null; date: string | null }> = [];

    for (let i = 0; i < offset; i++) {
      cells.push({ day: null, date: null });
    }

    for (let d = 1; d <= days; d++) {
      cells.push({ day: d, date: formatDate(new Date(y, m, d)) });
    }

    return cells;
  }

  function formatDate(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  function prevMonth() {
    currentDate = new Date(year, month - 1, 1);
  }

  function nextMonth() {
    currentDate = new Date(year, month + 1, 1);
  }

  function goToToday() {
    currentDate = new Date();
    selectedDate = today;
    onDaySelect?.(today);
  }

  async function selectDay(dateStr: string | null) {
    if (!dateStr) return;
    selectedDate = dateStr;
    onDaySelect?.(dateStr);

    const [y, m, d] = dateStr.split('-').map(Number);
    const clickedDate = new Date(y, m - 1, d);
    activeJournalDate.set(clickedDate);

    const journal = $activeJournal;
    if (!journal) return;

    try {
      const result = await createJournalNote(clickedDate, journal);
      await openNote(result.path);
    } catch (error) {
      log.error('CalendarPanel: failed to open journal note', error as Error, { date: dateStr });
    }
  }
</script>

<div class="calendar-panel">
  <PanelHeader icon="calendar" title="Calendar">
    <svelte:fragment slot="actions">
      <ActionButton icon="calendar" title="Go to today" on:click={goToToday} />
    </svelte:fragment>
  </PanelHeader>

  <div class="panel-body">
    <div class="calendar-header">
      <button
        class="nav-btn"
        on:click={prevMonth}
        title="Previous month"
        aria-label="Previous month"
      >
        <Icon name="chevron-left" size={14} />
      </button>
      <button class="month-label" on:click={goToToday} title="Go to today">
        {monthName}
        {year}
      </button>
      <button class="nav-btn" on:click={nextMonth} title="Next month" aria-label="Next month">
        <Icon name="chevron-right" size={14} />
      </button>
    </div>

    <div class="calendar-grid">
      {#each weekdays as day}
        <div class="weekday-header">{day}</div>
      {/each}

      {#each calendarDays as cell}
        {#if cell.day === null}
          <div class="day-cell empty"></div>
        {:else}
          <button
            class="day-cell {intensityClass(cell.date)}"
            class:today={cell.date === today}
            class:selected={cell.date === selectedDate}
            on:click={() => selectDay(cell.date)}
            title="{cell.date}{eventCounts.get(cell.date ?? '')
              ? ` (${eventCounts.get(cell.date ?? '')} events)`
              : ''}"
            aria-label={cell.date}
          >
            {cell.day}
            <span class="dot-row">
              {#if cell.date && dailyNoteDates.has(cell.date)}
                <span class="note-dot" aria-hidden="true"></span>
              {/if}
              {#if cell.date && (eventCounts.get(cell.date) ?? 0) > 0}
                <span class="event-dot" aria-hidden="true"></span>
              {/if}
            </span>
          </button>
        {/if}
      {/each}
    </div>

    <div class="calendar-footer">
      <button class="today-btn" on:click={goToToday} title="Jump to today">
        <Icon name="calendar" size={12} />
        Today
      </button>
    </div>
  </div>
</div>

<style>
  .calendar-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    user-select: none;
  }

  .panel-body {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
  }

  .calendar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .nav-btn {
    background: none;
    border: none;
    padding: 4px;
    border-radius: 4px;
    cursor: pointer;
    color: var(--text-muted, #a6adc8);
    display: flex;
    align-items: center;
  }
  .nav-btn:hover {
    background: var(--bg-hover, #313244);
    color: var(--text-primary, #cdd6f4);
  }

  .month-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-primary, #cdd6f4);
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
  }
  .month-label:hover {
    background: var(--bg-hover, #313244);
  }

  .calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
  }
  .weekday-header {
    text-align: center;
    font-size: 0.65rem;
    color: var(--text-faint, #585b70);
    padding: 4px 0;
    font-weight: 500;
  }

  .day-cell {
    text-align: center;
    padding: 4px 0;
    font-size: 0.75rem;
    border-radius: 4px;
    cursor: pointer;
    border: none;
    background: none;
    color: var(--text-primary, #cdd6f4);
    aspect-ratio: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
  }

  .dot-row {
    display: flex;
    gap: 2px;
    justify-content: center;
    min-height: 4px;
  }
  .note-dot,
  .event-dot {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .note-dot {
    background: var(--interactive-accent, #89b4fa);
  }
  .event-dot {
    background: var(--color-warning, #d97706);
  }
  .day-cell.selected .note-dot,
  .day-cell.selected .event-dot {
    background: var(--bg-primary, #1e1e2e);
  }
  .day-cell.intensity-1 {
    background: color-mix(in srgb, var(--color-success, #49af5d) 8%, transparent);
  }
  .day-cell.intensity-2 {
    background: color-mix(in srgb, var(--color-success, #49af5d) 16%, transparent);
  }
  .day-cell.intensity-3 {
    background: color-mix(in srgb, var(--color-success, #49af5d) 25%, transparent);
  }
  .day-cell.empty {
    cursor: default;
  }

  .day-cell:not(.empty):hover {
    background: var(--bg-hover, #313244);
  }

  .day-cell.today {
    font-weight: 700;
    color: var(--interactive-accent, #89b4fa);
    border: 1px solid var(--interactive-accent, #89b4fa);
  }

  .day-cell.selected {
    background: var(--interactive-accent, #89b4fa);
    color: var(--bg-primary, #1e1e2e);
    font-weight: 600;
  }

  .calendar-footer {
    margin-top: 8px;
    display: flex;
    justify-content: center;
  }
  .today-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.7rem;
    padding: 4px 10px;
    border-radius: 4px;
    border: none;
    background: var(--bg-tertiary, #45475a);
    color: var(--text-muted, #a6adc8);
    cursor: pointer;
  }
  .today-btn:hover {
    background: var(--bg-hover, #313244);
    color: var(--text-primary, #cdd6f4);
  }
</style>
