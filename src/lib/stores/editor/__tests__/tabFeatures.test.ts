import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';

vi.mock('@tauri-apps/api/core');
vi.mock('@tauri-apps/api/event');
vi.mock('@/services/vault/vault', () => ({
  openVault: vi.fn(),
  scanVault: vi.fn(),
  getNote: vi.fn().mockResolvedValue({
    path: '/vault/reopened.md',
    title: 'Reopened',
    content: '',
    frontmatter: {},
    created_at: '2026-01-01',
    modified_at: '2026-01-01',
  }),
}));
vi.mock('@/utils/logger', () => ({
  log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

let idCounter = 0;
vi.mock('@/utils/id', () => ({
  generatePrefixedId: vi.fn((prefix: string) => `${prefix}_${idCounter++}`),
}));

import {
  editorTabs,
  activeEditorTabId,
  closeTab,
  closeAllTabs,
  openNoteTab,
  _closedHistory,
  _groupsInternal,
} from '../tabs';
import {
  tabGroups,
  closedTabHistory,
  activeTabZoom,
  openEphemeralTab,
  pinTab,
  setTabZoom,
  createTabGroup,
  removeTabGroup,
  toggleGroupCollapse,
  closeTabsToRight,
  closeTabsToLeft,
  reopenClosedTab,
  clearClosedHistory,
} from '../tabFeatures';
import type { Note } from '@/types/data/vault';

const mkNote = (name: string): Note =>
  ({
    path: `/vault/${name}.md`,
    title: name,
    content: `# ${name}`,
    frontmatter: {},
    created_at: '2026-01-01',
    modified_at: '2026-01-01',
  }) as Note;

describe('tabFeatures', () => {
  beforeEach(() => {
    closeAllTabs();
    _closedHistory.set([]);
    _groupsInternal.set([]);
    idCounter = 0;
    vi.clearAllMocks();
  });

  describe('ephemeral tabs', () => {
    it('opens an ephemeral tab with italic marker', async () => {
      await openEphemeralTab(mkNote('preview'));
      const tabs = get(editorTabs);
      expect(tabs).toHaveLength(1);
      expect(tabs[0].ephemeral).toBe(true);
    });

    it('replaces existing ephemeral tab', async () => {
      await openEphemeralTab(mkNote('a'));
      await openEphemeralTab(mkNote('b'));
      const tabs = get(editorTabs);
      expect(tabs).toHaveLength(1);
      expect(tabs[0].title).toBe('b');
    });

    it('does not replace pinned tabs', async () => {
      await openNoteTab(mkNote('pinned'));
      await openEphemeralTab(mkNote('preview'));
      expect(get(editorTabs)).toHaveLength(2);
    });

    it('pinTab promotes ephemeral to permanent', async () => {
      await openEphemeralTab(mkNote('temp'));
      const tabId = get(editorTabs)[0].id;
      pinTab(tabId);
      expect(get(editorTabs)[0].ephemeral).toBe(false);
    });

    it('switching to existing tab works from ephemeral', async () => {
      await openNoteTab(mkNote('existing'));
      await openEphemeralTab(mkNote('existing'));
      expect(get(editorTabs)).toHaveLength(1);
    });
  });

  describe('per-tab zoom', () => {
    it('defaults to 100', async () => {
      await openNoteTab(mkNote('z'));
      expect(get(activeTabZoom)).toBe(100);
    });

    it('setTabZoom changes zoom level', async () => {
      await openNoteTab(mkNote('z'));
      const tabId = get(editorTabs)[0].id;
      setTabZoom(tabId, 150);
      expect(get(activeTabZoom)).toBe(150);
    });

    it('clamps zoom between 50 and 200', async () => {
      await openNoteTab(mkNote('z'));
      const tabId = get(editorTabs)[0].id;
      setTabZoom(tabId, 10);
      expect(get(editorTabs)[0].zoomLevel).toBe(50);
      setTabZoom(tabId, 300);
      expect(get(editorTabs)[0].zoomLevel).toBe(200);
    });
  });

  describe('tab groups', () => {
    it('creates a group and assigns color', () => {
      const gid = createTabGroup('Research');
      const groups = get(tabGroups);
      expect(groups).toHaveLength(1);
      expect(groups[0].name).toBe('Research');
      expect(groups[0].color).toBeTruthy();
      expect(groups[0].collapsed).toBe(false);
    });

    it('removeTabGroup ungroups tabs', async () => {
      await openNoteTab(mkNote('n'));
      const gid = createTabGroup('G');
      const { moveTabToGroup } = await import('../tabs');
      moveTabToGroup(get(editorTabs)[0].id, gid);
      expect(get(editorTabs)[0].groupId).toBe(gid);
      removeTabGroup(gid);
      expect(get(editorTabs)[0].groupId).toBeNull();
      expect(get(tabGroups)).toHaveLength(0);
    });

    it('toggleGroupCollapse flips collapsed state', () => {
      const gid = createTabGroup('G');
      expect(get(tabGroups)[0].collapsed).toBe(false);
      toggleGroupCollapse(gid);
      expect(get(tabGroups)[0].collapsed).toBe(true);
      toggleGroupCollapse(gid);
      expect(get(tabGroups)[0].collapsed).toBe(false);
    });
  });

  describe('tab history', () => {
    it('closing a tab pushes to history', async () => {
      await openNoteTab(mkNote('h'));
      const tabId = get(editorTabs)[0].id;
      closeTab(tabId);
      expect(get(closedTabHistory)).toHaveLength(1);
      expect(get(closedTabHistory)[0].title).toBe('h');
    });

    it('closing an ephemeral tab does not add to history', async () => {
      await openEphemeralTab(mkNote('eph'));
      const tabId = get(editorTabs)[0].id;
      closeTab(tabId);
      expect(get(closedTabHistory)).toHaveLength(0);
    });

    it('reopenClosedTab restores last closed', async () => {
      await openNoteTab(mkNote('lost'));
      closeTab(get(editorTabs)[0].id);
      expect(get(editorTabs)).toHaveLength(0);
      await reopenClosedTab();
      expect(get(closedTabHistory)).toHaveLength(0);
    });

    it('clearClosedHistory empties the stack', async () => {
      await openNoteTab(mkNote('x'));
      closeTab(get(editorTabs)[0].id);
      clearClosedHistory();
      expect(get(closedTabHistory)).toHaveLength(0);
    });
  });

  describe('close directions', () => {
    it('closeTabsToRight keeps current and left tabs', async () => {
      await openNoteTab(mkNote('a'));
      await openNoteTab(mkNote('b'));
      await openNoteTab(mkNote('c'));
      const tabs = get(editorTabs);
      closeTabsToRight(tabs[1].id);
      expect(get(editorTabs).map((t) => t.title)).toEqual(['a', 'b']);
    });

    it('closeTabsToLeft keeps current and right tabs', async () => {
      await openNoteTab(mkNote('a'));
      await openNoteTab(mkNote('b'));
      await openNoteTab(mkNote('c'));
      const tabs = get(editorTabs);
      closeTabsToLeft(tabs[1].id);
      expect(get(editorTabs).map((t) => t.title)).toEqual(['b', 'c']);
    });
  });
});
