/**
 * Stats service — word tracking, sprint, pacing analysis, plot holes, prose analysis.
 */

import type { WritingSession, WritingStreak, WritingSprint, WritingGoals } from '../types/project';
import type { PlotHoleWarning, PlotHoleCategory } from '../types/project';
import type { StorytellerEntity, SceneEntity } from '../types/entity';
import type { SetupPayoff } from '../types/plotline';
import { DEFAULT_WRITING_GOALS } from '../types/project';

const SESSIONS_KEY = 'bismuth-storyteller-writing-sessions';
const STREAK_KEY = 'bismuth-storyteller-writing-streak';
const GOALS_KEY = 'bismuth-storyteller-writing-goals';
const SPRINT_KEY = 'bismuth-storyteller-writing-sprint';

// ─── Writing sessions ───────────────────────────────────────────────────────

export function loadSessions(): WritingSession[] {
  try {
    const r = localStorage.getItem(SESSIONS_KEY);
    return r ? JSON.parse(r) : [];
  } catch {
    return [];
  }
}

export function persistSessions(sessions: WritingSession[]): void {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch {
    /* */
  }
}

export function recordSession(wordsWritten: number, minutesWritten: number): WritingSession {
  const today = new Date().toISOString().slice(0, 10);
  const sessions = loadSessions();
  const existing = sessions.find((s) => s.date === today);
  if (existing) {
    existing.wordsWritten += wordsWritten;
    existing.minutesWritten += minutesWritten;
    existing.sessionsCount++;
    persistSessions(sessions);
    return existing;
  }
  const session: WritingSession = { date: today, wordsWritten, minutesWritten, sessionsCount: 1 };
  persistSessions([...sessions, session]);
  return session;
}

export function getSessionsByRange(days: number): WritingSession[] {
  const sessions = loadSessions();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return sessions.filter((s) => s.date >= cutoffStr);
}

// ─── Writing streak ─────────────────────────────────────────────────────────

export function loadStreak(): WritingStreak {
  try {
    const r = localStorage.getItem(STREAK_KEY);
    return r ? JSON.parse(r) : { currentDays: 0, longestDays: 0, lastWritingDate: null };
  } catch {
    return { currentDays: 0, longestDays: 0, lastWritingDate: null };
  }
}

export function updateStreak(): WritingStreak {
  const streak = loadStreak();
  const today = new Date().toISOString().slice(0, 10);
  if (streak.lastWritingDate === today) return streak;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  if (streak.lastWritingDate === yesterdayStr) {
    streak.currentDays++;
  } else {
    streak.currentDays = 1;
  }
  streak.longestDays = Math.max(streak.longestDays, streak.currentDays);
  streak.lastWritingDate = today;
  try {
    localStorage.setItem(STREAK_KEY, JSON.stringify(streak));
  } catch {
    /* */
  }
  return streak;
}

// ─── Writing goals ──────────────────────────────────────────────────────────

export function loadGoals(): WritingGoals {
  try {
    const r = localStorage.getItem(GOALS_KEY);
    return r ? { ...DEFAULT_WRITING_GOALS, ...JSON.parse(r) } : { ...DEFAULT_WRITING_GOALS };
  } catch {
    return { ...DEFAULT_WRITING_GOALS };
  }
}

export function saveGoals(goals: WritingGoals): void {
  try {
    localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
  } catch {
    /* */
  }
}

// ─── Sprint ─────────────────────────────────────────────────────────────────

export function loadSprint(): WritingSprint {
  try {
    const r = localStorage.getItem(SPRINT_KEY);
    return r
      ? JSON.parse(r)
      : {
          isRunning: false,
          durationMinutes: 25,
          startedAt: null,
          wordsAtStart: 0,
          wordsWritten: 0,
        };
  } catch {
    return {
      isRunning: false,
      durationMinutes: 25,
      startedAt: null,
      wordsAtStart: 0,
      wordsWritten: 0,
    };
  }
}

export function saveSprint(sprint: WritingSprint): void {
  try {
    localStorage.setItem(SPRINT_KEY, JSON.stringify(sprint));
  } catch {
    /* */
  }
}

// ─── Goal progress ──────────────────────────────────────────────────────────

export function getGoalProgress(goals: WritingGoals): {
  daily: number;
  weekly: number;
  monthly: number;
} {
  const today = new Date().toISOString().slice(0, 10);
  const sessions = loadSessions();
  const todaySession = sessions.find((s) => s.date === today);
  const dailyWords = todaySession?.wordsWritten ?? 0;
  const weekSessions = getSessionsByRange(7);
  const weeklyWords = weekSessions.reduce((sum, s) => sum + s.wordsWritten, 0);
  const monthSessions = getSessionsByRange(30);
  const monthlyWords = monthSessions.reduce((sum, s) => sum + s.wordsWritten, 0);
  return {
    daily: goals.dailyTarget > 0 ? Math.min(1, dailyWords / goals.dailyTarget) : 0,
    weekly: goals.weeklyTarget > 0 ? Math.min(1, weeklyWords / goals.weeklyTarget) : 0,
    monthly: goals.monthlyTarget > 0 ? Math.min(1, monthlyWords / goals.monthlyTarget) : 0,
  };
}

// ─── Pacing analysis ────────────────────────────────────────────────────────

export interface PacingData {
  sceneId: string;
  sceneName: string;
  wordCount: number;
  avgWordCount: number;
  deviation: number;
}

export function analyzePacing(scenes: SceneEntity[]): PacingData[] {
  const total = scenes.reduce((s, sc) => s + (sc.wordCount ?? 0), 0);
  const avg = scenes.length > 0 ? total / scenes.length : 0;
  return scenes.map((sc) => ({
    sceneId: sc.id,
    sceneName: sc.name,
    wordCount: sc.wordCount ?? 0,
    avgWordCount: Math.round(avg),
    deviation: avg > 0 ? ((sc.wordCount ?? 0) - avg) / avg : 0,
  }));
}

// ─── Plot hole detection ────────────────────────────────────────────────────

export function detectPlotHoles(
  scenes: StorytellerEntity[],
  entities: StorytellerEntity[],
  setups: SetupPayoff[],
  storyId: string
): PlotHoleWarning[] {
  const warnings: PlotHoleWarning[] = [];
  const storySetups = setups.filter((s) => s.storyId === storyId);
  for (const setup of storySetups) {
    if (!setup.resolved && !setup.payoffSceneId) {
      warnings.push({
        id: `unresolved-${setup.id}`,
        category: 'unresolved-setup',
        severity: 'warning',
        message: `Unresolved setup: "${setup.description}"`,
        sceneIds: [setup.setupSceneId],
        entityIds: [],
      });
    }
  }
  const sceneCharacters = new Set<string>();
  for (const scene of scenes) {
    if (scene.tags) scene.tags.forEach((t) => sceneCharacters.add(t));
  }
  const characters = entities.filter((e) => e.type === 'character' && e.storyId === storyId);
  for (const char of characters) {
    const referenced = scenes.some(
      (s) => s.tags?.includes(char.name.toLowerCase()) || s.description?.includes(char.name)
    );
    if (!referenced) {
      warnings.push({
        id: `missing-char-${char.id}`,
        category: 'missing-character',
        severity: 'info',
        message: `Character "${char.name}" is never referenced in any scene`,
        sceneIds: [],
        entityIds: [char.id],
      });
    }
  }
  return warnings;
}

// ─── Prose readability ──────────────────────────────────────────────────────

export interface ReadabilityScore {
  avgSentenceLength: number;
  avgWordLength: number;
  dialogueRatio: number;
  uniqueWordRatio: number;
}

export function analyzeReadability(text: string): ReadabilityScore {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const dialogueChars = (text.match(/"[^"]*"/g) ?? []).join('').length;
  const uniqueWords = new Set(words.map((w) => w.toLowerCase().replace(/[^a-z]/g, '')));
  return {
    avgSentenceLength: sentences.length > 0 ? words.length / sentences.length : 0,
    avgWordLength: words.length > 0 ? words.reduce((s, w) => s + w.length, 0) / words.length : 0,
    dialogueRatio: text.length > 0 ? dialogueChars / text.length : 0,
    uniqueWordRatio: words.length > 0 ? uniqueWords.size / words.length : 0,
  };
}
