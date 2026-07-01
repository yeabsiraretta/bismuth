/**
 * Capacity Store — tracks daily capacity (used vs available hours),
 * workload utilization, and category time breakdown.
 */
import { derived } from 'svelte/store';
import { allCalendarItems, plannerSettings } from './calendarStore';
import { completedClocks } from '../services/timeClock';
import type { CalendarEvent } from '../types';
import type { DayCapacity } from '../types/prisma';

// ─── Date helpers ────────────────────────────────────────────────────────────

function formatDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getWeekDates(reference: Date): string[] {
  const start = new Date(reference);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return formatDateStr(d);
  });
}

// ─── Capacity computation ────────────────────────────────────────────────────

/** Compute scheduled minutes for events on a specific date */
function scheduledMinutesForDate(events: CalendarEvent[], date: string): number {
  return events
    .filter(e => e.date === date && e.durationMinutes)
    .reduce((sum, e) => sum + (e.durationMinutes ?? 0), 0);
}

/** Compute tracked (clock) minutes for a date */
function trackedMinutesForDate(
  clocks: Array<{ startedAt: string; durationMinutes: number | null; status: string }>,
  date: string,
): number {
  return clocks
    .filter(c => {
      if (c.status !== 'stopped' || c.durationMinutes === null) return false;
      const d = new Date(c.startedAt);
      return formatDateStr(d) === date;
    })
    .reduce((sum, c) => sum + (c.durationMinutes ?? 0), 0);
}

// ─── Derived stores ──────────────────────────────────────────────────────────

/** Capacity for today */
export const todayCapacity = derived(
  [allCalendarItems, completedClocks, plannerSettings],
  ([$items, $clocks, $settings]): DayCapacity => {
    const today = formatDateStr(new Date());
    const totalMinutes = $settings.workDayEnd - $settings.workDayStart;
    const scheduled = scheduledMinutesForDate($items, today);
    const tracked = trackedMinutesForDate($clocks, today);
    const remaining = Math.max(0, totalMinutes - scheduled);
    return {
      date: today,
      totalMinutes,
      scheduledMinutes: scheduled,
      trackedMinutes: tracked,
      remainingMinutes: remaining,
      utilization: totalMinutes > 0 ? Math.min(1, scheduled / totalMinutes) : 0,
    };
  },
);

/** Capacity for current week */
export const weekCapacity = derived(
  [allCalendarItems, completedClocks, plannerSettings],
  ([$items, $clocks, $settings]): DayCapacity[] => {
    const dates = getWeekDates(new Date());
    const totalPerDay = $settings.workDayEnd - $settings.workDayStart;

    return dates.map(date => {
      const scheduled = scheduledMinutesForDate($items, date);
      const tracked = trackedMinutesForDate($clocks, date);
      const remaining = Math.max(0, totalPerDay - scheduled);
      return {
        date,
        totalMinutes: totalPerDay,
        scheduledMinutes: scheduled,
        trackedMinutes: tracked,
        remainingMinutes: remaining,
        utilization: totalPerDay > 0 ? Math.min(1, scheduled / totalPerDay) : 0,
      };
    });
  },
);

/** Aggregate week totals */
export const weekTotals = derived(weekCapacity, ($week): {
  totalMinutes: number;
  scheduledMinutes: number;
  trackedMinutes: number;
  remainingMinutes: number;
  utilization: number;
} => {
  const total = $week.reduce((s, d) => s + d.totalMinutes, 0);
  const scheduled = $week.reduce((s, d) => s + d.scheduledMinutes, 0);
  const tracked = $week.reduce((s, d) => s + d.trackedMinutes, 0);
  return {
    totalMinutes: total,
    scheduledMinutes: scheduled,
    trackedMinutes: tracked,
    remainingMinutes: Math.max(0, total - scheduled),
    utilization: total > 0 ? Math.min(1, scheduled / total) : 0,
  };
});

/** Format minutes as "Xh Ym" */
export function formatCapacityTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Get utilization color class */
export function utilizationColor(ratio: number): string {
  if (ratio < 0.5) return 'var(--color-success, #16a34a)';
  if (ratio < 0.8) return 'var(--color-warning, #d97706)';
  return 'var(--color-error, #dc2626)';
}
