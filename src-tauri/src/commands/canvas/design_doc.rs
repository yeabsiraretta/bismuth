//! Design document CRUD IPC commands
//!
//! Provides file-based persistence for design documents in `.bismuth/design-docs/`.
//! Documents are stored as JSON files organized by type subdirectories.

use crate::commands::vault_commands::AppState;
use crate::error::{BismuthError, Result};
use crate::utils::validate_path;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::State;

/// Metadata for a design document (returned by list).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DesignDocumentMeta {
    pub path: String,
    pub doc_type: Option<String>,
    pub name: String,
    pub modified_at: String,
}

/// Resolves a design doc relative path to an absolute path within the vault.
/// Validates the resolved path stays within vault boundaries.
fn resolve_design_path(state: &State<'_, AppState>, relative_path: &str) -> Result<PathBuf> {
    let service = state.vault_service.lock().unwrap();
    let vault = service.get_vault().ok_or_else(|| {
        BismuthError::VaultError("No vault is currently open".to_string())
    })?;
    let abs_path = vault.root_path.join(relative_path);
    validate_path(&abs_path, &vault.root_path)?;
    Ok(abs_path)
}

/// Reads a design document JSON file from `.bismuth/design-docs/{path}`.
#[tauri::command]
pub async fn design_doc_read(
    path: String,
    state: State<'_, AppState>,
) -> Result<String> {
    let abs_path = resolve_design_path(&state, &path)?;
    fs::read_to_string(&abs_path).map_err(BismuthError::from)
}

/// Writes content to `.bismuth/design-docs/{path}`. Creates parent dirs if needed.
#[tauri::command]
pub async fn design_doc_write(
    path: String,
    content: String,
    state: State<'_, AppState>,
) -> Result<()> {
    let abs_path = resolve_design_path(&state, &path)?;
    if let Some(parent) = abs_path.parent() {
        fs::create_dir_all(parent)?;
    }
    fs::write(&abs_path, content)?;
    Ok(())
}

/// Lists design documents in a base path, optionally filtered by document type.
#[tauri::command]
pub async fn design_doc_list(
    base_path: String,
    doc_type: Option<String>,
    state: State<'_, AppState>,
) -> Result<Vec<DesignDocumentMeta>> {
    let abs_base = resolve_design_path(&state, &base_path)?;

    if !abs_base.exists() {
        return Ok(Vec::new());
    }

    let mut results = Vec::new();
    collect_design_docs(&abs_base, &abs_base, &doc_type, &mut results)?;
    Ok(results)
}

/// Recursively collects `.json` files from the design docs directory.
fn collect_design_docs(
    dir: &PathBuf,
    base: &PathBuf,
    doc_type: &Option<String>,
    results: &mut Vec<DesignDocumentMeta>,
) -> Result<()> {
    if !dir.is_dir() {
        return Ok(());
    }

    for entry in fs::read_dir(dir)? {
        let entry = entry?;
        let path = entry.path();

        if path.is_dir() {
            collect_design_docs(&path, base, doc_type, results)?;
        } else if path.extension().and_then(|s| s.to_str()) == Some("json") {
            // Determine type from parent dir name
            let parent_name = path
                .parent()
                .and_then(|p| p.file_name())
                .and_then(|n| n.to_str())
                .unwrap_or("")
                .to_string();

            let inferred_type = match parent_name.as_str() {
                "components" => Some("component".to_string()),
                "layouts" => Some("layout".to_string()),
                "flows" => Some("flow".to_string()),
                "themes" => Some("theme".to_string()),
                "pages" => Some("page".to_string()),
                _ => None,
            };

            // Filter by type if specified
            if let Some(ref filter_type) = doc_type {
                if let Some(ref it) = inferred_type {
                    if it != filter_type {
                        continue;
                    }
                } else {
                    continue;
                }
            }

            let relative = path
                .strip_prefix(base)
                .unwrap_or(&path)
                .to_string_lossy()
                .to_string();

            let name = path
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("unknown")
                .to_string();

            let modified_at = fs::metadata(&path)
                .and_then(|m| m.modified())
                .map(|t| {
                    let duration = t
                        .duration_since(std::time::UNIX_EPOCH)
                        .unwrap_or_default();
                    format!("{}", duration.as_secs())
                })
                .unwrap_or_default();

            results.push(DesignDocumentMeta {
                path: relative,
                doc_type: inferred_type,
                name,
                modified_at,
            });
        }
    }

    Ok(())
}

/// Deletes a design document file.
#[tauri::command]
pub async fn design_doc_delete(
    path: String,
    state: State<'_, AppState>,
) -> Result<()> {
    let abs_path = resolve_design_path(&state, &path)?;
    if abs_path.exists() {
        fs::remove_file(&abs_path)?;
    }
    Ok(())
}
