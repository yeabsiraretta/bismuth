<script lang="ts">
  import BIcon from '@/ui/b-icon.svelte';
  import { pageTitle, SITE_URL } from '@/constants/seo';
  import DayView from '@/hubs/planner/components/DayView.svelte';
  import EventModal from '@/hubs/planner/components/EventModal.svelte';
  import ListView from '@/hubs/planner/components/ListView.svelte';
  import MonthView from '@/hubs/planner/components/MonthView.svelte';
  import WeekView from '@/hubs/planner/components/WeekView.svelte';
  import YearView from '@/hubs/planner/components/YearView.svelte';
  import {
    createFullEvent,
    deleteEvent,
    formatDateStr,
    getEvents,
    getHeaderLabel,
    getViewMode,
    goToToday,
    navigateCalendar,
    setFocusDate,
    setViewMode,
    updateEvent,
  } from '@/hubs/planner/stores/calendar-store.svelte';
  import { exportToIcs, mergeIcsImport } from '@/hubs/planner/services/ics-calendar-service';
  import { writeNote } from '@/sal/note-service';
  import { getSettings } from '@/hubs/core/stores/settings-store.svelte';
  import type { CalendarEvent, CalendarViewMode } from '@/hubs/planner/types/calendar-types';
  import { MetaTags } from 'svelte-meta-tags';
  import { onMount } from 'svelte';

  let { data } = $props();

  const VIEW_OPTIONS: { id: CalendarViewMode; label: string }[] = [
    { id: 'day', label: 'Day' },
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
    { id: 'year', label: 'Year' },
    { id: 'list', label: 'List' },
  ];

  let currentView = $derived(getViewMode());
  let headerLabel = $derived(getHeaderLabel());

  onMount(() => {
    if (data.view) {
      const validViews = VIEW_OPTIONS.map((v) => v.id);
      if (validViews.includes(data.view as CalendarViewMode)) {
        setViewMode(data.view as CalendarViewMode);
      }
    }
  });

  let modalOpen = $state(false);
  let modalDate = $state(formatDateStr(new Date()));
  let modalStartMinute: number | null = $state(null);
  let editingEvent: CalendarEvent | null = $state(null);

  function openCreateModal(date?: string, startMinute?: number | null) {
    editingEvent = null;
    modalDate = date ?? formatDateStr(new Date());
    modalStartMinute = startMinute ?? null;
    modalOpen = true;
  }

  function openEditModal(eventId: string) {
    const evt = getEvents().find((e) => e.id === eventId);
    if (!evt) return;
    editingEvent = evt;
    modalDate = evt.date;
    modalStartMinute = evt.startMinute;
    modalOpen = true;
  }

  function handleModalSubmit(data: Omit<CalendarEvent, 'id'>) {
    if (editingEvent) {
      updateEvent(editingEvent.id, data);
    } else {
      createFullEvent(data);
    }
    modalOpen = false;
    editingEvent = null;
  }

  function handleModalDelete(id: string) {
    deleteEvent(id);
    modalOpen = false;
    editingEvent = null;
  }

  function handleNoteCreated(eventId: string, notePath: string) {
    const evt = getEvents().find((e) => e.id === eventId);
    const existing = evt?.linkedNotePaths ?? [];
    if (!existing.includes(notePath)) {
      updateEvent(eventId, { linkedNotePaths: [...existing, notePath] });
    }
  }

  function handleDayClick(date: string) {
    setFocusDate(new Date(date + 'T00:00:00'));
    setViewMode('day');
  }

  function handleCreateEvent(detail: { date: string; startMinute: number | null }) {
    openCreateModal(detail.date, detail.startMinute);
  }

  // ── ICS Import / Export ─────────────────────────────────────────────────────

  let icsImporting = $state(false);
  let icsExporting = $state(false);
  let icsMessage = $state<string | null>(null);

  async function handleIcsImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.ics,.ical';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      icsImporting = true;
      icsMessage = null;
      try {
        const text = await file.text();
        const { newEvents, updatedEvents } = mergeIcsImport(text, getEvents());
        for (const evt of newEvents) {
          createFullEvent(evt);
        }
        for (const evt of updatedEvents) {
          updateEvent(evt.id, evt);
        }
        icsMessage = `Imported ${newEvents.length} new event${newEvents.length !== 1 ? 's' : ''}${updatedEvents.length > 0 ? `, updated ${updatedEvents.length}` : ''}`;
      } catch (e) {
        icsMessage = `Import failed: ${(e as Error).message}`;
      } finally {
        icsImporting = false;
      }
    };
    input.click();
  }

  async function handleIcsExport() {
    icsExporting = true;
    icsMessage = null;
    try {
      const events = getEvents();
      const icsContent = exportToIcs(events, {
        calendarName: 'Bismuth Calendar',
        includeCompleted: true,
      });
      const folder = getSettings().calendar?.icsExportFolder ?? 'calendar-export';
      const filename = `bismuth-calendar-${formatDateStr(new Date())}.ics`;
      await writeNote(`${folder}/${filename}`, icsContent);
      icsMessage = `Exported ${events.length} event${events.length !== 1 ? 's' : ''} to ${folder}/${filename}`;
    } catch (e) {
      icsMessage = `Export failed: ${(e as Error).message}`;
    } finally {
      icsExporting = false;
    }
  }
</script>

<MetaTags
  title={pageTitle(data.title ?? 'Calendar')}
  description={data.description ?? 'Plan and organize your schedule with an integrated calendar.'}
  canonical="{SITE_URL}/calendar"
  openGraph={{
    url: `${SITE_URL}/calendar`,
    title: pageTitle(data.title ?? 'Calendar'),
    description: data.description ?? '',
  }}
/>

<div class="flex flex-col h-full">
  <header class="flex items-center justify-between px-4 py-2 border-b border-border bg-surface">
    <div class="flex items-center gap-2">
      <button
        class="px-3 py-1 text-xs bg-surface-hover text-text rounded-m hover:bg-border transition-colors"
        onclick={goToToday}
      >
        Today
      </button>
      <button
        class="p-1 text-text-muted hover:text-text transition-colors"
        onclick={() => navigateCalendar('prev')}
        aria-label="Previous"
      >
        <BIcon name="chevronLeft" size={16} />
      </button>
      <button
        class="p-1 text-text-muted hover:text-text transition-colors"
        onclick={() => navigateCalendar('next')}
        aria-label="Next"
      >
        <BIcon name="chevronRight" size={16} />
      </button>
      <h2 class="text-s font-semibold text-text ml-2">{headerLabel}</h2>
    </div>

    <div class="flex items-center gap-2">
      <div class="flex items-center bg-background rounded-m p-0.5">
        {#each VIEW_OPTIONS as opt (opt.id)}
          <button
            class="px-2 py-0.5 text-xs rounded-s transition-colors
                   {currentView === opt.id
              ? 'bg-surface text-text'
              : 'text-text-muted hover:text-text'}"
            onclick={() => setViewMode(opt.id)}
          >
            {opt.label}
          </button>
        {/each}
      </div>

      <button
        class="px-2 py-1 text-xs text-text-muted border border-border rounded-m hover:text-text hover:bg-surface-hover transition-colors"
        onclick={handleIcsImport}
        disabled={icsImporting}
      >
        {icsImporting ? 'Importing...' : 'Import .ics'}
      </button>
      <button
        class="px-2 py-1 text-xs text-text-muted border border-border rounded-m hover:text-text hover:bg-surface-hover transition-colors"
        onclick={handleIcsExport}
        disabled={icsExporting}
      >
        {icsExporting ? 'Exporting...' : 'Export .ics'}
      </button>
      <button
        class="flex items-center gap-1 px-3 py-1 text-xs bg-accent text-background rounded-m hover:bg-accent-hover transition-colors"
        onclick={() => openCreateModal()}
      >
        <BIcon name="plus" size={14} />
        New Event
      </button>
    </div>
  </header>
  {#if icsMessage}
    <div class="px-4 py-2 text-xs bg-surface border-b border-border text-text-muted">
      {icsMessage}
      <button
        class="ml-2 text-accent"
        onclick={() => {
          icsMessage = null;
        }}>✕</button
      >
    </div>
  {/if}

  <div class="flex-1 overflow-auto">
    {#if currentView === 'month'}
      <MonthView onDayClick={handleDayClick} onEventClick={openEditModal} />
    {:else if currentView === 'week'}
      <WeekView onCreateEvent={handleCreateEvent} onEventClick={openEditModal} />
    {:else if currentView === 'day'}
      <DayView onCreateEvent={handleCreateEvent} onEventClick={openEditModal} />
    {:else if currentView === 'year'}
      <YearView />
    {:else}
      <ListView onEventClick={openEditModal} />
    {/if}
  </div>
</div>

<EventModal
  open={modalOpen}
  initialDate={modalDate}
  initialStartMinute={modalStartMinute}
  editEvent={editingEvent}
  onSubmit={handleModalSubmit}
  onDelete={handleModalDelete}
  onClose={() => {
    modalOpen = false;
    editingEvent = null;
  }}
  onNoteCreated={handleNoteCreated}
/>
