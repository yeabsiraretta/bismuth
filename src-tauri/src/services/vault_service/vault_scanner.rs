use crate::db::Database;
use crate::error::Result;
use crate::models::{Note, Vault};
use crate::utils::is_within_vault;
use std::fs;
use std::path::Path;
use std::sync::Arc;

pub struct VaultScanner {
    db: Arc<Database>,
}

impl VaultScanner {
    pub fn new(db: Arc<Database>) -> Self {
        Self { db }
    }

    pub fn scan(&self, vault: &Vault) -> Result<Vec<Note>> {
        let mut notes = Vec::new();
        self.scan_directory(&vault.root_path, vault, &mut notes)?;

        let conn = self.db.conn();
        let conn = conn.lock().unwrap();

        for note in &notes {
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
        }

        Ok(notes)
    }

    fn scan_directory(&self, dir: &Path, vault: &Vault, notes: &mut Vec<Note>) -> Result<()> {
        if dir.ends_with(".bismuth") {
            return Ok(());
        }

        for entry in fs::read_dir(dir)? {
            let entry = entry?;
            let path = entry.path();

            if path.is_dir() {
                self.scan_directory(&path, vault, notes)?;
            } else if path.extension().and_then(|s| s.to_str()) == Some("md") {
                if is_within_vault(&path, &vault.root_path) {
                    if let Ok(content) = fs::read_to_string(&path) {
                        let note = Note::new(path, content);
                        notes.push(note);
                    }
                }
            }
        }

        Ok(())
    }

    #[allow(dead_code)]
    pub fn update_note_in_db(&self, note: &Note) -> Result<()> {
        let frontmatter_json = serde_json::to_string(&note.frontmatter)?;

        let conn = self.db.conn();
        let conn = conn.lock().unwrap();

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

        Ok(())
    }

    #[allow(dead_code)]
    pub fn remove_note_from_db(&self, path: &Path) -> Result<()> {
        let conn = self.db.conn();
        let conn = conn.lock().unwrap();

        conn.execute(
            "DELETE FROM notes WHERE path = ?",
            [path.to_string_lossy().as_ref()],
        )?;

        Ok(())
    }
}
