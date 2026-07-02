//! Canvas CRUD query helpers extracted from `mod.rs`.
//!
//! `list_canvases` and `delete_canvas` operate directly on the database
//! without the full canvas element hierarchy.

use crate::db::Database;
use crate::error::Result;
use crate::models::canvas::{CanvasDocument, Viewport};
use std::sync::Arc;

/// Lists all canvas documents (metadata only, without elements/layers).
pub(super) fn list_canvases(db: &Arc<Database>) -> Result<Vec<CanvasDocument>> {
    let conn_arc = db.conn();
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
            flow_links: Vec::new(),
            created_at: row.get(8)?,
            modified_at: row.get(9)?,
        })
    })?;

    Ok(canvases.collect::<std::result::Result<Vec<_>, _>>()?)
}

/// Deletes a canvas document and all associated elements/layers.
pub(super) fn delete_canvas(db: &Arc<Database>, id: &str) -> Result<()> {
    let conn_arc = db.conn();
    let conn = conn_arc.lock().unwrap();
    conn.execute("DELETE FROM canvas_documents WHERE id = ?1", [id])?;
    Ok(())
}

/// Sanitizes a canvas name for use as a filename.
/// Removes path separators and other problematic characters.
pub(super) fn sanitize_filename(name: &str) -> String {
    name.chars()
        .map(|c| match c {
            '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|' | '\0' => '_',
            '.' if name.starts_with('.') => '_',
            _ => c,
        })
        .collect::<String>()
        .trim()
        .to_string()
}
