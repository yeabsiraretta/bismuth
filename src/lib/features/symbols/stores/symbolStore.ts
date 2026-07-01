/**
 * Symbol prettifier store — persistent config for symbol replacement rules.
 */

import { writable, derived, get } from 'svelte/store';
import { log } from '@/utils/logger';
import type { SymbolPrettifierConfig, SymbolRule } from '../types';
import { DEFAULT_CONFIG } from '../types';
import { sortRules } from '../services/prettifier';

const STORAGE_KEY = 'bismuth:symbol-prettifier';

function loadConfig(): SymbolPrettifierConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CONFIG, rules: DEFAULT_CONFIG.rules.map((r) => ({ ...r })) };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      rules: parsed.rules ?? DEFAULT_CONFIG.rules.map((r) => ({ ...r })),
    };
  } catch {
    return { ...DEFAULT_CONFIG, rules: DEFAULT_CONFIG.rules.map((r) => ({ ...r })) };
  }
}

function persist(config: SymbolPrettifierConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    log.warn('symbolStore: persist failed', { error: String(e) });
  }
}

const configInternal = writable<SymbolPrettifierConfig>(loadConfig());
configInternal.subscribe((c) => persist(c));

/** Whether the symbol prettifier is enabled. */
export const symbolsEnabled = derived(configInternal, ($c) => $c.enabled);

/** All rules (sorted longest-first for matching). */
export const symbolRules = derived(configInternal, ($c) => sortRules($c.rules));

/** All rules unsorted (for UI display). */
export const symbolRulesRaw = derived(configInternal, ($c) => $c.rules);

/** Toggle the prettifier on/off. */
export function toggleSymbols(): void {
  configInternal.update((c) => ({ ...c, enabled: !c.enabled }));
}

/** Enable or disable the prettifier. */
export function setSymbolsEnabled(enabled: boolean): void {
  configInternal.update((c) => ({ ...c, enabled }));
}

/** Toggle a specific rule on/off by trigger string. */
export function toggleRule(trigger: string): void {
  configInternal.update((c) => ({
    ...c,
    rules: c.rules.map((r) => (r.trigger === trigger ? { ...r, enabled: !r.enabled } : r)),
  }));
}

/** Add a custom rule. */
export function addRule(trigger: string, replacement: string): void {
  if (!trigger || !replacement) return;
  configInternal.update((c) => {
    if (c.rules.some((r) => r.trigger === trigger)) return c;
    return { ...c, rules: [...c.rules, { trigger, replacement, enabled: true }] };
  });
}

/** Remove a rule by trigger. */
export function removeRule(trigger: string): void {
  configInternal.update((c) => ({
    ...c,
    rules: c.rules.filter((r) => r.trigger !== trigger),
  }));
}

/** Reset to default rules. */
export function resetRules(): void {
  configInternal.set({ ...DEFAULT_CONFIG, rules: DEFAULT_CONFIG.rules.map((r) => ({ ...r })) });
}

/** Get current rules (non-reactive). */
export function getRules(): SymbolRule[] {
  return sortRules(get(configInternal).rules);
}

/** Check if prettifier is currently enabled (non-reactive). */
export function isEnabled(): boolean {
  return get(configInternal).enabled;
}
