<script lang="ts">
  import { invoke } from '@tauri-apps/api/core';
  import Icon from '@/components/icons/Icon.svelte';
  import { currentVault } from '@/stores/vault/vault';
  import { selectNote } from '@/stores/navigator/navigator';
  import type { Note } from '@/types/vault';

  let currentDate = new Date();
  let selectedDate: Date | null = null;

  $: year = currentDate.getFullYear();
  $: month = currentDate.getMonth();
  $: monthName = currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' });

  $: calendarDays = generateCalendarDays(year, month);

  interface CalendarDay {
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
    hasNote: boolean;
  }

  function generateCalendarDays(year: number, month: number): CalendarDay[] {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const prevMonthLastDay = new Date(year, month, 0);

    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    const daysInPrevMonth = prevMonthLastDay.getDate();

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Previous month days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, daysInPrevMonth - i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        isSelected: selectedDate?.toDateString() === date.toDateString(),
        hasNote: false,
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.toDateString() === today.toDateString(),
        isSelected: selectedDate?.toDateString() === date.toDateString(),
        hasNote: false,
      });
    }

    // Next month days to fill the grid
    const remainingDays = 42 - days.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        isSelected: selectedDate?.toDateString() === date.toDateString(),
        hasNote: false,
      });
    }

    return days;
  }

  function previousMonth() {
    currentDate = new Date(year, month - 1, 1);
  }

  function nextMonth() {
    currentDate = new Date(year, month + 1, 1);
  }

  function goToToday() {
    currentDate = new Date();
    selectedDate = new Date();
  }

  async function handleDayClick(day: CalendarDay) {
    if (!$currentVault) return;

    selectedDate = day.date;

    // Format date as YYYY-MM-DD for daily note
    const dateStr = day.date.toISOString().split('T')[0];
    const dailyNotePath = `${$currentVault.root_path}/Daily Notes/${dateStr}.md`;

    try {
      // Try to open existing daily note
      const note = await invoke<Note>('read_note', { path: dailyNotePath });
      selectNote(note);
    } catch (error) {
      // Note doesn't exist, create it
      try {
        const template = `# ${day.date.toLocaleDateString('default', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}\n\n## Notes\n\n## Tasks\n- [ ] \n\n## Journal\n\n`;

        await invoke('write_note', {
          path: dailyNotePath,
          content: template,
        });

        const note = await invoke<Note>('read_note', { path: dailyNotePath });
        selectNote(note);
      } catch (createError) {
        console.error('Failed to create daily note:', createError);
      }
    }
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
</script>

<div class="calendar-panel">
  <div class="calendar-header">
    <button class="nav-btn" on:click={previousMonth} aria-label="Previous month">
      <Icon name="chevron-left" size={16} />
    </button>

    <h3 class="month-title">{monthName}</h3>

    <button class="nav-btn" on:click={nextMonth} aria-label="Next month">
      <Icon name="chevron-right" size={16} />
    </button>
  </div>

  <button class="today-btn" on:click={goToToday}> Today </button>

  <div class="calendar-grid">
    <div class="weekday-header">
      {#each weekDays as day}
        <div class="weekday">{day}</div>
      {/each}
    </div>

    <div class="days-grid">
      {#each calendarDays as day}
        <button
          class="day-cell"
          class:current-month={day.isCurrentMonth}
          class:today={day.isToday}
          class:selected={day.isSelected}
          class:has-note={day.hasNote}
          on:click={() => handleDayClick(day)}
          aria-label={day.date.toLocaleDateString()}
        >
          <span class="day-number">{day.date.getDate()}</span>
          {#if day.hasNote}
            <span class="note-indicator"></span>
          {/if}
        </button>
      {/each}
    </div>
  </div>
</div>

<style>
  .calendar-panel {
    padding: 1rem;
  }

  .calendar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75rem;
  }

  .nav-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    padding: 0;
    background: none;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    color: var(--text-muted);
    transition: all 0.15s ease;
  }

  .nav-btn:hover {
    background-color: var(--background-modifier-hover);
    color: var(--text-primary);
  }

  .month-title {
    font-size: var(--font-size-md);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    margin: 0;
  }

  .today-btn {
    width: 100%;
    padding: 0.5rem;
    margin-bottom: 0.75rem;
    background-color: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 0.375rem;
    color: var(--text-primary);
    font-size: var(--font-size-sm);
    font-weight: var(--font-medium);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .today-btn:hover {
    background-color: var(--background-modifier-hover);
    border-color: var(--interactive-accent);
  }

  .calendar-grid {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .weekday-header {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 0.25rem;
    margin-bottom: 0.25rem;
  }

  .weekday {
    text-align: center;
    font-size: var(--font-size-xs);
    font-weight: var(--font-semibold);
    color: var(--text-muted);
    padding: 0.25rem;
  }

  .days-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 0.25rem;
  }

  .day-cell {
    position: relative;
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.25rem;
    background: none;
    border: 1px solid transparent;
    border-radius: 0.375rem;
    cursor: pointer;
    color: var(--text-muted);
    font-size: var(--font-size-sm);
    transition: all 0.15s ease;
  }

  .day-cell.current-month {
    color: var(--text-primary);
  }

  .day-cell:hover {
    background-color: var(--background-modifier-hover);
    border-color: var(--background-modifier-border);
  }

  .day-cell.today {
    background-color: var(--interactive-accent);
    color: var(--text-on-accent);
    font-weight: var(--font-semibold);
  }

  .day-cell.selected {
    border-color: var(--interactive-accent);
    background-color: var(--background-modifier-active-hover);
  }

  .day-cell.has-note::after {
    content: '';
    position: absolute;
    bottom: 0.25rem;
    width: 0.25rem;
    height: 0.25rem;
    background-color: var(--interactive-accent);
    border-radius: 50%;
  }

  .day-number {
    position: relative;
    z-index: 1;
  }

  .note-indicator {
    position: absolute;
    bottom: 0.25rem;
    width: 0.25rem;
    height: 0.25rem;
    background-color: currentColor;
    border-radius: 50%;
  }
</style>
