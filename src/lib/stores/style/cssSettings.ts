import { writable, derived, get } from 'svelte/store';
import { log } from '@/utils/logger';
import { scanStyleSettings as serviceScenStyleSettings } from '@/services/theme/styleSettings';
import type { SettingsBlock, StyleSetting, CSSSettingsState } from '@/types/style-settings';
import { createPersistedStore } from '@/utils/storage';
import {
  applySetting,
  removeSetting,
  removeAllApplied,
  getDefaultValue,
  applyAllSettings,
} from './cssSettingsApply';

const STORAGE_KEY = 'bismuth-css-settings';
const DEFAULT_STATE: CSSSettingsState = {
  values: {},
  classToggles: {},
  classSelects: {},
  themedColors: {},
};

export const settingsBlocks = writable<SettingsBlock[]>([]);
export const cssSettingsState = createPersistedStore<CSSSettingsState>(STORAGE_KEY, DEFAULT_STATE);
export const cssSettingsLoading = writable(false);

export const allSettings = derived(settingsBlocks, ($blocks) =>
  $blocks.flatMap((b) => b.settings.map((s) => ({ ...s, blockId: b.id, blockName: b.name })))
);

export async function scanStyleSettings(): Promise<void> {
  cssSettingsLoading.set(true);
  try {
    const { loadFromVault, initVaultSync } = await import('./vaultSync');
    await loadFromVault();
    initVaultSync();
    const blocks = await serviceScenStyleSettings();
    settingsBlocks.set(blocks);
    log.info('CSS settings: scanned blocks', { count: blocks.length });
    applyAllSettings(blocks, (blockId, setting) => getSettingValue(blockId, setting));
  } catch (err) {
    log.warn('CSS settings: scan failed (service may not be initialized)', { err });
    settingsBlocks.set([]);
  } finally {
    cssSettingsLoading.set(false);
  }
}

export function getSettingValue(blockId: string, setting: StyleSetting): string | number | boolean {
  const state = get(cssSettingsState);
  const blockValues = state.values[blockId];
  if (blockValues && setting.id in blockValues) return blockValues[setting.id];
  return getDefaultValue(setting);
}

export function getThemedColorValue(
  settingId: string,
  mode: 'light' | 'dark',
  fallback: string
): string {
  const state = get(cssSettingsState);
  const entry = state.themedColors[settingId]?.[settingId];
  return entry?.[mode] || fallback;
}

export function setThemedColorValue(
  setting: StyleSetting,
  mode: 'light' | 'dark',
  value: string
): void {
  if (setting.type !== 'variable-themed-color') return;
  cssSettingsState.update((s) => {
    if (!s.themedColors[setting.id]) {
      s.themedColors[setting.id] = {
        [setting.id]: { light: setting['default-light'], dark: setting['default-dark'] },
      };
    }
    s.themedColors[setting.id][setting.id][mode] = value;
    return s;
  });
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  if (currentTheme === mode) applySetting(setting, value);
}

export function setSettingValue(
  blockId: string,
  setting: StyleSetting,
  value: string | number | boolean
): void {
  cssSettingsState.update((state) => {
    if (!state.values[blockId]) state.values[blockId] = {};
    state.values[blockId][setting.id] = value;
    return state;
  });
  applySetting(setting, value);
}

export function resetSetting(blockId: string, setting: StyleSetting): void {
  cssSettingsState.update((state) => {
    if (state.values[blockId]) delete state.values[blockId][setting.id];
    return state;
  });
  removeSetting(setting);
  applySetting(setting, getDefaultValue(setting));
}

export function resetAllCSSSettings(): void {
  const state = get(cssSettingsState);
  removeAllApplied(state);
  cssSettingsState.set({ values: {}, classToggles: {}, classSelects: {}, themedColors: {} });
  const blocks = get(settingsBlocks);
  applyAllSettings(blocks, (blockId, setting) => getSettingValue(blockId, setting));
}
