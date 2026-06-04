//! Full-text search IPC commands (FR-028)
//!
//! Delegates to [`IndexService`] for Tantivy-backed BM25 search,
//! and provides regex-based in-file search for editor find.

use crate::services::index_service::{IndexService, SearchQuery, SearchResult};
use std::sync::Mutex;
use tauri::State;

/// Managed state holding the Tantivy [`IndexService`].
///
/// Initialized lazily when a vault is opened.
pub struct SearchState {
    pub index_service: Mutex<Option<IndexService>>,
}

/// Executes a full-text vault search using the Tantivy index.
///
/// # Arguments
///
/// * `query` — Natural-language or BM25 query string.
/// * `limit` — Maximum results to return (default: 20).
#[tauri::command]
pub async fn search_vault(
    state: State<'_, SearchState>,
    query: String,
    limit: Option<usize>,
) -> Result<Vec<SearchResult>, String> {
    let index_service = state.index_service.lock().unwrap();

    if let Some(service) = index_service.as_ref() {
        let search_query = SearchQuery {
            query,
            limit: limit.unwrap_or(20),
        };

        service
            .search(search_query)
            .map_err(|e| format!("Search failed: {}", e))
    } else {
        Err("Index service not initialized".to_string())
    }
}

/// Advanced search supporting field-scoped queries (e.g., `title:foo tags:bar`).
///
/// # Arguments
///
/// * `query` — Field-aware query string.
/// * `limit` — Maximum results to return (default: 20).
#[tauri::command]
pub async fn advanced_search(
    state: State<'_, SearchState>,
    query: String,
    limit: Option<usize>,
) -> Result<Vec<SearchResult>, String> {
    let index_service = state.index_service.lock().unwrap();

    if let Some(service) = index_service.as_ref() {
        service
            .advanced_search(&query, limit.unwrap_or(20))
            .map_err(|e| format!("Advanced search failed: {}", e))
    } else {
        Err("Index service not initialized".to_string())
    }
}

/// Performs a literal-text search within a single file.
///
/// Returns line/column matches for editor highlighting.
///
/// # Arguments
///
/// * `path` — Absolute path to the target file.
/// * `query` — Text to find (escaped as regex-safe literal).
#[tauri::command]
pub async fn search_in_file(
    path: String,
    query: String,
) -> Result<Vec<Match>, String> {
    use regex::Regex;
    use std::fs;

    let content = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read file: {}", e))?;

    let re = Regex::new(&regex::escape(&query))
        .map_err(|e| format!("Invalid regex: {}", e))?;

    let mut matches = Vec::new();
    for (line_num, line) in content.lines().enumerate() {
        if let Some(mat) = re.find(line) {
            matches.push(Match {
                line: line_num + 1,
                column: mat.start(),
                text: line.to_string(),
            });
        }
    }

    Ok(matches)
}

/// A single match found within a file.
#[derive(serde::Serialize, serde::Deserialize)]
pub struct Match {
    /// 1-indexed line number.
    pub line: usize,
    /// 0-indexed column offset of match start.
    pub column: usize,
    /// Full text of the matching line.
    pub text: String,
}
