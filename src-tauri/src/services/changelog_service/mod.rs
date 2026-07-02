//! Vault changelog — logs file creates/modifications with metadata.
//!
//! Stored as `.bismuth/changelog.json` in the vault root.
//! Auto-prunes when exceeding configurable max entries.

use crate::error::{BismuthError, Result};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

/// Single changelog entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChangelogEntry {
    pub path: String,
    pub action: ChangelogAction,
    pub timestamp: DateTime<Utc>,
    pub words_delta: i64,
}

/// Type of change
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ChangelogAction {
    Created,
    Modified,
    Deleted,
    Renamed,
}

/// In-memory changelog state
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Changelog {
    pub entries: Vec<ChangelogEntry>,
    #[serde(default = "default_max_entries")]
    pub max_entries: usize,
}

fn default_max_entries() -> usize {
    1000
}

impl Changelog {
    /// Loads changelog from vault's `.bismuth/changelog.json`.
    pub fn load(vault_root: &Path) -> Result<Self> {
        let path = Self::file_path(vault_root);
        if !path.exists() {
            return Ok(Self {
                entries: Vec::new(),
                max_entries: default_max_entries(),
            });
        }
        let content = fs::read_to_string(&path)
            .map_err(|e| BismuthError::VaultError(format!("Failed to read changelog: {}", e)))?;
        let changelog: Self = serde_json::from_str(&content)
            .map_err(|e| BismuthError::VaultError(format!("Failed to parse changelog: {}", e)))?;
        Ok(changelog)
    }

    /// Persists changelog to disk.
    pub fn save(&self, vault_root: &Path) -> Result<()> {
        let path = Self::file_path(vault_root);
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }
        let content = serde_json::to_string_pretty(self)
            .map_err(|e| BismuthError::VaultError(format!("Failed to serialize changelog: {}", e)))?;
        fs::write(&path, content)?;
        Ok(())
    }

    /// Appends an entry, auto-pruning oldest if over max.
    pub fn append(&mut self, entry: ChangelogEntry) {
        self.entries.push(entry);
        self.prune();
    }

    /// Removes oldest entries beyond max_entries.
    fn prune(&mut self) {
        if self.entries.len() > self.max_entries {
            let excess = self.entries.len() - self.max_entries;
            self.entries.drain(0..excess);
        }
    }

    /// Returns recent entries (newest first), limited to `limit`.
    pub fn recent(&self, limit: usize) -> Vec<&ChangelogEntry> {
        self.entries.iter().rev().take(limit).collect()
    }

    /// Path to the changelog file.
    fn file_path(vault_root: &Path) -> PathBuf {
        use crate::config::constants::filesystem::VAULT_DIR_NAME;
        vault_root.join(VAULT_DIR_NAME).join("changelog.json")
    }
}

/// Counts words in text (simple split on whitespace).
pub fn word_count(text: &str) -> usize {
    text.split_whitespace().count()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_append_and_prune() {
        let mut cl = Changelog {
            entries: Vec::new(),
            max_entries: 3,
        };
        for i in 0..5 {
            cl.append(ChangelogEntry {
                path: format!("note{}.md", i),
                action: ChangelogAction::Modified,
                timestamp: Utc::now(),
                words_delta: i as i64,
            });
        }
        assert_eq!(cl.entries.len(), 3);
        assert_eq!(cl.entries[0].path, "note2.md");
    }

    #[test]
    fn test_recent() {
        let mut cl = Changelog {
            entries: Vec::new(),
            max_entries: 100,
        };
        for i in 0..10 {
            cl.append(ChangelogEntry {
                path: format!("note{}.md", i),
                action: ChangelogAction::Created,
                timestamp: Utc::now(),
                words_delta: 0,
            });
        }
        let recent = cl.recent(3);
        assert_eq!(recent.len(), 3);
        assert_eq!(recent[0].path, "note9.md");
    }

    #[test]
    fn test_word_count() {
        assert_eq!(word_count("hello world foo"), 3);
        assert_eq!(word_count(""), 0);
    }
}
