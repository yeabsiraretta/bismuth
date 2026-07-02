//! Draft management for longform scenes.
//!
//! Each "new draft" snapshots a scene's current prose into a versioned file,
//! carries the working draft forward, and keeps all prior drafts as real files.
//! Draft files live alongside their scene with naming: `{scene}_draft_{n}.md`.

use crate::error::{BismuthError, Result};
use std::path::Path;
use chrono::Local;

/// A draft snapshot for a scene.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct Draft {
    pub version: usize,
    pub path: String,
    pub word_count: usize,
    pub created_at: String,
    pub label: String,
}

/// Scene status for Draft Bench-style workflow.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, PartialEq)]
pub enum SceneStatus {
    Todo,
    Drafting,
    Revising,
    Complete,
    Archived,
}

impl SceneStatus {
    pub fn from_str(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "drafting" => Self::Drafting,
            "revising" => Self::Revising,
            "complete" | "done" => Self::Complete,
            "archived" => Self::Archived,
            _ => Self::Todo,
        }
    }

    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Todo => "todo",
            Self::Drafting => "drafting",
            Self::Revising => "revising",
            Self::Complete => "complete",
            Self::Archived => "archived",
        }
    }
}

/// List existing drafts for a scene by scanning adjacent files.
pub fn list_drafts(scene_path: &Path) -> Result<Vec<Draft>> {
    let parent = scene_path.parent()
        .ok_or_else(|| BismuthError::Validation("No parent dir".to_string()))?;
    let stem = scene_path.file_stem()
        .ok_or_else(|| BismuthError::Validation("No file stem".to_string()))?
        .to_string_lossy();

    let prefix = format!("{}_draft_", stem);
    let mut drafts = Vec::new();

    if let Ok(entries) = std::fs::read_dir(parent) {
        for entry in entries.flatten() {
            let name = entry.file_name().to_string_lossy().to_string();
            if name.starts_with(&prefix) && name.ends_with(".md") {
                let version_str = &name[prefix.len()..name.len() - 3];
                if let Ok(version) = version_str.parse::<usize>() {
                    let path = entry.path();
                    let content = std::fs::read_to_string(&path).unwrap_or_default();
                    let word_count = super::word_count::count_words(&content);
                    let created = std::fs::metadata(&path)
                        .ok()
                        .and_then(|m| m.created().ok())
                        .map(|t| {
                            let dt: chrono::DateTime<Local> = t.into();
                            dt.format("%Y-%m-%d %H:%M").to_string()
                        })
                        .unwrap_or_default();

                    drafts.push(Draft {
                        version,
                        path: path.to_string_lossy().to_string(),
                        word_count,
                        created_at: created,
                        label: format!("Draft {}", version),
                    });
                }
            }
        }
    }

    drafts.sort_by_key(|d| d.version);
    Ok(drafts)
}

/// Create a new draft snapshot of the current scene content.
/// Returns the new draft and the next draft version number.
pub fn create_draft(scene_path: &Path, vault_root: &Path) -> Result<Draft> {
    // Security: validate path within vault
    if !scene_path.starts_with(vault_root) {
        return Err(BismuthError::Security(
            format!("Scene path outside vault: {}", scene_path.display()),
        ));
    }

    if !scene_path.exists() {
        return Err(BismuthError::Validation("Scene file does not exist".to_string()));
    }

    let content = std::fs::read_to_string(scene_path)
        .map_err(|e| BismuthError::Io(format!("Read scene: {}", e)))?;

    // Determine next version number
    let existing = list_drafts(scene_path)?;
    let next_version = existing.last().map(|d| d.version + 1).unwrap_or(1);

    // Build draft path
    let parent = scene_path.parent().unwrap();
    let stem = scene_path.file_stem().unwrap().to_string_lossy();
    let draft_filename = format!("{}_draft_{}.md", stem, next_version);
    let draft_path = parent.join(&draft_filename);

    // Add draft frontmatter
    let now = Local::now();
    let draft_content = format!(
        "---\ndbench-type: draft\ndbench-scene: {}\ndbench-version: {}\ndbench-created: {}\n---\n{}",
        stem,
        next_version,
        now.format("%Y-%m-%dT%H:%M:%S"),
        strip_frontmatter_for_draft(&content)
    );

    std::fs::write(&draft_path, &draft_content)
        .map_err(|e| BismuthError::Io(format!("Write draft: {}", e)))?;

    let word_count = super::word_count::count_words(&draft_content);

    Ok(Draft {
        version: next_version,
        path: draft_path.to_string_lossy().to_string(),
        word_count,
        created_at: now.format("%Y-%m-%d %H:%M").to_string(),
        label: format!("Draft {}", next_version),
    })
}

/// Update scene frontmatter status field.
pub fn update_scene_status(scene_path: &Path, status: &SceneStatus, vault_root: &Path) -> Result<()> {
    if !scene_path.starts_with(vault_root) {
        return Err(BismuthError::Security("Path outside vault".to_string()));
    }

    let content = std::fs::read_to_string(scene_path)
        .map_err(|e| BismuthError::Io(format!("Read scene: {}", e)))?;

    let updated = set_frontmatter_field(&content, "dbench-status", status.as_str());
    std::fs::write(scene_path, &updated)
        .map_err(|e| BismuthError::Io(format!("Write scene: {}", e)))?;

    Ok(())
}

/// Strip frontmatter from content for draft snapshots.
fn strip_frontmatter_for_draft(content: &str) -> &str {
    if content.starts_with("---") {
        if let Some(end) = content[3..].find("---") {
            return &content[end + 6..];
        }
    }
    content
}

/// Set a field in YAML frontmatter (creates frontmatter if absent).
fn set_frontmatter_field(content: &str, key: &str, value: &str) -> String {
    if content.starts_with("---") {
        if let Some(end) = content[3..].find("---") {
            let fm = &content[3..3 + end];
            let rest = &content[3 + end + 3..];

            // Check if key already exists
            let key_pattern = format!("{}:", key);
            if fm.contains(&key_pattern) {
                let new_fm: String = fm.lines()
                    .map(|line| {
                        if line.trim_start().starts_with(&key_pattern) {
                            format!("{}: {}", key, value)
                        } else {
                            line.to_string()
                        }
                    })
                    .collect::<Vec<_>>()
                    .join("\n");
                return format!("---{}---{}", new_fm, rest);
            } else {
                return format!("---{}\n{}: {}---{}", fm.trim_end(), key, value, rest);
            }
        }
    }
    // No frontmatter — add it
    format!("---\n{}: {}\n---\n{}", key, value, content)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_scene_status_roundtrip() {
        assert_eq!(SceneStatus::from_str("drafting"), SceneStatus::Drafting);
        assert_eq!(SceneStatus::from_str("complete"), SceneStatus::Complete);
        assert_eq!(SceneStatus::from_str("unknown"), SceneStatus::Todo);
    }

    #[test]
    fn test_set_frontmatter_field_existing() {
        let content = "---\ntitle: Test\ndbench-status: todo\n---\nContent here";
        let result = set_frontmatter_field(content, "dbench-status", "drafting");
        assert!(result.contains("dbench-status: drafting"));
        assert!(!result.contains("dbench-status: todo"));
    }

    #[test]
    fn test_set_frontmatter_field_new() {
        let content = "---\ntitle: Test\n---\nContent here";
        let result = set_frontmatter_field(content, "dbench-status", "drafting");
        assert!(result.contains("dbench-status: drafting"));
    }

    #[test]
    fn test_strip_frontmatter() {
        let content = "---\ntitle: Test\n---\nHello world";
        let stripped = strip_frontmatter_for_draft(content);
        assert_eq!(stripped.trim(), "Hello world");
    }
}
