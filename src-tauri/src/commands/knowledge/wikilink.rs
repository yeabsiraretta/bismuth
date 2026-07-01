//! Wikilink and concept-suggestion IPC commands (FR-003, FR-258)
//!
//! Provides unlinked reference discovery and real-time inline
//! concept suggestions that help users build their knowledge graph.

use crate::services::concept_service::ConceptSuggestion;
use crate::services::wikilink_service::{LinkSuggestion, WikilinkService};
use crate::services::vault_service::VaultService;
use std::sync::{Arc, Mutex};
use tauri::State;

/// Managed state for wikilink operations.
///
/// Holds a shared [`WikilinkService`] and a vault-service reference
/// for resolving links against the current vault.
pub struct WikilinkState {
    pub wikilink_service: Arc<WikilinkService>,
    pub vault_service: Arc<Mutex<VaultService>>,
}

/// Finds text in a note that matches other note titles but isn't linked.
///
/// Returns [`LinkSuggestion`] entries for each unlinked reference,
/// enabling the "link suggestion" UI.
///
/// # Arguments
///
/// * `note_path` — Path of the note to analyze.
/// * `content` — Current editor content (may differ from disk).
/// * `case_sensitive` — Whether title matching is case-sensitive.
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

/// Returns inline concept suggestions for the active note (T079).
///
/// Scans the note body for substrings matching vault note titles,
/// excluding spans already wrapped in `[[...]]` per FR-258.
/// Designed to be called with an 800 ms debounce on content change.
///
/// # Arguments
///
/// * `note_path` — Path of the note being edited.
/// * `content` — Current editor content.
#[tauri::command]
pub async fn get_concept_suggestions(
    state: State<'_, WikilinkState>,
    note_path: String,
    content: String,
) -> Result<Vec<ConceptSuggestion>, String> {
    let vault_service = state.vault_service.lock().unwrap();
    let vault = vault_service
        .get_vault()
        .ok_or_else(|| "No vault open".to_string())?;

    state
        .wikilink_service
        .get_concept_suggestions(
            &content,
            &vault.root_path,
            &std::path::PathBuf::from(note_path),
        )
        .map_err(|e| format!("Failed to get concept suggestions: {}", e))
}
