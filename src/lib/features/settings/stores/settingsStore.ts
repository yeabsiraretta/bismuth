import { writable, derived } from 'svelte/store';
import { sanitizeFontValue } from '@/utils/settings/fontSanitizer';
import type { BismuthSettings } from '../types/settings.types';
import { DEFAULT_SETTINGS } from '../types/settings.types';
export { DEFAULT_SETTINGS };
import { loadSettings, saveSettings, clearSettings } from '../services/settingsPersistence';

function buildFontStack(family: string, fallback: string): string {
  return `'${sanitizeFontValue(family)}', ${fallback}`;
}

function applyCSS(s: BismuthSettings): void {
  const root = document.documentElement;
  const fontText = s.fontText || 'Inter Variable';
  const fontInterface = s.fontInterface || fontText;
  const fontMono = s.fontMono || 'JetBrains Mono';
  root.style.setProperty('--editor-font-size', `${s.fontSize ?? 16}px`);
  root.style.setProperty('--editor-line-height', `${s.lineHeight ?? 1.6}`);
  root.style.setProperty('--editor-font-family', fontText);
  root.style.setProperty('--font-sans', buildFontStack(fontInterface, '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'));
  root.style.setProperty('--font-text', buildFontStack(fontText, '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'));
  root.style.setProperty('--font-mono', buildFontStack(fontMono, '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace'));
  root.style.setProperty('--font-text-size', `${s.fontSize ?? 16}px`);
  root.style.setProperty('--line-height-normal', `${s.lineHeight ?? 1.6}`);
  root.style.setProperty('--interactive-accent', s.accentColor || '#dc2626');
}

function createSettingsStore() {
  const { subscribe, set, update } = writable<BismuthSettings>(loadSettings());

  return {
    subscribe,
    set(value: BismuthSettings) {
      set(value);
      saveSettings(value);
      applyCSS(value);
    },
    update(fn: (s: BismuthSettings) => BismuthSettings) {
      update((current) => {
        const next = fn(current);
        saveSettings(next);
        applyCSS(next);
        return next;
      });
    },
    reset() {
      clearSettings();
      set({ ...DEFAULT_SETTINGS });
      applyCSS(DEFAULT_SETTINGS);
    },
    reload() {
      const loaded = loadSettings();
      set(loaded);
      applyCSS(loaded);
    },
  };
}

export const settings = createSettingsStore();

// Apply CSS vars on initial load (runs once at module init)
if (typeof document !== 'undefined') {
  applyCSS(loadSettings());
}

export const editorSettings = derived(settings, ($s) => ({
  fontSize: $s.fontSize,
  lineHeight: $s.lineHeight,
  fontFamily: $s.fontText,
  showLineNumbers: $s.showLineNumbers,
  wordWrap: $s.wordWrap,
  hardLineBreaks: $s.hardLineBreaks,
  spellCheck: $s.spellCheck,
  tabSize: $s.tabSize,
  insertSpaces: $s.insertSpaces,
  trimTrailingWhitespace: $s.trimTrailingWhitespace,
  livePreview: $s.livePreview,
  livePreviewMode: $s.livePreviewMode,
  closeBrackets: $s.closeBrackets,
  typewriterEnabled: $s.typewriterEnabled,
  typewriterOffset: $s.typewriterOffset,
  typewriterOnlyKeyboard: $s.typewriterOnlyKeyboard,
  zenModeEnabled: $s.zenModeEnabled,
  zenModeVisibleLines: $s.zenModeVisibleLines,
  zenModeDimOpacity: $s.zenModeDimOpacity,
  vimMode: $s.vimMode,
  vimrcPath: $s.vimrcPath,
  vimShowMode: $s.vimShowMode,
}));

export const generalSettings = derived(settings, ($s) => ({
  autoSave: $s.autoSave,
  autoSaveDelay: $s.autoSaveDelay,
  confirmBeforeDelete: $s.confirmBeforeDelete,
  defaultNoteLocation: $s.defaultNoteLocation,
  dateFormat: $s.dateFormat,
  timeFormat: $s.timeFormat,
  newFileNameTemplate: $s.newFileNameTemplate,
  language: $s.language,
  autoCheckUpdates: $s.autoCheckUpdates,
  startupThresholdMs: $s.startupThresholdMs,
}));

export const appearanceSettings = derived(settings, ($s) => ({
  accentColor: $s.accentColor,
  showStatusBar: $s.showStatusBar,
  compactMode: $s.compactMode,
  activeThemePath: $s.activeThemePath,
  fontInterface: $s.fontInterface,
  fontText: $s.fontText,
  fontMono: $s.fontMono,
}));
