import { RECENT_VAULTS_KEY } from '@/constants/storage-keys';
import { getVault, initVaultStore, rescanVault, setVault } from '@/hubs/core/stores/vault-store.svelte';
import { invokeCommand } from '@/ipc/invoke';
import {
  createBrowserVault,
  isBrowserVaultPath,
  openBrowserVault,
  pickBrowserVaultDirectory,
  scanBrowserVault,
} from '@/sal/browser-vault-service';
import { log } from '@/utils/log/logger';
import { isTauriAvailable } from '@/utils/platform';
import { goto } from '$app/navigation';

const salLog = log.child('sal:vault');
const OPEN_VAULT_PROCESS = 'vault-open';
const CREATE_VAULT_PROCESS = 'vault-create';

function vaultProcessContext(
  process: string,
  step: string,
  context?: Record<string, unknown>
): Record<string, unknown> {
  return { process, step, ...context };
}

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
    salLog.info('openVault (browser)', vaultProcessContext(OPEN_VAULT_PROCESS, 'browser-open', { path }));
    return openBrowserVault(path);
  }
  salLog.info('openVault (IPC)', vaultProcessContext(OPEN_VAULT_PROCESS, 'ipc-dispatch', { path }));
  return invokeCommand<VaultResponse>('open_vault', { path });
}

export function createVault(path: string, name: string): Promise<VaultResponse> {
  if (!isTauriAvailable()) {
    salLog.info(
      'createVault (browser)',
      vaultProcessContext(CREATE_VAULT_PROCESS, 'browser-create', { name, path })
    );
    return createBrowserVault(path, name);
  }
  salLog.info(
    'createVault (IPC)',
    vaultProcessContext(CREATE_VAULT_PROCESS, 'ipc-dispatch', { name, path })
  );
  return invokeCommand<VaultResponse>('create_vault', { path, name });
}

export function scanVault(): Promise<NoteMetaResponse[]> {
  if (!isTauriAvailable()) {
    const rootPath = getVault()?.rootPath;
    if (!rootPath || !isBrowserVaultPath(rootPath)) return Promise.resolve([]);
    return scanBrowserVault(rootPath);
  }
  return invokeCommand<NoteMetaResponse[]>('scan_vault');
}

export async function finalizeVaultOpen(vault: VaultResponse): Promise<void> {
  salLog.info(
    'Applying vault-open state',
    vaultProcessContext(OPEN_VAULT_PROCESS, 'state-update', {
      name: vault.name,
      rootPath: vault.rootPath,
    })
  );
  setVault({ name: vault.name, rootPath: vault.rootPath });
  saveRecentVault(vault.name, vault.rootPath);
  salLog.info(
    'Initializing vault store',
    vaultProcessContext(OPEN_VAULT_PROCESS, 'store-init', {
      rootPath: vault.rootPath,
    })
  );
  initVaultStore();
  await rescanVault();
  salLog.info(
    'Vault rescan completed',
    vaultProcessContext(OPEN_VAULT_PROCESS, 'scan-complete', {
      rootPath: vault.rootPath,
    })
  );
  await goto('/');
  salLog.info(
    'Navigation after vault-open completed',
    vaultProcessContext(OPEN_VAULT_PROCESS, 'done', {
      rootPath: vault.rootPath,
    })
  );
}

/**
 * Show a folder picker, open the selected vault, update the store,
 * persist to recent vaults, and navigate to /.
 * Reusable from both the welcome page and the app layout (tray/menu events).
 * Returns true if a vault was opened, false if the user cancelled.
 */
export async function openVaultDialog(): Promise<boolean> {
  salLog.info('Starting openVaultDialog', vaultProcessContext(OPEN_VAULT_PROCESS, 'start'));
  let path: string | null = null;

  if (!isTauriAvailable()) {
    try {
      const selection = await pickBrowserVaultDirectory();
      if (!selection) return false;
      path = selection.rootPath;
      salLog.info(
        'Browser folder picker returned a vault',
        vaultProcessContext(OPEN_VAULT_PROCESS, 'dialog-selected-browser', path ? selection : {})
      );
    } catch (e) {
      salLog.error(
        'Browser folder dialog failed',
        e,
        vaultProcessContext(OPEN_VAULT_PROCESS, 'dialog-error-browser')
      );
      return false;
    }
  } else {
    try {
      salLog.info(
        'Opening native folder dialog',
        vaultProcessContext(OPEN_VAULT_PROCESS, 'dialog-open')
      );
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selected = await open({ directory: true, multiple: false, title: 'Open Vault' });
      if (!selected) {
        salLog.info(
          'Open vault dialog cancelled by user',
          vaultProcessContext(OPEN_VAULT_PROCESS, 'dialog-cancel')
        );
        return false;
      }
      path = Array.isArray(selected) ? selected[0] : selected;
      salLog.info(
        'Folder dialog returned a path',
        vaultProcessContext(OPEN_VAULT_PROCESS, 'dialog-selected', { path })
      );
    } catch (e) {
      salLog.error(
        'Folder dialog failed',
        e,
        vaultProcessContext(OPEN_VAULT_PROCESS, 'dialog-error')
      );
      return false;
    }
  }

  if (!path) {
    salLog.warn(
      'Open vault path resolved to empty',
      vaultProcessContext(OPEN_VAULT_PROCESS, 'resolve-path-empty')
    );
    return false;
  }

  try {
    salLog.info(
      'Opening vault path',
      vaultProcessContext(OPEN_VAULT_PROCESS, 'open-vault', { path })
    );
    const vault = await openVault(path);
    salLog.info(
      'Vault open returned successfully',
      vaultProcessContext(OPEN_VAULT_PROCESS, 'open-vault-ok', {
        name: vault.name,
        rootPath: vault.rootPath,
      })
    );
    await finalizeVaultOpen(vault);
    return true;
  } catch (error) {
    salLog.error(
      'Open vault dialog flow failed',
      error,
      vaultProcessContext(OPEN_VAULT_PROCESS, 'flow-error', { path })
    );
    return false;
  }
}

function saveRecentVault(name: string, path: string) {
  if (isBrowserVaultPath(path)) return;
  try {
    const stored = localStorage.getItem(RECENT_VAULTS_KEY);
    let recent: { name: string; path: string; openedAt: number }[] = [];
    if (stored) recent = JSON.parse(stored);
    const entry = { name, path, openedAt: Date.now() };
    recent = [entry, ...recent.filter((v) => v.path !== path)].slice(0, 5);
    localStorage.setItem(RECENT_VAULTS_KEY, JSON.stringify(recent));
  } catch (error) {
    salLog.warn(
      'Failed to persist recent vault entry',
      vaultProcessContext(OPEN_VAULT_PROCESS, 'recent-persist-failed', { error: String(error) })
    );
  }
}
