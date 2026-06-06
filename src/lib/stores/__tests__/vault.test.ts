import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';

vi.mock('@tauri-apps/api/core');
vi.mock('@tauri-apps/api/event');
vi.mock('@/services/vault/vault');
vi.mock('@/utils/logger', () => ({
  log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import {
  currentVault,
  notes,
  activeNote,
  isLoadingVault,
  isLoadingNotes,
  showArchived,
  isVaultOpen,
  notesByPath,
  visibleNotes,
  setActiveNote,
  updateNoteInStore,
  removeNoteFromStore,
  openVault,
  refreshNotes,
} from '../vault/vault';
import * as vaultService from '@/services/vault/vault';
import type { Note, Vault } from '@/types/vault';

const mockVault: Vault = { name: 'test', root_path: '/test/vault' } as Vault;
const mockNote: Note = {
  path: '/test/vault/note1.md',
  title: 'Note 1',
  content: '# Note 1',
  frontmatter: {},
  created_at: '2026-01-01',
  modified_at: '2026-01-01',
} as Note;

const mockArchivedNote: Note = {
  path: '/test/vault/archived.md',
  title: 'Archived',
  content: '',
  frontmatter: { archived: true },
  created_at: '2026-01-01',
  modified_at: '2026-01-01',
} as Note;

describe('vault store', () => {
  beforeEach(() => {
    currentVault.set(null);
    notes.set([]);
    activeNote.set(null);
    isLoadingVault.set(false);
    isLoadingNotes.set(false);
    showArchived.set(false);
    vi.clearAllMocks();
  });

  describe('derived stores', () => {
    it('isVaultOpen should be false when no vault', () => {
      expect(get(isVaultOpen)).toBe(false);
    });

    it('isVaultOpen should be true when vault set', () => {
      currentVault.set(mockVault);
      expect(get(isVaultOpen)).toBe(true);
    });

    it('notesByPath should index notes by path', () => {
      const note2: Note = { ...mockNote, path: '/test/vault/note2.md', title: 'Note 2' };
      notes.set([mockNote, note2]);
      const map = get(notesByPath);
      expect(map.size).toBe(2);
      expect(map.get('/test/vault/note1.md')).toBe(mockNote);
      expect(map.get('/test/vault/note2.md')).toBe(note2);
    });

    it('visibleNotes should exclude archived notes', () => {
      notes.set([mockNote, mockArchivedNote]);
      expect(get(visibleNotes)).toHaveLength(1);
      expect(get(visibleNotes)[0].title).toBe('Note 1');
    });

    it('visibleNotes should include archived when toggled', () => {
      notes.set([mockNote, mockArchivedNote]);
      showArchived.set(true);
      expect(get(visibleNotes)).toHaveLength(2);
    });
  });

  describe('setActiveNote', () => {
    it('should set active note', () => {
      setActiveNote(mockNote);
      expect(get(activeNote)).toBe(mockNote);
    });

    it('should clear active note with null', () => {
      setActiveNote(mockNote);
      setActiveNote(null);
      expect(get(activeNote)).toBeNull();
    });
  });

  describe('updateNoteInStore', () => {
    it('should add new note if not present', () => {
      notes.set([]);
      updateNoteInStore(mockNote);
      expect(get(notes)).toHaveLength(1);
      expect(get(notes)[0]).toBe(mockNote);
    });

    it('should replace existing note by path', () => {
      notes.set([mockNote]);
      const updated = { ...mockNote, title: 'Updated Title' };
      updateNoteInStore(updated);
      expect(get(notes)).toHaveLength(1);
      expect(get(notes)[0].title).toBe('Updated Title');
    });

    it('should update activeNote if same path', () => {
      activeNote.set(mockNote);
      const updated = { ...mockNote, content: 'new content' };
      updateNoteInStore(updated);
      expect(get(activeNote)?.content).toBe('new content');
    });

    it('should not update activeNote if different path', () => {
      activeNote.set(mockNote);
      const other: Note = { ...mockNote, path: '/other.md', title: 'Other' };
      updateNoteInStore(other);
      expect(get(activeNote)?.path).toBe(mockNote.path);
    });
  });

  describe('removeNoteFromStore', () => {
    it('should remove note by path', () => {
      notes.set([mockNote]);
      removeNoteFromStore(mockNote.path);
      expect(get(notes)).toHaveLength(0);
    });

    it('should clear activeNote if removed', () => {
      notes.set([mockNote]);
      activeNote.set(mockNote);
      removeNoteFromStore(mockNote.path);
      expect(get(activeNote)).toBeNull();
    });

    it('should not clear activeNote if different path removed', () => {
      const other: Note = { ...mockNote, path: '/other.md' };
      notes.set([mockNote, other]);
      activeNote.set(mockNote);
      removeNoteFromStore('/other.md');
      expect(get(activeNote)).toBe(mockNote);
    });
  });

  describe('openVault', () => {
    it('should call service and set vault', async () => {
      vi.mocked(vaultService.openVault).mockResolvedValue(mockVault);
      vi.mocked(vaultService.scanVault).mockResolvedValue([mockNote]);

      await openVault('/test/vault');

      expect(vaultService.openVault).toHaveBeenCalledWith('/test/vault');
      expect(get(currentVault)).toBe(mockVault);
      expect(get(notes)).toHaveLength(1);
      expect(get(isLoadingVault)).toBe(false);
    });

    it('should set loading state during operation', async () => {
      let capturedLoading = false;
      vi.mocked(vaultService.openVault).mockImplementation(async () => {
        capturedLoading = get(isLoadingVault);
        return mockVault;
      });
      vi.mocked(vaultService.scanVault).mockResolvedValue([]);

      await openVault('/test');
      expect(capturedLoading).toBe(true);
      expect(get(isLoadingVault)).toBe(false);
    });

    it('should throw and reset on error', async () => {
      vi.mocked(vaultService.openVault).mockRejectedValue(new Error('Not found'));

      await expect(openVault('/bad')).rejects.toThrow();
      expect(get(currentVault)).toBeNull();
      expect(get(isLoadingVault)).toBe(false);
    });
  });

  describe('refreshNotes', () => {
    it('should no-op if no vault open', async () => {
      currentVault.set(null);
      await refreshNotes();
      expect(vaultService.scanVault).not.toHaveBeenCalled();
    });

    it('should refresh notes when vault is open', async () => {
      currentVault.set(mockVault);
      vi.mocked(vaultService.scanVault).mockResolvedValue([mockNote]);

      await refreshNotes();
      expect(get(notes)).toHaveLength(1);
      expect(get(isLoadingNotes)).toBe(false);
    });
  });
});
