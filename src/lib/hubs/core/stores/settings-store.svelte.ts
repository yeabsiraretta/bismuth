import { syncSnippets } from '@/hubs/core/services/css-snippet-service';
import { applyCustomTheme } from '@/hubs/core/services/custom-theme-service';
import {
  loadSettings,
  resetSettings,
  saveSettings,
} from '@/hubs/core/services/settings-persistence';
import type {
  AppearanceSettings,
  BismuthSettings,
  CalendarSettings,
  CanvasSettings,
  ChangelogSettings,
  EditorSettings,
  GamificationSettings,
  GeneralSettings,
  GraphSettings,
  IntegrationSettings,
  KnowledgeSettings,
  LlmSettings,
  MediaSettings,
  PerformanceSettings,
  TypewriterSettings,
  UpdateSettings,
  VaultSettings,
  VersioningSettings,
  VimSettings,
  WindowSettings,
} from '@/hubs/core/types/settings';
import { DEFAULT_SETTINGS } from '@/hubs/core/types/settings';
import { log } from '@/utils/log/logger';
import { isTauriAvailable } from '@/utils/platform';

const settingsLog = log.child('settings-store');

let current: BismuthSettings = $state({ ...DEFAULT_SETTINGS });
let loaded = $state(false);
let loading = false;

export async function initSettings(): Promise<void> {
  if (loaded || loading) return;
  loading = true;
  try {
    current = await loadSettings();
    loaded = true;
    applyCSS(current);
    applyStartupWindow(current);
    settingsLog.info('Settings loaded');
  } catch (e) {
    settingsLog.error('Failed to init settings', { error: String(e) });
    current = { ...DEFAULT_SETTINGS };
    loaded = true;
  } finally {
    loading = false;
  }
}

export function getSettings(): BismuthSettings {
  return current;
}

function isSettingsLoaded(): boolean {
  return loaded;
}

export async function updateSettings(
  updater: (s: BismuthSettings) => BismuthSettings
): Promise<void> {
  current = updater(current);
  applyCSS(current);
  await saveSettings(current).catch((e) =>
    settingsLog.error('Persist failed', { error: String(e) })
  );
}

export async function updateSection<K extends keyof BismuthSettings>(
  section: K,
  patch: Partial<BismuthSettings[K]>
): Promise<void> {
  await updateSettings((s) => ({
    ...s,
    [section]: { ...s[section], ...patch },
  }));
}

export async function resetAllSettings(): Promise<void> {
  current = await resetSettings();
  applyCSS(current);
}

// ─── Derived accessors (reactive via $state) ──────────────────────────────────

export function getGeneral(): GeneralSettings {
  return current.general;
}

function getUpdates(): UpdateSettings {
  return current.updates;
}

function getPerformance(): PerformanceSettings {
  return current.performance;
}

export function getEditor(): EditorSettings {
  return current.editor;
}

export function getTypewriter(): TypewriterSettings {
  return current.typewriter;
}

export function getVim(): VimSettings {
  return current.vim;
}

export function getAppearance(): AppearanceSettings {
  return current.appearance;
}

function getVault(): VaultSettings {
  return current.vault;
}

export function getChangelog(): ChangelogSettings {
  return current.changelog;
}

function getVersioning(): VersioningSettings {
  return current.versioning;
}

export function getLlm(): LlmSettings {
  return current.llm;
}

function getMedia(): MediaSettings {
  return current.media;
}

export function getIntegration(): IntegrationSettings {
  return current.integration;
}

export function getCalendar(): CalendarSettings {
  return current.calendar;
}

function getCanvas(): CanvasSettings {
  return current.canvas;
}

export function getGraph(): GraphSettings {
  return current.graph;
}

export function getKnowledge(): KnowledgeSettings {
  return current.knowledge;
}

function getGamification(): GamificationSettings {
  return current.gamification;
}

function getWindow(): WindowSettings {
  return current.window;
}

// ─── CSS application ──────────────────────────────────────────────────────────

function buildFontStack(family: string, fallback: string): string {
  return `'${family}', ${fallback}`;
}

function applyCSS(s: BismuthSettings): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const { appearance } = s;

  root.style.setProperty(
    '--font-sans',
    buildFontStack(
      appearance.fontInterface,
      '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    )
  );
  root.style.setProperty(
    '--font-text',
    buildFontStack(appearance.fontText, '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif')
  );
  root.style.setProperty(
    '--font-mono',
    buildFontStack(appearance.fontMono, '"Fira Code", "Cascadia Code", monospace')
  );
  root.style.setProperty('--color-accent', appearance.accentColor);
  root.style.setProperty(
    '--color-accent-hover',
    `oklch(from ${appearance.accentColor} calc(l + 0.05) c h)`
  );

  root.style.setProperty('--ui-scale', `${appearance.uiScale / 100}`);
  root.style.fontSize = `${appearance.uiScale}%`;
  root.style.setProperty('--font-size-interface', `${appearance.interfaceFontSize}px`);

  root.classList.toggle('compact-mode', appearance.compactMode);
  root.classList.toggle('translucent', appearance.translucency);
  root.classList.toggle('hide-status-bar', !appearance.showStatusBar);
  root.classList.toggle('hide-scrollbars', !appearance.showScrollbars);

  if (isTauriAvailable()) {
    import('@tauri-apps/api/window')
      .then(({ getCurrentWindow }) => {
        getCurrentWindow()
          .setDecorations(appearance.nativeFrame)
          .catch(() => {});
      })
      .catch(() => {});
  }

  syncSnippets(appearance.cssSnippets).catch((e) =>
    settingsLog.error('Snippet sync failed', { error: String(e) })
  );

  applyCustomTheme(appearance.activeThemePath).catch((e) =>
    settingsLog.error('Custom theme failed', { error: String(e) })
  );
}

function applyStartupWindow(s: BismuthSettings): void {
  if (!isTauriAvailable()) return;

  const { window: win } = s;

  if (win.startFullscreen) {
    import('@tauri-apps/api/window')
      .then(({ getCurrentWindow }) => {
        getCurrentWindow()
          .setFullscreen(true)
          .then(() => {
            settingsLog.info('Applied startup fullscreen');
          })
          .catch((e) => {
            settingsLog.error('Failed to set fullscreen', { error: String(e) });
          });
      })
      .catch(() => {});
  }
}
