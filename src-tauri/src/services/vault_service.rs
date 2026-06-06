//! Vault service for managing vault operations
//!
//! Provides the primary interface for all file operations within a vault.
//! Abstracts filesystem access and enforces vault boundaries.

mod vault_history;
mod vault_operations;
mod vault_recovery;
mod vault_scanner;
mod vault_templates;

use crate::config::constants::filesystem;
use crate::db::Database;
use crate::error::{BismuthError, Result};
use crate::models::{Note, Vault};
use crate::services::WikilinkService;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Arc;

pub use vault_history::{HistoryEntry, HistoryService};
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

    /// Opens a vault at the given path.
    ///
    /// Validates that the path exists and is a directory, initializes the
    /// [`Vault`] struct, and performs an initial scan.
    ///
    /// # Errors
    ///
    /// Returns [`BismuthError::VaultError`] if the path is invalid.
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
        self.vault = Some(vault.clone());
        self.scan()?;
        Ok(vault)
    }

    /// Creates a new vault directory with standard `.bismuth/` structure.
    ///
    /// Creates subdirectories for notes, templates, themes, and plugins,
    /// plus a default settings file.
    ///
    /// # Errors
    ///
    /// Returns an IO error if directory creation fails.
    pub fn create(&mut self, path: PathBuf) -> Result<Vault> {
        let depth = path.components().count();
        if depth > filesystem::MAX_DIRECTORY_DEPTH {
            log::warn!(
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

    /// Scans the vault for all markdown files and returns parsed [`Note`] objects.
    ///
    /// # Errors
    ///
    /// Returns an error if no vault is currently open.
    pub fn scan(&self) -> Result<Vec<Note>> {
        let vault = self
            .vault
            .as_ref()
            .ok_or_else(|| BismuthError::VaultError("No vault open".to_string()))?;

        self.scanner.scan(vault)
    }

    /// Reads and parses a single note by path.
    pub fn get_note(&self, path: &Path) -> Result<Note> {
        let vault = self
            .vault
            .as_ref()
            .ok_or_else(|| BismuthError::VaultError("No vault open".to_string()))?;

        self.operations.get_note(path, vault)
    }

    /// Writes content to a note file, enforcing vault boundary.
    pub fn write_note(&self, path: &Path, content: &str) -> Result<()> {
        let vault = self
            .vault
            .as_ref()
            .ok_or_else(|| BismuthError::VaultError("No vault open".to_string()))?;

        self.operations.write_note(path, content, vault)
    }

    /// Deletes a note file from disk.
    pub fn delete_note(&self, path: &Path) -> Result<()> {
        let vault = self
            .vault
            .as_ref()
            .ok_or_else(|| BismuthError::VaultError("No vault open".to_string()))?;

        self.operations.delete_note(path, vault)
    }

    /// Renames a note, moving the file on disk.
    pub fn rename_note(&self, old_path: &Path, new_path: &Path) -> Result<()> {
        let vault = self
            .vault
            .as_ref()
            .ok_or_else(|| BismuthError::VaultError("No vault open".to_string()))?;

        self.operations.rename_note(old_path, new_path, vault)
    }

    /// Returns a reference to the currently open vault, if any.
    pub fn get_vault(&self) -> Option<&Vault> {
        self.vault.as_ref()
    }

    /// Recursively lists all subdirectories in the vault (excluding hidden dirs).
    pub fn list_folders(&self, vault_path: &Path) -> Result<Vec<String>> {
        use std::fs;
        
        let mut folders = Vec::new();
        
        fn collect_folders(dir: &Path, base: &Path, folders: &mut Vec<String>) -> Result<()> {
            if dir.is_dir() {
                for entry in fs::read_dir(dir)? {
                    let entry = entry?;
                    let path = entry.path();
                    
                    if path.is_dir() {
                        // Skip hidden folders and .bismuth
                        if let Some(name) = path.file_name() {
                            let name_str = name.to_string_lossy();
                            if name_str.starts_with('.') {
                                continue;
                            }
                        }
                        
                        if let Ok(relative) = path.strip_prefix(base) {
                            folders.push(relative.to_string_lossy().to_string());
                        }
                        
                        collect_folders(&path, base, folders)?;
                    }
                }
            }
            Ok(())
        }
        
        collect_folders(vault_path, vault_path, &mut folders)?;
        Ok(folders)
    }

    /// Lists all `.md` notes in a specific folder (non-recursive).
    pub fn list_notes_in_folder(&self, vault_path: &Path, folder_path: &str) -> Result<Vec<Note>> {
        use crate::utils::path::validate_path;
        use std::fs;
        
        let folder = vault_path.join(folder_path);
        validate_path(&folder, vault_path)?;
        let mut notes = Vec::new();
        
        if folder.is_dir() {
            for entry in fs::read_dir(&folder)? {
                let entry = entry?;
                let path = entry.path();
                
                if path.is_file() {
                    if let Some(ext) = path.extension() {
                        if ext == "md" {
                            if let Ok(note) = self.operations.get_note(&path, self.vault.as_ref().unwrap()) {
                                notes.push(note);
                            }
                        }
                    }
                }
            }
        }
        
        Ok(notes)
    }

    /// Duplicates a note, creating a copy with " copy" suffix in the same directory.
    /// Handles filename collisions by appending an incrementing number.
    pub fn duplicate_note(&self, path: &Path) -> Result<Note> {
        let vault = self
            .vault
            .as_ref()
            .ok_or_else(|| BismuthError::VaultError("No vault open".to_string()))?;

        // Read original note
        let content = fs::read_to_string(path)?;
        
        // Create new path in same directory with " copy" suffix
        let parent = path.parent().ok_or_else(|| BismuthError::InvalidPath(path.display().to_string()))?;
        let stem = path.file_stem()
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
        self.operations.get_note(&new_path, vault)
    }

    /// Moves a note to a new directory and updates all inbound wikilinks.
    pub fn move_note(&self, old_path: &Path, new_dir: &Path) -> Result<Note> {
        let vault = self
            .vault
            .as_ref()
            .ok_or_else(|| BismuthError::VaultError("No vault open".to_string()))?;

        // Get filename
        let filename = old_path
            .file_name()
            .ok_or_else(|| BismuthError::InvalidPath(old_path.display().to_string()))?;
        
        // Create new path
        let new_path = new_dir.join(filename);
        
        // Move file
        fs::rename(old_path, &new_path)?;
        
        // Update wikilinks
        self.wikilink_service.update_links_on_rename(old_path, &new_path, vault)?;
        
        // Parse and return moved note
        self.operations.get_note(&new_path, vault)
    }

    /// Merges multiple notes into one, concatenating content with separators.
    ///
    /// Source notes (other than the target) are deleted after merging.
    pub fn merge_notes(&self, paths: &[PathBuf], target_path: &Path) -> Result<Note> {
        let vault = self
            .vault
            .as_ref()
            .ok_or_else(|| BismuthError::VaultError("No vault open".to_string()))?;

        let target_canonical = target_path.canonicalize().unwrap_or_else(|_| target_path.to_path_buf());
        let mut merged_content = String::new();
        
        // Collect all content, skipping separator header for target's own content
        for path in paths {
            let content = fs::read_to_string(path)?;
            let path_canonical = path.canonicalize().unwrap_or_else(|_| path.to_path_buf());
            if path_canonical == target_canonical {
                merged_content.push_str(&content);
            } else {
                merged_content.push_str(&format!("\n\n---\n\n# From: {}\n\n", path.display()));
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
        self.operations.get_note(target_path, vault)
    }

    /// Creates a new note at the given path with initial content.
    pub fn create_note(&self, path: &Path, content: &str) -> Result<Note> {
        let vault = self
            .vault
            .as_ref()
            .ok_or_else(|| BismuthError::VaultError("No vault open".to_string()))?;

        self.operations.write_note(path, content, vault)?;
        self.operations.get_note(path, vault)
    }

    /// Creates a note from an unresolved wikilink target
    /// Uses the default note location from vault settings
    pub fn create_note_from_wikilink(&self, title: &str) -> Result<Note> {
        let vault = self
            .vault
            .as_ref()
            .ok_or_else(|| BismuthError::VaultError("No vault open".to_string()))?;

        // Create path from title in vault root (default location)
        let filename = format!("{}.md", title);
        let note_path = vault.root_path.join(&filename);

        // Check if note already exists
        if note_path.exists() {
            return Err(BismuthError::VaultError(format!("Note '{}' already exists", title)));
        }

        // Create note with basic frontmatter
        let content = format!("---\ntitle: {}\ncreated: {}\n---\n\n# {}\n\n", 
            title, 
            chrono::Utc::now().to_rfc3339(),
            title
        );

        self.create_note(&note_path, &content)
    }

    /// Updates a single frontmatter field on a note.
    /// Reads the file, parses frontmatter, sets the field, re-serializes, and writes back.
    pub fn update_frontmatter_field(&self, path: &Path, key: &str, value: serde_json::Value) -> Result<()> {
        use crate::services::FrontmatterService;

        let vault = self
            .vault
            .as_ref()
            .ok_or_else(|| BismuthError::VaultError("No vault open".to_string()))?;

        let content = std::fs::read_to_string(path).map_err(|e| {
            BismuthError::NotFound(format!("Note not found: {}", e))
        })?;

        let (mut frontmatter, body) = FrontmatterService::parse(&content)?;
        FrontmatterService::set_field(&mut frontmatter, key.to_string(), value);
        let new_content = FrontmatterService::serialize(&frontmatter, &body)?;

        self.operations.write_note(path, &new_content, vault)
    }

    /// Updates all `[[wikilinks]]` pointing to a renamed note.
    ///
    /// Returns the list of files that were modified.
    pub fn update_links_on_rename(&self, old_path: &Path, new_path: &Path) -> Result<Vec<PathBuf>> {
        let vault = self
            .vault
            .as_ref()
            .ok_or_else(|| BismuthError::VaultError("No vault open".to_string()))?;

        self.wikilink_service.update_links_on_rename(old_path, new_path, vault)
    }

    /// Checks for crash-recovery files left from an unexpected shutdown.
    pub fn check_recovery(&self) -> Result<Vec<RecoveryEntry>> {
        let vault = self
            .vault
            .as_ref()
            .ok_or_else(|| BismuthError::VaultError("No vault open".to_string()))?;

        RecoveryService::check_recovery_files(vault)
    }

    /// Returns the edit history log for a specific note.
    pub fn get_history(&self, path: &Path) -> Result<Vec<HistoryEntry>> {
        let vault = self
            .vault
            .as_ref()
            .ok_or_else(|| BismuthError::VaultError("No vault open".to_string()))?;

        HistoryService::get_history(vault, path)
    }

    /// Restores a note to a previous version identified by timestamp.
    pub fn restore_version(&self, path: &Path, timestamp: chrono::DateTime<chrono::Utc>) -> Result<String> {
        let vault = self
            .vault
            .as_ref()
            .ok_or_else(|| BismuthError::VaultError("No vault open".to_string()))?;

        HistoryService::restore_version(vault, path, timestamp)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_create_vault() {
        let dir = tempdir().unwrap();
        let vault_path = dir.path().join("test_vault");
        let db_path = dir.path().join("test.db");

        let db = Arc::new(Database::new(&db_path).unwrap());
        let mut service = VaultService::new(db);

        let vault = service.create(vault_path.clone()).unwrap();
        // Use canonicalized paths for comparison (macOS /var vs /private/var)
        assert_eq!(
            vault.root_path,
            vault_path.canonicalize().unwrap()
        );
        assert!(vault_path.join(".bismuth").exists());
        assert!(vault_path.join(".bismuth/notes").exists());
    }

    #[test]
    fn test_open_vault() {
        let dir = tempdir().unwrap();
        let vault_path = dir.path().join("test_vault");
        let db_path = dir.path().join("test.db");

        let db = Arc::new(Database::new(&db_path).unwrap());
        let mut service = VaultService::new(Arc::clone(&db));

        // Create vault first
        service.create(vault_path.clone()).unwrap();

        // Open it
        let mut service2 = VaultService::new(db);
        let vault = service2.open(vault_path.clone()).unwrap();
        assert_eq!(vault.root_path, vault_path.canonicalize().unwrap());
    }

    #[test]
    fn test_write_and_get_note() {
        let dir = tempdir().unwrap();
        let vault_path = dir.path().join("test_vault");
        let db_path = dir.path().join("test.db");

        let db = Arc::new(Database::new(&db_path).unwrap());
        let mut service = VaultService::new(db);

        service.create(vault_path.clone()).unwrap();

        let note_path = vault_path.join("test.md");
        let content = "# Test Note\n\nThis is a test.";

        service.write_note(&note_path, content).unwrap();
        assert!(note_path.exists());

        let note = service.get_note(&note_path).unwrap();
        assert_eq!(note.title, "test");
        assert_eq!(note.content, content);
    }

    #[test]
    fn test_delete_note() {
        let dir = tempdir().unwrap();
        let vault_path = dir.path().join("test_vault");
        let db_path = dir.path().join("test.db");

        let db = Arc::new(Database::new(&db_path).unwrap());
        let mut service = VaultService::new(db);

        service.create(vault_path.clone()).unwrap();

        let note_path = vault_path.join("test.md");
        service.write_note(&note_path, "test").unwrap();
        assert!(note_path.exists());

        service.delete_note(&note_path).unwrap();
        assert!(!note_path.exists());
    }

    #[test]
    fn test_rename_note() {
        let dir = tempdir().unwrap();
        let vault_path = dir.path().join("test_vault");
        let db_path = dir.path().join("test.db");

        let db = Arc::new(Database::new(&db_path).unwrap());
        let mut service = VaultService::new(db);

        service.create(vault_path.clone()).unwrap();

        let old_path = vault_path.join("old.md");
        let new_path = vault_path.join("new.md");

        service.write_note(&old_path, "test").unwrap();
        assert!(old_path.exists());

        service.rename_note(&old_path, &new_path).unwrap();
        assert!(!old_path.exists());
        assert!(new_path.exists());
    }

    #[test]
    fn test_path_traversal_protection() {
        let dir = tempdir().unwrap();
        let vault_path = dir.path().join("test_vault");
        let db_path = dir.path().join("test.db");

        let db = Arc::new(Database::new(&db_path).unwrap());
        let mut service = VaultService::new(db);

        service.create(vault_path.clone()).unwrap();

        // Try to write outside vault
        let outside_path = dir.path().join("outside.md");
        let result = service.write_note(&outside_path, "test");
        assert!(result.is_err());
    }

    #[test]
    fn test_duplicate_note_collision() {
        let dir = tempdir().unwrap();
        let vault_path = dir.path().join("test_vault");
        let db_path = dir.path().join("test.db");

        let db = Arc::new(Database::new(&db_path).unwrap());
        let mut service = VaultService::new(db);
        service.create(vault_path.clone()).unwrap();

        let note_path = vault_path.join("note.md");
        service.write_note(&note_path, "# Original").unwrap();

        // First duplicate creates "note copy.md"
        let dup1 = service.duplicate_note(&note_path).unwrap();
        assert!(dup1.path.to_string_lossy().contains("note copy.md"));

        // Second duplicate creates "note copy 2.md" (collision avoidance)
        let dup2 = service.duplicate_note(&note_path).unwrap();
        assert!(dup2.path.to_string_lossy().contains("note copy 2.md"));
    }

    #[test]
    fn test_merge_notes_canonicalized_target_preserved() {
        let dir = tempdir().unwrap();
        let vault_path = dir.path().join("test_vault");
        let db_path = dir.path().join("test.db");

        let db = Arc::new(Database::new(&db_path).unwrap());
        let mut service = VaultService::new(db);
        service.create(vault_path.clone()).unwrap();

        let target = vault_path.join("target.md");
        let source = vault_path.join("source.md");
        service.write_note(&target, "# Target content").unwrap();
        service.write_note(&source, "# Source content").unwrap();

        let paths = vec![target.clone(), source.clone()];
        service.merge_notes(&paths, &target).unwrap();

        // Target must still exist after merge
        assert!(target.exists());
        // Source must be deleted
        assert!(!source.exists());
    }

    #[test]
    fn test_merge_notes_target_no_header() {
        let dir = tempdir().unwrap();
        let vault_path = dir.path().join("test_vault");
        let db_path = dir.path().join("test.db");

        let db = Arc::new(Database::new(&db_path).unwrap());
        let mut service = VaultService::new(db);
        service.create(vault_path.clone()).unwrap();

        let target = vault_path.join("target.md");
        let source = vault_path.join("source.md");
        service.write_note(&target, "Target body").unwrap();
        service.write_note(&source, "Source body").unwrap();

        let paths = vec![target.clone(), source.clone()];
        service.merge_notes(&paths, &target).unwrap();

        let content = std::fs::read_to_string(&target).unwrap();
        // Target's own content should NOT be prefixed with "# From:" header
        assert!(!content.starts_with("\n\n---\n\n# From:"));
        assert!(content.starts_with("Target body"));
        // Source content SHOULD have the header
        assert!(content.contains("# From:"));
        assert!(content.contains("Source body"));
    }

    #[test]
    fn test_list_notes_folder_traversal_blocked() {
        let dir = tempdir().unwrap();
        let vault_path = dir.path().join("test_vault");
        let db_path = dir.path().join("test.db");

        let db = Arc::new(Database::new(&db_path).unwrap());
        let mut service = VaultService::new(db);
        service.create(vault_path.clone()).unwrap();

        // Attempt path traversal
        let result = service.list_notes_in_folder(&vault_path, "../../../etc");
        assert!(result.is_err());
    }
}
