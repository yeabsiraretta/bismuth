import { writable, get } from 'svelte/store';
import type { SidebarTab } from '@/types/layout';
import { getDefaultTabs } from '@/stores/settings/featureRegistry';

/** Default sidebar tabs — generated from the FeatureRegistry */
export const DEFAULT_LEFT_TABS: SidebarTab[] = getDefaultTabs('left');
export const DEFAULT_RIGHT_TABS: SidebarTab[] = getDefaultTabs('right');
export const DEFAULT_BOTTOM_TABS: SidebarTab[] = [
  ...getDefaultTabs('bottom'),
  { id: 'layouts', icon: 'layout', label: 'Layouts', tooltip: 'Manage workspace layouts' },
  { id: 'publish-mark', icon: 'send', label: 'Publish', tooltip: 'Mark file for publishing' },
  { id: 'commands', icon: 'terminal', label: 'Commands', tooltip: 'Open command palette' },
  { id: 'settings', icon: 'settings', label: 'Settings', tooltip: 'Settings' },
  { id: 'help', icon: 'help-circle', label: 'Help', tooltip: 'Help & support' },
];

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
  /** User-defined lower section tabs for left sidebar */
  leftLowerTabs: SidebarTab[];
  /** User-defined lower section tabs for right sidebar */
  rightLowerTabs: SidebarTab[];
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
  leftLowerTabs: [],
  rightLowerTabs: [],
  bottomTabs: DEFAULT_BOTTOM_TABS,
  leftActiveTab: 'files',
  rightActiveTab: 'backlinks',
};

export const layoutStore = writable<LayoutState>(defaultLayout);

/** Toggles the left sidebar between visible and collapsed states. */
export function toggleLeftSidebar() {
  layoutStore.update((state) => ({
    ...state,
    leftSidebarVisible: !state.leftSidebarVisible,
  }));
}

/** Toggles the right sidebar between visible and collapsed states. */
export function toggleRightSidebar() {
  layoutStore.update((state) => ({
    ...state,
    rightSidebarVisible: !state.rightSidebarVisible,
  }));
}

/** Sets the left sidebar width, clamped between min (200) and max (600) px. */
export function setLeftSidebarWidth(width: number) {
  const clampedWidth = Math.max(
    LAYOUT_CONSTANTS.SIDEBAR_MIN_WIDTH,
    Math.min(LAYOUT_CONSTANTS.SIDEBAR_MAX_WIDTH, width)
  );
  layoutStore.update((state) => ({
    ...state,
    leftSidebarWidth: clampedWidth,
  }));
}

/** Sets the right sidebar width, clamped between min (200) and max (600) px. */
export function setRightSidebarWidth(width: number) {
  const clampedWidth = Math.max(
    LAYOUT_CONSTANTS.SIDEBAR_MIN_WIDTH,
    Math.min(LAYOUT_CONSTANTS.SIDEBAR_MAX_WIDTH, width)
  );
  layoutStore.update((state) => ({
    ...state,
    rightSidebarWidth: clampedWidth,
  }));
}

/** Move a tab between left and right sidebars */
export function moveTabToSidebar(tabId: string, target: 'left' | 'right') {
  layoutStore.update((state) => {
    const sourceKey = target === 'left' ? 'rightTabs' : 'leftTabs';
    const destKey = target === 'left' ? 'leftTabs' : 'rightTabs';
    const tab = state[sourceKey].find((t) => t.id === tabId);
    if (!tab || tab.pinned) return state;
    return {
      ...state,
      [sourceKey]: state[sourceKey].filter((t) => t.id !== tabId),
      [destKey]: [...state[destKey], tab],
    };
  });
}

/** Set the active tab for a sidebar. Also expands the sidebar if collapsed. */
export function setActiveTab(side: 'left' | 'right', tabId: string) {
  layoutStore.update((state) => ({
    ...state,
    [side === 'left' ? 'leftActiveTab' : 'rightActiveTab']: tabId,
    [side === 'left' ? 'leftSidebarVisible' : 'rightSidebarVisible']: true,
  }));
}

/** Reorder tabs within a sidebar */
export function reorderTabs(side: 'left' | 'right', tabs: SidebarTab[]) {
  layoutStore.update((state) => ({
    ...state,
    [side === 'left' ? 'leftTabs' : 'rightTabs']: tabs,
  }));
}

/** Reorder lower tabs within a sidebar */
export function reorderLowerTabs(side: 'left' | 'right', tabs: SidebarTab[]) {
  layoutStore.update((state) => ({
    ...state,
    [side === 'left' ? 'leftLowerTabs' : 'rightLowerTabs']: tabs,
  }));
}

/** Move a tab between upper and lower sections within the same sidebar */
export function moveTabToSection(side: 'left' | 'right', tabId: string, target: 'upper' | 'lower') {
  layoutStore.update((state) => {
    const upperKey = side === 'left' ? 'leftTabs' : 'rightTabs';
    const lowerKey = side === 'left' ? 'leftLowerTabs' : 'rightLowerTabs';

    const upperTabs = [...state[upperKey]];
    const lowerTabs = [...state[lowerKey]];

    if (target === 'lower') {
      const idx = upperTabs.findIndex((t) => t.id === tabId);
      if (idx === -1 || upperTabs[idx].pinned) return state;
      const [tab] = upperTabs.splice(idx, 1);
      lowerTabs.push(tab);
    } else {
      const idx = lowerTabs.findIndex((t) => t.id === tabId);
      if (idx === -1) return state;
      const [tab] = lowerTabs.splice(idx, 1);
      upperTabs.push(tab);
    }

    return { ...state, [upperKey]: upperTabs, [lowerKey]: lowerTabs };
  });
}

const STORAGE_KEY = 'bismuth-layout';

/** Save layout state to localStorage (per-vault via key suffix) */
export function saveLayout(vaultName?: string) {
  const state = get(layoutStore);
  const key = vaultName ? `${STORAGE_KEY}-${vaultName}` : STORAGE_KEY;
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    // localStorage might be full or unavailable
  }
}

/** Load layout state from localStorage */
export function loadLayout(vaultName?: string) {
  const key = vaultName ? `${STORAGE_KEY}-${vaultName}` : STORAGE_KEY;
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<LayoutState>;
      layoutStore.update((state) => ({
        ...state,
        ...parsed,
        bottomTabs: DEFAULT_BOTTOM_TABS,
        leftSidebarWidth: Math.max(
          LAYOUT_CONSTANTS.SIDEBAR_MIN_WIDTH,
          Math.min(
            LAYOUT_CONSTANTS.SIDEBAR_MAX_WIDTH,
            parsed.leftSidebarWidth ?? state.leftSidebarWidth
          )
        ),
        rightSidebarWidth: Math.max(
          LAYOUT_CONSTANTS.SIDEBAR_MIN_WIDTH,
          Math.min(
            LAYOUT_CONSTANTS.SIDEBAR_MAX_WIDTH,
            parsed.rightSidebarWidth ?? state.rightSidebarWidth
          )
        ),
      }));
    }
  } catch {
    // Ignore parse errors, use defaults
  }
}

/** Auto-persist layout changes */
export function enableAutoSave(vaultName?: string) {
  return layoutStore.subscribe((state) => {
    const key = vaultName ? `${STORAGE_KEY}-${vaultName}` : STORAGE_KEY;
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // Ignore
    }
  });
}
