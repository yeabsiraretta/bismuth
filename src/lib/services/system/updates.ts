import { invoke } from '@tauri-apps/api/core';
import { log } from '@/utils/logger';
import { get } from 'svelte/store';
import { settings } from '@/features/settings';

export interface AppVersionInfo {
  currentVersion: string;
  checkedAt: number;
}

const GITHUB_RELEASES_BASE = 'https://github.com/bismuth-pkm/bismuth/releases/download';

const UPDATE_ENDPOINTS: Record<string, string> = {
  alpha: `${GITHUB_RELEASES_BASE}/alpha-latest/latest.json`,
  beta: `${GITHUB_RELEASES_BASE}/beta-latest/latest.json`,
  release: `${GITHUB_RELEASES_BASE}/release-latest/latest.json`,
};

/**
 * Returns the updater endpoint URL for the given channel.
 * Currently stub — real server not yet deployed; returns the channel URL string.
 * Unknown values fall back to the release endpoint.
 */
export function buildUpdateEndpoint(channel: 'alpha' | 'beta' | 'release' | string): string {
  return UPDATE_ENDPOINTS[channel] ?? UPDATE_ENDPOINTS['release'];
}

/**
 * Calls the Rust set_app_locale stub to log the locale code.
 * Part of the i18n call chain required by T065. Actual translation wiring is future scope.
 */
export async function setAppLocale(locale: string): Promise<void> {
  try {
    await invoke('set_app_locale', { locale });
    log.debug('App locale set', { locale });
  } catch (error) {
    log.warn('set_app_locale failed (non-blocking)', { locale, error: String(error) });
  }
}

/**
 * Returns the current app version from the Tauri package info.
 * Does not make any network calls.
 */
export async function checkAppVersion(): Promise<AppVersionInfo & { channel: string }> {
  const channel = get(settings).updateChannel ?? 'release';
  const endpoint = buildUpdateEndpoint(channel);
  log.debug('checkAppVersion', { channel, endpoint });
  try {
    const result = await invoke<{ current_version: string; checked_at: number }>('check_app_version');
    return { currentVersion: result.current_version, checkedAt: result.checked_at, channel };
  } catch (error) {
    log.error('Failed to check app version', error as Error);
    throw error;
  }
}
