//! Vault-related Tauri commands

use crate::error::Result;
use crate::models::{Note, Vault};
use crate::services::VaultService;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::State;

/// Application state
pub struct AppState {
    pub vault_service: Mutex<VaultService>,
}

/// Opens a vault
#[tauri::command]
pub async fn open_vault(
    path: String,
    state: State<'_, AppState>,
) -> Result<Vault> {
    let mut service = state.vault_service.lock().unwrap();
    service.open(PathBuf::from(path))
}

/// Creates a new vault
#[tauri::command]
pub async fn create_vault(
    path: String,
    state: State<'_, AppState>,
) -> Result<Vault> {
    let mut service = state.vault_service.lock().unwrap();
    service.create(PathBuf::from(path))
}

/// Creates a new vault from a template
#[tauri::command]
pub async fn create_vault_from_template(
    path: String,
    template: String,
    state: State<'_, AppState>,
) -> Result<Vault> {
    let mut service = state.vault_service.lock().unwrap();
    service.create_from_template(PathBuf::from(path), &template)
}

/// Gets the currently open vault
#[tauri::command]
pub async fn get_current_vault(
    state: State<'_, AppState>,
) -> Result<Option<Vault>> {
    let service = state.vault_service.lock().unwrap();
    Ok(service.get_vault().cloned())
}

/// Scans the vault for all notes
#[tauri::command]
pub async fn scan_vault(
    state: State<'_, AppState>,
) -> Result<Vec<Note>> {
    let service = state.vault_service.lock().unwrap();
    service.scan()
}

/// Reads a note by path
#[tauri::command]
pub async fn read_note(
    path: String,
    state: State<'_, AppState>,
) -> Result<Note> {
    let service = state.vault_service.lock().unwrap();
    service.get_note(&PathBuf::from(path))
}

/// Writes a note
#[tauri::command]
pub async fn write_note(
    path: String,
    content: String,
    state: State<'_, AppState>,
) -> Result<()> {
    let service = state.vault_service.lock().unwrap();
    service.write_note(&PathBuf::from(path), &content)
}

/// Deletes a note
#[tauri::command]
pub async fn delete_note(
    path: String,
    state: State<'_, AppState>,
) -> Result<()> {
    let service = state.vault_service.lock().unwrap();
    service.delete_note(&PathBuf::from(path))
}

/// Renames a note
#[tauri::command]
pub async fn rename_note(
    old_path: String,
    new_path: String,
    state: State<'_, AppState>,
) -> Result<()> {
    let service = state.vault_service.lock().unwrap();
    service.rename_note(&PathBuf::from(old_path), &PathBuf::from(new_path))
}

/// Lists all folders in the vault
#[tauri::command]
pub async fn list_folders(
    vault_path: String,
    state: State<'_, AppState>,
) -> Result<Vec<String>> {
    let service = state.vault_service.lock().unwrap();
    service.list_folders(&PathBuf::from(vault_path))
}

/// Lists all notes in a specific folder
#[tauri::command]
pub async fn list_notes(
    vault_path: String,
    folder_path: String,
    state: State<'_, AppState>,
) -> Result<Vec<Note>> {
    let service = state.vault_service.lock().unwrap();
    service.list_notes_in_folder(&PathBuf::from(vault_path), &folder_path)
}

/// Duplicates a note
#[tauri::command]
pub async fn duplicate_note(
    path: String,
    state: State<'_, AppState>,
) -> Result<Note> {
    let service = state.vault_service.lock().unwrap();
    service.duplicate_note(&PathBuf::from(path))
}

/// Moves a note to a different folder
#[tauri::command]
pub async fn move_note(
    old_path: String,
    new_folder: String,
    state: State<'_, AppState>,
) -> Result<Note> {
    let service = state.vault_service.lock().unwrap();
    service.move_note(&PathBuf::from(old_path), &PathBuf::from(new_folder))
}

/// Merges multiple notes into one
#[tauri::command]
pub async fn merge_notes(
    paths: Vec<String>,
    target_path: String,
    state: State<'_, AppState>,
) -> Result<Note> {
    let service = state.vault_service.lock().unwrap();
    let path_bufs: Vec<PathBuf> = paths.iter().map(|p| PathBuf::from(p)).collect();
    service.merge_notes(&path_bufs, &PathBuf::from(target_path))
}

/// Creates a new note
#[tauri::command]
pub async fn create_note(
    path: String,
    content: String,
    state: State<'_, AppState>,
) -> Result<Note> {
    let service = state.vault_service.lock().unwrap();
    service.create_note(&PathBuf::from(path), &content)
}

/// Updates all wikilinks when a note is renamed
#[tauri::command]
pub async fn update_links_on_rename(
    old_path: String,
    new_path: String,
    state: State<'_, AppState>,
) -> Result<Vec<String>> {
    let service = state.vault_service.lock().unwrap();
    let updated = service.update_links_on_rename(&PathBuf::from(old_path), &PathBuf::from(new_path))?;
    Ok(updated.iter().map(|p| p.to_string_lossy().to_string()).collect())
}

/// Creates a note from an unresolved wikilink
#[tauri::command]
pub async fn create_note_from_wikilink(
    title: String,
    state: State<'_, AppState>,
) -> Result<Note> {
    let service = state.vault_service.lock().unwrap();
    service.create_note_from_wikilink(&title)
}

/// Opens a path in the system file manager
#[tauri::command]
pub async fn open_in_file_manager(path: String) -> Result<()> {
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

/// Updates a single frontmatter field on a note
#[tauri::command]
pub async fn update_frontmatter_field(
    path: String,
    key: String,
    value: serde_json::Value,
    state: State<'_, AppState>,
) -> Result<()> {
    let service = state.vault_service.lock().unwrap();
    service.update_frontmatter_field(&PathBuf::from(path), &key, value)
}

/// Entity type definition for custom types
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct TypeDefinition {
    pub name: String,
    pub icon: String,
    pub color: String,
    pub description: Option<String>,
}

/// Get custom entity types from .bismuth/entity-types.json
#[tauri::command]
pub async fn get_custom_entity_types(
    state: State<'_, AppState>,
) -> std::result::Result<Vec<TypeDefinition>, String> {
    let service = state.vault_service.lock().unwrap();
    let vault = service.get_vault().ok_or("No vault open")?;
    let config_path = vault.root_path.join(".bismuth").join("entity-types.json");

    if !config_path.exists() {
        return Ok(vec![]);
    }

    let content = std::fs::read_to_string(&config_path)
        .map_err(|e| format!("Failed to read entity types: {}", e))?;

    let types: Vec<TypeDefinition> = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse entity types: {}", e))?;

    Ok(types)
}
