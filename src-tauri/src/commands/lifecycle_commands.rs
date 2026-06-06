//! IPC commands for note lifecycle management (T069, T070, T072)

use crate::commands::vault_commands::AppState;
use crate::services::lifecycle_service::{CapturedNoteSummary, LifecycleService, LifecycleStats};
use crate::models::note::Note;
use std::path::PathBuf;
use tauri::State;

type Result<T> = std::result::Result<T, String>;

/// Returns all notes currently in the "captured" (inbox) lifecycle state.
///
/// These are notes that have not yet been organized or archived.
#[tauri::command]
pub async fn get_captured_notes(
    state: State<'_, AppState>,
) -> Result<Vec<CapturedNoteSummary>> {
    let service = state.vault_service.lock().unwrap();
    let vault = service
        .get_vault()
        .ok_or_else(|| "No vault open".to_string())?;

    LifecycleService::get_captured_notes(&vault.root_path)
        .map_err(|e| format!("Failed to get captured notes: {}", e))
}

/// Returns counts of notes in each lifecycle state (captured/organized/archived).
#[tauri::command]
pub async fn get_lifecycle_stats(
    state: State<'_, AppState>,
) -> Result<LifecycleStats> {
    let service = state.vault_service.lock().unwrap();
    let vault = service
        .get_vault()
        .ok_or_else(|| "No vault open".to_string())?;

    LifecycleService::get_lifecycle_stats(&vault.root_path)
        .map_err(|e| format!("Failed to get lifecycle stats: {}", e))
}

/// Creates a note instantly with lifecycle defaults (< 200 ms target).
///
/// # Arguments
///
/// * `title` — Optional title; auto-generates a timestamp-based name if `None`.
#[tauri::command]
pub async fn quick_capture(
    state: State<'_, AppState>,
    title: Option<String>,
) -> Result<Note> {
    let service = state.vault_service.lock().unwrap();
    let vault = service
        .get_vault()
        .ok_or_else(|| "No vault open".to_string())?;

    LifecycleService::quick_capture(&vault.root_path, title.as_deref())
        .map_err(|e| format!("Quick capture failed: {}", e))
}

/// Archives a note by setting `lifecycle: archived` in frontmatter.
///
/// # Arguments
///
/// * `path` — Absolute path to the note.
#[tauri::command]
pub async fn archive_note(
    path: String,
) -> Result<()> {
    LifecycleService::archive_note(&PathBuf::from(path))
        .map_err(|e| format!("Archive failed: {}", e))
}

/// Marks a note as organized by setting `lifecycle: organized` in frontmatter.
///
/// # Arguments
///
/// * `path` — Absolute path to the note.
#[tauri::command]
pub async fn organize_note(
    path: String,
) -> Result<()> {
    LifecycleService::organize_note(&PathBuf::from(path))
        .map_err(|e| format!("Organize failed: {}", e))
}

/// Atomically sets a note's lifecycle state by updating both organized and
/// archived fields in a single read-modify-write operation.
///
/// # Arguments
///
/// * `path` — Absolute path to the note.
/// * `state` — Target state: "captured", "organized", or "archived".
#[tauri::command]
pub async fn set_lifecycle_state(
    path: String,
    state: String,
) -> Result<()> {
    LifecycleService::set_lifecycle_state(&PathBuf::from(path), &state)
        .map_err(|e| format!("Set lifecycle state failed: {}", e))
}
