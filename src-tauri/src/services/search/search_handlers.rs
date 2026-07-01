//! HTTP handler implementations for the Bismuth local search server.
//!
//! Each handler corresponds to a single route: health, search, interactions.
//! URL decoding and parameter parsing utilities are also here.

use crate::services::index_service::{IndexService, SearchResult};
use serde::Serialize;
use std::sync::Arc;
use tokio::sync::Mutex;

#[derive(Serialize)]
pub(super) struct ApiResponse {
    pub results: Vec<SearchResult>,
    pub count: usize,
    pub query: String,
}

#[derive(Serialize)]
pub(super) struct ApiError {
    pub error: String,
}

#[derive(Serialize)]
pub(super) struct HealthResponse {
    pub status: &'static str,
    pub version: &'static str,
    pub search_ready: bool,
}

pub(super) async fn handle_health<R>(
    reader: &mut tokio::io::BufReader<R>,
    index_service: &Arc<Mutex<Option<IndexService>>>,
) -> Result<(), String>
where
    R: tokio::io::AsyncRead + tokio::io::AsyncWrite + Unpin,
{
    let search_ready = index_service.lock().await.is_some();
    let body = serde_json::to_string(&HealthResponse {
        status: "ok",
        version: env!("CARGO_PKG_VERSION"),
        search_ready,
    })
    .unwrap();
    send_response(reader, 200, &body).await
}

pub(super) async fn handle_search<R>(
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
        Some(service) => match service.advanced_search(&query, limit) {
            Ok(results) => {
                let body = serde_json::to_string(&ApiResponse {
                    count: results.len(),
                    query,
                    results,
                })
                .unwrap();
                send_response(reader, 200, &body).await
            },
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
            },
        },
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
        },
    }
}

pub(super) async fn handle_interactions<R>(
    reader: &mut tokio::io::BufReader<R>,
    query_string: &str,
    interaction_log: &Arc<Mutex<crate::logger::InteractionLog>>,
) -> Result<(), String>
where
    R: tokio::io::AsyncRead + tokio::io::AsyncWrite + Unpin,
{
    let qs = query_string.strip_prefix('?').unwrap_or("");
    let mut limit: usize = 50;
    let mut level_filter: Option<String> = None;

    for param in qs.split('&').filter(|s| !s.is_empty()) {
        if let Some(val) = param.strip_prefix("limit=") {
            limit = val.parse().unwrap_or(50);
        } else if let Some(val) = param.strip_prefix("level=") {
            level_filter = Some(val.to_uppercase());
        }
    }

    let log = interaction_log.lock().await;
    let entries = log.recent(limit, level_filter.as_deref());
    let body = serde_json::to_string(&entries).unwrap();
    send_response(reader, 200, &body).await
}

pub(super) fn parse_search_params(query_string: &str) -> (String, usize) {
    let qs = query_string.strip_prefix('?').unwrap_or(query_string);
    let mut query = String::new();
    let mut limit: usize = 20;

    for param in qs.split('&') {
        if let Some(val) = param.strip_prefix("q=") {
            query = urldecode(val);
        } else if let Some(val) = param.strip_prefix("limit=") {
            limit = val.parse().unwrap_or(20);
        }
    }

    (query, limit)
}

pub(super) fn urldecode(s: &str) -> String {
    let mut bytes: Vec<u8> = Vec::with_capacity(s.len());
    let mut iter = s.bytes().peekable();
    while let Some(b) = iter.next() {
        match b {
            b'+' => bytes.push(b' '),
            b'%' => {
                let hi = iter.next().unwrap_or(b'0');
                let lo = iter.next().unwrap_or(b'0');
                let hex = [hi, lo];
                if let Ok(byte) = u8::from_str_radix(std::str::from_utf8(&hex).unwrap_or("00"), 16)
                {
                    bytes.push(byte);
                } else {
                    bytes.push(b'%');
                    bytes.push(hi);
                    bytes.push(lo);
                }
            },
            _ => bytes.push(b),
        }
    }
    String::from_utf8(bytes).unwrap_or_else(|_| s.to_string())
}

pub(super) async fn send_response<R: tokio::io::AsyncRead + tokio::io::AsyncWrite + Unpin>(
    reader: &mut tokio::io::BufReader<R>,
    status: u16,
    body: &str,
) -> Result<(), String> {
    use tokio::io::AsyncWriteExt;

    let status_text = match status {
        200 => "OK",
        202 => "Accepted",
        400 => "Bad Request",
        401 => "Unauthorized",
        403 => "Forbidden",
        404 => "Not Found",
        405 => "Method Not Allowed",
        500 => "Internal Server Error",
        503 => "Service Unavailable",
        _ => "Unknown",
    };

    let response = format!(
        "HTTP/1.1 {} {}\r\nContent-Type: application/json\r\nContent-Length: {}\r\nAccess-Control-Allow-Origin: *\r\nConnection: close\r\n\r\n{}",
        status, status_text, body.len(), body
    );

    reader
        .get_mut()
        .write_all(response.as_bytes())
        .await
        .map_err(|e| e.to_string())
}
