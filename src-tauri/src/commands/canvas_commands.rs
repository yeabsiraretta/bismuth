use crate::models::canvas::CanvasDocument;
use crate::services::canvas_service::CanvasService;
use std::sync::{Arc, Mutex};
use tauri::State;

pub struct CanvasState {
    pub canvas_service: Arc<Mutex<CanvasService>>,
}

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

#[tauri::command]
pub async fn list_canvases(
    state: State<'_, CanvasState>,
) -> Result<Vec<CanvasDocument>, String> {
    let service = state.canvas_service.lock().unwrap();
    service
        .list_canvases()
        .map_err(|e| format!("Failed to list canvases: {}", e))
}

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
