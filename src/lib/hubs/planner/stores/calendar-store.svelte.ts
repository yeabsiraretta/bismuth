import { CALENDAR_EVENTS_KEY, CALENDAR_VIEW_KEY } from '@/constants/storage-keys';
import { getPMTasks, toggleDone } from '@/hubs/planner/stores/pm-task-store.svelte';
import type {
  CalendarEvent,
  CalendarViewMode,
  DayCell,
  DayColumn,
} from '@/hubs/planner/types/calendar-types';
import type { PMTask } from '@/hubs/planner/types/pm-types';
import { DEFAULT_PRIORITIES } from '@/hubs/planner/types/pm-types';
import { log } from '@/utils/log/logger';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

let nextId = 0;
function genId(): string {
  return `evt-${Date.now()}-${++nextId}`;
}

function loadEvents(): CalendarEvent[] {
  try {
    const raw = localStorage.getItem(CALENDAR_EVENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function loadViewMode(): CalendarViewMode {
  try {
    const raw = localStorage.getItem(CALENDAR_VIEW_KEY);
    if (raw === 'day' || raw === 'week' || raw === 'month' || raw === 'year' || raw === 'list') {
      return raw;
    }
  } catch {
    /* noop */
  }
  return 'month';
}

function persistEvents(events: CalendarEvent[]) {
  try {
    localStorage.setItem(CALENDAR_EVENTS_KEY, JSON.stringify(events));
  } catch (e) {
    log.warn('Failed to persist calendar events', { error: String(e) });
  }
}

function persistViewMode(mode: CalendarViewMode) {
  try {
    localStorage.setItem(CALENDAR_VIEW_KEY, mode);
  } catch {
    /* noop */
  }
}

// ── Reactive State ───────────────────────────────────────────────────────────

let events = $state<CalendarEvent[]>(loadEvents());
let viewMode = $state<CalendarViewMode>(loadViewMode());
let focusDate = $state<Date>(new Date());

// ── PM Task → Calendar bridge ───────────────────────────────────────────────

const PRIORITY_COLORS: Record<string, string> = Object.fromEntries(
  DEFAULT_PRIORITIES.map((p) => [p.id, p.color])
);

function pmTaskToCalendarEvent(task: PMTask, date: string): CalendarEvent {
  return {
    id: `task-${task.id}`,
    title: task.title,
    type: 'task',
    date,
    startMinute: null,
    durationMinutes: null,
    color: PRIORITY_COLORS[task.priority],
    completed: task.status === 'done' || task.status === 'cancelled',
    description: task.description || undefined,
    project: task.project || undefined,
    readonly: true,
  };
}

function getTaskEventsForDate(date: string): CalendarEvent[] {
  return getPMTasks()
    .filter(
      (t) => t.dueDate === date || (t.scheduledDate === date && t.scheduledDate !== t.dueDate)
    )
    .map((t) => pmTaskToCalendarEvent(t, date));
}

// ── Formatters ───────────────────────────────────────────────────────────────

export function formatDateStr(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// ── Getters ──────────────────────────────────────────────────────────────────

export function getEvents(): CalendarEvent[] {
  return events;
}

export function getViewMode(): CalendarViewMode {
  return viewMode;
}

export function getFocusDate(): Date {
  return focusDate;
}

export function getEventsForDate(date: string): CalendarEvent[] {
  const MAX_MINUTES = 1440;

  // Direct events for this date, clamped at midnight
  const direct = events
    .filter((e) => e.date === date)
    .map((e) => {
      if (
        e.startMinute != null &&
        e.durationMinutes != null &&
        e.startMinute + e.durationMinutes > MAX_MINUTES
      ) {
        return { ...e, durationMinutes: MAX_MINUTES - e.startMinute };
      }
      return e;
    });

  // Overflow continuations from previous day
  const prev = new Date(date + 'T12:00:00');
  prev.setDate(prev.getDate() - 1);
  const prevStr = formatDateStr(prev);

  const overflows: CalendarEvent[] = events
    .filter(
      (e) =>
        e.date === prevStr &&
        e.startMinute != null &&
        e.durationMinutes != null &&
        e.startMinute + e.durationMinutes > MAX_MINUTES
    )
    .map((e) => ({
      ...e,
      id: `${e.id}-overflow`,
      date,
      startMinute: 0,
      durationMinutes: Math.min(e.startMinute! + e.durationMinutes! - MAX_MINUTES, MAX_MINUTES),
      title: `${e.title} (cont.)`,
      readonly: true,
    }));

  return [...direct, ...overflows, ...getTaskEventsForDate(date)];
}

export function getHeaderLabel(): string {
  const d = focusDate;
  const mode = viewMode;
  if (mode === 'year') return d.getFullYear().toString();
  if (mode === 'list') return 'Upcoming Events';
  if (mode === 'month') {
    return d.toLocaleString('default', { month: 'long', year: 'numeric' });
  }
  if (mode === 'day') {
    return d.toLocaleDateString('default', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }
  const start = new Date(d);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const startStr = start.toLocaleDateString('default', { month: 'short', day: 'numeric' });
  const endStr = end.toLocaleDateString('default', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `${startStr} – ${endStr}`;
}

export function getWeekColumns(): DayColumn[] {
  const today = formatDateStr(new Date());
  const startOfWeek = new Date(focusDate);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

  const columns: DayColumn[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    const dateStr = formatDateStr(d);
    columns.push({
      date: dateStr,
      dayName: DAY_NAMES[i],
      dayNumber: d.getDate(),
      isToday: dateStr === today,
      events: getEventsForDate(dateStr),
    });
  }
  return columns;
}

export function getMonthGrid(): DayCell[] {
  const year = focusDate.getFullYear();
  const month = focusDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const cells: DayCell[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push({ day: null, date: null });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, date: formatDateStr(new Date(year, month, d)) });
  }
  return cells;
}

export function getEventCountMap(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const e of events) {
    counts[e.date] = (counts[e.date] ?? 0) + 1;
  }
  for (const t of getPMTasks()) {
    if (t.dueDate) counts[t.dueDate] = (counts[t.dueDate] ?? 0) + 1;
    if (t.scheduledDate && t.scheduledDate !== t.dueDate) {
      counts[t.scheduledDate] = (counts[t.scheduledDate] ?? 0) + 1;
    }
  }
  return counts;
}

export function getDayEvents(): CalendarEvent[] {
  return getEventsForDate(formatDateStr(focusDate));
}

export function getYearMonths(): { month: number; name: string; days: DayCell[] }[] {
  const year = focusDate.getFullYear();
  const months: { month: number; name: string; days: DayCell[] }[] = [];
  for (let m = 0; m < 12; m++) {
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    const firstDay = new Date(year, m, 1).getDay();
    const days: DayCell[] = [];
    for (let i = 0; i < firstDay; i++) days.push({ day: null, date: null });
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ day: d, date: formatDateStr(new Date(year, m, d)) });
    }
    months.push({
      month: m,
      name: new Date(year, m).toLocaleString('default', { month: 'short' }),
      days,
    });
  }
  return months;
}

export function getUpcomingEvents(limit: number = 20): CalendarEvent[] {
  const today = formatDateStr(new Date());
  const calEvents = events.filter((e) => e.date >= today);
  const taskEvents = getPMTasks()
    .filter((t) => {
      const d = t.dueDate ?? t.scheduledDate;
      return d != null && d >= today && t.status !== 'done' && t.status !== 'cancelled';
    })
    .map((t) => pmTaskToCalendarEvent(t, (t.dueDate ?? t.scheduledDate)!));
  return [...calEvents, ...taskEvents]
    .sort((a, b) => a.date.localeCompare(b.date) || (a.startMinute ?? 0) - (b.startMinute ?? 0))
    .slice(0, limit);
}

// ── Mutations ────────────────────────────────────────────────────────────────

export function setViewMode(mode: CalendarViewMode): void {
  viewMode = mode;
  persistViewMode(mode);
}

export function navigateCalendar(direction: 'prev' | 'next'): void {
  const d = new Date(focusDate);
  const delta = direction === 'next' ? 1 : -1;
  if (viewMode === 'day') d.setDate(d.getDate() + delta);
  else if (viewMode === 'week') d.setDate(d.getDate() + 7 * delta);
  else if (viewMode === 'month') d.setMonth(d.getMonth() + delta);
  else if (viewMode === 'year') d.setFullYear(d.getFullYear() + delta);
  focusDate = d;
}

export function goToToday(): void {
  focusDate = new Date();
}

export function setFocusDate(date: Date): void {
  focusDate = date;
}

export function addEvent(title: string, date: string, type: CalendarEvent['type'] = 'event'): void {
  const event: CalendarEvent = {
    id: genId(),
    title,
    type,
    date,
    startMinute: null,
    durationMinutes: null,
    completed: false,
  };
  events = [...events, event];
  persistEvents(events);
  log.info('Calendar event added', { id: event.id, title });
}

export function createFullEvent(data: Omit<CalendarEvent, 'id'>): CalendarEvent {
  const event: CalendarEvent = { id: genId(), ...data };
  events = [...events, event];
  persistEvents(events);
  log.info('Calendar event created', { id: event.id, title: event.title });
  return event;
}

export function updateEvent(id: string, updates: Partial<CalendarEvent>): void {
  events = events.map((e) => (e.id === id ? { ...e, ...updates } : e));
  persistEvents(events);
}

export function deleteEvent(id: string): void {
  if (id.startsWith('task-')) return;
  events = events.filter((e) => e.id !== id);
  persistEvents(events);
}

export function toggleEventComplete(id: string): void {
  if (id.startsWith('task-')) {
    toggleDone(id.slice(5));
    return;
  }
  events = events.map((e) => (e.id === id ? { ...e, completed: !e.completed } : e));
  persistEvents(events);
}

function createTimeBlock(
  date: string,
  startMinute: number,
  durationMinutes: number,
  title: string
): void {
  const event: CalendarEvent = {
    id: genId(),
    title,
    type: 'time-block',
    date,
    startMinute,
    durationMinutes,
    completed: false,
  };
  events = [...events, event];
  persistEvents(events);
}
