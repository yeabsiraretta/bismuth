//! Lifecycle service (T070, T072)
//!
//! Manages note lifecycle states: captured → organized → archived.
//! Provides:
//! - `get_captured_notes()` — inbox query
//! - `quick_capture()` — fast note creation with lifecycle defaults
//! - `archive_note()` — sets archived:true and persists
//! - `organize_note()` — sets organized:true and persists

use crate::error::{BismuthError, Result};
use crate::models::note::Note;
use crate::services::frontmatter_service::{FrontmatterService, LifecycleState};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

/// Summary of captured notes for the dashboard
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CapturedNoteSummary {
    pub path: String,
    pub title: String,
    pub created: String,
    pub snippet: String,
}

/// Lifecycle state counts for dashboard stats
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LifecycleStats {
    pub captured: usize,
    pub organized: usize,
    pub archived: usize,
}

pub struct LifecycleService;

impl LifecycleService {
    /// Get all notes in the "captured" state (inbox — not organized, not archived)
    pub fn get_captured_notes(vault_root: &Path) -> Result<Vec<CapturedNoteSummary>> {
        let mut captured = Vec::new();

        Self::walk_markdown_files(vault_root, &mut |path| {
            let content = match std::fs::read_to_string(&path) {
                Ok(c) => c,
                Err(_) => return,
            };

            let (frontmatter, body) = match FrontmatterService::parse(&content) {
                Ok(r) => r,
                Err(_) => return,
            };

            if !FrontmatterService::is_captured(&frontmatter) {
                return;
            }

            let title = frontmatter
                .get("title")
                .and_then(|v| v.as_str())
                .unwrap_or_else(|| {
                    path.file_stem()
                        .and_then(|s| s.to_str())
                        .unwrap_or("Untitled")
                })
                .to_string();

            let created = frontmatter
                .get("created")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();

            let snippet = body.chars().take(120).collect::<String>();

            captured.push(CapturedNoteSummary {
                path: path.to_string_lossy().to_string(),
                title,
                created,
                snippet,
            });
        })?;

        // Sort by creation date descending (newest first)
        captured.sort_by(|a, b| b.created.cmp(&a.created));

        Ok(captured)
    }

    /// Get lifecycle statistics for the vault
    pub fn get_lifecycle_stats(vault_root: &Path) -> Result<LifecycleStats> {
        let mut stats = LifecycleStats {
            captured: 0,
            organized: 0,
            archived: 0,
        };

        Self::walk_markdown_files(vault_root, &mut |path| {
            let content = match std::fs::read_to_string(&path) {
                Ok(c) => c,
                Err(_) => return,
            };

            let (frontmatter, _) = match FrontmatterService::parse(&content) {
                Ok(r) => r,
                Err(_) => return,
            };

            match FrontmatterService::get_lifecycle_state(&frontmatter) {
                LifecycleState::Captured => stats.captured += 1,
                LifecycleState::Organized => stats.organized += 1,
                LifecycleState::Archived => stats.archived += 1,
            }
        })?;

        Ok(stats)
    }

    /// Quick-capture: creates a new note with `organized: false`, `archived: false`
    /// in the vault root. Designed to complete in <200ms.
    pub fn quick_capture(vault_root: &Path, title: Option<&str>) -> Result<Note> {
        let now = Utc::now();
        let default_title = format!("Capture {}", now.format("%Y-%m-%d %H:%M:%S"));
        let note_title = title.unwrap_or(&default_title);

        let filename = format!("{}.md", Self::sanitize_filename(note_title));
        let note_path = vault_root.join(&filename);

        if note_path.exists() {
            return Err(BismuthError::VaultError(format!(
                "Note '{}' already exists",
                note_title
            )));
        }

        let content = format!(
            "---\ntitle: \"{}\"\ncreated: {}\norganized: false\narchived: false\n---\n\n",
            note_title,
            now.to_rfc3339()
        );

        std::fs::write(&note_path, &content).map_err(|e| {
            BismuthError::VaultError(format!("Failed to create capture note: {}", e))
        })?;

        let mut frontmatter = std::collections::HashMap::new();
        frontmatter.insert(
            "title".to_string(),
            serde_json::Value::String(note_title.to_string()),
        );
        frontmatter.insert(
            "created".to_string(),
            serde_json::Value::String(now.to_rfc3339()),
        );
        frontmatter.insert("organized".to_string(), serde_json::Value::Bool(false));
        frontmatter.insert("archived".to_string(), serde_json::Value::Bool(false));

        Ok(Note {
            path: note_path,
            title: note_title.to_string(),
            content,
            frontmatter,
            created_at: now,
            modified_at: now,
        })
    }

    /// Archive a note (sets archived: true in frontmatter and writes back)
    pub fn archive_note(path: &Path) -> Result<()> {
        let content = std::fs::read_to_string(path)
            .map_err(|e| BismuthError::NotFound(format!("Note not found: {}", e)))?;

        let new_content = FrontmatterService::archive_note_content(&content)?;
        std::fs::write(path, new_content)
            .map_err(|e| BismuthError::VaultError(format!("Failed to write: {}", e)))?;

        Ok(())
    }

    /// Organize a note (sets organized: true in frontmatter and writes back)
    pub fn organize_note(path: &Path) -> Result<()> {
        let content = std::fs::read_to_string(path)
            .map_err(|e| BismuthError::NotFound(format!("Note not found: {}", e)))?;

        let new_content = FrontmatterService::organize_note_content(&content)?;
        std::fs::write(path, new_content)
            .map_err(|e| BismuthError::VaultError(format!("Failed to write: {}", e)))?;

        Ok(())
    }

    /// Walk all .md files in a directory tree, calling the visitor for each
    fn walk_markdown_files(dir: &Path, visitor: &mut dyn FnMut(PathBuf)) -> Result<()> {
        if !dir.is_dir() {
            return Ok(());
        }

        let entries = std::fs::read_dir(dir)
            .map_err(|e| BismuthError::VaultError(format!("Failed to read dir: {}", e)))?;

        for entry in entries.flatten() {
            let path = entry.path();
            // Skip hidden directories (e.g., .bismuth, .git)
            if path
                .file_name()
                .map_or(false, |n| n.to_string_lossy().starts_with('.'))
            {
                continue;
            }
            if path.is_dir() {
                Self::walk_markdown_files(&path, visitor)?;
            } else if path.extension().map_or(false, |ext| ext == "md") {
                visitor(path);
            }
        }

        Ok(())
    }

    /// Sanitize a title for use as a filename
    fn sanitize_filename(title: &str) -> String {
        title
            .chars()
            .map(|c| match c {
                '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|' => '_',
                _ => c,
            })
            .collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sanitize_filename() {
        assert_eq!(
            LifecycleService::sanitize_filename("Hello/World"),
            "Hello_World"
        );
        assert_eq!(
            LifecycleService::sanitize_filename("Normal Title"),
            "Normal Title"
        );
        assert_eq!(LifecycleService::sanitize_filename("A:B*C?D"), "A_B_C_D");
    }
}
