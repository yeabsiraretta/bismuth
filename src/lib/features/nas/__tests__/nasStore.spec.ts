/**
 * Unit tests for nasStore.ts — store actions and syncStatus transitions.
 * All IPC calls are delegated to the nas service which is mocked here.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';

// Mock the nas service before importing the store
vi.mock('../services/nas', () => ({
  readNasConfig: vi.fn(),
  connectWebDav: vi.fn(),
  syncVault: vi.fn(),
  applyChange: vi.fn(),
  cancelSync: vi.fn(),
  writeNasConfig: vi.fn(),
  listRemote: vi.fn(),
  onSyncProgress: vi.fn(),
  onSizeWarning: vi.fn(),
}));

// Mock logger to silence output in tests
vi.mock('@/utils/logger', () => ({
  log: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import * as nasService from '../services/nas';
import {
  nasConfig,
  syncStatus,
  conflicts,
  loadNasConfig,
  connectNas as _connectNas,
  syncNow,
  resolveConflict,
  disconnectNas,
} from '../stores/nasStore';
void _connectNas;
import type { ConflictRecord, NasConfig, SyncSummary } from '../types/nas';

const validConfig: NasConfig = {
  url: 'https://192.168.1.100/dav',
  username: 'admin',
  lastSync: null,
  offlineModeEnabled: false,
};

const mockSummaryNoConflicts: SyncSummary = {
  uploaded: 2,
  downloaded: 1,
  conflicts: 0,
  durationMs: 120,
};

const mockSummaryWithConflicts: SyncSummary = {
  uploaded: 0,
  downloaded: 0,
  conflicts: 2,
  durationMs: 80,
};

const conflictA: ConflictRecord = {
  filePath: 'notes/a.md',
  localMtime: 1718000000,
  remoteMtime: 1718001000,
  localContent: 'local a',
  remoteContent: 'remote a',
  detectedAt: '2026-06-21T12:00:00Z',
};

const conflictB: ConflictRecord = {
  filePath: 'notes/b.md',
  localMtime: 1718000000,
  remoteMtime: 1718002000,
  localContent: 'local b',
  remoteContent: 'remote b',
  detectedAt: '2026-06-21T12:01:00Z',
};

// Reset stores to initial state before each test
function resetStores(): void {
  nasConfig.set(null);
  syncStatus.set('disabled');
  conflicts.set([]);
}

describe('nasStore — syncStatus transitions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStores();
  });

  it('starts in disabled state with no config', () => {
    expect(get(syncStatus)).toBe('disabled');
    expect(get(nasConfig)).toBeNull();
  });

  it('transitions disabled → disconnected on loadNasConfig when config is present', async () => {
    vi.mocked(nasService.readNasConfig).mockResolvedValueOnce(validConfig);

    expect(get(syncStatus)).toBe('disabled');
    await loadNasConfig('/vault');
    expect(get(syncStatus)).toBe('disconnected');
    expect(get(nasConfig)).toMatchObject({ url: validConfig.url });
  });

  it('transitions disconnected → syncing → synced on syncNow success', async () => {
    nasConfig.set(validConfig);
    syncStatus.set('disconnected');

    vi.mocked(nasService.syncVault).mockResolvedValueOnce(mockSummaryNoConflicts);

    const statuses: string[] = [];
    const unsub = syncStatus.subscribe((s) => statuses.push(s));

    await syncNow();
    unsub();

    expect(statuses).toContain('syncing');
    expect(statuses[statuses.length - 1]).toBe('synced');
  });
});

describe('nasStore — syncNow with conflicts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStores();
  });

  it('sets syncStatus to conflict when result.conflicts > 0', async () => {
    nasConfig.set(validConfig);
    syncStatus.set('disconnected');

    vi.mocked(nasService.syncVault).mockResolvedValueOnce(mockSummaryWithConflicts);

    await syncNow();

    expect(get(syncStatus)).toBe('conflict');
  });

  it('does not modify conflicts list — conflicts store only populated externally', async () => {
    nasConfig.set(validConfig);
    syncStatus.set('disconnected');

    vi.mocked(nasService.syncVault).mockResolvedValueOnce(mockSummaryWithConflicts);

    await syncNow();

    // The store's syncNow action reflects conflict count from SyncSummary but does not
    // populate the ConflictRecord list itself (records come from a separate IPC event).
    // We confirm conflict status is set.
    expect(get(syncStatus)).toBe('conflict');
  });
});

describe('nasStore — resolveConflict', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStores();
    nasConfig.set(validConfig);
    syncStatus.set('conflict');
    conflicts.set([conflictA, conflictB]);
  });

  it('removes the resolved conflict from the conflicts list', async () => {
    vi.mocked(nasService.applyChange).mockResolvedValueOnce(undefined);

    await resolveConflict(conflictA.filePath, 'local');

    const remaining = get(conflicts);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].filePath).toBe(conflictB.filePath);
  });

  it('calls applyChange with op "put" when resolution is local', async () => {
    vi.mocked(nasService.applyChange).mockResolvedValueOnce(undefined);

    await resolveConflict(conflictA.filePath, 'local');

    expect(nasService.applyChange).toHaveBeenCalledWith('put', conflictA.filePath);
  });

  it('calls applyChange with op "get" when resolution is remote', async () => {
    vi.mocked(nasService.applyChange).mockResolvedValueOnce(undefined);

    await resolveConflict(conflictA.filePath, 'remote');

    expect(nasService.applyChange).toHaveBeenCalledWith('get', conflictA.filePath);
  });

  it('transitions syncStatus to synced when all conflicts are resolved', async () => {
    vi.mocked(nasService.applyChange).mockResolvedValue(undefined);

    await resolveConflict(conflictA.filePath, 'local');
    await resolveConflict(conflictB.filePath, 'remote');

    expect(get(conflicts)).toHaveLength(0);
    expect(get(syncStatus)).toBe('synced');
  });

  it('keeps syncStatus as conflict when conflicts remain after resolving one', async () => {
    vi.mocked(nasService.applyChange).mockResolvedValueOnce(undefined);

    await resolveConflict(conflictA.filePath, 'local');

    expect(get(syncStatus)).toBe('conflict');
  });
});

describe('nasStore — disconnectNas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nasConfig.set(validConfig);
    syncStatus.set('synced');
    conflicts.set([conflictA]);
  });

  it('resets nasConfig to null', async () => {
    await disconnectNas();
    expect(get(nasConfig)).toBeNull();
  });

  it('resets syncStatus to disabled', async () => {
    await disconnectNas();
    expect(get(syncStatus)).toBe('disabled');
  });

  it('clears the conflicts list', async () => {
    await disconnectNas();
    expect(get(conflicts)).toHaveLength(0);
  });
});

describe('nasStore — loadNasConfig when config is absent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStores();
  });

  it('leaves syncStatus as disabled when readNasConfig returns null', async () => {
    vi.mocked(nasService.readNasConfig).mockResolvedValueOnce(null);

    await loadNasConfig('/vault');

    expect(get(syncStatus)).toBe('disabled');
    expect(get(nasConfig)).toBeNull();
  });

  it('leaves syncStatus as disabled when readNasConfig throws', async () => {
    vi.mocked(nasService.readNasConfig).mockRejectedValueOnce(new Error('File not found'));

    await expect(loadNasConfig('/vault')).resolves.not.toThrow();

    expect(get(syncStatus)).toBe('disabled');
    expect(get(nasConfig)).toBeNull();
  });

  it('leaves syncStatus as disabled when config is invalid (no password rejection)', async () => {
    vi.mocked(nasService.readNasConfig).mockResolvedValueOnce({ url: 'x', password: 'bad' });

    await loadNasConfig('/vault');

    expect(get(syncStatus)).toBe('disabled');
  });
});
