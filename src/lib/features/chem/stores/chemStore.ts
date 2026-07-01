/**
 * Chem store — config persistence, theme/sizing settings.
 *
 * Decoupled from the widget/extension layer to avoid transitive
 * smiles-drawer imports during testing.
 */

import { writable, derived, get } from 'svelte/store';
import type { ChemConfig } from '../types';
import { DEFAULT_CHEM_CONFIG } from '../types';

const CONFIG_KEY = 'bismuth:chem-config';

// ─── Extension sync callback (set by smilesExtension at init) ──────────────────

type ConfigListener = (config: ChemConfig) => void;
let configListener: ConfigListener | null = null;

/** Register a listener for config changes (called by smilesExtension). */
export function onChemConfigChange(listener: ConfigListener): void {
  configListener = listener;
}

// ─── Config ────────────────────────────────────────────────────────────────────

function loadConfig(): ChemConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) return { ...DEFAULT_CHEM_CONFIG, ...JSON.parse(raw) };
  } catch {
    /* defaults */
  }
  return { ...DEFAULT_CHEM_CONFIG };
}

function persistConfig(config: ChemConfig): void {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch {
    /* ignore */
  }
}

const configStore = writable<ChemConfig>(loadConfig());

// Sync config to localStorage + optional extension listener on every change
configStore.subscribe((config) => {
  persistConfig(config);
  if (configListener) configListener(config);
});

export const chemConfig = derived(configStore, ($c) => $c);

export function updateChemConfig(partial: Partial<ChemConfig>): void {
  configStore.update((c) => ({ ...c, ...partial }));
}

export function resetChemConfig(): void {
  configStore.set({ ...DEFAULT_CHEM_CONFIG });
}

export function getChemConfig(): ChemConfig {
  return get(configStore);
}

// ─── Convenience setters ───────────────────────────────────────────────────────

export function setChemSize(width: number, height: number): void {
  const w = Math.max(100, Math.min(800, width));
  const h = Math.max(80, Math.min(600, height));
  configStore.update((c) => ({ ...c, width: w, height: h }));
}

export function toggleInlineSmiles(): boolean {
  let enabled = false;
  configStore.update((c) => {
    enabled = !c.inlineEnabled;
    return { ...c, inlineEnabled: enabled };
  });
  return enabled;
}
