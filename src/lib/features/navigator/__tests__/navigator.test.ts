import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));
vi.mock('@/utils/logger', () => ({
  log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import {
  navigatorStore,
  profiles,
  selectedFolder,
  selectedNote,
  activeProfile,
  selectFolder,
  selectNote,
  setActiveTab,
  setActivePane,
  togglePane,
  setSortField,
  toggleSortDirection,
  setFilterQuery,
  switchProfile,
  pinNote,
  unpinNote,
  setFolderColor,
  setFileColor,
  addShortcut,
  removeShortcut,
  addProfile,
  removeProfile,
} from '../stores/navigator';
import type { Note } from '@/types/data/vault';

const defaultState = {
  selectedFolder: null,
  selectedNote: null,
  activeProfile: 'default',
  activeTab: 'folders' as const,
  activePane: 'navigation' as const,
  sortField: 'name' as const,
  sortDirection: 'asc' as const,
  filterQuery: '',
  pinnedNotes: {},
  folderColors: {},
  folderIcons: {},
  fileColors: {},
  fileIcons: {},
  shortcuts: [],
};

describe('navigator store', () => {
  beforeEach(() => {
    navigatorStore.set({ ...defaultState });
    profiles.set([{
      id: 'default',
      name: 'Default',
      hiddenFolderGlobs: ['.git', 'node_modules', '.bismuth'],
      hiddenTagPatterns: [],
      sortPreference: 'name',
      sortDirection: 'asc',
    }]);
    vi.clearAllMocks();
  });

  describe('selectFolder', () => {
    it('sets the selected folder', () => {
      selectFolder('/vault/projects');
      expect(get(selectedFolder)).toBe('/vault/projects');
    });

    it('can clear selection with null', () => {
      selectFolder('/vault');
      selectFolder(null);
      expect(get(selectedFolder)).toBeNull();
    });
  });

  describe('selectNote', () => {
    it('sets the selected note', () => {
      const note = { path: '/vault/note.md', title: 'Test' } as Note;
      selectNote(note);
      expect(get(selectedNote)).toEqual(note);
    });
  });

  describe('setActiveTab', () => {
    it('switches tab', () => {
      setActiveTab('tags');
      expect(get(navigatorStore).activeTab).toBe('tags');
    });
  });

  describe('pane management', () => {
    it('setActivePane changes pane', () => {
      setActivePane('list');
      expect(get(navigatorStore).activePane).toBe('list');
    });

    it('togglePane switches between navigation and list', () => {
      togglePane();
      expect(get(navigatorStore).activePane).toBe('list');
      togglePane();
      expect(get(navigatorStore).activePane).toBe('navigation');
    });
  });

  describe('sort management', () => {
    it('setSortField changes field', () => {
      setSortField('modified');
      expect(get(navigatorStore).sortField).toBe('modified');
    });

    it('toggleSortDirection flips direction', () => {
      toggleSortDirection();
      expect(get(navigatorStore).sortDirection).toBe('desc');
      toggleSortDirection();
      expect(get(navigatorStore).sortDirection).toBe('asc');
    });
  });

  describe('setFilterQuery', () => {
    it('updates filter query', () => {
      setFilterQuery('project');
      expect(get(navigatorStore).filterQuery).toBe('project');
    });
  });

  describe('pinNote / unpinNote', () => {
    it('pins a note to a folder', () => {
      pinNote('/vault', '/vault/a.md');
      expect(get(navigatorStore).pinnedNotes['/vault']).toContain('/vault/a.md');
    });

    it('does not duplicate pins', () => {
      pinNote('/vault', '/vault/a.md');
      pinNote('/vault', '/vault/a.md');
      expect(get(navigatorStore).pinnedNotes['/vault']).toHaveLength(1);
    });

    it('unpins a note', () => {
      pinNote('/vault', '/vault/a.md');
      unpinNote('/vault', '/vault/a.md');
      expect(get(navigatorStore).pinnedNotes['/vault']).toHaveLength(0);
    });
  });

  describe('customization', () => {
    it('setFolderColor assigns color', () => {
      setFolderColor('/vault/projects', '#ff0000');
      expect(get(navigatorStore).folderColors['/vault/projects']).toBe('#ff0000');
    });

    it('setFileColor assigns color', () => {
      setFileColor('/vault/note.md', '#00ff00');
      expect(get(navigatorStore).fileColors['/vault/note.md']).toBe('#00ff00');
    });
  });

  describe('shortcuts', () => {
    it('adds a shortcut', () => {
      addShortcut({ type: 'note', path: '/vault/a.md', label: 'My Note' });
      expect(get(navigatorStore).shortcuts).toHaveLength(1);
    });

    it('enforces max 9 shortcuts', () => {
      for (let i = 0; i < 10; i++) {
        addShortcut({ type: 'folder', path: `/vault/${i}`, label: `F${i}` });
      }
      expect(get(navigatorStore).shortcuts).toHaveLength(9);
    });

    it('removes a shortcut by index', () => {
      addShortcut({ type: 'note', path: '/a', label: 'A' });
      addShortcut({ type: 'note', path: '/b', label: 'B' });
      removeShortcut(0);
      expect(get(navigatorStore).shortcuts).toHaveLength(1);
      expect(get(navigatorStore).shortcuts[0].label).toBe('B');
    });
  });

  describe('profiles', () => {
    it('switchProfile changes active profile', () => {
      switchProfile('custom');
      expect(get(navigatorStore).activeProfile).toBe('custom');
    });

    it('activeProfile derives the matching profile', () => {
      const profile = get(activeProfile);
      expect(profile.id).toBe('default');
    });

    it('addProfile appends to profiles list', () => {
      addProfile({
        id: 'work',
        name: 'Work',
        hiddenFolderGlobs: [],
        hiddenTagPatterns: [],
        sortPreference: 'date',
        sortDirection: 'desc',
      });
      expect(get(profiles)).toHaveLength(2);
    });

    it('removeProfile cannot remove default', () => {
      removeProfile('default');
      expect(get(profiles)).toHaveLength(1);
    });

    it('removeProfile removes non-default and resets active', () => {
      addProfile({
        id: 'temp',
        name: 'Temp',
        hiddenFolderGlobs: [],
        hiddenTagPatterns: [],
        sortPreference: 'name',
        sortDirection: 'asc',
      });
      switchProfile('temp');
      removeProfile('temp');
      expect(get(profiles)).toHaveLength(1);
      expect(get(navigatorStore).activeProfile).toBe('default');
    });
  });
});
