import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

import { searchVault, searchInFile, searchNotes } from '../services/search';
import { invoke } from '@tauri-apps/api/core';

describe('search service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('searchVault', () => {
    it('calls invoke with query', async () => {
      vi.mocked(invoke).mockResolvedValue([]);
      await searchVault('typescript');
      expect(invoke).toHaveBeenCalledWith('search_vault', { query: 'typescript', filters: undefined });
    });

    it('passes filters when provided', async () => {
      vi.mocked(invoke).mockResolvedValue([]);
      const filters = { tags: ['work'], paths: ['/vault/projects/'] };
      await searchVault('query', filters);
      expect(invoke).toHaveBeenCalledWith('search_vault', { query: 'query', filters });
    });

    it('returns search results', async () => {
      const results = [{ path: '/a.md', title: 'A', snippet: 'match', score: 0.9 }];
      vi.mocked(invoke).mockResolvedValue(results);
      const result = await searchVault('test');
      expect(result).toEqual(results);
    });

    it('throws on failure', async () => {
      vi.mocked(invoke).mockRejectedValue('timeout');
      await expect(searchVault('q')).rejects.toThrow('Failed to search vault');
    });
  });

  describe('searchInFile', () => {
    it('calls invoke with path and query', async () => {
      vi.mocked(invoke).mockResolvedValue([]);
      await searchInFile('/vault/note.md', 'pattern');
      expect(invoke).toHaveBeenCalledWith('search_in_file', { path: '/vault/note.md', query: 'pattern' });
    });

    it('returns file matches', async () => {
      const matches = [{ line: 5, content: 'hello pattern world', offset: 6 }];
      vi.mocked(invoke).mockResolvedValue(matches);
      const result = await searchInFile('/f', 'pattern');
      expect(result).toEqual(matches);
    });

    it('throws on failure', async () => {
      vi.mocked(invoke).mockRejectedValue('not found');
      await expect(searchInFile('/x', 'q')).rejects.toThrow('Failed to search in file');
    });
  });

  describe('searchNotes', () => {
    it('calls invoke with query and default limit', async () => {
      vi.mocked(invoke).mockResolvedValue([]);
      await searchNotes('test');
      expect(invoke).toHaveBeenCalledWith('search_notes', { query: 'test', limit: 50 });
    });

    it('passes custom limit', async () => {
      vi.mocked(invoke).mockResolvedValue([]);
      await searchNotes('test', 10);
      expect(invoke).toHaveBeenCalledWith('search_notes', { query: 'test', limit: 10 });
    });

    it('throws on failure', async () => {
      vi.mocked(invoke).mockRejectedValue('error');
      await expect(searchNotes('q')).rejects.toThrow('Failed to search notes');
    });
  });
});
