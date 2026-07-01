//! Entity system IPC commands (FR-008, FR-009)

use crate::services::entity_service::{EntityRelationships, EntityService, TypeDefinition};
use std::sync::Mutex;
use tauri::State;

/// Managed state holding the entity service.
///
/// Initialized lazily when a vault with entity type configuration is opened.
pub struct EntityState {
    pub entity_service: Mutex<Option<EntityService>>,
}

/// Returns all registered Portent entity types (default + custom).
#[tauri::command]
pub async fn get_entity_types(
    state: State<'_, EntityState>,
) -> Result<Vec<TypeDefinition>, String> {
    let guard = state.entity_service.lock().unwrap();
    let service = guard
        .as_ref()
        .ok_or_else(|| "Entity service not initialized".to_string())?;

    Ok(service.get_all_types().to_vec())
}

/// Returns the full type definition for a named entity type.
///
/// # Arguments
///
/// * `type_name` — Case-sensitive Portent type name (e.g., `"Project"`).
#[tauri::command]
pub async fn get_type_definition(
    state: State<'_, EntityState>,
    type_name: String,
) -> Result<TypeDefinition, String> {
    let guard = state.entity_service.lock().unwrap();
    let service = guard
        .as_ref()
        .ok_or_else(|| "Entity service not initialized".to_string())?;

    service
        .get_type_definition(&type_name)
        .cloned()
        .ok_or_else(|| format!("Type '{}' not found", type_name))
}

/// Resolves and returns all relationships for a typed entity note.
///
/// Includes both `belongs_to` and `related_to` frontmatter arrays,
/// with DFS-based circular reference detection.
///
/// # Arguments
///
/// * `note_path` — Absolute path of the entity note.
#[tauri::command]
pub async fn get_entity_relationships(
    state: State<'_, EntityState>,
    note_path: String,
) -> Result<EntityRelationships, String> {
    let guard = state.entity_service.lock().unwrap();
    let service = guard
        .as_ref()
        .ok_or_else(|| "Entity service not initialized".to_string())?;

    let path = std::path::Path::new(&note_path);
    service
        .get_entity_relationships(path)
        .map_err(|e| format!("Failed to get relationships: {}", e))
}
