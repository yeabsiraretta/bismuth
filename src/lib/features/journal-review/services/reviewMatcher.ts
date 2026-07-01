/**
 * Review Matcher — matches vault notes to "On This Day" time spans.
 * Calculates anniversary dates, handles lookup margins, produces
 * human-readable time-ago labels, and selects random notes.
 */
import type { ReviewTimeSpan, ReviewEntry, ReviewGroup, ReviewConfig } from '../types/review';
import {
  extractCreatedDate,
  extractPreview,
  extractTags,
  extractTitle,
  getFileType,
} from './reviewFrontmatter';

// ─── Date arithmetic ─────────────────────────────────────────────────────────

/** Subtract a time span from a date, returning ISO date string */
export function subtractSpan(fromDate: Date, span: ReviewTimeSpan, multiplier: number = 1): string {
  const d = new Date(fromDate);
  const amount = span.number * multiplier;

  switch (span.unit) {
    case 'day':
      d.setDate(d.getDate() - amount);
      break;
    case 'week':
      d.setDate(d.getDate() - amount * 7);
      break;
    case 'month':
      d.setMonth(d.getMonth() - amount);
      break;
    case 'year':
      d.setFullYear(d.getFullYear() - amount);
      break;
  }

  return d.toISOString().slice(0, 10);
}

/** Get all target dates for a time span (recurring generates multiple) */
export function getTargetDates(
  referenceDate: Date,
  span: ReviewTimeSpan,
  maxYearsBack: number = 20
): string[] {
  if (!span.recurring) {
    return [subtractSpan(referenceDate, span)];
  }

  const dates: string[] = [];
  const earliest = new Date(referenceDate);
  earliest.setFullYear(earliest.getFullYear() - maxYearsBack);

  let multiplier = 1;
  while (true) {
    const target = subtractSpan(referenceDate, span, multiplier);
    if (new Date(target) < earliest) break;
    dates.push(target);
    multiplier++;
  }

  return dates;
}

/** Check if two dates match within a margin of days */
export function datesMatchWithMargin(
  noteDate: string,
  targetDate: string,
  margin: number
): boolean {
  if (margin === 0) {
    return sameMonthDay(noteDate, targetDate);
  }

  const note = new Date(noteDate);
  const target = new Date(targetDate);
  const diffMs = Math.abs(note.getTime() - target.getTime());
  const diffDays = Math.floor(diffMs / 86400000);
  return diffDays <= margin;
}

/** Check if two dates share the same month and day (anniversary match) */
export function sameMonthDay(dateA: string, dateB: string): boolean {
  return dateA.slice(5) === dateB.slice(5);
}

// ─── Time-ago labels ─────────────────────────────────────────────────────────

/** Format a time span as a human-readable label */
export function formatTimeSpanLabel(
  span: ReviewTimeSpan,
  multiplier: number = 1,
  humanize: boolean = true
): string {
  const n = span.number * multiplier;
  const unit = span.unit;

  if (humanize) {
    return humanizeTimeAgo(n, unit);
  }

  const plural = n !== 1 ? 's' : '';
  return `${n} ${unit}${plural} ago`;
}

/** Humanize a duration (e.g., 1 year → "a year ago", 12 months → "a year ago") */
export function humanizeTimeAgo(n: number, unit: string): string {
  if (unit === 'year' && n === 1) return 'A year ago';
  if (unit === 'year') return `${n} years ago`;
  if (unit === 'month' && n === 1) return 'A month ago';
  if (unit === 'month' && n === 6) return '6 months ago';
  if (unit === 'month' && n === 12) return 'A year ago';
  if (unit === 'month') return `${n} months ago`;
  if (unit === 'week' && n === 1) return 'A week ago';
  if (unit === 'week') return `${n} weeks ago`;
  if (unit === 'day' && n === 1) return 'Yesterday';
  if (unit === 'day' && n === 7) return 'A week ago';
  if (unit === 'day') return `${n} days ago`;
  return `${n} ${unit}(s) ago`;
}

/** Calculate time-ago string from a specific date to today */
export function timeAgoFromDate(createdDate: string, today: Date = new Date()): string {
  const created = new Date(createdDate);
  const diffMs = today.getTime() - created.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;

  const years = Math.floor(diffDays / 365);
  return years === 1 ? 'A year ago' : `${years} years ago`;
}

// ─── Note matching ───────────────────────────────────────────────────────────

export interface VaultNote {
  path: string;
  content: string;
}

/** Build a ReviewEntry from a vault note */
export function buildReviewEntry(
  note: VaultNote,
  createdDate: string,
  config: ReviewConfig
): ReviewEntry {
  return {
    path: note.path,
    title: extractTitle(note.content, note.path),
    createdDate,
    preview: extractPreview(note.content, config.previewLength),
    timeAgo: timeAgoFromDate(createdDate),
    tags: extractTags(note.content),
    fileType: getFileType(note.path),
  };
}

/** Match vault notes against configured time spans for a given reference date */
export function matchNotesToTimeSpans(
  notes: VaultNote[],
  config: ReviewConfig,
  referenceDate: Date = new Date()
): ReviewGroup[] {
  const groups: ReviewGroup[] = [];

  for (const span of config.timeSpans) {
    const targetDates = getTargetDates(referenceDate, span);

    for (let i = 0; i < targetDates.length; i++) {
      const targetDate = targetDates[i];
      const multiplier = i + 1;
      const entries: ReviewEntry[] = [];

      for (const note of notes) {
        if (shouldExcludeFile(note.path, config)) continue;

        const createdDate = extractCreatedDate(note.content, config.createdField);
        if (!createdDate) continue;

        if (datesMatchWithMargin(createdDate, targetDate, config.lookupMargin)) {
          entries.push(buildReviewEntry(note, createdDate, config));
        }
      }

      if (entries.length > 0) {
        groups.push({
          label: formatTimeSpanLabel(span, multiplier, config.humanizeTimeSpans),
          span,
          targetDate,
          entries,
        });
      }
    }
  }

  return groups;
}

/** Check if a file should be excluded based on config */
export function shouldExcludeFile(path: string, config: ReviewConfig): boolean {
  // Check excluded folders
  for (const folder of config.excludeFolders) {
    if (path.startsWith(folder + '/') || path.startsWith(folder + '\\')) {
      return true;
    }
  }

  // Check file extensions
  if (config.includeExtensions.length > 0) {
    const ext = getFileType(path);
    if (!config.includeExtensions.includes(ext)) return true;
  }

  return false;
}

// ─── Random note ─────────────────────────────────────────────────────────────

/** Pick a random note from the vault, excluding configured folders */
export function pickRandomNote(notes: VaultNote[], config: ReviewConfig): ReviewEntry | null {
  const eligible = notes.filter((n) => {
    if (shouldExcludeFile(n.path, config)) return false;
    const created = extractCreatedDate(n.content, config.createdField);
    return created !== null;
  });

  if (eligible.length === 0) return null;

  const idx = Math.floor(Math.random() * eligible.length);
  const note = eligible[idx];
  const created = extractCreatedDate(note.content, config.createdField)!;
  return buildReviewEntry(note, created, config);
}
