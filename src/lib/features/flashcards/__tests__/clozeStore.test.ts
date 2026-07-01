import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
  clozeConfig,
  updateClozeConfig,
  resetClozeConfig,
  getClozeConfig,
  toggleAllClozes,
  setAllClozesRevealed,
  getAllClozesRevealed,
  toggleHoverReveal,
  toggleFixedWidth,
  toggleClozeEnabled,
  allClozesRevealed,
} from '../stores/clozeStore';
import { DEFAULT_CLOZE_CONFIG } from '../types/cloze';

beforeEach(() => {
  localStorage.clear();
  resetClozeConfig();
  setAllClozesRevealed(DEFAULT_CLOZE_CONFIG.defaultRevealed);
});

describe('clozeConfig', () => {
  it('returns default config', () => {
    const config = get(clozeConfig);
    expect(config.enabled).toBe(true);
    expect(config.hoverReveal).toBe(false);
    expect(config.fixedWidth).toBe(false);
    expect(config.autoConvert.highlights).toBe(true);
    expect(config.hint.mode).toBe('none');
  });
});

describe('updateClozeConfig', () => {
  it('updates partial config', () => {
    updateClozeConfig({ hoverReveal: true, fixedWidth: true });
    const config = get(clozeConfig);
    expect(config.hoverReveal).toBe(true);
    expect(config.fixedWidth).toBe(true);
    expect(config.enabled).toBe(true); // unchanged
  });
});

describe('resetClozeConfig', () => {
  it('restores defaults', () => {
    updateClozeConfig({ hoverReveal: true, fixedWidth: true, requiredTag: '#review' });
    resetClozeConfig();
    expect(get(clozeConfig)).toEqual(DEFAULT_CLOZE_CONFIG);
  });
});

describe('getClozeConfig', () => {
  it('returns current config synchronously', () => {
    updateClozeConfig({ fixedWidthPx: 120 });
    expect(getClozeConfig().fixedWidthPx).toBe(120);
  });
});

describe('toggleAllClozes', () => {
  it('toggles to revealed', () => {
    const result = toggleAllClozes();
    expect(result).toBe(true);
    expect(get(allClozesRevealed)).toBe(true);
  });

  it('toggles back to hidden', () => {
    toggleAllClozes(); // revealed
    const result = toggleAllClozes(); // hidden
    expect(result).toBe(false);
    expect(get(allClozesRevealed)).toBe(false);
  });
});

describe('setAllClozesRevealed', () => {
  it('sets revealed state', () => {
    setAllClozesRevealed(true);
    expect(getAllClozesRevealed()).toBe(true);
    setAllClozesRevealed(false);
    expect(getAllClozesRevealed()).toBe(false);
  });
});

describe('toggleHoverReveal', () => {
  it('toggles hover reveal on', () => {
    const result = toggleHoverReveal();
    expect(result).toBe(true);
    expect(get(clozeConfig).hoverReveal).toBe(true);
  });

  it('toggles hover reveal off', () => {
    toggleHoverReveal();
    const result = toggleHoverReveal();
    expect(result).toBe(false);
  });
});

describe('toggleFixedWidth', () => {
  it('toggles fixed width on', () => {
    const result = toggleFixedWidth();
    expect(result).toBe(true);
    expect(get(clozeConfig).fixedWidth).toBe(true);
  });
});

describe('toggleClozeEnabled', () => {
  it('toggles cloze off', () => {
    const result = toggleClozeEnabled();
    expect(result).toBe(false);
    expect(get(clozeConfig).enabled).toBe(false);
  });

  it('toggles cloze back on', () => {
    toggleClozeEnabled();
    const result = toggleClozeEnabled();
    expect(result).toBe(true);
  });
});

describe('localStorage persistence', () => {
  it('persists config', () => {
    updateClozeConfig({ hoverReveal: true, fixedWidthPx: 150 });
    const raw = localStorage.getItem('bismuth:cloze-config');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.hoverReveal).toBe(true);
    expect(parsed.fixedWidthPx).toBe(150);
  });
});
