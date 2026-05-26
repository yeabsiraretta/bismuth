use crate::db::Database;
use crate::models::link::Link;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::State;

pub struct GraphState {
    pub db: Arc<Database>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphNode {
    pub id: String,
    pub label: String,
    pub node_type: String,
    pub tags: Vec<String>,
    pub portent_type: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphEdge {
    pub from: String,
    pub to: String,
    pub edge_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphData {
    pub nodes: Vec<GraphNode>,
    pub edges: Vec<GraphEdge>,
}

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

#[tauri::command]
pub async fn get_graph_backlinks(
    state: State<'_, GraphState>,
    path: String,
) -> Result<Vec<Link>, String> {
    let db = &state.db;

    db.get_backlinks(&path)
        .map_err(|e| format!("Failed to get backlinks: {}", e))
}
