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
    use crate::config::constants::filesystem::VAULT_DIR_NAME;
    let guard = state.vault_root.lock()
        .map_err(|_| "Component state lock is poisoned".to_string())?;
    let root = guard.as_ref().ok_or("No vault is open")?;
    let dir = root.join(VAULT_DIR_NAME).join("components");
    if !dir.exists() {
        fs::create_dir_all(&dir)
            .map_err(|e| format!("Failed to create components directory: {}", e))?;
    }
    Ok(dir)
}

/// Validates a component ID to prevent path traversal.
/// IDs must be 1–128 alphanumeric/dash/underscore characters.
fn validate_component_id(id: &str) -> Result<(), String> {
    if id.is_empty() || id.len() > 128 {
        return Err("Component ID must be 1–128 characters".into());
    }
    if id.chars().any(|c| !c.is_alphanumeric() && c != '-' && c != '_') {
        return Err(format!("Component ID '{}' contains invalid characters", id));
    }
    Ok(())
}

fn component_path_json(dir: &PathBuf, id: &str) -> PathBuf {
    dir.join(format!("{}.json", id))
}

fn component_path_md(dir: &PathBuf, id: &str) -> PathBuf {
    dir.join(format!("{}.md", id))
}

// ─── Commands ────────────────────────────────────────────────────────────────

/// Lists all component definitions in the vault.
/// Reads both `.md` (new format) and `.json` (legacy) files.
#[tauri::command]
pub async fn list_components(
    state: State<'_, ComponentState>,
) -> Result<Vec<ComponentDefinition>, String> {
    use crate::services::canvas_service::component_file;

    let dir = get_components_dir(&state)?;
    let mut components = Vec::new();

    let entries = fs::read_dir(&dir)
        .map_err(|e| format!("Failed to read components directory: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
        let path = entry.path();
        let ext = path.extension().and_then(|e| e.to_str());

        match ext {
            Some("md") => {
                match component_file::read_component_md(&path) {
                    Ok(comp) => components.push(comp),
                    Err(e) => {
                        tracing::warn!(file = ?path.file_name(), "Skipping invalid component .md: {}", e);
                    }
                }
            }
            Some("json") => {
                let content = fs::read_to_string(&path)
                    .map_err(|e| format!("Failed to read component file: {}", e))?;
                match serde_json::from_str::<ComponentDefinition>(&content) {
                    Ok(comp) => components.push(comp),
                    Err(e) => {
                        tracing::warn!(file = ?path.file_name(), "Skipping invalid component file: {}", e);
                    }
                }
            }
            _ => {}
        }
    }

    components.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(components)
}

/// Reads a single component definition by ID.
/// Tries `.md` first (new format), falls back to `.json` (legacy).
#[tauri::command]
pub async fn read_component(
    state: State<'_, ComponentState>,
    id: String,
) -> Result<ComponentDefinition, String> {
    use crate::services::canvas_service::component_file;

    validate_component_id(&id)?;
    let dir = get_components_dir(&state)?;
    let md_path = component_path_md(&dir, &id);
    let json_path = component_path_json(&dir, &id);

    if md_path.exists() {
        return component_file::read_component_md(&md_path)
            .map_err(|e| format!("Failed to read component .md: {}", e));
    }

    if json_path.exists() {
        let content = fs::read_to_string(&json_path)
            .map_err(|e| format!("Failed to read component: {}", e))?;
        return serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse component: {}", e));
    }

    Err(format!("Component '{}' not found", id))
}

/// Saves (creates or updates) a component definition.
/// Writes as `.md` format. If old `.json` exists for same ID, removes it.
#[tauri::command]
pub async fn save_component(
    state: State<'_, ComponentState>,
    component: ComponentDefinition,
) -> Result<ComponentDefinition, String> {
    use crate::services::canvas_service::component_file;

    validate_component_id(&component.id)?;
    let dir = get_components_dir(&state)?;
    let md_path = component_path_md(&dir, &component.id);
    let json_path = component_path_json(&dir, &component.id);

    component_file::write_component_md(&md_path, &component)
        .map_err(|e| format!("Failed to write component .md: {}", e))?;

    // Remove old .json if it exists (T016: auto-migrate on save)
    if json_path.exists() {
        let _ = fs::remove_file(&json_path);
    }

    Ok(component)
}

/// Deletes a component definition by ID.
/// Removes both `.md` and `.json` if they exist.
#[tauri::command]
pub async fn delete_component(
    state: State<'_, ComponentState>,
    id: String,
) -> Result<(), String> {
    validate_component_id(&id)?;
    let dir = get_components_dir(&state)?;
    let md_path = component_path_md(&dir, &id);
    let json_path = component_path_json(&dir, &id);

    if !md_path.exists() && !json_path.exists() {
        return Err(format!("Component '{}' not found", id));
    }

    if md_path.exists() {
        fs::remove_file(&md_path)
            .map_err(|e| format!("Failed to delete component: {}", e))?;
    }
    if json_path.exists() {
        fs::remove_file(&json_path)
            .map_err(|e| format!("Failed to delete component: {}", e))?;
    }
    Ok(())
}

/// Batch-converts all `.json` components to `.md` format.
/// Returns the count of components migrated.
#[tauri::command]
pub async fn export_components_markdown(
    state: State<'_, ComponentState>,
) -> Result<usize, String> {
    use crate::services::canvas_service::component_file;

    let dir = get_components_dir(&state)?;
    let mut migrated = 0;

    let entries = fs::read_dir(&dir)
        .map_err(|e| format!("Failed to read components directory: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) != Some("json") {
            continue;
        }

        let content = fs::read_to_string(&path)
            .map_err(|e| format!("Failed to read component: {}", e))?;
        let component: ComponentDefinition = match serde_json::from_str(&content) {
            Ok(c) => c,
            Err(_) => continue,
        };

        let md_path = component_path_md(&dir, &component.id);
        component_file::write_component_md(&md_path, &component)
            .map_err(|e| format!("Failed to write .md: {}", e))?;

        let _ = fs::remove_file(&path);
        migrated += 1;
    }

    Ok(migrated)
}
