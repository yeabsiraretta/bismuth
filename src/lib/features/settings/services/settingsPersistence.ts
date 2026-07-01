import type { BismuthSettings } from '../types/settings.types';
import { DEFAULT_SETTINGS } from '../types/settings.types';
import { log } from '@/utils/logger';

const STORAGE_KEY = 'bismuth-settings';

/** Load settings from localStorage, merging with defaults for missing keys. */
export function loadSettings(): BismuthSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const merged = { ...DEFAULT_SETTINGS, ...parsed };
      // Migrate legacy fontFamily → fontText if fontText is missing
      if (!merged.fontText && (parsed.fontFamily || parsed.fontText)) {
        merged.fontText = parsed.fontFamily || DEFAULT_SETTINGS.fontText;
      }
      return merged;
    }
  } catch (e) { log.warn('Failed to load settings from localStorage, using defaults', { error: String(e) }); }
  return { ...DEFAULT_SETTINGS };
}

/** Persist settings to localStorage. */
export function saveSettings(s: BismuthSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch (e) { log.warn('Failed to save settings to localStorage', { error: String(e) }); }
}

/** Clear persisted settings, reverting to defaults on next load. */
export function clearSettings(): void {
  localStorage.removeItem(STORAGE_KEY);
}
