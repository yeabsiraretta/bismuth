/**
 * Unit tests for gymStore.ts — part 2: deleteSession, loadWeeklyVolume,
 * loadTodayNutrition, updateNutritionEntry, invalidateExerciseCache.
 * All IPC calls are delegated to the gym service which is mocked here.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';

// Mock gym service before importing the store
vi.mock('../services/gym', () => ({
  listExercises: vi.fn(),
  createSession: vi.fn(),
  updateSession: vi.fn(),
  deleteSession: vi.fn(),
  addSet: vi.fn(),
  deleteSet: vi.fn(),
  listSessions: vi.fn(),
  getSessionsForDate: vi.fn(),
  getWeeklyVolume: vi.fn(),
  getStrengthProgression: vi.fn(),
  getPersonalRecords: vi.fn(),
  createExercise: vi.fn(),
  addNutrition: vi.fn(),
  getNutritionForDate: vi.fn(),
  deleteNutrition: vi.fn(),
  getWeeklyMacros: vi.fn(),
  listTemplates: vi.fn(),
  saveTemplate: vi.fn(),
}));

vi.mock('@/utils/logger', () => ({
  log: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import * as gymService from '../services/gym';
import {
  exerciseList,
  activeSession,
  todayNutrition,
  weeklyVolume,
  isLoading,
  sessionStartTime,
  deleteSession,
  loadWeeklyVolume,
  loadTodayNutrition,
  updateNutritionEntry,
  invalidateExerciseCache,
} from '../stores/gymStore';
import type { Exercise, WorkoutSession, NutritionEntry, VolumeEntry } from '../types/gym';

const VAULT_ROOT = '/vault';
const VAULT_ID = 'vault-001';
const TODAY = new Date().toISOString().slice(0, 10);

const mockExercise: Exercise = {
  id: 'ex-1',
  name: 'Barbell Squat',
  muscleGroup: 'Legs',
  equipment: 'Barbell',
  isCustom: false,
};

const mockSession: WorkoutSession = {
  id: 'sess-1',
  vaultId: VAULT_ID,
  date: TODAY,
  sets: [],
};

const mockNutrition: NutritionEntry = {
  id: 'nut-1',
  vaultId: VAULT_ID,
  date: TODAY,
  mealName: 'Breakfast',
  calories: 500,
  proteinG: 40,
  carbsG: 60,
  fatG: 10,
};

const mockVolume: VolumeEntry = {
  muscleGroup: 'Legs',
  totalVolumeKg: 2500,
  sessionCount: 3,
  totalSets: 15,
};

function resetStores(): void {
  exerciseList.set([]);
  activeSession.set(null);
  todayNutrition.set([]);
  weeklyVolume.set([]);
  isLoading.set(false);
  sessionStartTime.set(null);
}

describe('gymStore — deleteSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStores();
    activeSession.set(mockSession);
  });

  it('clears activeSession when deleted session matches active', async () => {
    vi.mocked(gymService.deleteSession).mockResolvedValueOnce(undefined);

    await deleteSession(VAULT_ROOT, VAULT_ID, 'sess-1');

    expect(get(activeSession)).toBeNull();
  });

  it('does not clear activeSession when a different session is deleted', async () => {
    vi.mocked(gymService.deleteSession).mockResolvedValueOnce(undefined);

    await deleteSession(VAULT_ROOT, VAULT_ID, 'sess-other');

    expect(get(activeSession)).not.toBeNull();
  });

  it('throws on service error', async () => {
    vi.mocked(gymService.deleteSession).mockRejectedValueOnce(new Error('Not found'));

    await expect(deleteSession(VAULT_ROOT, VAULT_ID, 'sess-1')).rejects.toThrow('Not found');
  });
});

describe('gymStore — loadWeeklyVolume', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStores();
  });

  it('populates weeklyVolume on success', async () => {
    vi.mocked(gymService.getWeeklyVolume).mockResolvedValueOnce([mockVolume]);

    await loadWeeklyVolume(VAULT_ROOT, VAULT_ID);

    expect(get(weeklyVolume)).toHaveLength(1);
    expect(get(weeklyVolume)[0].muscleGroup).toBe('Legs');
  });

  it('leaves weeklyVolume unchanged on error', async () => {
    weeklyVolume.set([mockVolume]);
    vi.mocked(gymService.getWeeklyVolume).mockRejectedValueOnce(new Error('DB error'));

    await loadWeeklyVolume(VAULT_ROOT, VAULT_ID);

    // Store unchanged — error is swallowed
    expect(get(weeklyVolume)).toHaveLength(1);
  });
});

describe('gymStore — loadTodayNutrition', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStores();
  });

  it('populates todayNutrition on success', async () => {
    vi.mocked(gymService.getNutritionForDate).mockResolvedValueOnce([mockNutrition]);

    await loadTodayNutrition(VAULT_ROOT, VAULT_ID);

    expect(get(todayNutrition)).toHaveLength(1);
    expect(get(todayNutrition)[0].mealName).toBe('Breakfast');
  });
});

describe('gymStore — updateNutritionEntry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStores();
  });

  it('appends a new nutrition entry to todayNutrition', async () => {
    vi.mocked(gymService.addNutrition).mockResolvedValueOnce('nut-new');

    await updateNutritionEntry(VAULT_ROOT, VAULT_ID, TODAY, 'Lunch', 600, 50, 70, 20);

    const entries = get(todayNutrition);
    expect(entries).toHaveLength(1);
    expect(entries[0].id).toBe('nut-new');
    expect(entries[0].mealName).toBe('Lunch');
  });

  it('throws on service error', async () => {
    vi.mocked(gymService.addNutrition).mockRejectedValueOnce(new Error('Write fail'));

    await expect(updateNutritionEntry(VAULT_ROOT, VAULT_ID, TODAY, 'Lunch')).rejects.toThrow(
      'Write fail'
    );
  });
});

describe('gymStore — invalidateExerciseCache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStores();
  });

  it('reloads exercises from backend', async () => {
    vi.mocked(gymService.listExercises).mockResolvedValueOnce([mockExercise]);

    await invalidateExerciseCache(VAULT_ROOT);

    expect(gymService.listExercises).toHaveBeenCalledWith(VAULT_ROOT);
    expect(get(exerciseList)).toHaveLength(1);
  });
});
