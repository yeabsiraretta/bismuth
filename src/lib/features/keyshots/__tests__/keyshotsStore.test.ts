import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
  keyshotsConfig,
  activePreset,
  activePresetLabel,
  setPreset,
  cyclePreset,
  resetKeyshotsConfig,
  toggleCaseSensitiveSorting,
} from '../stores/keyshotsStore';

beforeEach(() => {
  localStorage.clear();
  resetKeyshotsConfig();
});

describe('keyshotsConfig', () => {
  it('returns default config', () => {
    const config = get(keyshotsConfig);
    expect(config.preset).toBe('clear');
    expect(config.caseSensitiveSorting).toBe(false);
  });
});

describe('setPreset', () => {
  it('changes preset and returns label', () => {
    const label = setPreset('vscode');
    expect(label).toBe('Visual Studio Code');
    expect(get(activePreset)).toBe('vscode');
    expect(get(activePresetLabel)).toBe('Visual Studio Code');
  });

  it('persists to localStorage', () => {
    setPreset('jetbrains');
    const raw = localStorage.getItem('bismuth:keyshots-config');
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw!).preset).toBe('jetbrains');
  });
});

describe('cyclePreset', () => {
  it('cycles from clear → keyshots', () => {
    const label = cyclePreset();
    expect(label).toBe('Keyshots Default');
    expect(get(activePreset)).toBe('keyshots');
  });

  it('cycles through all presets', () => {
    cyclePreset(); // keyshots
    cyclePreset(); // vscode
    cyclePreset(); // jetbrains
    cyclePreset(); // visual-studio
    cyclePreset(); // back to clear
    expect(get(activePreset)).toBe('clear');
  });
});

describe('resetKeyshotsConfig', () => {
  it('restores defaults', () => {
    setPreset('vscode');
    resetKeyshotsConfig();
    expect(get(activePreset)).toBe('clear');
  });
});

describe('toggleCaseSensitiveSorting', () => {
  it('toggles on', () => {
    const value = toggleCaseSensitiveSorting();
    expect(value).toBe(true);
    expect(get(keyshotsConfig).caseSensitiveSorting).toBe(true);
  });

  it('toggles off', () => {
    toggleCaseSensitiveSorting(); // on
    const value = toggleCaseSensitiveSorting(); // off
    expect(value).toBe(false);
  });
});
