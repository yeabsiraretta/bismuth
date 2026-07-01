/**
 * Vault management operations — rename display name, close vault, remove from recents.
 * Security: MUST NOT delete disk files. Only modifies app-level config/state.
 */

import { log } from '@/utils/logger';

const RECENT_VAULTS_KEY = 'bismuth-recent-vaults';

export interface RecentVault {
  name: string;
  path: string;
  lastOpened: string;
}

/** Get list of recent vaults from localStorage. */
export function getRecentVaults(): RecentVault[] {
  try {
    const raw = localStorage.getItem(RECENT_VAULTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Remove a vault from the recent list. Does NOT delete files on disk. */
export function removeFromRecentVaults(path: string): void {
  const recents = getRecentVaults().filter((v) => v.path !== path);
  localStorage.setItem(RECENT_VAULTS_KEY, JSON.stringify(recents));
  log.info('Removed vault from recents');
}

/** Rename a vault's display name in the recent list. */
export function renameVaultDisplayName(path: string, newName: string): void {
  const trimmed = newName.trim();
  if (!trimmed) return;
  const recents = getRecentVaults().map((v) => (v.path === path ? { ...v, name: trimmed } : v));
  localStorage.setItem(RECENT_VAULTS_KEY, JSON.stringify(recents));
  log.info('Renamed vault display name', { newName: trimmed });
}
