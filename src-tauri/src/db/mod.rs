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

    /// Current app version (from Cargo.toml).
    const APP_VERSION: &'static str = env!("CARGO_PKG_VERSION");

    /// Minimum app version that can read schema written by this version.
    /// Update this when a migration adds breaking changes.
    /// N-1 rule: this must be at most one minor version behind APP_VERSION.
    const MIN_READER_VERSION: &'static str = "0.3.0";

    /// Runs database migrations with N-1 compatibility tracking.
    fn run_migrations(&self) -> Result<()> {
        let mut conn = self.conn.lock().unwrap();

        conn.execute(
            "CREATE TABLE IF NOT EXISTS schema_version (
                version INTEGER PRIMARY KEY,
                applied_at INTEGER NOT NULL
            )",
            [],
        )?;

        // N-1 compat metadata table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS schema_compat (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                writer_version TEXT NOT NULL,
                min_reader_version TEXT NOT NULL,
                schema_version INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            )",
            [],
        )?;

        // Forward-compatibility check: can this app read the existing data?
        self.check_forward_compat(&conn)?;

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

        // Stamp compat metadata after successful migration
        self.stamp_compat(&conn, 3)?;

        Ok(())
    }

    /// Checks if this app version can read the database.
    /// If the DB was written by a future version that requires a newer reader,
    /// we log a warning but still proceed (best-effort forward compat).
    fn check_forward_compat(&self, conn: &Connection) -> Result<()> {
        let result: std::result::Result<(String, String, i64), _> = conn.query_row(
            "SELECT writer_version, min_reader_version, schema_version FROM schema_compat WHERE id = 1",
            [],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
        );

        if let Ok((writer_version, min_reader, _schema_ver)) = result {
            if Self::compare_semver(Self::APP_VERSION, &min_reader) < 0 {
                tracing::warn!(
                    "N-1 compat: DB was written by v{} (requires reader >= v{}), we are v{}. \
                     Data may be partially incompatible.",
                    writer_version, min_reader, Self::APP_VERSION
                );
            }
        }
        // No compat row yet = fresh DB or pre-compat version, safe to proceed
        Ok(())
    }

    /// Stamps the compat metadata after a successful migration run.
    fn stamp_compat(&self, conn: &Connection, schema_version: i64) -> Result<()> {
        conn.execute(
            "INSERT INTO schema_compat (id, writer_version, min_reader_version, schema_version, updated_at)
             VALUES (1, ?1, ?2, ?3, ?4)
             ON CONFLICT(id) DO UPDATE SET
               writer_version = excluded.writer_version,
               min_reader_version = excluded.min_reader_version,
               schema_version = excluded.schema_version,
               updated_at = excluded.updated_at",
            rusqlite::params![
                Self::APP_VERSION,
                Self::MIN_READER_VERSION,
                schema_version,
                chrono::Utc::now().timestamp(),
            ],
        )?;
        Ok(())
    }

    /// Simple semver comparison: returns -1, 0, or 1.
    fn compare_semver(a: &str, b: &str) -> i32 {
        let parse = |s: &str| -> (u32, u32, u32) {
            let parts: Vec<u32> = s.split('.').filter_map(|p| p.parse().ok()).collect();
            (parts.first().copied().unwrap_or(0),
             parts.get(1).copied().unwrap_or(0),
             parts.get(2).copied().unwrap_or(0))
        };
        let (a_maj, a_min, a_pat) = parse(a);
        let (b_maj, b_min, b_pat) = parse(b);
        match a_maj.cmp(&b_maj) {
            std::cmp::Ordering::Less => return -1,
            std::cmp::Ordering::Greater => return 1,
            _ => {}
        }
        match a_min.cmp(&b_min) {
            std::cmp::Ordering::Less => return -1,
            std::cmp::Ordering::Greater => return 1,
            _ => {}
        }
        match a_pat.cmp(&b_pat) {
            std::cmp::Ordering::Less => -1,
            std::cmp::Ordering::Greater => 1,
            std::cmp::Ordering::Equal => 0,
        }
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
        assert!(tables.contains(&"schema_compat".to_string()));
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

        assert_eq!(version, 3);
    }

    #[test]
    fn test_compat_metadata_stamped() {
        let dir = tempdir().unwrap();
        let db_path = dir.path().join("test.db");
        let db = Database::new(&db_path).unwrap();

        let conn = db.conn.lock().unwrap();
        let (writer, min_reader, schema_ver): (String, String, i64) = conn
            .query_row(
                "SELECT writer_version, min_reader_version, schema_version FROM schema_compat WHERE id = 1",
                [],
                |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
            )
            .unwrap();

        assert_eq!(writer, Database::APP_VERSION);
        assert_eq!(min_reader, Database::MIN_READER_VERSION);
        assert_eq!(schema_ver, 3);
    }

    #[test]
    fn test_semver_comparison() {
        assert_eq!(Database::compare_semver("0.3.0", "0.3.0"), 0);
        assert_eq!(Database::compare_semver("0.2.0", "0.3.0"), -1);
        assert_eq!(Database::compare_semver("0.4.0", "0.3.0"), 1);
        assert_eq!(Database::compare_semver("1.0.0", "0.9.9"), 1);
        assert_eq!(Database::compare_semver("0.3.1", "0.3.0"), 1);
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
