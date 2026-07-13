import {
  DEFAULT_LEFT_HUB,
  DEFAULT_LEFT_PANEL,
  DEFAULT_RIGHT_HUB,
  DEFAULT_RIGHT_PANEL,
  LEFT_HUBS,
  RIGHT_HUBS,
} from '@/constants/hub-registry';
import { SIDEBAR_DEFAULT_WIDTH, SIDEBAR_MAX_WIDTH, SIDEBAR_MIN_WIDTH } from '@/constants/layout';
import { LAYOUT_KEY } from '@/constants/storage-keys';

export interface LayoutState {
  leftVisible: boolean;
  rightVisible: boolean;
  leftWidth: number;
  rightWidth: number;
  leftActiveHub: string;
  rightActiveHub: string;
  leftActiveTab: string;
  rightActiveTab: string;
  leftSplitPanel: string | null;
  rightSplitPanel: string | null;
  leftSplitRatio: number;
  rightSplitRatio: number;
}

const state = $state<LayoutState>({
  leftVisible: true,
  rightVisible: false,
  leftWidth: SIDEBAR_DEFAULT_WIDTH,
  rightWidth: SIDEBAR_DEFAULT_WIDTH,
  leftActiveHub: DEFAULT_LEFT_HUB,
  rightActiveHub: DEFAULT_RIGHT_HUB,
  leftActiveTab: DEFAULT_LEFT_PANEL,
  rightActiveTab: DEFAULT_RIGHT_PANEL,
  leftSplitPanel: null,
  rightSplitPanel: null,
  leftSplitRatio: 0.5,
  rightSplitRatio: 0.5,
});

export function getLayout(): LayoutState {
  return state;
}

export function getLeftSidebarVisible(): boolean {
  return state.leftVisible;
}

export function getRightSidebarVisible(): boolean {
  return state.rightVisible;
}

function clamp(value: number): number {
  return Math.max(SIDEBAR_MIN_WIDTH, Math.min(SIDEBAR_MAX_WIDTH, value));
}

export function toggleLeftSidebar() {
  state.leftVisible = !state.leftVisible;
  persist();
}

export function toggleRightSidebar() {
  state.rightVisible = !state.rightVisible;
  persist();
}

export function setLeftWidth(width: number) {
  state.leftWidth = clamp(width);
  debouncedPersist();
}

export function setRightWidth(width: number) {
  state.rightWidth = clamp(width);
  debouncedPersist();
}

export function setActiveHub(side: 'left' | 'right', hubId: string, defaultTab: string) {
  if (side === 'left') {
    state.leftActiveHub = hubId;
    state.leftActiveTab = defaultTab;
    state.leftVisible = true;
  } else {
    state.rightActiveHub = hubId;
    state.rightActiveTab = defaultTab;
    state.rightVisible = true;
  }
  persist();
}

export function setActiveTab(side: 'left' | 'right', tabId: string) {
  if (side === 'left') {
    state.leftActiveTab = tabId;
    state.leftVisible = true;
  } else {
    state.rightActiveTab = tabId;
    state.rightVisible = true;
  }
  persist();
}

export function setSplitPanel(side: 'left' | 'right', panelKey: string | null) {
  if (side === 'left') {
    state.leftSplitPanel = panelKey;
  } else {
    state.rightSplitPanel = panelKey;
  }
  persist();
}

function getSplitPanel(side: 'left' | 'right'): string | null {
  return side === 'left' ? state.leftSplitPanel : state.rightSplitPanel;
}

export function setSplitRatio(side: 'left' | 'right', ratio: number) {
  const clamped = Math.max(0.2, Math.min(0.8, ratio));
  if (side === 'left') {
    state.leftSplitRatio = clamped;
  } else {
    state.rightSplitRatio = clamped;
  }
  debouncedPersist();
}

function getSplitRatio(side: 'left' | 'right'): number {
  return side === 'left' ? state.leftSplitRatio : state.rightSplitRatio;
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;

function debouncedPersist() {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(persist, 150);
}

function persist() {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  try {
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable
  }
}

export function initLayout() {
  try {
    const raw = localStorage.getItem(LAYOUT_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw) as Partial<LayoutState>;
    if (saved.leftVisible != null) state.leftVisible = saved.leftVisible;
    if (saved.rightVisible != null) state.rightVisible = saved.rightVisible;
    if (saved.leftWidth != null) state.leftWidth = clamp(saved.leftWidth);
    if (saved.rightWidth != null) state.rightWidth = clamp(saved.rightWidth);
    const leftHubIds = new Set(LEFT_HUBS.map((h) => h.id));
    const rightHubIds = new Set(RIGHT_HUBS.map((h) => h.id));
    const leftPanelIds = new Set(LEFT_HUBS.flatMap((h) => h.panels.map((p) => p.id)));
    const rightPanelIds = new Set(RIGHT_HUBS.flatMap((h) => h.panels.map((p) => p.id)));
    if (saved.leftActiveHub && leftHubIds.has(saved.leftActiveHub))
      state.leftActiveHub = saved.leftActiveHub;
    if (saved.rightActiveHub && rightHubIds.has(saved.rightActiveHub))
      state.rightActiveHub = saved.rightActiveHub;
    if (saved.leftActiveTab && leftPanelIds.has(saved.leftActiveTab))
      state.leftActiveTab = saved.leftActiveTab;
    if (saved.rightActiveTab && rightPanelIds.has(saved.rightActiveTab))
      state.rightActiveTab = saved.rightActiveTab;
    const allPanelKeys = new Set([
      ...LEFT_HUBS.flatMap((h) => h.panels.map((p) => `${h.id}:${p.id}`)),
      ...RIGHT_HUBS.flatMap((h) => h.panels.map((p) => `${h.id}:${p.id}`)),
    ]);
    if (saved.leftSplitPanel !== undefined)
      state.leftSplitPanel =
        saved.leftSplitPanel && allPanelKeys.has(saved.leftSplitPanel)
          ? saved.leftSplitPanel
          : null;
    if (saved.rightSplitPanel !== undefined)
      state.rightSplitPanel =
        saved.rightSplitPanel && allPanelKeys.has(saved.rightSplitPanel)
          ? saved.rightSplitPanel
          : null;
    if (saved.leftSplitRatio != null) state.leftSplitRatio = saved.leftSplitRatio;
    if (saved.rightSplitRatio != null) state.rightSplitRatio = saved.rightSplitRatio;
  } catch {
    // ignore parse errors
  }
}
