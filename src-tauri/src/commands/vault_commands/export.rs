//! Vault export commands (010 Data Portability)
//!
//! Provides IPC commands for batch-migrating note frontmatter to the
//! standardized schema with `bismuth.lifecycle` namespace.

use crate::error::BismuthError;
use crate::services::frontmatter_migration;
use serde::Serialize;
use std::path::PathBuf;
use tauri::State;

use super::AppState;

type Result<T> = std::result::Result<T, BismuthError>;

/// Result of the export operation
#[derive(Debug, Serialize)]
pub struct ExportResult {
    pub total_notes: usize,
    pub migrated: usize,
    pub skipped: usize,
}

/// Batch-migrates all notes in the current vault to the standardized
/// frontmatter schema. Non-destructive: old fields are preserved.
///
/// Returns counts of total, migrated, and skipped notes.
#[tauri::command]
pub async fn export_vault_markdown(
    state: State<'_, AppState>,
) -> Result<ExportResult> {
    let service = state.vault_service.lock().unwrap();
    let vault = service.get_vault().ok_or_else(|| {
        BismuthError::VaultError("No vault is currently open".to_string())
    })?;

    let vault_root = vault.root_path.clone();
    drop(service);

    // Collect all .md files in the vault
    let mut notes: Vec<(PathBuf, String)> = Vec::new();
    collect_markdown_files(&vault_root, &mut notes)?;

    let total_notes = notes.len();

    let migrated = frontmatter_migration::migrate_batch(&notes)?;

    Ok(ExportResult {
        total_notes,
        migrated,
        skipped: total_notes - migrated,
    })
}

/// Recursively collects all .md files with their content
fn collect_markdown_files(
    dir: &std::path::Path,
    results: &mut Vec<(PathBuf, String)>,
) -> Result<()> {
    if !dir.is_dir() {
        return Ok(());
    }

    for entry in std::fs::read_dir(dir)? {
        let entry = entry?;
        let path = entry.path();

        // Skip hidden directories (e.g. .bismuth, .git)
        if path.is_dir() {
            if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                if name.starts_with('.') {
                    continue;
                }
            }
            collect_markdown_files(&path, results)?;
        } else if path.extension().and_then(|e| e.to_str()) == Some("md") {
            if let Ok(content) = std::fs::read_to_string(&path) {
                results.push((path, content));
            }
        }
    }

    Ok(())
}
