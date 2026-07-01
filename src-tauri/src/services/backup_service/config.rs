//! Backup configuration and metadata types.

use serde::{Deserialize, Serialize};

/// Persisted backup configuration for a vault.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupConfig {
    pub enabled: bool,
    /// Backup on application startup
    pub backup_on_startup: bool,
    /// Backup when closing the vault / quitting
    pub backup_on_quit: bool,
    /// Interval backup in minutes (0 = disabled)
    pub interval_minutes: u32,
    /// Maximum number of backups to keep (0 = unlimited)
    pub max_backups: u32,
    /// Custom output directory (empty = vault_root/.backups)
    pub output_path: String,
    /// File name template with strftime-style tokens
    pub file_name_template: String,
    /// Comma-separated include patterns (empty = whole vault)
    pub included_patterns: String,
    /// Comma-separated exclude patterns
    pub excluded_patterns: String,
    /// Number of retry attempts on failure
    pub retry_count: u32,
    /// Delay between retries in milliseconds
    pub retry_delay_ms: u64,
}

impl Default for BackupConfig {
    fn default() -> Self {
        DEFAULT_BACKUP_CONFIG.clone()
    }
}

pub const DEFAULT_BACKUP_CONFIG: BackupConfig = BackupConfig {
    enabled: false,
    backup_on_startup: false,
    backup_on_quit: false,
    interval_minutes: 0,
    max_backups: 10,
    output_path: String::new(),
    file_name_template: String::new(), // will use "Backup-%Y_%m_%d-%H_%M_%S" at runtime
    included_patterns: String::new(),
    excluded_patterns: String::new(),
    retry_count: 2,
    retry_delay_ms: 3000,
};

/// Metadata about a single backup file.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupInfo {
    pub file_name: String,
    pub file_path: String,
    pub size_bytes: u64,
    pub created_at: String,
}
