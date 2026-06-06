//! Database schema migrations.

use crate::error::Result;
use rusqlite::Transaction;

/// Migration v1: Initial schema (notes, links, tags, graph)
pub fn migrate_v1(tx: &Transaction) -> Result<()> {
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

    tx.execute(
        "CREATE TABLE tags (
            name TEXT PRIMARY KEY,
            count INTEGER NOT NULL DEFAULT 0
        )",
        [],
    )?;

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

    create_indexes_v1(tx)?;

    tx.execute(
        "INSERT INTO schema_version (version, applied_at) VALUES (1, ?)",
        [chrono::Utc::now().timestamp()],
    )?;

    Ok(())
}

/// Creates performance indexes for v1 schema
fn create_indexes_v1(tx: &Transaction) -> Result<()> {
    tx.execute("CREATE INDEX idx_notes_modified ON notes(modified_at)", [])?;
    tx.execute("CREATE INDEX idx_links_source ON links(source_path)", [])?;
    tx.execute("CREATE INDEX idx_links_target ON links(target_title)", [])?;
    tx.execute("CREATE INDEX idx_links_resolved ON links(is_resolved)", [])?;
    tx.execute("CREATE INDEX idx_jdex_area ON jdex_entries(area)", [])?;
    tx.execute(
        "CREATE INDEX idx_jdex_category ON jdex_entries(category)",
        [],
    )?;
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
    tx.execute("ANALYZE", [])?;
    Ok(())
}

/// Migration v2: Canvas tables
pub fn migrate_v2(tx: &Transaction) -> Result<()> {
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

    create_indexes_v2(tx)?;

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
    tx.execute("ANALYZE", [])?;
    Ok(())
}

/// Migration v3: Add pages and components JSON columns to canvas_documents
pub fn migrate_v3(tx: &Transaction) -> Result<()> {
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

    tx.execute(
        "INSERT INTO schema_version (version, applied_at) VALUES (3, ?)",
        [chrono::Utc::now().timestamp()],
    )?;

    Ok(())
}
