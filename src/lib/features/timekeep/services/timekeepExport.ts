/**
 * Timekeep export — Markdown table, CSV, and JSON export formats.
 */

import type { TimekeepEntry, TimekeepData, TimekeepExportOptions } from '../types/timekeep';
import { DEFAULT_EXPORT_OPTIONS } from '../types/timekeep';
import {
  getEntryDurationWithSubs,
  getTotalDuration,
  formatDurationShort,
  formatTimestamp,
} from './timekeepService';

// ─── Markdown table export ──────────────────────────────────────────────────

export function exportAsMarkdown(
  data: TimekeepData,
  options?: Partial<TimekeepExportOptions>
): string {
  const opts = { ...DEFAULT_EXPORT_OPTIONS, ...options };
  const rows = flattenEntries(data.entries, opts.dateFormat, opts.includeSubEntries);
  const now = new Date();
  const total = formatDurationShort(getTotalDuration(data.entries, now));

  const lines: string[] = [
    '| Block | Start time | End time | Duration |',
    '| --- | --- | --- | --- |',
  ];

  for (const row of rows) {
    lines.push(`| ${row.name} | ${row.start} | ${row.end} | ${row.duration} |`);
  }

  lines.push(`| **Total** | | | **${total}** |`);
  return lines.join('\n');
}

// ─── CSV export ─────────────────────────────────────────────────────────────

export function exportAsCsv(data: TimekeepData, options?: Partial<TimekeepExportOptions>): string {
  const opts = { ...DEFAULT_EXPORT_OPTIONS, ...options };
  const rows = flattenEntries(data.entries, opts.dateFormat, opts.includeSubEntries);
  const lines: string[] = [];

  if (opts.includeHeaders) {
    lines.push('Block,Start time,End time,Duration');
  }

  for (const row of rows) {
    lines.push(
      `${escapeCsv(row.name)},${escapeCsv(row.start)},${escapeCsv(row.end)},${escapeCsv(row.duration)}`
    );
  }

  return lines.join('\n');
}

// ─── JSON export ────────────────────────────────────────────────────────────

export function exportAsJson(data: TimekeepData): string {
  return JSON.stringify(data);
}

// ─── Unified export ─────────────────────────────────────────────────────────

export function exportTimekeep(
  data: TimekeepData,
  options?: Partial<TimekeepExportOptions>
): string {
  const opts = { ...DEFAULT_EXPORT_OPTIONS, ...options };
  switch (opts.format) {
    case 'csv':
      return exportAsCsv(data, opts);
    case 'json':
      return exportAsJson(data);
    default:
      return exportAsMarkdown(data, opts);
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

interface FlatRow {
  name: string;
  start: string;
  end: string;
  duration: string;
}

function flattenEntries(
  entries: TimekeepEntry[],
  dateFormat: string,
  includeSubs: boolean,
  indent = 0
): FlatRow[] {
  const now = new Date();
  const rows: FlatRow[] = [];
  const prefix = indent > 0 ? '\u00A0\u00A0'.repeat(indent) + '\u2514 ' : '';

  for (const entry of entries) {
    const start = entry.startTime ? formatTimestamp(entry.startTime, dateFormat) : '';
    const end = entry.endTime
      ? formatTimestamp(entry.endTime, dateFormat)
      : entry.startTime
        ? 'running'
        : '';
    const duration = formatDurationShort(getEntryDurationWithSubs(entry, now));

    rows.push({ name: `${prefix}${entry.name}`, start, end, duration });

    if (includeSubs && entry.subEntries) {
      rows.push(...flattenEntries(entry.subEntries, dateFormat, true, indent + 1));
    }
  }

  return rows;
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
