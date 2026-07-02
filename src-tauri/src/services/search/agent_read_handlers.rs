//! Agent read-only REST endpoint handlers.
//!
//! - `GET /notes/search?q=<query>` — full-text search via Tantivy
//! - `GET /notes/<path>` — read note content + frontmatter
//! - `GET /vault/list` — list all note paths in the vault

use crate::services::search::agent_utils::{
    collect_md_paths, extract_frontmatter, path_within_vault,
};
use crate::services::search::index_service::IndexService;
use crate::services::search::search_handlers::{parse_search_params, send_response, urldecode, ApiError};
use serde::Serialize;
use std::path::Path;
use std::sync::Arc;
use tokio::sync::Mutex;

#[derive(Serialize)]
struct NoteResponse {
    path: String,
    content: String,
    frontmatter: serde_json::Value,
}

#[derive(Serialize)]
struct VaultListResponse {
    paths: Vec<String>,
    count: usize,
}

/// GET /notes/search?q=<query>&limit=<N>
pub(crate) async fn handle_agent_search<R>(
    reader: &mut tokio::io::BufReader<R>,
    query_string: &str,
    index_service: &Arc<Mutex<Option<IndexService>>>,
) -> Result<(), String>
where
    R: tokio::io::AsyncRead + tokio::io::AsyncWrite + Unpin,
{
    let (query, limit) = parse_search_params(query_string);
    if query.is_empty() {
        return send_response(
            reader,
            400,
            &serde_json::to_string(&ApiError {
                error: "Missing 'q' parameter".to_string(),
            })
            .unwrap(),
        )
        .await;
    }

    let guard = index_service.lock().await;
    match guard.as_ref() {
        None => {
            send_response(
                reader,
                503,
                &serde_json::to_string(&ApiError {
                    error: "Index service not initialized".to_string(),
                })
                .unwrap(),
            )
            .await
        }
        Some(svc) => match svc.advanced_search(&query, limit) {
            Ok(results) => {
                let body = serde_json::to_string(&results).unwrap();
                send_response(reader, 200, &body).await
            }
            Err(e) => {
                send_response(
                    reader,
                    500,
                    &serde_json::to_string(&ApiError {
                        error: format!("Search failed: {}", e),
                    })
                    .unwrap(),
                )
                .await
            }
        },
    }
}

/// GET /notes/<path>
pub(crate) async fn handle_read_note<R>(
    reader: &mut tokio::io::BufReader<R>,
    rel_path: &str,
    vault_root: &str,
) -> Result<(), String>
where
    R: tokio::io::AsyncRead + tokio::io::AsyncWrite + Unpin,
{
    let decoded = urldecode(rel_path);
    match path_within_vault(vault_root, &decoded) {
        None => {
            send_response(
                reader,
                403,
                &serde_json::to_string(&ApiError {
                    error: "Path escapes vault boundary".to_string(),
                })
                .unwrap(),
            )
            .await
        }
        Some(full_path) => match std::fs::read_to_string(&full_path) {
            Ok(content) => {
                let frontmatter = extract_frontmatter(&content);
                let body = serde_json::to_string(&NoteResponse {
                    path: decoded,
                    content,
                    frontmatter,
                })
                .unwrap();
                send_response(reader, 200, &body).await
            }
            Err(_) => {
                send_response(
                    reader,
                    404,
                    &serde_json::to_string(&ApiError {
                        error: "Note not found".to_string(),
                    })
                    .unwrap(),
                )
                .await
            }
        },
    }
}

/// GET /vault/list
pub(crate) async fn handle_vault_list<R>(
    reader: &mut tokio::io::BufReader<R>,
    vault_root: &str,
) -> Result<(), String>
where
    R: tokio::io::AsyncRead + tokio::io::AsyncWrite + Unpin,
{
    let mut paths: Vec<String> = Vec::new();
    collect_md_paths(Path::new(vault_root), Path::new(vault_root), &mut paths);
    let count = paths.len();
    let body = serde_json::to_string(&VaultListResponse { paths, count }).unwrap();
    send_response(reader, 200, &body).await
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_collect_md_paths_empty() {
        let tmp = tempfile::TempDir::new().unwrap();
        let mut paths = Vec::new();
        collect_md_paths(tmp.path(), tmp.path(), &mut paths);
        assert!(paths.is_empty());
    }

    #[test]
    fn test_collect_md_paths_finds_md() {
        let tmp = tempfile::TempDir::new().unwrap();
        std::fs::write(tmp.path().join("note.md"), "content").unwrap();
        std::fs::write(tmp.path().join("image.png"), "data").unwrap();
        let mut paths = Vec::new();
        collect_md_paths(tmp.path(), tmp.path(), &mut paths);
        assert_eq!(paths.len(), 1);
        assert_eq!(paths[0], "note.md");
    }

    #[test]
    fn test_collect_md_paths_skips_dotdirs() {
        let tmp = tempfile::TempDir::new().unwrap();
        std::fs::create_dir(tmp.path().join(".bismuth")).unwrap();
        std::fs::write(tmp.path().join(".bismuth").join("secret.md"), "x").unwrap();
        std::fs::write(tmp.path().join("visible.md"), "y").unwrap();
        let mut paths = Vec::new();
        collect_md_paths(tmp.path(), tmp.path(), &mut paths);
        assert_eq!(paths.len(), 1);
        assert_eq!(paths[0], "visible.md");
    }
}
