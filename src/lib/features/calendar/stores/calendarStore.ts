/**
 * Calendar store — manages events, view state, task/ICS/clock integration.
 */
import { writable, derived, get } from 'svelte/store';
import type { CalendarEvent, CalendarViewMode, DayColumn, PlannerSettings } from '../types';
import { DEFAULT_PLANNER_SETTINGS } from '../types';
import { tasks } from '@/features/tasks';
import { generatePrefixedId } from '@/utils/id';
import { log } from '@/utils/logger';
import { expandRecurringEvents } from './recurrence';
import { allIcsEvents } from '../services/icsFeed';
import { clockEvents } from '../services/timeClock';

const STORAGE_KEY = 'bismuth-calendar-events';
const VIEW_STORAGE_KEY = 'bismuth-calendar-view';

function loadEvents(): CalendarEvent[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function loadViewMode(): CalendarViewMode {
  try {
    const stored = localStorage.getItem(VIEW_STORAGE_KEY);
    return (stored as CalendarViewMode) || 'week';
  } catch {
    return 'week';
  }
}

/** All calendar events (user-created) */
export const calendarEvents = writable<CalendarEvent[]>(loadEvents());

/** Current view mode */
export const calendarViewMode = writable<CalendarViewMode>(loadViewMode());
calendarViewMode.subscribe(mode => {
  try { localStorage.setItem(VIEW_STORAGE_KEY, mode); } catch (e) { log.warn('Failed to persist calendar view mode', { error: String(e) }); }
});

/** The focal date for the calendar view */
export const calendarFocusDate = writable<Date>(new Date());

/** Selected date (from sidebar calendar click) */
export const calendarSelectedDate = writable<string | null>(null);

/** Derived: tasks as calendar events (tasks with due dates show on calendar) */
export const taskEvents = derived(tasks, ($tasks) => {
  return $tasks
    .filter(t => t.due_date !== null)
    .map<CalendarEvent>(t => ({
      id: `task-${t.source_path}:${t.line}`,
      title: t.text,
      type: 'task',
      date: t.due_date!,
      startMinute: null,
      durationMinutes: null,
      color: t.priority === 'critical' ? 'red' : t.priority === 'high' ? 'orange' : undefined,
      completed: t.status === 'done',
      taskSourcePath: t.source_path,
      taskLine: t.line,
      project: t.project ?? undefined,
    }));
});

/** Planner settings */
const PLANNER_SETTINGS_KEY = 'bismuth-planner-settings';
function loadPlannerSettings(): PlannerSettings {
  try {
    const stored = localStorage.getItem(PLANNER_SETTINGS_KEY);
    return stored ? { ...DEFAULT_PLANNER_SETTINGS, ...JSON.parse(stored) } : DEFAULT_PLANNER_SETTINGS;
  } catch { return DEFAULT_PLANNER_SETTINGS; }
}
export const plannerSettings = writable<PlannerSettings>(loadPlannerSettings());
plannerSettings.subscribe(s => {
  try { localStorage.setItem(PLANNER_SETTINGS_KEY, JSON.stringify(s)); }
  catch (e) { log.warn('Failed to persist planner settings', { error: String(e) }); }
});

/** Planner events (daily note entries — managed externally) */
export const plannerEvents = writable<CalendarEvent[]>([]);

/** Derived: all items (user events + tasks + ICS + clocks + planner) */
export const allCalendarItems = derived(
  [calendarEvents, taskEvents, allIcsEvents, clockEvents, plannerEvents],
  ([$events, $taskEvents, $ics, $clocks, $planner]) =>
    [...$events, ...$taskEvents, ...$ics, ...$clocks, ...$planner],
);

/** Derived: recurring events expanded over a 90-day window around focusDate */
export const expandedEvents = derived(
  [allCalendarItems, calendarFocusDate],
  ([$items, $focus]) => {
    const start = new Date($focus);
    start.setDate(start.getDate() - 45);
    const end = new Date($focus);
    end.setDate(end.getDate() + 45);
    return expandRecurringEvents($items, start, end);
  }
);

/** Derived: events for a specific date */
export function getEventsForDate(date: string): CalendarEvent[] {
  return get(allCalendarItems).filter(e => e.date === date);
}

/** Derived: week columns for the focus date */
export const weekColumns = derived(
  [calendarFocusDate, allCalendarItems],
  ([$focusDate, $items]) => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = formatDateStr(new Date());
    const startOfWeek = new Date($focusDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const columns: DayColumn[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      const dateStr = formatDateStr(d);
      columns.push({
        date: dateStr,
        dayName: dayNames[i],
        dayNumber: d.getDate(),
        isToday: dateStr === today,
        events: $items.filter(e => e.date === dateStr),
      });
    }
    return columns;
  }
);

function formatDateStr(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Add a new event */
export function addCalendarEvent(event: CalendarEvent): void {
  calendarEvents.update(events => [...events, event]);
  log.info('Calendar event added', { id: event.id, title: event.title });
}

/** Update an existing event */
export function updateCalendarEvent(id: string, updates: Partial<CalendarEvent>): void {
  calendarEvents.update(events =>
    events.map(e => e.id === id ? { ...e, ...updates } : e)
  );
}

/** Delete an event */
export function deleteCalendarEvent(id: string): void {
  calendarEvents.update(events => events.filter(e => e.id !== id));
}

/** Toggle event completion */
export function toggleCalendarEventComplete(id: string): void {
  let awardedTitle = '';
  calendarEvents.update(events =>
    events.map(e => {
      if (e.id === id) {
        const toggled = { ...e, completed: !e.completed };
        if (toggled.completed) awardedTitle = toggled.title;
        return toggled;
      }
      return e;
    })
  );
  if (awardedTitle) {
    import('@/features/gamify').then(({ recordCalendarEventCompleted }) => {
      recordCalendarEventCompleted(awardedTitle);
    });
  }
}

/** Navigate focus date */
export function navigateCalendar(direction: 'prev' | 'next'): void {
  const mode = get(calendarViewMode);
  calendarFocusDate.update(d => {
    const next = new Date(d);
    if (mode === 'week') next.setDate(next.getDate() + (direction === 'next' ? 7 : -7));
    else if (mode === 'month') next.setMonth(next.getMonth() + (direction === 'next' ? 1 : -1));
    else if (mode === 'day') next.setDate(next.getDate() + (direction === 'next' ? 1 : -1));
    else next.setFullYear(next.getFullYear() + (direction === 'next' ? 1 : -1));
    return next;
  });
}

/** Go to today */
export function goToToday(): void {
  calendarFocusDate.set(new Date());
}

/** Create a time block */
export function createTimeBlock(date: string, startMinute: number, durationMinutes: number, title: string): void {
  const event: CalendarEvent = {
    id: generatePrefixedId('tb'),
    title,
    type: 'time-block',
    date,
    startMinute,
    durationMinutes,
    completed: false,
  };
  addCalendarEvent(event);
}

/** Persist events to localStorage on change */
calendarEvents.subscribe(events => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (e) { log.warn('Failed to persist calendar events to localStorage', { error: String(e) }); }
});

