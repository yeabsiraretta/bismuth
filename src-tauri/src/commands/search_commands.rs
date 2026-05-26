use crate::services::index_service::{IndexService, SearchQuery, SearchResult};
use std::sync::Mutex;
use tauri::State;

pub struct SearchState {
    pub index_service: Mutex<Option<IndexService>>,
}

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

#[derive(serde::Serialize, serde::Deserialize)]
pub struct Match {
    pub line: usize,
    pub column: usize,
    pub text: String,
}
