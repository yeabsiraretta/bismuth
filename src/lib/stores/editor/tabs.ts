/**
 * Editor Tabs Store — manages multiple open note tabs.
 *
 * Core tab CRUD, orientation, and navigation. Extended features
 * (groups, ephemeral, history, zoom) live in tabFeatures.ts.
 */
import { writable, derived, get } from 'svelte/store';
import type { Note } from '@/types/data/vault';
import { generatePrefixedId } from '@/utils/id';
import { activeNote, setActiveNote } from '@/stores/vault/vault';
import { getNote } from '@/services/vault/vault';
import { viewportMode } from '@/stores/layout/presets';
import { log } from '@/utils/logger';

export interface EditorTab {
  id: string;
  path: string;
  title: string;
  dirty: boolean;
  ephemeral: boolean;
  groupId: string | null;
  zoomLevel: number;
}

export interface TabGroup {
  id: string;
  name: string;
  color: string;
  collapsed: boolean;
}

export interface ClosedTabEntry {
  path: string;
  title: string;
  groupId: string | null;
  closedAt: number;
}

export type TabOrientation = 'horizontal' | 'vertical';

function loadOrientation(): TabOrientation {
  try {
    const saved = localStorage.getItem('bismuth:tab-orientation');
    if (saved === 'vertical' || saved === 'horizontal') return saved;
  } catch (e) {
    log.warn('Failed to load tab orientation from localStorage', { error: String(e) });
  }
  return 'horizontal';
}

export const _tabsInternal = writable<EditorTab[]>([]);
export const _activeTabId = writable<string | null>(null);
const orientation = writable<TabOrientation>(loadOrientation());
export const _groupsInternal = writable<TabGroup[]>([]);
export const _closedHistory = writable<ClosedTabEntry[]>([]);

orientation.subscribe((o) => {
  try {
    localStorage.setItem('bismuth:tab-orientation', o);
  } catch (e) {
    log.warn('Failed to persist tab orientation', { error: String(e) });
  }
});

/** All currently open editor tabs. */
export const editorTabs = derived(_tabsInternal, ($tabs) => $tabs);

/** ID of the currently active tab. */
export const activeEditorTabId = derived(_activeTabId, ($id) => $id);

/** Current tab orientation (horizontal or vertical). */
export const tabOrientation = derived(orientation, ($o) => $o);

/** Set tab orientation. */
export function setTabOrientation(o: TabOrientation) {
  orientation.set(o);
  log.debug('Tab orientation changed', { orientation: o });
}

/** Toggle between horizontal and vertical. */
export function toggleTabOrientation() {
  orientation.update((o) => (o === 'horizontal' ? 'vertical' : 'horizontal'));
}

/** Open a note in a new tab (or switch to existing tab if already open). */
export async function openNoteTab(note: Note) {
  if (get(viewportMode) !== 'note') viewportMode.set('note');

  const tabs = get(_tabsInternal);
  const existing = tabs.find((t) => t.path === note.path);
  if (existing) {
    _activeTabId.set(existing.id);
    setActiveNote(note);
    return;
  }

  const tab: EditorTab = {
    id: generatePrefixedId('tab'),
    path: note.path,
    title: note.title,
    dirty: false,
    ephemeral: false,
    groupId: null,
    zoomLevel: 100,
  };

  _tabsInternal.update(($tabs) => [...$tabs, tab]);
  _activeTabId.set(tab.id);
  setActiveNote(note);
  log.debug('Opened note tab', { title: note.title, path: note.path });
}

/** Switch to a specific tab by ID. */
export async function switchTab(tabId: string) {
  const tabs = get(_tabsInternal);
  const tab = tabs.find((t) => t.id === tabId);
  if (!tab) return;
  _activeTabId.set(tabId);
  try {
    const fullNote = await getNote(tab.path);
    setActiveNote(fullNote);
  } catch (error) {
    log.error('Failed to switch tab', error as Error);
  }
}

/** Close a tab by ID. Switches to adjacent tab if closing the active one. */
export function closeTab(tabId: string) {
  const tabs = get(_tabsInternal);
  const idx = tabs.findIndex((t) => t.id === tabId);
  if (idx === -1) return;

  const closed = tabs[idx];
  if (!closed.ephemeral) {
    _closedHistory.update((h) =>
      [
        { path: closed.path, title: closed.title, groupId: closed.groupId, closedAt: Date.now() },
        ...h,
      ].slice(0, 20)
    );
  }

  const wasActive = get(_activeTabId) === tabId;
  const newTabs = tabs.filter((t) => t.id !== tabId);
  _tabsInternal.set(newTabs);

  if (wasActive) {
    if (newTabs.length === 0) {
      _activeTabId.set(null);
      setActiveNote(null);
    } else switchTab(newTabs[Math.min(idx, newTabs.length - 1)].id);
  }
  log.debug('Closed tab', { tabId, remaining: newTabs.length });
}

/** Close all tabs except the specified one. */
export function closeOtherTabs(tabId: string) {
  const kept = get(_tabsInternal).filter((t) => t.id === tabId);
  _tabsInternal.set(kept);
  if (kept.length > 0) switchTab(kept[0].id);
}

/** Close all tabs. */
export function closeAllTabs() {
  _tabsInternal.set([]);
  _activeTabId.set(null);
  setActiveNote(null);
}

/** Switch to the next tab (wraps around). */
export function nextTab(): void {
  const tabs = get(_tabsInternal);
  if (tabs.length <= 1) return;
  const idx = tabs.findIndex((t) => t.id === get(_activeTabId));
  switchTab(tabs[(idx + 1) % tabs.length].id);
}

/** Switch to the previous tab (wraps around). */
export function prevTab(): void {
  const tabs = get(_tabsInternal);
  if (tabs.length <= 1) return;
  const idx = tabs.findIndex((t) => t.id === get(_activeTabId));
  switchTab(tabs[(idx - 1 + tabs.length) % tabs.length].id);
}

/** Close the currently active tab. */
export function closeActiveTab(): void {
  const id = get(_activeTabId);
  if (id) closeTab(id);
}

/** Reorder tabs (for drag-and-drop). */
export function reorderEditorTabs(newOrder: EditorTab[]) {
  _tabsInternal.set(newOrder);
}

/** Mark a tab as dirty (unsaved changes). */
export function markTabDirty(tabId: string, dirty: boolean) {
  _tabsInternal.update(($t) => $t.map((t) => (t.id === tabId ? { ...t, dirty } : t)));
}

/** Move a tab into a group. */
export function moveTabToGroup(tabId: string, groupId: string | null): void {
  _tabsInternal.update(($t) => $t.map((t) => (t.id === tabId ? { ...t, groupId } : t)));
}

activeNote.subscribe(($note) => {
  if (!$note) return;
  _tabsInternal.update(($t) =>
    $t.map((t) => (t.path === $note.path ? { ...t, title: $note.title } : t))
  );
});
