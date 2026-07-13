import { RECENT_VAULTS_KEY } from '@/constants/storage-keys';
import { initVaultStore, rescanVault, setVault } from '@/hubs/core/stores/vault-store.svelte';
import { invokeCommand } from '@/ipc/invoke';
import { log } from '@/utils/log/logger';
import { isTauriAvailable } from '@/utils/platform';
import { goto } from '$app/navigation';

const salLog = log.child('sal:vault');

export interface VaultResponse {
  name: string;
  rootPath: string;
}

export interface NoteMetaResponse {
  path: string;
  title: string;
  modifiedAt: number;
  createdAt: number;
  size: number;
}

export function openVault(path: string): Promise<VaultResponse> {
  if (!isTauriAvailable()) {
    const name = path.split('/').pop() || 'My Vault';
    salLog.info('openVault (browser fallback)', { name, path });
    return Promise.resolve({ name, rootPath: path });
  }
  salLog.info('openVault (IPC)', { path });
  return invokeCommand<VaultResponse>('open_vault', { path });
}

export function createVault(path: string, name: string): Promise<VaultResponse> {
  if (!isTauriAvailable()) {
    salLog.info('createVault (browser fallback)', { name, path });
    return Promise.resolve({ name, rootPath: path });
  }
  salLog.info('createVault (IPC)', { name, path });
  return invokeCommand<VaultResponse>('create_vault', { path, name });
}

export function scanVault(): Promise<NoteMetaResponse[]> {
  if (!isTauriAvailable()) return Promise.resolve([]);
  return invokeCommand<NoteMetaResponse[]>('scan_vault');
}

/**
 * Show a folder picker, open the selected vault, update the store,
 * persist to recent vaults, and navigate to /.
 * Reusable from both the welcome page and the app layout (tray/menu events).
 * Returns true if a vault was opened, false if the user cancelled.
 */
export async function openVaultDialog(): Promise<boolean> {
  let path: string | null = null;

  if (!isTauriAvailable()) {
    path = '/demo/My Vault';
  } else {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selected = await open({ directory: true, multiple: false, title: 'Open Vault' });
      if (!selected) return false;
      path = Array.isArray(selected) ? selected[0] : selected;
    } catch (e) {
      salLog.error('Folder dialog failed', e);
      return false;
    }
  }

  if (!path) return false;

  const vault = await openVault(path);
  setVault({ name: vault.name, rootPath: vault.rootPath });
  saveRecentVault(vault.name, vault.rootPath);
  initVaultStore();
  await rescanVault();
  await goto('/');
  return true;
}

function saveRecentVault(name: string, path: string) {
  try {
    const stored = localStorage.getItem(RECENT_VAULTS_KEY);
    let recent: { name: string; path: string; openedAt: number }[] = [];
    if (stored) recent = JSON.parse(stored);
    const entry = { name, path, openedAt: Date.now() };
    recent = [entry, ...recent.filter((v) => v.path !== path)].slice(0, 5);
    localStorage.setItem(RECENT_VAULTS_KEY, JSON.stringify(recent));
  } catch {
    /* ignore */
  }
}
