import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
  chemConfig,
  updateChemConfig,
  resetChemConfig,
  getChemConfig,
  setChemSize,
  toggleInlineSmiles,
} from '../stores/chemStore';
import { DEFAULT_CHEM_CONFIG } from '../types';

beforeEach(() => {
  localStorage.clear();
  resetChemConfig();
});

describe('chemConfig', () => {
  it('returns default config', () => {
    const config = get(chemConfig);
    expect(config).toEqual(DEFAULT_CHEM_CONFIG);
    expect(config.width).toBe(300);
    expect(config.height).toBe(200);
    expect(config.theme).toBe('auto');
  });
});

describe('updateChemConfig', () => {
  it('updates partial config', () => {
    updateChemConfig({ width: 400, theme: 'dark' });
    const config = get(chemConfig);
    expect(config.width).toBe(400);
    expect(config.theme).toBe('dark');
    expect(config.height).toBe(200); // unchanged
  });
});

describe('resetChemConfig', () => {
  it('restores defaults', () => {
    updateChemConfig({ width: 500, height: 400, theme: 'light' });
    resetChemConfig();
    expect(get(chemConfig)).toEqual(DEFAULT_CHEM_CONFIG);
  });
});

describe('getChemConfig', () => {
  it('returns current config synchronously', () => {
    updateChemConfig({ width: 450 });
    expect(getChemConfig().width).toBe(450);
  });
});

describe('setChemSize', () => {
  it('sets size within bounds', () => {
    setChemSize(400, 300);
    const config = get(chemConfig);
    expect(config.width).toBe(400);
    expect(config.height).toBe(300);
  });

  it('clamps width minimum to 100', () => {
    setChemSize(50, 200);
    expect(get(chemConfig).width).toBe(100);
  });

  it('clamps width maximum to 800', () => {
    setChemSize(1000, 200);
    expect(get(chemConfig).width).toBe(800);
  });

  it('clamps height minimum to 80', () => {
    setChemSize(300, 30);
    expect(get(chemConfig).height).toBe(80);
  });

  it('clamps height maximum to 600', () => {
    setChemSize(300, 900);
    expect(get(chemConfig).height).toBe(600);
  });
});

describe('toggleInlineSmiles', () => {
  it('toggles inline on', () => {
    const result = toggleInlineSmiles();
    expect(result).toBe(true);
    expect(get(chemConfig).inlineEnabled).toBe(true);
  });

  it('toggles inline off', () => {
    toggleInlineSmiles(); // on
    const result = toggleInlineSmiles(); // off
    expect(result).toBe(false);
    expect(get(chemConfig).inlineEnabled).toBe(false);
  });
});

describe('localStorage persistence', () => {
  it('persists config', () => {
    updateChemConfig({ width: 500, theme: 'dark' });
    const raw = localStorage.getItem('bismuth:chem-config');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.width).toBe(500);
    expect(parsed.theme).toBe('dark');
  });
});
