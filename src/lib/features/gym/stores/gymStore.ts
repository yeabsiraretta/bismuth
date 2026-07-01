/**
 * Gym store — reactive state for workout sessions, exercises, nutrition, and weekly volume.
 */
import { writable, get } from 'svelte/store';
import type { Writable } from 'svelte/store';
import { log } from '@/utils/logger';
import type {
  Exercise,
  WorkoutSession,
  WorkoutSet,
  NutritionEntry,
  VolumeEntry,
} from '../types/gym';
import * as gymService from '../services/gym';

/** All available exercises (built-in + custom) */
export const exerciseList: Writable<Exercise[]> = writable([]);

/** The currently active workout session for today */
export const activeSession: Writable<WorkoutSession | null> = writable(null);

/** Nutrition entries logged for today */
export const todayNutrition: Writable<NutritionEntry[]> = writable([]);

/** Weekly volume by muscle group */
export const weeklyVolume: Writable<VolumeEntry[]> = writable([]);

/** Loading indicator */
export const isLoading: Writable<boolean> = writable(false);

/** Timestamp when the active session started (for duration tracking) */
export const sessionStartTime: Writable<number | null> = writable(null);

/** Loads the exercise list from the Rust backend. */
export async function loadExercises(vaultRoot: string): Promise<void> {
  isLoading.set(true);
  try {
    const exercises = await gymService.listExercises(vaultRoot);
    exerciseList.set(exercises);
    log.info('Gym exercises loaded', { count: exercises.length });
  } catch (err) {
    log.error('Failed to load exercises', err as Error);
  } finally {
    isLoading.set(false);
  }
}

/** Loads today's session for a vault (or null if none). */
export async function loadTodaySession(vaultRoot: string, vaultId: string): Promise<void> {
  isLoading.set(true);
  try {
    const today = new Date().toISOString().slice(0, 10);
    const sessions = await gymService.getSessionsForDate(vaultRoot, vaultId, today);
    if (sessions.length > 0) {
      activeSession.set(sessions[0]);
      log.info('Loaded today session', { sessionId: sessions[0].id });
    } else {
      activeSession.set(null);
    }
  } catch (err) {
    log.error('Failed to load today session', err as Error);
  } finally {
    isLoading.set(false);
  }
}

/** Creates a new session for today and sets it as active. */
export async function startSession(vaultRoot: string, vaultId: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const sessionId = await gymService.createSession(vaultRoot, vaultId, today);
    const session: WorkoutSession = {
      id: sessionId,
      vaultId,
      date: today,
      sets: [],
    };
    activeSession.set(session);
    sessionStartTime.set(Date.now());
    log.info('Started new workout session', { sessionId });
  } catch (err) {
    log.error('Failed to start session', err as Error);
    throw err;
  }
}

/** Adds a set to the active session. */
export async function addSetToSession(
  vaultRoot: string,
  vaultId: string,
  exerciseId: string,
  setOrder: number,
  reps?: number,
  weightKg?: number
): Promise<void> {
  const session = get(activeSession);
  if (!session) {
    throw new Error('No active session');
  }

  try {
    const setId = await gymService.addSet(
      vaultRoot,
      vaultId,
      session.id,
      exerciseId,
      setOrder,
      reps,
      weightKg
    );
    const newSet: WorkoutSet = {
      id: setId,
      vaultId,
      sessionId: session.id,
      exerciseId,
      setOrder,
      reps,
      weightKg,
    };
    activeSession.update((s) => (s ? { ...s, sets: [...(s.sets ?? []), newSet] } : null));
    log.info('Added set to session', { setId, exerciseId });
  } catch (err) {
    log.error('Failed to add set', err as Error);
    throw err;
  }
}

/** Finishes the active session with current duration. */
export async function finishSession(vaultRoot: string, vaultId: string): Promise<void> {
  const session = get(activeSession);
  const startTime = get(sessionStartTime);
  if (!session) return;

  const durationMin = startTime ? Math.round((Date.now() - startTime) / 60000) : undefined;

  try {
    await gymService.updateSession(vaultRoot, vaultId, session.id, durationMin);
    activeSession.update((s) => (s ? { ...s, durationMin } : null));
    sessionStartTime.set(null);
    log.info('Finished session', { sessionId: session.id, durationMin });
  } catch (err) {
    log.error('Failed to finish session', err as Error);
    throw err;
  }
}

/** Deletes a session and clears activeSession if it matches. */
export async function deleteSession(
  vaultRoot: string,
  vaultId: string,
  sessionId: string
): Promise<void> {
  try {
    await gymService.deleteSession(vaultRoot, vaultId, sessionId);
    activeSession.update((s) => (s?.id === sessionId ? null : s));
    log.info('Deleted session', { sessionId });
  } catch (err) {
    log.error('Failed to delete session', err as Error);
    throw err;
  }
}

/** Loads weekly volume data. */
export async function loadWeeklyVolume(vaultRoot: string, vaultId: string): Promise<void> {
  try {
    const weekStart = getWeekStartDate();
    const volume = await gymService.getWeeklyVolume(vaultRoot, vaultId, weekStart);
    weeklyVolume.set(volume);
  } catch (err) {
    log.error('Failed to load weekly volume', err as Error);
  }
}

/** Loads nutrition for today. */
export async function loadTodayNutrition(vaultRoot: string, vaultId: string): Promise<void> {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const entries = await gymService.getNutritionForDate(vaultRoot, vaultId, today);
    todayNutrition.set(entries);
  } catch (err) {
    log.error('Failed to load nutrition', err as Error);
  }
}

/** Adds a nutrition entry for today. */
export async function updateNutritionEntry(
  vaultRoot: string,
  vaultId: string,
  date: string,
  mealName: string,
  calories?: number,
  proteinG?: number,
  carbsG?: number,
  fatG?: number
): Promise<void> {
  try {
    const id = await gymService.addNutrition(
      vaultRoot,
      vaultId,
      date,
      mealName,
      calories,
      proteinG,
      carbsG,
      fatG
    );
    const entry: NutritionEntry = { id, vaultId, date, mealName, calories, proteinG, carbsG, fatG };
    todayNutrition.update((entries) => [...entries, entry]);
    log.info('Added nutrition entry', { id, mealName });
  } catch (err) {
    log.error('Failed to add nutrition', err as Error);
    throw err;
  }
}

/** Invalidates the exercise cache and reloads from backend. */
export async function invalidateExerciseCache(vaultRoot: string): Promise<void> {
  await loadExercises(vaultRoot);
}

function getWeekStartDate(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().slice(0, 10);
}
