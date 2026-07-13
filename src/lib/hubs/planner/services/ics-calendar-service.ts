/**
 * ICS Calendar Service — import/export .ics (iCalendar) files for
 * Google Calendar / Apple Calendar / Outlook interop.
 *
 * Supports bidirectional sync via file-based ICS:
 * - Import: Parse .ics → CalendarEvent[]
 * - Export: CalendarEvent[] → .ics string (write to vault for sharing)
 */

import type { CalendarEvent, RecurrenceRule } from '@/hubs/planner/types/calendar-types';
import { log } from '@/utils/log/logger';

const icsLog = log.child('ics-calendar');

// ── Types ────────────────────────────────────────────────────────────────────

export interface IcsImportResult {
  events: CalendarEvent[];
  count: number;
  errors: string[];
}

export interface IcsExportOptions {
  calendarName?: string;
  includeCompleted?: boolean;
}

// ── ICS Parsing (Import) ─────────────────────────────────────────────────────

/**
 * Parse an ICS string into CalendarEvent[].
 * Supports VEVENT components with DTSTART, DTEND, SUMMARY, DESCRIPTION, LOCATION, RRULE.
 */
export function parseIcs(icsContent: string): IcsImportResult {
  const result: IcsImportResult = { events: [], count: 0, errors: [] };
  const lines = unfoldIcsLines(icsContent);

  let inEvent = false;
  let eventLines: string[] = [];

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      eventLines = [];
    } else if (line === 'END:VEVENT') {
      inEvent = false;
      try {
        const event = parseVEvent(eventLines);
        if (event) {
          result.events.push(event);
          result.count++;
        }
      } catch (e) {
        result.errors.push(`Failed to parse event: ${(e as Error).message}`);
      }
    } else if (inEvent) {
      eventLines.push(line);
    }
  }

  icsLog.info('ICS parsed', { events: result.count, errors: result.errors.length });
  return result;
}

/**
 * Unfold ICS continuation lines (lines starting with space/tab are continuations).
 */
function unfoldIcsLines(content: string): string[] {
  const raw = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const unfolded: string[] = [];
  for (const line of raw) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && unfolded.length > 0) {
      unfolded[unfolded.length - 1] += line.slice(1);
    } else {
      unfolded.push(line);
    }
  }
  return unfolded;
}

function getIcsProp(lines: string[], prop: string): string | null {
  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx < 0) continue;
    const key = line.slice(0, colonIdx).split(';')[0];
    if (key.toUpperCase() === prop.toUpperCase()) {
      return line.slice(colonIdx + 1);
    }
  }
  return null;
}

function parseIcsDateTime(value: string): { date: string; minutes: number | null } {
  // Format: YYYYMMDD or YYYYMMDDTHHmmSS or YYYYMMDDTHHmmSSZ
  const cleaned = value.replace('Z', '').trim();
  if (cleaned.length === 8) {
    // Date only
    const date = `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`;
    return { date, minutes: null };
  }
  // DateTime
  const date = `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`;
  const hours = parseInt(cleaned.slice(9, 11), 10);
  const mins = parseInt(cleaned.slice(11, 13), 10);
  return { date, minutes: hours * 60 + mins };
}

function parseDuration(
  startValue: string,
  endValue: string | null,
  durationValue: string | null
): number | null {
  if (endValue) {
    const start = parseIcsDateTime(startValue);
    const end = parseIcsDateTime(endValue);
    if (start.minutes != null && end.minutes != null) {
      if (start.date === end.date) return end.minutes - start.minutes;
      // Multi-day: approximate
      const days = daysBetween(start.date, end.date);
      return days * 1440 + (end.minutes - start.minutes);
    }
    // All-day events spanning multiple days
    const days = daysBetween(start.date, end.date);
    return days > 0 ? days * 1440 : null;
  }
  if (durationValue) {
    return parseIcsDuration(durationValue);
  }
  return null;
}

function daysBetween(d1: string, d2: string): number {
  const t1 = new Date(d1).getTime();
  const t2 = new Date(d2).getTime();
  return Math.round((t2 - t1) / 86400000);
}

function parseIcsDuration(dur: string): number | null {
  // Format: PT1H30M, P1D, PT45M, etc.
  const match = dur.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return null;
  const days = parseInt(match[1] || '0', 10);
  const hours = parseInt(match[2] || '0', 10);
  const minutes = parseInt(match[3] || '0', 10);
  return days * 1440 + hours * 60 + minutes;
}

function parseRRule(rruleStr: string): RecurrenceRule | undefined {
  const parts = rruleStr.split(';').reduce(
    (acc, p) => {
      const [k, v] = p.split('=');
      acc[k.toUpperCase()] = v;
      return acc;
    },
    {} as Record<string, string>
  );

  const freqMap: Record<string, RecurrenceRule['frequency']> = {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    YEARLY: 'yearly',
  };

  const freq = freqMap[parts['FREQ']];
  if (!freq) return undefined;

  const rule: RecurrenceRule = {
    frequency: freq,
    interval: parseInt(parts['INTERVAL'] || '1', 10),
  };

  if (parts['BYDAY']) {
    const dayMap: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
    rule.daysOfWeek = parts['BYDAY'].split(',').map((d) => dayMap[d] ?? 0);
  }

  if (parts['UNTIL']) {
    const { date } = parseIcsDateTime(parts['UNTIL']);
    rule.endDate = date;
  }

  return rule;
}

function parseVEvent(lines: string[]): CalendarEvent | null {
  const summary = getIcsProp(lines, 'SUMMARY');
  if (!summary) return null;

  const dtstart = getIcsProp(lines, 'DTSTART');
  if (!dtstart) return null;

  const dtend = getIcsProp(lines, 'DTEND');
  const duration = getIcsProp(lines, 'DURATION');
  const description = getIcsProp(lines, 'DESCRIPTION');
  const location = getIcsProp(lines, 'LOCATION');
  const uid = getIcsProp(lines, 'UID');
  const rrule = getIcsProp(lines, 'RRULE');

  const start = parseIcsDateTime(dtstart);
  const durationMinutes = parseDuration(dtstart, dtend, duration);

  const event: CalendarEvent = {
    id: uid ?? `ics-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: unescapeIcs(summary),
    type: 'event',
    date: start.date,
    startMinute: start.minutes,
    durationMinutes: durationMinutes,
    completed: false,
    description: description ? unescapeIcs(description) : undefined,
    location: location ? unescapeIcs(location) : undefined,
    recurring: rrule ? parseRRule(rrule) : undefined,
  };

  return event;
}

function unescapeIcs(text: string): string {
  return text
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

// ── ICS Export ───────────────────────────────────────────────────────────────

/**
 * Export CalendarEvent[] to an ICS string.
 */
export function exportToIcs(events: CalendarEvent[], options: IcsExportOptions = {}): string {
  const calName = options.calendarName ?? 'Bismuth Calendar';
  const filtered = options.includeCompleted ? events : events.filter((e) => !e.completed);

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//Bismuth//Calendar//EN`,
    `X-WR-CALNAME:${calName}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const event of filtered) {
    lines.push(...eventToVEvent(event));
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function eventToVEvent(event: CalendarEvent): string[] {
  const lines: string[] = ['BEGIN:VEVENT'];

  lines.push(`UID:${event.id}`);
  lines.push(`SUMMARY:${escapeIcs(event.title)}`);

  // DTSTART / DTEND
  const dtstart = formatIcsDateTime(event.date, event.startMinute);
  lines.push(`DTSTART:${dtstart}`);

  if (event.durationMinutes != null && event.startMinute != null) {
    const endMinute = event.startMinute + event.durationMinutes;
    const endHours = Math.floor(endMinute / 60);
    if (endHours < 24) {
      const dtend = formatIcsDateTime(event.date, endMinute);
      lines.push(`DTEND:${dtend}`);
    } else {
      // Overflow into next day
      const nextDate = addDays(event.date, Math.floor(endHours / 24));
      const dtend = formatIcsDateTime(nextDate, endMinute % 1440);
      lines.push(`DTEND:${dtend}`);
    }
  }

  if (event.description) lines.push(`DESCRIPTION:${escapeIcs(event.description)}`);
  if (event.location) lines.push(`LOCATION:${escapeIcs(event.location)}`);

  if (event.recurring) {
    lines.push(`RRULE:${formatRRule(event.recurring)}`);
  }

  lines.push(`DTSTAMP:${formatIcsDateTime(new Date().toISOString().slice(0, 10), 0)}`);
  lines.push('END:VEVENT');
  return lines;
}

function formatIcsDateTime(date: string, minutes: number | null): string {
  const d = date.replace(/-/g, '');
  if (minutes == null) return d;
  const h = String(Math.floor(minutes / 60)).padStart(2, '0');
  const m = String(minutes % 60).padStart(2, '0');
  return `${d}T${h}${m}00`;
}

function formatRRule(rule: RecurrenceRule): string {
  const freqMap: Record<RecurrenceRule['frequency'], string> = {
    daily: 'DAILY',
    weekly: 'WEEKLY',
    monthly: 'MONTHLY',
    yearly: 'YEARLY',
  };
  const parts = [`FREQ=${freqMap[rule.frequency]}`];
  if (rule.interval > 1) parts.push(`INTERVAL=${rule.interval}`);
  if (rule.daysOfWeek?.length) {
    const dayNames = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
    parts.push(`BYDAY=${rule.daysOfWeek.map((d) => dayNames[d]).join(',')}`);
  }
  if (rule.endDate) parts.push(`UNTIL=${rule.endDate.replace(/-/g, '')}`);
  return parts.join(';');
}

function escapeIcs(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// ── File-based Sync Helpers ──────────────────────────────────────────────────

/**
 * Import events from an ICS file content string and merge into existing events.
 * Returns only the new events that don't already exist (by UID match).
 */
export function mergeIcsImport(
  icsContent: string,
  existingEvents: CalendarEvent[]
): { newEvents: CalendarEvent[]; updatedEvents: CalendarEvent[]; result: IcsImportResult } {
  const parsed = parseIcs(icsContent);
  const existingIds = new Set(existingEvents.map((e) => e.id));

  const newEvents: CalendarEvent[] = [];
  const updatedEvents: CalendarEvent[] = [];

  for (const event of parsed.events) {
    if (existingIds.has(event.id)) {
      updatedEvents.push(event);
    } else {
      newEvents.push(event);
    }
  }

  icsLog.info('ICS merge', { new: newEvents.length, updated: updatedEvents.length });
  return { newEvents, updatedEvents, result: parsed };
}
