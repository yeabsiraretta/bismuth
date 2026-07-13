/**
 * Session tracking, daily history, streaks, sprint calculations,
 * and formatting helpers for the writing hub.
 */

import type { SprintEntry } from '@/hubs/creative/types/writing-types';

// ── Session / history tracking ───────────────────────────────────

/**
 * Get the ISO date key for today.
 */
export function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Get the ISO date key for a given Date.
 */
export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Record words to daily history (additive).
 */
export function recordDaily(
  history: Record<string, number>,
  date: string,
  words: number
): Record<string, number> {
  return {
    ...history,
    [date]: (history[date] ?? 0) + words,
  };
}

/**
 * Get the last N days of daily history (most recent first).
 */
export function getRecentDays(
  history: Record<string, number>,
  count: number
): { date: string; words: number }[] {
  const entries: { date: string; words: number }[] = [];
  const d = new Date();
  for (let i = 0; i < count; i++) {
    const key = dateKey(d);
    entries.push({ date: key, words: history[key] ?? 0 });
    d.setDate(d.getDate() - 1);
  }
  return entries;
}

/**
 * Compute current writing streak (consecutive days with > 0 words).
 */
export function computeStreak(history: Record<string, number>): number {
  let streak = 0;
  const d = new Date();
  // If today has no words, start from yesterday
  if (!history[dateKey(d)]) {
    d.setDate(d.getDate() - 1);
  }
  while (true) {
    const key = dateKey(d);
    if ((history[key] ?? 0) > 0) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Words written this week (Monday–today).
 */
export function thisWeekWords(history: Record<string, number>): number {
  const now = new Date();
  const dow = now.getDay();
  const daysSinceMonday = dow === 0 ? 6 : dow - 1;
  let total = 0;
  const d = new Date(now);
  for (let i = 0; i <= daysSinceMonday; i++) {
    total += history[dateKey(d)] ?? 0;
    d.setDate(d.getDate() - 1);
  }
  return total;
}

/**
 * Words written this month (1st–today).
 */
export function thisMonthWords(history: Record<string, number>): number {
  const now = new Date();
  const day = now.getDate();
  let total = 0;
  const d = new Date(now);
  for (let i = 0; i < day; i++) {
    total += history[dateKey(d)] ?? 0;
    d.setDate(d.getDate() - 1);
  }
  return total;
}

// ── Sprint calculations ──────────────────────────────────────────

/**
 * Compute words per minute from words and elapsed ms.
 */
export function computeWpm(words: number, elapsedMs: number): number {
  const minutes = elapsedMs / 60_000;
  if (minutes < 0.5) return 0;
  return Math.round(words / minutes);
}

/**
 * Create a sprint entry from completed sprint data.
 */
export function createSprintEntry(words: number, durationMs: number): SprintEntry {
  return {
    date: todayKey(),
    words,
    durationMs,
    wpm: computeWpm(words, durationMs),
  };
}

/**
 * Summarize sprint log: total count, words, avg wpm.
 */
function sprintSummary(sprints: SprintEntry[]): {
  count: number;
  totalWords: number;
  avgWpm: number;
  totalDurationMs: number;
} {
  if (sprints.length === 0) return { count: 0, totalWords: 0, avgWpm: 0, totalDurationMs: 0 };
  const totalWords = sprints.reduce((s, e) => s + e.words, 0);
  const totalMs = sprints.reduce((s, e) => s + e.durationMs, 0);
  const avgWpm = totalMs > 30_000 ? Math.round(totalWords / (totalMs / 60_000)) : 0;
  return { count: sprints.length, totalWords, avgWpm, totalDurationMs: totalMs };
}

// ── Formatting helpers ───────────────────────────────────────────

/**
 * Format seconds as MM:SS.
 */
export function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Format a number with locale-aware thousands separators.
 */
export function formatNumber(n: number): string {
  return n.toLocaleString();
}
