//! Route dispatch for the Bismuth local HTTP server.
//!
//! Reads incoming requests and dispatches to handler functions. Keeps
//! request parsing, origin validation, and route matching separate from
//! the server lifecycle (`search_server.rs`) and handler logic
//! (`search_handlers.rs`, `agent_handlers.rs`).

use crate::services::index_service::IndexService;
use crate::services::search::agent_handlers::{
    check_bearer, handle_agent_search, handle_delete_note, handle_read_note, handle_vault_list,
    handle_write_note,
};
use super::search_handlers::{ApiError, handle_health, handle_interactions, handle_search, send_response};
use std::sync::Arc;
use tokio::io::AsyncBufReadExt;
use tokio::sync::Mutex;

/// Parsed HTTP request headers and metadata.
pub(super) struct RequestMeta {
    pub method: String,
    pub path: String,
    pub auth_header: Option<String>,
    pub content_length: usize,
}

/// Read the request line and all headers from the buffered reader.
pub(super) async fn read_request_meta<R>(
    reader: &mut tokio::io::BufReader<R>,
) -> Result<RequestMeta, String>
where
    R: tokio::io::AsyncRead + tokio::io::AsyncWrite + Unpin,
{
    let mut request_line = String::new();
    reader
        .read_line(&mut request_line)
        .await
        .map_err(|e| e.to_string())?;

    let parts: Vec<&str> = request_line.trim().split_whitespace().collect();
    if parts.len() < 2 {
        return Err("Invalid request line".to_string());
    }
    let method = parts[0].to_string();
    let path = parts[1].to_string();

    let mut auth_header: Option<String> = None;
    let mut origin_header: Option<String> = None;
    let mut content_length: usize = 0;

    loop {
        let mut line = String::new();
        reader
            .read_line(&mut line)
            .await
            .map_err(|e| e.to_string())?;
        if line.trim().is_empty() {
            break;
        }
        let lower = line.to_lowercase();
        if lower.starts_with("authorization: ") {
            auth_header = Some(line["authorization: ".len()..].trim().to_string());
        } else if lower.starts_with("origin: ") {
            origin_header = Some(line["origin: ".len()..].trim().to_string());
        } else if lower.starts_with("content-length: ") {
            content_length = line["content-length: ".len()..]
                .trim()
                .parse()
                .unwrap_or(0);
        }
    }

    // Reject non-local origins (DNS rebinding protection, TASK-SEC-005)
    if let Some(ref origin) = origin_header {
        let allowed = origin == "null"
            || origin.starts_with("http://localhost")
            || origin.starts_with("http://127.0.0.1")
            || origin.starts_with("tauri://localhost");
        if !allowed {
            return Err(format!("Forbidden origin: {}", origin));
        }
    }

    Ok(RequestMeta {
        method,
        path,
        auth_header,
        content_length,
    })
}

/// Read `n` bytes from the reader into a Vec<u8>.
pub(super) async fn read_body<R>(reader: &mut tokio::io::BufReader<R>, n: usize) -> Vec<u8>
where
    R: tokio::io::AsyncRead + tokio::io::AsyncWrite + Unpin,
{
    use tokio::io::AsyncReadExt;
    let mut buf = vec![0u8; n];
    let _ = reader.read_exact(&mut buf).await;
    buf
}

/// Handle a single HTTP connection, dispatching to the appropriate route handler.
pub(super) async fn handle_connection(
    stream: tokio::net::TcpStream,
    index_service: Arc<Mutex<Option<IndexService>>>,
    interaction_log: Arc<Mutex<crate::logger::InteractionLog>>,
    vault_root: Arc<String>,
    bearer_token: Arc<String>,
) -> Result<(), String> {
    let mut reader = tokio::io::BufReader::new(stream);

    let meta = match read_request_meta(&mut reader).await {
        Ok(m) => m,
        Err(e) => {
            let status = if e.contains("Forbidden origin") { 403 } else { 400 };
            return send_response(
                &mut reader,
                status,
                &serde_json::to_string(&ApiError { error: e }).unwrap(),
            )
            .await;
        }
    };

    let method = meta.method.as_str();
    let path = meta.path.as_str();

    // --- Public routes (no auth) ---
    if method == "GET" && (path == "/health" || path == "/health/") {
        return handle_health(&mut reader, &index_service).await;
    }

    if method == "GET" {
        if let Some(qs) = path.strip_prefix("/interactions") {
            return handle_interactions(&mut reader, qs, &interaction_log).await;
        }
        if let Some(qs) = path.strip_prefix("/search") {
            return handle_search(&mut reader, qs, &index_service).await;
        }
    }

    // --- Agent routes (require Bearer token) ---
    if path.starts_with("/notes") || path.starts_with("/vault") {
        if !check_bearer(meta.auth_header.as_deref(), &bearer_token) {
            tracing::warn!("Agent route rejected: invalid or missing Bearer token");
            return send_response(
                &mut reader,
                401,
                &serde_json::to_string(&ApiError {
                    error: "Unauthorized: valid Bearer token required".to_string(),
                })
                .unwrap(),
            )
            .await;
        }

        let body_bytes = if meta.content_length > 0 {
            read_body(&mut reader, meta.content_length.min(1_048_576)).await
        } else {
            vec![]
        };

        if method == "GET" {
            if let Some(qs) = path.strip_prefix("/notes/search") {
                return handle_agent_search(&mut reader, qs, &index_service).await;
            }
            if path == "/vault/list" || path == "/vault/list/" {
                return handle_vault_list(&mut reader, &vault_root).await;
            }
            if let Some(rel) = path.strip_prefix("/notes/") {
                return handle_read_note(&mut reader, rel, &vault_root).await;
            }
        }

        if method == "PUT" {
            if let Some(rel) = path.strip_prefix("/notes/") {
                return handle_write_note(&mut reader, "PUT", rel, &body_bytes, &vault_root).await;
            }
        }

        if method == "POST" {
            if let Some(rel) = path.strip_prefix("/notes/") {
                return handle_write_note(&mut reader, "POST", rel, &body_bytes, &vault_root).await;
            }
        }

        if method == "DELETE" {
            if let Some(rel) = path.strip_prefix("/notes/") {
                return handle_delete_note(&mut reader, rel, &body_bytes, &vault_root).await;
            }
        }
    }

    if method != "GET" {
        return send_response(
            &mut reader,
            405,
            &serde_json::to_string(&ApiError {
                error: "Method not allowed. Use GET.".to_string(),
            })
            .unwrap(),
        )
        .await;
    }

    send_response(
        &mut reader,
        404,
        &serde_json::to_string(&ApiError {
            error: "Unknown route. Available: GET /health, GET /search?q=<query>, GET /interactions, GET /notes/search, GET /notes/<path>, GET /vault/list, PUT/POST/DELETE /notes/<path>".to_string(),
        })
        .unwrap(),
    )
    .await
}
