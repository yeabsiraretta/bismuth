/**
 * Unit tests for gymStore.ts — store actions, state transitions, and error handling.
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
  loadExercises,
  loadTodaySession,
  startSession,
  addSetToSession,
  finishSession,
  deleteSession as _deleteSession,
  loadWeeklyVolume as _loadWeeklyVolume,
  loadTodayNutrition as _loadTodayNutrition,
  updateNutritionEntry as _updateNutritionEntry,
  invalidateExerciseCache as _invalidateExerciseCache,
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

const _mockNutrition: NutritionEntry = {
  id: 'nut-1',
  vaultId: VAULT_ID,
  date: TODAY,
  mealName: 'Breakfast',
  calories: 500,
  proteinG: 40,
  carbsG: 60,
  fatG: 10,
};
void _mockNutrition;

const _mockVolume: VolumeEntry = {
  muscleGroup: 'Legs',
  totalVolumeKg: 2500,
  sessionCount: 3,
  totalSets: 15,
};
void _mockVolume;

function resetStores(): void {
  exerciseList.set([]);
  activeSession.set(null);
  todayNutrition.set([]);
  weeklyVolume.set([]);
  isLoading.set(false);
  sessionStartTime.set(null);
}

describe('gymStore — loadExercises', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStores();
  });

  it('populates exerciseList on success', async () => {
    vi.mocked(gymService.listExercises).mockResolvedValueOnce([mockExercise]);

    await loadExercises(VAULT_ROOT);

    expect(get(exerciseList)).toHaveLength(1);
    expect(get(exerciseList)[0].id).toBe('ex-1');
  });

  it('sets isLoading to false after success', async () => {
    vi.mocked(gymService.listExercises).mockResolvedValueOnce([mockExercise]);

    await loadExercises(VAULT_ROOT);

    expect(get(isLoading)).toBe(false);
  });

  it('sets exerciseList to empty array on service error', async () => {
    vi.mocked(gymService.listExercises).mockRejectedValueOnce(new Error('DB error'));

    await loadExercises(VAULT_ROOT);

    expect(get(exerciseList)).toHaveLength(0);
    expect(get(isLoading)).toBe(false);
  });
});

describe('gymStore — loadTodaySession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStores();
  });

  it('sets activeSession when a session exists for today', async () => {
    vi.mocked(gymService.getSessionsForDate).mockResolvedValueOnce([mockSession]);

    await loadTodaySession(VAULT_ROOT, VAULT_ID);

    expect(get(activeSession)).not.toBeNull();
    expect(get(activeSession)?.id).toBe('sess-1');
  });

  it('sets activeSession to null when no session exists', async () => {
    vi.mocked(gymService.getSessionsForDate).mockResolvedValueOnce([]);

    await loadTodaySession(VAULT_ROOT, VAULT_ID);

    expect(get(activeSession)).toBeNull();
  });

  it('sets isLoading to false after completion', async () => {
    vi.mocked(gymService.getSessionsForDate).mockResolvedValueOnce([]);

    await loadTodaySession(VAULT_ROOT, VAULT_ID);

    expect(get(isLoading)).toBe(false);
  });
});

describe('gymStore — startSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStores();
  });

  it('creates a new session and sets activeSession', async () => {
    vi.mocked(gymService.createSession).mockResolvedValueOnce('sess-new');

    await startSession(VAULT_ROOT, VAULT_ID);

    const session = get(activeSession);
    expect(session).not.toBeNull();
    expect(session?.id).toBe('sess-new');
    expect(session?.vaultId).toBe(VAULT_ID);
  });

  it('sets sessionStartTime to a non-null number', async () => {
    vi.mocked(gymService.createSession).mockResolvedValueOnce('sess-new');

    await startSession(VAULT_ROOT, VAULT_ID);

    expect(get(sessionStartTime)).not.toBeNull();
    expect(typeof get(sessionStartTime)).toBe('number');
  });

  it('throws and does not set activeSession on service error', async () => {
    vi.mocked(gymService.createSession).mockRejectedValueOnce(new Error('DB full'));

    await expect(startSession(VAULT_ROOT, VAULT_ID)).rejects.toThrow('DB full');
    expect(get(activeSession)).toBeNull();
  });
});

describe('gymStore — addSetToSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStores();
    activeSession.set(mockSession);
  });

  it('appends the new set to activeSession.sets', async () => {
    vi.mocked(gymService.addSet).mockResolvedValueOnce('set-1');

    await addSetToSession(VAULT_ROOT, VAULT_ID, 'ex-1', 1, 10, 100);

    const session = get(activeSession);
    expect(session?.sets).toHaveLength(1);
    expect(session?.sets?.[0].id).toBe('set-1');
    expect(session?.sets?.[0].exerciseId).toBe('ex-1');
  });

  it('throws when no active session exists', async () => {
    activeSession.set(null);

    await expect(addSetToSession(VAULT_ROOT, VAULT_ID, 'ex-1', 1, 10, 100)).rejects.toThrow(
      'No active session'
    );
  });

  it('throws on service error', async () => {
    vi.mocked(gymService.addSet).mockRejectedValueOnce(new Error('Set limit'));

    await expect(addSetToSession(VAULT_ROOT, VAULT_ID, 'ex-1', 1, 10, 100)).rejects.toThrow(
      'Set limit'
    );
  });
});

describe('gymStore — finishSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStores();
    activeSession.set(mockSession);
    sessionStartTime.set(Date.now() - 30 * 60 * 1000); // 30 min ago
  });

  it('calls updateSession and clears sessionStartTime', async () => {
    vi.mocked(gymService.updateSession).mockResolvedValueOnce(undefined);

    await finishSession(VAULT_ROOT, VAULT_ID);

    expect(gymService.updateSession).toHaveBeenCalled();
    expect(get(sessionStartTime)).toBeNull();
  });

  it('updates durationMin on activeSession', async () => {
    vi.mocked(gymService.updateSession).mockResolvedValueOnce(undefined);

    await finishSession(VAULT_ROOT, VAULT_ID);

    const session = get(activeSession);
    expect(session?.durationMin).toBeGreaterThan(0);
  });

  it('does nothing when no active session', async () => {
    activeSession.set(null);

    await finishSession(VAULT_ROOT, VAULT_ID);

    expect(gymService.updateSession).not.toHaveBeenCalled();
  });
});
