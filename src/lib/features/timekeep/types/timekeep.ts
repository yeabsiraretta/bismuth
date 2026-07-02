/**
 * Timekeep types — time tracking entries, data format, settings, and export options.
 * Compatible with Obsidian Timekeep / SimpleTimeTracker JSON format.
 */

// ─── Core entry ─────────────────────────────────────────────────────────────

export interface TimekeepEntry {
  /** Display name for this time block */
  name: string;
  /** ISO timestamp when the timer started (null = not yet started) */
  startTime: string | null;
  /** ISO timestamp when the timer stopped (null = still running) */
  endTime: string | null;
  /** Nested sub-entries for grouped tracking */
  subEntries: TimekeepEntry[] | null;
  /** Whether sub-entries are collapsed in the UI */
  collapsed?: boolean;
}

// ─── Timekeep data container ────────────────────────────────────────────────

export interface TimekeepData {
  entries: TimekeepEntry[];
}

// ─── Identified timekeep (for store management) ─────────────────────────────

export interface Timekeep {
  /** Unique ID for this timekeep instance */
  id: string;
  /** Optional display title */
  title: string;
  /** The actual time tracking data */
  data: TimekeepData;
  /** ISO timestamp when the timekeep was created */
  createdAt: string;
  /** ISO timestamp of the last modification */
  updatedAt: string;
}

// ─── Export formats ─────────────────────────────────────────────────────────

export type TimekeepExportFormat = 'markdown' | 'csv' | 'json';

export interface TimekeepExportOptions {
  format: TimekeepExportFormat;
  /** Include column header row in CSV */
  includeHeaders: boolean;
  /** Date/time format pattern (default: 'YY-MM-DD HH:mm:ss') */
  dateFormat: string;
  /** Include sub-entries indented in the export */
  includeSubEntries: boolean;
}

export const DEFAULT_EXPORT_OPTIONS: TimekeepExportOptions = {
  format: 'markdown',
  includeHeaders: true,
  dateFormat: 'YY-MM-DD HH:mm:ss',
  includeSubEntries: true,
};

// ─── Settings ───────────────────────────────────────────────────────────────

export interface TimekeepSettings {
  /** Show running timers in status bar area */
  showStatusBar: boolean;
  /** Default date format for display */
  dateFormat: string;
  /** Enable reversal of entry display order (newest first) */
  reverseOrder: boolean;
  /** Include CSV column headers in exports */
  csvIncludeHeaders: boolean;
}

export const DEFAULT_TIMEKEEP_SETTINGS: TimekeepSettings = {
  showStatusBar: true,
  dateFormat: 'YY-MM-DD HH:mm:ss',
  reverseOrder: false,
  csvIncludeHeaders: true,
};

// ─── Duration helpers ───────────────────────────────────────────────────────

export interface DurationParts {
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}
