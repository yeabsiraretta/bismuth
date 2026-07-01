/**
 * Tag service tests — verifies all invoke() calls for the tag service layer.
 * T015: Testing tag functionality via the service layer (services/tags.ts).
 * The tag store derives from vault notes (tested separately in tag/__tests__/tag.test.ts).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

import { invoke } from '@tauri-apps/api/core';
import {
  createTagPage,
  getAllTags,
  getNotesByTag,
  getTagStats,
  searchTags,
  renameTag,
  mergeTags,
  getRandomNoteWithTag,
} from '../../services/tags';
import type { TagInfo, TagStats, RenameResult } from '../../services/tags';

describe('tag services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createTagPage', () => {
    it('calls invoke create_note with path and content', async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);
      await createTagPage('tags/project.md', '# Project tag');
      expect(invoke).toHaveBeenCalledWith('create_note', {
        path: 'tags/project.md',
        content: '# Project tag',
      });
    });

    it('throws wrapped error on failure', async () => {
      vi.mocked(invoke).mockRejectedValue(new Error('disk error'));
      await expect(createTagPage('bad.md', '')).rejects.toThrow('Failed to create tag page');
    });
  });

  describe('getAllTags', () => {
    it('returns sorted tag info list', async () => {
      const mockTags: TagInfo[] = [
        { name: 'project', count: 5, notes: ['/a.md'] },
        { name: 'work', count: 3, notes: ['/b.md'] },
      ];
      vi.mocked(invoke).mockResolvedValue(mockTags);
      const result = await getAllTags('/vault');
      expect(invoke).toHaveBeenCalledWith('get_all_tags', { vaultPath: '/vault' });
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('project');
    });

    it('returns empty array when no tags', async () => {
      vi.mocked(invoke).mockResolvedValue([]);
      const result = await getAllTags('/vault');
      expect(result).toEqual([]);
    });

    it('throws on invoke failure', async () => {
      vi.mocked(invoke).mockRejectedValue(new Error('not found'));
      await expect(getAllTags('/vault')).rejects.toThrow('Failed to get all tags');
    });
  });

  describe('getNotesByTag', () => {
    it('returns note paths for a given tag', async () => {
      const paths = ['/vault/note1.md', '/vault/note2.md'];
      vi.mocked(invoke).mockResolvedValue(paths);
      const result = await getNotesByTag('project', '/vault');
      expect(invoke).toHaveBeenCalledWith('get_notes_by_tag', {
        tag: 'project',
        vaultPath: '/vault',
      });
      expect(result).toEqual(paths);
    });

    it('returns empty array when no notes match', async () => {
      vi.mocked(invoke).mockResolvedValue([]);
      expect(await getNotesByTag('rare-tag', '/vault')).toEqual([]);
    });

    it('throws on failure', async () => {
      vi.mocked(invoke).mockRejectedValue(new Error('query failed'));
      await expect(getNotesByTag('x', '/vault')).rejects.toThrow('Failed to get notes by tag');
    });
  });

  describe('getTagStats', () => {
    it('returns tag statistics', async () => {
      const stats: TagStats = { total_tags: 10, total_tagged_notes: 25, tags: [] };
      vi.mocked(invoke).mockResolvedValue(stats);
      const result = await getTagStats('/vault');
      expect(invoke).toHaveBeenCalledWith('get_tag_stats', { vaultPath: '/vault' });
      expect(result.total_tags).toBe(10);
      expect(result.total_tagged_notes).toBe(25);
    });
  });

  describe('searchTags', () => {
    it('returns matching tags for a query', async () => {
      const results: TagInfo[] = [{ name: 'project/alpha', count: 2, notes: [] }];
      vi.mocked(invoke).mockResolvedValue(results);
      const result = await searchTags('project', '/vault');
      expect(invoke).toHaveBeenCalledWith('search_tags', { query: 'project', vaultPath: '/vault' });
      expect(result[0].name).toBe('project/alpha');
    });

    it('returns empty array for no matches', async () => {
      vi.mocked(invoke).mockResolvedValue([]);
      expect(await searchTags('zzz-no-match', '/vault')).toEqual([]);
    });

    it('throws on failure', async () => {
      vi.mocked(invoke).mockRejectedValue(new Error('search error'));
      await expect(searchTags('q', '/v')).rejects.toThrow('Failed to search tags');
    });
  });

  describe('renameTag', () => {
    it('calls invoke rename_tag with correct args', async () => {
      const expected: RenameResult = { notes_modified: 4, was_merge: false, children_renamed: 1 };
      vi.mocked(invoke).mockResolvedValue(expected);
      const result = await renameTag('old', 'new');
      expect(invoke).toHaveBeenCalledWith('rename_tag', { oldName: 'old', newName: 'new' });
      expect(result.notes_modified).toBe(4);
      expect(result.children_renamed).toBe(1);
    });

    it('reports merge=false for plain rename', async () => {
      vi.mocked(invoke).mockResolvedValue({
        notes_modified: 1,
        was_merge: false,
        children_renamed: 0,
      });
      const result = await renameTag('a', 'b');
      expect(result.was_merge).toBe(false);
    });

    it('propagates errors', async () => {
      vi.mocked(invoke).mockRejectedValue(new Error('vault locked'));
      await expect(renameTag('a', 'b')).rejects.toThrow('Failed to rename tag');
    });
  });

  describe('mergeTags', () => {
    it('calls invoke merge_tags with source and target', async () => {
      const expected: RenameResult = { notes_modified: 7, was_merge: true, children_renamed: 0 };
      vi.mocked(invoke).mockResolvedValue(expected);
      const result = await mergeTags('source-tag', 'target-tag');
      expect(invoke).toHaveBeenCalledWith('merge_tags', {
        sourceTag: 'source-tag',
        targetTag: 'target-tag',
      });
      expect(result.was_merge).toBe(true);
      expect(result.notes_modified).toBe(7);
    });

    it('throws on failure', async () => {
      vi.mocked(invoke).mockRejectedValue(new Error('merge conflict'));
      await expect(mergeTags('s', 't')).rejects.toThrow('Failed to merge tags');
    });
  });

  describe('getRandomNoteWithTag', () => {
    it('returns a random note path for the tag', async () => {
      vi.mocked(invoke).mockResolvedValue('/vault/random-note.md');
      const result = await getRandomNoteWithTag('project');
      expect(invoke).toHaveBeenCalledWith('get_random_note_with_tag', { tag: 'project' });
      expect(result).toBe('/vault/random-note.md');
    });

    it('throws on failure', async () => {
      vi.mocked(invoke).mockRejectedValue(new Error('no notes'));
      await expect(getRandomNoteWithTag('empty-tag')).rejects.toThrow(
        'Failed to get random note with tag'
      );
    });
  });
});
