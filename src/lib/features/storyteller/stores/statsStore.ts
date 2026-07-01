/**
 * Stats store — reactive state for writing goals, sprint, sessions, and analysis.
 */

import { writable, derived } from 'svelte/store';
import type { WritingGoals, WritingSprint, WritingStreak, WritingSession } from '../types/project';
import * as svc from '../services/statsService';

export const writingGoals = writable<WritingGoals>(svc.loadGoals());
export const writingSprint = writable<WritingSprint>(svc.loadSprint());
export const writingStreak = writable<WritingStreak>(svc.loadStreak());
export const writingSessions = writable<WritingSession[]>(svc.loadSessions());
export const statsRange = writable<7 | 30 | 90 | 365>(30);

export const goalProgress = derived(writingGoals, ($goals) => svc.getGoalProgress($goals));

export const rangedSessions = derived([writingSessions, statsRange], ([$sessions, $range]) =>
  svc.getSessionsByRange($range),
);

export const totalWordsInRange = derived(rangedSessions, ($sessions) =>
  $sessions.reduce((sum, s) => sum + s.wordsWritten, 0),
);

// ─── Goal actions ───────────────────────────────────────────────────────────

export function updateGoals(goals: WritingGoals): void {
  svc.saveGoals(goals);
  writingGoals.set(goals);
}

// ─── Sprint actions ─────────────────────────────────────────────────────────

export function startSprint(durationMinutes: number, currentWordCount: number): void {
  const sprint: WritingSprint = {
    isRunning: true, durationMinutes,
    startedAt: new Date().toISOString(),
    wordsAtStart: currentWordCount, wordsWritten: 0,
  };
  svc.saveSprint(sprint);
  writingSprint.set(sprint);
}

export function endSprint(currentWordCount: number): void {
  writingSprint.update(s => {
    const wordsWritten = Math.max(0, currentWordCount - s.wordsAtStart);
    const updated: WritingSprint = { ...s, isRunning: false, wordsWritten };
    svc.saveSprint(updated);
    if (wordsWritten > 0) {
      const minutes = s.durationMinutes;
      svc.recordSession(wordsWritten, minutes);
      svc.updateStreak();
      writingSessions.set(svc.loadSessions());
      writingStreak.set(svc.loadStreak());
    }
    return updated;
  });
}

export function cancelSprint(): void {
  const reset: WritingSprint = { isRunning: false, durationMinutes: 25, startedAt: null, wordsAtStart: 0, wordsWritten: 0 };
  svc.saveSprint(reset);
  writingSprint.set(reset);
}

// ─── Session recording ─────────────────────────────────────────────────────

export function recordWritingSession(wordsWritten: number, minutesWritten: number): void {
  svc.recordSession(wordsWritten, minutesWritten);
  svc.updateStreak();
  writingSessions.set(svc.loadSessions());
  writingStreak.set(svc.loadStreak());
}

export function setStatsRange(range: 7 | 30 | 90 | 365): void {
  statsRange.set(range);
}
