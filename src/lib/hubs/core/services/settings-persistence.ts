import { SETTINGS_LS_KEY, SETTINGS_STORE_KEY } from '@/constants/storage-keys';
import type { BismuthSettings } from '@/hubs/core/types/settings';
import { DEFAULT_SETTINGS } from '@/hubs/core/types/settings';
import { log } from '@/utils/log/logger';
import { isTauriAvailable } from '@/utils/platform';

const STORE_PATH = 'settings.json';

const settingsLog = log.child('settings-persistence');

// ── Deep merge (ensures new defaults propagate) ──────────────────────────────

function deepMerge(
  defaults: Record<string, unknown>,
  overrides: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...defaults };
  for (const key of Object.keys(overrides)) {
    const val = overrides[key];
    const def = defaults[key];
    if (
      val !== null &&
      val !== undefined &&
      typeof val === 'object' &&
      !Array.isArray(val) &&
      typeof def === 'object' &&
      !Array.isArray(def) &&
      def !== null
    ) {
      result[key] = deepMerge(def as Record<string, unknown>, val as Record<string, unknown>);
    } else if (val !== undefined) {
      result[key] = val;
    }
  }
  return result;
}

function mergeWithDefaults(saved: Record<string, unknown>): BismuthSettings {
  return deepMerge(
    DEFAULT_SETTINGS as unknown as Record<string, unknown>,
    saved
  ) as unknown as BismuthSettings;
}

// ── Tauri backend (LazyStore → settings.json) ────────────────────────────────

let tauriStore: import('@tauri-apps/plugin-store').LazyStore | null = null;

async function getTauriStore() {
  if (!tauriStore) {
    const { LazyStore } = await import('@tauri-apps/plugin-store');
    tauriStore = new LazyStore(STORE_PATH, {
      defaults: { [SETTINGS_STORE_KEY]: DEFAULT_SETTINGS },
      autoSave: 300,
    });
  }
  return tauriStore;
}

async function loadTauri(): Promise<BismuthSettings> {
  const store = await getTauriStore();
  const saved = await store.get<Record<string, unknown>>(SETTINGS_STORE_KEY);
  if (saved) return mergeWithDefaults(saved);
  return { ...DEFAULT_SETTINGS };
}

async function saveTauri(settings: BismuthSettings): Promise<void> {
  const store = await getTauriStore();
  await store.set(SETTINGS_STORE_KEY, settings);
}

async function resetTauri(): Promise<BismuthSettings> {
  const store = await getTauriStore();
  await store.set(SETTINGS_STORE_KEY, DEFAULT_SETTINGS);
  await store.save();
  return { ...DEFAULT_SETTINGS };
}

// ── Browser fallback (localStorage) ──────────────────────────────────────────

function loadBrowser(): BismuthSettings {
  try {
    const json = localStorage.getItem(SETTINGS_LS_KEY);
    if (json) return mergeWithDefaults(JSON.parse(json));
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_SETTINGS };
}

function saveBrowser(settings: BismuthSettings): void {
  try {
    localStorage.setItem(SETTINGS_LS_KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}

function resetBrowser(): BismuthSettings {
  try {
    localStorage.removeItem(SETTINGS_LS_KEY);
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_SETTINGS };
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function loadSettings(): Promise<BismuthSettings> {
  if (isTauriAvailable()) {
    try {
      return await loadTauri();
    } catch (e) {
      settingsLog.warn('Tauri settings load failed, using defaults', { error: String(e) });
      return { ...DEFAULT_SETTINGS };
    }
  }
  settingsLog.debug('Using browser localStorage for settings');
  return loadBrowser();
}

export async function saveSettings(settings: BismuthSettings): Promise<void> {
  if (isTauriAvailable()) {
    try {
      await saveTauri(settings);
    } catch (e) {
      settingsLog.error('Tauri settings save failed', { error: String(e) });
    }
    return;
  }
  saveBrowser(settings);
}

export async function resetSettings(): Promise<BismuthSettings> {
  if (isTauriAvailable()) {
    try {
      return await resetTauri();
    } catch (e) {
      settingsLog.error('Tauri settings reset failed', { error: String(e) });
    }
  }
  return resetBrowser();
}
