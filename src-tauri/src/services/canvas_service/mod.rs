//! Infinite canvas document persistence service (FR-013)
//!
//! Manages CRUD operations for canvas documents, elements, and layers
//! using the SQLite database as the backing store.

mod note_linking;
mod templates;

use crate::db::Database;
use crate::error::Result;
use crate::models::canvas::{CanvasDocument, CanvasElement, ElementType, Layer, Viewport};
use std::sync::Arc;

/// Service for persisting and loading infinite canvas documents.
///
/// Each canvas consists of layers containing elements (rectangles, circles,
/// text, images, groups). All state is stored in SQLite with cascading deletes.
pub struct CanvasService {
    db: Arc<Database>,
}

impl CanvasService {
    /// Creates a new `CanvasService` backed by the given database.
    pub fn new(db: Arc<Database>) -> Self {
        Self { db }
    }

    /// Creates a new blank canvas document with a default layer.
    pub fn create_canvas(&self, name: String) -> Result<CanvasDocument> {
        let canvas = CanvasDocument::new(name);
        self.save_canvas(&canvas)?;
        Ok(canvas)
    }

    /// Saves a canvas document (upsert), replacing all elements and layers.
    /// All operations are wrapped in a transaction for crash safety.
    pub fn save_canvas(&self, canvas: &CanvasDocument) -> Result<()> {
        let conn_arc = self.db.conn();
        let mut conn = conn_arc.lock().unwrap();

        let tx = conn.transaction()?;

        // Save canvas document
        tx.execute(
            "INSERT OR REPLACE INTO canvas_documents 
             (id, name, vault_id, viewport_x, viewport_y, viewport_scale, 
              grid_size, snap_to_grid, created_at, modified_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            (
                &canvas.id,
                &canvas.name,
                &canvas.vault_id,
                canvas.viewport.x,
                canvas.viewport.y,
                canvas.viewport.scale,
                canvas.grid_size,
                canvas.snap_to_grid as i32,
                canvas.created_at,
                canvas.modified_at,
            ),
        )?;

        // Delete existing elements and layers for this canvas
        tx.execute(
            "DELETE FROM canvas_elements WHERE canvas_id = ?1",
            [&canvas.id],
        )?;
        tx.execute(
            "DELETE FROM canvas_layers WHERE canvas_id = ?1",
            [&canvas.id],
        )?;

        // Save layers
        for layer in &canvas.layers {
            tx.execute(
                "INSERT INTO canvas_layers (id, canvas_id, name, z_order, visible, locked)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                (
                    &layer.id,
                    &canvas.id,
                    &layer.name,
                    layer.z_order,
                    layer.visible as i32,
                    layer.locked as i32,
                ),
            )?;
        }

        // Save elements
        for element in &canvas.elements {
            let properties_json = serde_json::to_string(&element.properties)?;

            tx.execute(
                "INSERT INTO canvas_elements 
                 (id, canvas_id, element_type, x, y, width, height, rotation, 
                  properties, layer_id, z_index, locked, visible)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
                (
                    &element.id,
                    &canvas.id,
                    element.element_type.as_str(),
                    element.x,
                    element.y,
                    element.width,
                    element.height,
                    element.rotation,
                    properties_json,
                    &element.layer_id,
                    element.z_index,
                    element.locked as i32,
                    element.visible as i32,
                ),
            )?;
        }

        // Save pages and components as JSON columns
        let pages_json = serde_json::to_string(&canvas.pages)?;
        let components_json = serde_json::to_string(&canvas.components)?;
        match tx.execute(
            "UPDATE canvas_documents SET pages_json = ?1, active_page_id = ?2, components_json = ?3 WHERE id = ?4",
            (&pages_json, &canvas.active_page_id, &components_json, &canvas.id),
        ) {
            Ok(_) => {},
            Err(e) if e.to_string().contains("no such column") => {
                log::debug!("Skipping pages/components save (pre-migration schema): {}", e);
            },
            Err(e) => {
                log::warn!("Unexpected error saving pages/components: {}", e);
            },
        }

        tx.commit()?;
        Ok(())
    }

    /// Loads a complete canvas document including all layers and elements.
    pub fn load_canvas(&self, id: &str) -> Result<CanvasDocument> {
        let conn_arc = self.db.conn();
        let conn = conn_arc.lock().unwrap();

        let mut canvas: CanvasDocument = conn.query_row(
            "SELECT id, name, vault_id, viewport_x, viewport_y, viewport_scale,
                    grid_size, snap_to_grid, created_at, modified_at
             FROM canvas_documents WHERE id = ?1",
            [id],
            |row| {
                Ok(CanvasDocument {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    vault_id: row.get(2)?,
                    note_id: None,
                    viewport: Viewport {
                        x: row.get(3)?,
                        y: row.get(4)?,
                        scale: row.get(5)?,
                    },
                    grid_size: row.get(6)?,
                    snap_to_grid: row.get::<_, i32>(7)? != 0,
                    elements: Vec::new(),
                    layers: Vec::new(),
                    pages: Vec::new(),
                    active_page_id: String::new(),
                    components: Vec::new(),
                    created_at: row.get(8)?,
                    modified_at: row.get(9)?,
                })
            },
        )?;

        // Load pages and components JSON (may not exist if pre-migration)
        if let Ok(row) = conn.query_row(
            "SELECT pages_json, active_page_id, components_json FROM canvas_documents WHERE id = ?1",
            [id],
            |row| {
                let pages_json: Option<String> = row.get(0)?;
                let active_page_id: Option<String> = row.get(1)?;
                let components_json: Option<String> = row.get(2)?;
                Ok((pages_json, active_page_id, components_json))
            },
        ) {
            if let Some(pages_str) = row.0 {
                canvas.pages = serde_json::from_str(&pages_str).unwrap_or_default();
            }
            if let Some(page_id) = row.1 {
                canvas.active_page_id = page_id;
            }
            if let Some(comp_str) = row.2 {
                canvas.components = serde_json::from_str(&comp_str).unwrap_or_default();
            }
        }

        // Load layers
        let mut stmt = conn.prepare(
            "SELECT id, name, z_order, visible, locked
             FROM canvas_layers WHERE canvas_id = ?1 ORDER BY z_order",
        )?;

        let layers = stmt.query_map([id], |row| {
            Ok(Layer {
                id: row.get(0)?,
                name: row.get(1)?,
                z_order: row.get(2)?,
                visible: row.get::<_, i32>(3)? != 0,
                locked: row.get::<_, i32>(4)? != 0,
            })
        })?;

        canvas.layers = layers.collect::<std::result::Result<Vec<_>, _>>()?;

        // Load elements
        let mut stmt = conn.prepare(
            "SELECT id, element_type, x, y, width, height, rotation,
                    properties, layer_id, z_index, locked, visible
             FROM canvas_elements WHERE canvas_id = ?1 ORDER BY z_index",
        )?;

        let elements = stmt.query_map([id], |row| {
            let element_type_str: String = row.get(1)?;
            let element_type = ElementType::from_str(&element_type_str);

            let properties_json: String = row.get(7)?;
            let properties = serde_json::from_str(&properties_json)
                .unwrap_or_else(|_| std::collections::HashMap::new());

            Ok(CanvasElement {
                id: row.get(0)?,
                element_type,
                x: row.get(2)?,
                y: row.get(3)?,
                width: row.get(4)?,
                height: row.get(5)?,
                rotation: row.get(6)?,
                properties,
                layer_id: row.get(8)?,
                z_index: row.get(9)?,
                locked: row.get::<_, i32>(10)? != 0,
                visible: row.get::<_, i32>(11)? != 0,
                parent_id: None,
                name: None,
            })
        })?;

        canvas.elements = elements.collect::<std::result::Result<Vec<_>, _>>()?;

        Ok(canvas)
    }

    /// Lists all canvas documents (metadata only, without elements/layers).
    pub fn list_canvases(&self) -> Result<Vec<CanvasDocument>> {
        let conn_arc = self.db.conn();
        let conn = conn_arc.lock().unwrap();

        let mut stmt = conn.prepare(
            "SELECT id, name, vault_id, viewport_x, viewport_y, viewport_scale,
                    grid_size, snap_to_grid, created_at, modified_at
             FROM canvas_documents ORDER BY modified_at DESC",
        )?;

        let canvases = stmt.query_map([], |row| {
            Ok(CanvasDocument {
                id: row.get(0)?,
                name: row.get(1)?,
                vault_id: row.get(2)?,
                note_id: None,
                viewport: Viewport {
                    x: row.get(3)?,
                    y: row.get(4)?,
                    scale: row.get(5)?,
                },
                grid_size: row.get(6)?,
                snap_to_grid: row.get::<_, i32>(7)? != 0,
                elements: Vec::new(),
                layers: Vec::new(),
                pages: Vec::new(),
                active_page_id: String::new(),
                components: Vec::new(),
                created_at: row.get(8)?,
                modified_at: row.get(9)?,
            })
        })?;

        Ok(canvases.collect::<std::result::Result<Vec<_>, _>>()?)
    }

    /// Deletes a canvas document and all associated elements/layers.
    pub fn delete_canvas(&self, id: &str) -> Result<()> {
        let conn_arc = self.db.conn();
        let conn = conn_arc.lock().unwrap();
        // Foreign key constraints will cascade delete elements and layers
        conn.execute("DELETE FROM canvas_documents WHERE id = ?1", [id])?;
        Ok(())
    }

    // ─── Template delegation ──────────────────────────────────────────────────

    pub fn save_template(
        &self,
        name: &str,
        elements: &[CanvasElement],
        description: &str,
        category: &str,
    ) -> Result<serde_json::Value> {
        templates::save_template(&self.db, name, elements, description, category)
    }

    pub fn load_template(&self, id: &str) -> Result<serde_json::Value> {
        templates::load_template(&self.db, id)
    }

    pub fn list_templates(&self, category: Option<&str>) -> Result<Vec<serde_json::Value>> {
        templates::list_templates(&self.db, category)
    }

    pub fn delete_template(&self, id: &str) -> Result<()> {
        templates::delete_template(&self.db, id)
    }

    // ─── Note linking delegation ──────────────────────────────────────────────

    pub fn link_to_note(&self, canvas_id: &str, note_path: Option<&str>) -> Result<()> {
        note_linking::link_to_note(&self.db, canvas_id, note_path)
    }

    pub fn get_canvases_for_note(&self, note_path: &str) -> Result<Vec<CanvasDocument>> {
        note_linking::get_canvases_for_note(&self.db, note_path)
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
