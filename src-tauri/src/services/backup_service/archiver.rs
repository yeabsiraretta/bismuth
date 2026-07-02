//! Zip archive creation with include/exclude wildcard patterns.

use super::config::{BackupConfig, BackupInfo};
use glob_match::glob_match;
use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use tracing::{info, warn};
use zip::write::FileOptions;
use zip::ZipWriter;

/// Create a backup zip archive of the vault.
///
/// Returns metadata about the created backup file.
/// Respects include/exclude patterns and retry logic from config.
pub fn create_backup_archive(
    vault_root: &Path,
    config: &BackupConfig,
    custom_name: Option<&str>,
) -> Result<BackupInfo, String> {
    let output_dir = resolve_output_dir(vault_root, config);
    fs::create_dir_all(&output_dir).map_err(|e| format!("Cannot create backup dir: {e}"))?;

    let file_name = build_file_name(config, custom_name);
    let zip_path = output_dir.join(&file_name);

    let mut last_err = String::new();
    let max_attempts = config.retry_count.max(1);
    for attempt in 0..max_attempts {
        match try_create_archive(vault_root, &zip_path, config) {
            Ok(size) => {
                let created_at = chrono::Local::now().to_rfc3339();
                info!("Backup created: {} ({} bytes)", file_name, size);
                return Ok(BackupInfo {
                    file_name,
                    file_path: zip_path.to_string_lossy().to_string(),
                    size_bytes: size,
                    created_at,
                });
            }
            Err(e) => {
                last_err = e;
                if attempt + 1 < max_attempts {
                    warn!("Backup attempt {} failed, retrying: {}", attempt + 1, last_err);
                    std::thread::sleep(std::time::Duration::from_millis(config.retry_delay_ms));
                }
            }
        }
    }
    Err(format!("Backup failed after {max_attempts} attempts: {last_err}"))
}

fn try_create_archive(
    vault_root: &Path,
    zip_path: &Path,
    config: &BackupConfig,
) -> Result<u64, String> {
    let file = File::create(zip_path).map_err(|e| format!("Cannot create zip: {e}"))?;
    let mut zip = ZipWriter::new(file);
    let options = FileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated)
        .compression_level(Some(6));

    let includes = parse_patterns(&config.included_patterns);
    let excludes = parse_patterns(&config.excluded_patterns);

    let entries = collect_entries(vault_root, &includes, &excludes)?;
    let mut buf = Vec::with_capacity(8192);

    for entry_path in &entries {
        let rel = entry_path
            .strip_prefix(vault_root)
            .unwrap_or(entry_path)
            .to_string_lossy()
            .replace('\\', "/");

        zip.start_file(&rel, options)
            .map_err(|e| format!("Zip entry error: {e}"))?;

        buf.clear();
        File::open(entry_path)
            .and_then(|mut f| f.read_to_end(&mut buf))
            .map_err(|e| format!("Read error {}: {e}", rel))?;
        zip.write_all(&buf)
            .map_err(|e| format!("Write error: {e}"))?;
    }

    zip.finish().map_err(|e| format!("Zip finish error: {e}"))?;
    let meta = fs::metadata(zip_path).map_err(|e| format!("Stat error: {e}"))?;
    Ok(meta.len())
}

fn collect_entries(
    vault_root: &Path,
    includes: &[String],
    excludes: &[String],
) -> Result<Vec<PathBuf>, String> {
    let mut result = Vec::new();
    walk_dir(vault_root, vault_root, includes, excludes, &mut result)?;
    Ok(result)
}

fn walk_dir(
    root: &Path,
    dir: &Path,
    includes: &[String],
    excludes: &[String],
    out: &mut Vec<PathBuf>,
) -> Result<(), String> {
    let entries = fs::read_dir(dir).map_err(|e| format!("Read dir error: {e}"))?;
    for entry in entries {
        let entry = entry.map_err(|e| format!("Dir entry error: {e}"))?;
        let path = entry.path();
        let rel = path.strip_prefix(root).unwrap_or(&path).to_string_lossy();
        let rel_str = rel.replace('\\', "/");

        // Skip the backup directory itself
        if rel_str.starts_with(".backups") {
            continue;
        }

        if path.is_dir() {
            // Check exclude on directory
            if is_excluded(&rel_str, excludes) {
                continue;
            }
            walk_dir(root, &path, includes, excludes, out)?;
        } else {
            if is_excluded(&rel_str, excludes) {
                continue;
            }
            if !is_included(&rel_str, includes) {
                continue;
            }
            out.push(path);
        }
    }
    Ok(())
}

fn parse_patterns(raw: &str) -> Vec<String> {
    raw.split(',')
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect()
}

fn is_included(rel_path: &str, includes: &[String]) -> bool {
    if includes.is_empty() {
        return true; // No includes = everything included
    }
    includes.iter().any(|pat| matches_pattern(rel_path, pat))
}

fn is_excluded(rel_path: &str, excludes: &[String]) -> bool {
    excludes.iter().any(|pat| matches_pattern(rel_path, pat))
}

/// Match a relative path against a wildcard pattern.
/// Supports: `*.ext`, `folder`, `folder/**`, `**/*.ext`
fn matches_pattern(rel_path: &str, pattern: &str) -> bool {
    // Direct prefix match (e.g., ".obsidian" matches ".obsidian/foo.json")
    if rel_path.starts_with(pattern) {
        return true;
    }
    // Exact filename match
    if let Some(name) = rel_path.rsplit('/').next() {
        if glob_match(pattern, name) {
            return true;
        }
    }
    // Full path glob
    glob_match(pattern, rel_path)
}

fn resolve_output_dir(vault_root: &Path, config: &BackupConfig) -> PathBuf {
    if config.output_path.is_empty() {
        vault_root.join(".backups")
    } else {
        PathBuf::from(&config.output_path)
    }
}

fn build_file_name(config: &BackupConfig, custom_name: Option<&str>) -> String {
    if let Some(name) = custom_name {
        if !name.ends_with(".zip") {
            return format!("{name}.zip");
        }
        return name.to_string();
    }

    let template = if config.file_name_template.is_empty() {
        "Backup-%Y_%m_%d-%H_%M_%S"
    } else {
        &config.file_name_template
    };

    let now = chrono::Local::now();
    let formatted = now.format(template).to_string();
    if formatted.ends_with(".zip") {
        formatted
    } else {
        format!("{formatted}.zip")
    }
}

/// List all existing backup files in the output directory, sorted newest first.
pub fn list_backups(vault_root: &Path, config: &BackupConfig) -> Vec<BackupInfo> {
    let output_dir = resolve_output_dir(vault_root, config);
    let mut backups = Vec::new();

    let entries = match fs::read_dir(&output_dir) {
        Ok(e) => e,
        Err(_) => return backups,
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) != Some("zip") {
            continue;
        }
        if let Ok(meta) = fs::metadata(&path) {
            let created = meta
                .created()
                .or_else(|_| meta.modified())
                .map(|t| {
                    let dt: chrono::DateTime<chrono::Local> = t.into();
                    dt.to_rfc3339()
                })
                .unwrap_or_default();
            backups.push(BackupInfo {
                file_name: path.file_name().unwrap_or_default().to_string_lossy().to_string(),
                file_path: path.to_string_lossy().to_string(),
                size_bytes: meta.len(),
                created_at: created,
            });
        }
    }
    backups.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    backups
}

/// Delete a specific backup file.
pub fn delete_backup(file_path: &str) -> Result<(), String> {
    fs::remove_file(file_path).map_err(|e| format!("Failed to delete backup: {e}"))
}

/// Enforce the max_backups limit by deleting oldest backups.
pub fn cleanup_old_backups(vault_root: &Path, config: &BackupConfig) {
    if config.max_backups == 0 {
        return;
    }
    let mut backups = list_backups(vault_root, config);
    while backups.len() > config.max_backups as usize {
        if let Some(oldest) = backups.pop() {
            if let Err(e) = fs::remove_file(&oldest.file_path) {
                warn!("Failed to clean old backup {}: {}", oldest.file_name, e);
            } else {
                info!("Cleaned old backup: {}", oldest.file_name);
            }
        }
    }
}
