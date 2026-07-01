/**
 * Tests for gym.ts service wrappers — IPC contract and error handling.
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
  listExercises,
  createSession,
  updateSession,
  deleteSession,
  addSet,
  deleteSet,
  listSessions,
  getSessionsForDate,
  getWeeklyVolume as _getWeeklyVolume,
  getStrengthProgression as _getStrengthProgression,
  getPersonalRecords as _getPersonalRecords,
  createExercise as _createExercise,
  addNutrition as _addNutrition,
  getNutritionForDate as _getNutritionForDate,
  getWeeklyMacros as _getWeeklyMacros,
  listTemplates as _listTemplates,
  saveTemplate as _saveTemplate,
} from '../services/gym';

const VAULT_ROOT = '/vault';
const VAULT_ID = 'vault-001';
const TODAY = '2026-06-24';

describe('gym.service — listExercises', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls ipcCall with gym_list_exercises and vaultRoot', async () => {
    vi.mocked(ipcCall).mockResolvedValueOnce([]);

    await listExercises(VAULT_ROOT);

    expect(ipcCall).toHaveBeenCalledWith('gym_list_exercises', { vaultRoot: VAULT_ROOT });
  });

  it('returns empty array when ipcCall throws', async () => {
    vi.mocked(ipcCall).mockRejectedValueOnce(new Error('DB error'));

    const result = await listExercises(VAULT_ROOT);

    expect(result).toEqual([]);
  });
});

describe('gym.service — createSession', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls ipcCall with gym_create_session and correct args', async () => {
    vi.mocked(ipcCall).mockResolvedValueOnce('sess-abc');

    const id = await createSession(VAULT_ROOT, VAULT_ID, TODAY);

    expect(ipcCall).toHaveBeenCalledWith('gym_create_session', {
      vaultRoot: VAULT_ROOT,
      vaultId: VAULT_ID,
      date: TODAY,
      durationMin: undefined,
      notes: undefined,
    });
    expect(id).toBe('sess-abc');
  });

  it('propagates rejection from ipcCall', async () => {
    vi.mocked(ipcCall).mockRejectedValueOnce(new Error('write error'));

    await expect(createSession(VAULT_ROOT, VAULT_ID, TODAY)).rejects.toThrow('write error');
  });
});

describe('gym.service — updateSession', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls ipcCall with gym_update_session', async () => {
    vi.mocked(ipcCall).mockResolvedValueOnce(undefined);

    await updateSession(VAULT_ROOT, VAULT_ID, 'sess-1', 45, 'Great session');

    expect(ipcCall).toHaveBeenCalledWith('gym_update_session', {
      vaultRoot: VAULT_ROOT,
      vaultId: VAULT_ID,
      sessionId: 'sess-1',
      durationMin: 45,
      notes: 'Great session',
    });
  });
});

describe('gym.service — deleteSession', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls ipcCall with gym_delete_session', async () => {
    vi.mocked(ipcCall).mockResolvedValueOnce(undefined);

    await deleteSession(VAULT_ROOT, VAULT_ID, 'sess-1');

    expect(ipcCall).toHaveBeenCalledWith('gym_delete_session', {
      vaultRoot: VAULT_ROOT,
      vaultId: VAULT_ID,
      sessionId: 'sess-1',
    });
  });
});

describe('gym.service — addSet', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls ipcCall with gym_add_set and returns new set id', async () => {
    vi.mocked(ipcCall).mockResolvedValueOnce('set-xyz');

    const id = await addSet(VAULT_ROOT, VAULT_ID, 'sess-1', 'ex-1', 1, 10, 80);

    expect(ipcCall).toHaveBeenCalledWith('gym_add_set', {
      vaultRoot: VAULT_ROOT,
      vaultId: VAULT_ID,
      sessionId: 'sess-1',
      exerciseId: 'ex-1',
      setOrder: 1,
      reps: 10,
      weightKg: 80,
    });
    expect(id).toBe('set-xyz');
  });
});

describe('gym.service — deleteSet', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls ipcCall with gym_delete_set', async () => {
    vi.mocked(ipcCall).mockResolvedValueOnce(undefined);

    await deleteSet(VAULT_ROOT, VAULT_ID, 'set-1');

    expect(ipcCall).toHaveBeenCalledWith('gym_delete_set', {
      vaultRoot: VAULT_ROOT,
      vaultId: VAULT_ID,
      setId: 'set-1',
    });
  });
});

describe('gym.service — listSessions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls ipcCall with gym_list_sessions and default limit 20', async () => {
    vi.mocked(ipcCall).mockResolvedValueOnce([]);

    await listSessions(VAULT_ROOT, VAULT_ID);

    expect(ipcCall).toHaveBeenCalledWith('gym_list_sessions', {
      vaultRoot: VAULT_ROOT,
      vaultId: VAULT_ID,
      limit: 20,
    });
  });

  it('returns empty array when ipcCall throws', async () => {
    vi.mocked(ipcCall).mockRejectedValueOnce(new Error('DB error'));

    const result = await listSessions(VAULT_ROOT, VAULT_ID);

    expect(result).toEqual([]);
  });
});

describe('gym.service — getSessionsForDate', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls ipcCall with gym_get_sessions_for_date', async () => {
    vi.mocked(ipcCall).mockResolvedValueOnce([]);

    await getSessionsForDate(VAULT_ROOT, VAULT_ID, TODAY);

    expect(ipcCall).toHaveBeenCalledWith('gym_get_sessions_for_date', {
      vaultRoot: VAULT_ROOT,
      vaultId: VAULT_ID,
      date: TODAY,
    });
  });

  it('returns empty array on error', async () => {
    vi.mocked(ipcCall).mockRejectedValueOnce(new Error('fail'));

    const result = await getSessionsForDate(VAULT_ROOT, VAULT_ID, TODAY);

    expect(result).toEqual([]);
  });
});
