import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';

vi.mock('@tauri-apps/api/core');
vi.mock('@tauri-apps/api/event');
vi.mock('@/services/vault/vault', () => ({
  openVault: vi.fn(),
  scanVault: vi.fn(),
  getNote: vi.fn(),
}));
vi.mock('@/utils/logger', () => ({
  log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock('@/utils/id', () => ({
  generatePrefixedId: vi.fn((prefix: string) => `${prefix}_test-id`),
}));

import {
  editorTabs,
  activeEditorTabId,
  tabOrientation,
  setTabOrientation,
  toggleTabOrientation,
  openNoteTab,
  closeTab,
  closeAllTabs,
  closeOtherTabs,
  markTabDirty,
  reorderEditorTabs,
} from '../tabs';
import type { Note } from '@/types/data/vault';

const mockNote: Note = {
  path: '/vault/note1.md',
  title: 'Note 1',
  content: '# Note 1',
  frontmatter: {},
  created_at: '2026-01-01',
  modified_at: '2026-01-01',
} as Note;

const mockNote2: Note = {
  path: '/vault/note2.md',
  title: 'Note 2',
  content: '# Note 2',
  frontmatter: {},
  created_at: '2026-01-01',
  modified_at: '2026-01-01',
} as Note;

describe('editor tabs store', () => {
  beforeEach(() => {
    closeAllTabs();
    setTabOrientation('horizontal');
    vi.clearAllMocks();
  });

  describe('openNoteTab', () => {
    it('opens a new tab for a note', async () => {
      await openNoteTab(mockNote);
      const tabs = get(editorTabs);
      expect(tabs).toHaveLength(1);
      expect(tabs[0].path).toBe(mockNote.path);
      expect(tabs[0].title).toBe(mockNote.title);
      expect(tabs[0].dirty).toBe(false);
    });

    it('does not duplicate if note is already open', async () => {
      await openNoteTab(mockNote);
      await openNoteTab(mockNote);
      expect(get(editorTabs)).toHaveLength(1);
    });

    it('sets the new tab as active', async () => {
      await openNoteTab(mockNote);
      expect(get(activeEditorTabId)).toBe('tab_test-id');
    });

    it('can open multiple tabs', async () => {
      await openNoteTab(mockNote);
      vi.mocked((await import('@/utils/id')).generatePrefixedId).mockReturnValueOnce('tab_second');
      await openNoteTab(mockNote2);
      expect(get(editorTabs)).toHaveLength(2);
    });
  });

  describe('closeTab', () => {
    it('removes the tab from the list', async () => {
      await openNoteTab(mockNote);
      const tabs = get(editorTabs);
      closeTab(tabs[0].id);
      expect(get(editorTabs)).toHaveLength(0);
    });

    it('clears activeTabId when last tab is closed', async () => {
      await openNoteTab(mockNote);
      closeTab(get(editorTabs)[0].id);
      expect(get(activeEditorTabId)).toBeNull();
    });

    it('does nothing for non-existent tab ID', () => {
      closeTab('nonexistent');
      expect(get(editorTabs)).toHaveLength(0);
    });
  });

  describe('closeAllTabs', () => {
    it('removes all tabs', async () => {
      await openNoteTab(mockNote);
      closeAllTabs();
      expect(get(editorTabs)).toHaveLength(0);
      expect(get(activeEditorTabId)).toBeNull();
    });
  });

  describe('closeOtherTabs', () => {
    it('keeps only the specified tab', async () => {
      await openNoteTab(mockNote);
      const firstTabId = get(editorTabs)[0].id;
      vi.mocked((await import('@/utils/id')).generatePrefixedId).mockReturnValueOnce('tab_2');
      await openNoteTab(mockNote2);
      closeOtherTabs(firstTabId);
      expect(get(editorTabs)).toHaveLength(1);
      expect(get(editorTabs)[0].id).toBe(firstTabId);
    });
  });

  describe('markTabDirty', () => {
    it('marks a tab as dirty', async () => {
      await openNoteTab(mockNote);
      const tabId = get(editorTabs)[0].id;
      markTabDirty(tabId, true);
      expect(get(editorTabs)[0].dirty).toBe(true);
    });

    it('marks a tab as clean', async () => {
      await openNoteTab(mockNote);
      const tabId = get(editorTabs)[0].id;
      markTabDirty(tabId, true);
      markTabDirty(tabId, false);
      expect(get(editorTabs)[0].dirty).toBe(false);
    });
  });

  describe('reorderEditorTabs', () => {
    it('replaces tab order', async () => {
      await openNoteTab(mockNote);
      vi.mocked((await import('@/utils/id')).generatePrefixedId).mockReturnValueOnce('tab_b');
      await openNoteTab(mockNote2);
      const tabs = get(editorTabs);
      reorderEditorTabs([tabs[1], tabs[0]]);
      expect(get(editorTabs)[0].id).toBe('tab_b');
    });
  });

  describe('tab orientation', () => {
    it('defaults to horizontal', () => {
      expect(get(tabOrientation)).toBe('horizontal');
    });

    it('setTabOrientation changes value', () => {
      setTabOrientation('vertical');
      expect(get(tabOrientation)).toBe('vertical');
    });

    it('toggleTabOrientation flips value', () => {
      toggleTabOrientation();
      expect(get(tabOrientation)).toBe('vertical');
      toggleTabOrientation();
      expect(get(tabOrientation)).toBe('horizontal');
    });
  });
});
