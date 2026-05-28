import { writable } from 'svelte/store';

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
}

const defaultLayout: LayoutState = {
  leftSidebarVisible: true,
  rightSidebarVisible: true,
  leftSidebarWidth: LAYOUT_CONSTANTS.SIDEBAR_DEFAULT_WIDTH,
  rightSidebarWidth: LAYOUT_CONSTANTS.SIDEBAR_DEFAULT_WIDTH,
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
