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

/** Default left sidebar tabs */
export const DEFAULT_LEFT_TABS: SidebarTab[] = [
  { id: 'files', icon: 'folder', label: 'Files', tooltip: 'File Explorer', pinned: true },
  { id: 'search', icon: 'search', label: 'Search', tooltip: 'Search in vault' },
  { id: 'inbox', icon: 'inbox', label: 'Inbox', tooltip: 'Capture Dashboard' },
  { id: 'graph', icon: 'share-2', label: 'Graph', tooltip: 'Graph view' },
  { id: 'tags', icon: 'tag', label: 'Tags', tooltip: 'Tag management' },
  { id: 'entities', icon: 'layers', label: 'Entities', tooltip: 'Entity browser' },
];

/** Default right sidebar tabs */
export const DEFAULT_RIGHT_TABS: SidebarTab[] = [
  { id: 'backlinks', icon: 'link-2', label: 'Backlinks', tooltip: 'Backlinks' },
  { id: 'outline', icon: 'list', label: 'Outline', tooltip: 'Document outline' },
  { id: 'properties', icon: 'sliders', label: 'Properties', tooltip: 'Note properties' },
  { id: 'calendar', icon: 'calendar', label: 'Calendar', tooltip: 'Daily notes calendar' },
];

/** Default bottom tabs (shared between both sidebars) */
export const DEFAULT_BOTTOM_TABS: SidebarTab[] = [
  { id: 'settings', icon: 'settings', label: 'Settings', tooltip: 'Settings' },
  { id: 'help', icon: 'help-circle', label: 'Help', tooltip: 'Help & support' },
];
