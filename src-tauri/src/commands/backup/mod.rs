//! Backup IPC command handlers.

use crate::services::backup_service::config::{BackupConfig, BackupInfo};
use crate::services::backup_service::{self, create_backup_archive};
use crate::utils::fs_helpers;
use std::path::{Path, PathBuf};

const CONFIG_FILE: &str = ".bismuth/backup-config.json";

fn config_path(vault_root: &str) -> PathBuf {
    Path::new(vault_root).join(CONFIG_FILE)
}

#[tauri::command]
pub async fn backup_create(
    vault_root: String,
    custom_name: Option<String>,
) -> Result<BackupInfo, String> {
    let root = Path::new(&vault_root);
    let config = load_config_internal(&vault_root);
    let info = create_backup_archive(root, &config, custom_name.as_deref())?;
    backup_service::archiver::cleanup_old_backups(root, &config);
    Ok(info)
}

#[tauri::command]
pub async fn backup_list(vault_root: String) -> Result<Vec<BackupInfo>, String> {
    let root = Path::new(&vault_root);
    let config = load_config_internal(&vault_root);
    Ok(backup_service::archiver::list_backups(root, &config))
}

#[tauri::command]
pub async fn backup_delete(file_path: String) -> Result<(), String> {
    backup_service::archiver::delete_backup(&file_path)
}

#[tauri::command]
pub async fn backup_get_config(vault_root: String) -> Result<BackupConfig, String> {
    Ok(load_config_internal(&vault_root))
}

#[tauri::command]
pub async fn backup_save_config(
    vault_root: String,
    config: BackupConfig,
) -> Result<(), String> {
    let path = config_path(&vault_root);
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Cannot create config dir: {e}"))?;
    }
    fs_helpers::write_json_file(&path, &config)
        .map_err(|e| format!("Failed to save backup config: {e}"))
}

fn load_config_internal(vault_root: &str) -> BackupConfig {
    let path = config_path(vault_root);
    fs_helpers::read_json_file_or_default(&path).unwrap_or_default()
}
