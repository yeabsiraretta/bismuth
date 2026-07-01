/** Backup feature — vault zip backups with scheduling, filters, and lifecycle. */

export type { BackupConfig, BackupInfo } from './types';
export { DEFAULT_BACKUP_CONFIG } from './types';

export {
  createBackup,
  listBackups,
  deleteBackup,
  getBackupConfig,
  saveBackupConfig,
} from './services/backupService';

export {
  backupConfig,
  backupList,
  isBackingUp,
  lastBackup,
  backupCount,
  triggerBackup,
  updateConfig,
  loadBackupState,
  stopInterval,
  runStartupBackup,
  runQuitBackup,
} from './stores/backupStore';

export { default as SettingsBackup } from './components/SettingsBackup.svelte';
