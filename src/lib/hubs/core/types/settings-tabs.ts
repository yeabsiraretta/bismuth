export type SettingsTab =
  | 'general'
  | 'editor'
  | 'appearance'
  | 'vault'
  | 'calendar'
  | 'canvas'
  | 'knowledge'
  | 'ai'
  | 'integration'
  | 'gamification'
  | 'window'
  | 'hotkeys'
  | 'monitoring'
  | 'about';

export interface SidebarTabDef {
  id: SettingsTab;
  label: string;
  icon: string;
  bottom?: boolean;
  section?: string;
}

export const SETTINGS_TABS: readonly SidebarTabDef[] = [
  { id: 'general', label: 'General', icon: 'settings', section: 'App' },
  { id: 'editor', label: 'Editor', icon: 'edit' },
  { id: 'appearance', label: 'Appearance', icon: 'palette' },
  { id: 'hotkeys', label: 'Hotkeys', icon: 'command' },
  { id: 'vault', label: 'Vault & Git', icon: 'folder', section: 'Data' },
  { id: 'calendar', label: 'Calendar', icon: 'calendar' },
  { id: 'canvas', label: 'Canvas', icon: 'canvas', section: 'Features' },
  { id: 'knowledge', label: 'Knowledge', icon: 'knowledge' },
  { id: 'gamification', label: 'Gamification', icon: 'sparkles' },
  { id: 'ai', label: 'AI', icon: 'ai', section: 'Advanced' },
  { id: 'integration', label: 'Integration', icon: 'integration' },
  { id: 'window', label: 'Window', icon: 'window' },
  { id: 'monitoring', label: 'Monitoring', icon: 'activity', section: 'System' },
  { id: 'about', label: 'About', icon: 'info', bottom: true },
];
