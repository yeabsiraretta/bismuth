/**
 * Tab routing logic extracted from SettingsModal.svelte.
 * Maps SettingsTab values to their Svelte component imports.
 * Kept as a plain export to avoid circular imports.
 */
export type SettingsTab = 'general' | 'editor' | 'appearance' | 'features' | 'llm' | 'vault' | 'embeddings' | 'changelog' | 'hotkeys' | 'voice' | 'help' | 'security' | 'monitoring' | 'about';

/** Returns true if a tab is one of the new system-capability tabs. */
export function isSystemTab(tab: SettingsTab): tab is 'help' | 'security' {
  return tab === 'help' || tab === 'security';
}

/** Sidebar tab definition for rendering. */
export interface SidebarTabDef {
  id: SettingsTab;
  label: string;
  icon: string;
  /** If true, shown after a spacer at the bottom. */
  bottom?: boolean;
  /** Optional section header shown above this tab. */
  section?: string;
}

/** Ordered list of settings sidebar tabs. */
export const SIDEBAR_TABS: readonly SidebarTabDef[] = [
  // -- App --
  { id: 'general',    label: 'General',     icon: 'settings',     section: 'App' },
  { id: 'editor',     label: 'Editor',      icon: 'edit-3' },
  { id: 'appearance', label: 'Appearance',   icon: 'palette' },
  { id: 'hotkeys',    label: 'Hotkeys',     icon: 'command' },
  // -- Features --
  { id: 'features',   label: 'Features',    icon: 'toggle-left',  section: 'Features' },
  { id: 'llm',        label: 'AI Agent',    icon: 'cpu' },
  { id: 'voice',      label: 'Voice',       icon: 'mic' },
  // -- Data --
  { id: 'vault',      label: 'Vault & Git', icon: 'folder',       section: 'Data' },
  { id: 'embeddings', label: 'Embeddings',  icon: 'database' },
  { id: 'changelog',  label: 'Changelog',   icon: 'clock' },
  // -- System --
  { id: 'security',   label: 'Security',    icon: 'shield',       section: 'System' },
  { id: 'monitoring', label: 'Monitoring',  icon: 'activity' },
  { id: 'help',       label: 'Help',        icon: 'help-circle' },
  { id: 'about',      label: 'About',       icon: 'info',         bottom: true },
];

/** Returns the section header label for a given tab. */
export function tabLabel(tab: SettingsTab): string {
  const def = SIDEBAR_TABS.find((t) => t.id === tab);
  return def?.label ?? tab;
}
