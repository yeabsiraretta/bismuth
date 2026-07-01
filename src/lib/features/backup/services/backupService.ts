/** Frontend backup service — IPC wrappers for Rust backup commands. */

import { invoke } from '@tauri-apps/api/core';
import { log } from '@/utils/logger';
import type { BackupConfig, BackupInfo } from '../types';

export async function createBackup(
  vaultRoot: string,
  customName?: string,
): Promise<BackupInfo> {
  try {
    return await invoke<BackupInfo>('backup_create', {
      vaultRoot,
      customName: customName ?? null,
    });
  } catch (e) {
    log.error('Backup create failed', e as Error);
    throw e;
  }
}

export async function listBackups(vaultRoot: string): Promise<BackupInfo[]> {
  try {
    return await invoke<BackupInfo[]>('backup_list', { vaultRoot });
  } catch (e) {
    log.error('Backup list failed', e as Error);
    return [];
  }
}

export async function deleteBackup(filePath: string): Promise<void> {
  try {
    await invoke('backup_delete', { filePath });
  } catch (e) {
    log.error('Backup delete failed', e as Error);
    throw e;
  }
}

export async function getBackupConfig(vaultRoot: string): Promise<BackupConfig> {
  try {
    return await invoke<BackupConfig>('backup_get_config', { vaultRoot });
  } catch (e) {
    log.warn('Failed to load backup config', { error: String(e) });
    const { DEFAULT_BACKUP_CONFIG } = await import('../types');
    return { ...DEFAULT_BACKUP_CONFIG };
  }
}

export async function saveBackupConfig(
  vaultRoot: string,
  config: BackupConfig,
): Promise<void> {
  try {
    await invoke('backup_save_config', { vaultRoot, config });
  } catch (e) {
    log.error('Failed to save backup config', e as Error);
    throw e;
  }
}
