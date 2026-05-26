use crate::db::Database;
use crate::error::Result;
use crate::models::canvas::{CanvasDocument, CanvasElement, Layer};
use std::sync::Arc;

pub struct CanvasService {
    db: Arc<Database>,
}

impl CanvasService {
    pub fn new(db: Arc<Database>) -> Self {
        Self { db }
    }

    /// Creates a new canvas document
    pub fn create_canvas(&self, name: String) -> Result<CanvasDocument> {
        let canvas = CanvasDocument::new(name);
        self.save_canvas(&canvas)?;
        Ok(canvas)
    }

    /// Saves a canvas document to the database
    pub fn save_canvas(&self, canvas: &CanvasDocument) -> Result<()> {
        let conn_arc = self.db.conn();
        let conn = conn_arc.lock().unwrap();

        // Save canvas document
        conn.execute(
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
        conn.execute("DELETE FROM canvas_elements WHERE canvas_id = ?1", [&canvas.id])?;
        conn.execute("DELETE FROM canvas_layers WHERE canvas_id = ?1", [&canvas.id])?;

        // Save layers
        for layer in &canvas.layers {
            conn.execute(
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

            conn.execute(
                "INSERT INTO canvas_elements 
                 (id, canvas_id, element_type, x, y, width, height, rotation, 
                  properties, layer_id, z_index, locked, visible)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
                (
                    &element.id,
                    &canvas.id,
                    format!("{:?}", element.element_type).to_lowercase(),
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

        Ok(())
    }

    /// Loads a canvas document from the database
    pub fn load_canvas(&self, id: &str) -> Result<CanvasDocument> {
        let conn_arc = self.db.conn();
        let conn = conn_arc.lock().unwrap();

        // Load canvas document
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
                    viewport: crate::models::canvas::Viewport {
                        x: row.get(3)?,
                        y: row.get(4)?,
                        scale: row.get(5)?,
                    },
                    grid_size: row.get(6)?,
                    snap_to_grid: row.get::<_, i32>(7)? != 0,
                    elements: Vec::new(),
                    layers: Vec::new(),
                    created_at: row.get(8)?,
                    modified_at: row.get(9)?,
                })
            },
        )?;

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
            let element_type = match element_type_str.as_str() {
                "rectangle" => crate::models::canvas::ElementType::Rectangle,
                "circle" => crate::models::canvas::ElementType::Circle,
                "text" => crate::models::canvas::ElementType::Text,
                "image" => crate::models::canvas::ElementType::Image,
                "group" => crate::models::canvas::ElementType::Group,
                _ => crate::models::canvas::ElementType::Rectangle,
            };

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
            })
        })?;

        canvas.elements = elements.collect::<std::result::Result<Vec<_>, _>>()?;

        Ok(canvas)
    }

    /// Lists all canvas documents
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
                viewport: crate::models::canvas::Viewport {
                    x: row.get(3)?,
                    y: row.get(4)?,
                    scale: row.get(5)?,
                },
                grid_size: row.get(6)?,
                snap_to_grid: row.get::<_, i32>(7)? != 0,
                elements: Vec::new(), // Don't load elements for list view
                layers: Vec::new(),   // Don't load layers for list view
                created_at: row.get(8)?,
                modified_at: row.get(9)?,
            })
        })?;

        Ok(canvases.collect::<std::result::Result<Vec<_>, _>>()?)
    }

    /// Deletes a canvas document
    pub fn delete_canvas(&self, id: &str) -> Result<()> {
        let conn_arc = self.db.conn();
        let conn = conn_arc.lock().unwrap();

        // Foreign key constraints will cascade delete elements and layers
        conn.execute("DELETE FROM canvas_documents WHERE id = ?1", [id])?;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::canvas::CanvasElement;
    use std::path::PathBuf;

    #[test]
    fn test_create_and_load_canvas() {
        let temp_dir = tempfile::tempdir().unwrap();
        let db_path = temp_dir.path().join("test.db");
        let db = Arc::new(Database::new(&db_path).unwrap());
        let service = CanvasService::new(db);

        // Create canvas
        let canvas = service.create_canvas("Test Canvas".to_string()).unwrap();
        assert_eq!(canvas.name, "Test Canvas");

        // Load canvas
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
        
        // Add an element
        let element = CanvasElement::new_rectangle(10.0, 20.0, 100.0, 50.0, layer_id);
        canvas.add_element(element);

        // Save
        service.save_canvas(&canvas).unwrap();

        // Load and verify
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

        // Create multiple canvases
        service.create_canvas("Canvas 1".to_string()).unwrap();
        service.create_canvas("Canvas 2".to_string()).unwrap();

        // List
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
        
        // Delete
        service.delete_canvas(&canvas.id).unwrap();

        // Verify deleted
        let result = service.load_canvas(&canvas.id);
        assert!(result.is_err());
    }
}
