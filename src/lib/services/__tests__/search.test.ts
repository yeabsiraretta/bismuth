import { describe, it, expect, beforeEach, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';

vi.mock('@tauri-apps/api/core');

import { searchVault, searchInFile } from '../search/search';

describe('search service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('searchVault', () => {
    it('should invoke search_vault command with query', async () => {
      const mockResults = [
        { path: '/vault/note.md', title: 'Note', snippet: 'match here', score: 0.95 },
      ];
      vi.mocked(invoke).mockResolvedValue(mockResults);

      const results = await searchVault('test query');

      expect(invoke).toHaveBeenCalledWith('search_vault', {
        query: 'test query',
        filters: undefined,
      });
      expect(results).toHaveLength(1);
      expect(results[0].score).toBe(0.95);
    });

    it('should pass filters to command', async () => {
      vi.mocked(invoke).mockResolvedValue([]);

      const filters = { tags: ['project'], portent_type: 'Task' };
      await searchVault('query', filters as any);

      expect(invoke).toHaveBeenCalledWith('search_vault', {
        query: 'query',
        filters,
      });
    });

    it('should throw on backend error', async () => {
      vi.mocked(invoke).mockRejectedValue('Index not ready');
      await expect(searchVault('test')).rejects.toThrow('Failed to search vault');
    });
  });

  describe('searchInFile', () => {
    it('should invoke search_in_file command', async () => {
      const mockMatches = [{ line: 5, text: 'match here' }];
      vi.mocked(invoke).mockResolvedValue(mockMatches);

      const results = await searchInFile('/vault/note.md', 'pattern');

      expect(invoke).toHaveBeenCalledWith('search_in_file', {
        path: '/vault/note.md',
        query: 'pattern',
      });
      expect(results).toHaveLength(1);
    });

    it('should throw on error', async () => {
      vi.mocked(invoke).mockRejectedValue('File not found');
      await expect(searchInFile('/bad.md', 'x')).rejects.toThrow('Failed to search in file');
    });
  });
});
