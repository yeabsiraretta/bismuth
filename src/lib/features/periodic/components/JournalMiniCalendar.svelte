<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { periodicNotesInRange, fetchNotesForMonth } from '../stores/periodic';

  export let date: Date = new Date();
  export let onDayClick: ((date: string) => void) | undefined = undefined;

  let viewDate: Date = new Date(date);

  $: viewDate = new Date(date);
  $: year = viewDate.getFullYear();
  $: month = viewDate.getMonth();
  $: monthName = viewDate.toLocaleString('default', { month: 'long' });
  $: daysInMonth = new Date(year, month + 1, 0).getDate();
  $: firstDayOfWeek = new Date(year, month, 1).getDay();
  $: today = fmtDate(new Date());
  $: selected = fmtDate(date);

  $: cells = buildCalendar(year, month, daysInMonth, firstDayOfWeek);
  $: fetchNotesForMonth(year, month + 1);

  $: noteDates = new Set(
    $periodicNotesInRange
      .map((p) => p.replace(/^.*\//, '').replace(/\.md$/, ''))
      .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
  );

  const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  function fmtDate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function buildCalendar(y: number, m: number, days: number, offset: number) {
    const cells: Array<{ day: number | null; date: string | null }> = [];
    for (let i = 0; i < offset; i++) cells.push({ day: null, date: null });
    for (let d = 1; d <= days; d++) cells.push({ day: d, date: fmtDate(new Date(y, m, d)) });
    return cells;
  }

  function prevMonth() {
    viewDate = new Date(year, month - 1, 1);
  }
  function nextMonth() {
    viewDate = new Date(year, month + 1, 1);
  }

  function selectDay(d: string | null) {
    if (d) onDayClick?.(d);
  }
</script>

<div class="mini-cal">
  <div class="cal-header">
    <button class="cal-nav" on:click={prevMonth} aria-label="Previous month">
      <Icon name="chevron-left" size={12} />
    </button>
    <span class="cal-month">{monthName} {year}</span>
    <button class="cal-nav" on:click={nextMonth} aria-label="Next month">
      <Icon name="chevron-right" size={12} />
    </button>
  </div>

  <div class="cal-grid">
    {#each weekdays as wd}
      <div class="cal-wd">{wd}</div>
    {/each}

    {#each cells as cell}
      {#if cell.day === null}
        <div class="cal-cell empty"></div>
      {:else}
        <button
          class="cal-cell"
          class:today={cell.date === today}
          class:selected={cell.date === selected}
          on:click={() => selectDay(cell.date)}
          aria-label={cell.date ?? ''}
        >
          {cell.day}
          {#if cell.date && noteDates.has(cell.date)}
            <span class="cal-dot" aria-hidden="true"></span>
          {/if}
        </button>
      {/if}
    {/each}
  </div>
</div>

<style>
  .mini-cal {
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 8px;
  }

  .cal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  .cal-nav {
    background: none;
    border: none;
    padding: 2px;
    border-radius: 4px;
    cursor: pointer;
    color: var(--text-muted);
    display: flex;
    align-items: center;
  }
  .cal-nav:hover {
    background: var(--hover-bg);
    color: var(--text-primary);
  }
  .cal-month {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .cal-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 1px;
  }
  .cal-wd {
    text-align: center;
    font-size: 9px;
    color: var(--text-faint);
    padding: 2px 0;
    font-weight: 500;
  }

  .cal-cell {
    text-align: center;
    padding: 2px 0;
    font-size: 10px;
    border-radius: 4px;
    cursor: pointer;
    border: none;
    background: none;
    color: var(--text-primary);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1px;
    aspect-ratio: 1;
    position: relative;
  }
  .cal-cell.empty {
    cursor: default;
  }
  .cal-cell:not(.empty):hover {
    background: var(--hover-bg);
  }
  .cal-cell.today {
    font-weight: 700;
    color: var(--interactive-accent);
    border: 1px solid var(--interactive-accent);
  }
  .cal-cell.selected {
    background: var(--interactive-accent);
    color: var(--text-on-accent, #fff);
    font-weight: 600;
  }
  .cal-cell.selected .cal-dot {
    background: var(--text-on-accent, #fff);
  }

  .cal-dot {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: var(--interactive-accent);
    flex-shrink: 0;
  }
</style>
