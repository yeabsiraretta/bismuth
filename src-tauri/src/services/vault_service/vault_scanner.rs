//! Directory-tree scanner for markdown notes.
//!
//! Recursively walks the vault directory, parses each `.md` file into a
//! [`Note`], and upserts metadata into the SQLite database.
//!
//! Uses an in-memory cache keyed by `(path, mtime)` so that unchanged
//! files are not re-read or re-parsed on subsequent scans.

use crate::db::Database;
use crate::error::Result;
use crate::models::{Note, NoteMeta, Vault};
use crate::utils::is_within_vault;
use regex::Regex;
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::SystemTime;

/// Entry in the scan cache — stores a parsed Note alongside its filesystem mtime.
struct CachedNote {
    note: Note,
    mtime: SystemTime,
}

/// Scans the vault filesystem and indexes note metadata into the database.
/// Maintains an in-memory cache so unchanged files are not re-read.
pub struct VaultScanner {
    db: Arc<Database>,
    cache: HashMap<PathBuf, CachedNote>,
}

impl VaultScanner {
    /// Creates a new scanner with database access.
    pub fn new(db: Arc<Database>) -> Self {
        Self {
            db,
            cache: HashMap::new(),
        }
    }

    /// Performs a cached scan of the vault, returning all parsed notes.
    ///
    /// Only files whose mtime has changed since the last scan are re-read
    /// and re-parsed. Deleted files are evicted from the cache.
    pub fn scan(&mut self, vault: &Vault) -> Result<Vec<Note>> {
        let mut current_paths: HashMap<PathBuf, SystemTime> = HashMap::new();
        self.collect_paths(&vault.root_path, vault, &mut current_paths)?;

        let mut changed_notes: Vec<Note> = Vec::new();

        for (path, mtime) in &current_paths {
            let needs_read = match self.cache.get(path) {
                Some(cached) => cached.mtime != *mtime,
                None => true,
            };

            if needs_read {
                if let Ok(content) = fs::read_to_string(path) {
                    let note = Note::new(path.clone(), content);
                    changed_notes.push(note.clone());
                    self.cache.insert(path.clone(), CachedNote {
                        note,
                        mtime: *mtime,
                    });
                }
            }
        }

        // Evict deleted files from cache and DB
        let deleted: Vec<PathBuf> = self.cache.keys()
            .filter(|p| !current_paths.contains_key(*p))
            .cloned().collect();
        self.cache.retain(|p, _| current_paths.contains_key(p));
        if !deleted.is_empty() {
            let conn = self.db.conn();
            let conn = conn.lock().unwrap();
            for path in &deleted {
                let p = path.to_string_lossy();
                let _ = conn.execute("DELETE FROM links WHERE source_path = ?", [p.as_ref()]);
                let _ = conn.execute("DELETE FROM notes WHERE path = ?", [p.as_ref()]);
            }
        }

        // Only upsert changed notes to the database (not the full set)
        if !changed_notes.is_empty() {
            let all_paths: Vec<PathBuf> = current_paths.keys().cloned().collect();
            let conn = self.db.conn();
            let conn = conn.lock().unwrap();

            for note in &changed_notes {
                let frontmatter_json = serde_json::to_string(&note.frontmatter)?;

                conn.execute(
                    "INSERT OR REPLACE INTO notes (path, title, frontmatter_json, created_at, modified_at)
                     VALUES (?, ?, ?, ?, ?)",
                    (
                        note.path.to_string_lossy().as_ref(),
                        &note.title,
                        &frontmatter_json,
                        note.created_at.timestamp(),
                        note.modified_at.timestamp(),
                    ),
                )?;

                // Upsert wikilinks for this note
                conn.execute(
                    "DELETE FROM links WHERE source_path = ?",
                    [note.path.to_string_lossy().as_ref()],
                )?;
                let links = Self::extract_wikilinks(&note.content);
                for (target_title, _alias) in &links {
                    let resolved = Self::resolve_link(target_title, &vault.root_path, &all_paths);
                    conn.execute(
                        "INSERT INTO links (source_path, target_title, target_path, is_resolved)
                         VALUES (?, ?, ?, ?)",
                        (
                            note.path.to_string_lossy().as_ref(),
                            target_title.as_str(),
                            resolved.as_ref().map(|p| p.to_string_lossy().to_string()),
                            if resolved.is_some() { 1 } else { 0 },
                        ),
                    )?;
                }
            }

            tracing::debug!(
                "Scan cache: {} changed, {} total, {} cached",
                changed_notes.len(),
                current_paths.len(),
                self.cache.len(),
            );
        }

        // Return all cached notes (the full set)
        Ok(self.cache.values().map(|c| c.note.clone()).collect())
    }

    /// Invalidates the entire cache, forcing a full re-read on next scan.
    pub fn invalidate(&mut self) {
        self.cache.clear();
    }

    /// Performs a cached scan and returns metadata only (no content).
    /// Internally runs the same scan logic to keep the cache warm,
    /// but strips content from the IPC payload — typically 10-50x smaller.
    pub fn scan_meta(&mut self, vault: &Vault) -> Result<Vec<NoteMeta>> {
        // Reuse full scan to keep cache populated for subsequent get_cached_note calls
        let notes = self.scan(vault)?;
        Ok(notes.iter().map(NoteMeta::from).collect())
    }

    /// Returns a cached note by path, falling back to disk read if not cached.
    pub fn get_cached_note(&self, path: &Path) -> Option<Note> {
        self.cache.get(path).map(|c| c.note.clone())
    }

    /// Extracts wikilinks from note content. Returns (target_title, optional alias).
    fn extract_wikilinks(content: &str) -> Vec<(String, Option<String>)> {
        let re = Regex::new(r"\[\[([^\[\]]+?)\]\]").unwrap();
        let mut links = Vec::new();
        for cap in re.captures_iter(content) {
            let inner = &cap[1];
            // Skip embeds like ![[image.png]]
            if inner.contains('.') && !inner.contains('/') {
                let ext = inner.rsplit('.').next().unwrap_or("");
                if matches!(ext, "png" | "jpg" | "jpeg" | "gif" | "svg" | "webp" | "pdf" | "mp3" | "mp4") {
                    continue;
                }
            }
            if let Some((target, alias)) = inner.split_once('|') {
                links.push((target.trim().to_string(), Some(alias.trim().to_string())));
            } else {
                links.push((inner.trim().to_string(), None));
            }
        }
        links
    }

    /// Resolves a wikilink target title to a vault path.
    /// Strips heading anchors (`#heading`, `#^blockref`) before matching.
    fn resolve_link(target: &str, vault_root: &Path, all_paths: &[PathBuf]) -> Option<PathBuf> {
        // Strip heading/block anchors: "Note#heading" → "Note"
        let base = target.split('#').next().unwrap_or(target).trim();
        if base.is_empty() {
            return None;
        }
        let lower = base.to_lowercase();

        // Match by file stem (handles [[Note]] regardless of folder depth)
        for path in all_paths {
            let stem = path.file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("");
            if stem.to_lowercase() == lower {
                return Some(path.clone());
            }
        }

        // For path-based links like [[folder/Note]], match by path suffix
        if base.contains('/') {
            let suffix = format!("{}{}", std::path::MAIN_SEPARATOR, format!("{}.md", base));
            let suffix_lower = suffix.to_lowercase();
            for path in all_paths {
                let p = path.to_string_lossy();
                if p.to_lowercase().ends_with(&suffix_lower) {
                    return Some(path.clone());
                }
            }
        }

        // Try with .md appended as direct path
        let candidate = vault_root.join(format!("{}.md", base));
        if candidate.exists() {
            return Some(candidate);
        }
        None
    }

    /// Collects all `.md` file paths with their mtimes (cheap: stat only, no read).
    fn collect_paths(
        &self,
        dir: &Path,
        vault: &Vault,
        out: &mut HashMap<PathBuf, SystemTime>,
    ) -> Result<()> {
        // Skip hidden directories (e.g. .git, .obsidian, .bismuth)
        if let Some(name) = dir.file_name() {
            if name.to_string_lossy().starts_with('.') {
                return Ok(());
            }
        }

        for entry in fs::read_dir(dir)? {
            let entry = entry?;
            let path = entry.path();

            if path.is_dir() {
                self.collect_paths(&path, vault, out)?;
            } else if path.extension().and_then(|s| s.to_str()) == Some("md") {
                if is_within_vault(&path, &vault.root_path) {
                    if let Ok(meta) = fs::metadata(&path) {
                        let mtime = meta.modified().unwrap_or(SystemTime::UNIX_EPOCH);
                        out.insert(path, mtime);
                    }
                }
            }
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    #[test]
    fn extract_simple_wikilinks() {
        let content = "See [[Note A]] and [[Note B]].";
        let links = VaultScanner::extract_wikilinks(content);
        assert_eq!(links.len(), 2);
        assert_eq!(links[0].0, "Note A");
        assert_eq!(links[1].0, "Note B");
    }

    #[test]
    fn extract_wikilink_with_alias() {
        let content = "See [[Target|display text]].";
        let links = VaultScanner::extract_wikilinks(content);
        assert_eq!(links.len(), 1);
        assert_eq!(links[0].0, "Target");
        assert_eq!(links[0].1.as_deref(), Some("display text"));
    }

    #[test]
    fn extract_wikilink_skips_media_embeds() {
        let content = "![[image.png]] and [[Note]]";
        let links = VaultScanner::extract_wikilinks(content);
        assert_eq!(links.len(), 1);
        assert_eq!(links[0].0, "Note");
    }

    #[test]
    fn extract_wikilink_with_heading() {
        let content = "See [[Note#Section]] and [[Other#^blockref]].";
        let links = VaultScanner::extract_wikilinks(content);
        assert_eq!(links.len(), 2);
        assert_eq!(links[0].0, "Note#Section");
        assert_eq!(links[1].0, "Other#^blockref");
    }

    #[test]
    fn resolve_link_simple() {
        let dir = TempDir::new().unwrap();
        let note = dir.path().join("My Note.md");
        fs::write(&note, "content").unwrap();
        let paths = vec![note.clone()];
        let result = VaultScanner::resolve_link("My Note", dir.path(), &paths);
        assert_eq!(result, Some(note));
    }

    #[test]
    fn resolve_link_case_insensitive() {
        let dir = TempDir::new().unwrap();
        let note = dir.path().join("My Note.md");
        fs::write(&note, "content").unwrap();
        let paths = vec![note.clone()];
        let result = VaultScanner::resolve_link("my note", dir.path(), &paths);
        assert_eq!(result, Some(note));
    }

    #[test]
    fn resolve_link_strips_heading_anchor() {
        let dir = TempDir::new().unwrap();
        let note = dir.path().join("Target.md");
        fs::write(&note, "content").unwrap();
        let paths = vec![note.clone()];
        let result = VaultScanner::resolve_link("Target#Some Heading", dir.path(), &paths);
        assert_eq!(result, Some(note));
    }

    #[test]
    fn resolve_link_strips_block_ref() {
        let dir = TempDir::new().unwrap();
        let note = dir.path().join("Target.md");
        fs::write(&note, "content").unwrap();
        let paths = vec![note.clone()];
        let result = VaultScanner::resolve_link("Target#^abc123", dir.path(), &paths);
        assert_eq!(result, Some(note));
    }

    #[test]
    fn resolve_link_empty_after_hash_returns_none() {
        let dir = TempDir::new().unwrap();
        let paths: Vec<PathBuf> = vec![];
        let result = VaultScanner::resolve_link("#heading-only", dir.path(), &paths);
        assert_eq!(result, None);
    }

    #[test]
    fn resolve_link_not_found() {
        let dir = TempDir::new().unwrap();
        let paths: Vec<PathBuf> = vec![];
        let result = VaultScanner::resolve_link("Nonexistent", dir.path(), &paths);
        assert_eq!(result, None);
    }
}
