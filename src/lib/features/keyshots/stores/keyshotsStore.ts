/**
 * Keyshots store — preset selection, config persistence,
 * and editor compartment reconfiguration.
 */

import { writable, derived, get } from 'svelte/store';
import type { KeyshotsConfig, KeyshotsPreset } from '../types/keyshots';
import { DEFAULT_KEYSHOTS_CONFIG, PRESET_LABELS } from '../types/keyshots';

const CONFIG_KEY = 'bismuth:keyshots-config';

// ─── Config persistence ────────────────────────────────────────────────────────

function loadConfig(): KeyshotsConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) return { ...DEFAULT_KEYSHOTS_CONFIG, ...JSON.parse(raw) };
  } catch { /* defaults */ }
  return { ...DEFAULT_KEYSHOTS_CONFIG };
}

function persistConfig(config: KeyshotsConfig): void {
  try { localStorage.setItem(CONFIG_KEY, JSON.stringify(config)); }
  catch { /* ignore */ }
}

const configStore = writable<KeyshotsConfig>(loadConfig());
configStore.subscribe(persistConfig);

export const keyshotsConfig = derived(configStore, $c => $c);
export const activePreset = derived(configStore, $c => $c.preset);
export const activePresetLabel = derived(configStore, $c => PRESET_LABELS[$c.preset]);

export function getKeyshotsConfig(): KeyshotsConfig {
  return get(configStore);
}

// ─── Preset management ─────────────────────────────────────────────────────────

type PresetListener = (preset: KeyshotsPreset) => void;
let presetListener: PresetListener | null = null;

/** Register a listener called when the preset changes (used by Editor compartment). */
export function onPresetChange(listener: PresetListener): void {
  presetListener = listener;
}

/** Switch to a new IDE preset. Returns the label. */
export function setPreset(preset: KeyshotsPreset): string {
  configStore.update(c => ({ ...c, preset }));
  if (presetListener) presetListener(preset);
  window.dispatchEvent(new CustomEvent('keyshots:preset-changed', { detail: { preset } }));
  return PRESET_LABELS[preset];
}

/** Cycle through presets in order. */
export function cyclePreset(): string {
  const order: KeyshotsPreset[] = ['clear', 'keyshots', 'vscode', 'jetbrains', 'visual-studio'];
  const current = get(configStore).preset;
  const idx = order.indexOf(current);
  const next = order[(idx + 1) % order.length];
  return setPreset(next);
}

export function resetKeyshotsConfig(): void {
  configStore.set({ ...DEFAULT_KEYSHOTS_CONFIG });
  if (presetListener) presetListener(DEFAULT_KEYSHOTS_CONFIG.preset);
}

// ─── Sorting config ────────────────────────────────────────────────────────────

export function toggleCaseSensitiveSorting(): boolean {
  let value = false;
  configStore.update(c => {
    value = !c.caseSensitiveSorting;
    return { ...c, caseSensitiveSorting: value };
  });
  return value;
}
