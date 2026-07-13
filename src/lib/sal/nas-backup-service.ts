/**
 * NAS Backup Service — copies the entire vault to a NAS/network path.
 *
 * Creates timestamped snapshot folders at `<nasPath>/bismuth-backups/<vaultName>/`.
 * Each snapshot is a full copy of the vault directory. Older snapshots are
 * pruned based on `nasMaxBackups`. Backup/restore is filesystem-based,
 * using Tauri IPC commands. All operations are no-ops in the browser.
 */

import { NAS_BACKUP_META_KEY } from '@/constants/storage-keys';
import { getIntegration, updateSection } from '@/hubs/core/stores/settings-store.svelte';
import { getVault } from '@/hubs/core/stores/vault-store.svelte';
import { invokeCommand } from '@/ipc/invoke';
import { log } from '@/utils/log/logger';
import { isTauriAvailable } from '@/utils/platform';

const nasLog = log.child('nas-backup');

// ── Types ────────────────────────────────────────────────────────────────────

export interface NasBackupMeta {
  id: string;
  vaultName: string;
  nasPath: string;
  snapshotPath: string;
  createdAt: number;
  sizeBytes: number;
  noteCount: number;
}

export interface NasBackupResult {
  success: boolean;
  meta?: NasBackupMeta;
  error?: string;
}

export interface NasRestoreResult {
  success: boolean;
  noteCount?: number;
  error?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function snapshotId(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

// ── Persisted backup metadata ────────────────────────────────────────────────

function loadBackupMetas(): NasBackupMeta[] {
  try {
    const raw = localStorage.getItem(NAS_BACKUP_META_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveBackupMetas(metas: NasBackupMeta[]): void {
  try {
    localStorage.setItem(NAS_BACKUP_META_KEY, JSON.stringify(metas));
  } catch {
    /* ignore */
  }
}

function getBackupHistory(): NasBackupMeta[] {
  return loadBackupMetas();
}

// ── Core operations ──────────────────────────────────────────────────────────

/**
 * Create a full vault backup to the configured NAS path.
 * The vault is copied to `<nasPath>/bismuth-backups/<vaultName>/<timestamp>/`.
 */
export async function createNasBackup(): Promise<NasBackupResult> {
  const integration = getIntegration();
  if (!integration.nasEnabled || !integration.nasPath) {
    return { success: false, error: 'NAS backup is not configured' };
  }

  const vault = getVault();
  if (!vault) {
    return { success: false, error: 'No vault is open' };
  }

  if (!isTauriAvailable()) {
    nasLog.info('NAS backup skipped (browser mode)');
    return { success: false, error: 'NAS backup requires the desktop app' };
  }

  const id = snapshotId();
  const backupRoot = `${integration.nasPath}/bismuth-backups/${vault.name}`;
  const snapshotPath = `${backupRoot}/${id}`;

  try {
    nasLog.info('Starting NAS backup', { snapshotPath });

    const result = await invokeCommand<{ sizeBytes: number; noteCount: number }>(
      'nas_backup_create',
      { vaultRoot: vault.rootPath, targetPath: snapshotPath }
    );

    const meta: NasBackupMeta = {
      id,
      vaultName: vault.name,
      nasPath: integration.nasPath,
      snapshotPath,
      createdAt: Date.now(),
      sizeBytes: result.sizeBytes,
      noteCount: result.noteCount,
    };

    // Persist metadata
    const metas = loadBackupMetas();
    metas.unshift(meta);
    saveBackupMetas(metas);

    // Update last backup timestamp in settings
    updateSection('integration', { nasLastBackup: new Date().toISOString() });

    // Prune old snapshots
    await pruneOldBackups(backupRoot, integration.nasMaxBackups);

    nasLog.info('NAS backup complete', {
      id,
      noteCount: result.noteCount,
      sizeBytes: result.sizeBytes,
    });
    return { success: true, meta };
  } catch (err) {
    const msg = String(err);
    nasLog.error('NAS backup failed', { error: msg });
    return { success: false, error: msg };
  }
}

/**
 * Restore a vault from a NAS backup snapshot.
 * Copies the snapshot contents back to the vault root directory.
 */
export async function restoreNasBackup(snapshotPath: string): Promise<NasRestoreResult> {
  const vault = getVault();
  if (!vault) {
    return { success: false, error: 'No vault is open' };
  }

  if (!isTauriAvailable()) {
    return { success: false, error: 'NAS restore requires the desktop app' };
  }

  try {
    nasLog.info('Starting NAS restore', { snapshotPath, vaultRoot: vault.rootPath });

    const result = await invokeCommand<{ noteCount: number }>('nas_backup_restore', {
      sourcePath: snapshotPath,
      vaultRoot: vault.rootPath,
    });

    nasLog.info('NAS restore complete', { noteCount: result.noteCount });
    return { success: true, noteCount: result.noteCount };
  } catch (err) {
    const msg = String(err);
    nasLog.error('NAS restore failed', { error: msg });
    return { success: false, error: msg };
  }
}

/**
 * List backup snapshots on the NAS for the current vault.
 */
export async function listNasBackups(): Promise<NasBackupMeta[]> {
  const integration = getIntegration();
  if (!integration.nasEnabled || !integration.nasPath) return [];

  const vault = getVault();
  if (!vault) return [];

  if (!isTauriAvailable()) return loadBackupMetas();

  const backupRoot = `${integration.nasPath}/bismuth-backups/${vault.name}`;

  try {
    const snapshots = await invokeCommand<
      { id: string; createdAt: number; sizeBytes: number; noteCount: number }[]
    >('nas_backup_list', { backupRoot });

    return snapshots.map((s) => ({
      id: s.id,
      vaultName: vault.name,
      nasPath: integration.nasPath,
      snapshotPath: `${backupRoot}/${s.id}`,
      createdAt: s.createdAt,
      sizeBytes: s.sizeBytes,
      noteCount: s.noteCount,
    }));
  } catch (err) {
    nasLog.warn('Failed to list NAS backups, falling back to local metadata', {
      error: String(err),
    });
    return loadBackupMetas();
  }
}

/**
 * Delete a specific NAS backup snapshot.
 */
export async function deleteNasBackup(snapshotPath: string): Promise<void> {
  if (!isTauriAvailable()) return;

  try {
    await invokeCommand<void>('nas_backup_delete', { snapshotPath });

    // Remove from local metadata
    const metas = loadBackupMetas();
    saveBackupMetas(metas.filter((m) => m.snapshotPath !== snapshotPath));

    nasLog.info('Deleted NAS backup', { snapshotPath });
  } catch (err) {
    nasLog.error('Failed to delete NAS backup', { error: String(err) });
    throw err;
  }
}

/**
 * Prune old backup snapshots, keeping only `maxKeep` most recent.
 */
async function pruneOldBackups(backupRoot: string, maxKeep: number): Promise<void> {
  try {
    await invokeCommand<void>('nas_backup_prune', { backupRoot, maxKeep });

    // Prune local metadata too
    const metas = loadBackupMetas();
    if (metas.length > maxKeep) {
      saveBackupMetas(metas.slice(0, maxKeep));
    }
  } catch (err) {
    nasLog.warn('Failed to prune old NAS backups', { error: String(err) });
  }
}

// ── Scheduled backup check ───────────────────────────────────────────────────

/**
 * Check if a backup is due based on the configured frequency.
 * Called on app startup to trigger auto-backup when appropriate.
 */
function isBackupDue(): boolean {
  const integration = getIntegration();
  if (!integration.nasEnabled || !integration.nasPath) return false;

  const freq = integration.nasBackupFrequency;
  if (freq === 'manual') return false;
  if (freq === 'on-open') return true;

  const lastBackup = integration.nasLastBackup;
  if (!lastBackup) return true;

  const lastDate = new Date(lastBackup);
  const now = new Date();
  const diffMs = now.getTime() - lastDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (freq === 'daily' && diffDays >= 1) return true;
  if (freq === 'weekly' && diffDays >= 7) return true;

  return false;
}

/**
 * Run auto-backup if one is due. Fire-and-forget.
 */
export async function runScheduledBackup(): Promise<void> {
  if (!isBackupDue()) return;

  nasLog.info('Scheduled NAS backup triggered');
  const result = await createNasBackup();
  if (!result.success) {
    nasLog.warn('Scheduled NAS backup failed', { error: result.error });
  }
}

/**
 * Browse for a NAS directory using the native folder picker.
 * Returns the selected path or null if cancelled.
 */
export async function browseNasPath(): Promise<string | null> {
  if (!isTauriAvailable()) {
    return '/mnt/nas/bismuth';
  }

  try {
    const { open } = await import('@tauri-apps/plugin-dialog');
    const selected = await open({
      directory: true,
      multiple: false,
      title: 'Select NAS Backup Location',
    });
    if (!selected) return null;
    return Array.isArray(selected) ? selected[0] : selected;
  } catch (err) {
    nasLog.error('NAS folder dialog failed', { error: String(err) });
    return null;
  }
}
