//! Digital Garden publishing service (F27)
//!
//! Scans the vault for notes with `dg-publish: true` frontmatter,
//! renders them to static HTML, and deploys to a local folder or git repo.

pub mod callouts;
pub mod canvas_renderer;
pub mod deploy;
pub mod footnotes;
pub mod navigation;
pub mod renderer;
pub mod renderer_extensions;
pub mod search_index;
pub mod static_gen;
pub mod toc;

use crate::error::{BismuthError, Result};
use crate::services::FrontmatterService;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

/// Configuration for the publishing pipeline.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PublishConfig {
    pub output_dir: PathBuf,
    pub base_url: String,
    pub theme: String,
    pub target: PublishTarget,
    #[serde(default)]
    pub deploy_token: Option<String>,
    #[serde(default)]
    pub site_id: Option<String>,
    #[serde(default)]
    pub project_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PublishTarget {
    Local,
    Git,
    Vercel,
    Netlify,
}

/// A note that has been marked for publishing.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PublishableNote {
    pub path: String,
    pub title: String,
    pub slug: String,
    pub content: String,
    pub is_home: bool,
    pub pinned: bool,
    pub order: Option<i32>,
    pub tags: Vec<String>,
    pub hide_nav: bool,
    pub created: Option<String>,
    pub updated: Option<String>,
}

/// The publishing service coordinates the full publish pipeline.
pub struct PublishingService {
    vault_root: PathBuf,
    #[allow(dead_code)]
    config: PublishConfig,
}

impl PublishingService {
    pub fn new(vault_root: &Path, config: PublishConfig) -> Self {
        Self {
            vault_root: vault_root.to_path_buf(),
            config,
        }
    }

    /// Scans vault for notes with `dg-publish: true` in frontmatter.
    pub fn scan_publishable_notes(&self) -> Result<Vec<PublishableNote>> {
        let mut notes = Vec::new();
        self.walk_dir(&self.vault_root, &mut notes)?;
        notes.sort_by(|a, b| a.order.unwrap_or(999).cmp(&b.order.unwrap_or(999)));
        Ok(notes)
    }

    fn walk_dir(&self, dir: &Path, notes: &mut Vec<PublishableNote>) -> Result<()> {
        let entries = std::fs::read_dir(dir)
            .map_err(|e| BismuthError::Generic(format!("Failed to read dir: {}", e)))?;

        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                if path.file_name().map(|n| n.to_str().unwrap_or("").starts_with('.')).unwrap_or(false) {
                    continue;
                }
                self.walk_dir(&path, notes)?;
            } else if path.extension().map(|e| e == "md").unwrap_or(false) {
                if let Some(note) = self.try_parse_publishable(&path)? {
                    notes.push(note);
                }
            }
        }
        Ok(())
    }

    fn try_parse_publishable(&self, path: &Path) -> Result<Option<PublishableNote>> {
        let content = std::fs::read_to_string(path)
            .map_err(|e| BismuthError::Generic(format!("Read failed: {}", e)))?;

        let (fm, _body) = FrontmatterService::parse(&content).unwrap_or_default();
        let publish = fm.get("dg-publish")
            .or_else(|| fm.get("publish"))
            .and_then(|v| v.as_bool())
            .unwrap_or(false);

        if !publish {
            return Ok(None);
        }

        let title = fm.get("title")
            .and_then(|v| v.as_str())
            .map(String::from)
            .unwrap_or_else(|| {
                path.file_stem()
                    .and_then(|s| s.to_str())
                    .unwrap_or("Untitled")
                    .to_string()
            });

        let slug = fm.get("dg-slug")
            .and_then(|v| v.as_str())
            .map(String::from)
            .unwrap_or_else(|| title.to_lowercase().replace(' ', "-"));
        let is_home = fm.get("dg-home").and_then(|v| v.as_bool()).unwrap_or(false);
        let pinned = fm.get("dg-pinned").and_then(|v| v.as_bool()).unwrap_or(false);
        let order = fm.get("dg-order").and_then(|v| v.as_i64()).map(|v| v as i32);
        let hide_nav = fm.get("dg-hide-nav").and_then(|v| v.as_bool()).unwrap_or(false);
        let tags = fm.get("dg-tags")
            .and_then(|v| v.as_array())
            .map(|arr| arr.iter().filter_map(|v| v.as_str().map(String::from)).collect())
            .unwrap_or_default();
        let created = fm.get("created").and_then(|v| v.as_str()).map(String::from);
        let updated = fm.get("updated").and_then(|v| v.as_str()).map(String::from);

        Ok(Some(PublishableNote {
            path: path.strip_prefix(&self.vault_root)
                .unwrap_or(path)
                .to_string_lossy()
                .to_string(),
            title,
            slug,
            content,
            is_home,
            pinned,
            order,
            tags,
            hide_nav,
            created,
            updated,
        }))
    }
}
