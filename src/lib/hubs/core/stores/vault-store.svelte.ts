import { MAX_RECENT_FILES } from '@/constants/layout';
import { RECENT_FILES_KEY, VAULT_INFO_KEY } from '@/constants/storage-keys';
import {
  addWatchCallback,
  clearWatchCallbacks,
  removeWatchCallback,
  startWatching,
  stopWatching,
} from '@/hubs/core/stores/watcher-store.svelte';
import { clearFileCache, hydrateVaultContent } from '@/hubs/editor/services/file-ops';
import { isBrowserVaultPath } from '@/sal/browser-vault-service';
import { gitPull } from '@/sal/git-service';
import { openVault as salOpenVault, scanVault as salScanVault } from '@/sal/vault-service';
import { log } from '@/utils/log/logger';
import { isTauriAvailable } from '@/utils/platform';

export interface VaultInfo {
  name: string;
  rootPath: string;
}

export interface NoteMeta {
  path: string;
  title: string;
  modifiedAt: number;
  createdAt: number;
  size: number;
}

const vaultLog = log.child('vault-store');

let currentVault = $state<VaultInfo | null>(null);
let notes = $state<NoteMeta[]>([]);
let activeNotePath = $state<string | null>(null);
let loading = $state(false);
let recentFiles = $state<string[]>([]);
let storeInitialized = $state(false);

export function getVault(): VaultInfo | null {
  return currentVault;
}

export function isVaultOpen(): boolean {
  return currentVault !== null;
}

export function getNotes(): NoteMeta[] {
  return notes;
}

export function getActiveNotePath(): string | null {
  return activeNotePath;
}

function isLoading(): boolean {
  return loading;
}

function isStoreInitialized(): boolean {
  return storeInitialized;
}

export function getRecentFiles(): string[] {
  return recentFiles;
}

export function setVault(vault: VaultInfo | null) {
  vaultLog.info('setVault', { name: vault?.name ?? null, rootPath: vault?.rootPath ?? null });
  currentVault = vault;
  if (!vault) {
    notes = [];
    activeNotePath = null;
  }
  try {
    if (vault && !isBrowserVaultPath(vault.rootPath)) {
      localStorage.setItem(VAULT_INFO_KEY, JSON.stringify(vault));
    } else {
      localStorage.removeItem(VAULT_INFO_KEY);
    }
  } catch {
    /* ignore */
  }
}

function setNotes(list: NoteMeta[]) {
  notes = list;
}

export function setActiveNote(path: string | null) {
  activeNotePath = path;
  if (path) addRecent(path);
}

function setLoading(state: boolean) {
  loading = state;
}

export function addNote(note: NoteMeta) {
  notes = [...notes, note];
}

function removeNote(path: string) {
  notes = notes.filter((n) => n.path !== path);
  if (activeNotePath === path) activeNotePath = null;
}

function updateNote(path: string, updates: Partial<NoteMeta>) {
  notes = notes.map((n) => (n.path === path ? { ...n, ...updates } : n));
}

function addRecent(path: string) {
  recentFiles = [path, ...recentFiles.filter((p) => p !== path)].slice(0, MAX_RECENT_FILES);
  try {
    localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(recentFiles));
  } catch {
    // ignore
  }
}

let initGeneration = 0;
let scanErrorLogged = false;

export function initVaultStore() {
  vaultLog.info('initVaultStore called');

  try {
    const stored = localStorage.getItem(RECENT_FILES_KEY);
    if (stored) recentFiles = JSON.parse(stored);
  } catch {
    /* ignore */
  }

  try {
    const vaultJson = localStorage.getItem(VAULT_INFO_KEY);
    if (vaultJson) {
      currentVault = JSON.parse(vaultJson);
      vaultLog.info('Restored vault from localStorage', { name: currentVault?.name });
    } else {
      vaultLog.info('No vault found in localStorage');
    }
  } catch {
    /* ignore */
  }

  const gen = ++initGeneration;
  const hydrate = currentVault
    ? salOpenVault(currentVault.rootPath)
        .then(() => vaultLog.debug('Backend vault state re-hydrated'))
        .catch((err) =>
          vaultLog.debug('Backend hydration skipped (expected in browser)', { error: String(err) })
        )
    : Promise.resolve();

  hydrate
    .then(() => loadVaultNotes())
    .then(() => {
      if (gen !== initGeneration) return;
      storeInitialized = true;
      if (currentVault) {
        addWatchCallback(watchRescan);
        startWatching();
        vaultLog.debug('File watcher started');
      }
      if (notes.length > 0) {
        hydrateVaultContent(notes).catch((err) =>
          vaultLog.debug('Content hydration failed', { error: String(err) })
        );
      }
      // Git sync-on-startup
      try {
        const settings = localStorage.getItem('bismuth-settings');
        if (settings) {
          const parsed = JSON.parse(settings);
          if (parsed?.vault?.enableGit && parsed?.vault?.syncOnStartup) {
            vaultLog.info('Git sync-on-startup: pulling latest');
            gitPull()
              .then(() => {
                vaultLog.info('Git pull completed');
                loadVaultNotes();
              })
              .catch((err) => vaultLog.debug('Git pull failed', { error: String(err) }));
          }
        }
      } catch {
        /* settings not available yet */
      }
    })
    .catch((error) => {
      vaultLog.error('Vault store initialization failed', error, {
        hasVault: currentVault !== null,
      });
      storeInitialized = true;
    });
}

export function closeVault() {
  vaultLog.info('closeVault — clearing vault state');
  initGeneration++;
  removeWatchCallback(watchRescan);
  stopWatching();
  clearWatchCallbacks();
  clearFileCache();
  setVault(null);
  storeInitialized = false;
}

export function destroyVaultStore() {
  vaultLog.info('destroyVaultStore called');
  initGeneration++;
  removeWatchCallback(watchRescan);
  stopWatching();
  clearWatchCallbacks();
  storeInitialized = false;
}

export async function rescanVault() {
  return loadVaultNotes();
}

async function watchRescan() {
  await loadVaultNotes();
}

async function loadVaultNotes() {
  if (loading) return;
  loading = true;
  try {
    const scanned = await salScanVault();
    const next = scanned.map((n) => ({
      path: n.path,
      title: n.title,
      modifiedAt: n.modifiedAt,
      createdAt: n.createdAt,
      size: n.size,
    }));
    const changed =
      next.length !== notes.length ||
      next.some((n, i) => n.path !== notes[i].path || n.modifiedAt !== notes[i].modifiedAt);
    if (changed) {
      notes = next;
      vaultLog.debug(`Loaded ${notes.length} notes from vault`);
    }
  } catch (err) {
    if (isTauriAvailable() || currentVault) {
      vaultLog.error('Vault scan failed', err, {
        hasVault: currentVault !== null,
      });
      return;
    }
    if (!scanErrorLogged) {
      vaultLog.debug('Vault scan unavailable (expected in browser dev mode)', {
        error: String(err),
      });
      scanErrorLogged = true;
    }
  } finally {
    loading = false;
  }
}
