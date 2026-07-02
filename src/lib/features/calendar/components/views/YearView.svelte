<script lang="ts">
  import {
    calendarFocusDate,
    calendarViewMode,
    allCalendarItems,
  } from '../../stores/calendarStore';

  $: year = $calendarFocusDate.getFullYear();
  $: monthGrids = buildYearGrid(year, $allCalendarItems);

  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  interface MiniCell {
    day: number | null;
    date: string;
    hasEvents: boolean;
    isToday: boolean;
  }

  function formatDateStr(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function buildYearGrid(
    y: number,
    items: { date: string }[]
  ): { name: string; month: number; cells: MiniCell[] }[] {
    const today = formatDateStr(new Date());
    const eventDates = new Set(items.map((e) => e.date));

    return Array.from({ length: 12 }, (_, m) => {
      const daysInMonth = new Date(y, m + 1, 0).getDate();
      const firstDayOffset = new Date(y, m, 1).getDay();
      const cells: MiniCell[] = [];

      for (let i = 0; i < firstDayOffset; i++) {
        cells.push({ day: null, date: '', hasEvents: false, isToday: false });
      }
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = formatDateStr(new Date(y, m, d));
        cells.push({
          day: d,
          date: dateStr,
          hasEvents: eventDates.has(dateStr),
          isToday: dateStr === today,
        });
      }
      return { name: monthNames[m], month: m, cells };
    });
  }

  function navigateToMonth(month: number) {
    $calendarFocusDate = new Date(year, month, 1);
    $calendarViewMode = 'month';
  }
</script>

<div class="year-view">
  <div class="year-grid">
    {#each monthGrids as mg}
      <button class="mini-month" on:click={() => navigateToMonth(mg.month)}>
        <h4 class="mini-month-name">{mg.name}</h4>
        <div class="mini-weekdays">
          {#each weekdays as wd}
            <span class="mini-wd">{wd}</span>
          {/each}
        </div>
        <div class="mini-days">
          {#each mg.cells as cell}
            {#if cell.day === null}
              <span class="mini-day empty"></span>
            {:else}
              <span class="mini-day" class:today={cell.isToday} class:has-event={cell.hasEvents}
                >{cell.day}</span
              >
            {/if}
          {/each}
        </div>
      </button>
    {/each}
  </div>
</div>

<style>
  .year-view {
    height: 100%;
    overflow-y: auto;
    padding: 20px;
  }

  .year-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .mini-month {
    background: var(--background-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-m);
    padding: 12px;
    cursor: pointer;
    transition: border-color 0.15s;
    text-align: left;
  }

  .mini-month:hover {
    border-color: var(--interactive-accent);
  }

  .mini-month-name {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-normal);
    margin: 0 0 8px 0;
  }

  .mini-weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 1px;
    margin-bottom: 4px;
  }

  .mini-wd {
    text-align: center;
    font-size: 0.55rem;
    color: var(--text-faint);
    font-weight: 500;
  }

  .mini-days {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 1px;
  }

  .mini-day {
    text-align: center;
    font-size: 0.6rem;
    color: var(--text-muted);
    padding: 2px 0;
    border-radius: 2px;
  }

  .mini-day.empty {
    visibility: hidden;
  }

  .mini-day.today {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    font-weight: 600;
    border-radius: 50%;
  }

  .mini-day.has-event {
    font-weight: 600;
    color: var(--text-normal);
  }

  .mini-day.has-event::after {
    content: '';
    display: block;
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: var(--interactive-accent);
    margin: 0 auto;
  }

  @media (max-width: 800px) {
    .year-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }
</style>
