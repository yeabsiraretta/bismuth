import { TAB_GROUP_COLORS } from '@/constants/colors';
import { MAX_CLOSED_TAB_HISTORY } from '@/constants/layout';
import { EDITOR_TABS_KEY } from '@/constants/storage-keys';
import { setActiveNote } from '@/hubs/core/stores/vault-store.svelte';
import type { ClosedTabEntry, EditorTab, TabGroup, TabKind } from '@/hubs/editor/types/editor-tabs';
import { isTextNotePath } from '@/utils/file-kind';
import { log } from '@/utils/log/logger';

let nextId = 0;
function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${++nextId}`;
}

// ── Persistence ──────────────────────────────────────────────────────────────

interface TabSnapshot {
  tabs: Omit<EditorTab, 'dirty'>[];
  activeTabId: string | null;
  groups: TabGroup[];
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;

function schedulePersist(): void {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(persistNow, 300);
}

function persistNow(): void {
  try {
    const snapshot: TabSnapshot = {
      tabs: tabs.map(({ dirty: _, ...rest }) => rest),
      activeTabId,
      groups,
    };
    localStorage.setItem(EDITOR_TABS_KEY, JSON.stringify(snapshot));
  } catch {
    /* quota exceeded — silently skip */
  }
}

export function initTabs(): void {
  try {
    const raw = localStorage.getItem(EDITOR_TABS_KEY);
    if (!raw) return;
    const snapshot: TabSnapshot = JSON.parse(raw);
    if (Array.isArray(snapshot.tabs)) {
      tabs = snapshot.tabs.map((t) => ({ ...t, dirty: false, kind: t.kind ?? inferKind(t.path) }));
    }
    if (snapshot.activeTabId) {
      activeTabId = snapshot.activeTabId;
      const tab = tabs.find((t) => t.id === activeTabId);
      if (tab) setActiveNote(tab.path);
    }
    if (Array.isArray(snapshot.groups)) {
      groups = snapshot.groups;
    }
    log.debug('Restored editor tabs', { count: tabs.length });
  } catch {
    log.warn('Failed to restore editor tabs');
  }
}

export function destroyTabs(): void {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  persistNow();
}

// ── Reactive State ───────────────────────────────────────────────────────────

let tabs = $state<EditorTab[]>([]);
let activeTabId = $state<string | null>(null);
let groups = $state<TabGroup[]>([]);
let closedHistory = $state<ClosedTabEntry[]>([]);

// ── Derived ──────────────────────────────────────────────────────────────────

export function getTabs(): EditorTab[] {
  return tabs;
}

export function getActiveTabId(): string | null {
  return activeTabId;
}

export function getActiveTab(): EditorTab | undefined {
  return tabs.find((t) => t.id === activeTabId);
}

function getGroups(): TabGroup[] {
  return groups;
}

function getClosedHistory(): ClosedTabEntry[] {
  return closedHistory;
}

// ── Tab CRUD ─────────────────────────────────────────────────────────────────

function inferKind(path: string): TabKind {
  if (path.endsWith('.canvas')) return 'canvas';
  if (path.endsWith('.pdf')) return 'pdf';
  return 'note';
}

export function openTab(path: string, title: string): void {
  const kind = inferKind(path);
  if (kind === 'note' && !isTextNotePath(path)) {
    log.debug('Skipped opening non-note path as tab', { path });
    return;
  }
  if (kind === 'pdf') {
    log.debug('Opening PDF tab', { path });
  }
  const existing = tabs.find((t) => t.path === path);
  if (existing) {
    activeTabId = existing.id;
    if (kind === 'note') setActiveNote(path);
    return;
  }
  const tab: EditorTab = {
    id: genId('tab'),
    path,
    title,
    dirty: false,
    ephemeral: false,
    groupId: null,
    kind,
  };
  tabs = [...tabs, tab];
  activeTabId = tab.id;
  if (kind === 'note') setActiveNote(path);
  schedulePersist();
  log.debug('Opened tab', { title, path, kind });
}

function openEphemeralTab(path: string, title: string): void {
  const kind = inferKind(path);
  const existing = tabs.find((t) => t.path === path);
  if (existing) {
    activeTabId = existing.id;
    if (kind === 'note') setActiveNote(path);
    return;
  }
  const ephIdx = tabs.findIndex((t) => t.ephemeral);
  const newTab: EditorTab = {
    id: genId('tab'),
    path,
    title,
    dirty: false,
    ephemeral: true,
    groupId: null,
    kind,
  };
  if (ephIdx >= 0) {
    tabs = tabs.map((t, i) => (i === ephIdx ? newTab : t));
  } else {
    tabs = [...tabs, newTab];
  }
  activeTabId = newTab.id;
  if (kind === 'note') setActiveNote(path);
  schedulePersist();
}

export function switchTab(tabId: string): void {
  const tab = tabs.find((t) => t.id === tabId);
  if (tab) {
    activeTabId = tabId;
    setActiveNote(tab.path);
    schedulePersist();
  }
}

export function closeTab(tabId: string): void {
  const idx = tabs.findIndex((t) => t.id === tabId);
  if (idx === -1) return;

  const closed = tabs[idx];
  if (!closed.ephemeral) {
    closedHistory = [
      { path: closed.path, title: closed.title, groupId: closed.groupId, closedAt: Date.now() },
      ...closedHistory,
    ].slice(0, MAX_CLOSED_TAB_HISTORY);
  }

  const wasActive = activeTabId === tabId;
  tabs = tabs.filter((t) => t.id !== tabId);

  if (wasActive) {
    if (tabs.length === 0) {
      activeTabId = null;
      setActiveNote(null);
    } else {
      const next = tabs[Math.min(idx, tabs.length - 1)];
      activeTabId = next.id;
      setActiveNote(next.path);
    }
  }
  log.debug('Closed tab', { tabId, remaining: tabs.length });
  schedulePersist();
}

export function closeOtherTabs(tabId: string): void {
  tabs = tabs.filter((t) => t.id === tabId);
  if (tabs.length > 0) {
    activeTabId = tabs[0].id;
    setActiveNote(tabs[0].path);
  }
  schedulePersist();
}

export function closeAllTabs(): void {
  tabs = [];
  activeTabId = null;
  setActiveNote(null);
  schedulePersist();
}

function closeActiveTab(): void {
  if (activeTabId) closeTab(activeTabId);
}

function nextTab(): void {
  if (tabs.length <= 1) return;
  const idx = tabs.findIndex((t) => t.id === activeTabId);
  const next = tabs[(idx + 1) % tabs.length];
  activeTabId = next.id;
  setActiveNote(next.path);
  schedulePersist();
}

function prevTab(): void {
  if (tabs.length <= 1) return;
  const idx = tabs.findIndex((t) => t.id === activeTabId);
  const prev = tabs[(idx - 1 + tabs.length) % tabs.length];
  activeTabId = prev.id;
  setActiveNote(prev.path);
  schedulePersist();
}

export function markTabDirty(tabId: string, dirty: boolean): void {
  tabs = tabs.map((t) => (t.id === tabId ? { ...t, dirty } : t));
}

export function pinTab(tabId: string): void {
  tabs = tabs.map((t) => (t.id === tabId ? { ...t, ephemeral: false } : t));
}

function reorderTabs(newOrder: EditorTab[]): void {
  tabs = newOrder;
  schedulePersist();
}

// ── Tab Groups ───────────────────────────────────────────────────────────────

function createTabGroup(name: string): string {
  const id = genId('grp');
  const color = TAB_GROUP_COLORS[groups.length % TAB_GROUP_COLORS.length];
  groups = [...groups, { id, name, color, collapsed: false }];
  schedulePersist();
  return id;
}

function moveTabToGroup(tabId: string, groupId: string): void {
  tabs = tabs.map((t) => (t.id === tabId ? { ...t, groupId } : t));
  schedulePersist();
}

function toggleGroupCollapse(groupId: string): void {
  groups = groups.map((g) => (g.id === groupId ? { ...g, collapsed: !g.collapsed } : g));
  schedulePersist();
}

// ── Closed History ───────────────────────────────────────────────────────────

function reopenClosedTab(): void {
  if (closedHistory.length === 0) return;
  const [entry, ...rest] = closedHistory;
  closedHistory = rest;
  openTab(entry.path, entry.title);
  if (entry.groupId) {
    const newTabId = activeTabId;
    if (newTabId) moveTabToGroup(newTabId, entry.groupId);
  }
}

function clearClosedHistory(): void {
  closedHistory = [];
}
