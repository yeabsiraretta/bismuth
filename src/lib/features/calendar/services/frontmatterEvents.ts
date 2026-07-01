/**
 * Frontmatter Events — scans vault notes and extracts calendar events
 * from frontmatter date properties. Turns any note with a date into
 * a draggable calendar event (Prisma Calendar style).
 */
import type { CalendarEvent } from '../types';
import type { FrontmatterEventConfig, FrontmatterEvent } from '../types/prisma';
import { DEFAULT_FM_EVENT_CONFIG } from '../types/prisma';

// ─── Date parsing ────────────────────────────────────────────────────────────

/** Parse ISO date or datetime string to { date, startMinute, durationMinutes } */
export function parseFrontmatterDate(value: unknown): {
  date: string; startMinute: number | null; isAllDay: boolean;
} | null {
  if (!value || typeof value !== 'string') return null;
  const s = value.trim();

  // ISO datetime: 2025-06-15T09:00 or 2025-06-15T09:00:00
  const dtMatch = s.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/);
  if (dtMatch) {
    const date = dtMatch[1];
    const hours = parseInt(dtMatch[2], 10);
    const minutes = parseInt(dtMatch[3], 10);
    return { date, startMinute: hours * 60 + minutes, isAllDay: false };
  }

  // Plain date: 2025-06-15
  const dateMatch = s.match(/^(\d{4}-\d{2}-\d{2})$/);
  if (dateMatch) return { date: dateMatch[1], startMinute: null, isAllDay: true };

  return null;
}

/** Compute duration in minutes between two datetime strings */
export function computeDuration(
  startVal: unknown,
  endVal: unknown,
): number | null {
  if (!startVal || !endVal || typeof startVal !== 'string' || typeof endVal !== 'string') return null;
  const start = new Date(startVal);
  const end = new Date(endVal);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
  const diff = (end.getTime() - start.getTime()) / 60000;
  return diff > 0 ? Math.round(diff) : null;
}

// ─── Single note extraction ──────────────────────────────────────────────────

export interface NoteWithFrontmatter {
  path: string;
  title: string;
  frontmatter: Record<string, unknown>;
}

/** Extract a calendar event from a note's frontmatter */
export function extractFrontmatterEvent(
  note: NoteWithFrontmatter,
  config: FrontmatterEventConfig = DEFAULT_FM_EVENT_CONFIG,
): FrontmatterEvent | null {
  const fm = note.frontmatter;
  if (!fm) return null;

  // Try start/end datetime
  const startParsed = parseFrontmatterDate(fm[config.startProperty]);
  const dateParsed = parseFrontmatterDate(fm[config.dateProperty]);
  const parsed = startParsed ?? dateParsed;

  if (!parsed) return null;

  const isAllDay = fm[config.allDayProperty] === true || parsed.isAllDay;
  const duration = computeDuration(
    fm[config.startProperty],
    fm[config.endProperty],
  );

  // Map additional fields
  const event: FrontmatterEvent = {
    id: `fm-${note.path}`,
    title: note.title,
    type: 'event',
    date: parsed.date,
    startMinute: isAllDay ? null : parsed.startMinute,
    durationMinutes: isAllDay ? null : (duration ?? 60),
    completed: false,
    notePath: note.path,
    valid: true,
    linkedNotePaths: [note.path],
  };

  // Apply field mappings
  for (const [fmKey, eventField] of Object.entries(config.fieldMappings)) {
    const val = fm[fmKey];
    if (val !== undefined && val !== null) {
      (event as unknown as Record<string, unknown>)[eventField] = String(val);
    }
  }

  return event;
}

// ─── Batch extraction ────────────────────────────────────────────────────────

/** Extract events from multiple notes */
export function extractAllFrontmatterEvents(
  notes: NoteWithFrontmatter[],
  config: FrontmatterEventConfig = DEFAULT_FM_EVENT_CONFIG,
): FrontmatterEvent[] {
  const events: FrontmatterEvent[] = [];
  for (const note of notes) {
    if (config.folder && !note.path.startsWith(config.folder)) continue;
    const event = extractFrontmatterEvent(note, config);
    if (event) events.push(event);
  }
  return events;
}

/** Apply smart category rules to events */
export function applySmartCategories(
  events: CalendarEvent[],
  rules: Array<{ pattern: string; categoryId: string }>,
): CalendarEvent[] {
  if (!rules.length) return events;
  return events.map(e => {
    if (e.categoryId) return e;
    for (const rule of rules) {
      if (e.title.toLowerCase().includes(rule.pattern.toLowerCase())) {
        return { ...e, categoryId: rule.categoryId };
      }
    }
    return e;
  });
}
