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
