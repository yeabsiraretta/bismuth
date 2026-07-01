import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';

vi.mock('@/utils/settings/fontSanitizer', () => ({
  sanitizeFontValue: (v: string) => v,
}));

vi.mock('@/features/calendar', () => ({
  DEFAULT_CALENDAR_CATEGORIES: [],
}));

const mockStorage: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: vi.fn((key: string) => mockStorage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    mockStorage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockStorage[key];
  }),
  clear: vi.fn(() => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  }),
});

const STORAGE_KEY = 'bismuth-settings';

describe('settings store — set/update/reset/reload', () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
    vi.resetModules();
    vi.mocked(localStorage.setItem).mockClear();
    vi.mocked(localStorage.removeItem).mockClear();
  });

  async function importStore() {
    const mod = await import('@/features/settings/stores/settingsStore');
    const types = await import('@/features/settings/types/settings.types');
    return { ...mod, DEFAULT_SETTINGS: types.DEFAULT_SETTINGS };
  }

  it('initializes with DEFAULT_SETTINGS when storage is empty', async () => {
    const { settings, DEFAULT_SETTINGS } = await importStore();
    const value = get(settings);
    expect(value.fontSize).toBe(DEFAULT_SETTINGS.fontSize);
    expect(value.autoSave).toBe(DEFAULT_SETTINGS.autoSave);
    expect(value.accentColor).toBe(DEFAULT_SETTINGS.accentColor);
  });

  it('set persists value to localStorage', async () => {
    const { settings, DEFAULT_SETTINGS } = await importStore();
    settings.set({ ...DEFAULT_SETTINGS, fontSize: 20 });
    expect(localStorage.setItem).toHaveBeenCalledWith(
      STORAGE_KEY,
      expect.stringContaining('"fontSize":20'),
    );
  });

  it('set applies CSS variables to document root', async () => {
    const { settings, DEFAULT_SETTINGS } = await importStore();
    settings.set({ ...DEFAULT_SETTINGS, accentColor: '#aabbcc' });
    const accent = document.documentElement.style.getPropertyValue('--interactive-accent');
    expect(accent).toBe('#aabbcc');
  });

  it('update merges partial change and persists', async () => {
    const { settings } = await importStore();
    settings.update((s) => ({ ...s, fontSize: 22 }));
    const value = get(settings);
    expect(value.fontSize).toBe(22);
    expect(localStorage.setItem).toHaveBeenCalled();
  });

  it('update does not clobber unrelated fields', async () => {
    const { settings, DEFAULT_SETTINGS } = await importStore();
    settings.update((s) => ({ ...s, fontSize: 24 }));
    const value = get(settings);
    expect(value.autoSave).toBe(DEFAULT_SETTINGS.autoSave);
    expect(value.accentColor).toBe(DEFAULT_SETTINGS.accentColor);
  });

  it('reset clears localStorage and restores defaults', async () => {
    const { settings, DEFAULT_SETTINGS } = await importStore();
    settings.set({ ...DEFAULT_SETTINGS, fontSize: 30 });
    settings.reset();
    expect(localStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
    const value = get(settings);
    expect(value.fontSize).toBe(DEFAULT_SETTINGS.fontSize);
  });

  it('reset applies default CSS variables', async () => {
    const { settings, DEFAULT_SETTINGS } = await importStore();
    settings.set({ ...DEFAULT_SETTINGS, accentColor: '#ffff00' });
    settings.reset();
    const accent = document.documentElement.style.getPropertyValue('--interactive-accent');
    expect(accent).toBe(DEFAULT_SETTINGS.accentColor);
  });

  it('reload reads from localStorage and updates the store', async () => {
    const { settings, DEFAULT_SETTINGS } = await importStore();
    // Simulate external write directly to localStorage
    mockStorage[STORAGE_KEY] = JSON.stringify({ ...DEFAULT_SETTINGS, fontSize: 28 });
    settings.reload();
    expect(get(settings).fontSize).toBe(28);
  });

  it('reload falls back to defaults when localStorage is empty', async () => {
    const { settings, DEFAULT_SETTINGS } = await importStore();
    // Ensure storage is empty
    delete mockStorage[STORAGE_KEY];
    settings.reload();
    expect(get(settings).fontSize).toBe(DEFAULT_SETTINGS.fontSize);
  });

  it('set applies --editor-font-size CSS variable', async () => {
    const { settings, DEFAULT_SETTINGS } = await importStore();
    settings.set({ ...DEFAULT_SETTINGS, fontSize: 18 });
    const fontSize = document.documentElement.style.getPropertyValue('--editor-font-size');
    expect(fontSize).toBe('18px');
  });

  it('set applies --editor-line-height CSS variable', async () => {
    const { settings, DEFAULT_SETTINGS } = await importStore();
    settings.set({ ...DEFAULT_SETTINGS, lineHeight: 1.8 });
    const lineHeight = document.documentElement.style.getPropertyValue('--editor-line-height');
    expect(lineHeight).toBe('1.8');
  });
});

describe('settings store — loadSettings round-trip', () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
    vi.resetModules();
  });

  it('saveSettings then loadSettings preserves all fields', async () => {
    const { saveSettings, loadSettings } = await import(
      '@/features/settings/services/settingsPersistence'
    );
    const { DEFAULT_SETTINGS } = await import('@/features/settings/types/settings.types');
    const custom = { ...DEFAULT_SETTINGS, fontSize: 19, accentColor: '#112233', wordWrap: false };
    saveSettings(custom);
    const loaded = loadSettings();
    expect(loaded.fontSize).toBe(19);
    expect(loaded.accentColor).toBe('#112233');
    expect(loaded.wordWrap).toBe(false);
  });

  it('loadSettings returns defaults when storage has corrupted JSON', async () => {
    mockStorage[STORAGE_KEY] = '{broken json:::';
    vi.resetModules();
    const { loadSettings } = await import('@/features/settings/services/settingsPersistence');
    const { DEFAULT_SETTINGS } = await import('@/features/settings/types/settings.types');
    const loaded = loadSettings();
    expect(loaded.fontSize).toBe(DEFAULT_SETTINGS.fontSize);
  });

  it('loadSettings migrates legacy fontFamily to fontText', async () => {
    const { DEFAULT_SETTINGS } = await import('@/features/settings/types/settings.types');
    // Simulate old save format that used fontFamily instead of fontText
    const legacy = { ...DEFAULT_SETTINGS, fontFamily: 'OldFont', fontText: '' };
    mockStorage[STORAGE_KEY] = JSON.stringify(legacy);
    vi.resetModules();
    const { loadSettings } = await import('@/features/settings/services/settingsPersistence');
    const loaded = loadSettings();
    expect(loaded.fontText).toBe('OldFont');
  });
});

describe('editorSettings derived store', () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
    vi.resetModules();
  });

  it('reflects tabSize and insertSpaces from settings', async () => {
    const { settings, editorSettings, DEFAULT_SETTINGS } = await import(
      '@/features/settings/stores/settingsStore'
    );
    settings.set({ ...DEFAULT_SETTINGS, tabSize: 4, insertSpaces: false });
    const es = get(editorSettings);
    expect(es.tabSize).toBe(4);
    expect(es.insertSpaces).toBe(false);
  });

  it('reflects livePreviewMode from settings', async () => {
    const { settings, editorSettings, DEFAULT_SETTINGS } = await import(
      '@/features/settings/stores/settingsStore'
    );
    settings.set({ ...DEFAULT_SETTINGS, livePreviewMode: 'reading' });
    expect(get(editorSettings).livePreviewMode).toBe('reading');
  });
});
