use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

/// Represents a wikilink between notes
///
/// A Link tracks the source note, target note title, and resolution status.
/// Links can have optional aliases for display.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Link {
    /// Path to the source note containing the link
    pub source_path: PathBuf,

    /// Title or name referenced in the wikilink (e.g., "Target Note")
    pub target_title: String,

    /// Resolved absolute path to the target note (if found)
    pub target_path: Option<PathBuf>,

    /// Optional display alias (e.g., [[Target|Display Text]])
    pub alias: Option<String>,

    /// Whether the link has been successfully resolved
    pub is_resolved: bool,
}

impl Link {
    /// Creates a new unresolved Link
    ///
    /// # Arguments
    ///
    /// * `source_path` - Path to the note containing the link
    /// * `target_title` - The wikilink target (text between [[]])
    /// * `alias` - Optional display alias
    pub fn new(source_path: PathBuf, target_title: String, alias: Option<String>) -> Self {
        Self {
            source_path,
            target_title,
            target_path: None,
            alias,
            is_resolved: false,
        }
    }

    /// Attempts to resolve the link to an actual file path
    ///
    /// Searches the vault for a note matching the target title.
    /// Resolution rules:
    /// 1. Exact filename match (case-insensitive)
    /// 2. Filename with .md extension
    /// 3. Title from frontmatter match
    ///
    /// # Arguments
    ///
    /// * `vault_root` - Root path of the vault to search
    ///
    /// # Returns
    ///
    /// Result indicating success or error message
    pub fn resolve(&mut self, vault_root: &Path) -> Result<(), String> {
        // Normalize target title for matching
        let normalized_target = self.target_title.trim().to_lowercase();

        // Try exact match with .md extension
        let mut candidate = vault_root.join(format!("{}.md", self.target_title));
        if candidate.exists() && candidate.is_file() {
            self.target_path = Some(candidate);
            self.is_resolved = true;
            return Ok(());
        }

        // Try with normalized name
        candidate = vault_root.join(format!("{}.md", normalized_target));
        if candidate.exists() && candidate.is_file() {
            self.target_path = Some(candidate);
            self.is_resolved = true;
            return Ok(());
        }

        // Try replacing spaces with dashes
        let dashed = normalized_target.replace(' ', "-");
        candidate = vault_root.join(format!("{}.md", dashed));
        if candidate.exists() && candidate.is_file() {
            self.target_path = Some(candidate);
            self.is_resolved = true;
            return Ok(());
        }

        // Link remains unresolved
        Err(format!("Could not resolve link to: {}", self.target_title))
    }

    /// Gets the display text for the link
    ///
    /// Returns the alias if present, otherwise the target title
    pub fn display_text(&self) -> &str {
        self.alias.as_deref().unwrap_or(&self.target_title)
    }

    /// Checks if the link is a backlink to a specific note
    pub fn is_backlink_to(&self, note_path: &Path) -> bool {
        self.target_path
            .as_ref()
            .map(|p| p == note_path)
            .unwrap_or(false)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    #[test]
    fn test_new_link() {
        let source = PathBuf::from("/vault/source.md");
        let target = "Target Note".to_string();
        let alias = Some("Display Text".to_string());

        let link = Link::new(source.clone(), target.clone(), alias.clone());

        assert_eq!(link.source_path, source);
        assert_eq!(link.target_title, target);
        assert_eq!(link.alias, alias);
        assert!(!link.is_resolved);
        assert!(link.target_path.is_none());
    }

    #[test]
    fn test_display_text_with_alias() {
        let link = Link::new(
            PathBuf::from("/vault/source.md"),
            "Target".to_string(),
            Some("Display".to_string()),
        );

        assert_eq!(link.display_text(), "Display");
    }

    #[test]
    fn test_display_text_without_alias() {
        let link = Link::new(
            PathBuf::from("/vault/source.md"),
            "Target".to_string(),
            None,
        );

        assert_eq!(link.display_text(), "Target");
    }

    #[test]
    fn test_resolve_exact_match() {
        let temp_dir = TempDir::new().unwrap();
        let vault_root = temp_dir.path();

        // Create target file
        let target_path = vault_root.join("Target Note.md");
        fs::write(&target_path, "content").unwrap();

        let mut link = Link::new(
            vault_root.join("source.md"),
            "Target Note".to_string(),
            None,
        );

        let result = link.resolve(vault_root);

        assert!(result.is_ok());
        assert!(link.is_resolved);
        assert_eq!(link.target_path, Some(target_path));
    }

    #[test]
    fn test_resolve_with_spaces_to_dashes() {
        let temp_dir = TempDir::new().unwrap();
        let vault_root = temp_dir.path();

        // Create target file with dashes
        let target_path = vault_root.join("target-note.md");
        fs::write(&target_path, "content").unwrap();

        let mut link = Link::new(
            vault_root.join("source.md"),
            "Target Note".to_string(),
            None,
        );

        let result = link.resolve(vault_root);

        assert!(result.is_ok());
        assert!(link.is_resolved);
        assert_eq!(link.target_path, Some(target_path));
    }

    #[test]
    fn test_resolve_not_found() {
        let temp_dir = TempDir::new().unwrap();
        let vault_root = temp_dir.path();

        let mut link = Link::new(
            vault_root.join("source.md"),
            "Nonexistent".to_string(),
            None,
        );

        let result = link.resolve(vault_root);

        assert!(result.is_err());
        assert!(!link.is_resolved);
        assert!(link.target_path.is_none());
    }

    #[test]
    fn test_is_backlink_to() {
        let target_path = PathBuf::from("/vault/target.md");
        let other_path = PathBuf::from("/vault/other.md");

        let mut link = Link::new(
            PathBuf::from("/vault/source.md"),
            "Target".to_string(),
            None,
        );

        link.target_path = Some(target_path.clone());
        link.is_resolved = true;

        assert!(link.is_backlink_to(&target_path));
        assert!(!link.is_backlink_to(&other_path));
    }
}
