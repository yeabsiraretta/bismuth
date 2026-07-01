//! Backlink and mention discovery IPC commands (FR-005)
//!
//! Scans vault notes for both explicit `[[wikilink]]` references and
//! unlinked textual mentions, enabling the backlinks panel and
//! link-suggestion workflows.

use crate::error::{BismuthError, Result};
use crate::commands::vault_commands::AppState;
use super::backlink_indexer;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::State;

/// A single mention of one note inside another.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Mention {
    pub note_path: String,
    pub note_name: String,
    pub context: String,
    pub line_number: usize,
}

/// Aggregated backlinks data for a single note.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BacklinksData {
    pub linked_mentions: Vec<Mention>,
    pub unlinked_mentions: Vec<Mention>,
}

/// An outgoing link from a note to another.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Link {
    pub target_note_name: String,
    pub target_note_path: String,
    pub line_number: usize,
    pub is_resolved: bool,
}

/// An unlinked mention found in outgoing-link analysis.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UnlinkedMention {
    pub potential_target_name: String,
    pub context: String,
    pub line_number: usize,
    pub matching_notes: Vec<MatchingNote>,
}

/// A candidate note that matches an unlinked mention.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MatchingNote {
    pub name: String,
    pub path: String,
}

/// Aggregated outgoing link data for a single note.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OutgoingLinksData {
    pub links: Vec<Link>,
    pub unlinked_mentions: Vec<UnlinkedMention>,
}

/// Finds all notes that link to or mention the specified note.
#[tauri::command]
pub async fn get_backlinks(
    note_path: String,
    state: State<'_, AppState>,
) -> Result<BacklinksData> {
    let mut vault_service = state.vault_service.lock().unwrap();
    let _vault = vault_service
        .get_vault()
        .ok_or_else(|| BismuthError::VaultError("No vault is currently open".to_string()))?;

    let note_path_buf = PathBuf::from(&note_path);
    let note = vault_service.get_note(&note_path_buf)?;
    let all_notes = vault_service.scan()?;

    backlink_indexer::scan_backlinks(&all_notes, &note_path_buf, &note.title)
}

/// Extracts all outgoing wikilinks and unlinked mentions from a note.
#[tauri::command]
pub async fn get_outgoing_links(
    note_path: String,
    state: State<'_, AppState>,
) -> Result<OutgoingLinksData> {
    let mut vault_service = state.vault_service.lock().unwrap();
    let _vault = vault_service
        .get_vault()
        .ok_or_else(|| BismuthError::VaultError("No vault is currently open".to_string()))?;

    let note_path_buf = PathBuf::from(&note_path);
    let note = vault_service.get_note(&note_path_buf)?;
    let content = std::fs::read_to_string(&note.path)?;
    let all_notes = vault_service.scan()?;

    backlink_indexer::extract_outgoing_links(&all_notes, &note_path_buf, &content)
}

/// Converts an unlinked backlink mention into an explicit `[[wikilink]]`.
#[tauri::command]
pub async fn create_link_from_mention(
    source_note_path: String,
    target_note_path: String,
    line_number: usize,
    state: State<'_, AppState>,
) -> Result<()> {
    let vault_service = state.vault_service.lock().unwrap();
    let _vault = vault_service
        .get_vault()
        .ok_or_else(|| BismuthError::VaultError("No vault is currently open".to_string()))?;

    let source_path_buf = PathBuf::from(&source_note_path);
    let target_path_buf = PathBuf::from(&target_note_path);

    let source_note = vault_service.get_note(&source_path_buf)?;
    let target_note = vault_service.get_note(&target_path_buf)?;

    let content = std::fs::read_to_string(&source_note.path)?;
    let mut lines: Vec<String> = content.lines().map(|s| s.to_string()).collect();

    if line_number > 0 && line_number <= lines.len() {
        let new_line = lines[line_number - 1]
            .replace(&target_note.title, &format!("[[{}]]", target_note.title));
        lines[line_number - 1] = new_line;
        std::fs::write(&source_note.path, lines.join("\n"))?;
    }

    Ok(())
}

/// Converts an unlinked outgoing mention into an explicit `[[wikilink]]`.
#[tauri::command]
pub async fn create_link_from_unlinked_mention(
    source_note_path: String,
    _target_note_path: String,
    line_number: usize,
    text: String,
    state: State<'_, AppState>,
) -> Result<()> {
    let vault_service = state.vault_service.lock().unwrap();
    let _vault = vault_service
        .get_vault()
        .ok_or_else(|| BismuthError::VaultError("No vault is currently open".to_string()))?;

    let source_path_buf = PathBuf::from(&source_note_path);
    let source_note = vault_service.get_note(&source_path_buf)?;

    let content = std::fs::read_to_string(&source_note.path)?;
    let mut lines: Vec<String> = content.lines().map(|s| s.to_string()).collect();

    if line_number > 0 && line_number <= lines.len() {
        let new_line = lines[line_number - 1].replace(&text, &format!("[[{}]]", text));
        lines[line_number - 1] = new_line;
        std::fs::write(&source_note.path, lines.join("\n"))?;
    }

    Ok(())
}
