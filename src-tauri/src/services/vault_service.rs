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

pub struct VaultService {
    #[allow(dead_code)]
    db: Arc<Database>,
    vault: Option<Vault>,
    operations: VaultOperations,
    scanner: VaultScanner,
    wikilink_service: WikilinkService,
}

impl VaultService {
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

    pub fn create_from_template(&mut self, path: PathBuf, template: &str) -> Result<Vault> {
        let vault = self.create(path.clone())?;
        apply_template(&path, template)?;
        Ok(vault)
    }

    pub fn scan(&self) -> Result<Vec<Note>> {
        let vault = self
            .vault
            .as_ref()
            .ok_or_else(|| BismuthError::VaultError("No vault open".to_string()))?;

        self.scanner.scan(vault)
    }

    pub fn get_note(&self, path: &Path) -> Result<Note> {
        let vault = self
            .vault
            .as_ref()
            .ok_or_else(|| BismuthError::VaultError("No vault open".to_string()))?;

        self.operations.get_note(path, vault)
    }

    pub fn write_note(&self, path: &Path, content: &str) -> Result<()> {
        let vault = self
            .vault
            .as_ref()
            .ok_or_else(|| BismuthError::VaultError("No vault open".to_string()))?;

        self.operations.write_note(path, content, vault)
    }

    pub fn delete_note(&self, path: &Path) -> Result<()> {
        let vault = self
            .vault
            .as_ref()
            .ok_or_else(|| BismuthError::VaultError("No vault open".to_string()))?;

        self.operations.delete_note(path, vault)
    }

    pub fn rename_note(&self, old_path: &Path, new_path: &Path) -> Result<()> {
        let vault = self
            .vault
            .as_ref()
            .ok_or_else(|| BismuthError::VaultError("No vault open".to_string()))?;

        self.operations.rename_note(old_path, new_path, vault)
    }

    pub fn get_vault(&self) -> Option<&Vault> {
        self.vault.as_ref()
    }

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

    pub fn list_notes_in_folder(&self, vault_path: &Path, folder_path: &str) -> Result<Vec<Note>> {
        use std::fs;
        
        let folder = vault_path.join(folder_path);
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
        let new_path = parent.join(format!("{} copy.md", stem));
        
        // Write duplicate
        fs::write(&new_path, &content)?;
        
        // Parse and return new note
        self.operations.get_note(&new_path, vault)
    }

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

    pub fn merge_notes(&self, paths: &[PathBuf], target_path: &Path) -> Result<Note> {
        let vault = self
            .vault
            .as_ref()
            .ok_or_else(|| BismuthError::VaultError("No vault open".to_string()))?;

        let mut merged_content = String::new();
        
        // Collect all content
        for path in paths {
            let content = fs::read_to_string(path)?;
            merged_content.push_str(&format!("\n\n---\n\n# From: {}\n\n", path.display()));
            merged_content.push_str(&content);
        }
        
        // Write merged note
        fs::write(target_path, &merged_content)?;
        
        // Move originals to trash (delete for now)
        for path in paths {
            if path != target_path {
                fs::remove_file(path)?;
            }
        }
        
        // Parse and return merged note
        self.operations.get_note(target_path, vault)
    }

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

    pub fn update_links_on_rename(&self, old_path: &Path, new_path: &Path) -> Result<Vec<PathBuf>> {
        let vault = self
            .vault
            .as_ref()
            .ok_or_else(|| BismuthError::VaultError("No vault open".to_string()))?;

        self.wikilink_service.update_links_on_rename(old_path, new_path, vault)
    }

    pub fn check_recovery(&self) -> Result<Vec<RecoveryEntry>> {
        let vault = self
            .vault
            .as_ref()
            .ok_or_else(|| BismuthError::VaultError("No vault open".to_string()))?;

        RecoveryService::check_recovery_files(vault)
    }

    pub fn get_history(&self, path: &Path) -> Result<Vec<HistoryEntry>> {
        let vault = self
            .vault
            .as_ref()
            .ok_or_else(|| BismuthError::VaultError("No vault open".to_string()))?;

        HistoryService::get_history(vault, path)
    }

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
}
