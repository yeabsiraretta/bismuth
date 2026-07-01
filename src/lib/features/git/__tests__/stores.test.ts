import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';

vi.mock('@tauri-apps/api/core');
vi.mock('@tauri-apps/api/event');
vi.mock('../services/git', () => ({
  getCurrentBranch: vi.fn(),
  getGitStatus: vi.fn(),
}));
vi.mock('@/utils/logger', () => ({
  log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { gitState, modifiedCount, refreshGitStatus } from '../stores/git';
import * as gitService from '../services/git';

describe('git store', () => {
  beforeEach(() => {
    gitState.set({ initialized: false, branch: '', files: [], loading: false });
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('starts uninitialized', () => {
      const state = get(gitState);
      expect(state.initialized).toBe(false);
      expect(state.branch).toBe('');
      expect(state.files).toEqual([]);
      expect(state.loading).toBe(false);
    });
  });

  describe('modifiedCount', () => {
    it('derives count from files array', () => {
      gitState.set({
        initialized: true,
        branch: 'main',
        files: [
          { path: 'a.md', status: 'modified' },
          { path: 'b.md', status: 'added' },
        ],
        loading: false,
      });
      expect(get(modifiedCount)).toBe(2);
    });

    it('returns 0 when no files', () => {
      expect(get(modifiedCount)).toBe(0);
    });
  });

  describe('refreshGitStatus', () => {
    it('loads branch and files on success', async () => {
      vi.mocked(gitService.getCurrentBranch).mockResolvedValue('feature/tests');
      vi.mocked(gitService.getGitStatus).mockResolvedValue([
        { path: 'src/file.ts', status: 'modified' },
      ]);

      await refreshGitStatus();
      const state = get(gitState);
      expect(state.initialized).toBe(true);
      expect(state.branch).toBe('feature/tests');
      expect(state.files).toHaveLength(1);
      expect(state.loading).toBe(false);
    });

    it('sets loading true during fetch', async () => {
      let capturedLoading = false;
      vi.mocked(gitService.getCurrentBranch).mockImplementation(async () => {
        capturedLoading = get(gitState).loading;
        return 'main';
      });
      vi.mocked(gitService.getGitStatus).mockResolvedValue([]);

      await refreshGitStatus();
      expect(capturedLoading).toBe(true);
    });

    it('handles errors gracefully without crashing', async () => {
      vi.mocked(gitService.getCurrentBranch).mockRejectedValue(new Error('no repo'));
      vi.mocked(gitService.getGitStatus).mockRejectedValue(new Error('no repo'));

      await refreshGitStatus();
      const state = get(gitState);
      expect(state.loading).toBe(false);
      expect(state.initialized).toBe(false);
    });
  });
});
