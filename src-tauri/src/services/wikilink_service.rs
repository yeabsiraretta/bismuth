//! Wikilink resolution and update service

use crate::error::{BismuthError, Result};
use crate::models::Vault;
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LinkSuggestion {
    pub note_title: String,
    pub note_path: String,
    pub matches: Vec<LinkMatch>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LinkMatch {
    pub text: String,
    pub start: usize,
    pub end: usize,
    pub context: String,
}

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

    /// Extracts the title from a file path (filename without extension)
    fn extract_title(&self, path: &Path) -> Result<String> {
        path.file_stem()
            .and_then(|s| s.to_str())
            .map(|s| s.to_string())
            .ok_or_else(|| BismuthError::InvalidPath(path.display().to_string()))
    }

    /// Scans vault for all markdown notes
    fn scan_vault_notes(&self, vault_path: &Path) -> Result<Vec<PathBuf>> {
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
        // Match [[old_title]] or [[old_title|alias]]
        let pattern = format!(r"\[\[{}\]\]|\[\[{}(\|[^\]]+)\]\]", 
            regex::escape(old_title), 
            regex::escape(old_title)
        );
        
        let re = Regex::new(&pattern).unwrap();
        
        re.replace_all(content, |caps: &regex::Captures| {
            if let Some(alias) = caps.get(1) {
                // Preserve alias: [[old|alias]] -> [[new|alias]]
                format!("[[{}{}]]", new_title, alias.as_str())
            } else {
                // Simple link: [[old]] -> [[new]]
                format!("[[{}]]", new_title)
            }
        }).to_string()
    }

    /// Finds all wikilinks in content
    pub fn extract_wikilinks(&self, content: &str) -> Vec<String> {
        let re = Regex::new(r"\[\[([^\]|]+)(?:\|[^\]]+)?\]\]").unwrap();
        re.captures_iter(content)
            .filter_map(|cap| cap.get(1).map(|m| m.as_str().to_string()))
            .collect()
    }

    /// Resolves a wikilink to a file path
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

    /// Finds unlinked references to other notes in the given note content
    /// Returns suggestions for potential wikilinks
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
        let mut matches = Vec::new();
        let search_lower = search.to_lowercase();
        let content_lower = content.to_lowercase();
        
        // Find all occurrences
        let mut start = 0;
        while let Some(pos) = if case_sensitive {
            content[start..].find(search)
        } else {
            content_lower[start..].find(&search_lower)
        } {
            let absolute_pos = start + pos;
            
            // Check if this occurrence is inside a wikilink
            if !self.is_inside_wikilink(content, absolute_pos) {
                // Extract context (50 chars before and after)
                let context_start = absolute_pos.saturating_sub(50);
                let context_end = (absolute_pos + search.len() + 50).min(content.len());
                let context = content[context_start..context_end].to_string();
                
                matches.push(LinkMatch {
                    text: content[absolute_pos..absolute_pos + search.len()].to_string(),
                    start: absolute_pos,
                    end: absolute_pos + search.len(),
                    context,
                });
            }
            
            start = absolute_pos + search.len();
        }
        
        matches
    }

    /// Checks if a position in the text is inside a wikilink
    fn is_inside_wikilink(&self, content: &str, pos: usize) -> bool {
        let re = Regex::new(r"\[\[([^\]]+)\]\]").unwrap();
        
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
    fn test_replace_wikilinks() {
        let service = WikilinkService::new();
        let content = "This links to [[Old Note]] and [[Old Note|alias]].";
        let result = service.replace_wikilinks(content, "Old Note", "New Note");
        assert_eq!(result, "This links to [[New Note]] and [[New Note|alias]].");
    }

    #[test]
    fn test_extract_wikilinks() {
        let service = WikilinkService::new();
        let content = "Links: [[Note 1]], [[Note 2|Alias]], [[Note 3]]";
        let links = service.extract_wikilinks(content);
        assert_eq!(links, vec!["Note 1", "Note 2", "Note 3"]);
    }
}
