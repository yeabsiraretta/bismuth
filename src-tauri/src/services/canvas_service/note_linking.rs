//! Canvas-to-note linking operations

use crate::db::Database;
use crate::error::Result;
use crate::models::canvas::{CanvasDocument, Viewport};
use std::sync::Arc;

pub(super) fn link_to_note(
    db: &Arc<Database>,
    canvas_id: &str,
    note_path: Option<&str>,
) -> Result<()> {
    let conn_arc = db.conn();
    let conn = conn_arc.lock().unwrap();
    conn.execute(
        "UPDATE canvas_documents SET note_id = ?1 WHERE id = ?2",
        (note_path, canvas_id),
    )?;
    Ok(())
}

pub(super) fn get_canvases_for_note(
    db: &Arc<Database>,
    note_path: &str,
) -> Result<Vec<CanvasDocument>> {
    let conn_arc = db.conn();
    let conn = conn_arc.lock().unwrap();

    let mut stmt = conn.prepare(
        "SELECT id, name, vault_id, viewport_x, viewport_y, viewport_scale,
                grid_size, snap_to_grid, created_at, modified_at
         FROM canvas_documents WHERE note_id = ?1 ORDER BY modified_at DESC",
    )?;

    let canvases = stmt.query_map([note_path], |row| {
        Ok(CanvasDocument {
            id: row.get(0)?,
            name: row.get(1)?,
            vault_id: row.get(2)?,
            note_id: Some(note_path.to_string()),
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
