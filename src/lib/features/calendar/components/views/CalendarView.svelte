<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import WeekView from './WeekView.svelte';
  import MonthView from './MonthView.svelte';
  import YearView from './YearView.svelte';
  import HeatmapCalendar from './HeatmapCalendar.svelte';
  import CalendarDayView from './CalendarDayView.svelte';
  import TimelineView from './TimelineView.svelte';
  import ListView from './ListView.svelte';
  import GanttView from './GanttView.svelte';
  import EventDialog from '../dialogs/EventDialog.svelte';
  import IcsSettings from '../dialogs/IcsSettings.svelte';
  import ActiveClocks from '../atoms/ActiveClocks.svelte';
  import {
    calendarViewMode,
    calendarFocusDate,
    plannerSettings,
    navigateCalendar,
    goToToday,
  } from '../../stores/calendarStore';
  import {
    selectionMode, selectedCount, clearSelection,
    batchDelete, batchComplete, batchDuplicate, batchShift,
    canUndo, canRedo, undo, redo,
  } from '../../stores/batchOps';
  import { todayCapacity, formatCapacityTime, utilizationColor } from '../../stores/capacityStore';
  import type { CalendarViewMode } from '../../types';

  let showEventDialog = false;
  let eventDialogDate: string | null = null;
  let eventDialogStartMinute: number | null = null;
  let showIcsSettings = false;

  $: showTimeline = $plannerSettings.showTimeline;

  const viewOptions: { id: CalendarViewMode; label: string }[] = [
    { id: 'day', label: 'Day' },
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
    { id: 'year', label: 'Year' },
    { id: 'list', label: 'List' },
    { id: 'heatmap', label: 'Heatmap' },
    { id: 'gantt', label: 'Gantt' },
  ];

  $: headerLabel = getHeaderLabel($calendarFocusDate, $calendarViewMode);

  function getHeaderLabel(date: Date, mode: CalendarViewMode): string {
    if (mode === 'year' || mode === 'heatmap' || mode === 'gantt') return date.getFullYear().toString();
    if (mode === 'list') return 'Upcoming Events';
    if (mode === 'month') {
      return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    }
    if (mode === 'day') {
      return date.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }
    // Week: show range
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const startStr = start.toLocaleDateString('default', { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startStr} – ${endStr}`;
  }

  function handleCreateEvent(date: string, startMinute: number | null = null) {
    eventDialogDate = date;
    eventDialogStartMinute = startMinute;
    showEventDialog = true;
  }

</script>

<div class="calendar-view">
  <!-- Toolbar -->
  <header class="calendar-toolbar">
    <div class="toolbar-left">
      <button class="btn-today" on:click={goToToday}>Today</button>
      <button class="btn-nav" on:click={() => navigateCalendar('prev')} title="Previous" aria-label="Previous">
        <Icon name="chevron-left" size={16} />
      </button>
      <button class="btn-nav" on:click={() => navigateCalendar('next')} title="Next" aria-label="Next">
        <Icon name="chevron-right" size={16} />
      </button>
      <h2 class="header-label">{headerLabel}</h2>
    </div>
    <div class="toolbar-right">
      <div class="view-switcher">
        {#each viewOptions as opt}
          <button
            class="view-btn"
            class:active={$calendarViewMode === opt.id}
            on:click={() => $calendarViewMode = opt.id}
          >
            {opt.label}
          </button>
        {/each}
      </div>
      <button
        class="btn-nav"
        class:active={showTimeline}
        on:click={() => plannerSettings.update(s => ({ ...s, showTimeline: !s.showTimeline }))}
        title="Toggle timeline"
        aria-label="Toggle timeline sidebar"
      >
        <Icon name="clock" size={16} />
      </button>
      <button class="btn-nav" on:click={() => (showIcsSettings = !showIcsSettings)} title="Calendar feeds" aria-label="Calendar feeds">
        <Icon name="globe" size={16} />
      </button>
      <button
        class="btn-nav"
        class:active={$selectionMode}
        on:click={() => selectionMode.update(v => !v)}
        title="Toggle selection mode"
        aria-label="Toggle batch selection"
      >
        <Icon name="check-square" size={16} />
      </button>
      <button class="btn-nav" disabled={!$canUndo} on:click={undo} title="Undo" aria-label="Undo">
        <Icon name="corner-up-left" size={16} />
      </button>
      <button class="btn-nav" disabled={!$canRedo} on:click={redo} title="Redo" aria-label="Redo">
        <Icon name="corner-up-right" size={16} />
      </button>
      <button class="btn-add" on:click={() => handleCreateEvent(new Date().toISOString().slice(0, 10))} title="New event">
        <Icon name="plus" size={16} />
      </button>
    </div>
  </header>

  <!-- Batch ops toolbar -->
  {#if $selectionMode && $selectedCount > 0}
    <div class="batch-toolbar">
      <span class="batch-count">{$selectedCount} selected</span>
      <button class="batch-btn" on:click={batchComplete} title="Complete selected"><Icon name="check" size={14} /> Complete</button>
      <button class="batch-btn" on:click={batchDuplicate} title="Duplicate selected"><Icon name="copy" size={14} /> Duplicate</button>
      <button class="batch-btn" on:click={() => batchShift(1)} title="Shift forward 1 day"><Icon name="chevron-right" size={14} /> +1d</button>
      <button class="batch-btn" on:click={() => batchShift(-1)} title="Shift back 1 day"><Icon name="chevron-left" size={14} /> -1d</button>
      <button class="batch-btn danger" on:click={batchDelete} title="Delete selected"><Icon name="trash-2" size={14} /> Delete</button>
      <button class="batch-btn" on:click={clearSelection}>Cancel</button>
    </div>
  {/if}

  <!-- Capacity bar -->
  {#if $todayCapacity.scheduledMinutes > 0}
    <div class="capacity-bar">
      <span class="capacity-label">Today</span>
      <div class="capacity-track">
        <div
          class="capacity-fill"
          style="width: {Math.min(100, $todayCapacity.utilization * 100)}%; background: {utilizationColor($todayCapacity.utilization)}"
        ></div>
      </div>
      <span class="capacity-text">
        {formatCapacityTime($todayCapacity.scheduledMinutes)} / {formatCapacityTime($todayCapacity.totalMinutes)}
      </span>
    </div>
  {/if}

  <!-- Active clocks bar -->
  <ActiveClocks />

  <!-- View content -->
  <div class="calendar-content">
    <div class="content-main">
      {#if $calendarViewMode === 'day'}
        <CalendarDayView />
      {:else if $calendarViewMode === 'week'}
        <WeekView onCreateEvent={(d) => handleCreateEvent(d.date, d.startMinute)} />
      {:else if $calendarViewMode === 'month'}
        <MonthView onDayClick={(d) => handleCreateEvent(d.date)} />
      {:else if $calendarViewMode === 'list'}
        <ListView />
      {:else if $calendarViewMode === 'heatmap'}
        <HeatmapCalendar />
      {:else if $calendarViewMode === 'gantt'}
        <GanttView />
      {:else}
        <YearView />
      {/if}
    </div>

    {#if showTimeline}
      <aside class="timeline-sidebar" aria-label="Timeline">
        <TimelineView showClocks={$plannerSettings.showClockColumn} />
      </aside>
    {/if}
  </div>

  <!-- Event creation dialog -->
  {#if showEventDialog}
    <EventDialog
      date={eventDialogDate}
      startMinute={eventDialogStartMinute}
      onClose={() => (showEventDialog = false)}
    />
  {/if}

  <!-- ICS Settings panel -->
  {#if showIcsSettings}
    <div class="settings-overlay">
      <IcsSettings onClose={() => (showIcsSettings = false)} />
    </div>
  {/if}
</div>

<style>
  .calendar-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--background-primary);
    overflow: hidden;
  }

  .calendar-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
    border-bottom: 1px solid var(--border-color);
    background: var(--background-primary);
    flex-shrink: 0;
  }

  .toolbar-left { display: flex; align-items: center; gap: 8px; }
  .toolbar-right { display: flex; align-items: center; gap: 12px; }
  .header-label { font-size: 1.1rem; font-weight: 600; margin: 0; color: var(--text-normal); }

  .btn-today {
    padding: 6px 14px;
    font-size: 0.8rem;
    font-weight: 500;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    background: var(--background-primary);
    color: var(--text-normal);
    cursor: pointer;
    transition: background 0.15s;
  }

  .btn-today:hover { background: var(--background-modifier-hover); }

  .btn-nav {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-muted);
    cursor: pointer;
  }

  .btn-nav:hover {
    background: var(--background-modifier-hover);
    color: var(--text-normal);
  }

  .view-switcher {
    display: flex;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    overflow: hidden;
  }

  .view-btn {
    padding: 6px 14px;
    font-size: 0.75rem;
    font-weight: 500;
    border: none;
    background: var(--background-primary);
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.15s;
  }

  .view-btn:not(:last-child) {
    border-right: 1px solid var(--border-color);
  }

  .view-btn:hover {
    background: var(--background-modifier-hover);
    color: var(--text-normal);
  }

  .view-btn.active {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
  }

  .btn-add {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    border-radius: var(--radius-s);
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    cursor: pointer;
    transition: opacity 0.15s;
  }

  .btn-add:hover { opacity: 0.85; }

  .calendar-content {
    flex: 1;
    overflow: hidden;
    display: flex;
  }

  .content-main {
    flex: 1;
    overflow: hidden;
  }

  .timeline-sidebar {
    width: 280px;
    border-left: 1px solid var(--border-color);
    overflow: hidden;
    flex-shrink: 0;
  }

  .btn-nav.active {
    color: var(--interactive-accent);
  }

  .settings-overlay {
    position: absolute;
    top: 48px;
    right: 8px;
    z-index: 100;
    background: var(--background-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-m);
    box-shadow: var(--shadow-l);
  }

  .batch-toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 20px;
    background: var(--background-secondary);
    border-bottom: 1px solid var(--border-color);
  }

  .batch-count { font-size: 0.8rem; font-weight: 600; color: var(--interactive-accent); }

  .batch-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    font-size: 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    background: var(--background-primary);
    color: var(--text-normal);
    cursor: pointer;
  }

  .batch-btn:hover { background: var(--background-modifier-hover); }
  .batch-btn.danger { color: var(--color-error, #dc2626); border-color: var(--color-error, #dc2626); }

  .capacity-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 20px;
    background: var(--background-primary);
    border-bottom: 1px solid var(--border-color);
    font-size: 0.75rem;
  }

  .capacity-label { color: var(--text-muted); font-weight: 500; }

  .capacity-track {
    flex: 1;
    height: 6px;
    border-radius: 3px;
    background: var(--background-modifier-border);
    overflow: hidden;
  }

  .capacity-fill { height: 100%; border-radius: 3px; transition: width 0.3s ease; }
  .capacity-text { color: var(--text-muted); white-space: nowrap; }
</style>
