//! Graph visualization IPC commands (FR-006, FR-007)
//!
//! Builds node/edge data for the Konva.js graph view from vault notes and links.

use crate::db::Database;
use crate::models::link::Link;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::State;

/// Managed state providing access to the database for graph queries.
pub struct GraphState {
    pub db: Arc<Database>,
}

/// A node in the knowledge graph (represents a single note).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphNode {
    /// Unique identifier (note path).
    pub id: String,
    /// Display label (note title).
    pub label: String,
    /// Node classification (currently always `"note"`).
    pub node_type: String,
    /// Tags extracted from the note's frontmatter.
    pub tags: Vec<String>,
    /// Portent entity type, if defined in frontmatter `type` field.
    pub portent_type: Option<String>,
}

/// A directed edge in the knowledge graph (represents a wikilink).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphEdge {
    /// Source node id (path of the note containing the link).
    pub from: String,
    /// Target node id (path of the linked note).
    pub to: String,
    /// Edge classification (e.g., `"wikilink"`).
    pub edge_type: String,
}

/// Complete graph payload sent to the frontend for rendering.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphData {
    /// All note nodes in the vault.
    pub nodes: Vec<GraphNode>,
    /// All resolved wikilink edges between notes.
    pub edges: Vec<GraphEdge>,
}

/// Builds the full knowledge graph from all notes and resolved links.
///
/// Reads notes and links from the database, constructs [`GraphData`]
/// with nodes colored by Portent type and edges representing wikilinks.
#[tauri::command]
pub async fn get_graph_data(state: State<'_, GraphState>) -> Result<GraphData, String> {
    let db = &state.db;

    let notes = db
        .get_all_notes()
        .map_err(|e| format!("Failed to get notes: {}", e))?;

    let links = db
        .get_all_links()
        .map_err(|e| format!("Failed to get links: {}", e))?;

    let mut nodes = Vec::new();
    let mut edges = Vec::new();

    for note in notes {
        // Extract tags from frontmatter
        let tags = note
            .frontmatter
            .get("tags")
            .and_then(|v| v.as_array())
            .map(|arr| {
                arr.iter()
                    .filter_map(|v| v.as_str().map(String::from))
                    .collect()
            })
            .unwrap_or_default();

        // Extract portent_type from frontmatter
        let portent_type = note
            .frontmatter
            .get("type")
            .and_then(|v| v.as_str())
            .map(String::from);

        nodes.push(GraphNode {
            id: note.path.to_string_lossy().to_string(),
            label: note.title.clone(),
            node_type: "note".to_string(),
            tags,
            portent_type,
        });
    }

    for link in links {
        if let Some(target_path) = &link.target_path {
            edges.push(GraphEdge {
                from: link.source_path.to_string_lossy().to_string(),
                to: target_path.to_string_lossy().to_string(),
                edge_type: "wikilink".to_string(),
            });
        }
    }

    Ok(GraphData { nodes, edges })
}

/// Returns all inbound links (backlinks) targeting the specified note.
///
/// # Arguments
///
/// * `path` — Absolute path of the target note.
#[tauri::command]
pub async fn get_graph_backlinks(
    state: State<'_, GraphState>,
    path: String,
) -> Result<Vec<Link>, String> {
    let db = &state.db;

    db.get_backlinks(&path)
        .map_err(|e| format!("Failed to get backlinks: {}", e))
}
