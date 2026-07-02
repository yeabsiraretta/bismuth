//! Backlink indexing helpers — pure scanning functions without IPC concerns.
//!
//! These functions operate on vault note content to find wikilinks and
//! plain-text mentions. They are called by the Tauri command handlers in
//! `backlinks.rs`.

use super::backlinks::{BacklinksData, Link, Mention, OutgoingLinksData, UnlinkedMention, MatchingNote};
use crate::error::Result;
use crate::models::note::Note;
use std::path::PathBuf;

/// Scans all vault notes to find linked and unlinked mentions of the target note.
pub(super) fn scan_backlinks(
    all_notes: &[Note],
    note_path: &PathBuf,
    note_title: &str,
) -> Result<BacklinksData> {
    let mut linked_mentions = Vec::new();
    let mut unlinked_mentions = Vec::new();

    for other_note in all_notes {
        if other_note.path == *note_path {
            continue;
        }

        let content = std::fs::read_to_string(&other_note.path)?;
        let lines: Vec<&str> = content.lines().collect();

        for (line_num, line) in lines.iter().enumerate() {
            if line.contains(&format!("[[{}]]", note_title)) {
                let start = line_num.saturating_sub(3);
                let end = (line_num + 4).min(lines.len());
                let context = lines[start..end].join("\n");
                linked_mentions.push(Mention {
                    note_path: other_note.path.display().to_string(),
                    note_name: other_note.title.clone(),
                    context,
                    line_number: line_num + 1,
                });
            } else if line.contains(note_title)
                && !line.contains(&format!("[[{}]]", note_title))
            {
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

    Ok(BacklinksData { linked_mentions, unlinked_mentions })
}

/// Extracts outgoing wikilinks and unlinked mentions from a single note's content.
pub(super) fn extract_outgoing_links(
    all_notes: &[Note],
    note_path: &PathBuf,
    note_content: &str,
) -> Result<OutgoingLinksData> {
    let mut links = Vec::new();
    let mut unlinked_mentions = Vec::new();
    let lines: Vec<&str> = note_content.lines().collect();
    let wikilink_re = regex::Regex::new(r"\[\[([^\]]+)\]\]").unwrap();

    for (line_num, line) in lines.iter().enumerate() {
        for cap in wikilink_re.captures_iter(line) {
            let link_text = cap.get(1).unwrap().as_str();
            let resolved = all_notes.iter().find(|n| {
                n.title == link_text
                    || n.path.file_stem().and_then(|s| s.to_str()) == Some(link_text)
            });

            if let Some(target) = resolved {
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

        for other_note in all_notes {
            if other_note.path == *note_path {
                continue;
            }
            if line.contains(&other_note.title)
                && !line.contains(&format!("[[{}]]", other_note.title))
                && !unlinked_mentions
                    .iter()
                    .any(|m: &UnlinkedMention| m.line_number == line_num + 1)
            {
                let start = line_num.saturating_sub(1);
                let end = (line_num + 2).min(lines.len());
                let context = lines[start..end].join("\n");
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

    Ok(OutgoingLinksData { links, unlinked_mentions })
}
