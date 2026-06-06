import { writable } from 'svelte/store';
import { DEFAULT_LEFT_TABS, DEFAULT_RIGHT_TABS, DEFAULT_BOTTOM_TABS } from '@/types/layout';
import type { SidebarTab } from '@/types/layout';

// Layout constants
export const LAYOUT_CONSTANTS = {
  SIDEBAR_MIN_WIDTH: 200,
  SIDEBAR_MAX_WIDTH: 600,
  SIDEBAR_DEFAULT_WIDTH: 300,
} as const;

export interface LayoutState {
  leftSidebarVisible: boolean;
  rightSidebarVisible: boolean;
  leftSidebarWidth: number;
  rightSidebarWidth: number;
  /** Ordered tab IDs for the left sidebar */
  leftTabs: SidebarTab[];
  /** Ordered tab IDs for the right sidebar */
  rightTabs: SidebarTab[];
  /** Bottom tabs (shared config) */
  bottomTabs: SidebarTab[];
  /** Active tab in the left sidebar */
  leftActiveTab: string;
  /** Active tab in the right sidebar */
  rightActiveTab: string;
}

const defaultLayout: LayoutState = {
  leftSidebarVisible: true,
  rightSidebarVisible: true,
  leftSidebarWidth: LAYOUT_CONSTANTS.SIDEBAR_DEFAULT_WIDTH,
  rightSidebarWidth: LAYOUT_CONSTANTS.SIDEBAR_DEFAULT_WIDTH,
  leftTabs: DEFAULT_LEFT_TABS,
  rightTabs: DEFAULT_RIGHT_TABS,
  bottomTabs: DEFAULT_BOTTOM_TABS,
  leftActiveTab: 'files',
  rightActiveTab: 'backlinks',
};

export const layoutStore = writable<LayoutState>(defaultLayout);

export function toggleLeftSidebar() {
  layoutStore.update(state => ({
    ...state,
    leftSidebarVisible: !state.leftSidebarVisible,
  }));
}

export function toggleRightSidebar() {
  layoutStore.update(state => ({
    ...state,
    rightSidebarVisible: !state.rightSidebarVisible,
  }));
}

export function setLeftSidebarWidth(width: number) {
  const clampedWidth = Math.max(
    LAYOUT_CONSTANTS.SIDEBAR_MIN_WIDTH,
    Math.min(LAYOUT_CONSTANTS.SIDEBAR_MAX_WIDTH, width)
  );
  layoutStore.update(state => ({
    ...state,
    leftSidebarWidth: clampedWidth,
  }));
}

export function setRightSidebarWidth(width: number) {
  const clampedWidth = Math.max(
    LAYOUT_CONSTANTS.SIDEBAR_MIN_WIDTH,
    Math.min(LAYOUT_CONSTANTS.SIDEBAR_MAX_WIDTH, width)
  );
  layoutStore.update(state => ({
    ...state,
    rightSidebarWidth: clampedWidth,
  }));
}

/** Move a tab between left and right sidebars */
export function moveTabToSidebar(tabId: string, target: 'left' | 'right') {
  layoutStore.update(state => {
    const sourceKey = target === 'left' ? 'rightTabs' : 'leftTabs';
    const destKey = target === 'left' ? 'leftTabs' : 'rightTabs';
    const tab = state[sourceKey].find(t => t.id === tabId);
    if (!tab || tab.pinned) return state;
    return {
      ...state,
      [sourceKey]: state[sourceKey].filter(t => t.id !== tabId),
      [destKey]: [...state[destKey], tab],
    };
  });
}

/** Set the active tab for a sidebar */
export function setActiveTab(side: 'left' | 'right', tabId: string) {
  layoutStore.update(state => ({
    ...state,
    [side === 'left' ? 'leftActiveTab' : 'rightActiveTab']: tabId,
  }));
}

/** Reorder tabs within a sidebar */
export function reorderTabs(side: 'left' | 'right', tabs: SidebarTab[]) {
  layoutStore.update(state => ({
    ...state,
    [side === 'left' ? 'leftTabs' : 'rightTabs']: tabs,
  }));
}

const STORAGE_KEY = 'bismuth-layout';

/** Save layout state to localStorage (per-vault via key suffix) */
export function saveLayout(vaultName?: string) {
  layoutStore.subscribe(state => {
    const key = vaultName ? `${STORAGE_KEY}-${vaultName}` : STORAGE_KEY;
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // localStorage might be full or unavailable
    }
  })();
}

/** Load layout state from localStorage */
export function loadLayout(vaultName?: string) {
  const key = vaultName ? `${STORAGE_KEY}-${vaultName}` : STORAGE_KEY;
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<LayoutState>;
      layoutStore.update(state => ({
        ...state,
        ...parsed,
        leftSidebarWidth: Math.max(
          LAYOUT_CONSTANTS.SIDEBAR_MIN_WIDTH,
          Math.min(LAYOUT_CONSTANTS.SIDEBAR_MAX_WIDTH, parsed.leftSidebarWidth ?? state.leftSidebarWidth)
        ),
        rightSidebarWidth: Math.max(
          LAYOUT_CONSTANTS.SIDEBAR_MIN_WIDTH,
          Math.min(LAYOUT_CONSTANTS.SIDEBAR_MAX_WIDTH, parsed.rightSidebarWidth ?? state.rightSidebarWidth)
        ),
      }));
    }
  } catch {
    // Ignore parse errors, use defaults
  }
}

/** Auto-persist layout changes */
export function enableAutoSave(vaultName?: string) {
  return layoutStore.subscribe(state => {
    const key = vaultName ? `${STORAGE_KEY}-${vaultName}` : STORAGE_KEY;
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // Ignore
    }
  });
}
