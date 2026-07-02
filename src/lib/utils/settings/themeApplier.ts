import { log } from '@/utils/logger';
import { THEME_TOKEN_ALLOWLIST, isThemeValueSafe } from '@/utils/settings/themeValidator';

/**
 * Applies theme token values to CSS custom properties on the document root.
 * Validates each key against the allowlist and each value with the safety check
 * before calling setProperty. Skips invalid entries with a warning.
 * (SEC-037-001 enforcement)
 */
export function applyThemeTokens(tokens: Record<string, string>): void {
  const root = document.documentElement;
  let applied = 0;
  let skipped = 0;

  for (const [key, value] of Object.entries(tokens)) {
    if (!THEME_TOKEN_ALLOWLIST.has(key)) {
      log.warn('applyThemeTokens: key not in allowlist, skipped', { key });
      skipped++;
      continue;
    }
    if (!isThemeValueSafe(value)) {
      log.warn('applyThemeTokens: unsafe value rejected', { key });
      skipped++;
      continue;
    }
    root.style.setProperty(key, value);
    applied++;
  }

  log.info('Theme tokens applied', { applied, skipped });
}

/**
 * Removes previously applied theme token overrides, reverting to CSS defaults.
 */
export function clearThemeTokens(tokens: Record<string, string>): void {
  const root = document.documentElement;
  for (const key of Object.keys(tokens)) {
    if (THEME_TOKEN_ALLOWLIST.has(key)) {
      root.style.removeProperty(key);
    }
  }
}
