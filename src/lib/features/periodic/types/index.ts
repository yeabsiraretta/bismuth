/** Standard interval types */
export type PeriodType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

/** Custom interval unit for non-standard periods */
export type IntervalUnit = 'day' | 'week' | 'month';

/** How a journal's index counter resets */
export type IndexResetMode = 'continuous' | 'yearly' | 'never';

// ─── Journal Definition ───────────────────────────────────────────────────

/** A single journal definition — the core config unit. */
export interface JournalConfig {
  /** Unique identifier for this journal */
  id: string;
  /** Display name (e.g. "Work Log", "Sprint Notes") */
  name: string;
  /** Period type — standard interval or 'custom' */
  type: PeriodType | 'custom';
  /** Custom interval (only when type === 'custom') */
  customInterval?: { every: number; unit: IntervalUnit };
  /** Shelf ID this journal belongs to (null = unshelfed) */
  shelfId: string | null;

  // Note creation
  /** Folder path template (supports variables like {{journal_name}}) */
  folder: string;
  /** Note filename template (supports variables) */
  nameTemplate: string;
  /** Date format string (Moment.js-compatible, e.g. "YYYY-MM-DD") */
  dateFormat: string;
  /** Path to template file for new notes (null = blank) */
  templatePath: string | null;
  /** Create note automatically when period starts */
  autoCreate: boolean;
  /** Show confirmation dialog before creating */
  confirmCreation: boolean;

  // Chronology
  /** When this journal starts (ISO date, null = no restriction) */
  startDate: string | null;
  /** End condition */
  endCondition: EndCondition;

  // Index
  /** Index numbering config (null = no indexing) */
  indexConfig: IndexConfig | null;

  // Frontmatter
  /** Frontmatter field settings */
  frontmatter: FrontmatterConfig;

  /** Visual decorations for calendar */
  decorations: JournalDecoration[];
}

/** When to stop creating new entries */
export type EndCondition =
  | { mode: 'never' }
  | { mode: 'date'; endDate: string }
  | { mode: 'count'; maxEntries: number };

/** Auto-numbering configuration for entries (Sprint 1, Sprint 2, ...) */
export interface IndexConfig {
  /** Date from which indexing starts (ISO) */
  anchorDate: string;
  /** Starting index number */
  startIndex: number;
  /** How the index resets */
  resetMode: IndexResetMode;
  /** Number of entries before reset (only for resetMode !== 'continuous') */
  resetAfter?: number;
}

/** Frontmatter fields auto-inserted into journal notes */
export interface FrontmatterConfig {
  /** Field name for the journal name (null = don't add) */
  journalField: string | null;
  /** Field name for the date (null = don't add) */
  dateField: string | null;
  /** Add start_date / end_date fields for multi-day periods */
  addStartEndDates: boolean;
  /** Field name for the index (null = don't add) */
  indexField: string | null;
}

// ─── Shelves ──────────────────────────────────────────────────────────────

/** A shelf groups related journals together. */
export interface JournalShelf {
  id: string;
  name: string;
  /** Display order */
  order: number;
}

// ─── Decorations ──────────────────────────────────────────────────────────

/** A visual decoration rule for calendar cells. */
export interface JournalDecoration {
  id: string;
  /** Condition that triggers this decoration */
  condition: DecorationCondition;
  /** Visual style to apply */
  style: DecorationStyle;
}

export type DecorationCondition =
  | { type: 'has-note' }
  | { type: 'weekday'; days: number[] }
  | { type: 'tag'; tag: string }
  | { type: 'property'; key: string; value: string }
  | { type: 'tasks-complete' }
  | { type: 'has-open-tasks' };

export interface DecorationStyle {
  /** Background color (CSS value) */
  backgroundColor?: string;
  /** Text color (CSS value) */
  textColor?: string;
  /** Dot indicator color */
  dotColor?: string;
  /** Border (CSS shorthand) */
  border?: string;
}

// ─── Template Variables ───────────────────────────────────────────────────

/** Context passed to the template variable resolver. */
export interface TemplateContext {
  /** Reference date for the entry */
  date: Date;
  /** Start date of the period */
  startDate: Date;
  /** End date of the period */
  endDate: Date;
  /** Journal config */
  journal: JournalConfig;
  /** Current index (null if indexing disabled) */
  index: number | null;
  /** Resolved note name (available after name resolution) */
  noteName?: string;
}

// ─── Legacy Compat ────────────────────────────────────────────────────────

/** Legacy per-period config (kept for migration) */
export interface PeriodicNoteConfig {
  periodType: PeriodType;
  folder: string;
  dateFormat: string;
  templatePath: string | null;
}

/** A resolved periodic note reference. */
export interface PeriodicNote {
  path: string;
  date: string;
  periodType: PeriodType;
  journalId?: string;
  exists: boolean;
}

// ─── Settings ─────────────────────────────────────────────────────────────

/** Top-level periodic/journal settings. */
export interface PeriodicSettings {
  /** Legacy per-type configs (migration source) */
  configs: Record<PeriodType, PeriodicNoteConfig>;
  defaultPeriod: PeriodType;
  /** All journal definitions */
  journals: JournalConfig[];
  /** Journal shelves */
  shelves: JournalShelf[];
  /** Whether shelves UI is enabled */
  shelvesEnabled: boolean;
  /** Journal to open on startup (null = don't open) */
  openOnStartup: string | null;
  /** Calendar settings */
  calendar: CalendarJournalSettings;
}

export interface CalendarJournalSettings {
  /** Which day starts the week (0=Sun, 1=Mon, ...) */
  weekStart: number;
  /** Show week numbers */
  showWeekNumbers: boolean;
  /** Today button behavior */
  todayMode: 'create' | 'navigate' | 'switch';
}
