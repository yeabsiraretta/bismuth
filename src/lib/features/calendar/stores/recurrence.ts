/**
 * Recurring event expansion utility.
 * Pure function — no store or service imports.
 * Generates CalendarEvent instances for all dates a recurring event falls on
 * within the given [start, end] date range (inclusive).
 */
import type { CalendarEvent } from '../types';

/**
 * Expands recurring events into individual event instances within [start, end].
 * Non-recurring events pass through unchanged.
 */
export function expandRecurringEvents(
  events: CalendarEvent[],
  start: Date,
  end: Date
): CalendarEvent[] {
  const result: CalendarEvent[] = [];

  for (const event of events) {
    if (!event.recurring) {
      // Non-recurring: include only if date falls in range
      if (event.date >= toDateStr(start) && event.date <= toDateStr(end)) {
        result.push(event);
      }
      continue;
    }

    const { frequency, interval, daysOfWeek, endDate } = event.recurring;
    const originDate = parseDate(event.date);
    const effectiveEnd = endDate ? earliest(parseDate(endDate), end) : end;
    // For monthly/yearly, remember the intended day-of-month from origin
    const originDay = originDate.getDate();

    let cursor = new Date(originDate);

    while (cursor <= effectiveEnd) {
      const cursorStr = toDateStr(cursor);

      if (cursor >= start && cursor <= effectiveEnd) {
        const shouldInclude =
          frequency !== 'weekly' ||
          !daysOfWeek?.length ||
          daysOfWeek.includes(cursor.getDay());

        if (shouldInclude) {
          result.push({
            ...event,
            id: `${event.id}::${cursorStr}`,
            date: cursorStr,
          });
        }
      }

      cursor = advanceWithOrigin(cursor, frequency, interval, originDay);

      // Safety: never run more than 3650 iterations per event
      if (cursor > addDays(start, 3650)) break;
    }
  }

  return result;
}

function advanceWithOrigin(d: Date, frequency: string, interval: number, originDay: number): Date {
  if (frequency === 'daily') {
    const next = new Date(d);
    next.setDate(next.getDate() + interval);
    return next;
  }
  if (frequency === 'weekly') {
    const next = new Date(d);
    next.setDate(next.getDate() + 7 * interval);
    return next;
  }
  if (frequency === 'monthly') {
    // Always compute from origin day to avoid drift after clamping
    const nextMonth = d.getMonth() + interval;
    const nextYear = d.getFullYear() + Math.floor(nextMonth / 12);
    const normalizedMonth = ((nextMonth % 12) + 12) % 12;
    const next = new Date(nextYear, normalizedMonth, 1);
    const daysInMonth = new Date(nextYear, normalizedMonth + 1, 0).getDate();
    next.setDate(Math.min(originDay, daysInMonth));
    return next;
  }
  if (frequency === 'yearly') {
    const next = new Date(d);
    next.setFullYear(next.getFullYear() + interval);
    return next;
  }
  return new Date(d);
}

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function earliest(a: Date, b: Date): Date {
  return a < b ? a : b;
}

function addDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}
