//! Lifecycle service (T070, T072)
//!
//! Manages note lifecycle states: captured → organized → archived.

mod startup_helpers;

use startup_helpers::{walk_markdown_files, sanitize_filename};

use crate::error::{BismuthError, Result};
use crate::models::note::Note;
use crate::services::frontmatter_service::{FrontmatterService, LifecycleState};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CapturedNoteSummary {
    pub path: String,
    pub title: String,
    pub created: String,
    pub snippet: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LifecycleStats {
    pub captured: usize,
    pub organized: usize,
    pub archived: usize,
}

pub struct LifecycleService;

impl LifecycleService {
    pub fn get_captured_notes(vault_root: &Path) -> Result<Vec<CapturedNoteSummary>> {
        let mut captured = Vec::new();
        walk_markdown_files(vault_root, &mut |path| {
            let content = match std::fs::read_to_string(&path) { Ok(c) => c, Err(_) => return };
            let (frontmatter, body) = match FrontmatterService::parse(&content) { Ok(r) => r, Err(_) => return };
            if !FrontmatterService::is_captured(&frontmatter) { return; }
            let title = frontmatter.get("title").and_then(|v| v.as_str())
                .unwrap_or_else(|| path.file_stem().and_then(|s| s.to_str()).unwrap_or("Untitled")).to_string();
            let created = frontmatter.get("created").and_then(|v| v.as_str()).unwrap_or("").to_string();
            let snippet = body.chars().take(120).collect::<String>();
            captured.push(CapturedNoteSummary { path: path.to_string_lossy().to_string(), title, created, snippet });
        })?;
        captured.sort_by(|a, b| b.created.cmp(&a.created));
        Ok(captured)
    }

    pub fn get_lifecycle_stats(vault_root: &Path) -> Result<LifecycleStats> {
        let mut stats = LifecycleStats { captured: 0, organized: 0, archived: 0 };
        walk_markdown_files(vault_root, &mut |path| {
            let content = match std::fs::read_to_string(&path) { Ok(c) => c, Err(_) => return };
            let (frontmatter, _) = match FrontmatterService::parse(&content) { Ok(r) => r, Err(_) => return };
            match FrontmatterService::get_lifecycle_state(&frontmatter) {
                LifecycleState::Captured => stats.captured += 1,
                LifecycleState::Organized => stats.organized += 1,
                LifecycleState::Archived => stats.archived += 1,
            }
        })?;
        Ok(stats)
    }

    pub fn quick_capture(vault_root: &Path, title: Option<&str>) -> Result<Note> {
        let now = Utc::now();
        let default_title = format!("Capture {}", now.format("%Y-%m-%d %H:%M:%S"));
        let note_title = title.unwrap_or(&default_title);
        let filename = format!("{}.md", sanitize_filename(note_title));
        let note_path = vault_root.join(&filename);
        if note_path.exists() {
            return Err(BismuthError::VaultError(format!("Note '{}' already exists", note_title)));
        }
        let timestamp = now.to_rfc3339();
        let content = format!(
            "---\ntitle: \"{}\"\ncreated: {}\nmodified: {}\ntags: []\naliases: []\nbismuth:\n  lifecycle: captured\n  captured_at: {}\n---\n\n",
            note_title, timestamp, timestamp, timestamp
        );
        std::fs::write(&note_path, &content)
            .map_err(|e| BismuthError::VaultError(format!("Failed to create capture note: {}", e)))?;
        let mut frontmatter = std::collections::HashMap::new();
        frontmatter.insert("title".to_string(), serde_json::Value::String(note_title.to_string()));
        frontmatter.insert("created".to_string(), serde_json::Value::String(timestamp.clone()));
        frontmatter.insert("modified".to_string(), serde_json::Value::String(timestamp.clone()));
        frontmatter.insert("tags".to_string(), serde_json::Value::Array(vec![]));
        frontmatter.insert("aliases".to_string(), serde_json::Value::Array(vec![]));
        let mut bismuth_map = serde_json::Map::new();
        bismuth_map.insert("lifecycle".to_string(), serde_json::Value::String("captured".to_string()));
        bismuth_map.insert("captured_at".to_string(), serde_json::Value::String(timestamp));
        frontmatter.insert("bismuth".to_string(), serde_json::Value::Object(bismuth_map));
        Ok(Note { path: note_path, title: note_title.to_string(), content, frontmatter, created_at: now, modified_at: now })
    }

    pub fn archive_note(path: &Path) -> Result<()> {
        let content = std::fs::read_to_string(path)
            .map_err(|e| BismuthError::NotFound(format!("Note not found: {}", e)))?;
        let new_content = FrontmatterService::archive_note_content(&content)?;
        std::fs::write(path, new_content)
            .map_err(|e| BismuthError::VaultError(format!("Failed to write: {}", e)))
    }

    pub fn organize_note(path: &Path) -> Result<()> {
        let content = std::fs::read_to_string(path)
            .map_err(|e| BismuthError::NotFound(format!("Note not found: {}", e)))?;
        let new_content = FrontmatterService::organize_note_content(&content)?;
        std::fs::write(path, new_content)
            .map_err(|e| BismuthError::VaultError(format!("Failed to write: {}", e)))
    }

    pub fn set_lifecycle_state(path: &Path, state: &str) -> Result<()> {
        let content = std::fs::read_to_string(path)
            .map_err(|e| BismuthError::NotFound(format!("Note not found: {}", e)))?;
        let (mut frontmatter, body) = FrontmatterService::parse(&content)?;
        let lifecycle = match state {
            "captured" => LifecycleState::Captured,
            "organized" => LifecycleState::Organized,
            "archived" => LifecycleState::Archived,
            _ => return Err(BismuthError::Generic(format!(
                "Invalid lifecycle state: '{}'. Must be captured, organized, or archived.", state
            ))),
        };
        FrontmatterService::set_lifecycle(&mut frontmatter, &lifecycle);
        let new_content = FrontmatterService::serialize(&frontmatter, &body)?;
        std::fs::write(path, new_content)
            .map_err(|e| BismuthError::VaultError(format!("Failed to write: {}", e)))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use startup_helpers::sanitize_filename;

    #[test]
    fn test_sanitize_filename() {
        assert_eq!(sanitize_filename("Hello/World"), "Hello_World");
        assert_eq!(sanitize_filename("Normal Title"), "Normal Title");
        assert_eq!(sanitize_filename("A:B*C?D"), "A_B_C_D");
    }

    #[test]
    fn test_set_lifecycle_state_atomic() {
        let tmp = tempfile::TempDir::new().unwrap();
        let note_path = tmp.path().join("test.md");
        std::fs::write(&note_path, "---\ntitle: Test\norganized: false\narchived: false\n---\nContent").unwrap();
        LifecycleService::set_lifecycle_state(&note_path, "organized").unwrap();
        let content = std::fs::read_to_string(&note_path).unwrap();
        assert!(content.contains("lifecycle: organized") || content.contains("lifecycle: \"organized\""));
        LifecycleService::set_lifecycle_state(&note_path, "archived").unwrap();
        let content = std::fs::read_to_string(&note_path).unwrap();
        assert!(content.contains("lifecycle: archived") || content.contains("lifecycle: \"archived\""));
        LifecycleService::set_lifecycle_state(&note_path, "captured").unwrap();
        let content = std::fs::read_to_string(&note_path).unwrap();
        assert!(content.contains("lifecycle: captured") || content.contains("lifecycle: \"captured\""));
    }

    #[test]
    fn test_set_lifecycle_state_invalid() {
        let tmp = tempfile::TempDir::new().unwrap();
        let note_path = tmp.path().join("test.md");
        std::fs::write(&note_path, "---\ntitle: Test\n---\nContent").unwrap();
        assert!(LifecycleService::set_lifecycle_state(&note_path, "invalid").is_err());
    }
}
