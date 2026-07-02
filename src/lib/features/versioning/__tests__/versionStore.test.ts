import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';

// Mock Tauri IPC and logger before importing store modules.
vi.mock('@/utils/ipc', () => ({
  ipcCall: vi.fn(),
}));
vi.mock('@/utils/logger', () => ({
  log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import * as versioningService from '../services/versioning';
import {
  activeVersionHistory,
  selectedEntry,
  isLoading,
  loadVersionHistory,
  selectEntry,
  clearHistory,
} from '../stores/versionStore';
import type { VersionEntry } from '../types/versioning';

vi.mock('../services/versioning', () => ({
  listVersions: vi.fn(),
  computeDiffMetrics: vi.fn(),
  bumpVersion: vi.fn(),
  saveDiff: vi.fn(),
  getNoteDiff: vi.fn(),
}));

const mockEntry: VersionEntry = {
  version: '0.2.0',
  timestamp: '2026-06-21T10:00:00Z',
  bumpType: 'minor',
  summary: 'Content updated: +5 -2 lines',
  diffPath: '.bismuth/versions/test-id/12345-0-2-0.json',
  metrics: {
    addedLines: 5,
    removedLines: 2,
    totalLines: 30,
    headingDelta: 1,
    structuralTokenDelta: 1,
  },
};

const mockEntry2: VersionEntry = {
  version: '0.1.0',
  timestamp: '2026-06-21T09:00:00Z',
  bumpType: 'patch',
  summary: 'Minor edit: +1 -0 lines',
  diffPath: '.bismuth/versions/test-id/12000-0-1-0.json',
  metrics: {
    addedLines: 1,
    removedLines: 0,
    totalLines: 25,
    headingDelta: 0,
    structuralTokenDelta: 0,
  },
};

describe('versionStore', () => {
  beforeEach(() => {
    activeVersionHistory.set(null);
    selectedEntry.set(null);
    isLoading.set(false);
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('starts with null activeVersionHistory', () => {
      expect(get(activeVersionHistory)).toBeNull();
    });

    it('starts with null selectedEntry', () => {
      expect(get(selectedEntry)).toBeNull();
    });

    it('starts with isLoading false', () => {
      expect(get(isLoading)).toBe(false);
    });
  });

  describe('loadVersionHistory', () => {
    it('sets activeVersionHistory from mocked listVersions response', async () => {
      vi.mocked(versioningService.listVersions).mockResolvedValue([mockEntry, mockEntry2]);

      await loadVersionHistory('/vault', 'test-id');

      const history = get(activeVersionHistory);
      expect(history).not.toBeNull();
      expect(history!.fileId).toBe('test-id');
      expect(history!.entries).toHaveLength(2);
      expect(history!.entries[0].version).toBe('0.2.0');
    });

    it('sets currentVersion from first entry', async () => {
      vi.mocked(versioningService.listVersions).mockResolvedValue([mockEntry]);

      await loadVersionHistory('/vault', 'test-id');

      const history = get(activeVersionHistory);
      expect(history!.currentVersion).toBe('0.2.0');
    });

    it('sets isLoading to false after successful load', async () => {
      vi.mocked(versioningService.listVersions).mockResolvedValue([mockEntry]);

      await loadVersionHistory('/vault', 'test-id');

      expect(get(isLoading)).toBe(false);
    });

    it('handles empty entries and defaults currentVersion to 0.1.0', async () => {
      vi.mocked(versioningService.listVersions).mockResolvedValue([]);

      await loadVersionHistory('/vault', 'empty-id');

      const history = get(activeVersionHistory);
      expect(history!.entries).toHaveLength(0);
      expect(history!.currentVersion).toBe('0.1.0');
    });

    it('sets isLoading to false even when listVersions rejects', async () => {
      vi.mocked(versioningService.listVersions).mockRejectedValue(new Error('IPC error'));

      await loadVersionHistory('/vault', 'bad-id');

      expect(get(isLoading)).toBe(false);
    });

    it('leaves activeVersionHistory unchanged when listVersions rejects', async () => {
      vi.mocked(versioningService.listVersions).mockRejectedValue(new Error('IPC error'));

      await loadVersionHistory('/vault', 'bad-id');

      // Store should remain null (not crash)
      expect(get(activeVersionHistory)).toBeNull();
    });
  });

  describe('selectEntry', () => {
    it('sets selectedEntry to the given entry', () => {
      selectEntry(mockEntry);
      expect(get(selectedEntry)).toEqual(mockEntry);
    });

    it('replaces previous selectedEntry', () => {
      selectEntry(mockEntry);
      selectEntry(mockEntry2);
      expect(get(selectedEntry)!.version).toBe('0.1.0');
    });
  });

  describe('clearHistory', () => {
    it('resets activeVersionHistory to null', async () => {
      vi.mocked(versioningService.listVersions).mockResolvedValue([mockEntry]);
      await loadVersionHistory('/vault', 'test-id');
      clearHistory();
      expect(get(activeVersionHistory)).toBeNull();
    });

    it('resets selectedEntry to null', () => {
      selectEntry(mockEntry);
      clearHistory();
      expect(get(selectedEntry)).toBeNull();
    });
  });
});
