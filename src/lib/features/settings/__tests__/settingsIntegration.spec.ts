/**
 * Spec 021 — Settings integration tests.
 * Tests: persist cycle, applyCSS CSS custom properties, DEFAULT_SETTINGS completeness.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── Mock dependencies ──────────────────────────────────────────────────────

vi.mock('@/utils/settings/fontSanitizer', () => ({
  sanitizeFontValue: (v: string) => v,
}));

vi.mock('@/features/calendar', () => ({
  DEFAULT_CALENDAR_CATEGORIES: [],
}));

// ── localStorage mock ──────────────────────────────────────────────────────

type LocalStorageMock = {
  getItem: (k: string) => string | null;
  setItem: (k: string, v: string) => void;
  removeItem: (k: string) => void;
  clear: () => void;
  _store: Record<string, string>;
};

function buildLocalStorageMock(): LocalStorageMock {
  let store: Record<string, string> = {};
  return {
    get _store() {
      return store;
    },
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      store = {};
    },
  };
}

const localStorageMock = buildLocalStorageMock();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// ── document.documentElement style mock ───────────────────────────────────

const cssVars: Record<string, string> = {};
const mockStyle = {
  setProperty: (prop: string, value: string) => {
    cssVars[prop] = value;
  },
  getPropertyValue: (prop: string) => cssVars[prop] ?? '',
};
Object.defineProperty(document.documentElement, 'style', {
  value: mockStyle,
  writable: true,
});

// ── Helpers ────────────────────────────────────────────────────────────────

async function freshSettings() {
  vi.resetModules();
  const mod = await import('../stores/settingsStore');
  return mod;
}

async function freshPersistence() {
  vi.resetModules();
  const mod = await import('../services/settingsPersistence');
  return mod;
}

// ===========================================================================
// Tests
// ===========================================================================

describe('settings persist cycle', () => {
  beforeEach(() => {
    localStorageMock.clear();
    Object.keys(cssVars).forEach((k) => {
      delete cssVars[k];
    });
    vi.resetModules();
  });

  it('set → reload: value survives round-trip through localStorage', async () => {
    const { loadSettings, saveSettings } = await freshPersistence();
    const { DEFAULT_SETTINGS } = await import('../types/settings.types');
    saveSettings({ ...DEFAULT_SETTINGS, fontSize: 22 });
    localStorageMock._store; // ensure store written
    const loaded = loadSettings();
    expect(loaded.fontSize).toBe(22);
  });

  it('clear → reload: reverts to defaults', async () => {
    const { loadSettings, saveSettings, clearSettings } = await freshPersistence();
    const { DEFAULT_SETTINGS } = await import('../types/settings.types');
    saveSettings({ ...DEFAULT_SETTINGS, fontSize: 24 });
    clearSettings();
    const loaded = loadSettings();
    expect(loaded.fontSize).toBe(DEFAULT_SETTINGS.fontSize);
  });

  it('partial saved data merges with defaults for new keys', async () => {
    const { loadSettings } = await freshPersistence();
    const { DEFAULT_SETTINGS } = await import('../types/settings.types');
    // Simulate old storage missing new keys
    localStorage.setItem('bismuth-settings', JSON.stringify({ fontSize: 14 }));
    const loaded = loadSettings();
    expect(loaded.fontSize).toBe(14);
    expect(loaded.autoSave).toBe(DEFAULT_SETTINGS.autoSave);
    expect(loaded.accentColor).toBe(DEFAULT_SETTINGS.accentColor);
  });

  it('corrupted JSON in localStorage falls back to defaults', async () => {
    const { loadSettings } = await freshPersistence();
    const { DEFAULT_SETTINGS } = await import('../types/settings.types');
    localStorage.setItem('bismuth-settings', '{invalid json}');
    const loaded = loadSettings();
    expect(loaded.fontSize).toBe(DEFAULT_SETTINGS.fontSize);
  });
});

describe('applyCSS sets CSS custom properties', () => {
  beforeEach(() => {
    localStorageMock.clear();
    Object.keys(cssVars).forEach((k) => {
      delete cssVars[k];
    });
    vi.resetModules();
  });

  it('sets --editor-font-size based on fontSize setting', async () => {
    const { DEFAULT_SETTINGS } = await import('../types/settings.types');
    const { saveSettings } = await freshPersistence();
    saveSettings({ ...DEFAULT_SETTINGS, fontSize: 18 });
    // Import store after writing to localStorage so it reads 18
    await freshSettings();
    // The store applies CSS on import. CSS should reflect fontSize=18.
    expect(cssVars['--editor-font-size']).toBe('18px');
  });

  it('sets --interactive-accent based on accentColor', async () => {
    const { DEFAULT_SETTINGS } = await import('../types/settings.types');
    const { saveSettings } = await freshPersistence();
    saveSettings({ ...DEFAULT_SETTINGS, accentColor: '#0066cc' });
    await freshSettings();
    expect(cssVars['--interactive-accent']).toBe('#0066cc');
  });

  it('sets --editor-line-height from lineHeight', async () => {
    const { DEFAULT_SETTINGS } = await import('../types/settings.types');
    const { saveSettings } = await freshPersistence();
    saveSettings({ ...DEFAULT_SETTINGS, lineHeight: 1.8 });
    await freshSettings();
    expect(cssVars['--editor-line-height']).toBe('1.8');
  });

  it('uses defaults when localStorage is empty', async () => {
    const { DEFAULT_SETTINGS } = await import('../types/settings.types');
    await freshSettings();
    expect(cssVars['--editor-font-size']).toBe(`${DEFAULT_SETTINGS.fontSize}px`);
    expect(cssVars['--interactive-accent']).toBe(DEFAULT_SETTINGS.accentColor);
  });
});

describe('DEFAULT_SETTINGS has all required fields', () => {
  it('contains every key declared in BismuthSettings interface', async () => {
    const { DEFAULT_SETTINGS } = await import('../types/settings.types');
    const required: Array<keyof typeof DEFAULT_SETTINGS> = [
      'autoSave',
      'autoSaveDelay',
      'confirmBeforeDelete',
      'defaultNoteLocation',
      'dateFormat',
      'timeFormat',
      'newFileNameTemplate',
      'language',
      'autoCheckUpdates',
      'lastUpdateCheck',
      'updateChannel',
      'startupThresholdMs',
      'calendarCategories',
      'fontSize',
      'lineHeight',
      'showLineNumbers',
      'wordWrap',
      'hardLineBreaks',
      'spellCheck',
      'tabSize',
      'insertSpaces',
      'trimTrailingWhitespace',
      'livePreview',
      'livePreviewMode',
      'closeBrackets',
      'accentColor',
      'showStatusBar',
      'compactMode',
      'activeThemePath',
      'fontInterface',
      'fontText',
      'fontMono',
      'enableGit',
      'autoCommit',
      'syncOnStartup',
      'commitMessageTemplate',
      'enableBackups',
      'changelogAutoUpdate',
      'changelogPath',
      'changelogDatetimeFormat',
      'changelogMaxFiles',
      'changelogUseWikilinks',
      'changelogHeading',
      'changelogExcludedFolders',
      'nativeFrame',
      'versioningEnabled',
      'versionRetentionCount',
      'versioningLlmClassify',
      'musicEnabled',
      'ocrEnabled',
      'ocrDefaultLanguage',
      'ocrLlmCorrection',
      'ocrLlmCloudEnabled',
      'ocrModelPath',
      'ocrAmharicModelPath',
      'llmEnabled',
      'llmNoteContext',
      'llmMaxHistory',
      'nasEnabled',
    ];
    for (const key of required) {
      expect(DEFAULT_SETTINGS).toHaveProperty(key);
    }
  });

  it('fontSize is a positive number', async () => {
    const { DEFAULT_SETTINGS } = await import('../types/settings.types');
    expect(typeof DEFAULT_SETTINGS.fontSize).toBe('number');
    expect(DEFAULT_SETTINGS.fontSize).toBeGreaterThan(0);
  });

  it('lineHeight is a positive number', async () => {
    const { DEFAULT_SETTINGS } = await import('../types/settings.types');
    expect(DEFAULT_SETTINGS.lineHeight).toBeGreaterThan(0);
  });

  it('updateChannel is one of the valid enum values', async () => {
    const { DEFAULT_SETTINGS } = await import('../types/settings.types');
    expect(['alpha', 'beta', 'release']).toContain(DEFAULT_SETTINGS.updateChannel);
  });

  it('livePreviewMode is one of the valid enum values', async () => {
    const { DEFAULT_SETTINGS } = await import('../types/settings.types');
    expect(['source', 'live', 'reading']).toContain(DEFAULT_SETTINGS.livePreviewMode);
  });

  it('all boolean fields default to a boolean', async () => {
    const { DEFAULT_SETTINGS } = await import('../types/settings.types');
    const boolFields: Array<keyof typeof DEFAULT_SETTINGS> = [
      'autoSave',
      'confirmBeforeDelete',
      'autoCheckUpdates',
      'showLineNumbers',
      'wordWrap',
      'hardLineBreaks',
      'spellCheck',
      'insertSpaces',
      'trimTrailingWhitespace',
      'livePreview',
      'closeBrackets',
      'showStatusBar',
      'compactMode',
      'enableGit',
      'autoCommit',
      'syncOnStartup',
      'enableBackups',
      'changelogAutoUpdate',
      'changelogUseWikilinks',
      'nativeFrame',
      'versioningEnabled',
      'versioningLlmClassify',
      'musicEnabled',
      'ocrEnabled',
      'ocrLlmCorrection',
      'ocrLlmCloudEnabled',
      'llmEnabled',
      'llmNoteContext',
      'nasEnabled',
    ];
    for (const field of boolFields) {
      expect(typeof DEFAULT_SETTINGS[field]).toBe('boolean');
    }
  });
});
