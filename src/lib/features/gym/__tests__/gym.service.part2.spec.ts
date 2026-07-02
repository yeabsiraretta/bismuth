/**
 * Tests for gym.ts service wrappers — part 2: getWeeklyVolume through saveTemplate.
 * The Tauri invoke layer is mocked; tests verify correct command names and argument shapes.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/utils/ipc', () => ({
  ipcCall: vi.fn(),
}));

vi.mock('@/utils/logger', () => ({
  log: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import { ipcCall } from '@/utils/ipc';
import {
  getWeeklyVolume,
  getStrengthProgression,
  getPersonalRecords,
  createExercise,
  addNutrition,
  getNutritionForDate,
  getWeeklyMacros,
  listTemplates,
  saveTemplate,
} from '../services/gym';

const VAULT_ROOT = '/vault';
const VAULT_ID = 'vault-001';
const TODAY = '2026-06-24';

describe('gym.service — getWeeklyVolume', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls ipcCall with gym_get_weekly_volume', async () => {
    vi.mocked(ipcCall).mockResolvedValueOnce([]);

    await getWeeklyVolume(VAULT_ROOT, VAULT_ID, '2026-06-23');

    expect(ipcCall).toHaveBeenCalledWith('gym_get_weekly_volume', {
      vaultRoot: VAULT_ROOT,
      vaultId: VAULT_ID,
      weekStart: '2026-06-23',
    });
  });
});

describe('gym.service — getStrengthProgression', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls ipcCall with gym_get_strength_progression', async () => {
    vi.mocked(ipcCall).mockResolvedValueOnce([]);

    await getStrengthProgression(VAULT_ROOT, VAULT_ID, 'ex-1');

    expect(ipcCall).toHaveBeenCalledWith('gym_get_strength_progression', {
      vaultRoot: VAULT_ROOT,
      vaultId: VAULT_ID,
      exerciseId: 'ex-1',
    });
  });
});

describe('gym.service — getPersonalRecords', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls ipcCall with gym_get_personal_records', async () => {
    vi.mocked(ipcCall).mockResolvedValueOnce([]);

    await getPersonalRecords(VAULT_ROOT, VAULT_ID);

    expect(ipcCall).toHaveBeenCalledWith('gym_get_personal_records', {
      vaultRoot: VAULT_ROOT,
      vaultId: VAULT_ID,
    });
  });
});

describe('gym.service — createExercise', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls ipcCall with gym_create_exercise and returns id', async () => {
    vi.mocked(ipcCall).mockResolvedValueOnce('ex-new');

    const id = await createExercise(VAULT_ROOT, VAULT_ID, 'Romanian Deadlift', 'Legs', 'Barbell');

    expect(ipcCall).toHaveBeenCalledWith('gym_create_exercise', {
      vaultRoot: VAULT_ROOT,
      vaultId: VAULT_ID,
      name: 'Romanian Deadlift',
      muscleGroup: 'Legs',
      equipment: 'Barbell',
    });
    expect(id).toBe('ex-new');
  });
});

describe('gym.service — addNutrition', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls ipcCall with gym_add_nutrition and returns entry id', async () => {
    vi.mocked(ipcCall).mockResolvedValueOnce('nut-new');

    const id = await addNutrition(VAULT_ROOT, VAULT_ID, TODAY, 'Dinner', 700, 55, 80, 25);

    expect(ipcCall).toHaveBeenCalledWith('gym_add_nutrition', {
      vaultRoot: VAULT_ROOT,
      vaultId: VAULT_ID,
      date: TODAY,
      mealName: 'Dinner',
      calories: 700,
      proteinG: 55,
      carbsG: 80,
      fatG: 25,
    });
    expect(id).toBe('nut-new');
  });
});

describe('gym.service — getNutritionForDate', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls ipcCall with gym_get_nutrition', async () => {
    vi.mocked(ipcCall).mockResolvedValueOnce([]);

    await getNutritionForDate(VAULT_ROOT, VAULT_ID, TODAY);

    expect(ipcCall).toHaveBeenCalledWith('gym_get_nutrition', {
      vaultRoot: VAULT_ROOT,
      vaultId: VAULT_ID,
      date: TODAY,
    });
  });

  it('returns empty array on error', async () => {
    vi.mocked(ipcCall).mockRejectedValueOnce(new Error('fail'));

    const result = await getNutritionForDate(VAULT_ROOT, VAULT_ID, TODAY);

    expect(result).toEqual([]);
  });
});

describe('gym.service — getWeeklyMacros', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls ipcCall with gym_get_weekly_macros', async () => {
    vi.mocked(ipcCall).mockResolvedValueOnce([]);

    await getWeeklyMacros(VAULT_ROOT, VAULT_ID);

    expect(ipcCall).toHaveBeenCalledWith('gym_get_weekly_macros', {
      vaultRoot: VAULT_ROOT,
      vaultId: VAULT_ID,
    });
  });
});

describe('gym.service — listTemplates', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls ipcCall with gym_list_templates', async () => {
    vi.mocked(ipcCall).mockResolvedValueOnce([]);

    await listTemplates(VAULT_ROOT, VAULT_ID);

    expect(ipcCall).toHaveBeenCalledWith('gym_list_templates', {
      vaultRoot: VAULT_ROOT,
      vaultId: VAULT_ID,
    });
  });
});

describe('gym.service — saveTemplate', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls ipcCall with gym_save_template and returns id', async () => {
    vi.mocked(ipcCall).mockResolvedValueOnce('tpl-1');

    const id = await saveTemplate(VAULT_ROOT, VAULT_ID, 'Push Day', '["ex-1","ex-2"]');

    expect(ipcCall).toHaveBeenCalledWith('gym_save_template', {
      vaultRoot: VAULT_ROOT,
      vaultId: VAULT_ID,
      name: 'Push Day',
      exercisesJson: '["ex-1","ex-2"]',
    });
    expect(id).toBe('tpl-1');
  });
});
