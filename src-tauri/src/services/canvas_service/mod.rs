//! Infinite canvas document persistence service (FR-013)
//!
//! Manages CRUD operations for canvas documents, elements, and layers
//! using the SQLite database as the backing store.

pub mod canvas_file;
mod canvas_crud;
mod canvas_persistence;
pub mod component_file;
pub mod format;
mod note_linking;
pub mod rendering;
mod templates;

use crate::db::Database;
use crate::error::Result;
use crate::models::canvas::{CanvasDocument, CanvasElement};
use canvas_crud::sanitize_filename;
use std::path::PathBuf;
use std::sync::Arc;

/// Service for persisting and loading infinite canvas documents.
///
/// Each canvas consists of layers containing elements (rectangles, circles,
/// text, images, groups). SQLite is the fast runtime store; `.canvas` files
/// are the durable source of truth written asynchronously.
pub struct CanvasService {
    db: Arc<Database>,
    vault_root: Option<PathBuf>,
}

impl CanvasService {
    /// Creates a new `CanvasService` backed by the given database.
    pub fn new(db: Arc<Database>) -> Self {
        Self { db, vault_root: None }
    }

    /// Sets the vault root for file-based canvas storage.
    pub fn set_vault_root(&mut self, root: PathBuf) {
        self.vault_root = Some(root);
    }

    /// Returns the vault root path, if set.
    pub fn vault_root(&self) -> Option<&PathBuf> {
        self.vault_root.as_ref()
    }

    /// Returns the directory where .canvas files are stored.
    fn canvas_dir(&self) -> Option<PathBuf> {
        use crate::config::constants::filesystem::VAULT_DIR_NAME;
        self.vault_root.as_ref().map(|r| r.join(VAULT_DIR_NAME).join("canvas"))
    }

    /// Returns the file path for a canvas by name.
    fn canvas_file_path(&self, name: &str) -> Option<PathBuf> {
        self.canvas_dir().map(|d| d.join(format!("{}.canvas", sanitize_filename(name))))
    }

    /// Creates a new blank canvas document with a default layer.
    pub fn create_canvas(&self, name: String) -> Result<CanvasDocument> {
        let canvas = CanvasDocument::new(name);
        self.save_canvas(&canvas)?;
        Ok(canvas)
    }

    /// Saves a canvas document (upsert), replacing all elements and layers.
    /// After SQLite write, schedules an async file flush if vault_root is set.
    pub fn save_canvas(&self, canvas: &CanvasDocument) -> Result<()> {
        canvas_persistence::save_canvas(&self.db, canvas)?;
        // Flush to file (non-blocking best-effort)
        self.flush_to_file(canvas);
        Ok(())
    }

    /// Writes the canvas to its `.canvas` file. Best-effort; logs but doesn't
    /// propagate errors to avoid blocking the SQLite write path.
    fn flush_to_file(&self, canvas: &CanvasDocument) {
        if let Some(path) = self.canvas_file_path(&canvas.name) {
            if let Err(e) = canvas_file::write_canvas_file(&path, canvas) {
                tracing::error!(canvas = %canvas.name, "File flush failed: {}", e);
            }
        }
    }

    /// Rebuilds the SQLite cache from `.canvas` files on disk.
    /// Called on vault open when cache is stale or missing.
    /// Returns the count of canvases rebuilt.
    pub fn rebuild_cache_from_files(&self) -> Result<usize> {
        let canvas_dir = match self.canvas_dir() {
            Some(d) if d.exists() => d,
            _ => return Ok(0),
        };

        let mut count = 0;
        for entry in std::fs::read_dir(&canvas_dir)? {
            let entry = entry?;
            let path = entry.path();
            if path.extension().and_then(|e| e.to_str()) != Some("canvas") {
                continue;
            }
            match canvas_file::read_canvas_file(&path) {
                Ok(canvas) => {
                    canvas_persistence::save_canvas(&self.db, &canvas)?;
                    count += 1;
                }
                Err(e) => {
                    tracing::warn!(file = ?path.file_name(), "Skipping invalid canvas file: {}", e);
                }
            }
        }

        Ok(count)
    }

    /// Exports all canvases from SQLite to `.canvas` files (one-time migration).
    /// Only writes files that don't already exist on disk.
    /// Returns the count of files written.
    pub fn export_all_to_files(&self) -> Result<usize> {
        let canvas_dir = match self.canvas_dir() {
            Some(d) => d,
            None => return Ok(0),
        };
        std::fs::create_dir_all(&canvas_dir)?;

        let canvases = self.list_canvases()?;
        let mut count = 0;

        for meta in &canvases {
            let file_path = canvas_dir.join(format!("{}.canvas", sanitize_filename(&meta.name)));
            if file_path.exists() {
                continue;
            }
            // Load full canvas with elements
            let canvas = self.load_canvas(&meta.id)?;
            canvas_file::write_canvas_file(&file_path, &canvas)?;
            count += 1;
        }

        Ok(count)
    }

    /// Loads a complete canvas document including all layers and elements.
    pub fn load_canvas(&self, id: &str) -> Result<CanvasDocument> {
        canvas_persistence::load_canvas(&self.db, id)
    }

    /// Lists all canvas documents (metadata only, without elements/layers).
    pub fn list_canvases(&self) -> Result<Vec<CanvasDocument>> {
        canvas_crud::list_canvases(&self.db)
    }

    /// Deletes a canvas document and all associated elements/layers.
    pub fn delete_canvas(&self, id: &str) -> Result<()> {
        canvas_crud::delete_canvas(&self.db, id)
    }

    // ─── Template delegation ──────────────────────────────────────────────────

    /// Saves a set of elements as a reusable template.
    pub fn save_template(
        &self,
        name: &str,
        elements: &[CanvasElement],
        description: &str,
        category: &str,
    ) -> Result<serde_json::Value> {
        templates::save_template(&self.db, name, elements, description, category)
    }

    /// Loads a template by ID, returning its metadata and element data.
    pub fn load_template(&self, id: &str) -> Result<serde_json::Value> {
        templates::load_template(&self.db, id)
    }

    /// Lists all templates, optionally filtered by category.
    pub fn list_templates(&self, category: Option<&str>) -> Result<Vec<serde_json::Value>> {
        templates::list_templates(&self.db, category)
    }

    /// Deletes a template by ID.
    pub fn delete_template(&self, id: &str) -> Result<()> {
        templates::delete_template(&self.db, id)
    }

    // ─── Note linking delegation ──────────────────────────────────────────────

    /// Links a canvas to a note (or unlinks by passing `None`).
    pub fn link_to_note(&self, canvas_id: &str, note_path: Option<&str>) -> Result<()> {
        note_linking::link_to_note(&self.db, canvas_id, note_path)
    }

    /// Returns all canvases linked to a given note path.
    pub fn get_canvases_for_note(&self, note_path: &str) -> Result<Vec<CanvasDocument>> {
        note_linking::get_canvases_for_note(&self.db, note_path)
    }

    /// Returns all (note_path, canvas_id) pairs for publishing.
    pub fn get_all_note_canvas_links(&self) -> Result<Vec<(String, String)>> {
        note_linking::get_all_note_canvas_links(&self.db)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::canvas::CanvasElement;

    #[test]
    fn test_create_and_load_canvas() {
        let temp_dir = tempfile::tempdir().unwrap();
        let db_path = temp_dir.path().join("test.db");
        let db = Arc::new(Database::new(&db_path).unwrap());
        let service = CanvasService::new(db);
        let canvas = service.create_canvas("Test Canvas".to_string()).unwrap();
        assert_eq!(canvas.name, "Test Canvas");
        let loaded = service.load_canvas(&canvas.id).unwrap();
        assert_eq!(loaded.id, canvas.id);
        assert_eq!(loaded.name, canvas.name);
    }

    #[test]
    fn test_save_canvas_with_elements() {
        let temp_dir = tempfile::tempdir().unwrap();
        let db_path = temp_dir.path().join("test.db");
        let db = Arc::new(Database::new(&db_path).unwrap());
        let service = CanvasService::new(db);
        let mut canvas = CanvasDocument::new("Test".to_string());
        let layer_id = canvas.layers[0].id.clone();
        let element = CanvasElement::new_rectangle(10.0, 20.0, 100.0, 50.0, layer_id);
        canvas.add_element(element);
        service.save_canvas(&canvas).unwrap();
        let loaded = service.load_canvas(&canvas.id).unwrap();
        assert_eq!(loaded.elements.len(), 1);
        assert_eq!(loaded.elements[0].x, 10.0);
        assert_eq!(loaded.elements[0].y, 20.0);
    }

    #[test]
    fn test_list_canvases() {
        let temp_dir = tempfile::tempdir().unwrap();
        let db_path = temp_dir.path().join("test.db");
        let db = Arc::new(Database::new(&db_path).unwrap());
        let service = CanvasService::new(db);
        service.create_canvas("Canvas 1".to_string()).unwrap();
        service.create_canvas("Canvas 2".to_string()).unwrap();
        let canvases = service.list_canvases().unwrap();
        assert_eq!(canvases.len(), 2);
    }

    #[test]
    fn test_delete_canvas() {
        let temp_dir = tempfile::tempdir().unwrap();
        let db_path = temp_dir.path().join("test.db");
        let db = Arc::new(Database::new(&db_path).unwrap());
        let service = CanvasService::new(db);
        let canvas = service.create_canvas("Test".to_string()).unwrap();
        service.delete_canvas(&canvas.id).unwrap();
        let result = service.load_canvas(&canvas.id);
        assert!(result.is_err());
    }

    #[test]
    fn test_save_canvas_transaction_rollback() {
        let temp_dir = tempfile::tempdir().unwrap();
        let db_path = temp_dir.path().join("test.db");
        let db = Arc::new(Database::new(&db_path).unwrap());
        let service = CanvasService::new(db);
        let mut canvas = CanvasDocument::new("TransactionTest".to_string());
        let layer_id = canvas.layers[0].id.clone();
        let element = CanvasElement::new_rectangle(5.0, 5.0, 50.0, 50.0, layer_id);
        canvas.add_element(element);
        service.save_canvas(&canvas).unwrap();
        let loaded = service.load_canvas(&canvas.id).unwrap();
        assert_eq!(loaded.elements.len(), 1);
        assert_eq!(loaded.name, "TransactionTest");
    }
}
