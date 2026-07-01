//! Vault changelog IPC commands (F22)

use crate::services::changelog_service::{Changelog, ChangelogAction, ChangelogEntry};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use tauri::State;

use super::AppState;

#[derive(Debug, Serialize, Deserialize)]
pub struct ChangelogEntryDto {
    pub path: String,
    pub action: String,
    pub timestamp: String,
    pub words_delta: i64,
}

/// Appends a changelog entry for the active vault.
#[tauri::command]
pub async fn changelog_append(
    path: String,
    action: String,
    words_delta: i64,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let service = state.vault_service.lock().unwrap();
    let vault = service
        .get_vault()
        .ok_or_else(|| "No vault open".to_string())?;

    let changelog_action = match action.as_str() {
        "created" => ChangelogAction::Created,
        "modified" => ChangelogAction::Modified,
        "deleted" => ChangelogAction::Deleted,
        "renamed" => ChangelogAction::Renamed,
        _ => ChangelogAction::Modified,
    };

    let entry = ChangelogEntry {
        path,
        action: changelog_action,
        timestamp: Utc::now(),
        words_delta,
    };

    let mut changelog = Changelog::load(&vault.root_path)
        .map_err(|e| format!("Failed to load changelog: {}", e))?;
    changelog.append(entry);
    changelog
        .save(&vault.root_path)
        .map_err(|e| format!("Failed to save changelog: {}", e))?;

    Ok(())
}

/// Returns the most recent changelog entries.
#[tauri::command]
pub async fn changelog_recent(
    limit: Option<usize>,
    state: State<'_, AppState>,
) -> Result<Vec<ChangelogEntryDto>, String> {
    let service = state.vault_service.lock().unwrap();
    let vault = service
        .get_vault()
        .ok_or_else(|| "No vault open".to_string())?;

    let changelog = Changelog::load(&vault.root_path)
        .map_err(|e| format!("Failed to load changelog: {}", e))?;

    let entries: Vec<ChangelogEntryDto> = changelog
        .recent(limit.unwrap_or(100))
        .into_iter()
        .map(|e| ChangelogEntryDto {
            path: e.path.clone(),
            action: serde_json::to_value(&e.action)
                .ok()
                .and_then(|v| v.as_str().map(String::from))
                .unwrap_or_else(|| "modified".to_string()),
            timestamp: e.timestamp.to_rfc3339(),
            words_delta: e.words_delta,
        })
        .collect();

    Ok(entries)
}
