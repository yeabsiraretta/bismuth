//! Vault service for managing vault operations
//!
//! Provides the primary interface for all file operations within a vault.
//! Abstracts filesystem access and enforces vault boundaries.

mod vault_folders;
mod vault_history;
mod vault_note_management;
mod vault_operations;
mod vault_recovery;
mod vault_scanner;
mod vault_templates;

use crate::config::constants::filesystem;
use crate::db::Database;
use crate::error::{BismuthError, Result};
use crate::models::{Note, NoteMeta, Vault};
use crate::services::WikilinkService;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Arc;

pub use vault_history::{HistoryEntry, HistoryService};
use vault_folders::VaultFolders;
use vault_note_management::NoteManagement;
use vault_operations::VaultOperations;
pub use vault_recovery::{RecoveryEntry, RecoveryService};
use vault_scanner::VaultScanner;
use vault_templates::apply_template;

/// Central service for all vault file operations.
///
/// Owns the current vault state and delegates to specialized sub-services
/// for scanning, CRUD operations, and link management.
/// All file paths are validated against the vault root to prevent traversal.
pub struct VaultService {
    #[allow(dead_code)]
    db: Arc<Database>,
    vault: Option<Vault>,
    operations: VaultOperations,
    scanner: VaultScanner,
    wikilink_service: WikilinkService,
}

impl VaultService {
    /// Creates a new `VaultService` backed by the given database.
    pub fn new(db: Arc<Database>) -> Self {
        let operations = VaultOperations::new(Arc::clone(&db));
        let scanner = VaultScanner::new(Arc::clone(&db));
        let wikilink_service = WikilinkService::new();
        Self {
            db,
            vault: None,
            operations,
            scanner,
            wikilink_service,
        }
    }

    // --- Vault lifecycle ---

    /// Opens a vault at the given path.
    pub fn open(&mut self, path: PathBuf) -> Result<Vault> {
        if !path.exists() {
            return Err(BismuthError::VaultError(format!(
                "Vault path does not exist: {}",
                path.display()
            )));
        }
        if !path.is_dir() {
            return Err(BismuthError::VaultError(format!(
                "Vault path is not a directory: {}",
                path.display()
            )));
        }
        let vault = Vault::new(path)?;
        if vault.is_obsidian_vault {
            tracing::info!(
                "Detected Obsidian vault at {}. Bismuth will coexist with .obsidian/",
                vault.root_path.display()
            );
        }
        self.ensure_bismuth_structure(&vault);
        self.vault = Some(vault.clone());
        self.scan()?;
        Ok(vault)
    }

    /// Ensures all canonical `.bismuth/` subdirectories exist.
    /// Called on vault open to handle vaults created before new subdirs were added.
    fn ensure_bismuth_structure(&self, vault: &Vault) {
        let bismuth_dir = vault.bismuth_dir();
        if !bismuth_dir.exists() {
            if let Err(e) = fs::create_dir_all(&bismuth_dir) {
                tracing::warn!("Failed to create .bismuth directory: {}", e);
                return;
            }
        }
        for subdir in filesystem::VAULT_SUBDIRS {
            let dir = bismuth_dir.join(subdir);
            if !dir.exists() {
                if let Err(e) = fs::create_dir_all(&dir) {
                    tracing::warn!("Failed to create .bismuth/{}: {}", subdir, e);
                }
            }
        }
    }

    /// Creates a new vault directory with standard `.bismuth/` structure.
    pub fn create(&mut self, path: PathBuf) -> Result<Vault> {
        let depth = path.components().count();
        if depth > filesystem::MAX_DIRECTORY_DEPTH {
            tracing::warn!(
                "Vault path depth exceeds recommended limit: {} levels (max: {})",
                depth,
                filesystem::MAX_DIRECTORY_DEPTH
            );
        }
        fs::create_dir_all(&path)?;
        let bismuth_dir = path.join(filesystem::VAULT_DIR_NAME);
        fs::create_dir_all(&bismuth_dir)?;
        for subdir in filesystem::VAULT_SUBDIRS {
            fs::create_dir_all(bismuth_dir.join(subdir))?;
        }
        let config_path = bismuth_dir.join("settings.json");
        let config = crate::config::AppSettings::default();
        config.save(&config_path)?;
        let vault = Vault::new(path)?;
        self.vault = Some(vault.clone());
        Ok(vault)
    }

    /// Creates a vault and applies a named template to populate it.
    pub fn create_from_template(&mut self, path: PathBuf, template: &str) -> Result<Vault> {
        let vault = self.create(path.clone())?;
        apply_template(&path, template)?;
        Ok(vault)
    }

    /// Returns a reference to the currently open vault, if any.
    pub fn get_vault(&self) -> Option<&Vault> {
        self.vault.as_ref()
    }

    // --- Core CRUD (delegated to VaultOperations) ---

    /// Scans the vault for all markdown files.
    /// Uses a cached scanner — only re-reads files whose mtime has changed.
    pub fn scan(&mut self) -> Result<Vec<Note>> {
        let vault = self.require_vault()?.clone();
        self.scanner.scan(&vault)
    }

    /// Scans the vault and returns metadata only (no content).
    /// Typically 10-50x smaller IPC payload than full scan.
    pub fn scan_meta(&mut self) -> Result<Vec<NoteMeta>> {
        let vault = self.require_vault()?.clone();
        self.scanner.scan_meta(&vault)
    }

    /// Reads and parses a single note by path.
    /// Uses the scanner cache when available, falls back to disk read.
    pub fn get_note(&self, path: &Path) -> Result<Note> {
        if let Some(note) = self.scanner.get_cached_note(path) {
            return Ok(note);
        }
        let vault = self.require_vault()?;
        self.operations.get_note(path, vault)
    }

    /// Writes content to a note file, enforcing vault boundary.
    pub fn write_note(&self, path: &Path, content: &str) -> Result<()> {
        let vault = self.require_vault()?;
        self.operations.write_note(path, content, vault)
    }

    /// Deletes a note file from disk.
    pub fn delete_note(&self, path: &Path) -> Result<()> {
        let vault = self.require_vault()?;
        self.operations.delete_note(path, vault)
    }

    /// Renames a note, moving the file on disk.
    pub fn rename_note(&self, old_path: &Path, new_path: &Path) -> Result<()> {
        let vault = self.require_vault()?;
        self.operations.rename_note(old_path, new_path, vault)
    }

    // --- Folder operations (delegated to VaultFolders) ---

    /// Recursively lists all subdirectories in the vault (excluding hidden dirs).
    pub fn list_folders(&self, vault_path: &Path) -> Result<Vec<String>> {
        VaultFolders::list_folders(vault_path)
    }

    /// Lists all `.md` notes in a specific folder (non-recursive).
    pub fn list_notes_in_folder(&self, vault_path: &Path, folder_path: &str) -> Result<Vec<Note>> {
        let vault = self.require_vault()?;
        VaultFolders::list_notes_in_folder(vault_path, folder_path, vault, &self.operations)
    }

    // --- Note management (delegated to NoteManagement) ---

    /// Duplicates a note, creating a copy with " copy" suffix.
    pub fn duplicate_note(&self, path: &Path) -> Result<Note> {
        let vault = self.require_vault()?;
        NoteManagement::duplicate_note(path, vault, &self.operations)
    }

    /// Moves a note to a new directory and updates all inbound wikilinks.
    pub fn move_note(&self, old_path: &Path, new_dir: &Path) -> Result<Note> {
        let vault = self.require_vault()?;
        NoteManagement::move_note(old_path, new_dir, vault, &self.operations, &self.wikilink_service)
    }

    /// Merges multiple notes into one, concatenating content with separators.
    pub fn merge_notes(&self, paths: &[PathBuf], target_path: &Path) -> Result<Note> {
        let vault = self.require_vault()?;
        NoteManagement::merge_notes(paths, target_path, vault, &self.operations)
    }

    /// Creates a new note at the given path with initial content.
    pub fn create_note(&self, path: &Path, content: &str) -> Result<Note> {
        let vault = self.require_vault()?;
        NoteManagement::create_note(path, content, vault, &self.operations)
    }

    /// Creates a note from an unresolved wikilink target.
    pub fn create_note_from_wikilink(&self, title: &str) -> Result<Note> {
        let vault = self.require_vault()?;
        NoteManagement::create_note_from_wikilink(title, vault, &self.operations)
    }

    /// Updates a single frontmatter field on a note.
    pub fn update_frontmatter_field(&self, path: &Path, key: &str, value: serde_json::Value) -> Result<()> {
        let vault = self.require_vault()?;
        NoteManagement::update_frontmatter_field(path, key, value, vault, &self.operations)
    }

    // --- Links & history ---

    /// Updates all `[[wikilinks]]` pointing to a renamed note.
    pub fn update_links_on_rename(&self, old_path: &Path, new_path: &Path) -> Result<Vec<PathBuf>> {
        let vault = self.require_vault()?;
        self.wikilink_service.update_links_on_rename(old_path, new_path, vault)
    }

    /// Checks for crash-recovery files left from an unexpected shutdown.
    pub fn check_recovery(&self) -> Result<Vec<RecoveryEntry>> {
        let vault = self.require_vault()?;
        RecoveryService::check_recovery_files(vault)
    }

    /// Returns the edit history log for a specific note.
    pub fn get_history(&self, path: &Path) -> Result<Vec<HistoryEntry>> {
        let vault = self.require_vault()?;
        HistoryService::get_history(vault, path)
    }

    /// Restores a note to a previous version identified by timestamp.
    pub fn restore_version(&self, path: &Path, timestamp: chrono::DateTime<chrono::Utc>) -> Result<String> {
        let vault = self.require_vault()?;
        HistoryService::restore_version(vault, path, timestamp)
    }

    // --- Helpers ---

    fn require_vault(&self) -> Result<&Vault> {
        self.vault
            .as_ref()
            .ok_or_else(|| BismuthError::VaultError("No vault open".to_string()))
    }
}

#[cfg(test)]
#[path = "vault_tests.rs"]
mod tests;
