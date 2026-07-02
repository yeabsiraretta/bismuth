import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock ipcCall so no real IPC happens.
// Note: vi.mock is hoisted, so the factory cannot reference const variables defined
// in module scope. We use vi.fn() directly inside the factory and grab it via the module.
vi.mock('@/utils/ipc', () => ({
  ipcCall: vi.fn(),
}));
vi.mock('@/utils/logger', () => ({
  log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { ipcCall } from '@/utils/ipc';
import {
  computeDiffMetrics,
  bumpVersion,
  saveDiff,
  listVersions,
  getNoteDiff,
} from '../services/versioning';
import type { DiffMetrics, VersionEntry } from '../types/versioning';

const mockMetrics: DiffMetrics = {
  addedLines: 5,
  removedLines: 2,
  totalLines: 30,
  headingDelta: 1,
  structuralTokenDelta: 1,
};

const mockEntry: VersionEntry = {
  version: '0.2.0',
  timestamp: '2026-06-21T10:00:00Z',
  bumpType: 'minor',
  summary: 'Content updated: +5 -2 lines',
  diffPath: '.bismuth/versions/note-id/12345-0-2-0.json',
  metrics: mockMetrics,
};

describe('versioning service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('computeDiffMetrics', () => {
    it('calls compute_version_diff_metrics with correct argument keys', async () => {
      vi.mocked(ipcCall).mockResolvedValue(mockMetrics);
      const result = await computeDiffMetrics('old text', 'new text');
      expect(vi.mocked(ipcCall)).toHaveBeenCalledWith('compute_version_diff_metrics', {
        oldContent: 'old text',
        newContent: 'new text',
      });
      expect(result).toEqual(mockMetrics);
    });

    it('returns DiffMetrics shape', async () => {
      vi.mocked(ipcCall).mockResolvedValue(mockMetrics);
      const result = await computeDiffMetrics('a', 'b');
      expect(result).toHaveProperty('addedLines');
      expect(result).toHaveProperty('removedLines');
      expect(result).toHaveProperty('totalLines');
      expect(result).toHaveProperty('headingDelta');
      expect(result).toHaveProperty('structuralTokenDelta');
    });
  });

  describe('bumpVersion', () => {
    it('calls bump_version with correct argument keys', async () => {
      vi.mocked(ipcCall).mockResolvedValue('0.3.0');
      const result = await bumpVersion('0.2.0', mockMetrics);
      expect(vi.mocked(ipcCall)).toHaveBeenCalledWith('bump_version', {
        currentVersion: '0.2.0',
        metrics: mockMetrics,
      });
      expect(result).toBe('0.3.0');
    });

    it('returns a string', async () => {
      vi.mocked(ipcCall).mockResolvedValue('1.0.0');
      const result = await bumpVersion('0.9.9', mockMetrics);
      expect(typeof result).toBe('string');
    });
  });

  describe('saveDiff', () => {
    it('calls save_note_version with correct argument keys', async () => {
      vi.mocked(ipcCall).mockResolvedValue(mockEntry);
      const result = await saveDiff('/vault', 'note-id', 'old', 'new', '0.2.0');
      expect(vi.mocked(ipcCall)).toHaveBeenCalledWith('save_note_version', {
        vaultRoot: '/vault',
        fileId: 'note-id',
        oldContent: 'old',
        newContent: 'new',
        version: '0.2.0',
      });
      expect(result).toEqual(mockEntry);
    });

    it('returns VersionEntry shape', async () => {
      vi.mocked(ipcCall).mockResolvedValue(mockEntry);
      const result = await saveDiff('/vault', 'note-id', 'old', 'new', '0.2.0');
      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('bumpType');
      expect(result).toHaveProperty('diffPath');
      expect(result).toHaveProperty('metrics');
    });
  });

  describe('listVersions', () => {
    it('calls list_note_versions with correct argument keys', async () => {
      vi.mocked(ipcCall).mockResolvedValue([mockEntry]);
      const result = await listVersions('/vault', 'note-id');
      expect(vi.mocked(ipcCall)).toHaveBeenCalledWith('list_note_versions', {
        vaultRoot: '/vault',
        fileId: 'note-id',
      });
      expect(result).toEqual([mockEntry]);
    });

    it('returns VersionEntry array shape', async () => {
      vi.mocked(ipcCall).mockResolvedValue([mockEntry]);
      const result = await listVersions('/vault', 'note-id');
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('version');
    });
  });

  describe('getNoteDiff', () => {
    it('calls get_note_diff with correct argument keys', async () => {
      vi.mocked(ipcCall).mockResolvedValue('{"version":"0.2.0"}');
      const result = await getNoteDiff('/vault', 'note-id', '12345-0-2-0.json');
      expect(vi.mocked(ipcCall)).toHaveBeenCalledWith('get_note_diff', {
        vaultRoot: '/vault',
        fileId: 'note-id',
        version: '12345-0-2-0.json',
      });
      expect(typeof result).toBe('string');
    });
  });
});
