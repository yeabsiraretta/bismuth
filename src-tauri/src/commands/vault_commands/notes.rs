//! Note CRUD and vault management IPC commands

use crate::error::Result;
use crate::models::{Note, Vault};
use std::path::PathBuf;
use tauri::State;

use super::AppState;

#[tauri::command]
pub async fn open_vault(
    path: String,
    state: State<'_, AppState>,
) -> Result<Vault> {
    let mut service = state.vault_service.lock().unwrap();
    service.open(PathBuf::from(path))
}

#[tauri::command]
pub async fn create_vault(
    path: String,
    state: State<'_, AppState>,
) -> Result<Vault> {
    let mut service = state.vault_service.lock().unwrap();
    service.create(PathBuf::from(path))
}

#[tauri::command]
pub async fn create_vault_from_template(
    path: String,
    template: String,
    state: State<'_, AppState>,
) -> Result<Vault> {
    let mut service = state.vault_service.lock().unwrap();
    service.create_from_template(PathBuf::from(path), &template)
}

#[tauri::command]
pub async fn get_current_vault(
    state: State<'_, AppState>,
) -> Result<Option<Vault>> {
    let service = state.vault_service.lock().unwrap();
    Ok(service.get_vault().cloned())
}

#[tauri::command]
pub async fn scan_vault(
    state: State<'_, AppState>,
) -> Result<Vec<Note>> {
    let service = state.vault_service.lock().unwrap();
    service.scan()
}

#[tauri::command]
pub async fn read_note(
    path: String,
    state: State<'_, AppState>,
) -> Result<Note> {
    let service = state.vault_service.lock().unwrap();
    service.get_note(&PathBuf::from(path))
}

#[tauri::command]
pub async fn write_note(
    path: String,
    content: String,
    state: State<'_, AppState>,
) -> Result<()> {
    let service = state.vault_service.lock().unwrap();
    service.write_note(&PathBuf::from(path), &content)
}

#[tauri::command]
pub async fn delete_note(
    path: String,
    state: State<'_, AppState>,
) -> Result<()> {
    let service = state.vault_service.lock().unwrap();
    service.delete_note(&PathBuf::from(path))
}

#[tauri::command]
pub async fn rename_note(
    old_path: String,
    new_path: String,
    state: State<'_, AppState>,
) -> Result<()> {
    let service = state.vault_service.lock().unwrap();
    service.rename_note(&PathBuf::from(old_path), &PathBuf::from(new_path))
}

#[tauri::command]
pub async fn list_folders(
    vault_path: String,
    state: State<'_, AppState>,
) -> Result<Vec<String>> {
    let service = state.vault_service.lock().unwrap();
    service.list_folders(&PathBuf::from(vault_path))
}

#[tauri::command]
pub async fn list_notes(
    vault_path: String,
    folder_path: String,
    state: State<'_, AppState>,
) -> Result<Vec<Note>> {
    let service = state.vault_service.lock().unwrap();
    service.list_notes_in_folder(&PathBuf::from(vault_path), &folder_path)
}

#[tauri::command]
pub async fn duplicate_note(
    path: String,
    state: State<'_, AppState>,
) -> Result<Note> {
    let service = state.vault_service.lock().unwrap();
    service.duplicate_note(&PathBuf::from(path))
}

#[tauri::command]
pub async fn move_note(
    old_path: String,
    new_folder: String,
    state: State<'_, AppState>,
) -> Result<Note> {
    let service = state.vault_service.lock().unwrap();
    service.move_note(&PathBuf::from(old_path), &PathBuf::from(new_folder))
}

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

#[tauri::command]
pub async fn create_note(
    path: String,
    content: String,
    state: State<'_, AppState>,
) -> Result<Note> {
    let service = state.vault_service.lock().unwrap();
    service.create_note(&PathBuf::from(path), &content)
}

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

#[tauri::command]
pub async fn create_note_from_wikilink(
    title: String,
    state: State<'_, AppState>,
) -> Result<Note> {
    let service = state.vault_service.lock().unwrap();
    service.create_note_from_wikilink(&title)
}

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
