/**
 * Layout Types — Status Bar, Sidebar, and Panel Configuration
 *
 * Shared interfaces used by the status store, sidebar components,
 * and layout store for extensible UI configuration.
 */

/** A single item rendered in the status bar */
export interface StatusItem {
  id: string;
  /** Which region to render in */
  position: 'left' | 'center' | 'right';
  /** Display priority (lower = rendered first). Default: 100 */
  priority?: number;
  /** Icon name from the icon system (optional) */
  icon?: string;
  /** Text label displayed next to the icon */
  label: string;
  /** Tooltip text on hover */
  tooltip?: string;
  /** Optional click handler */
  onClick?: () => void;
  /** Whether the item is currently visible. Default: true */
  visible?: boolean;
}

/** A tab displayed in the VerticalTabBar */
export interface SidebarTab {
  id: string;
  /** Icon name from the icon system */
  icon: string;
  /** Accessible label for screen readers */
  label: string;
  /** Tooltip shown on hover */
  tooltip: string;
  /** Whether this tab is pinned (cannot be moved/removed) */
  pinned?: boolean;
  /** Badge count to show on the tab (e.g., inbox count) */
  badge?: number;
}

/** Configuration for a sidebar instance */
export interface SidebarConfig {
  /** Which side this sidebar is on */
  position: 'left' | 'right';
  /** Ordered list of tab IDs for the main section */
  tabs: SidebarTab[];
  /** Ordered list of tab IDs for the user-defined lower section */
  lowerTabs: SidebarTab[];
  /** Ordered list of tab IDs for the bottom section */
  bottomTabs: SidebarTab[];
  /** Current active tab ID */
  activeTab: string;
  /** Whether the sidebar is collapsed */
  collapsed: boolean;
  /** Panel width in pixels */
  width: number;
  /** Minimum width in pixels */
  minWidth?: number;
  /** Maximum width in pixels */
  maxWidth?: number;
}

/** The active viewport content mode */
export type ViewportMode = 'note' | 'rss' | 'canvas' | 'graph' | 'calendar' | 'home';

/** A saved layout preset (named snapshot of sidebar/panel state) */
export interface LayoutPreset {
  id: string;
  name: string;
  leftSidebarVisible: boolean;
  rightSidebarVisible: boolean;
  leftSidebarWidth: number;
  rightSidebarWidth: number;
  leftActiveTab: string;
  rightActiveTab: string;
  viewportMode: ViewportMode;
  isDefault?: boolean;
}


// ─── Theme ───────────────────────────────────────────────────────────────────

export type Theme = 'light' | 'dark' | 'auto';

export interface ThemeConfig {
  current: Theme;
  systemPreference: 'light' | 'dark';
}

// ─── Slot Contracts ───────────────────────────────────────────────────────────

/** A named zone in a layout shell with documented responsibilities and constraints */
export interface SlotZone {
  name: string;
  description: string;
  /** Content categories that MUST NOT be placed in this zone */
  mustNotContain: string[];
  required: boolean;
}

/**
 * Documents the named slot zones for a layout shell component.
 * Co-locate a *.slots.ts beside the layout .svelte file using this type.
 *
 * @example
 * // AppLayout.slots.ts
 * export const AppLayoutSlots: SlotContract = { header: { ... } };
 */
export type SlotContract = Record<string, SlotZone>;
