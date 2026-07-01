/**
 * Public API barrel for the settings feature module.
 *
 * External consumers MUST import only from this barrel:
 *   import { settings, BismuthSettings } from '@/features/settings'
 *
 * Internal paths (stores/, services/, types/) MUST NOT be imported directly
 * from outside this module.
 */

// ─── Types ────────────────────────────────────────────────────────────────────
export type { BismuthSettings } from './types/settings.types';
export { DEFAULT_SETTINGS } from './types/settings.types';

// ─── Store + derived slices ───────────────────────────────────────────────────
export {
  settings,
  editorSettings,
  generalSettings,
  appearanceSettings,
} from './stores/settingsStore';

// ─── Persistence service (for advanced consumers) ─────────────────────────────
export { loadSettings, saveSettings, clearSettings } from './services/settingsPersistence';
