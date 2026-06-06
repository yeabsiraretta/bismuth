//! Component library IPC commands (004 Canvas Component System)
//!
//! Provides CRUD operations for component definitions stored as JSON files
//! in `.bismuth/components/`. Components are vault-level assets independent
//! of individual canvas documents.

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::State;

use crate::commands::vault_commands::AppState;

// ─── Types ───────────────────────────────────────────────────────────────────

/// A component prop definition.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComponentProp {
    pub key: String,
    pub label: String,
    #[serde(rename = "type")]
    pub prop_type: String,
    #[serde(rename = "defaultValue")]
    pub default_value: serde_json::Value,
}

/// A canvas element within a component definition.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComponentElement {
    pub id: String,
    #[serde(flatten)]
    pub data: serde_json::Value,
}

/// A reusable component definition persisted to `.bismuth/components/{id}.json`.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComponentDefinition {
    pub id: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub category: Option<String>,
    pub elements: Vec<serde_json::Value>,
    #[serde(rename = "exposedProps")]
    pub exposed_props: Vec<ComponentProp>,
    pub width: f64,
    pub height: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub thumbnail: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tags: Option<Vec<String>>,
    pub created_at: i64,
    pub modified_at: i64,
}

/// Managed state for component commands — resolves the components directory.
pub struct ComponentState {
    pub vault_root: Mutex<Option<PathBuf>>,
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

fn get_components_dir(state: &State<'_, ComponentState>) -> Result<PathBuf, String> {
    let guard = state.vault_root.lock().unwrap();
    let root = guard.as_ref().ok_or("No vault is open")?;
    let dir = root.join(".bismuth").join("components");
    if !dir.exists() {
        fs::create_dir_all(&dir)
            .map_err(|e| format!("Failed to create components directory: {}", e))?;
    }
    Ok(dir)
}

fn component_path(dir: &PathBuf, id: &str) -> PathBuf {
    dir.join(format!("{}.json", id))
}

// ─── Commands ────────────────────────────────────────────────────────────────

/// Lists all component definitions in the vault.
#[tauri::command]
pub async fn list_components(
    state: State<'_, ComponentState>,
) -> Result<Vec<ComponentDefinition>, String> {
    let dir = get_components_dir(&state)?;
    let mut components = Vec::new();

    let entries = fs::read_dir(&dir)
        .map_err(|e| format!("Failed to read components directory: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) == Some("json") {
            let content = fs::read_to_string(&path)
                .map_err(|e| format!("Failed to read component file: {}", e))?;
            match serde_json::from_str::<ComponentDefinition>(&content) {
                Ok(comp) => components.push(comp),
                Err(e) => {
                    tracing::warn!("Skipping invalid component file {:?}: {}", path, e);
                }
            }
        }
    }

    components.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(components)
}

/// Reads a single component definition by ID.
#[tauri::command]
pub async fn read_component(
    state: State<'_, ComponentState>,
    id: String,
) -> Result<ComponentDefinition, String> {
    let dir = get_components_dir(&state)?;
    let path = component_path(&dir, &id);

    if !path.exists() {
        return Err(format!("Component '{}' not found", id));
    }

    let content = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read component: {}", e))?;
    serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse component: {}", e))
}

/// Saves (creates or updates) a component definition.
#[tauri::command]
pub async fn save_component(
    state: State<'_, ComponentState>,
    component: ComponentDefinition,
) -> Result<ComponentDefinition, String> {
    let dir = get_components_dir(&state)?;
    let path = component_path(&dir, &component.id);

    let content = serde_json::to_string_pretty(&component)
        .map_err(|e| format!("Failed to serialize component: {}", e))?;
    fs::write(&path, content)
        .map_err(|e| format!("Failed to write component: {}", e))?;

    Ok(component)
}

/// Deletes a component definition by ID.
#[tauri::command]
pub async fn delete_component(
    state: State<'_, ComponentState>,
    id: String,
) -> Result<(), String> {
    let dir = get_components_dir(&state)?;
    let path = component_path(&dir, &id);

    if !path.exists() {
        return Err(format!("Component '{}' not found", id));
    }

    fs::remove_file(&path)
        .map_err(|e| format!("Failed to delete component: {}", e))?;
    Ok(())
}
