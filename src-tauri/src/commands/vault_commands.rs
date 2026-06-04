//! Vault management IPC commands (FR-001, FR-002)
//!
//! Provides the core CRUD operations for vaults, notes, and folders.
//! All commands delegate to [`VaultService`] and enforce vault-boundary security.

use crate::error::Result;
use crate::models::{Note, Vault};
use crate::services::VaultService;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::State;

/// Primary application state managed by Tauri.
///
/// Holds the [`VaultService`] behind a `Mutex` for thread-safe access
/// from async IPC command handlers.
pub struct AppState {
    pub vault_service: Mutex<VaultService>,
}

/// Opens an existing vault at the given filesystem path.
///
/// Validates the path, initializes the vault struct, and triggers a full note scan.
///
/// # Arguments
///
/// * `path` — Absolute path to the vault root directory.
#[tauri::command]
pub async fn open_vault(
    path: String,
    state: State<'_, AppState>,
) -> Result<Vault> {
    let mut service = state.vault_service.lock().unwrap();
    service.open(PathBuf::from(path))
}

/// Creates a new empty vault at the specified path.
///
/// Creates the directory structure (`.bismuth/`, subdirs) and default config.
///
/// # Arguments
///
/// * `path` — Target directory for the new vault.
#[tauri::command]
pub async fn create_vault(
    path: String,
    state: State<'_, AppState>,
) -> Result<Vault> {
    let mut service = state.vault_service.lock().unwrap();
    service.create(PathBuf::from(path))
}

/// Creates a new vault pre-populated with template content.
///
/// # Arguments
///
/// * `path` — Target directory for the new vault.
/// * `template` — Template identifier (e.g., `"zettelkasten"`, `"para"`).
#[tauri::command]
pub async fn create_vault_from_template(
    path: String,
    template: String,
    state: State<'_, AppState>,
) -> Result<Vault> {
    let mut service = state.vault_service.lock().unwrap();
    service.create_from_template(PathBuf::from(path), &template)
}

/// Returns the currently open vault metadata, or `None` if no vault is loaded.
#[tauri::command]
pub async fn get_current_vault(
    state: State<'_, AppState>,
) -> Result<Option<Vault>> {
    let service = state.vault_service.lock().unwrap();
    Ok(service.get_vault().cloned())
}

/// Scans the vault directory tree and returns all discovered markdown notes.
#[tauri::command]
pub async fn scan_vault(
    state: State<'_, AppState>,
) -> Result<Vec<Note>> {
    let service = state.vault_service.lock().unwrap();
    service.scan()
}

/// Reads and parses a single note by its absolute file path.
///
/// # Arguments
///
/// * `path` — Absolute path to the `.md` file.
#[tauri::command]
pub async fn read_note(
    path: String,
    state: State<'_, AppState>,
) -> Result<Note> {
    let service = state.vault_service.lock().unwrap();
    service.get_note(&PathBuf::from(path))
}

/// Writes content to a note file (creates or overwrites).
///
/// # Arguments
///
/// * `path` — Absolute path to the target file.
/// * `content` — Full markdown content including frontmatter.
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
///
/// # Arguments
///
/// * `path` — Absolute path to the note to delete.
#[tauri::command]
pub async fn delete_note(
    path: String,
    state: State<'_, AppState>,
) -> Result<()> {
    let service = state.vault_service.lock().unwrap();
    service.delete_note(&PathBuf::from(path))
}

/// Renames (moves) a note from one path to another.
///
/// # Arguments
///
/// * `old_path` — Current absolute path.
/// * `new_path` — Desired absolute path.
#[tauri::command]
pub async fn rename_note(
    old_path: String,
    new_path: String,
    state: State<'_, AppState>,
) -> Result<()> {
    let service = state.vault_service.lock().unwrap();
    service.rename_note(&PathBuf::from(old_path), &PathBuf::from(new_path))
}

/// Lists all subdirectories in the vault (excluding hidden/`.bismuth`).
///
/// Returns paths relative to the vault root.
#[tauri::command]
pub async fn list_folders(
    vault_path: String,
    state: State<'_, AppState>,
) -> Result<Vec<String>> {
    let service = state.vault_service.lock().unwrap();
    service.list_folders(&PathBuf::from(vault_path))
}

/// Lists all `.md` notes within a specific folder.
///
/// # Arguments
///
/// * `vault_path` — Vault root path.
/// * `folder_path` — Folder path relative to vault root.
#[tauri::command]
pub async fn list_notes(
    vault_path: String,
    folder_path: String,
    state: State<'_, AppState>,
) -> Result<Vec<Note>> {
    let service = state.vault_service.lock().unwrap();
    service.list_notes_in_folder(&PathBuf::from(vault_path), &folder_path)
}

/// Creates a copy of a note with " copy" appended to the filename.
///
/// # Arguments
///
/// * `path` — Absolute path of the note to duplicate.
#[tauri::command]
pub async fn duplicate_note(
    path: String,
    state: State<'_, AppState>,
) -> Result<Note> {
    let service = state.vault_service.lock().unwrap();
    service.duplicate_note(&PathBuf::from(path))
}

/// Moves a note to a different folder within the vault.
///
/// Also updates all wikilinks referencing the moved note.
///
/// # Arguments
///
/// * `old_path` — Current absolute path.
/// * `new_folder` — Target directory path.
#[tauri::command]
pub async fn move_note(
    old_path: String,
    new_folder: String,
    state: State<'_, AppState>,
) -> Result<Note> {
    let service = state.vault_service.lock().unwrap();
    service.move_note(&PathBuf::from(old_path), &PathBuf::from(new_folder))
}

/// Merges multiple notes into a single target note.
///
/// Concatenates content with separator headers and removes the originals.
///
/// # Arguments
///
/// * `paths` — Paths of source notes to merge.
/// * `target_path` — Path of the resulting merged note.
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
///
/// # Arguments
///
/// * `path` — Desired absolute path for the new note.
/// * `content` — Initial markdown content.
#[tauri::command]
pub async fn create_note(
    path: String,
    content: String,
    state: State<'_, AppState>,
) -> Result<Note> {
    let service = state.vault_service.lock().unwrap();
    service.create_note(&PathBuf::from(path), &content)
}

/// Updates all `[[wikilink]]` references across the vault after a note rename.
///
/// Returns the list of files that were modified.
///
/// # Arguments
///
/// * `old_path` — Previous path of the renamed note.
/// * `new_path` — New path of the renamed note.
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

/// Creates a new note from an unresolved `[[wikilink]]` target.
///
/// Uses the link text as the note title and filename.
///
/// # Arguments
///
/// * `title` — Wikilink target text (becomes the filename).
#[tauri::command]
pub async fn create_note_from_wikilink(
    title: String,
    state: State<'_, AppState>,
) -> Result<Note> {
    let service = state.vault_service.lock().unwrap();
    service.create_note_from_wikilink(&title)
}

/// Opens a file or folder in the platform's native file manager.
///
/// Uses `open` (macOS), `explorer` (Windows), or `xdg-open` (Linux).
///
/// # Arguments
///
/// * `path` — Absolute path to reveal.
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

/// Updates a single frontmatter field on a note.
///
/// Reads the file, parses frontmatter YAML, sets the key-value pair,
/// re-serializes, and writes back to disk.
///
/// # Arguments
///
/// * `path` — Absolute path to the note.
/// * `key` — Frontmatter field name.
/// * `value` — New JSON value for the field.
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

/// Custom entity type definition loaded from `.bismuth/entity-types.json`.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct TypeDefinition {
    /// Type name (e.g., `"Custom Category"`).
    pub name: String,
    /// Icon identifier for UI rendering.
    pub icon: String,
    /// Hex color code for the type badge.
    pub color: String,
    /// Optional human-readable description.
    pub description: Option<String>,
}

/// Loads user-defined custom entity types from `.bismuth/entity-types.json`.
///
/// Returns an empty list if the configuration file does not exist.
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
