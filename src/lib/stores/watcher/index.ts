/**
 * Vault file-system watcher store.
 *
 * Reactive Svelte store wrapping the watcher service.
 * All Tauri IPC is in services/watcher — this is pure store state.
 */

import { writable, derived } from 'svelte/store';
import { startVaultWatcher, stopVaultWatcher, onVaultFileChanged } from '@/services/watcher';
import type { VaultFileChangedPayload } from '@/services/watcher';
import { log } from '@/utils/logger';

export type WatcherState = 'idle' | 'active' | 'error';

interface WatcherStore {
  state: WatcherState;
  vaultPath: string | null;
  error: string | null;
}

const _store = writable<WatcherStore>({ state: 'idle', vaultPath: null, error: null });

export const watcherStatus = derived(_store, ($s) => $s.state);
export const watcherVaultPath = derived(_store, ($s) => $s.vaultPath);

let _unlisten: (() => void) | null = null;

/** Start watching a vault directory for file changes. */
export async function startWatcher(
  vaultPath: string,
  onChanged?: (payload: VaultFileChangedPayload) => void
): Promise<void> {
  await stopWatcher();
  try {
    await startVaultWatcher(vaultPath);
    _unlisten = await onVaultFileChanged((payload) => {
      log.debug('Vault file changed', payload as unknown as Record<string, unknown>);
      onChanged?.(payload);
    });
    _store.update((s) => ({ ...s, state: 'active', vaultPath, error: null }));
    log.info('Vault watcher started', { vaultPath });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    _store.update((s) => ({ ...s, state: 'error', error: msg }));
    log.warn('Vault watcher failed to start', { vaultPath, err: msg });
  }
}

/** Stop watching and clean up the event listener. */
export async function stopWatcher(): Promise<void> {
  _unlisten?.();
  _unlisten = null;
  try {
    await stopVaultWatcher();
  } catch {
    // Backend may not have a watcher running — non-fatal
  }
  _store.update((s) => ({ ...s, state: 'idle', vaultPath: null, error: null }));
}
