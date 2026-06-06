//! Database layer for Bismuth PKM Editor
//!
//! Provides SQLite database initialization, migrations, and access.
//! Stores metadata for notes, links, tags, and graph data.

mod queries;
mod schema;

use crate::error::Result;
use rusqlite::Connection;
use std::path::Path;
use std::sync::{Arc, Mutex};

/// Database wrapper with connection pooling
pub struct Database {
    conn: Arc<Mutex<Connection>>,
}

impl Database {
    /// Creates a new database connection
    ///
    /// Opens or creates the SQLite database at the specified path.
    /// Runs migrations to ensure schema is up-to-date.
    pub fn new(path: &Path) -> Result<Self> {
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)?;
        }

        let conn = Connection::open(path)?;

        conn.pragma_update(None, "foreign_keys", &"ON")?;
        conn.pragma_update(None, "journal_mode", &"WAL")?;

        let db = Self {
            conn: Arc::new(Mutex::new(conn)),
        };

        db.run_migrations()?;
        Ok(db)
    }

    /// Runs database migrations
    fn run_migrations(&self) -> Result<()> {
        let mut conn = self.conn.lock().unwrap();

        conn.execute(
            "CREATE TABLE IF NOT EXISTS schema_version (
                version INTEGER PRIMARY KEY,
                applied_at INTEGER NOT NULL
            )",
            [],
        )?;

        let current_version: i64 = conn
            .query_row(
                "SELECT COALESCE(MAX(version), 0) FROM schema_version",
                [],
                |row| row.get(0),
            )
            .unwrap_or(0);

        if current_version < 1 {
            let tx = conn.transaction()?;
            schema::migrate_v1(&tx)?;
            tx.commit()?;
        }

        if current_version < 2 {
            let tx = conn.transaction()?;
            schema::migrate_v2(&tx)?;
            tx.commit()?;
        }

        if current_version < 3 {
            let tx = conn.transaction()?;
            schema::migrate_v3(&tx)?;
            tx.commit()?;
        }

        Ok(())
    }

    /// Gets a reference to the database connection
    pub fn conn(&self) -> Arc<Mutex<Connection>> {
        Arc::clone(&self.conn)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_database_creation() {
        let dir = tempdir().unwrap();
        let db_path = dir.path().join("test.db");

        let _db = Database::new(&db_path).unwrap();
        assert!(db_path.exists());
    }

    #[test]
    fn test_schema_tables_exist() {
        let dir = tempdir().unwrap();
        let db_path = dir.path().join("test.db");
        let db = Database::new(&db_path).unwrap();

        let conn = db.conn.lock().unwrap();

        let tables: Vec<String> = conn
            .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
            .unwrap()
            .query_map([], |row| row.get(0))
            .unwrap()
            .collect::<std::result::Result<Vec<_>, _>>()
            .unwrap();

        assert!(tables.contains(&"notes".to_string()));
        assert!(tables.contains(&"links".to_string()));
        assert!(tables.contains(&"tags".to_string()));
        assert!(tables.contains(&"jdex_entries".to_string()));
        assert!(tables.contains(&"graph_nodes".to_string()));
        assert!(tables.contains(&"graph_edges".to_string()));
        assert!(tables.contains(&"schema_version".to_string()));
    }

    #[test]
    fn test_indexes_created() {
        let dir = tempdir().unwrap();
        let db_path = dir.path().join("test.db");
        let db = Database::new(&db_path).unwrap();

        let conn = db.conn.lock().unwrap();

        let indexes: Vec<String> = conn
            .prepare("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'")
            .unwrap()
            .query_map([], |row| row.get(0))
            .unwrap()
            .collect::<std::result::Result<Vec<_>, _>>()
            .unwrap();

        assert!(indexes.contains(&"idx_notes_modified".to_string()));
        assert!(indexes.contains(&"idx_links_source".to_string()));
        assert!(indexes.contains(&"idx_graph_edges_from".to_string()));
    }

    #[test]
    fn test_migration_idempotent() {
        let dir = tempdir().unwrap();
        let db_path = dir.path().join("test.db");

        let _db1 = Database::new(&db_path).unwrap();
        let db2 = Database::new(&db_path).unwrap();

        let conn = db2.conn.lock().unwrap();
        let version: i64 = conn
            .query_row("SELECT MAX(version) FROM schema_version", [], |row| {
                row.get(0)
            })
            .unwrap();

        assert_eq!(version, 2);
    }

    #[test]
    fn test_foreign_keys_enabled() {
        let dir = tempdir().unwrap();
        let db_path = dir.path().join("test.db");
        let db = Database::new(&db_path).unwrap();

        let conn = db.conn.lock().unwrap();
        let fk_enabled: i64 = conn
            .query_row("PRAGMA foreign_keys", [], |row| row.get(0))
            .unwrap();

        assert_eq!(fk_enabled, 1);
    }
}
