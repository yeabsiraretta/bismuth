/**
 * NAS store — reactive state for WebDAV vault sync.
 * Holds connection config, sync status, pending count, and conflict list.
 *
 * IMPORTANT: This store MUST NOT import @tauri-apps/api/core directly.
 * All IPC calls are delegated to services/nas.ts.
 */

import { writable, derived, get } from 'svelte/store';
import { log } from '@/utils/logger';
import type { NasConfig, SyncStatus, ConflictRecord, SyncSummary } from '../types/nas';
import { isNasConfig } from '../types/nas';
import * as nasService from '../services/nas';

// --- Stores ---

export const nasConfig = writable<NasConfig | null>(null);
export const syncStatus = writable<SyncStatus>('disabled');
export const lastSyncAt = writable<string | null>(null);
export const pendingCount = writable<number>(0);
export const conflicts = writable<ConflictRecord[]>([]);
export const lastSyncResult = writable<SyncSummary | null>(null);

/** Non-null when a size-warning event is awaiting user confirmation. */
export const pendingSizeWarning = writable<{ path: string; sizeMb: number } | null>(null);

/** Derived: whether NAS is configured. */
export const nasEnabled = derived(nasConfig, ($cfg) => $cfg !== null);

// --- Actions ---

/**
 * Load NAS config from `.bismuth/nas-config.json`.
 * If the file is absent or invalid, store remains 'disabled' — no error thrown.
 */
export async function loadNasConfig(vaultPath: string): Promise<void> {
  try {
    const raw = await nasService.readNasConfig(vaultPath);
    if (raw !== null && isNasConfig(raw)) {
      nasConfig.set(raw);
      syncStatus.set('disconnected');
      log.info('nasStore: config loaded', { url: raw.url });
    } else {
      nasConfig.set(null);
      syncStatus.set('disabled');
    }
  } catch (err) {
    // Config absent — leave as disabled without throwing
    log.debug('nasStore: no NAS config found, staying disabled', { error: String(err) });
    nasConfig.set(null);
    syncStatus.set('disabled');
  }
}

/**
 * Connect to a WebDAV server.
 * Stores config (without password) and transitions status to 'disconnected' on success.
 * Password is passed directly and never stored in this store.
 */
export async function connectNas(url: string, username: string, password: string): Promise<void> {
  try {
    const result = await nasService.connectWebDav(url, username, password);
    if (result.success) {
      const cfg: NasConfig = {
        url,
        username,
        lastSync: null,
        offlineModeEnabled: false,
      };
      nasConfig.set(cfg);
      syncStatus.set('disconnected');
      log.info('nasStore: connected to NAS', { url });
    } else {
      throw new Error(result.error ?? 'Connection failed');
    }
  } catch (err) {
    log.error('nasStore: connectNas failed', err as Error);
    throw err;
  }
}

/**
 * Trigger a full vault sync.
 * Transitions status through syncing → synced (or conflict/pending on failure).
 */
export async function syncNow(): Promise<void> {
  const config = get(nasConfig);
  if (!config) {
    log.warn('nasStore: syncNow called but no NAS config');
    return;
  }

  syncStatus.set('syncing');
  try {
    const result = await nasService.syncVault();
    lastSyncResult.set(result);
    lastSyncAt.set(new Date().toISOString());
    pendingCount.set(0);

    if (result.conflicts > 0) {
      syncStatus.set('conflict');
    } else {
      syncStatus.set('synced');
    }

    // Update lastSync in config
    nasConfig.update((c) => (c ? { ...c, lastSync: new Date().toISOString() } : c));

    log.info('nasStore: sync complete', result as unknown as Record<string, unknown>);
  } catch (err) {
    const config = get(nasConfig);
    if (config?.offlineModeEnabled) {
      syncStatus.set('pending');
      log.warn('nasStore: sync failed, offline mode active — transitioning to pending');
    } else {
      syncStatus.set('disconnected');
      log.error('nasStore: sync failed', err as Error);
    }
    throw err;
  }
}

/**
 * Resolve a single conflict by choosing the local or remote version.
 * Removes the conflict from the list after applying.
 */
export async function resolveConflict(
  filePath: string,
  resolution: 'local' | 'remote'
): Promise<void> {
  try {
    await nasService.applyChange(resolution === 'local' ? 'put' : 'get', filePath);
    conflicts.update((list) => list.filter((c) => c.filePath !== filePath));

    // Transition away from 'conflict' if no more conflicts remain
    if (get(conflicts).length === 0) {
      syncStatus.set('synced');
    }
    log.info('nasStore: conflict resolved', { filePath, resolution });
  } catch (err) {
    log.error('nasStore: resolveConflict failed', err as Error);
    throw err;
  }
}

/**
 * Disconnect from NAS: clears config and resets all state.
 * The command-side deletion of nas-config.json and keychain entry is handled by the backend.
 */
export async function disconnectNas(): Promise<void> {
  nasConfig.set(null);
  syncStatus.set('disabled');
  lastSyncAt.set(null);
  pendingCount.set(0);
  conflicts.set([]);
  lastSyncResult.set(null);
  pendingSizeWarning.set(null);
  log.info('nasStore: disconnected');
}

/**
 * Update the NAS config (e.g., toggle offlineModeEnabled).
 * Writes the updated config to disk.
 */
export async function updateConfig(vaultPath: string, updates: Partial<NasConfig>): Promise<void> {
  const current = get(nasConfig);
  if (!current) return;
  const updated = { ...current, ...updates };
  nasConfig.set(updated);
  try {
    await nasService.writeNasConfig(vaultPath, updated);
    log.debug('nasStore: config updated', updates);
  } catch (err) {
    log.error('nasStore: failed to write updated config', err as Error);
    throw err;
  }
}
