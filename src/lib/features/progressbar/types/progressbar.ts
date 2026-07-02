/**
 * ProgressBar types — renders ```progressbar fenced code blocks
 * as visual progress bars based on time or manual values.
 */

/** Time-based progress bar kinds */
export type ProgressBarKind =
  'day-year' | 'day-month' | 'day-week' | 'day-custom' | 'month' | 'manual';

/** Parsed configuration from a ```progressbar code block */
export interface ProgressBarConfig {
  /** Kind of progress bar */
  kind: ProgressBarKind | null;
  /** Display name (supports {value}, {max}, {percentage}, {min} templates) */
  name: string;
  /** CSS width of the bar (e.g., '100%', '200px') */
  width: string;
  /** Current value (required for manual, auto-calculated for time-based) */
  value: number | null;
  /** Minimum value or start date for day-custom */
  min: number | string | null;
  /** Maximum value or end date for day-custom */
  max: number | string | null;
  /** Show +/- buttons for manual bars */
  button: boolean;
  /** Unique ID for syncing bars with same id */
  id: string | null;
}

/** Computed progress bar data ready for rendering */
export interface ProgressBarData {
  /** Display label */
  label: string;
  /** Current value */
  value: number;
  /** Minimum value */
  min: number;
  /** Maximum value */
  max: number;
  /** Percentage (0-100) */
  percentage: number;
  /** CSS width */
  width: string;
  /** Show buttons */
  showButtons: boolean;
  /** Sync ID */
  id: string | null;
  /** Original kind for display */
  kind: ProgressBarKind | null;
}

/** A located progressbar block in a document */
export interface ProgressBarBlock {
  /** Raw YAML content */
  raw: string;
  /** Parsed config */
  config: ProgressBarConfig;
  /** Computed data */
  data: ProgressBarData;
  /** Document start offset (end of opening fence) */
  from: number;
  /** Document end offset (end of closing fence) */
  to: number;
}

/** Default config values */
export const DEFAULT_PROGRESSBAR_CONFIG: ProgressBarConfig = {
  kind: null,
  name: '',
  width: '100%',
  value: null,
  min: null,
  max: null,
  button: false,
  id: null,
};
