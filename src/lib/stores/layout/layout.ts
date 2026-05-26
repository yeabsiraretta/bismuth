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
