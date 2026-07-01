import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));
vi.mock('@tauri-apps/api/event');
vi.mock('@/utils/logger', () => ({
  log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const mockStorage: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: vi.fn((key: string) => mockStorage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    mockStorage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockStorage[key];
  }),
});

import { notes } from '@/stores/vault/vault';
import {
  allTags,
  tagHierarchy,
  hiddenTags,
  visibleTags,
  toggleTagVisibility,
  hideTag,
  showTag,
  renameTag,
  mergeTags,
} from '../stores/tag';
import { invoke } from '@tauri-apps/api/core';
import type { Note } from '@/types/data/vault';

function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    path: '/vault/note.md',
    title: 'Test Note',
    content: '',
    frontmatter: {},
    created_at: '2026-01-01',
    modified_at: '2026-01-01',
    ...overrides,
  } as Note;
}

describe('tag store', () => {
  beforeEach(() => {
    notes.set([]);
    hiddenTags.set(new Set());
    vi.clearAllMocks();
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  });

  describe('allTags', () => {
    it('extracts frontmatter tags', () => {
      notes.set([makeNote({ frontmatter: { tags: ['work', 'urgent'] } })]);
      const tags = get(allTags);
      expect(tags.get('work')).toBe(1);
      expect(tags.get('urgent')).toBe(1);
    });

    it('extracts inline #tags from content', () => {
      notes.set([makeNote({ content: 'Hello #world #test' })]);
      const tags = get(allTags);
      expect(tags.get('world')).toBe(1);
      expect(tags.get('test')).toBe(1);
    });

    it('counts duplicates across notes', () => {
      notes.set([
        makeNote({ frontmatter: { tags: ['shared'] } }),
        makeNote({ path: '/vault/b.md', frontmatter: { tags: ['shared'] } }),
      ]);
      expect(get(allTags).get('shared')).toBe(2);
    });

    it('returns empty map for no notes', () => {
      expect(get(allTags).size).toBe(0);
    });
  });

  describe('tagHierarchy', () => {
    it('builds flat tags as roots', () => {
      notes.set([makeNote({ frontmatter: { tags: ['alpha', 'beta'] } })]);
      const roots = get(tagHierarchy);
      expect(roots).toHaveLength(2);
      expect(roots[0].name).toBe('alpha');
    });

    it('nests tags with / separator', () => {
      notes.set([makeNote({ frontmatter: { tags: ['project', 'project/web'] } })]);
      const roots = get(tagHierarchy);
      expect(roots).toHaveLength(1);
      expect(roots[0].name).toBe('project');
      expect(roots[0].children).toHaveLength(1);
      expect(roots[0].children[0].name).toBe('project/web');
    });
  });

  describe('visibleTags', () => {
    it('excludes hidden tags', () => {
      notes.set([makeNote({ frontmatter: { tags: ['a', 'b', 'c'] } })]);
      hiddenTags.set(new Set(['b']));
      const visible = get(visibleTags);
      const names = visible.map((n) => n.name);
      expect(names).toContain('a');
      expect(names).toContain('c');
      expect(names).not.toContain('b');
    });
  });

  describe('toggleTagVisibility', () => {
    it('hides a visible tag', () => {
      toggleTagVisibility('work');
      expect(get(hiddenTags).has('work')).toBe(true);
    });

    it('shows a hidden tag', () => {
      hiddenTags.set(new Set(['work']));
      toggleTagVisibility('work');
      expect(get(hiddenTags).has('work')).toBe(false);
    });

    it('persists to localStorage', () => {
      toggleTagVisibility('persist-test');
      expect(localStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('hideTag / showTag', () => {
    it('hideTag adds to hidden set', () => {
      hideTag('secret');
      expect(get(hiddenTags).has('secret')).toBe(true);
    });

    it('showTag removes from hidden set', () => {
      hiddenTags.set(new Set(['secret']));
      showTag('secret');
      expect(get(hiddenTags).has('secret')).toBe(false);
    });
  });

  describe('renameTag', () => {
    it('calls invoke with correct args', async () => {
      vi.mocked(invoke).mockResolvedValue({
        notes_modified: 3,
        was_merge: false,
        children_renamed: 0,
      });
      const result = await renameTag('old', 'new');
      expect(invoke).toHaveBeenCalledWith('rename_tag', { oldName: 'old', newName: 'new' });
      expect(result.notes_modified).toBe(3);
    });

    it('throws on error', async () => {
      vi.mocked(invoke).mockRejectedValue(new Error('fail'));
      await expect(renameTag('a', 'b')).rejects.toThrow();
    });
  });

  describe('mergeTags', () => {
    it('calls invoke with correct args', async () => {
      vi.mocked(invoke).mockResolvedValue({
        notes_modified: 2,
        was_merge: true,
        children_renamed: 1,
      });
      const result = await mergeTags('src', 'dest');
      expect(invoke).toHaveBeenCalledWith('merge_tags', { sourceTag: 'src', targetTag: 'dest' });
      expect(result.was_merge).toBe(true);
    });
  });
});
