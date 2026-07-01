//! SQLite CRUD for agent_proposed_changes table stored in `.bismuth/db/agent.db`.

use rusqlite::{Connection, Result as SqliteResult};
use serde::{Deserialize, Serialize};
use std::path::Path;

const MIGRATION_SQL: &str = "
CREATE TABLE IF NOT EXISTS agent_proposed_changes (
    change_id        TEXT PRIMARY KEY,
    vault_path       TEXT NOT NULL,
    action           TEXT NOT NULL,
    target_path      TEXT NOT NULL,
    proposed_content TEXT,
    new_path         TEXT,
    created_at       TEXT NOT NULL,
    status           TEXT NOT NULL DEFAULT 'pending',
    agent_name       TEXT NOT NULL,
    rationale        TEXT
);
CREATE INDEX IF NOT EXISTS idx_changes_vault  ON agent_proposed_changes(vault_path);
CREATE INDEX IF NOT EXISTS idx_changes_status ON agent_proposed_changes(status);
";

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AgentProposedChange {
    pub change_id: String,
    pub vault_path: String,
    pub action: String,
    pub target_path: String,
    pub proposed_content: Option<String>,
    pub new_path: Option<String>,
    pub created_at: String,
    pub status: String,
    pub agent_name: String,
    pub rationale: Option<String>,
}

/// Opens or creates `.bismuth/db/agent.db` and runs the schema migration.
pub fn open_agent_db(vault_root: &str) -> Result<Connection, String> {
    let db_dir = Path::new(vault_root).join(".bismuth").join("db");
    std::fs::create_dir_all(&db_dir)
        .map_err(|e| format!("Failed to create agent db dir: {}", e))?;

    let db_path = db_dir.join("agent.db");
    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open agent.db: {}", e))?;

    conn.execute_batch(MIGRATION_SQL)
        .map_err(|e| format!("Agent DB migration failed: {}", e))?;

    Ok(conn)
}

/// Inserts a new proposed change record.
pub fn create_change(conn: &Connection, change: &AgentProposedChange) -> Result<(), String> {
    conn.execute(
        "INSERT INTO agent_proposed_changes (change_id, vault_path, action, target_path, proposed_content, new_path, created_at, status, agent_name, rationale) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        rusqlite::params![
            change.change_id,
            change.vault_path,
            change.action,
            change.target_path,
            change.proposed_content,
            change.new_path,
            change.created_at,
            change.status,
            change.agent_name,
            change.rationale,
        ],
    ).map_err(|e| format!("Failed to create change: {}", e))?;
    tracing::info!("Created proposed change {} for vault {}", change.change_id, change.vault_path);
    Ok(())
}

/// Lists proposed changes for a vault, optionally filtered by status.
pub fn list_changes(
    conn: &Connection,
    vault_path: &str,
    status_filter: Option<&str>,
) -> Result<Vec<AgentProposedChange>, String> {
    if let Some(status) = status_filter {
        let mut stmt = conn.prepare(
            "SELECT change_id, vault_path, action, target_path, proposed_content, new_path, created_at, status, agent_name, rationale FROM agent_proposed_changes WHERE vault_path=?1 AND status=?2 ORDER BY created_at DESC",
        ).map_err(|e| format!("Prepare error: {}", e))?;
        let rows = stmt.query_map(rusqlite::params![vault_path, status], map_row)
            .map_err(|e| format!("Query error: {}", e))?;
        rows.collect::<SqliteResult<Vec<_>>>().map_err(|e| format!("Row error: {}", e))
    } else {
        let mut stmt = conn.prepare(
            "SELECT change_id, vault_path, action, target_path, proposed_content, new_path, created_at, status, agent_name, rationale FROM agent_proposed_changes WHERE vault_path=?1 ORDER BY created_at DESC",
        ).map_err(|e| format!("Prepare error: {}", e))?;
        let rows = stmt.query_map(rusqlite::params![vault_path], map_row)
            .map_err(|e| format!("Query error: {}", e))?;
        rows.collect::<SqliteResult<Vec<_>>>().map_err(|e| format!("Row error: {}", e))
    }
}

fn map_row(row: &rusqlite::Row) -> SqliteResult<AgentProposedChange> {
    Ok(AgentProposedChange {
        change_id: row.get(0)?,
        vault_path: row.get(1)?,
        action: row.get(2)?,
        target_path: row.get(3)?,
        proposed_content: row.get(4)?,
        new_path: row.get(5)?,
        created_at: row.get(6)?,
        status: row.get(7)?,
        agent_name: row.get(8)?,
        rationale: row.get(9)?,
    })
}

/// Gets a single change by ID.
pub fn get_change(conn: &Connection, change_id: &str) -> Result<Option<AgentProposedChange>, String> {
    let mut stmt = conn.prepare(
        "SELECT change_id, vault_path, action, target_path, proposed_content, new_path, created_at, status, agent_name, rationale FROM agent_proposed_changes WHERE change_id=?1",
    ).map_err(|e| format!("Prepare error: {}", e))?;

    let mut rows = stmt.query_map(rusqlite::params![change_id], map_row)
        .map_err(|e| format!("Query error: {}", e))?;

    match rows.next() {
        Some(Ok(change)) => Ok(Some(change)),
        Some(Err(e)) => Err(format!("Row error: {}", e)),
        None => Ok(None),
    }
}

/// Updates the status of a change.
pub fn update_status(conn: &Connection, change_id: &str, status: &str) -> Result<(), String> {
    conn.execute(
        "UPDATE agent_proposed_changes SET status=?1 WHERE change_id=?2",
        rusqlite::params![status, change_id],
    ).map_err(|e| format!("Failed to update change status: {}", e))?;
    tracing::info!("Change {} status updated to {}", change_id, status);
    Ok(())
}

/// Deletes a change record.
pub fn delete_change(conn: &Connection, change_id: &str) -> Result<(), String> {
    conn.execute(
        "DELETE FROM agent_proposed_changes WHERE change_id=?1",
        rusqlite::params![change_id],
    ).map_err(|e| format!("Failed to delete change: {}", e))?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;

    fn setup() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute_batch(MIGRATION_SQL).unwrap();
        conn
    }

    fn make_change(change_id: &str, vault_path: &str, status: &str) -> AgentProposedChange {
        AgentProposedChange {
            change_id: change_id.to_string(),
            vault_path: vault_path.to_string(),
            action: "update".to_string(),
            target_path: "notes/test.md".to_string(),
            proposed_content: Some("new content".to_string()),
            new_path: None,
            created_at: "2026-06-21T12:00:00Z".to_string(),
            status: status.to_string(),
            agent_name: "test-agent".to_string(),
            rationale: Some("test reason".to_string()),
        }
    }

    #[test]
    fn test_create_and_list_pending() {
        let conn = setup();
        let change = make_change("c1", "/vault1", "pending");
        create_change(&conn, &change).unwrap();
        let pending = list_changes(&conn, "/vault1", Some("pending")).unwrap();
        assert_eq!(pending.len(), 1);
        assert_eq!(pending[0].change_id, "c1");
    }

    #[test]
    fn test_vault_isolation() {
        let conn = setup();
        create_change(&conn, &make_change("c1", "/vault1", "pending")).unwrap();
        create_change(&conn, &make_change("c2", "/vault2", "pending")).unwrap();
        let v1 = list_changes(&conn, "/vault1", Some("pending")).unwrap();
        let v2 = list_changes(&conn, "/vault2", Some("pending")).unwrap();
        assert_eq!(v1.len(), 1);
        assert_eq!(v2.len(), 1);
        assert_ne!(v1[0].change_id, v2[0].change_id);
    }

    #[test]
    fn test_update_status_to_approved() {
        let conn = setup();
        create_change(&conn, &make_change("c1", "/vault1", "pending")).unwrap();
        update_status(&conn, "c1", "approved").unwrap();
        let pending = list_changes(&conn, "/vault1", Some("pending")).unwrap();
        assert_eq!(pending.len(), 0);
        let approved = list_changes(&conn, "/vault1", Some("approved")).unwrap();
        assert_eq!(approved.len(), 1);
    }

    #[test]
    fn test_reject_change() {
        let conn = setup();
        create_change(&conn, &make_change("c1", "/vault1", "pending")).unwrap();
        update_status(&conn, "c1", "rejected").unwrap();
        let rejected = list_changes(&conn, "/vault1", Some("rejected")).unwrap();
        assert_eq!(rejected.len(), 1);
        assert_eq!(rejected[0].status, "rejected");
    }

    #[test]
    fn test_double_apply_guard_data() {
        let conn = setup();
        create_change(&conn, &make_change("c1", "/vault1", "pending")).unwrap();
        update_status(&conn, "c1", "approved").unwrap();
        // A second attempt to "approve" an already-approved change should be detectable
        let change = get_change(&conn, "c1").unwrap().unwrap();
        assert_eq!(change.status, "approved", "Change should already be approved");
    }

    #[test]
    fn test_migration_idempotent() {
        let conn = setup();
        // Re-running the migration SQL should not fail (CREATE TABLE IF NOT EXISTS)
        conn.execute_batch(MIGRATION_SQL).unwrap();
    }
}
