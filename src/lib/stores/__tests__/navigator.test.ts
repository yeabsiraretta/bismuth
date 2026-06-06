import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
  navigatorStore,
  profiles,
  selectedFolder,
  selectedNote,
  activeProfile,
  selectFolder,
  selectNote,
  setActiveTab,
  switchProfile,
  pinNote,
  unpinNote,
  setFolderColor,
  setFolderIcon,
  setFileColor,
  setFileIcon,
  addShortcut,
  removeShortcut,
} from '../navigator/navigator';
import type { Note } from '@/types/vault';

const mockNote: Note = {
  path: '/vault/note.md',
  title: 'Test Note',
  content: '',
  frontmatter: {},
} as Note;

describe('navigator store', () => {
  beforeEach(() => {
    navigatorStore.set({
      selectedFolder: null,
      selectedNote: null,
      activeProfile: 'default',
      activeTab: 'folders',
      pinnedNotes: {},
      folderColors: {},
      folderIcons: {},
      fileColors: {},
      fileIcons: {},
      shortcuts: [],
    });
    profiles.set([
      {
        id: 'default',
        name: 'Default',
        hiddenFolderGlobs: ['.git', 'node_modules', '.bismuth'],
        hiddenTagPatterns: [],
        sortPreference: 'name',
        sortDirection: 'asc',
      },
    ]);
  });

  describe('selectFolder', () => {
    it('should set selected folder', () => {
      selectFolder('/vault/notes');
      expect(get(selectedFolder)).toBe('/vault/notes');
    });

    it('should clear with null', () => {
      selectFolder('/vault/notes');
      selectFolder(null);
      expect(get(selectedFolder)).toBeNull();
    });
  });

  describe('selectNote', () => {
    it('should set selected note', () => {
      selectNote(mockNote);
      expect(get(selectedNote)).toBe(mockNote);
    });

    it('should clear with null', () => {
      selectNote(mockNote);
      selectNote(null);
      expect(get(selectedNote)).toBeNull();
    });
  });

  describe('setActiveTab', () => {
    it('should switch tabs', () => {
      setActiveTab('tags');
      expect(get(navigatorStore).activeTab).toBe('tags');
      setActiveTab('properties');
      expect(get(navigatorStore).activeTab).toBe('properties');
      setActiveTab('folders');
      expect(get(navigatorStore).activeTab).toBe('folders');
    });
  });

  describe('switchProfile', () => {
    it('should change active profile', () => {
      switchProfile('custom');
      expect(get(navigatorStore).activeProfile).toBe('custom');
    });
  });

  describe('activeProfile derived', () => {
    it('should resolve to matching profile', () => {
      expect(get(activeProfile).id).toBe('default');
    });

    it('should fallback to first profile if not found', () => {
      switchProfile('nonexistent');
      expect(get(activeProfile).id).toBe('default');
    });
  });

  describe('pinNote / unpinNote', () => {
    it('should pin a note to a folder', () => {
      pinNote('/vault', '/vault/note.md');
      const state = get(navigatorStore);
      expect(state.pinnedNotes['/vault']).toContain('/vault/note.md');
    });

    it('should not duplicate pins', () => {
      pinNote('/vault', '/vault/note.md');
      pinNote('/vault', '/vault/note.md');
      const state = get(navigatorStore);
      expect(state.pinnedNotes['/vault']).toHaveLength(1);
    });

    it('should unpin a note', () => {
      pinNote('/vault', '/vault/a.md');
      pinNote('/vault', '/vault/b.md');
      unpinNote('/vault', '/vault/a.md');
      const state = get(navigatorStore);
      expect(state.pinnedNotes['/vault']).toEqual(['/vault/b.md']);
    });
  });

  describe('color/icon assignment', () => {
    it('should set folder color', () => {
      setFolderColor('/vault/projects', '#ff0000');
      expect(get(navigatorStore).folderColors['/vault/projects']).toBe('#ff0000');
    });

    it('should set folder icon', () => {
      setFolderIcon('/vault/projects', 'folder-open');
      expect(get(navigatorStore).folderIcons['/vault/projects']).toBe('folder-open');
    });

    it('should set file color', () => {
      setFileColor('/vault/note.md', '#00ff00');
      expect(get(navigatorStore).fileColors['/vault/note.md']).toBe('#00ff00');
    });

    it('should set file icon', () => {
      setFileIcon('/vault/note.md', 'file-text');
      expect(get(navigatorStore).fileIcons['/vault/note.md']).toBe('file-text');
    });
  });

  describe('shortcuts', () => {
    it('should add a shortcut', () => {
      addShortcut({ type: 'note', path: '/vault/note.md', label: 'Note' });
      expect(get(navigatorStore).shortcuts).toHaveLength(1);
    });

    it('should limit to 9 shortcuts', () => {
      for (let i = 0; i < 12; i++) {
        addShortcut({ type: 'note', path: `/vault/${i}.md`, label: `Note ${i}` });
      }
      expect(get(navigatorStore).shortcuts).toHaveLength(9);
    });

    it('should remove a shortcut by index', () => {
      addShortcut({ type: 'note', path: '/a.md', label: 'A' });
      addShortcut({ type: 'folder', path: '/b', label: 'B' });
      removeShortcut(0);
      const shortcuts = get(navigatorStore).shortcuts;
      expect(shortcuts).toHaveLength(1);
      expect(shortcuts[0].label).toBe('B');
    });
  });
});
