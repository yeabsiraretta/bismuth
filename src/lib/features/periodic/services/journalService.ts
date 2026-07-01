/**
 * Journal management service — period calculation, note path resolution,
 * note creation with frontmatter, and index computation.
 */

import type {
  JournalConfig,
  PeriodType,
  TemplateContext,
} from '../types';
import { resolveTemplateVars, formatDate } from './templateVars';

/** Parse a YYYY-MM-DD string as local midnight (not UTC). */
function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// ─── Period Boundaries ────────────────────────────────────────────────────

/** Get the start and end dates for the period containing `date`. */
export function getPeriodBounds(
  date: Date,
  journal: JournalConfig,
): { start: Date; end: Date } {
  const type = journal.type;

  if (type === 'daily') {
    return { start: new Date(date), end: new Date(date) };
  }

  if (type === 'weekly') {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return { start, end };
  }

  if (type === 'monthly') {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return { start, end };
  }

  if (type === 'quarterly') {
    const qStart = Math.floor(date.getMonth() / 3) * 3;
    const start = new Date(date.getFullYear(), qStart, 1);
    const end = new Date(date.getFullYear(), qStart + 3, 0);
    return { start, end };
  }

  if (type === 'yearly') {
    const start = new Date(date.getFullYear(), 0, 1);
    const end = new Date(date.getFullYear(), 11, 31);
    return { start, end };
  }

  // Custom interval
  if (type === 'custom' && journal.customInterval) {
    return getCustomPeriodBounds(date, journal);
  }

  return { start: new Date(date), end: new Date(date) };
}

function getCustomPeriodBounds(
  date: Date,
  journal: JournalConfig,
): { start: Date; end: Date } {
  const { every, unit } = journal.customInterval!;
  const anchor = journal.startDate ? parseLocalDate(journal.startDate) : new Date(date.getFullYear(), 0, 1);

  let periodStart = new Date(anchor);
  let periodEnd = advanceDate(periodStart, every, unit);

  // Walk forward until we find the period containing `date`
  while (periodEnd <= date) {
    periodStart = new Date(periodEnd);
    periodEnd = advanceDate(periodStart, every, unit);
  }

  // Adjust if date is before anchor
  if (date < anchor) {
    periodEnd = new Date(anchor);
    periodStart = advanceDate(periodEnd, -every, unit);
  }

  // end is inclusive (last day of period)
  const end = new Date(periodEnd);
  end.setDate(end.getDate() - 1);

  return { start: periodStart, end };
}

function advanceDate(date: Date, amount: number, unit: string): Date {
  const result = new Date(date);
  switch (unit) {
    case 'day': result.setDate(result.getDate() + amount); break;
    case 'week': result.setDate(result.getDate() + amount * 7); break;
    case 'month': result.setMonth(result.getMonth() + amount); break;
  }
  return result;
}

// ─── Index Computation ────────────────────────────────────────────────────

/** Compute the index number for a journal entry at a given date. */
export function computeIndex(date: Date, journal: JournalConfig): number | null {
  const idx = journal.indexConfig;
  if (!idx) return null;

  const anchor = parseLocalDate(idx.anchorDate);
  const type = journal.type;

  if (type === 'custom' && journal.customInterval) {
    return computeCustomIndex(date, anchor, journal, idx.startIndex);
  }

  const periods = countPeriodsBetween(anchor, date, type as PeriodType);
  let index = idx.startIndex + periods;

  if (idx.resetMode === 'yearly') {
    const yearStart = new Date(date.getFullYear(), 0, 1);
    const periodsThisYear = countPeriodsBetween(yearStart, date, type as PeriodType);
    index = idx.startIndex + periodsThisYear;
  }

  if (idx.resetMode !== 'continuous' && idx.resetAfter && idx.resetAfter > 0) {
    index = idx.startIndex + ((index - idx.startIndex) % idx.resetAfter);
  }

  return index;
}

function computeCustomIndex(
  date: Date,
  anchor: Date,
  journal: JournalConfig,
  startIndex: number,
): number {
  const { every, unit } = journal.customInterval!;
  let count = 0;
  let current = new Date(anchor);

  if (date >= anchor) {
    while (current <= date) {
      current = advanceDate(current, every, unit);
      if (current <= date) count++;
    }
  }

  return startIndex + count;
}

function countPeriodsBetween(from: Date, to: Date, type: PeriodType): number {
  const diffMs = to.getTime() - from.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  switch (type) {
    case 'daily': return diffDays;
    case 'weekly': return Math.floor(diffDays / 7);
    case 'monthly': return (to.getFullYear() - from.getFullYear()) * 12 + to.getMonth() - from.getMonth();
    case 'quarterly': return Math.floor(countPeriodsBetween(from, to, 'monthly') / 3);
    case 'yearly': return to.getFullYear() - from.getFullYear();
    default: return 0;
  }
}

// ─── Note Path Resolution ─────────────────────────────────────────────────

/** Build the full file path for a journal note. */
export function resolveNotePath(date: Date, journal: JournalConfig): string {
  const { start, end } = getPeriodBounds(date, journal);
  const index = computeIndex(date, journal);

  const ctx: TemplateContext = {
    date,
    startDate: start,
    endDate: end,
    journal,
    index,
  };

  const folder = resolveTemplateVars(journal.folder, ctx);
  const name = resolveTemplateVars(journal.nameTemplate, ctx);

  // Set noteName for any downstream usage
  ctx.noteName = name;

  const cleanFolder = folder.replace(/^\/+|\/+$/g, '');
  const cleanName = name.replace(/[\\/:*?"<>|]/g, '_');

  return `${cleanFolder}/${cleanName}.md`;
}

// ─── Frontmatter Generation ───────────────────────────────────────────────

/** Build frontmatter YAML for a journal note. */
export function buildFrontmatter(
  date: Date,
  journal: JournalConfig,
): string {
  const fm = journal.frontmatter;
  const { start, end } = getPeriodBounds(date, journal);
  const index = computeIndex(date, journal);
  const lines: string[] = ['---'];

  if (fm.journalField) {
    lines.push(`${fm.journalField}: "${journal.name}"`);
  }

  if (fm.dateField) {
    lines.push(`${fm.dateField}: ${formatDate(date, journal.dateFormat)}`);
  }

  if (fm.addStartEndDates) {
    lines.push(`start_date: ${formatDate(start, 'YYYY-MM-DD')}`);
    lines.push(`end_date: ${formatDate(end, 'YYYY-MM-DD')}`);
  }

  if (fm.indexField && index !== null) {
    lines.push(`${fm.indexField}: ${index}`);
  }

  lines.push('---');
  return lines.join('\n');
}

// ─── Re-exports from journalNoteCreator ───────────────────────────────────

export { createJournalNote, navigatePeriod } from './journalNoteCreator';
