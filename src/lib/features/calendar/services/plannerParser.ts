/**
 * Daily note planner parser — extracts timed task entries from daily notes
 * and tasks with scheduled dates (Obsidian Tasks plugin format).
 *
 * Supported formats:
 *   - [ ] 10:00 - 11:30 Meeting with team
 *   - [x] 14:00 Write report
 *   - [ ] #task 08:00 - 10:00 Review ⏳ 2024-01-15
 *   - [ ] #task 11:00 Task [scheduled:: 2024-01-15]
 */

import { log } from '@/utils/logger';
import type { PlannerEntry, CalendarEvent } from '../types';

/**
 * Regex for timed task lines in daily notes.
 * Groups: 1=status(space/x), 2=startHH, 3=startMM, 4=endHH (optional), 5=endMM (optional), 6=text
 */
const TIMED_TASK_RE =
  /^- \[([ xX])\]\s*(?:#task\s+)?(\d{1,2}):(\d{2})(?:\s*-\s*(\d{1,2}):(\d{2}))?\s+(.+)$/;

/** Scheduled date shorthand: ⏳ YYYY-MM-DD */
const SCHEDULED_SHORT_RE = /[⏳]\s*(\d{4}-\d{2}-\d{2})/;

/** Scheduled date Dataview: [scheduled:: YYYY-MM-DD] */
const SCHEDULED_DV_RE = /\[scheduled::\s*(\d{4}-\d{2}-\d{2})\]/;

/** Scheduled date Dataview alt: (scheduled:: YYYY-MM-DD) */
const SCHEDULED_DV_ALT_RE = /\(scheduled::\s*(\d{4}-\d{2}-\d{2})\)/;

/**
 * Parse planner entries from a note's text content.
 * Looks for lines under the given heading (default "Day planner").
 */
export function parsePlannerEntries(
  content: string,
  sourcePath: string,
  plannerHeading: string = 'Day planner'
): PlannerEntry[] {
  const lines = content.split('\n');
  const entries: PlannerEntry[] = [];
  let inPlannerSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for heading
    if (line.startsWith('#')) {
      const headingText = line.replace(/^#+\s*/, '').trim();
      inPlannerSection = headingText.toLowerCase() === plannerHeading.toLowerCase();
      continue;
    }

    // Only parse task lines (with or without planner heading requirement)
    const match = TIMED_TASK_RE.exec(line);
    if (!match) continue;

    // If we're not in the planner section, only include if it has a scheduled date
    const scheduledDate = extractScheduledDate(match[6]);
    if (!inPlannerSection && !scheduledDate) continue;

    const completed = match[1] !== ' ';
    const startHour = parseInt(match[2], 10);
    const startMin = parseInt(match[3], 10);
    const startTime = `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`;

    let endTime: string | null = null;
    if (match[4] !== undefined && match[5] !== undefined) {
      const endHour = parseInt(match[4], 10);
      const endMin = parseInt(match[5], 10);
      endTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
    }

    // Clean text: remove scheduled date markers
    let text = match[6]
      .replace(SCHEDULED_SHORT_RE, '')
      .replace(SCHEDULED_DV_RE, '')
      .replace(SCHEDULED_DV_ALT_RE, '')
      .replace(/#task\s*/g, '')
      .trim();

    entries.push({
      text,
      completed,
      startTime,
      endTime,
      sourcePath,
      line: i + 1,
      scheduledDate: scheduledDate ?? undefined,
    });
  }

  // Infer end times: each entry without an end time lasts until the next entry starts
  for (let i = 0; i < entries.length; i++) {
    if (!entries[i].endTime && i < entries.length - 1) {
      entries[i].endTime = entries[i + 1].startTime;
    }
  }

  return entries;
}

/** Extract a scheduled date from a task text. */
function extractScheduledDate(text: string): string | null {
  const shortMatch = SCHEDULED_SHORT_RE.exec(text);
  if (shortMatch) return shortMatch[1];
  const dvMatch = SCHEDULED_DV_RE.exec(text);
  if (dvMatch) return dvMatch[1];
  const dvAltMatch = SCHEDULED_DV_ALT_RE.exec(text);
  if (dvAltMatch) return dvAltMatch[1];
  return null;
}

/** Convert a time string "HH:MM" to minutes from midnight. */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Convert planner entries to CalendarEvents for a specific date.
 * For daily notes, the date comes from the note's date.
 * For scheduled tasks, the date comes from the scheduledDate property.
 */
export function plannerEntriesToEvents(entries: PlannerEntry[], date: string): CalendarEvent[] {
  return entries.map((entry) => {
    const eventDate = entry.scheduledDate ?? date;
    const startMinute = timeToMinutes(entry.startTime);
    let durationMinutes: number | null = null;

    if (entry.endTime) {
      durationMinutes = timeToMinutes(entry.endTime) - startMinute;
      if (durationMinutes < 0) durationMinutes += 1440;
    } else {
      durationMinutes = 60; // default 1 hour
    }

    return {
      id: `planner-${entry.sourcePath}:${entry.line}`,
      title: entry.text,
      type: 'planner' as const,
      date: eventDate,
      startMinute,
      durationMinutes,
      completed: entry.completed,
      taskSourcePath: entry.sourcePath,
      taskLine: entry.line,
      readonly: false,
    };
  });
}

/**
 * Parse all timed tasks from vault tasks (with scheduled dates).
 * These are tasks that have both a time and a scheduled date property.
 */
export function parseScheduledTasks(
  tasks: Array<{
    text: string;
    source_path: string;
    line: number;
    scheduled_date: string | null;
    status: string;
  }>
): PlannerEntry[] {
  const entries: PlannerEntry[] = [];

  for (const task of tasks) {
    if (!task.scheduled_date) continue;

    const match = TIMED_TASK_RE.exec(`- [${task.status === 'done' ? 'x' : ' '}] ${task.text}`);
    if (!match) continue;

    const startHour = parseInt(match[2], 10);
    const startMin = parseInt(match[3], 10);
    const startTime = `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`;

    let endTime: string | null = null;
    if (match[4] !== undefined && match[5] !== undefined) {
      endTime = `${String(parseInt(match[4], 10)).padStart(2, '0')}:${String(parseInt(match[5], 10)).padStart(2, '0')}`;
    }

    entries.push({
      text: match[6]
        .replace(SCHEDULED_SHORT_RE, '')
        .replace(SCHEDULED_DV_RE, '')
        .replace(SCHEDULED_DV_ALT_RE, '')
        .trim(),
      completed: task.status === 'done',
      startTime,
      endTime,
      sourcePath: task.source_path,
      line: task.line,
      scheduledDate: task.scheduled_date,
    });
  }

  log.debug('Parsed scheduled tasks', { count: entries.length });
  return entries;
}
