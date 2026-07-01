/**
 * Gym feature types — field names use camelCase to match Rust #[serde(rename_all = "camelCase")] serialization.
 */

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  equipment?: string;
  instructions?: string;
  isCustom: boolean;
}

export interface ExerciseFilter {
  muscleGroup?: string;
  equipment?: string;
  searchText?: string;
}

export interface WorkoutSet {
  id: string;
  vaultId: string;
  sessionId: string;
  exerciseId: string;
  setOrder: number;
  reps?: number;
  weightKg?: number;
  durationSec?: number;
  rpe?: number;
  createdAt?: string;
}

export interface WorkoutSession {
  id: string;
  vaultId: string;
  date: string;
  durationMin?: number;
  notes?: string;
  createdAt?: string;
  sets?: WorkoutSet[];
}

export interface NutritionEntry {
  id: string;
  vaultId: string;
  date: string;
  mealName: string;
  calories?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  createdAt?: string;
}

export interface WorkoutTemplate {
  id: string;
  vaultId: string;
  name: string;
  exercises: string;
}

export interface VolumeEntry {
  muscleGroup: string;
  totalVolumeKg: number;
  sessionCount: number;
  totalSets: number;
}

export interface ProgressionPoint {
  date: string;
  maxWeightKg?: number;
  maxReps?: number;
  sessionVolume: number;
}

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  bestWeightKg?: number;
  bestRepCount?: number;
  prDate: string;
}

export interface WeeklyMacros {
  week: string;
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  daysLogged: number;
}
