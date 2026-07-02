//! Infinite canvas IPC commands (FR-013)
//!
//! Delegates to [`CanvasService`] for document persistence operations.

use crate::models::canvas::CanvasDocument;
use crate::services::canvas_service::CanvasService;
use std::sync::{Arc, Mutex};
use tauri::State;

/// Managed state holding the canvas service.
pub struct CanvasState {
    pub canvas_service: Arc<Mutex<CanvasService>>,
}

/// Creates a new blank canvas document.
///
/// # Arguments
///
/// * `name` — Display name for the canvas.
#[tauri::command]
pub async fn create_canvas(
    state: State<'_, CanvasState>,
    name: String,
) -> Result<CanvasDocument, String> {
    let service = state.canvas_service.lock().unwrap();
    service
        .create_canvas(name)
        .map_err(|e| format!("Failed to create canvas: {}", e))
}

/// Persists a canvas document (full overwrite of elements and layers).
#[tauri::command]
pub async fn save_canvas(
    state: State<'_, CanvasState>,
    canvas: CanvasDocument,
) -> Result<(), String> {
    let service = state.canvas_service.lock().unwrap();
    service
        .save_canvas(&canvas)
        .map_err(|e| format!("Failed to save canvas: {}", e))
}

/// Loads a canvas document by ID, including all layers and elements.
///
/// # Arguments
///
/// * `id` — Unique canvas document ID.
#[tauri::command]
pub async fn load_canvas(
    state: State<'_, CanvasState>,
    id: String,
) -> Result<CanvasDocument, String> {
    let service = state.canvas_service.lock().unwrap();
    service
        .load_canvas(&id)
        .map_err(|e| format!("Failed to load canvas: {}", e))
}

/// Lists all canvas documents (metadata only, without element data).
#[tauri::command]
pub async fn list_canvases(
    state: State<'_, CanvasState>,
) -> Result<Vec<CanvasDocument>, String> {
    let service = state.canvas_service.lock().unwrap();
    service
        .list_canvases()
        .map_err(|e| format!("Failed to list canvases: {}", e))
}

/// Deletes a canvas document and all its elements/layers.
///
/// # Arguments
///
/// * `id` — Canvas document ID to delete.
#[tauri::command]
pub async fn delete_canvas(
    state: State<'_, CanvasState>,
    id: String,
) -> Result<(), String> {
    let service = state.canvas_service.lock().unwrap();
    service
        .delete_canvas(&id)
        .map_err(|e| format!("Failed to delete canvas: {}", e))
}

// ─── Template Commands (T133) ────────────────────────────────────────────────

/// Saves a set of elements as a reusable template.
#[tauri::command]
pub async fn save_canvas_template(
    state: State<'_, CanvasState>,
    name: String,
    elements: Vec<crate::models::canvas::CanvasElement>,
    description: String,
    category: String,
) -> Result<serde_json::Value, String> {
    let service = state.canvas_service.lock().unwrap();
    service
        .save_template(&name, &elements, &description, &category)
        .map_err(|e| format!("Failed to save template: {}", e))
}

/// Loads a template by ID.
#[tauri::command]
pub async fn load_canvas_template(
    state: State<'_, CanvasState>,
    id: String,
) -> Result<serde_json::Value, String> {
    let service = state.canvas_service.lock().unwrap();
    service
        .load_template(&id)
        .map_err(|e| format!("Failed to load template: {}", e))
}

/// Lists all available templates, optionally filtered by category.
#[tauri::command]
pub async fn list_canvas_templates(
    state: State<'_, CanvasState>,
    category: Option<String>,
) -> Result<Vec<serde_json::Value>, String> {
    let service = state.canvas_service.lock().unwrap();
    service
        .list_templates(category.as_deref())
        .map_err(|e| format!("Failed to list templates: {}", e))
}

/// Deletes a template by ID.
#[tauri::command]
pub async fn delete_canvas_template(
    state: State<'_, CanvasState>,
    id: String,
) -> Result<(), String> {
    let service = state.canvas_service.lock().unwrap();
    service
        .delete_template(&id)
        .map_err(|e| format!("Failed to delete template: {}", e))
}

// ─── Note Linking Commands (T134) ────────────────────────────────────────────

/// Links a canvas to a note by setting the note_id field.
#[tauri::command]
pub async fn link_canvas_to_note(
    state: State<'_, CanvasState>,
    canvas_id: String,
    note_path: Option<String>,
) -> Result<(), String> {
    let service = state.canvas_service.lock().unwrap();
    service
        .link_to_note(&canvas_id, note_path.as_deref())
        .map_err(|e| format!("Failed to link canvas to note: {}", e))
}

/// Gets all canvases linked to a specific note.
#[tauri::command]
pub async fn get_canvases_for_note(
    state: State<'_, CanvasState>,
    note_path: String,
) -> Result<Vec<CanvasDocument>, String> {
    let service = state.canvas_service.lock().unwrap();
    service
        .get_canvases_for_note(&note_path)
        .map_err(|e| format!("Failed to get canvases for note: {}", e))
}

// ─── Portability Commands (010-data-portability) ────────────────────────────

/// Exports a single canvas to a `.canvas` file immediately (non-debounced).
#[tauri::command]
pub async fn export_canvas_to_file(
    state: State<'_, CanvasState>,
    canvas_id: String,
) -> Result<String, String> {
    let service = state.canvas_service.lock().unwrap();
    let canvas = service
        .load_canvas(&canvas_id)
        .map_err(|e| format!("Failed to load canvas: {}", e))?;

    service
        .export_all_to_files()
        .map_err(|e| format!("Failed to export canvas: {}", e))?;

    Ok(format!("Exported canvas '{}'", canvas.name))
}

/// Exports all canvases from SQLite to `.canvas` files (one-time migration).
/// Only writes files that don't already exist.
#[tauri::command]
pub async fn export_all_canvases(
    state: State<'_, CanvasState>,
) -> Result<usize, String> {
    let service = state.canvas_service.lock().unwrap();
    service
        .export_all_to_files()
        .map_err(|e| format!("Failed to export canvases: {}", e))
}
