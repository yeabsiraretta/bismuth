//! Shared styles persistence commands.
//!
//! Security: SC-08 — Vault-scoped path validation for style files.

use crate::commands::design::canvas::CanvasState;
use tauri::State;

/// Load shared styles from a canvas document.
#[tauri::command]
pub async fn load_shared_styles(
    state: State<'_, CanvasState>,
    canvas_id: String,
) -> Result<serde_json::Value, String> {
    let service = state.canvas_service.lock().unwrap();
    let vault_root = service.vault_root()
        .ok_or_else(|| "No vault open".to_string())?;

    use crate::config::constants::filesystem::VAULT_DIR_NAME;
    let styles_path = vault_root.join(VAULT_DIR_NAME).join("styles").join(format!("{}.json", canvas_id));

    if !styles_path.exists() {
        return Ok(serde_json::json!([]));
    }

    // SC-08: validate path within vault
    if !styles_path.starts_with(&vault_root) {
        return Err("Path validation failed".to_string());
    }

    let content = std::fs::read_to_string(&styles_path)
        .map_err(|e| format!("Read styles: {}", e))?;
    let parsed: serde_json::Value = serde_json::from_str(&content)
        .map_err(|e| format!("Parse styles: {}", e))?;
    Ok(parsed)
}

/// Save shared styles for a canvas document.
#[tauri::command]
pub async fn save_shared_styles(
    state: State<'_, CanvasState>,
    canvas_id: String,
    styles: serde_json::Value,
) -> Result<(), String> {
    let service = state.canvas_service.lock().unwrap();
    let vault_root = service.vault_root()
        .ok_or_else(|| "No vault open".to_string())?;

    use crate::config::constants::filesystem::VAULT_DIR_NAME;
    let styles_dir = vault_root.join(VAULT_DIR_NAME).join("styles");
    std::fs::create_dir_all(&styles_dir)
        .map_err(|e| format!("Create styles dir: {}", e))?;

    let styles_path = styles_dir.join(format!("{}.json", sanitize_id(&canvas_id)?));

    // SC-08: validate path within vault
    if !styles_path.starts_with(&vault_root) {
        return Err("Path validation failed".to_string());
    }

    let content = serde_json::to_string_pretty(&styles)
        .map_err(|e| format!("Serialize styles: {}", e))?;
    std::fs::write(&styles_path, content)
        .map_err(|e| format!("Write styles: {}", e))?;
    Ok(())
}

/// Delete a shared style from storage.
#[tauri::command]
pub async fn delete_shared_style(
    state: State<'_, CanvasState>,
    canvas_id: String,
    style_id: String,
) -> Result<(), String> {
    let service = state.canvas_service.lock().unwrap();
    let vault_root = service.vault_root()
        .ok_or_else(|| "No vault open".to_string())?;

    use crate::config::constants::filesystem::VAULT_DIR_NAME;
    let styles_path = vault_root.join(VAULT_DIR_NAME).join("styles").join(format!("{}.json", canvas_id));
    if !styles_path.exists() {
        return Ok(());
    }

    let content = std::fs::read_to_string(&styles_path)
        .map_err(|e| format!("Read styles: {}", e))?;
    let mut styles: Vec<serde_json::Value> = serde_json::from_str(&content)
        .map_err(|e| format!("Parse styles: {}", e))?;

    styles.retain(|s| s.get("id").and_then(|v| v.as_str()) != Some(&style_id));

    let output = serde_json::to_string_pretty(&styles)
        .map_err(|e| format!("Serialize styles: {}", e))?;
    std::fs::write(&styles_path, output)
        .map_err(|e| format!("Write styles: {}", e))?;
    Ok(())
}

/// Sanitize canvas ID to prevent path traversal.
fn sanitize_id(id: &str) -> Result<String, String> {
    let sanitized: String = id.chars()
        .filter(|c| c.is_alphanumeric() || *c == '-' || *c == '_')
        .collect();
    if sanitized.is_empty() || sanitized.contains("..") {
        return Err("Invalid canvas ID".to_string());
    }
    Ok(sanitized)
}
