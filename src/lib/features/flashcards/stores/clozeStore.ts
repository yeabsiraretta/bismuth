/**
 * Cloze store — config persistence, global visibility toggle, per-note state.
 *
 * Inspired by Obsidian Cloze plugin: toggle all clozes, hover reveal,
 * fixed width blanks, auto-convert settings.
 */

import { writable, derived, get } from 'svelte/store';
import type { ClozeConfig } from '../types/cloze';
import { DEFAULT_CLOZE_CONFIG } from '../types/cloze';

const CONFIG_KEY = 'bismuth:cloze-config';

// ─── Config persistence ────────────────────────────────────────────────────────

function loadConfig(): ClozeConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) return { ...DEFAULT_CLOZE_CONFIG, ...JSON.parse(raw) };
  } catch {
    /* defaults */
  }
  return { ...DEFAULT_CLOZE_CONFIG };
}

function persistConfig(config: ClozeConfig): void {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch {
    /* ignore */
  }
}

const configStore = writable<ClozeConfig>(loadConfig());

configStore.subscribe(persistConfig);

export const clozeConfig = derived(configStore, ($c) => $c);

export function updateClozeConfig(partial: Partial<ClozeConfig>): void {
  configStore.update((c) => ({ ...c, ...partial }));
}

export function resetClozeConfig(): void {
  configStore.set({ ...DEFAULT_CLOZE_CONFIG });
}

export function getClozeConfig(): ClozeConfig {
  return get(configStore);
}

// ─── Global visibility toggle ──────────────────────────────────────────────────

const allRevealedStore = writable<boolean>(DEFAULT_CLOZE_CONFIG.defaultRevealed);

export const allClozesRevealed = derived(allRevealedStore, ($r) => $r);

/** Toggle all clozes visible/hidden. Returns new state. */
export function toggleAllClozes(): boolean {
  let revealed = false;
  allRevealedStore.update((r) => {
    revealed = !r;
    return revealed;
  });
  // Dispatch custom event so the extension can react
  window.dispatchEvent(new CustomEvent('cloze-toggle-all', { detail: { revealed } }));
  return revealed;
}

/** Set all clozes to a specific state. */
export function setAllClozesRevealed(revealed: boolean): void {
  allRevealedStore.set(revealed);
  window.dispatchEvent(new CustomEvent('cloze-toggle-all', { detail: { revealed } }));
}

/** Get current all-revealed state. */
export function getAllClozesRevealed(): boolean {
  return get(allRevealedStore);
}

// ─── Convenience setters ───────────────────────────────────────────────────────

export function toggleHoverReveal(): boolean {
  let enabled = false;
  configStore.update((c) => {
    enabled = !c.hoverReveal;
    return { ...c, hoverReveal: enabled };
  });
  return enabled;
}

export function toggleFixedWidth(): boolean {
  let enabled = false;
  configStore.update((c) => {
    enabled = !c.fixedWidth;
    return { ...c, fixedWidth: enabled };
  });
  return enabled;
}

export function toggleClozeEnabled(): boolean {
  let enabled = false;
  configStore.update((c) => {
    enabled = !c.enabled;
    return { ...c, enabled };
  });
  return enabled;
}
