/**
 * Calendar types for the full calendar view.
 * Supports events, tasks-as-events, time blocking, ICS feeds,
 * daily-note planner entries, time clocks, and multiple view modes.
 */

export type CalendarViewMode = 'week' | 'month' | 'year' | 'day' | 'heatmap' | 'list' | 'gantt';

export type CalendarItemType = 'event' | 'task' | 'time-block' | 'ics' | 'planner' | 'clock';

/** A user-defined event category with a display color. */
export interface CalendarCategory {
  id: string;
  name: string;
  /** CSS color value — must reference a design token or safe hex string */
  color: string;
  icon?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  type: CalendarItemType;
  /** ISO date string: YYYY-MM-DD */
  date: string;
  /** Start time in minutes from midnight (0-1440). Null = all-day. */
  startMinute: number | null;
  /** Duration in minutes. Null = all-day or point-in-time. */
  durationMinutes: number | null;
  /** Color label for visual grouping */
  color?: string;
  /** User-defined category ID — references a CalendarCategory */
  categoryId?: string;
  /** Whether this event is completed (for tasks/time-blocks) */
  completed: boolean;
  /** Link to source task if type === 'task' */
  taskSourcePath?: string;
  /** Line in source file for tasks */
  taskLine?: number;
  /** Optional project/category */
  project?: string;
  /** Optional description */
  description?: string;
  /** Whether this is a recurring event */
  recurring?: RecurrenceRule;
  /** Vault note paths linked to this event */
  linkedNotePaths?: string[];
  /** Source ICS feed ID (for ics type) */
  icsFeedId?: string;
  /** Location string (from ICS LOCATION or planner) */
  location?: string;
  /** Whether this event is read-only (ICS, clock records) */
  readonly?: boolean;
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  /** Day of week for weekly (0=Sun, 6=Sat) */
  daysOfWeek?: number[];
  /** End date for recurrence (ISO string), null = forever */
  endDate?: string | null;
}

export interface TimeSlot {
  hour: number;
  minute: number;
  label: string;
}

export interface DayColumn {
  date: string;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
  events: CalendarEvent[];
}

// ─── ICS Feed Types ────────────────────────────────────────────────────────

/** Configuration for an external ICS calendar feed. */
export interface IcsFeedConfig {
  id: string;
  /** Display name (e.g. "Work Calendar") */
  name: string;
  /** ICS URL — must end in .ics or be a valid webcal:// link */
  url: string;
  /** Display color for events from this feed */
  color: string;
  /** Whether this feed is enabled */
  enabled: boolean;
  /** Provider hint for display purposes */
  provider?: 'google' | 'icloud' | 'outlook' | 'other';
  /** Last successful fetch timestamp (ISO) */
  lastFetched?: string;
  /** Sync interval in minutes (default: 15) */
  syncIntervalMinutes: number;
  /** Fetch error, if any */
  error?: string;
}

/** A parsed VEVENT from an ICS feed. */
export interface IcsEvent {
  uid: string;
  summary: string;
  description?: string;
  location?: string;
  dtstart: string;
  dtend?: string;
  allDay: boolean;
  rrule?: string;
}

// ─── Time Clock Types ──────────────────────────────────────────────────────

/** Status of a time clock. */
export type ClockStatus = 'running' | 'stopped' | 'cancelled';

/** A recorded time clock entry (clock-in/clock-out). */
export interface ClockRecord {
  id: string;
  /** Task text the clock is associated with */
  taskText: string;
  /** Source file path of the task */
  sourcePath: string;
  /** Line number of the task in source file */
  sourceLine: number;
  /** ISO timestamp when clock started */
  startedAt: string;
  /** ISO timestamp when clock stopped (null if running) */
  stoppedAt: string | null;
  /** Clock status */
  status: ClockStatus;
  /** Duration in minutes (computed when stopped) */
  durationMinutes: number | null;
  /** Optional project */
  project?: string;
}

// ─── Daily Note Planner Types ──────────────────────────────────────────────

/**
 * A planner entry parsed from a daily note.
 * Matches pattern: `- [ ] HH:MM - HH:MM Task title`
 * or: `- [ ] HH:MM Task title` (duration inferred to next entry)
 */
export interface PlannerEntry {
  /** Task text (without the time prefix) */
  text: string;
  /** Whether the task checkbox is checked */
  completed: boolean;
  /** Start time as "HH:MM" */
  startTime: string;
  /** End time as "HH:MM" (null if not specified) */
  endTime: string | null;
  /** Source daily note path */
  sourcePath: string;
  /** Line number in source file */
  line: number;
  /** Scheduled date from task properties (for non-daily-note tasks) */
  scheduledDate?: string;
}

// ─── Planner Settings ──────────────────────────────────────────────────────

export interface PlannerSettings {
  /** ICS feed configurations */
  icsFeeds: IcsFeedConfig[];
  /** Whether to show the timeline sidebar */
  showTimeline: boolean;
  /** Whether to show clock column next to timeline */
  showClockColumn: boolean;
  /** Default view for the planner */
  defaultView: CalendarViewMode;
  /** Daily note heading that contains planner entries (e.g. "Day planner") */
  plannerHeading: string;
  /** Working hours start (minutes from midnight) */
  workDayStart: number;
  /** Working hours end (minutes from midnight) */
  workDayEnd: number;
  /** Whether to show mini-timeline in status bar */
  showMiniTimeline: boolean;
}

export const DEFAULT_PLANNER_SETTINGS: PlannerSettings = {
  icsFeeds: [],
  showTimeline: true,
  showClockColumn: false,
  defaultView: 'week',
  plannerHeading: 'Day planner',
  workDayStart: 8 * 60,
  workDayEnd: 18 * 60,
  showMiniTimeline: true,
};

/** Default calendar categories shipped with Bismuth. */
export const DEFAULT_CALENDAR_CATEGORIES: CalendarCategory[] = [
  { id: 'work', name: 'Work', color: 'var(--interactive-accent, #dc2626)' },
  { id: 'personal', name: 'Personal', color: 'var(--color-success, #16a34a)' },
  { id: 'health', name: 'Health', color: 'var(--color-warning, #d97706)' },
  { id: 'study', name: 'Study', color: 'var(--color-info, #2563eb)' },
  { id: 'other', name: 'Other', color: 'var(--text-muted, #6b7280)' },
];
