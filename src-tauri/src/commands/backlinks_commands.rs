//! Backlink and mention discovery IPC commands (FR-005)
//!
//! Scans vault notes for both explicit `[[wikilink]]` references and
//! unlinked textual mentions, enabling the backlinks panel and
//! link-suggestion workflows.

use crate::error::{BismuthError, Result};
use crate::commands::vault_commands::AppState;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::State;

/// A single mention of one note inside another.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Mention {
    /// Path to the note containing the mention.
    pub note_path: String,
    /// Title of the note containing the mention.
    pub note_name: String,
    /// Surrounding lines providing context for the mention.
    pub context: String,
    /// 1-indexed line number where the mention occurs.
    pub line_number: usize,
}

/// Aggregated backlinks data for a single note.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BacklinksData {
    /// Notes that explicitly link to this note via `[[wikilink]]`.
    pub linked_mentions: Vec<Mention>,
    /// Notes that contain the note's title as plain text (potential links).
    pub unlinked_mentions: Vec<Mention>,
}

/// An outgoing link from a note to another.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Link {
    /// Title of the target note.
    pub target_note_name: String,
    /// Resolved path of the target note (empty if unresolved).
    pub target_note_path: String,
    /// 1-indexed line where the link appears.
    pub line_number: usize,
    /// Whether the target note exists in the vault.
    pub is_resolved: bool,
}

/// An unlinked mention found in outgoing-link analysis.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UnlinkedMention {
    /// Text that matches an existing note title.
    pub potential_target_name: String,
    /// Surrounding text context.
    pub context: String,
    /// 1-indexed line number.
    pub line_number: usize,
    /// Candidate notes that could be the link target.
    pub matching_notes: Vec<MatchingNote>,
}

/// A candidate note that matches an unlinked mention.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MatchingNote {
    /// Note title.
    pub name: String,
    /// Absolute path to the note file.
    pub path: String,
}

/// Aggregated outgoing link data for a single note.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OutgoingLinksData {
    /// Resolved and unresolved wikilinks found in the note.
    pub links: Vec<Link>,
    /// Plain-text mentions of other notes that could become links.
    pub unlinked_mentions: Vec<UnlinkedMention>,
}

/// Finds all notes that link to or mention the specified note.
///
/// Scans every other note in the vault for `[[title]]` wikilinks
/// (linked mentions) and plain-text occurrences of the title
/// (unlinked mentions).
///
/// # Arguments
///
/// * `note_path` — Absolute path of the target note.
#[tauri::command]
pub async fn get_backlinks(
    note_path: String,
    state: State<'_, AppState>,
) -> Result<BacklinksData> {
    let vault_service = state.vault_service.lock().unwrap();
    let _vault = vault_service
        .get_vault()
        .ok_or_else(|| BismuthError::VaultError("No vault is currently open".to_string()))?;

    let note_path_buf = PathBuf::from(&note_path);
    let note = vault_service.get_note(&note_path_buf)?;

    let mut linked_mentions = Vec::new();
    let mut unlinked_mentions = Vec::new();

    // Get all notes in vault
    let all_notes = vault_service.scan()?;

    for other_note in all_notes {
        if other_note.path == note_path_buf {
            continue;
        }

        // Read note content
        let content = std::fs::read_to_string(&other_note.path)?;
        let lines: Vec<&str> = content.lines().collect();

        // Find wikilinks to this note
        for (line_num, line) in lines.iter().enumerate() {
            // Check for [[note_name]]
            if line.contains(&format!("[[{}]]", note.title)) {
                // Get context (3 lines before and after)
                let start = line_num.saturating_sub(3);
                let end = (line_num + 4).min(lines.len());
                let context = lines[start..end].join("\n");

                linked_mentions.push(Mention {
                    note_path: other_note.path.display().to_string(),
                    note_name: other_note.title.clone(),
                    context,
                    line_number: line_num + 1,
                });
            }
            // Check for unlinked mentions (plain text matching note name)
            else if line.contains(&note.title) && !line.contains(&format!("[[{}]]", note.title)) {
                let start = line_num.saturating_sub(3);
                let end = (line_num + 4).min(lines.len());
                let context = lines[start..end].join("\n");

                unlinked_mentions.push(Mention {
                    note_path: other_note.path.display().to_string(),
                    note_name: other_note.title.clone(),
                    context,
                    line_number: line_num + 1,
                });
            }
        }
    }

    Ok(BacklinksData {
        linked_mentions,
        unlinked_mentions,
    })
}

/// Extracts all outgoing wikilinks and unlinked mentions from a note.
///
/// Parses `[[...]]` syntax with regex and resolves each link against
/// the vault's note index. Also identifies plain-text occurrences
/// of other note titles that could be converted to links.
///
/// # Arguments
///
/// * `note_path` — Absolute path of the source note.
#[tauri::command]
pub async fn get_outgoing_links(
    note_path: String,
    state: State<'_, AppState>,
) -> Result<OutgoingLinksData> {
    let vault_service = state.vault_service.lock().unwrap();
    let _vault = vault_service
        .get_vault()
        .ok_or_else(|| BismuthError::VaultError("No vault is currently open".to_string()))?;

    let note_path_buf = PathBuf::from(&note_path);
    let note = vault_service.get_note(&note_path_buf)?;

    let mut links = Vec::new();
    let mut unlinked_mentions = Vec::new();

    // Read note content
    let content = std::fs::read_to_string(&note.path)?;
    let lines: Vec<&str> = content.lines().collect();

    // Get all notes for matching
    let all_notes = vault_service.scan()?;

    // Regex for wikilinks: [[link]]
    let wikilink_re = regex::Regex::new(r"\[\[([^\]]+)\]\]").unwrap();

    for (line_num, line) in lines.iter().enumerate() {
        // Find all wikilinks
        for cap in wikilink_re.captures_iter(line) {
            let link_text = cap.get(1).unwrap().as_str();

            // Try to resolve the link
            let resolved_note = all_notes.iter().find(|n| {
                n.title == link_text || n.path.file_stem().and_then(|s| s.to_str()) == Some(link_text)
            });

            if let Some(target) = resolved_note {
                links.push(Link {
                    target_note_name: target.title.clone(),
                    target_note_path: target.path.display().to_string(),
                    line_number: line_num + 1,
                    is_resolved: true,
                });
            } else {
                links.push(Link {
                    target_note_name: link_text.to_string(),
                    target_note_path: String::new(),
                    line_number: line_num + 1,
                    is_resolved: false,
                });
            }
        }

        // Find potential unlinked mentions (note names that aren't linked)
        for other_note in &all_notes {
            if other_note.path == note_path_buf {
                continue;
            }

            if line.contains(&other_note.title)
                && !line.contains(&format!("[[{}]]", other_note.title))
            {
                let start = line_num.saturating_sub(1);
                let end = (line_num + 2).min(lines.len());
                let context = lines[start..end].join("\n");

                // Check if we already have this mention
                if !unlinked_mentions
                    .iter()
                    .any(|m: &UnlinkedMention| m.line_number == line_num + 1)
                {
                    unlinked_mentions.push(UnlinkedMention {
                        potential_target_name: other_note.title.clone(),
                        context,
                        line_number: line_num + 1,
                        matching_notes: vec![MatchingNote {
                            name: other_note.title.clone(),
                            path: other_note.path.display().to_string(),
                        }],
                    });
                }
            }
        }
    }

    Ok(OutgoingLinksData {
        links,
        unlinked_mentions,
    })
}

/// Converts an unlinked backlink mention into an explicit `[[wikilink]]`.
///
/// Reads the source note, finds the target title on the specified line,
/// and wraps it with `[[...]]` syntax.
///
/// # Arguments
///
/// * `source_note_path` — Path of the note to modify.
/// * `target_note_path` — Path of the note being linked to.
/// * `line_number` — 1-indexed line containing the mention.
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

    // Read source note content
    let content = std::fs::read_to_string(&source_note.path)?;
    let mut lines: Vec<String> = content.lines().map(|s| s.to_string()).collect();

    // Replace the text with a wikilink on the specified line
    if line_number > 0 && line_number <= lines.len() {
        let line = &lines[line_number - 1];
        let new_line = line.replace(&target_note.title, &format!("[[{}]]", target_note.title));
        lines[line_number - 1] = new_line;

        // Write back to file
        let new_content = lines.join("\n");
        std::fs::write(&source_note.path, new_content)?;
    }

    Ok(())
}

/// Converts an unlinked outgoing mention into an explicit `[[wikilink]]`.
///
/// Similar to [`create_link_from_mention`] but operates on forward mentions
/// discovered during outgoing-link analysis.
///
/// # Arguments
///
/// * `source_note_path` — Path of the note to modify.
/// * `line_number` — 1-indexed line containing the text.
/// * `text` — Exact text to wrap with `[[...]]`.
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

    // Read source note content
    let content = std::fs::read_to_string(&source_note.path)?;
    let mut lines: Vec<String> = content.lines().map(|s| s.to_string()).collect();

    // Replace the text with a wikilink on the specified line
    if line_number > 0 && line_number <= lines.len() {
        let line = &lines[line_number - 1];
        let new_line = line.replace(&text, &format!("[[{}]]", text));
        lines[line_number - 1] = new_line;

        // Write back to file
        let new_content = lines.join("\n");
        std::fs::write(&source_note.path, new_content)?;
    }

    Ok(())
}
