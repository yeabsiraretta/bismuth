//! Vault utility and batch operations IPC commands

use crate::error::{BismuthError, Result};
use crate::services::FrontmatterService;
use crate::utils::validate_path;
use std::collections::HashMap;
use std::path::PathBuf;
use tauri::State;

use super::AppState;

/// Batch-updates a single YAML frontmatter field across multiple notes.
///
/// Requires explicit caller confirmation (enforced on frontend).
#[tauri::command]
pub async fn batch_update_frontmatter_field(
    paths: Vec<String>,
    key: String,
    value: serde_json::Value,
    state: State<'_, AppState>,
) -> Result<u32> {
    let service = state.vault_service.lock().unwrap();
    let mut updated = 0u32;
    for path_str in &paths {
        let path = PathBuf::from(path_str);
        if service.update_frontmatter_field(&path, &key, value.clone()).is_ok() {
            updated += 1;
        }
    }
    Ok(updated)
}

/// Creates a directory (and any missing parents) within the vault.
///
/// Validates the path is within vault boundaries before creating.
#[tauri::command]
pub async fn create_folder(
    path: String,
    state: State<'_, AppState>,
) -> Result<()> {
    let folder_path = PathBuf::from(&path);
    let service = state.vault_service.lock().unwrap();
    let vault = service.get_vault().ok_or_else(|| {
        BismuthError::VaultError("No vault is currently open".to_string())
    })?;
    validate_path(&folder_path, &vault.root_path)?;
    std::fs::create_dir_all(&folder_path)?;
    Ok(())
}

/// Moves a folder (and all its contents) into a target directory within the vault.
///
/// Validates both source and destination are within vault boundaries.
#[tauri::command]
pub async fn move_folder(
    source_path: String,
    target_parent: String,
    state: State<'_, AppState>,
) -> Result<String> {
    let source = PathBuf::from(&source_path);
    let target = PathBuf::from(&target_parent);
    let service = state.vault_service.lock().unwrap();
    let vault = service.get_vault().ok_or_else(|| {
        BismuthError::VaultError("No vault is currently open".to_string())
    })?;
    validate_path(&source, &vault.root_path)?;
    validate_path(&target, &vault.root_path)?;

    let folder_name = source.file_name().ok_or_else(|| {
        BismuthError::Generic("Invalid source folder path".to_string())
    })?;
    let destination = target.join(folder_name);

    if destination.exists() {
        return Err(BismuthError::Generic(format!(
            "A folder named '{}' already exists in the target location",
            folder_name.to_string_lossy()
        )));
    }

    // Prevent moving a folder into itself or a descendant
    if target.starts_with(&source) {
        return Err(BismuthError::Generic(
            "Cannot move a folder into itself or a subfolder of itself".to_string()
        ));
    }

    std::fs::rename(&source, &destination)?;
    Ok(destination.to_string_lossy().to_string())
}

/// Parses YAML frontmatter from raw markdown content.
///
/// Returns a JSON object of frontmatter fields.
#[tauri::command]
pub async fn parse_frontmatter(
    content: String,
) -> Result<HashMap<String, serde_json::Value>> {
    let (frontmatter, _body) = FrontmatterService::parse(&content)?;
    Ok(frontmatter)
}

/// Returns all tags from a note (both frontmatter `tags` array and inline `#tag` syntax).
#[tauri::command]
pub async fn get_note_tags(
    path: String,
    state: State<'_, AppState>,
) -> Result<Vec<String>> {
    let note_path = PathBuf::from(&path);
    let service = state.vault_service.lock().unwrap();
    let note = service.get_note(&note_path)?;

    let mut tags: Vec<String> = Vec::new();

    // Tags from frontmatter
    if let Some(tags_val) = note.frontmatter.get("tags") {
        if let Some(arr) = tags_val.as_array() {
            for tag in arr {
                if let Some(name) = tag.as_str() {
                    tags.push(name.to_string());
                }
            }
        }
    }

    // Inline #tags from content
    let re = regex::Regex::new(r"#([a-zA-Z0-9_/\-]+)").unwrap();
    for cap in re.captures_iter(&note.content) {
        let name = cap[1].to_string();
        if !tags.contains(&name) {
            tags.push(name);
        }
    }

    Ok(tags)
}

/// Reads a file as UTF-8 text. Validates the path is within the vault.
#[tauri::command]
pub async fn read_file_text(
    path: String,
    state: State<'_, AppState>,
) -> Result<String> {
    let file_path = PathBuf::from(&path);
    let service = state.vault_service.lock().unwrap();
    let vault = service.get_vault().ok_or_else(|| {
        BismuthError::VaultError("No vault is currently open".to_string())
    })?;
    validate_path(&file_path, &vault.root_path)?;
    std::fs::read_to_string(&file_path).map_err(BismuthError::from)
}
