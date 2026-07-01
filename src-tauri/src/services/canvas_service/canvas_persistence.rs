//! Canvas document persistence: save and load operations.

use crate::db::Database;
use crate::error::Result;
use crate::models::canvas::{CanvasDocument, CanvasElement, ElementType, Layer, Viewport};
use std::sync::Arc;

/// Saves a canvas document (upsert), replacing all elements and layers.
/// All operations are wrapped in a transaction for crash safety.
pub fn save_canvas(db: &Arc<Database>, canvas: &CanvasDocument) -> Result<()> {
    let conn_arc = db.conn();
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
            tracing::debug!("Skipping pages/components save (pre-migration schema): {}", e);
        },
        Err(e) => {
            tracing::warn!("Unexpected error saving pages/components: {}", e);
        },
    }

    tx.commit()?;
    Ok(())
}

/// Loads a complete canvas document including all layers and elements.
pub fn load_canvas(db: &Arc<Database>, id: &str) -> Result<CanvasDocument> {
    let conn_arc = db.conn();
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
                flow_links: Vec::new(),
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
