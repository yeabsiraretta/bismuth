//! HTTP search server (T068, FR-032)
//!
//! Exposes a local-only REST endpoint for external tools:
//! - `GET /search?q=<query>&limit=<N>` — returns JSON search results
//! - Binds exclusively to 127.0.0.1 (no remote access)
//! - Configurable port (default 27182)

use crate::services::index_service::{IndexService, SearchResult};
use serde::Serialize;
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::sync::Mutex;

/// Search server configuration
#[derive(Debug, Clone)]
pub struct SearchServerConfig {
    pub port: u16,
}

impl Default for SearchServerConfig {
    fn default() -> Self {
        Self { port: 27182 }
    }
}

/// Search server handle — drop to shut down
pub struct SearchServer {
    shutdown_tx: Option<tokio::sync::oneshot::Sender<()>>,
    pub port: u16,
}

impl SearchServer {
    /// Start the HTTP search server on 127.0.0.1
    pub async fn start(
        index_service: Arc<Mutex<Option<IndexService>>>,
        config: SearchServerConfig,
    ) -> Result<Self, String> {
        use tokio::net::TcpListener;

        let addr: SocketAddr = format!("127.0.0.1:{}", config.port)
            .parse()
            .map_err(|e| format!("Invalid address: {}", e))?;

        let listener = TcpListener::bind(addr)
            .await
            .map_err(|e| format!("Failed to bind to {}: {}", addr, e))?;

        let (shutdown_tx, mut shutdown_rx) = tokio::sync::oneshot::channel::<()>();

        let port = config.port;

        tokio::spawn(async move {
            loop {
                tokio::select! {
                    accept_result = listener.accept() => {
                        match accept_result {
                            Ok((stream, peer)) => {
                                // Only accept connections from localhost
                                if !peer.ip().is_loopback() {
                                    continue;
                                }
                                let svc = index_service.clone();
                                tokio::spawn(async move {
                                    if let Err(e) = handle_connection(stream, svc).await {
                                        eprintln!("Search server connection error: {}", e);
                                    }
                                });
                            }
                            Err(e) => {
                                eprintln!("Search server accept error: {}", e);
                            }
                        }
                    }
                    _ = &mut shutdown_rx => {
                        break;
                    }
                }
            }
        });

        Ok(Self {
            shutdown_tx: Some(shutdown_tx),
            port,
        })
    }

    /// Stop the search server
    pub fn stop(&mut self) {
        if let Some(tx) = self.shutdown_tx.take() {
            let _ = tx.send(());
        }
    }
}

impl Drop for SearchServer {
    fn drop(&mut self) {
        self.stop();
    }
}

#[derive(Serialize)]
struct ApiResponse {
    results: Vec<SearchResult>,
    count: usize,
    query: String,
}

#[derive(Serialize)]
struct ApiError {
    error: String,
}

/// Handle a single HTTP connection
async fn handle_connection(
    stream: tokio::net::TcpStream,
    index_service: Arc<Mutex<Option<IndexService>>>,
) -> Result<(), String> {
    use tokio::io::{AsyncBufReadExt, BufReader};

    let mut reader = BufReader::new(stream);
    let mut request_line = String::new();
    reader
        .read_line(&mut request_line)
        .await
        .map_err(|e| e.to_string())?;

    // Parse: GET /search?q=...&limit=... HTTP/1.1
    let parts: Vec<&str> = request_line.trim().split_whitespace().collect();
    if parts.len() < 2 {
        return send_response(
            &mut reader,
            400,
            &serde_json::to_string(&ApiError {
                error: "Invalid request".to_string(),
            })
            .unwrap(),
        )
        .await;
    }

    let method = parts[0];
    let path = parts[1];

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

    // Read remaining headers (discard)
    loop {
        let mut line = String::new();
        reader
            .read_line(&mut line)
            .await
            .map_err(|e| e.to_string())?;
        if line.trim().is_empty() {
            break;
        }
    }

    // Route: /search?q=...&limit=...
    if let Some(query_string) = path.strip_prefix("/search") {
        let (query, limit) = parse_search_params(query_string);

        if query.is_empty() {
            return send_response(
                &mut reader,
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
                    let response = ApiResponse {
                        count: results.len(),
                        query: query.clone(),
                        results,
                    };
                    let json = serde_json::to_string(&response).unwrap();
                    send_response(&mut reader, 200, &json).await
                },
                Err(e) => {
                    send_response(
                        &mut reader,
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
                    &mut reader,
                    503,
                    &serde_json::to_string(&ApiError {
                        error: "Index service not initialized".to_string(),
                    })
                    .unwrap(),
                )
                .await
            },
        }
    } else {
        send_response(
            &mut reader,
            404,
            &serde_json::to_string(&ApiError {
                error: "Not found. Use GET /search?q=<query>".to_string(),
            })
            .unwrap(),
        )
        .await
    }
}

/// Parse query parameters from path like ?q=hello+world&limit=10
fn parse_search_params(query_string: &str) -> (String, usize) {
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

/// Minimal URL decoding (+ → space, %XX → char)
fn urldecode(s: &str) -> String {
    let mut result = String::with_capacity(s.len());
    let mut chars = s.chars();
    while let Some(c) = chars.next() {
        match c {
            '+' => result.push(' '),
            '%' => {
                let hex: String = chars.by_ref().take(2).collect();
                if let Ok(byte) = u8::from_str_radix(&hex, 16) {
                    result.push(byte as char);
                } else {
                    result.push('%');
                    result.push_str(&hex);
                }
            },
            _ => result.push(c),
        }
    }
    result
}

/// Send an HTTP response
async fn send_response<R: tokio::io::AsyncRead + tokio::io::AsyncWrite + Unpin>(
    reader: &mut tokio::io::BufReader<R>,
    status: u16,
    body: &str,
) -> Result<(), String> {
    use tokio::io::AsyncWriteExt;

    let status_text = match status {
        200 => "OK",
        400 => "Bad Request",
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
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_search_params_basic() {
        let (query, limit) = parse_search_params("?q=hello+world&limit=10");
        assert_eq!(query, "hello world");
        assert_eq!(limit, 10);
    }

    #[test]
    fn test_parse_search_params_encoded() {
        let (query, _) = parse_search_params("?q=rust%20programming");
        assert_eq!(query, "rust programming");
    }

    #[test]
    fn test_parse_search_params_default_limit() {
        let (query, limit) = parse_search_params("?q=notes");
        assert_eq!(query, "notes");
        assert_eq!(limit, 20);
    }

    #[test]
    fn test_urldecode() {
        assert_eq!(urldecode("hello+world"), "hello world");
        assert_eq!(urldecode("a%20b%21c"), "a b!c");
        assert_eq!(urldecode("normal"), "normal");
    }
}
