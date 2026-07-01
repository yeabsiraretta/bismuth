//! Design Token IPC command handlers.
//!
//! Manages token collections in `.bismuth/tokens/` within the active vault.
//! Security: SC-01 (path traversal), SC-06 (payload size limits).

use crate::CanvasState;

pub use super::token_validation::{DesignToken, TokenCollection, TokenMode};

use super::token_validation::{
    sanitize_filename, tokens_dir, validate_collection_limits, validate_path_within_dir,
    MAX_COLLECTION_FILE_SIZE,
};
use std::fs;
use tauri::State;

/// Lists all token collections in the active vault.
#[tauri::command]
pub async fn list_token_collections(state: State<'_, CanvasState>) -> Result<Vec<TokenCollection>, String> {
    let service = state.canvas_service.lock().unwrap();
    let vault = service.vault_root().ok_or("No vault open")?.clone();
    drop(service);
    let dir = tokens_dir(&vault);

    if !dir.exists() {
        return Ok(vec![]);
    }

    let mut collections = Vec::new();
    let entries = fs::read_dir(&dir).map_err(|e| {
        tracing::error!("Failed to read tokens directory: {}", e);
        "Failed to read tokens directory".to_string()
    })?;

    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().map_or(false, |ext| ext == "json") {
            let content = fs::read_to_string(&path).map_err(|e| {
                tracing::error!(file = ?path.file_name(), "Failed to read token file: {}", e);
                "Failed to read token file".to_string()
            })?;

            if content.len() > MAX_COLLECTION_FILE_SIZE {
                tracing::warn!(file = ?path.file_name(), "Token file exceeds size limit, skipping");
                continue;
            }

            match serde_json::from_str::<TokenCollection>(&content) {
                Ok(collection) => collections.push(collection),
                Err(e) => {
                    tracing::warn!(file = ?path.file_name(), "Invalid token file: {}", e);
                }
            }
        }
    }

    Ok(collections)
}

/// Saves a token collection to disk.
#[tauri::command]
pub async fn save_token_collection(
    state: State<'_, CanvasState>,
    collection: TokenCollection,
) -> Result<(), String> {
    // SC-06: Validate payload limits
    validate_collection_limits(&collection)?;

    let service = state.canvas_service.lock().unwrap();
    let vault = service.vault_root().ok_or("No vault open")?.clone();
    drop(service);
    let dir = tokens_dir(&vault);

    // SC-01: Sanitize filename
    let safe_name = sanitize_filename(&collection.name);
    if safe_name.is_empty() {
        return Err("Invalid collection name".to_string());
    }

    let file_path = dir.join(format!("{}.json", safe_name));

    // SC-01: Verify path is within tokens directory
    validate_path_within_dir(&file_path, &dir)?;

    // Ensure directory exists
    fs::create_dir_all(&dir).map_err(|e| {
        tracing::error!("Failed to create tokens directory: {}", e);
        "Failed to create tokens directory".to_string()
    })?;

    let content = serde_json::to_string_pretty(&collection).map_err(|e| {
        tracing::error!("Failed to serialize token collection: {}", e);
        "Failed to serialize collection".to_string()
    })?;

    // SC-06: Final size check on serialized content
    if content.len() > MAX_COLLECTION_FILE_SIZE {
        return Err("Serialized collection exceeds size limit".to_string());
    }

    fs::write(&file_path, content).map_err(|e| {
        tracing::error!("Failed to write token file: {}", e);
        "Failed to save token collection".to_string()
    })?;

    tracing::info!(collection = %collection.name, "Token collection saved");
    Ok(())
}

/// Deletes a token collection by ID.
#[tauri::command]
pub async fn delete_token_collection(
    state: State<'_, CanvasState>,
    collection_id: String,
) -> Result<(), String> {
    let service = state.canvas_service.lock().unwrap();
    let vault = service.vault_root().ok_or("No vault open")?.clone();
    drop(service);
    let dir = tokens_dir(&vault);

    if !dir.exists() {
        return Ok(());
    }

    let entries = fs::read_dir(&dir).map_err(|e| {
        tracing::error!("Failed to read tokens directory: {}", e);
        "Failed to read tokens directory".to_string()
    })?;

    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().map_or(false, |ext| ext == "json") {
            if let Ok(content) = fs::read_to_string(&path) {
                if let Ok(col) = serde_json::from_str::<TokenCollection>(&content) {
                    if col.id == collection_id {
                        fs::remove_file(&path).map_err(|e| {
                            tracing::error!("Failed to delete token file: {}", e);
                            "Failed to delete token collection".to_string()
                        })?;
                        tracing::info!(id = %collection_id, "Token collection deleted");
                        return Ok(());
                    }
                }
            }
        }
    }

    Ok(())
}

/// Exports tokens for a mode as CSS custom properties.
#[tauri::command]
pub async fn export_tokens_css(
    state: State<'_, CanvasState>,
    mode_id: String,
) -> Result<String, String> {
    let service = state.canvas_service.lock().unwrap();
    let vault = service.vault_root().ok_or("No vault open")?.clone();
    drop(service);
    let dir = tokens_dir(&vault);

    if !dir.exists() {
        return Ok(":root {\n}\n".to_string());
    }

    let mut css_lines = vec![":root {".to_string()];

    let entries = fs::read_dir(&dir).map_err(|e| {
        tracing::error!("Failed to read tokens directory: {}", e);
        "Failed to read tokens directory".to_string()
    })?;

    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().map_or(false, |ext| ext == "json") {
            if let Ok(content) = fs::read_to_string(&path) {
                if let Ok(collection) = serde_json::from_str::<TokenCollection>(&content) {
                    for token in &collection.tokens {
                        if let Some(value) = token.values.get(&mode_id) {
                            let var_name = token.name.replace(' ', "-").to_lowercase();
                            css_lines.push(format!("  --{}: {};", var_name, value));
                        }
                    }
                }
            }
        }
    }

    css_lines.push("}".to_string());
    Ok(css_lines.join("\n"))
}

#[cfg(test)]
mod tests {}
