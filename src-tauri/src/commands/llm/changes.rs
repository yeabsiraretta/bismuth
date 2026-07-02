//! LLM proposed-change commands — list, apply, and reject agent proposed changes.

use crate::services::llm_service::change_store::{
    open_agent_db, list_changes, get_change, update_status,
};
use serde_json::Value;
use std::path::Path;

/// Lists all proposed changes for a vault (all statuses).
#[tauri::command]
pub async fn list_agent_changes(vault_root: String) -> Result<Value, String> {
    let conn = open_agent_db(&vault_root)?;
    let changes = list_changes(&conn, &vault_root, None)?;
    serde_json::to_value(&changes).map_err(|e| format!("Serialization error: {}", e))
}

/// Lists all pending proposed changes for a vault.
#[tauri::command]
pub async fn list_proposed_changes(vault_root: String) -> Result<Value, String> {
    let conn = open_agent_db(&vault_root)?;
    let changes = list_changes(&conn, &vault_root, Some("pending"))?;
    serde_json::to_value(&changes).map_err(|e| format!("Serialization error: {}", e))
}

/// Applies a pending proposed change to the vault file system.
/// Guards against double-apply: returns error if change is not 'pending'.
#[tauri::command]
pub async fn apply_change(vault_root: String, change_id: String) -> Result<(), String> {
    let conn = open_agent_db(&vault_root)?;

    let change = get_change(&conn, &change_id)?
        .ok_or_else(|| format!("Change {} not found", change_id))?;

    if change.status != "pending" {
        return Err(format!("change_already_applied: status is '{}'", change.status));
    }

    // Validate that the target path stays within vault_root
    let vault_path = Path::new(&vault_root);
    let target = vault_path.join(&change.target_path);
    let canonical_vault = vault_path.canonicalize()
        .map_err(|e| format!("Failed to canonicalize vault path: {}", e))?;
    let canonical_target_parent = target.parent()
        .unwrap_or(vault_path)
        .canonicalize()
        .unwrap_or_else(|_| target.parent().unwrap_or(vault_path).to_path_buf());

    if !canonical_target_parent.starts_with(&canonical_vault) {
        return Err(format!("Target path escapes vault boundary: {}", change.target_path));
    }

    match change.action.as_str() {
        "create" | "update" => {
            if let Some(content) = &change.proposed_content {
                if let Some(parent) = target.parent() {
                    std::fs::create_dir_all(parent)
                        .map_err(|e| format!("Failed to create directories: {}", e))?;
                }
                std::fs::write(&target, content)
                    .map_err(|e| format!("Failed to write note: {}", e))?;
                tracing::info!("Applied change {} ({})", change_id, change.action);
            }
        }
        "delete" => {
            if target.exists() {
                std::fs::remove_file(&target)
                    .map_err(|e| format!("Failed to delete note: {}", e))?;
                tracing::info!("Applied change {} (delete)", change_id);
            }
        }
        "rename" => {
            if let Some(new_path) = &change.new_path {
                let new_target = vault_path.join(new_path);
                std::fs::rename(&target, &new_target)
                    .map_err(|e| format!("Failed to rename note: {}", e))?;
                tracing::info!("Applied change {} (rename)", change_id);
            }
        }
        _ => return Err(format!("Unknown action: {}", change.action)),
    }

    update_status(&conn, &change_id, "approved")?;
    Ok(())
}

/// Rejects a pending proposed change (vault files are not modified).
#[tauri::command]
pub async fn reject_change(vault_root: String, change_id: String) -> Result<(), String> {
    let conn = open_agent_db(&vault_root)?;

    let change = get_change(&conn, &change_id)?
        .ok_or_else(|| format!("Change {} not found", change_id))?;

    if change.status != "pending" {
        return Err(format!("Cannot reject change with status '{}'", change.status));
    }

    update_status(&conn, &change_id, "rejected")?;
    tracing::info!("Rejected change {}", change_id);
    Ok(())
}
