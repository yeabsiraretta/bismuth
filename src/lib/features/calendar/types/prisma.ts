/**
 * Prisma Calendar types — frontmatter event mapping, event presets,
 * batch operations, undo/redo, capacity tracking, Gantt dependencies,
 * statistics, and smart categories.
 */
import type { CalendarEvent, CalendarCategory } from './index';

// ─── Frontmatter event mapping ───────────────────────────────────────────────

/** Configuration for reading events from note frontmatter */
export interface FrontmatterEventConfig {
  /** Vault folder to scan for notes */
  folder: string;
  /** Frontmatter property for start datetime (e.g. "Start") */
  startProperty: string;
  /** Frontmatter property for end datetime (e.g. "End") */
  endProperty: string;
  /** Frontmatter property for all-day date (e.g. "Date") */
  dateProperty: string;
  /** Frontmatter property for all-day flag */
  allDayProperty: string;
  /** Additional property mappings for event fields */
  fieldMappings: Record<string, string>;
  /** Whether this mapping is enabled */
  enabled: boolean;
}

export const DEFAULT_FM_EVENT_CONFIG: FrontmatterEventConfig = {
  folder: '',
  startProperty: 'Start',
  endProperty: 'End',
  dateProperty: 'Date',
  allDayProperty: 'AllDay',
  fieldMappings: {
    Status: 'project',
    Project: 'project',
    Category: 'categoryId',
    Location: 'location',
  },
  enabled: true,
};

/** A frontmatter-sourced event with note path tracking */
export interface FrontmatterEvent extends CalendarEvent {
  /** Source note path */
  notePath: string;
  /** Whether the source note frontmatter was valid */
  valid: boolean;
}

// ─── Event presets (templates) ───────────────────────────────────────────────

export interface EventPreset {
  id: string;
  name: string;
  /** Pre-filled event fields */
  defaults: Partial<CalendarEvent>;
  /** Frontmatter template (key-value pairs to write to new notes) */
  frontmatter: Record<string, unknown>;
  /** Icon name for quick access */
  icon?: string;
  /** Category to auto-assign */
  categoryId?: string;
}

// ─── Batch operations ────────────────────────────────────────────────────────

export type BatchAction = 'delete' | 'move' | 'duplicate' | 'complete' | 'uncomplete' | 'shift';

export interface BatchOperation {
  action: BatchAction;
  eventIds: string[];
  /** For move/shift: number of days to shift */
  shiftDays?: number;
  /** For move: target date */
  targetDate?: string;
}

// ─── Undo / Redo ─────────────────────────────────────────────────────────────

export type UndoActionType = 'add' | 'update' | 'delete' | 'batch';

export interface UndoEntry {
  id: string;
  type: UndoActionType;
  label: string;
  timestamp: number;
  /** Snapshot of affected events before the action */
  before: CalendarEvent[];
  /** Snapshot of affected events after the action */
  after: CalendarEvent[];
}

// ─── Capacity tracking ──────────────────────────────────────────────────────

export interface DayCapacity {
  date: string;
  /** Total available minutes (from working hours) */
  totalMinutes: number;
  /** Scheduled event minutes */
  scheduledMinutes: number;
  /** Tracked (clock) minutes */
  trackedMinutes: number;
  /** Remaining capacity */
  remainingMinutes: number;
  /** Utilization ratio 0-1 */
  utilization: number;
}

// ─── Statistics ──────────────────────────────────────────────────────────────

export interface CategoryStat {
  categoryId: string;
  categoryName: string;
  color: string;
  eventCount: number;
  totalMinutes: number;
  percentage: number;
}

export interface CalendarStats {
  totalEvents: number;
  totalMinutes: number;
  completedCount: number;
  completionRate: number;
  categoryBreakdown: CategoryStat[];
  busiestDay: { date: string; count: number } | null;
  averageEventsPerDay: number;
  /** Streak: consecutive days with at least one event */
  currentStreak: number;
  longestStreak: number;
}

export type StatsTimeRange = 'day' | 'week' | 'month' | 'all';

// ─── Gantt dependencies ──────────────────────────────────────────────────────

export interface GanttTask {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  /** Percentage complete 0-100 */
  progress: number;
  /** IDs of prerequisite tasks */
  dependencies: string[];
  /** Category/project grouping */
  group?: string;
  color?: string;
  /** Whether this task is on the critical path */
  isCritical?: boolean;
  /** Source calendar event ID */
  eventId?: string;
}

export interface GanttGroup {
  id: string;
  label: string;
  color?: string;
  tasks: GanttTask[];
}

// ─── Smart categories ────────────────────────────────────────────────────────

export interface SmartCategoryRule {
  /** Pattern to match in event title (case-insensitive) */
  pattern: string;
  /** Category ID to auto-assign */
  categoryId: string;
}

export interface PrismaSettings {
  /** Frontmatter event configs (multiple planning systems) */
  eventConfigs: FrontmatterEventConfig[];
  /** Event presets */
  presets: EventPreset[];
  /** Smart category auto-assignment rules */
  smartCategoryRules: SmartCategoryRule[];
  /** User-defined categories (extends defaults) */
  customCategories: CalendarCategory[];
  /** Max undo history entries */
  maxUndoHistory: number;
  /** Whether capacity bar is visible */
  showCapacityBar: boolean;
}

export const DEFAULT_PRISMA_SETTINGS: PrismaSettings = {
  eventConfigs: [DEFAULT_FM_EVENT_CONFIG],
  presets: [],
  smartCategoryRules: [],
  customCategories: [],
  maxUndoHistory: 50,
  showCapacityBar: true,
};
