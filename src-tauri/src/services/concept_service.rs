//! Concept link suggestion service (T079/FR-258)
//!
//! Scans note body for substrings matching vault note titles,
//! excluding already-linked text. Returns suggestions for real-time inline linking.

use crate::error::Result;
use crate::services::wikilink_service::WikilinkService;
use serde::{Deserialize, Serialize};
use std::path::Path;

/// Concept suggestion for inline linking
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConceptSuggestion {
    /// Title of the note that matches
    pub title: String,
    /// Path to the matching note
    pub path: String,
    /// The actual text in the body that matched
    pub matched_text: String,
    /// Character offset in the note body where the match starts
    pub offset: usize,
    /// Length of the matched text
    pub length: usize,
}

pub struct ConceptService;

impl ConceptService {
    /// Get concept suggestions for inline linking.
    ///
    /// Scans note body for substrings matching vault note titles, excluding
    /// already-linked text. Returns lightweight suggestions for real-time use.
    pub fn get_suggestions(
        wikilink_service: &WikilinkService,
        content: &str,
        vault_path: &Path,
        current_note: &Path,
    ) -> Result<Vec<ConceptSuggestion>> {
        let all_notes = wikilink_service.scan_vault_notes(vault_path)?;
        let existing_links = wikilink_service.extract_wikilinks(content);
        let existing_set: std::collections::HashSet<String> =
            existing_links.iter().map(|s| s.to_lowercase()).collect();

        let mut suggestions = Vec::new();

        for note in all_notes {
            if note == current_note {
                continue;
            }

            let title = match wikilink_service.extract_title(&note) {
                Ok(t) => t,
                Err(_) => continue,
            };

            // Skip single-character titles and already-linked
            if title.len() < 2 || existing_set.contains(&title.to_lowercase()) {
                continue;
            }

            // Case-insensitive search
            let content_lower = content.to_lowercase();
            let title_lower = title.to_lowercase();

            let mut start = 0;
            while let Some(pos) = content_lower[start..].find(&title_lower) {
                let abs_pos = start + pos;

                // Skip if inside existing wikilink
                if !Self::is_inside_wikilink(content, abs_pos) {
                    // Verify word boundary (don't match partial words)
                    let before_ok = abs_pos == 0
                        || !content.as_bytes()[abs_pos - 1].is_ascii_alphanumeric();
                    let after_pos = abs_pos + title.len();
                    let after_ok = after_pos >= content.len()
                        || !content.as_bytes()[after_pos].is_ascii_alphanumeric();

                    if before_ok && after_ok {
                        suggestions.push(ConceptSuggestion {
                            title: title.clone(),
                            path: note.to_string_lossy().to_string(),
                            matched_text: content[abs_pos..abs_pos + title.len()].to_string(),
                            offset: abs_pos,
                            length: title.len(),
                        });
                    }
                }

                start = abs_pos + title.len();
            }
        }

        // Sort by offset for sequential presentation
        suggestions.sort_by_key(|s| s.offset);
        Ok(suggestions)
    }

    /// Checks if a position in the text is inside a wikilink
    fn is_inside_wikilink(content: &str, pos: usize) -> bool {
        let re = regex::Regex::new(r"\[\[([^\]]+)\]\]").unwrap();
        for cap in re.captures_iter(content) {
            if let Some(m) = cap.get(0) {
                if pos >= m.start() && pos < m.end() {
                    return true;
                }
            }
        }
        false
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_inside_wikilink() {
        let content = "Hello [[World]] and more text";
        assert!(ConceptService::is_inside_wikilink(content, 8)); // "W" in [[World]]
        assert!(!ConceptService::is_inside_wikilink(content, 0)); // "H" outside
        assert!(!ConceptService::is_inside_wikilink(content, 20)); // "m" outside
    }
}
