//! Note management operations: duplicate, move, merge, create, and frontmatter updates.

use crate::error::{BismuthError, Result};
use crate::models::{Note, Vault};
use crate::services::WikilinkService;
use std::fs;
use std::path::{Path, PathBuf};

use super::vault_operations::VaultOperations;

/// Provides higher-level note operations that compose basic CRUD.
pub(super) struct NoteManagement;

impl NoteManagement {
    /// Duplicates a note, creating a copy with " copy" suffix in the same directory.
    /// Handles filename collisions by appending an incrementing number.
    pub fn duplicate_note(
        path: &Path,
        vault: &Vault,
        operations: &VaultOperations,
    ) -> Result<Note> {
        // Read original note
        let content = fs::read_to_string(path)?;

        // Create new path in same directory with " copy" suffix
        let parent = path
            .parent()
            .ok_or_else(|| BismuthError::InvalidPath(path.display().to_string()))?;
        let stem = path
            .file_stem()
            .and_then(|s| s.to_str())
            .ok_or_else(|| BismuthError::InvalidPath(path.display().to_string()))?;
        let mut new_path = parent.join(format!("{} copy.md", stem));
        let mut counter = 2;
        while new_path.exists() {
            new_path = parent.join(format!("{} copy {}.md", stem, counter));
            counter += 1;
        }

        // Write duplicate
        fs::write(&new_path, &content)?;

        // Parse and return new note
        operations.get_note(&new_path, vault)
    }

    /// Moves a note to a new directory and updates all inbound wikilinks.
    pub fn move_note(
        old_path: &Path,
        new_dir: &Path,
        vault: &Vault,
        operations: &VaultOperations,
        wikilink_service: &WikilinkService,
    ) -> Result<Note> {
        // Get filename
        let filename = old_path
            .file_name()
            .ok_or_else(|| BismuthError::InvalidPath(old_path.display().to_string()))?;

        // Create new path
        let new_path = new_dir.join(filename);

        // Move file
        fs::rename(old_path, &new_path)?;

        // Update wikilinks
        wikilink_service.update_links_on_rename(old_path, &new_path, vault)?;

        // Parse and return moved note
        operations.get_note(&new_path, vault)
    }

    /// Merges multiple notes into one, concatenating content with separators.
    /// Source notes (other than the target) are deleted after merging.
    pub fn merge_notes(
        paths: &[PathBuf],
        target_path: &Path,
        vault: &Vault,
        operations: &VaultOperations,
    ) -> Result<Note> {
        let target_canonical = target_path
            .canonicalize()
            .unwrap_or_else(|_| target_path.to_path_buf());
        let mut merged_content = String::new();

        // Collect all content, skipping separator header for target's own content
        for path in paths {
            let content = fs::read_to_string(path)?;
            let path_canonical = path.canonicalize().unwrap_or_else(|_| path.to_path_buf());
            if path_canonical == target_canonical {
                merged_content.push_str(&content);
            } else {
                merged_content.push_str(&format!(
                    "\n\n---\n\n# From: {}\n\n",
                    path.display()
                ));
                merged_content.push_str(&content);
            }
        }

        // Write merged note
        fs::write(target_path, &merged_content)?;

        // Delete source notes (not the target)
        for path in paths {
            let path_canonical = path.canonicalize().unwrap_or_else(|_| path.to_path_buf());
            if path_canonical != target_canonical {
                fs::remove_file(path)?;
            }
        }

        // Parse and return merged note
        operations.get_note(target_path, vault)
    }

    /// Creates a new note at the given path with initial content.
    pub fn create_note(
        path: &Path,
        content: &str,
        vault: &Vault,
        operations: &VaultOperations,
    ) -> Result<Note> {
        operations.write_note(path, content, vault)?;
        operations.get_note(path, vault)
    }

    /// Creates a note from an unresolved wikilink target.
    /// Uses the default note location from vault settings.
    pub fn create_note_from_wikilink(
        title: &str,
        vault: &Vault,
        operations: &VaultOperations,
    ) -> Result<Note> {
        // Create path from title in vault root (default location)
        let filename = format!("{}.md", title);
        let note_path = vault.root_path.join(&filename);

        // Check if note already exists
        if note_path.exists() {
            return Err(BismuthError::VaultError(format!(
                "Note '{}' already exists",
                title
            )));
        }

        // Create note with basic frontmatter
        let content = format!(
            "---\ntitle: {}\ncreated: {}\n---\n\n# {}\n\n",
            title,
            chrono::Utc::now().to_rfc3339(),
            title
        );

        Self::create_note(&note_path, &content, vault, operations)
    }

    /// Updates a single frontmatter field on a note.
    /// Reads the file, parses frontmatter, sets the field, re-serializes, and writes back.
    pub fn update_frontmatter_field(
        path: &Path,
        key: &str,
        value: serde_json::Value,
        vault: &Vault,
        operations: &VaultOperations,
    ) -> Result<()> {
        use crate::services::FrontmatterService;

        let content = std::fs::read_to_string(path).map_err(|e| {
            BismuthError::NotFound(format!("Note not found: {}", e))
        })?;

        let (mut frontmatter, body) = FrontmatterService::parse(&content)?;
        FrontmatterService::set_field(&mut frontmatter, key.to_string(), value);
        let new_content = FrontmatterService::serialize(&frontmatter, &body)?;

        operations.write_note(path, &new_content, vault)
    }
}
