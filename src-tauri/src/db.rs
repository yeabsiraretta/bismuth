//! Database layer for Bismuth PKM Editor
//!
//! Provides SQLite database initialization, migrations, and access.
//! Stores metadata for notes, links, tags, and graph data.

use crate::error::Result;
use rusqlite::{Connection, Transaction};
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
    ///
    /// # Arguments
    ///
    /// * `path` - Path to the database file (typically `.bismuth/bismuth.db`)
    ///
    /// # Returns
    ///
    /// A new Database instance with initialized schema
    pub fn new(path: &Path) -> Result<Self> {
        // Create parent directory if it doesn't exist
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)?;
        }

        let conn = Connection::open(path)?;

        // Enable foreign keys
        conn.pragma_update(None, "foreign_keys", &"ON")?;

        // Enable WAL mode for better concurrency
        conn.pragma_update(None, "journal_mode", &"WAL")?;

        let db = Self {
            conn: Arc::new(Mutex::new(conn)),
        };

        // Run migrations
        db.run_migrations()?;

        Ok(db)
    }

    /// Runs database migrations
    fn run_migrations(&self) -> Result<()> {
        let mut conn = self.conn.lock().unwrap();

        // Create schema version table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS schema_version (
                version INTEGER PRIMARY KEY,
                applied_at INTEGER NOT NULL
            )",
            [],
        )?;

        // Check current version
        let current_version: i64 = conn
            .query_row(
                "SELECT COALESCE(MAX(version), 0) FROM schema_version",
                [],
                |row| row.get(0),
            )
            .unwrap_or(0);

        // Apply migrations
        if current_version < 1 {
            let tx = conn.transaction()?;
            Self::migrate_v1(&tx)?;
            tx.commit()?;
        }

        if current_version < 2 {
            let tx = conn.transaction()?;
            Self::migrate_v2(&tx)?;
            tx.commit()?;
        }

        if current_version < 3 {
            let tx = conn.transaction()?;
            Self::migrate_v3(&tx)?;
            tx.commit()?;
        }

        Ok(())
    }

    /// Migration v1: Initial schema
    fn migrate_v1(tx: &Transaction) -> Result<()> {
        // Notes table
        tx.execute(
            "CREATE TABLE notes (
                path TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                frontmatter_json TEXT,
                created_at INTEGER NOT NULL,
                modified_at INTEGER NOT NULL
            )",
            [],
        )?;

        // Links table
        tx.execute(
            "CREATE TABLE links (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_path TEXT NOT NULL,
                target_title TEXT NOT NULL,
                target_path TEXT,
                is_resolved INTEGER NOT NULL DEFAULT 0,
                FOREIGN KEY (source_path) REFERENCES notes(path) ON DELETE CASCADE
            )",
            [],
        )?;

        // Tags table
        tx.execute(
            "CREATE TABLE tags (
                name TEXT PRIMARY KEY,
                count INTEGER NOT NULL DEFAULT 0
            )",
            [],
        )?;

        // JDex entries table (Johnny.Decimal index)
        tx.execute(
            "CREATE TABLE jdex_entries (
                id TEXT PRIMARY KEY,
                area INTEGER NOT NULL,
                category INTEGER NOT NULL,
                item_number INTEGER NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                keywords TEXT
            )",
            [],
        )?;

        // Graph nodes table
        tx.execute(
            "CREATE TABLE graph_nodes (
                id TEXT PRIMARY KEY,
                node_type TEXT NOT NULL,
                label TEXT NOT NULL,
                properties TEXT,
                embedding BLOB
            )",
            [],
        )?;

        // Graph edges table
        tx.execute(
            "CREATE TABLE graph_edges (
                id TEXT PRIMARY KEY,
                from_node_id TEXT NOT NULL,
                to_node_id TEXT NOT NULL,
                edge_type TEXT NOT NULL,
                weight REAL DEFAULT 1.0,
                FOREIGN KEY (from_node_id) REFERENCES graph_nodes(id) ON DELETE CASCADE,
                FOREIGN KEY (to_node_id) REFERENCES graph_nodes(id) ON DELETE CASCADE
            )",
            [],
        )?;

        // Create indexes for performance
        Self::create_indexes_v1(tx)?;

        // Record migration
        tx.execute(
            "INSERT INTO schema_version (version, applied_at) VALUES (1, ?)",
            [chrono::Utc::now().timestamp()],
        )?;

        Ok(())
    }

    /// Creates performance indexes for v1 schema
    fn create_indexes_v1(tx: &Transaction) -> Result<()> {
        // Notes indexes (path is PK, auto-indexed)
        tx.execute("CREATE INDEX idx_notes_modified ON notes(modified_at)", [])?;

        // Links indexes
        tx.execute("CREATE INDEX idx_links_source ON links(source_path)", [])?;
        tx.execute("CREATE INDEX idx_links_target ON links(target_title)", [])?;
        tx.execute("CREATE INDEX idx_links_resolved ON links(is_resolved)", [])?;

        // Tags index (name is PK, auto-indexed)

        // JDex indexes
        tx.execute("CREATE INDEX idx_jdex_area ON jdex_entries(area)", [])?;
        tx.execute(
            "CREATE INDEX idx_jdex_category ON jdex_entries(category)",
            [],
        )?;

        // Graph indexes
        tx.execute(
            "CREATE INDEX idx_graph_nodes_type ON graph_nodes(node_type)",
            [],
        )?;
        tx.execute(
            "CREATE INDEX idx_graph_edges_from ON graph_edges(from_node_id)",
            [],
        )?;
        tx.execute(
            "CREATE INDEX idx_graph_edges_to ON graph_edges(to_node_id)",
            [],
        )?;
        tx.execute(
            "CREATE INDEX idx_graph_edges_type ON graph_edges(edge_type)",
            [],
        )?;

        // Run ANALYZE for query optimizer
        tx.execute("ANALYZE", [])?;

        Ok(())
    }

    /// Migration v2: Canvas tables
    fn migrate_v2(tx: &Transaction) -> Result<()> {
        // Canvas documents table
        tx.execute(
            "CREATE TABLE canvas_documents (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                vault_id TEXT,
                viewport_x REAL DEFAULT 0,
                viewport_y REAL DEFAULT 0,
                viewport_scale REAL DEFAULT 1.0,
                grid_size INTEGER DEFAULT 16,
                snap_to_grid INTEGER DEFAULT 1,
                created_at INTEGER NOT NULL,
                modified_at INTEGER NOT NULL
            )",
            [],
        )?;

        // Canvas elements table
        tx.execute(
            "CREATE TABLE canvas_elements (
                id TEXT PRIMARY KEY,
                canvas_id TEXT NOT NULL,
                element_type TEXT NOT NULL,
                x REAL NOT NULL,
                y REAL NOT NULL,
                width REAL NOT NULL,
                height REAL NOT NULL,
                rotation REAL DEFAULT 0,
                properties TEXT,
                layer_id TEXT,
                z_index INTEGER DEFAULT 0,
                locked INTEGER DEFAULT 0,
                visible INTEGER DEFAULT 1,
                FOREIGN KEY (canvas_id) REFERENCES canvas_documents(id) ON DELETE CASCADE
            )",
            [],
        )?;

        // Canvas layers table
        tx.execute(
            "CREATE TABLE canvas_layers (
                id TEXT PRIMARY KEY,
                canvas_id TEXT NOT NULL,
                name TEXT NOT NULL,
                z_order INTEGER NOT NULL,
                visible INTEGER DEFAULT 1,
                locked INTEGER DEFAULT 0,
                FOREIGN KEY (canvas_id) REFERENCES canvas_documents(id) ON DELETE CASCADE
            )",
            [],
        )?;

        // Component templates table
        tx.execute(
            "CREATE TABLE canvas_templates (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                elements_json TEXT NOT NULL,
                thumbnail_path TEXT,
                created_at INTEGER NOT NULL
            )",
            [],
        )?;

        // Create indexes
        Self::create_indexes_v2(tx)?;

        // Record migration
        tx.execute(
            "INSERT INTO schema_version (version, applied_at) VALUES (2, ?)",
            [chrono::Utc::now().timestamp()],
        )?;

        Ok(())
    }

    /// Creates performance indexes for v2 schema (canvas)
    fn create_indexes_v2(tx: &Transaction) -> Result<()> {
        tx.execute(
            "CREATE INDEX idx_canvas_elements_canvas_id ON canvas_elements(canvas_id)",
            [],
        )?;
        tx.execute(
            "CREATE INDEX idx_canvas_elements_layer_id ON canvas_elements(layer_id)",
            [],
        )?;
        tx.execute(
            "CREATE INDEX idx_canvas_layers_canvas_id ON canvas_layers(canvas_id)",
            [],
        )?;

        // Run ANALYZE for query optimizer
        tx.execute("ANALYZE", [])?;

        Ok(())
    }

    /// Migration v3: Add pages and components JSON columns to canvas_documents
    fn migrate_v3(tx: &Transaction) -> Result<()> {
        tx.execute(
            "ALTER TABLE canvas_documents ADD COLUMN pages_json TEXT",
            [],
        )?;
        tx.execute(
            "ALTER TABLE canvas_documents ADD COLUMN active_page_id TEXT",
            [],
        )?;
        tx.execute(
            "ALTER TABLE canvas_documents ADD COLUMN components_json TEXT",
            [],
        )?;

        // Record migration
        tx.execute(
            "INSERT INTO schema_version (version, applied_at) VALUES (3, ?)",
            [chrono::Utc::now().timestamp()],
        )?;

        Ok(())
    }

    /// Gets a reference to the database connection
    pub fn conn(&self) -> Arc<Mutex<Connection>> {
        Arc::clone(&self.conn)
    }

    /// Gets all notes from the database
    pub fn get_all_notes(&self) -> Result<Vec<crate::models::note::Note>> {
        use crate::models::note::Note;
        use chrono::{DateTime, Utc};
        use std::path::PathBuf;

        let conn = self.conn.lock().unwrap();
        let mut stmt = conn
            .prepare("SELECT path, title, frontmatter_json, created_at, modified_at FROM notes")?;

        let notes = stmt
            .query_map([], |row| {
                let path: String = row.get(0)?;
                let title: String = row.get(1)?;
                let frontmatter_json: Option<String> = row.get(2)?;
                let created_at: i64 = row.get(3)?;
                let modified_at: i64 = row.get(4)?;

                let frontmatter = frontmatter_json
                    .and_then(|json| serde_json::from_str(&json).ok())
                    .unwrap_or_default();

                Ok(Note {
                    path: PathBuf::from(path),
                    title,
                    content: String::new(),
                    frontmatter,
                    created_at: DateTime::from_timestamp(created_at, 0)
                        .unwrap_or_else(|| Utc::now()),
                    modified_at: DateTime::from_timestamp(modified_at, 0)
                        .unwrap_or_else(|| Utc::now()),
                })
            })?
            .collect::<std::result::Result<Vec<_>, _>>()?;

        Ok(notes)
    }

    /// Gets all links from the database
    pub fn get_all_links(&self) -> Result<Vec<crate::models::link::Link>> {
        use crate::models::link::Link;
        use std::path::PathBuf;

        let conn = self.conn.lock().unwrap();
        let mut stmt =
            conn.prepare("SELECT source_path, target_title, target_path, is_resolved FROM links")?;

        let links = stmt
            .query_map([], |row| {
                let source_path: String = row.get(0)?;
                let target_title: String = row.get(1)?;
                let target_path: Option<String> = row.get(2)?;
                let is_resolved: i32 = row.get(3)?;

                Ok(Link {
                    source_path: PathBuf::from(source_path),
                    target_title,
                    target_path: target_path.map(PathBuf::from),
                    alias: None,
                    is_resolved: is_resolved != 0,
                })
            })?
            .collect::<std::result::Result<Vec<_>, _>>()?;

        Ok(links)
    }

    /// Gets backlinks for a specific note path
    pub fn get_backlinks(&self, target_path: &str) -> Result<Vec<crate::models::link::Link>> {
        use crate::models::link::Link;
        use std::path::PathBuf;

        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT source_path, target_title, target_path, is_resolved 
             FROM links WHERE target_path = ?",
        )?;

        let links = stmt
            .query_map([target_path], |row| {
                let source_path: String = row.get(0)?;
                let target_title: String = row.get(1)?;
                let target_path: Option<String> = row.get(2)?;
                let is_resolved: i32 = row.get(3)?;

                Ok(Link {
                    source_path: PathBuf::from(source_path),
                    target_title,
                    target_path: target_path.map(PathBuf::from),
                    alias: None,
                    is_resolved: is_resolved != 0,
                })
            })?
            .collect::<std::result::Result<Vec<_>, _>>()?;

        Ok(links)
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

        // Check that all tables exist
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

        // Check that indexes exist
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

        // Create database twice
        let _db1 = Database::new(&db_path).unwrap();
        let db2 = Database::new(&db_path).unwrap();

        // Check version is still 2 (both migrations applied)
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
