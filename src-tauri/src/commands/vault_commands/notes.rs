//! Note CRUD and vault management IPC commands

use crate::error::Result;
use crate::models::{Note, NoteMeta, Vault};
use std::path::PathBuf;
use tauri::State;

use super::AppState;

/// Opens an existing vault at the given filesystem path.
///
/// Initializes the backend `VaultService` and syncs the component state
/// so that component commands know which vault is active.
#[tauri::command]
pub async fn open_vault(
    path: String,
    state: State<'_, AppState>,
    component_state: State<'_, crate::commands::design::component::ComponentState>,
) -> Result<Vault> {
    let vault_path = PathBuf::from(&path);
    let mut service = state.vault_service.lock().unwrap();
    let vault = service.open(vault_path.clone())?;
    // Sync component state so component commands know the active vault
    let mut comp_root = component_state.vault_root.lock().unwrap();
    *comp_root = Some(vault_path);
    Ok(vault)
}

/// Creates a new empty vault at the specified path.
///
/// Sets up the `.bismuth/` metadata directory and initializes the database.
#[tauri::command]
pub async fn create_vault(
    path: String,
    state: State<'_, AppState>,
    component_state: State<'_, crate::commands::design::component::ComponentState>,
) -> Result<Vault> {
    let vault_path = PathBuf::from(&path);
    let mut service = state.vault_service.lock().unwrap();
    let vault = service.create(vault_path.clone())?;
    let mut comp_root = component_state.vault_root.lock().unwrap();
    *comp_root = Some(vault_path);
    Ok(vault)
}

/// Creates a new vault pre-populated with a starter template.
///
/// Templates provide folder structure and example notes for common workflows.
#[tauri::command]
pub async fn create_vault_from_template(
    path: String,
    template: String,
    state: State<'_, AppState>,
    component_state: State<'_, crate::commands::design::component::ComponentState>,
) -> Result<Vault> {
    let vault_path = PathBuf::from(&path);
    let mut service = state.vault_service.lock().unwrap();
    let vault = service.create_from_template(vault_path.clone(), &template)?;
    let mut comp_root = component_state.vault_root.lock().unwrap();
    *comp_root = Some(vault_path);
    Ok(vault)
}

/// Returns the currently open vault descriptor, or `None` if no vault is active.
#[tauri::command]
pub async fn get_current_vault(
    state: State<'_, AppState>,
) -> Result<Option<Vault>> {
    let service = state.vault_service.lock().unwrap();
    Ok(service.get_vault().cloned())
}

/// Recursively scans the vault directory tree and returns all discovered notes.
///
/// Triggers a full re-index of note metadata. Excludes hidden directories.
#[tauri::command]
pub async fn scan_vault(
    state: State<'_, AppState>,
) -> Result<Vec<Note>> {
    let mut service = state.vault_service.lock().unwrap();
    service.scan()
}

/// Scans the vault and returns metadata only (no content).
///
/// Returns the same data as `scan_vault` but without the `content` field,
/// making the IPC payload typically 10-50x smaller.
#[tauri::command]
pub async fn scan_vault_meta(
    state: State<'_, AppState>,
) -> Result<Vec<NoteMeta>> {
    let mut service = state.vault_service.lock().unwrap();
    service.scan_meta()
}

/// Reads a single note's content and parsed frontmatter from disk.
#[tauri::command]
pub async fn read_note(
    path: String,
    state: State<'_, AppState>,
) -> Result<Note> {
    let service = state.vault_service.lock().unwrap();
    service.get_note(&PathBuf::from(path))
}

/// Writes raw markdown content to a note file (creates or overwrites).
#[tauri::command]
pub async fn write_note(
    path: String,
    content: String,
    state: State<'_, AppState>,
) -> Result<()> {
    let service = state.vault_service.lock().unwrap();
    service.write_note(&PathBuf::from(path), &content)
}

/// Permanently deletes a note file from disk.
#[tauri::command]
pub async fn delete_note(
    path: String,
    state: State<'_, AppState>,
) -> Result<()> {
    let service = state.vault_service.lock().unwrap();
    service.delete_note(&PathBuf::from(path))
}

/// Renames or moves a note file on disk.
#[tauri::command]
pub async fn rename_note(
    old_path: String,
    new_path: String,
    state: State<'_, AppState>,
) -> Result<()> {
    let service = state.vault_service.lock().unwrap();
    service.rename_note(&PathBuf::from(old_path), &PathBuf::from(new_path))
}

/// Lists all subdirectories in the vault (relative paths, excluding hidden dirs).
#[tauri::command]
pub async fn list_folders(
    vault_path: String,
    state: State<'_, AppState>,
) -> Result<Vec<String>> {
    let service = state.vault_service.lock().unwrap();
    service.list_folders(&PathBuf::from(vault_path))
}

/// Lists notes within a specific folder (non-recursive).
#[tauri::command]
pub async fn list_notes(
    vault_path: String,
    folder_path: String,
    state: State<'_, AppState>,
) -> Result<Vec<Note>> {
    let service = state.vault_service.lock().unwrap();
    service.list_notes_in_folder(&PathBuf::from(vault_path), &folder_path)
}

/// Duplicates a note, creating a copy with a unique filename suffix.
#[tauri::command]
pub async fn duplicate_note(
    path: String,
    state: State<'_, AppState>,
) -> Result<Note> {
    let service = state.vault_service.lock().unwrap();
    service.duplicate_note(&PathBuf::from(path))
}

/// Moves a note to a different folder within the vault.
#[tauri::command]
pub async fn move_note(
    old_path: String,
    new_folder: String,
    state: State<'_, AppState>,
) -> Result<Note> {
    let service = state.vault_service.lock().unwrap();
    service.move_note(&PathBuf::from(old_path), &PathBuf::from(new_folder))
}

/// Merges multiple notes into a single target note, concatenating their content.
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

/// Creates a new note with the given content at the specified path.
#[tauri::command]
pub async fn create_note(
    path: String,
    content: String,
    state: State<'_, AppState>,
) -> Result<Note> {
    let service = state.vault_service.lock().unwrap();
    service.create_note(&PathBuf::from(path), &content)
}

/// Updates all wikilinks across the vault that reference a renamed/moved note.
///
/// Returns the list of files that were modified.
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

/// Creates a new note from a wikilink title (e.g., clicking a red link).
///
/// The note is created with a default frontmatter template using the title.
#[tauri::command]
pub async fn create_note_from_wikilink(
    title: String,
    state: State<'_, AppState>,
) -> Result<Note> {
    let service = state.vault_service.lock().unwrap();
    service.create_note_from_wikilink(&title)
}

/// Updates a single YAML frontmatter field on a note (read-modify-write).
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


