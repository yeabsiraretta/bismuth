use crate::services::wikilink_service::{LinkSuggestion, WikilinkService};
use crate::services::vault_service::VaultService;
use std::sync::{Arc, Mutex};
use tauri::State;

pub struct WikilinkState {
    pub wikilink_service: Arc<WikilinkService>,
    pub vault_service: Arc<Mutex<VaultService>>,
}

#[tauri::command]
pub async fn find_unlinked_references(
    state: State<'_, WikilinkState>,
    note_path: String,
    content: String,
    case_sensitive: bool,
) -> Result<Vec<LinkSuggestion>, String> {
    let vault_service = state.vault_service.lock().unwrap();
    let vault = vault_service
        .get_vault()
        .ok_or_else(|| "No vault open".to_string())?;

    state
        .wikilink_service
        .find_unlinked_references(
            &std::path::PathBuf::from(note_path),
            &content,
            vault,
            case_sensitive,
        )
        .map_err(|e| format!("Failed to find unlinked references: {}", e))
}
