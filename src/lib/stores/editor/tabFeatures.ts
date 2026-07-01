/**
 * Extended tab features — groups, ephemeral tabs, history, per-tab zoom.
 * Split from tabs.ts to stay under the 300-line limit.
 */
import { derived, get } from 'svelte/store';
import type { Note } from '@/types/data/vault';
import { generatePrefixedId } from '@/utils/id';
import { setActiveNote } from '@/stores/vault/vault';
import { getNote } from '@/services/vault/vault';
import { viewportMode } from '@/stores/layout/presets';
import { log } from '@/utils/logger';
import type { EditorTab } from './tabs';
import {
  editorTabs, activeEditorTabId, openNoteTab, moveTabToGroup, switchTab,
  _tabsInternal, _activeTabId, _groupsInternal, _closedHistory,
} from './tabs';

const GROUP_COLORS = ['#dc2626', '#2563eb', '#16a34a', '#d97706', '#9333ea', '#0891b2'];

/** All tab groups. */
export const tabGroups = derived(_groupsInternal, ($g) => $g);

/** Recently closed tab history. */
export const closedTabHistory = derived(_closedHistory, ($h) => $h);

/** The active tab's zoom level. */
export const activeTabZoom = derived(
  [editorTabs, activeEditorTabId],
  ([$tabs, $id]) => $tabs.find((t: EditorTab) => t.id === $id)?.zoomLevel ?? 100,
);

/** Reopen the most recently closed tab. */
export async function reopenClosedTab(): Promise<void> {
  const history = get(_closedHistory);
  if (history.length === 0) return;
  const [entry, ...rest] = history;
  _closedHistory.set(rest);
  try {
    const note = await getNote(entry.path);
    await openNoteTab(note);
    if (entry.groupId) moveTabToGroup(get(_activeTabId)!, entry.groupId);
  } catch {
    log.warn('Failed to reopen closed tab', { path: entry.path });
  }
}

/** Clear closed tab history. */
export function clearClosedHistory(): void { _closedHistory.set([]); }

/** Open a note as an ephemeral (preview) tab — replaces existing ephemeral. */
export async function openEphemeralTab(note: Note) {
  if (get(viewportMode) !== 'note') viewportMode.set('note');
  const tabs = get(_tabsInternal);
  const existing = tabs.find((t) => t.path === note.path);
  if (existing) { _activeTabId.set(existing.id); setActiveNote(note); return; }

  const ephIdx = tabs.findIndex(t => t.ephemeral);
  const newTab: EditorTab = {
    id: generatePrefixedId('tab'), path: note.path, title: note.title,
    dirty: false, ephemeral: true, groupId: null, zoomLevel: 100,
  };
  if (ephIdx >= 0) {
    _tabsInternal.update($t => $t.map((t, i) => i === ephIdx ? newTab : t));
  } else {
    _tabsInternal.update($t => [...$t, newTab]);
  }
  _activeTabId.set(newTab.id);
  setActiveNote(note);
}

/** Promote an ephemeral tab to a permanent (pinned) tab. */
export function pinTab(tabId: string): void {
  _tabsInternal.update($t => $t.map(t => t.id === tabId ? { ...t, ephemeral: false } : t));
}

/** Set the zoom level for a specific tab (50-200). */
export function setTabZoom(tabId: string, zoom: number): void {
  const clamped = Math.max(50, Math.min(200, zoom));
  _tabsInternal.update($t => $t.map(t => t.id === tabId ? { ...t, zoomLevel: clamped } : t));
}

/** Create a new tab group. Returns its ID. */
export function createTabGroup(name: string): string {
  const id = generatePrefixedId('grp');
  const existing = get(_groupsInternal);
  const color = GROUP_COLORS[existing.length % GROUP_COLORS.length];
  _groupsInternal.update($g => [...$g, { id, name, color, collapsed: false }]);
  return id;
}

/** Remove a tab group (tabs remain, ungrouped). */
export function removeTabGroup(groupId: string): void {
  _groupsInternal.update($g => $g.filter(g => g.id !== groupId));
  _tabsInternal.update($t => $t.map(t => t.groupId === groupId ? { ...t, groupId: null } : t));
}

/** Rename a tab group. */
export function renameTabGroup(groupId: string, name: string): void {
  _groupsInternal.update($g => $g.map(g => g.id === groupId ? { ...g, name } : g));
}

/** Set a tab group's color. */
export function setTabGroupColor(groupId: string, color: string): void {
  _groupsInternal.update($g => $g.map(g => g.id === groupId ? { ...g, color } : g));
}

/** Toggle collapse state of a tab group. */
export function toggleGroupCollapse(groupId: string): void {
  _groupsInternal.update($g => $g.map(g => g.id === groupId ? { ...g, collapsed: !g.collapsed } : g));
}

/** Close tabs to the right of the specified tab. */
export function closeTabsToRight(tabId: string) {
  const tabs = get(_tabsInternal);
  const idx = tabs.findIndex((t) => t.id === tabId);
  if (idx === -1) return;
  _tabsInternal.set(tabs.slice(0, idx + 1));
  if (tabs.slice(idx + 1).some(t => t.id === get(_activeTabId))) switchTab(tabId);
}

/** Close tabs to the left of the specified tab. */
export function closeTabsToLeft(tabId: string) {
  const tabs = get(_tabsInternal);
  const idx = tabs.findIndex((t) => t.id === tabId);
  if (idx === -1) return;
  _tabsInternal.set(tabs.slice(idx));
  if (tabs.slice(0, idx).some(t => t.id === get(_activeTabId))) switchTab(tabId);
}
