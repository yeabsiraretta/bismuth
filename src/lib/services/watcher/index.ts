/**
 * Watcher service — IPC wrappers for vault filesystem watching.
 * Keeps all Tauri invoke() and listen() calls out of the store layer.
 */

import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';

export interface VaultFileChangedPayload {
  path: string;
  kind: string;
}

export async function startVaultWatcher(vaultPath: string): Promise<void> {
  await invoke('start_vault_watcher', { vaultPath });
}

export async function stopVaultWatcher(): Promise<void> {
  await invoke('stop_vault_watcher');
}

export async function onVaultFileChanged(
  handler: (payload: VaultFileChangedPayload) => void
): Promise<UnlistenFn> {
  return listen<VaultFileChangedPayload>('vault:file-changed', (event) => {
    handler(event.payload);
  });
}
