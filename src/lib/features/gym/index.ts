/**
 * Gym feature public API barrel.
 * External consumers import ONLY from this path — never from internal sub-paths.
 */
export { default as GymPanel } from './components/GymPanel.svelte';
export { default as WorkoutLogger } from './components/WorkoutLogger.svelte';
export { default as ExercisePicker } from './components/ExercisePicker.svelte';
export { default as VolumeChart } from './components/VolumeChart.svelte';

export {
  exerciseList,
  activeSession,
  todayNutrition,
  weeklyVolume,
  isLoading,
  loadExercises,
  loadTodaySession,
  startSession,
  addSetToSession,
  finishSession,
  deleteSession,
  loadWeeklyVolume,
  loadTodayNutrition,
  updateNutritionEntry,
  invalidateExerciseCache,
} from './stores/gymStore';

export type {
  Exercise,
  WorkoutSession,
  WorkoutSet,
  NutritionEntry,
  VolumeEntry,
  ProgressionPoint,
  PersonalRecord,
  WeeklyMacros,
  WorkoutTemplate,
} from './types/gym';

import { getSessionsForDate } from './services/gym';

/**
 * Resolves the {{workout-log}} template token for a given vault and date.
 * Returns a Markdown summary of all workout sessions logged on that date.
 */
export async function resolveWorkoutLogToken(
  vaultRoot: string,
  vaultId: string,
  date: string,
): Promise<string> {
  const sessions = await getSessionsForDate(vaultRoot, vaultId, date);

  if (!sessions || sessions.length === 0) {
    return 'No workout logged for this date.';
  }

  const lines: string[] = ['## Workout Log'];
  for (const session of sessions) {
    const duration = session.durationMin ? ` (${session.durationMin} min)` : '';
    lines.push(`**Session**${duration}`);
    if (session.sets && session.sets.length > 0) {
      const byExercise = new Map<string, typeof session.sets>();
      for (const s of session.sets) {
        if (!byExercise.has(s.exerciseId)) byExercise.set(s.exerciseId, []);
        byExercise.get(s.exerciseId)!.push(s);
      }
      for (const [exerciseId, sets] of byExercise.entries()) {
        const setCount = sets.length;
        const repStr = sets[0]?.reps ?? '?';
        const weightStr = sets[0]?.weightKg ? ` @ ${sets[0].weightKg}kg` : '';
        lines.push(`- ${exerciseId}: ${setCount}x${repStr}${weightStr}`);
      }
    }
  }
  return lines.join('\n');
}
