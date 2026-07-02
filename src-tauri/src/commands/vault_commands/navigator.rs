//! Navigator state persistence and utility IPC commands

use std::path::PathBuf;
use tauri::State;

use super::AppState;

/// Opens a file or folder in the platform's native file manager.
#[tauri::command]
pub async fn open_in_file_manager(path: String) -> crate::error::Result<()> {
    let path_buf = PathBuf::from(&path);
    
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&path_buf)
            .spawn()?;
    }
    
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(&path_buf)
            .spawn()?;
    }
    
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&path_buf)
            .spawn()?;
    }
    
    Ok(())
}

/// Reads the navigator state from `.bismuth/navigator.json`.
#[tauri::command]
pub async fn read_navigator_state(
    state: State<'_, AppState>,
) -> std::result::Result<serde_json::Value, String> {
    let service = state.vault_service.lock().unwrap();
    let vault = service.get_vault().ok_or("No vault open")?;
    use crate::config::constants::filesystem::VAULT_DIR_NAME;
    let state_path = vault.root_path.join(VAULT_DIR_NAME).join("navigator.json");

    if !state_path.exists() {
        return Ok(serde_json::Value::Null);
    }

    let content = std::fs::read_to_string(&state_path)
        .map_err(|e| format!("Failed to read navigator state: {}", e))?;

    let value: serde_json::Value = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse navigator state: {}", e))?;

    Ok(value)
}

/// Writes the navigator state to `.bismuth/navigator.json`.
#[tauri::command]
pub async fn write_navigator_state(
    content: serde_json::Value,
    state: State<'_, AppState>,
) -> std::result::Result<(), String> {
    let service = state.vault_service.lock().unwrap();
    let vault = service.get_vault().ok_or("No vault open")?;
    use crate::config::constants::filesystem::VAULT_DIR_NAME;
    let bismuth_dir = vault.root_path.join(VAULT_DIR_NAME);

    if !bismuth_dir.exists() {
        std::fs::create_dir_all(&bismuth_dir)
            .map_err(|e| format!("Failed to create .bismuth directory: {}", e))?;
    }

    let state_path = bismuth_dir.join("navigator.json");
    let json_string = serde_json::to_string_pretty(&content)
        .map_err(|e| format!("Failed to serialize navigator state: {}", e))?;

    std::fs::write(&state_path, json_string)
        .map_err(|e| format!("Failed to write navigator state: {}", e))?;

    Ok(())
}

/// Custom entity type definition loaded from `.bismuth/entity-types.json`.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct TypeDefinition {
    pub name: String,
    pub icon: String,
    pub color: String,
    pub description: Option<String>,
}

/// Loads user-defined custom entity types from `.bismuth/entity-types.json`.
#[tauri::command]
pub async fn get_custom_entity_types(
    state: State<'_, AppState>,
) -> std::result::Result<Vec<TypeDefinition>, String> {
    let service = state.vault_service.lock().unwrap();
    let vault = service.get_vault().ok_or("No vault open")?;
    use crate::config::constants::filesystem::VAULT_DIR_NAME;
    let config_path = vault.root_path.join(VAULT_DIR_NAME).join("entity-types.json");

    if !config_path.exists() {
        return Ok(vec![]);
    }

    let content = std::fs::read_to_string(&config_path)
        .map_err(|e| format!("Failed to read entity types: {}", e))?;

    let types: Vec<TypeDefinition> = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse entity types: {}", e))?;

    Ok(types)
}
