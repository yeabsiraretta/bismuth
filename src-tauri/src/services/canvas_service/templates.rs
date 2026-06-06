//! Canvas template persistence (save, load, list, delete reusable element sets)

use crate::db::Database;
use crate::error::Result;
use crate::models::canvas::CanvasElement;
use std::sync::Arc;

pub(super) fn save_template(
    db: &Arc<Database>,
    name: &str,
    elements: &[CanvasElement],
    description: &str,
    category: &str,
) -> Result<serde_json::Value> {
    let conn_arc = db.conn();
    let conn = conn_arc.lock().unwrap();

    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().timestamp();
    let elements_json = serde_json::to_string(elements)?;

    conn.execute(
        "INSERT INTO canvas_templates (id, name, description, category, elements_json, created_at, modified_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        (&id, name, description, category, &elements_json, now, now),
    )?;

    Ok(serde_json::json!({
        "id": id,
        "name": name,
        "description": description,
        "category": category,
        "elements": elements,
        "created_at": now,
        "modified_at": now,
    }))
}

pub(super) fn load_template(db: &Arc<Database>, id: &str) -> Result<serde_json::Value> {
    let conn_arc = db.conn();
    let conn = conn_arc.lock().unwrap();

    let result = conn.query_row(
        "SELECT id, name, description, category, elements_json, created_at, modified_at
         FROM canvas_templates WHERE id = ?1",
        [id],
        |row| {
            let elements_json: String = row.get(4)?;
            Ok(serde_json::json!({
                "id": row.get::<_, String>(0)?,
                "name": row.get::<_, String>(1)?,
                "description": row.get::<_, String>(2).unwrap_or_default(),
                "category": row.get::<_, String>(3).unwrap_or_default(),
                "elements": serde_json::from_str::<serde_json::Value>(&elements_json).unwrap_or_default(),
                "created_at": row.get::<_, i64>(5)?,
                "modified_at": row.get::<_, i64>(6)?,
            }))
        },
    )?;

    Ok(result)
}

pub(super) fn list_templates(
    db: &Arc<Database>,
    category: Option<&str>,
) -> Result<Vec<serde_json::Value>> {
    let conn_arc = db.conn();
    let conn = conn_arc.lock().unwrap();

    let templates = if let Some(cat) = category {
        let mut stmt = conn.prepare(
            "SELECT id, name, description, category, elements_json, created_at, modified_at
             FROM canvas_templates WHERE category = ?1 ORDER BY modified_at DESC",
        )?;
        let rows = stmt.query_map([cat], |row| {
            let elements_json: String = row.get(4)?;
            Ok(serde_json::json!({
                "id": row.get::<_, String>(0)?,
                "name": row.get::<_, String>(1)?,
                "description": row.get::<_, String>(2).unwrap_or_default(),
                "category": row.get::<_, String>(3).unwrap_or_default(),
                "elements": serde_json::from_str::<serde_json::Value>(&elements_json).unwrap_or_default(),
                "created_at": row.get::<_, i64>(5)?,
                "modified_at": row.get::<_, i64>(6)?,
            }))
        })?;
        rows.collect::<std::result::Result<Vec<_>, _>>()?
    } else {
        let mut stmt = conn.prepare(
            "SELECT id, name, description, category, elements_json, created_at, modified_at
             FROM canvas_templates ORDER BY modified_at DESC",
        )?;
        let rows = stmt.query_map([], |row| {
            let elements_json: String = row.get(4)?;
            Ok(serde_json::json!({
                "id": row.get::<_, String>(0)?,
                "name": row.get::<_, String>(1)?,
                "description": row.get::<_, String>(2).unwrap_or_default(),
                "category": row.get::<_, String>(3).unwrap_or_default(),
                "elements": serde_json::from_str::<serde_json::Value>(&elements_json).unwrap_or_default(),
                "created_at": row.get::<_, i64>(5)?,
                "modified_at": row.get::<_, i64>(6)?,
            }))
        })?;
        rows.collect::<std::result::Result<Vec<_>, _>>()?
    };

    Ok(templates)
}

pub(super) fn delete_template(db: &Arc<Database>, id: &str) -> Result<()> {
    let conn_arc = db.conn();
    let conn = conn_arc.lock().unwrap();
    conn.execute("DELETE FROM canvas_templates WHERE id = ?1", [id])?;
    Ok(())
}
