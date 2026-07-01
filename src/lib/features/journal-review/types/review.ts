/**
 * Journal Review types — "On This Day" anniversary-based note review.
 * Reviews all vault notes (any file type) by their creation date.
 * Prefers frontmatter `created` field stored in markdown.
 */

// ─── Time span ───────────────────────────────────────────────────────────────

export type ReviewUnit = 'day' | 'week' | 'month' | 'year';

export interface ReviewTimeSpan {
  /** How many units to look back */
  number: number;
  /** Unit of time */
  unit: ReviewUnit;
  /** If true, shows every Nth unit (1y, 2y, 3y…). If false, shows only once. */
  recurring: boolean;
}

// ─── Review entry ────────────────────────────────────────────────────────────

export interface ReviewEntry {
  /** Vault-relative path */
  path: string;
  /** Note title (from frontmatter title or filename) */
  title: string;
  /** Creation date (ISO string YYYY-MM-DD) */
  createdDate: string;
  /** Preview text (truncated body content) */
  preview: string;
  /** How long ago this note was created (human-readable) */
  timeAgo: string;
  /** Tags from frontmatter */
  tags: string[];
  /** File type (md, canvas, etc.) */
  fileType: string;
}

// ─── Review group ────────────────────────────────────────────────────────────

export interface ReviewGroup {
  /** Display label for the time span (e.g. "1 month ago", "2 years ago") */
  label: string;
  /** The time span definition that produced this group */
  span: ReviewTimeSpan;
  /** The target date being reviewed */
  targetDate: string;
  /** Notes matching this time span */
  entries: ReviewEntry[];
}

// ─── Configuration ───────────────────────────────────────────────────────────

export interface ReviewDisplayOptions {
  /** Show note title above preview */
  showTitle: boolean;
  /** Use Obsidian-style callouts for note previews */
  useCallouts: boolean;
  /** Use HTML quote element for previews */
  useQuotes: boolean;
  /** Show tags in preview */
  showTags: boolean;
}

export interface ReviewConfig {
  /** Time spans to review */
  timeSpans: ReviewTimeSpan[];
  /** Number of days to include before and after the target date */
  lookupMargin: number;
  /** Length of preview text in characters */
  previewLength: number;
  /** Open notes in new pane */
  openInNewPane: boolean;
  /** Show notification when new entries are available */
  useNotifications: boolean;
  /** Show random daily note section */
  showRandomNote: boolean;
  /** Where to show the random note: 'top' or 'bottom' */
  randomNotePosition: 'top' | 'bottom';
  /** Display options */
  display: ReviewDisplayOptions;
  /** Humanize time span labels (e.g. "a month ago" vs "1 month ago") */
  humanizeTimeSpans: boolean;
  /** Auto-refresh around midnight */
  autoRefresh: boolean;
  /** Frontmatter field name for creation date */
  createdField: string;
  /** File extensions to include (empty = all) */
  includeExtensions: string[];
  /** Folders to exclude from review */
  excludeFolders: string[];
}

export const DEFAULT_TIME_SPANS: ReviewTimeSpan[] = [
  { number: 1, unit: 'month', recurring: false },
  { number: 6, unit: 'month', recurring: false },
  { number: 1, unit: 'year', recurring: true },
];

export const DEFAULT_REVIEW_CONFIG: ReviewConfig = {
  timeSpans: DEFAULT_TIME_SPANS,
  lookupMargin: 0,
  previewLength: 200,
  openInNewPane: false,
  useNotifications: true,
  showRandomNote: true,
  randomNotePosition: 'bottom',
  display: {
    showTitle: true,
    useCallouts: false,
    useQuotes: false,
    showTags: true,
  },
  humanizeTimeSpans: true,
  autoRefresh: true,
  createdField: 'created',
  includeExtensions: ['md'],
  excludeFolders: ['.obsidian', '.trash', 'node_modules'],
};
