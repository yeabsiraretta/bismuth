/** Backup system types — mirrors Rust BackupConfig and BackupInfo. */

export interface BackupConfig {
  enabled: boolean;
  backup_on_startup: boolean;
  backup_on_quit: boolean;
  /** Interval in minutes. 0 = disabled. */
  interval_minutes: number;
  /** Max backups to keep. 0 = unlimited. */
  max_backups: number;
  /** Custom output path. Empty = vault_root/.backups */
  output_path: string;
  /** strftime-style filename template */
  file_name_template: string;
  /** Comma-separated include patterns */
  included_patterns: string;
  /** Comma-separated exclude patterns */
  excluded_patterns: string;
  retry_count: number;
  retry_delay_ms: number;
}

export interface BackupInfo {
  file_name: string;
  file_path: string;
  size_bytes: number;
  created_at: string;
}

export const DEFAULT_BACKUP_CONFIG: BackupConfig = {
  enabled: false,
  backup_on_startup: false,
  backup_on_quit: false,
  interval_minutes: 0,
  max_backups: 10,
  output_path: '',
  file_name_template: 'Backup-%Y_%m_%d-%H_%M_%S',
  included_patterns: '',
  excluded_patterns: '.git, .trash, node_modules',
  retry_count: 2,
  retry_delay_ms: 3000,
};
