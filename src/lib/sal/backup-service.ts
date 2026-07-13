import { invokeCommand } from '@/ipc/invoke';
import { isTauriAvailable } from '@/utils/platform';

export interface BackupInfo {
  path: string;
  sizeBytes: number;
  createdAt: number;
  noteCount: number;
}

export interface BackupListResult {
  backups: BackupInfo[];
}

export function createBackup(): Promise<BackupInfo> {
  if (!isTauriAvailable()) {
    return Promise.reject(new Error('Backup requires the desktop app'));
  }
  return invokeCommand<BackupInfo>('create_backup');
}

export function listBackups(): Promise<BackupListResult> {
  if (!isTauriAvailable()) {
    return Promise.resolve({ backups: [] });
  }
  return invokeCommand<BackupListResult>('list_backups');
}

export function deleteBackup(backupPath: string): Promise<void> {
  if (!isTauriAvailable()) {
    return Promise.reject(new Error('Backup requires the desktop app'));
  }
  return invokeCommand<void>('delete_backup', { backupPath });
}
