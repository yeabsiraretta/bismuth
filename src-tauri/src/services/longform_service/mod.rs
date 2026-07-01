//! Longform writing service for multi-scene projects.
//!
//! Discovers projects via `longform:` frontmatter, manages scenes,
//! tracks word counts, and compiles manuscripts.

pub mod scenes;
pub mod word_count;
pub mod compiler;
pub mod drafts;

use crate::error::{BismuthError, Result};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

/// A longform writing project discovered in the vault.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LongformProject {
    pub title: String,
    pub project_type: ProjectType,
    pub root_path: String,
    pub scenes: Vec<Scene>,
    pub total_words: usize,
}

/// Project type (single or multi-scene).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProjectType {
    Single,
    Multi,
}

/// A scene in a multi-scene project.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Scene {
    pub title: String,
    pub path: String,
    pub order: usize,
    pub word_count: usize,
    pub children: Vec<Scene>,
    #[serde(default)]
    pub status: String,
    #[serde(default)]
    pub draft_count: usize,
}

/// Longform service bound to vault.
pub struct LongformService {
    vault_root: PathBuf,
}

impl LongformService {
    pub fn new(vault_root: &Path) -> Self {
        Self { vault_root: vault_root.to_path_buf() }
    }

    /// Discover all longform projects in the vault.
    pub fn discover_projects(&self) -> Result<Vec<LongformProject>> {
        let mut projects = Vec::new();
        self.scan_directory(&self.vault_root, &mut projects)?;
        Ok(projects)
    }

    fn scan_directory(&self, dir: &Path, projects: &mut Vec<LongformProject>) -> Result<()> {
        let entries = std::fs::read_dir(dir)
            .map_err(|e| BismuthError::Io(format!("Scan dir: {}", e)))?;

        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                // Skip hidden dirs
                if path.file_name().map(|n| n.to_string_lossy().starts_with('.')).unwrap_or(false) {
                    continue;
                }
                self.scan_directory(&path, projects)?;
            } else if path.extension().map(|e| e == "md").unwrap_or(false) {
                if let Ok(content) = std::fs::read_to_string(&path) {
                    if let Some(project) = self.parse_project_frontmatter(&content, &path) {
                        projects.push(project);
                    }
                }
            }
        }
        Ok(())
    }

    fn parse_project_frontmatter(&self, content: &str, path: &Path) -> Option<LongformProject> {
        // Check for longform frontmatter key
        if !content.starts_with("---") {
            return None;
        }
        let end = content[3..].find("---")?;
        let fm = &content[3..3 + end];

        if !fm.contains("longform:") && !fm.contains("longform :") {
            return None;
        }

        let title = path.file_stem()?.to_string_lossy().to_string();
        let word_count = word_count::count_words(content);

        Some(LongformProject {
            title,
            project_type: ProjectType::Single,
            root_path: path.to_string_lossy().to_string(),
            scenes: vec![],
            total_words: word_count,
        })
    }
}
