//! Vault backup service — creates zip archives with include/exclude patterns,
//! lifecycle management, and retry logic.

pub mod archiver;
pub mod config;

pub use archiver::{create_backup_archive, list_backups, delete_backup, cleanup_old_backups};
pub use config::{BackupConfig, BackupInfo, DEFAULT_BACKUP_CONFIG};
