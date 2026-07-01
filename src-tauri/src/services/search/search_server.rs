//! Local HTTP server (T068, FR-032)
//!
//! Exposes localhost-only REST endpoints:
//! - `GET /health` — liveness probe + search-ready flag
//! - `GET /search?q=<query>&limit=<N>` — BM25 full-text search
//! - `GET /interactions?limit=<N>&level=<LEVEL>` — recent interaction events
//! - Agent routes (Bearer token required): `/notes/*`, `/vault/list`
//!
//! Binds exclusively to 127.0.0.1. Default port: 27182.

use crate::logger::InteractionLog;
use crate::services::index_service::IndexService;
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::sync::Mutex;

use super::search_http::handle_connection;

#[derive(Debug, Clone)]
pub struct SearchServerConfig {
    pub port: u16,
}

impl Default for SearchServerConfig {
    fn default() -> Self {
        Self { port: 27182 }
    }
}

/// Search server handle — drop to shut down.
pub struct SearchServer {
    shutdown_tx: Option<tokio::sync::oneshot::Sender<()>>,
    pub port: u16,
}

impl SearchServer {
    /// Start the HTTP server on 127.0.0.1.
    ///
    /// `vault_root` and `bearer_token` are forwarded to agent route handlers.
    /// An empty `bearer_token` disables agent endpoints (all requests return 401).
    pub async fn start(
        index_service: Arc<Mutex<Option<IndexService>>>,
        interaction_log: Arc<Mutex<InteractionLog>>,
        config: SearchServerConfig,
        vault_root: String,
        bearer_token: String,
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

        let vault_root = Arc::new(vault_root);
        let bearer_token = Arc::new(bearer_token);

        tokio::spawn(async move {
            loop {
                tokio::select! {
                    accept_result = listener.accept() => {
                        match accept_result {
                            Ok((stream, peer)) => {
                                if !peer.ip().is_loopback() {
                                    continue;
                                }
                                let svc = index_service.clone();
                                let log = interaction_log.clone();
                                let vr = vault_root.clone();
                                let bt = bearer_token.clone();
                                tokio::spawn(async move {
                                    if let Err(e) = handle_connection(stream, svc, log, vr, bt).await {
                                        tracing::error!("Server connection error: {}", e);
                                    }
                                });
                            }
                            Err(e) => tracing::error!("Server accept error: {}", e),
                        }
                    }
                    _ = &mut shutdown_rx => break,
                }
            }
        });

        tracing::info!("Bismuth server listening on 127.0.0.1:{}", port);
        Ok(Self {
            shutdown_tx: Some(shutdown_tx),
            port,
        })
    }

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
