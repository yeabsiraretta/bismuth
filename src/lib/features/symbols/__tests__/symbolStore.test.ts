import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';

vi.mock('@/utils/logger', () => ({
  log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import {
  symbolsEnabled,
  symbolRules,
  symbolRulesRaw,
  toggleSymbols,
  setSymbolsEnabled,
  toggleRule,
  addRule,
  removeRule,
  resetRules,
  getRules,
  isEnabled,
} from '../stores/symbolStore';

describe('symbolStore', () => {
  beforeEach(() => {
    resetRules();
    vi.clearAllMocks();
  });

  it('defaults to enabled', () => {
    expect(get(symbolsEnabled)).toBe(true);
    expect(isEnabled()).toBe(true);
  });

  it('toggleSymbols flips enabled state', () => {
    toggleSymbols();
    expect(get(symbolsEnabled)).toBe(false);
    toggleSymbols();
    expect(get(symbolsEnabled)).toBe(true);
  });

  it('setSymbolsEnabled sets directly', () => {
    setSymbolsEnabled(false);
    expect(get(symbolsEnabled)).toBe(false);
    setSymbolsEnabled(true);
    expect(get(symbolsEnabled)).toBe(true);
  });

  it('has default rules loaded', () => {
    const rules = get(symbolRulesRaw);
    expect(rules.length).toBeGreaterThan(10);
    expect(rules.some((r) => r.trigger === '->')).toBe(true);
    expect(rules.some((r) => r.trigger === '<=>')).toBe(true);
  });

  it('symbolRules returns sorted (longest first)', () => {
    const sorted = get(symbolRules);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].trigger.length).toBeGreaterThanOrEqual(sorted[i].trigger.length);
    }
  });

  it('toggleRule disables/enables a rule', () => {
    toggleRule('->');
    expect(get(symbolRulesRaw).find((r) => r.trigger === '->')?.enabled).toBe(false);
    toggleRule('->');
    expect(get(symbolRulesRaw).find((r) => r.trigger === '->')?.enabled).toBe(true);
  });

  it('addRule adds a custom rule', () => {
    addRule('!!', '\u203C');
    expect(get(symbolRulesRaw).some((r) => r.trigger === '!!')).toBe(true);
  });

  it('addRule ignores duplicate triggers', () => {
    const before = get(symbolRulesRaw).length;
    addRule('->', 'dup');
    expect(get(symbolRulesRaw).length).toBe(before);
  });

  it('addRule ignores empty trigger/replacement', () => {
    const before = get(symbolRulesRaw).length;
    addRule('', 'x');
    addRule('x', '');
    expect(get(symbolRulesRaw).length).toBe(before);
  });

  it('removeRule removes by trigger', () => {
    addRule('!!', '\u203C');
    removeRule('!!');
    expect(get(symbolRulesRaw).some((r) => r.trigger === '!!')).toBe(false);
  });

  it('resetRules restores defaults', () => {
    addRule('!!', '\u203C');
    toggleRule('->');
    resetRules();
    expect(get(symbolRulesRaw).some((r) => r.trigger === '!!')).toBe(false);
    expect(get(symbolRulesRaw).find((r) => r.trigger === '->')?.enabled).toBe(true);
  });

  it('getRules returns sorted non-reactively', () => {
    const rules = getRules();
    expect(rules.length).toBeGreaterThan(0);
    for (let i = 1; i < rules.length; i++) {
      expect(rules[i - 1].trigger.length).toBeGreaterThanOrEqual(rules[i].trigger.length);
    }
  });
});
