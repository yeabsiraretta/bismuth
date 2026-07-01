import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store'; void get;

vi.mock('@/utils/settings/fontSanitizer', () => ({
  sanitizeFontValue: (v: string) => v,
}));

Object.defineProperty(globalThis, 'localStorage', {
  value: (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v; },
      removeItem: (k: string) => { delete store[k]; },
      clear: () => { store = {}; },
    };
  })(),
  writable: true,
});

vi.mock('@/features/calendar/types', () => ({
  DEFAULT_CALENDAR_CATEGORIES: [],
  DEFAULT_PLANNER_SETTINGS: {
    icsFeeds: [],
    showTimeline: true,
    showClockColumn: false,
    showMiniTimeline: false,
  },
}));

describe('settings feature module', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('loads DEFAULT_SETTINGS when localStorage is empty', async () => {
    const { DEFAULT_SETTINGS } = await import('../settings.types');
    const { loadSettings } = await import('../../services/settingsPersistence');
    const loaded = loadSettings();
    expect(loaded.autoSave).toBe(DEFAULT_SETTINGS.autoSave);
    expect(loaded.fontSize).toBe(DEFAULT_SETTINGS.fontSize);
  });

  it('merges saved values with defaults', async () => {
    const { DEFAULT_SETTINGS } = await import('../settings.types');
    const { loadSettings, saveSettings } = await import('../../services/settingsPersistence');
    saveSettings({ ...DEFAULT_SETTINGS, fontSize: 18 });
    const loaded = loadSettings();
    expect(loaded.fontSize).toBe(18);
    expect(loaded.autoSave).toBe(DEFAULT_SETTINGS.autoSave);
  });

  it('clearSettings removes localStorage entry', async () => {
    const { DEFAULT_SETTINGS } = await import('../settings.types');
    const { loadSettings, saveSettings, clearSettings } = await import('../../services/settingsPersistence');
    saveSettings({ ...DEFAULT_SETTINGS, fontSize: 20 });
    clearSettings();
    const loaded = loadSettings();
    expect(loaded.fontSize).toBe(DEFAULT_SETTINGS.fontSize);
  });

  it('settings barrel exports BismuthSettings type and settings store', async () => {
    const mod = await import('../../index');
    expect(mod.DEFAULT_SETTINGS).toBeDefined();
    expect(mod.settings).toBeDefined();
    expect(mod.editorSettings).toBeDefined();
    expect(mod.generalSettings).toBeDefined();
    expect(mod.appearanceSettings).toBeDefined();
  });
});
