import type { SettingsTab } from '@/hubs/core/types/settings-tabs';

import { SETTINGS_INDEX } from './settings-search-index';

export interface SettingsEntry {
  tab: SettingsTab;
  section: string;
  label: string;
  hint: string;
  id: string;
}

const TAB_LABELS: Record<string, string> = {
  general: 'General',
  editor: 'Editor',
  appearance: 'Appearance',
  vault: 'Vault & Git',
  calendar: 'Calendar',
  canvas: 'Canvas',
  knowledge: 'Knowledge',
  gamification: 'Gamification',
  ai: 'AI',
  integration: 'Integration',
  window: 'Window',
};

export interface SettingsSearchResult {
  entry: SettingsEntry;
  tabLabel: string;
}

export function searchSettings(query: string): SettingsSearchResult[] {
  if (!query.trim()) return [];
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  return SETTINGS_INDEX.filter((entry) => {
    const haystack = `${entry.label} ${entry.hint} ${entry.section}`.toLowerCase();
    return terms.every((term) => haystack.includes(term));
  }).map((entry) => ({
    entry,
    tabLabel: TAB_LABELS[entry.tab] ?? entry.tab,
  }));
}
