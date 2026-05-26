use super::vault_history::HistoryService;
use super::vault_recovery::RecoveryService;
use crate::config::constants::filesystem;
use crate::db::Database;
use crate::error::{BismuthError, Result};
use crate::models::{Note, Vault};
use crate::utils::validate_path;
use std::fs;
use std::path::Path;
use std::sync::Arc;

pub struct VaultOperations {
    db: Arc<Database>,
}

impl VaultOperations {
    pub fn new(db: Arc<Database>) -> Self {
        Self { db }
    }

    pub fn get_note(&self, path: &Path, vault: &Vault) -> Result<Note> {
        validate_path(path, &vault.root_path)?;

        let content = fs::read_to_string(path).map_err(|e| {
            BismuthError::NotFound(format!("Note not found: {}", e))
        })?;

        Ok(Note::new(path.to_path_buf(), content))
    }

    pub fn write_note(&self, path: &Path, content: &str, vault: &Vault) -> Result<()> {
        validate_path(path, &vault.root_path)?;

        if content.len() > filesystem::MAX_FILE_SIZE_BYTES {
            log::warn!(
                "File exceeds {}MB: {} ({} bytes)", 
                filesystem::MAX_FILE_SIZE_BYTES / 1_000_000,
                path.display(), 
                content.len()
            );
        }

        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }

        RecoveryService::save_recovery_file(vault, path, content)?;

        fs::write(path, content)?;

        HistoryService::append_history(vault, path, content)?;

        let note = Note::new(path.to_path_buf(), content.to_string());
        let frontmatter_json = serde_json::to_string(&note.frontmatter)?;

        let conn = self.db.conn();
        let conn = conn.lock().unwrap();

        conn.execute(
            "INSERT OR REPLACE INTO notes (path, title, frontmatter_json, created_at, modified_at)
             VALUES (?, ?, ?, ?, ?)",
            (
                path.to_string_lossy().as_ref(),
                &note.title,
                &frontmatter_json,
                note.created_at.timestamp(),
                note.modified_at.timestamp(),
            ),
        )?;

        Ok(())
    }

    pub fn delete_note(&self, path: &Path, vault: &Vault) -> Result<()> {
        validate_path(path, &vault.root_path)?;

        fs::remove_file(path)?;

        let conn = self.db.conn();
        let conn = conn.lock().unwrap();

        conn.execute(
            "DELETE FROM notes WHERE path = ?",
            [path.to_string_lossy().as_ref()],
        )?;

        Ok(())
    }

    pub fn rename_note(&self, old_path: &Path, new_path: &Path, vault: &Vault) -> Result<()> {
        validate_path(old_path, &vault.root_path)?;
        validate_path(new_path, &vault.root_path)?;

        if let Some(parent) = new_path.parent() {
            fs::create_dir_all(parent)?;
        }

        fs::rename(old_path, new_path)?;

        let conn = self.db.conn();
        let conn = conn.lock().unwrap();

        conn.execute(
            "UPDATE notes SET path = ? WHERE path = ?",
            (
                new_path.to_string_lossy().as_ref(),
                old_path.to_string_lossy().as_ref(),
            ),
        )?;

        Ok(())
    }
}
