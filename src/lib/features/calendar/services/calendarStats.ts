/**
 * Calendar Statistics — category breakdowns, time insights,
 * streak tracking, and busiest-day analysis.
 */
import type { CalendarEvent, CalendarCategory } from '../types';
import type { CalendarStats, CategoryStat, StatsTimeRange } from '../types/prisma';
import { DEFAULT_CALENDAR_CATEGORIES } from '../types';

// ─── Date filtering ──────────────────────────────────────────────────────────

export function filterEventsByRange(
  events: CalendarEvent[],
  range: StatsTimeRange,
  referenceDate: Date = new Date()
): CalendarEvent[] {
  if (range === 'all') return events;

  const refStr = formatDateStr(referenceDate);

  if (range === 'day') {
    return events.filter((e) => e.date === refStr);
  }

  if (range === 'week') {
    const start = new Date(referenceDate);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return events.filter((e) => e.date >= formatDateStr(start) && e.date <= formatDateStr(end));
  }

  // month
  const y = referenceDate.getFullYear();
  const m = referenceDate.getMonth();
  const startStr = `${y}-${String(m + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(y, m + 1, 0).getDate();
  const endStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return events.filter((e) => e.date >= startStr && e.date <= endStr);
}

// ─── Category breakdown ──────────────────────────────────────────────────────

export function computeCategoryBreakdown(
  events: CalendarEvent[],
  categories: CalendarCategory[] = DEFAULT_CALENDAR_CATEGORIES
): CategoryStat[] {
  const catMap = new Map<string, { count: number; minutes: number }>();

  for (const e of events) {
    const catId = e.categoryId || 'other';
    const entry = catMap.get(catId) || { count: 0, minutes: 0 };
    entry.count++;
    entry.minutes += e.durationMinutes ?? 0;
    catMap.set(catId, entry);
  }

  const totalMinutes = [...catMap.values()].reduce((s, v) => s + v.minutes, 0);

  return [...catMap.entries()]
    .map(([catId, data]) => {
      const cat = categories.find((c) => c.id === catId);
      return {
        categoryId: catId,
        categoryName: cat?.name ?? catId,
        color: cat?.color ?? 'var(--text-muted)',
        eventCount: data.count,
        totalMinutes: data.minutes,
        percentage: totalMinutes > 0 ? Math.round((data.minutes / totalMinutes) * 100) : 0,
      };
    })
    .sort((a, b) => b.totalMinutes - a.totalMinutes);
}

// ─── Streak tracking ─────────────────────────────────────────────────────────

export function computeStreaks(events: CalendarEvent[]): {
  currentStreak: number;
  longestStreak: number;
} {
  if (!events.length) return { currentStreak: 0, longestStreak: 0 };

  const dates = new Set(events.map((e) => e.date));
  const sorted = [...dates].sort();
  if (!sorted.length) return { currentStreak: 0, longestStreak: 0 };

  let longest = 1;
  let current = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    if (diffDays === 1) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  // Check if streak extends to today
  const today = formatDateStr(new Date());
  const lastDate = sorted[sorted.length - 1];
  const diffToToday = Math.round(
    (new Date(today).getTime() - new Date(lastDate).getTime()) / 86400000
  );
  if (diffToToday > 1) current = 0;

  return { currentStreak: current, longestStreak: longest };
}

// ─── Busiest day ─────────────────────────────────────────────────────────────

export function findBusiestDay(events: CalendarEvent[]): { date: string; count: number } | null {
  if (!events.length) return null;
  const counts = new Map<string, number>();
  for (const e of events) counts.set(e.date, (counts.get(e.date) ?? 0) + 1);
  let busiest = { date: '', count: 0 };
  for (const [date, count] of counts) {
    if (count > busiest.count) busiest = { date, count };
  }
  return busiest.count > 0 ? busiest : null;
}

// ─── Full stats ──────────────────────────────────────────────────────────────

export function computeCalendarStats(
  events: CalendarEvent[],
  categories?: CalendarCategory[],
  range: StatsTimeRange = 'all',
  referenceDate?: Date
): CalendarStats {
  const filtered = filterEventsByRange(events, range, referenceDate);
  const totalMinutes = filtered.reduce((s, e) => s + (e.durationMinutes ?? 0), 0);
  const completedCount = filtered.filter((e) => e.completed).length;
  const uniqueDays = new Set(filtered.map((e) => e.date)).size;
  const { currentStreak, longestStreak } = computeStreaks(filtered);

  return {
    totalEvents: filtered.length,
    totalMinutes,
    completedCount,
    completionRate: filtered.length > 0 ? Math.round((completedCount / filtered.length) * 100) : 0,
    categoryBreakdown: computeCategoryBreakdown(filtered, categories),
    busiestDay: findBusiestDay(filtered),
    averageEventsPerDay: uniqueDays > 0 ? Math.round((filtered.length / uniqueDays) * 10) / 10 : 0,
    currentStreak,
    longestStreak,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
