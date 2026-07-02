import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));
vi.mock('@/utils/logger', () => ({
  log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn(), interaction: vi.fn() },
}));

import {
  initializeGitService,
  getCurrentBranch,
  listBranches,
  getGitStatus,
  gitAdd,
  gitCommit,
  getGitLog,
} from '../services/git';
import { invoke } from '@tauri-apps/api/core';

describe('git service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initializeGitService', () => {
    it('calls invoke with vault root', async () => {
      vi.mocked(invoke).mockResolvedValue(true);
      const result = await initializeGitService('/vault');
      expect(invoke).toHaveBeenCalledWith('initialize_git_service', { vaultRoot: '/vault' });
      expect(result).toBe(true);
    });

    it('returns false on error', async () => {
      vi.mocked(invoke).mockRejectedValue(new Error('no repo'));
      const result = await initializeGitService('/no-git');
      expect(result).toBe(false);
    });
  });

  describe('getCurrentBranch', () => {
    it('calls invoke and returns branch name', async () => {
      vi.mocked(invoke).mockResolvedValue('main');
      const branch = await getCurrentBranch();
      expect(invoke).toHaveBeenCalledWith('git_current_branch', undefined);
      expect(branch).toBe('main');
    });
  });

  describe('listBranches', () => {
    it('returns branch list', async () => {
      vi.mocked(invoke).mockResolvedValue(['main', 'feature/x']);
      const branches = await listBranches();
      expect(invoke).toHaveBeenCalledWith('git_list_branches', undefined);
      expect(branches).toEqual(['main', 'feature/x']);
    });
  });

  describe('getGitStatus', () => {
    it('returns file statuses', async () => {
      const files = [{ path: 'a.md', status: 'modified' }];
      vi.mocked(invoke).mockResolvedValue(files);
      const result = await getGitStatus();
      expect(invoke).toHaveBeenCalledWith('git_status', undefined);
      expect(result).toEqual(files);
    });
  });

  describe('gitAdd', () => {
    it('calls invoke with paths', async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);
      await gitAdd(['src/a.ts', 'src/b.ts']);
      expect(invoke).toHaveBeenCalledWith('git_add', { paths: ['src/a.ts', 'src/b.ts'] });
    });
  });

  describe('gitCommit', () => {
    it('returns commit SHA', async () => {
      vi.mocked(invoke).mockResolvedValue('abc123');
      const sha = await gitCommit('feat: add tests');
      expect(invoke).toHaveBeenCalledWith('git_commit', { message: 'feat: add tests' });
      expect(sha).toBe('abc123');
    });
  });

  describe('getGitLog', () => {
    it('calls invoke with default limit', async () => {
      vi.mocked(invoke).mockResolvedValue([]);
      await getGitLog();
      expect(invoke).toHaveBeenCalledWith('git_log', { limit: 20 });
    });

    it('passes custom limit', async () => {
      vi.mocked(invoke).mockResolvedValue([]);
      await getGitLog(5);
      expect(invoke).toHaveBeenCalledWith('git_log', { limit: 5 });
    });

    it('returns commit entries', async () => {
      const commits = [{ sha: 'abc', message: 'init', author: 'user', timestamp: 1000 }];
      vi.mocked(invoke).mockResolvedValue(commits);
      const result = await getGitLog();
      expect(result).toEqual(commits);
    });
  });
});
