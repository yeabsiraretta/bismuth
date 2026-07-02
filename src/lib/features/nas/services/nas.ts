/**
 * NAS service — all invoke() calls for NAS Tauri commands are confined to this file.
 * Components and stores must never call invoke() directly for NAS operations.
 *
 * All passwords are handled via keychain (set_secret/get_secret from spec 037).
 * This service never touches localStorage for credentials.
 */

import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { log } from '@/utils/logger';
import type { NasConnectionResult, RemoteEntryDto, SyncSummary } from '../types/nas';

/** Unsubscribe function returned by event listeners. */
export type Unsubscribe = () => void;

// Re-export SyncSummary alias used by store
export type { SyncSummary } from '../types/nas';

/** Connect to a WebDAV server and store credentials in keychain. */
export async function connectWebDav(
  url: string,
  username: string,
  password: string
): Promise<NasConnectionResult> {
  try {
    const vaultRoot = await getVaultRoot();
    return await invoke<NasConnectionResult>('connect_webdav', {
      url,
      username,
      password,
      vaultPath: vaultRoot,
    });
  } catch (err) {
    log.error('nas.service: connect_webdav failed', err as Error);
    throw new Error(`Failed to connect to NAS: ${err}`);
  }
}

/** List files in a remote WebDAV directory. */
export async function listRemote(remotePath: string): Promise<RemoteEntryDto[]> {
  try {
    const vaultRoot = await getVaultRoot();
    return await invoke<RemoteEntryDto[]>('list_remote', {
      vaultPath: vaultRoot,
      remotePath,
    });
  } catch (err) {
    log.error('nas.service: list_remote failed', err as Error);
    throw new Error(`Failed to list remote files: ${err}`);
  }
}

/** Trigger a full vault sync (journal replay + diff + apply). */
export async function syncVault(): Promise<SyncSummary> {
  try {
    const vaultRoot = await getVaultRoot();
    return await invoke<SyncSummary>('sync_vault', { vaultPath: vaultRoot });
  } catch (err) {
    log.error('nas.service: sync_vault failed', err as Error);
    throw new Error(`Sync failed: ${err}`);
  }
}

/** Apply a single change operation (for manual sync or file watcher integration). */
export async function applyChange(op: string, path: string, destPath?: string): Promise<void> {
  try {
    const vaultRoot = await getVaultRoot();
    await invoke<void>('nas_apply_change', {
      vaultPath: vaultRoot,
      op,
      path,
      destPath: destPath ?? null,
    });
  } catch (err) {
    log.error('nas.service: nas_apply_change failed', err as Error);
    throw new Error(`Failed to apply change: ${err}`);
  }
}

/** Cancel the currently running sync operation. */
export async function cancelSync(): Promise<void> {
  try {
    const vaultRoot = await getVaultRoot();
    await invoke<void>('nas_cancel_sync', { vaultPath: vaultRoot });
  } catch (err) {
    log.error('nas.service: nas_cancel_sync failed', err as Error);
  }
}

/**
 * Subscribe to sync progress events.
 * Returns an unsubscribe function.
 */
export function onSyncProgress(cb: (pct: number, filesRemaining: number) => void): Unsubscribe {
  let unlisten: Unsubscribe = () => undefined;
  listen<{ percent: number; files_remaining: number }>('nas://sync-progress', (evt) => {
    cb(evt.payload.percent, evt.payload.files_remaining);
  })
    .then((fn) => {
      unlisten = fn;
    })
    .catch((err) => {
      log.warn('nas.service: failed to subscribe to sync-progress', { error: String(err) });
    });
  return () => unlisten();
}

/**
 * Subscribe to size warning events (file > 500 MB).
 * Returns an unsubscribe function.
 */
export function onSizeWarning(cb: (path: string, sizeMb: number) => void): Unsubscribe {
  let unlisten: Unsubscribe = () => undefined;
  listen<{ path: string; size_mb: number }>('nas://size-warning', (evt) => {
    cb(evt.payload.path, evt.payload.size_mb);
  })
    .then((fn) => {
      unlisten = fn;
    })
    .catch((err) => {
      log.warn('nas.service: failed to subscribe to size-warning', { error: String(err) });
    });
  return () => unlisten();
}

/** Read NAS config JSON from vault. Returns null if not found. */
export async function readNasConfig(vaultRoot: string): Promise<unknown> {
  try {
    return await invoke<unknown>('read_nas_config', { vaultRoot });
  } catch (err) {
    log.debug('nas.service: read_nas_config — config absent or error', { error: String(err) });
    return null;
  }
}

/** Write NAS config (no password field). */
export async function writeNasConfig(vaultRoot: string, config: unknown): Promise<void> {
  await invoke<void>('write_nas_config', { vaultRoot, config });
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Get the current vault root path from vault store (avoids circular imports). */
async function getVaultRoot(): Promise<string> {
  // Dynamic import to avoid circular dependency with vault store
  const { currentVault } = await import('@/stores/vault/vault');
  const { get } = await import('svelte/store');
  const vault = get(currentVault);
  if (!vault?.root_path) throw new Error('No vault is currently open');
  return vault.root_path;
}
