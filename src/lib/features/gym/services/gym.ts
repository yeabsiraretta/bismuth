/**
 * Gym IPC service wrappers — all Tauri invoke calls for gym commands are isolated here.
 * Components and stores use this module; none call invoke() directly.
 */
import { ipcCall } from '@/utils/ipc';
import { log } from '@/utils/logger';
import type {
  Exercise,
  WorkoutSession,
  NutritionEntry,
  WorkoutTemplate,
  VolumeEntry,
  ProgressionPoint,
  PersonalRecord,
  WeeklyMacros,
} from '../types/gym';

export async function listExercises(vaultRoot: string): Promise<Exercise[]> {
  try {
    return await ipcCall<Exercise[]>('gym_list_exercises', { vaultRoot });
  } catch (err) {
    log.error('Failed to list exercises', err as Error);
    return [];
  }
}

export async function createSession(
  vaultRoot: string,
  vaultId: string,
  date: string,
  durationMin?: number,
  notes?: string,
): Promise<string> {
  return ipcCall<string>('gym_create_session', { vaultRoot, vaultId, date, durationMin, notes });
}

export async function updateSession(
  vaultRoot: string,
  vaultId: string,
  sessionId: string,
  durationMin?: number,
  notes?: string,
): Promise<void> {
  return ipcCall<void>('gym_update_session', { vaultRoot, vaultId, sessionId, durationMin, notes });
}

export async function deleteSession(
  vaultRoot: string,
  vaultId: string,
  sessionId: string,
): Promise<void> {
  return ipcCall<void>('gym_delete_session', { vaultRoot, vaultId, sessionId });
}

export async function addSet(
  vaultRoot: string,
  vaultId: string,
  sessionId: string,
  exerciseId: string,
  setOrder: number,
  reps?: number,
  weightKg?: number,
): Promise<string> {
  return ipcCall<string>('gym_add_set', { vaultRoot, vaultId, sessionId, exerciseId, setOrder, reps, weightKg });
}

export async function deleteSet(vaultRoot: string, vaultId: string, setId: string): Promise<void> {
  return ipcCall<void>('gym_delete_set', { vaultRoot, vaultId, setId });
}

export async function listSessions(
  vaultRoot: string,
  vaultId: string,
  limit = 20,
): Promise<WorkoutSession[]> {
  try {
    return await ipcCall<WorkoutSession[]>('gym_list_sessions', { vaultRoot, vaultId, limit });
  } catch (err) {
    log.error('Failed to list sessions', err as Error);
    return [];
  }
}

export async function getSessionsForDate(
  vaultRoot: string,
  vaultId: string,
  date: string,
): Promise<WorkoutSession[]> {
  try {
    return await ipcCall<WorkoutSession[]>('gym_get_sessions_for_date', { vaultRoot, vaultId, date });
  } catch (err) {
    log.error('Failed to get sessions for date', err as Error);
    return [];
  }
}

export async function getWeeklyVolume(
  vaultRoot: string,
  vaultId: string,
  weekStart: string,
): Promise<VolumeEntry[]> {
  try {
    return await ipcCall<VolumeEntry[]>('gym_get_weekly_volume', { vaultRoot, vaultId, weekStart });
  } catch (err) {
    log.error('Failed to get weekly volume', err as Error);
    return [];
  }
}

export async function getStrengthProgression(
  vaultRoot: string,
  vaultId: string,
  exerciseId: string,
): Promise<ProgressionPoint[]> {
  try {
    return await ipcCall<ProgressionPoint[]>('gym_get_strength_progression', { vaultRoot, vaultId, exerciseId });
  } catch (err) {
    log.error('Failed to get strength progression', err as Error);
    return [];
  }
}

export async function getPersonalRecords(
  vaultRoot: string,
  vaultId: string,
): Promise<PersonalRecord[]> {
  try {
    return await ipcCall<PersonalRecord[]>('gym_get_personal_records', { vaultRoot, vaultId });
  } catch (err) {
    log.error('Failed to get personal records', err as Error);
    return [];
  }
}

export async function createExercise(
  vaultRoot: string,
  vaultId: string,
  name: string,
  muscleGroup: string,
  equipment: string,
): Promise<string> {
  return ipcCall<string>('gym_create_exercise', { vaultRoot, vaultId, name, muscleGroup, equipment });
}

export async function addNutrition(
  vaultRoot: string,
  vaultId: string,
  date: string,
  mealName: string,
  calories?: number,
  proteinG?: number,
  carbsG?: number,
  fatG?: number,
): Promise<string> {
  return ipcCall<string>('gym_add_nutrition', { vaultRoot, vaultId, date, mealName, calories, proteinG, carbsG, fatG });
}

export async function getNutritionForDate(
  vaultRoot: string,
  vaultId: string,
  date: string,
): Promise<NutritionEntry[]> {
  try {
    return await ipcCall<NutritionEntry[]>('gym_get_nutrition', { vaultRoot, vaultId, date });
  } catch (err) {
    log.error('Failed to get nutrition', err as Error);
    return [];
  }
}

export async function deleteNutrition(
  vaultRoot: string,
  vaultId: string,
  entryId: string,
): Promise<void> {
  return ipcCall<void>('gym_delete_nutrition', { vaultRoot, vaultId, entryId });
}

export async function getWeeklyMacros(
  vaultRoot: string,
  vaultId: string,
): Promise<WeeklyMacros[]> {
  try {
    return await ipcCall<WeeklyMacros[]>('gym_get_weekly_macros', { vaultRoot, vaultId });
  } catch (err) {
    log.error('Failed to get weekly macros', err as Error);
    return [];
  }
}

export async function listTemplates(vaultRoot: string, vaultId: string): Promise<WorkoutTemplate[]> {
  try {
    return await ipcCall<WorkoutTemplate[]>('gym_list_templates', { vaultRoot, vaultId });
  } catch (err) {
    log.error('Failed to list templates', err as Error);
    return [];
  }
}

export async function saveTemplate(
  vaultRoot: string,
  vaultId: string,
  name: string,
  exercisesJson: string,
): Promise<string> {
  return ipcCall<string>('gym_save_template', { vaultRoot, vaultId, name, exercisesJson });
}
