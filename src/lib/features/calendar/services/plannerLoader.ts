/**
 * Planner loader — reads daily notes and vault tasks,
 * parses planner entries, and populates the plannerEvents store.
 */

import { get } from 'svelte/store';
import { log } from '@/utils/logger';
import { readFileText } from '@/services/vault/vault';
import { getPeriodicNotesForRange } from '@/features/periodic';
import { calendarFocusDate, plannerSettings, plannerEvents } from '../stores/calendarStore';
import { parsePlannerEntries, plannerEntriesToEvents } from './plannerParser';

/**
 * Load planner entries from daily notes within the calendar's visible range.
 * Reads each daily note file, parses timed task lines under the configured
 * planner heading, and updates the plannerEvents store.
 */
export async function loadPlannerEvents(): Promise<void> {
  const focus = get(calendarFocusDate);
  const settings = get(plannerSettings);

  // Build a 30-day window around the focus date
  const start = new Date(focus);
  start.setDate(start.getDate() - 15);
  const end = new Date(focus);
  end.setDate(end.getDate() + 15);

  const startStr = toDateStr(start);
  const endStr = toDateStr(end);

  log.debug('Loading planner events', { startStr, endStr, heading: settings.plannerHeading });

  try {
    // Get paths of daily notes that exist in the range
    const notePaths = await getPeriodicNotesForRange(startStr, endStr, 'daily');
    if (!notePaths.length) {
      plannerEvents.set([]);
      return;
    }

    const allEvents = [];

    for (const notePath of notePaths) {
      try {
        const content = await readFileText(notePath);
        const dateFromPath = extractDateFromPath(notePath);
        if (!dateFromPath) continue;

        const entries = parsePlannerEntries(content, notePath, settings.plannerHeading);
        if (entries.length > 0) {
          const events = plannerEntriesToEvents(entries, dateFromPath);
          allEvents.push(...events);
        }
      } catch (err) {
        log.warn('Failed to read daily note for planner', { path: notePath, error: String(err) });
      }
    }

    plannerEvents.set(allEvents);
    log.info('Planner events loaded', { count: allEvents.length, notes: notePaths.length });
  } catch (err) {
    log.error('Failed to load planner events', err instanceof Error ? err : new Error(String(err)));
    plannerEvents.set([]);
  }
}

/**
 * Extract a YYYY-MM-DD date string from a daily note path.
 * Supports common patterns like "2024-01-15.md", "daily/2024-01-15.md", etc.
 */
function extractDateFromPath(path: string): string | null {
  const match = /(\d{4}-\d{2}-\d{2})\.md$/.exec(path);
  return match ? match[1] : null;
}

function toDateStr(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Auto-refresh timer handle. */
let refreshTimerId: ReturnType<typeof setInterval> | null = null;

/**
 * Start watching for planner updates.
 * Loads initially and refreshes every 2 minutes.
 */
export function startPlannerSync(): void {
  stopPlannerSync();
  void loadPlannerEvents();
  refreshTimerId = setInterval(
    () => {
      void loadPlannerEvents();
    },
    2 * 60 * 1000
  );
  log.info('Planner sync started');
}

/** Stop planner sync. */
export function stopPlannerSync(): void {
  if (refreshTimerId) {
    clearInterval(refreshTimerId);
    refreshTimerId = null;
  }
}
