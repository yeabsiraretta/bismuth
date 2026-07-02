//! Wikilink resolution, rename propagation, and unlinked-reference discovery.
//!
//! Provides the logic for:
//! - Updating `[[wikilinks]]` across the vault when a note is renamed
//! - Resolving link targets to filesystem paths
//! - Finding unlinked textual mentions of note titles

use crate::error::{BismuthError, Result};
use crate::models::Vault;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

use super::wikilink_parser::{
    extract_wikilinks, find_text_matches, replace_wikilinks, LinkMatch,
};

/// A suggestion to link to another note based on unlinked text occurrences.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LinkSuggestion {
    pub note_title: String,
    pub note_path: String,
    pub matches: Vec<LinkMatch>,
}

/// Service for wikilink operations: resolution, rename propagation, and suggestions.
pub struct WikilinkService;

impl WikilinkService {
    pub fn new() -> Self {
        Self
    }

    /// Updates all wikilinks when a note is renamed
    pub fn update_links_on_rename(
        &self,
        old_path: &Path,
        new_path: &Path,
        vault: &Vault,
    ) -> Result<Vec<PathBuf>> {
        let old_title = self.extract_title(old_path)?;
        let new_title = self.extract_title(new_path)?;

        let mut updated_files = Vec::new();

        // Scan all notes in the vault
        let notes = self.scan_vault_notes(&vault.root_path)?;

        for note_path in notes {
            if note_path == old_path || note_path == new_path {
                continue; // Skip the renamed file itself
            }

            let content = fs::read_to_string(&note_path)?;
            let updated_content = self.replace_wikilinks(&content, &old_title, &new_title);

            if content != updated_content {
                fs::write(&note_path, updated_content)?;
                updated_files.push(note_path);
            }
        }

        Ok(updated_files)
    }

    /// Extracts the note title from a file path (filename without `.md` extension).
    pub fn extract_title(&self, path: &Path) -> Result<String> {
        path.file_stem()
            .and_then(|s| s.to_str())
            .map(|s| s.to_string())
            .ok_or_else(|| BismuthError::InvalidPath(path.display().to_string()))
    }

    /// Recursively scans the vault for all `.md` files, skipping hidden directories.
    pub fn scan_vault_notes(&self, vault_path: &Path) -> Result<Vec<PathBuf>> {
        let mut notes = Vec::new();

        fn collect_notes(dir: &Path, notes: &mut Vec<PathBuf>) -> Result<()> {
            if dir.is_dir() {
                for entry in fs::read_dir(dir)? {
                    let entry = entry?;
                    let path = entry.path();

                    if path.is_dir() {
                        // Skip hidden directories
                        if let Some(name) = path.file_name() {
                            if name.to_string_lossy().starts_with('.') {
                                continue;
                            }
                        }
                        collect_notes(&path, notes)?;
                    } else if path.extension().and_then(|s| s.to_str()) == Some("md") {
                        notes.push(path);
                    }
                }
            }
            Ok(())
        }

        collect_notes(vault_path, &mut notes)?;
        Ok(notes)
    }

    /// Replaces all occurrences of old wikilink with new wikilink
    fn replace_wikilinks(&self, content: &str, old_title: &str, new_title: &str) -> String {
        replace_wikilinks(content, old_title, new_title)
    }

    /// Extracts all `[[target]]` link targets from content (ignoring aliases).
    pub fn extract_wikilinks(&self, content: &str) -> Vec<String> {
        extract_wikilinks(content)
    }

    /// Resolves a wikilink target string to an absolute file path.
    ///
    /// Matches against filenames (without extension) in the vault.
    /// Returns `None` if no matching note is found.
    pub fn resolve_wikilink(&self, link: &str, vault_path: &Path) -> Option<PathBuf> {
        let notes = self.scan_vault_notes(vault_path).ok()?;
        
        for note_path in notes {
            if let Some(stem) = note_path.file_stem() {
                if stem.to_string_lossy() == link {
                    return Some(note_path);
                }
            }
        }
        
        None
    }

    /// Finds unlinked references to other notes in the given content.
    ///
    /// Scans for note titles appearing as plain text (not inside `[[...]]`)
    /// and returns them as link suggestions.
    pub fn find_unlinked_references(
        &self,
        note_path: &Path,
        content: &str,
        vault: &Vault,
        case_sensitive: bool,
    ) -> Result<Vec<LinkSuggestion>> {
        let mut suggestions = Vec::new();
        
        // Get all notes in vault
        let all_notes = self.scan_vault_notes(&vault.root_path)?;
        
        // Extract existing wikilinks to exclude them
        let existing_links = self.extract_wikilinks(content);
        let existing_set: std::collections::HashSet<String> = 
            existing_links.iter().map(|s| s.to_lowercase()).collect();
        
        // For each note, check if its title appears in the content
        for other_note in all_notes {
            // Skip the current note
            if other_note == note_path {
                continue;
            }
            
            let title = match self.extract_title(&other_note) {
                Ok(t) => t,
                Err(_) => continue,
            };
            
            // Skip if already linked
            if existing_set.contains(&title.to_lowercase()) {
                continue;
            }
            
            // Find all occurrences of the title in the content
            let matches = self.find_text_matches(content, &title, case_sensitive);
            
            if !matches.is_empty() {
                suggestions.push(LinkSuggestion {
                    note_title: title,
                    note_path: other_note.display().to_string(),
                    matches,
                });
            }
        }
        
        Ok(suggestions)
    }

    /// Finds all matches of a search term in text, excluding those already in wikilinks
    fn find_text_matches(&self, content: &str, search: &str, case_sensitive: bool) -> Vec<LinkMatch> {
        find_text_matches(content, search, case_sensitive)
    }

    /// Returns concept suggestions for inline linking (T079/FR-258).
    ///
    /// Delegates to [`ConceptService`](crate::services::concept_service::ConceptService)
    /// for the actual scanning logic.
    pub fn get_concept_suggestions(
        &self,
        content: &str,
        vault_path: &Path,
        current_note: &Path,
    ) -> Result<Vec<crate::services::concept_service::ConceptSuggestion>> {
        crate::services::concept_service::ConceptService::get_suggestions(
            self, content, vault_path, current_note,
        )
    }

}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::services::knowledge::wikilink_parser::{extract_wikilinks, is_inside_wikilink, replace_wikilinks};

    #[test]
    fn test_replace_wikilinks() {
        let content = "This links to [[Old Note]] and [[Old Note|alias]].";
        let result = replace_wikilinks(content, "Old Note", "New Note");
        assert_eq!(result, "This links to [[New Note]] and [[New Note|alias]].");
    }

    #[test]
    fn test_extract_wikilinks() {
        let content = "Links: [[Note 1]], [[Note 2|Alias]], [[Note 3]]";
        let links = extract_wikilinks(content);
        assert_eq!(links, vec!["Note 1", "Note 2", "Note 3"]);
    }

    #[test]
    fn test_wikilink_regex_is_static() {
        let content = "Test [[link1]] and [[link2]]";

        let result1 = is_inside_wikilink(content, 6);
        let result2 = is_inside_wikilink(content, 20);
        assert!(result1);
        assert!(result2);
        assert!(!is_inside_wikilink(content, 0));
    }
}
