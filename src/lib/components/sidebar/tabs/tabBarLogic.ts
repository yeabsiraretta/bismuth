import type { SidebarTab } from '@/types/layout';

// ─── Tab Selection Dispatch ───────────────────────────────────────────────────

export interface TabActionCallbacks {
  onCommandsClick?: () => void;
  onSettingsClick?: () => void;
  onAboutClick?: () => void;
  onDailyNoteClick?: () => void;
  onLayoutsClick?: () => void;
  onPublishMarkClick?: () => void;
  onTabChange?: (detail: { tabId: string }) => void;
}

/**
 * Dispatches a tab selection event to the appropriate callback, or signals
 * a toggle collapse when the active tab is clicked again.
 * Returns the new active tab ID, or null if a special action was triggered.
 */
export function dispatchTabSelect(
  tabId: string,
  activeTab: string,
  callbacks: TabActionCallbacks,
): string | null {
  if (tabId === 'commands') { callbacks.onCommandsClick?.(); return null; }
  if (tabId === 'settings') { callbacks.onSettingsClick?.(); return null; }
  if (tabId === 'help') { callbacks.onAboutClick?.(); return null; }
  if (tabId === 'daily-note') { callbacks.onDailyNoteClick?.(); return null; }
  if (tabId === 'layouts') { callbacks.onLayoutsClick?.(); return null; }
  if (tabId === 'publish-mark') { callbacks.onPublishMarkClick?.(); return null; }
  if (tabId === activeTab) {
    callbacks.onTabChange?.({ tabId: '__toggle__' });
    return null;
  }
  callbacks.onTabChange?.({ tabId });
  return tabId;
}

/**
 * Handles keyboard navigation across a flat tab list and focuses the
 * resulting button element. Delegates index arithmetic to `getNextTabIndex`
 * from tabBarDragLogic.
 */
export function handleTabKeydown(
  e: KeyboardEvent,
  activeTab: string,
  allTabs: SidebarTab[],
  getNextIndex: (e: KeyboardEvent, idx: number, total: number) => number,
  selectTab: (id: string) => void,
): void {
  const idx = allTabs.findIndex(t => t.id === activeTab);
  if (idx === -1) return;
  const next = getNextIndex(e, idx, allTabs.length);
  if (next === -1) return;
  selectTab(allTabs[next].id);
  const buttons = (e.currentTarget as HTMLElement)
    ?.closest('.vertical-tab-bar')
    ?.querySelectorAll('.tab-button');
  if (buttons && buttons[next]) (buttons[next] as HTMLElement).focus();
}
