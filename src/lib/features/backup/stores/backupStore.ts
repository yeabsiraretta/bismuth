/** Backup store — manages interval timer, status, and last backup info. */

import { writable, derived, get } from 'svelte/store';
import { log } from '@/utils/logger';
import { currentVault } from '@/stores/vault/vault';
import { registerStatusItem, removeStatusItem, updateStatusItem } from '@/stores/status/status';
import { showToast } from '@/stores/toast/toast';
import type { BackupConfig, BackupInfo } from '../types';
import { DEFAULT_BACKUP_CONFIG } from '../types';
import {
  createBackup,
  listBackups,
  getBackupConfig,
  saveBackupConfig,
} from '../services/backupService';

export const backupConfig = writable<BackupConfig>({ ...DEFAULT_BACKUP_CONFIG });
export const backupList = writable<BackupInfo[]>([]);
export const isBackingUp = writable(false);
export const lastBackup = writable<BackupInfo | null>(null);

let intervalId: ReturnType<typeof setInterval> | null = null;

export const backupCount = derived(backupList, $list => $list.length);

/** Load config and backup list from backend. */
export async function loadBackupState(): Promise<void> {
  const vault = get(currentVault);
  if (!vault?.root_path) return;
  const [config, list] = await Promise.all([
    getBackupConfig(vault.root_path),
    listBackups(vault.root_path),
  ]);
  backupConfig.set(config);
  backupList.set(list);
  if (list.length > 0) lastBackup.set(list[0]);
  startIntervalIfNeeded(config);
}

/** Persist config to backend and restart interval timer. */
export async function updateConfig(config: BackupConfig): Promise<void> {
  const vault = get(currentVault);
  if (!vault?.root_path) return;
  backupConfig.set(config);
  await saveBackupConfig(vault.root_path, config);
  startIntervalIfNeeded(config);
}

/** Trigger a manual or automatic backup. */
export async function triggerBackup(customName?: string): Promise<BackupInfo | null> {
  const vault = get(currentVault);
  if (!vault?.root_path) return null;
  if (get(isBackingUp)) return null;

  isBackingUp.set(true);
  const startMs = performance.now();
  registerStatusItem({
    id: 'backup-progress',
    position: 'right',
    icon: 'archive',
    label: 'Backing up...',
    tooltip: 'Creating vault backup',
    priority: 3,
  });

  try {
    const info = await createBackup(vault.root_path, customName);
    const elapsed = ((performance.now() - startMs) / 1000).toFixed(1);
    lastBackup.set(info);
    backupList.update(list => [info, ...list]);
    updateStatusItem('backup-progress', {
      icon: 'check',
      label: `Backup done (${elapsed}s)`,
    });
    setTimeout(() => removeStatusItem('backup-progress'), 4000);
    showToast(`Backup created: ${info.file_name}`, 'success');
    log.info('Backup completed', { fileName: info.file_name, elapsed });
    return info;
  } catch (e) {
    updateStatusItem('backup-progress', {
      icon: 'alert-circle',
      label: 'Backup failed',
    });
    setTimeout(() => removeStatusItem('backup-progress'), 5000);
    showToast('Backup failed: ' + String(e), 'error');
    log.error('Backup failed', e as Error);
    return null;
  } finally {
    isBackingUp.set(false);
  }
}

/** Start interval backups if configured. */
function startIntervalIfNeeded(config: BackupConfig): void {
  stopInterval();
  if (!config.enabled || config.interval_minutes <= 0) return;
  const ms = config.interval_minutes * 60 * 1000;
  intervalId = setInterval(() => {
    triggerBackup().catch(() => {});
  }, ms);
  log.info('Backup interval started', { minutes: config.interval_minutes });
}

/** Stop interval timer. */
export function stopInterval(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

/** Run startup backup if configured. */
export async function runStartupBackup(): Promise<void> {
  const vault = get(currentVault);
  if (!vault?.root_path) return;
  const config = await getBackupConfig(vault.root_path);
  backupConfig.set(config);
  if (config.enabled && config.backup_on_startup) {
    await triggerBackup();
  }
  startIntervalIfNeeded(config);
}

/** Run quit backup if configured. Returns a promise to await before shutdown. */
export async function runQuitBackup(): Promise<void> {
  const config = get(backupConfig);
  if (!config.enabled || !config.backup_on_quit) return;
  await triggerBackup();
}
