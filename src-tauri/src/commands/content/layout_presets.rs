use crate::config::constants::filesystem::VAULT_DIR_NAME;
use serde::{Serialize, Deserialize};
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LayoutPreset {
    pub id: String,
    pub name: String,
    pub data: serde_json::Value,
    pub created_at: i64,
}

fn validate_preset_id(id: &str) -> Result<(), String> {
    if id.is_empty() {
        return Err("Preset ID must not be empty".to_string());
    }
    if id.chars().any(|c| !c.is_alphanumeric() && c != '-' && c != '_') {
        return Err("Invalid preset ID: only alphanumeric, dash, and underscore are allowed".to_string());
    }
    Ok(())
}

#[tauri::command]
pub async fn save_layout_preset(vault_root: String, preset: LayoutPreset) -> Result<(), String> {
    validate_preset_id(&preset.id)?;
    let dir = Path::new(&vault_root).join(VAULT_DIR_NAME).join("layouts");
    std::fs::create_dir_all(&dir)
        .map_err(|e| format!("Failed to create layouts dir: {}", e))?;
    let path = dir.join(format!("{}.json", preset.id));
    let json = serde_json::to_string_pretty(&preset).map_err(|e| e.to_string())?;
    std::fs::write(&path, json)
        .map_err(|e| format!("Failed to write preset: {}", e))?;
    tracing::info!("Layout preset saved: {}", preset.id);
    Ok(())
}

#[tauri::command]
pub async fn load_layout_presets(vault_root: String) -> Result<Vec<LayoutPreset>, String> {
    let dir = Path::new(&vault_root).join(VAULT_DIR_NAME).join("layouts");
    if !dir.exists() {
        return Ok(vec![]);
    }
    let mut presets = Vec::new();
    for entry in std::fs::read_dir(&dir).map_err(|e| e.to_string())?.flatten() {
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) != Some("json") {
            continue;
        }
        let content = std::fs::read_to_string(&path).map_err(|e| e.to_string())?;
        if let Ok(preset) = serde_json::from_str::<LayoutPreset>(&content) {
            presets.push(preset);
        }
    }
    presets.sort_by_key(|p| p.created_at);
    Ok(presets)
}

#[tauri::command]
pub async fn delete_layout_preset(vault_root: String, id: String) -> Result<(), String> {
    validate_preset_id(&id)?;
    let path = Path::new(&vault_root)
        .join(VAULT_DIR_NAME)
        .join("layouts")
        .join(format!("{}.json", id));
    if path.exists() {
        std::fs::remove_file(&path)
            .map_err(|e| format!("Failed to delete preset: {}", e))?;
        tracing::info!("Layout preset deleted: {}", id);
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn validate_id_rejects_path_traversal() {
        assert!(validate_preset_id("../evil").is_err());
        assert!(validate_preset_id("foo/bar").is_err());
        assert!(validate_preset_id("").is_err());
    }

    #[test]
    fn validate_id_accepts_valid() {
        assert!(validate_preset_id("my-preset").is_ok());
        assert!(validate_preset_id("preset_1").is_ok());
        assert!(validate_preset_id("FocusMode").is_ok());
    }
}
