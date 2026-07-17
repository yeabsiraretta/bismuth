//! Local HTTP REST API server for Bismuth.
//!
//! Exposes vault operations over `http://127.0.0.1:21721/api/...`
//! so external tools (MCP clients, scripts, browser extensions) can interact
//! with the running Bismuth instance.

use std::sync::Arc;

use axum::extract::{Path, Query, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::routing::get;
use axum::{Json, Router};
use serde::{Deserialize, Serialize};
use tower_http::cors::{Any, CorsLayer};

use crate::hubs::core::{
    backup_service, embedding_service, git_service, stats_service, vault_service, version_service,
};
use crate::infrastructure::state::AppState;

/// Default port for the local API server.
pub const API_PORT: u16 = 21721;

// ── Request / response types ────────────────────────────────────────────────

#[derive(Deserialize)]
pub struct SearchQuery {
    pub q: String,
}

#[derive(Deserialize)]
pub struct CreateNoteBody {
    pub title: String,
    pub folder: Option<String>,
    pub content: Option<String>,
    pub extension: Option<String>,
}

#[derive(Deserialize)]
pub struct WriteNoteBody {
    pub content: String,
}

#[derive(Serialize)]
pub struct ApiStatus {
    pub ok: bool,
    pub version: &'static str,
    pub vault_open: bool,
}

#[derive(Serialize)]
pub struct ApiError {
    pub error: String,
}

// ── Helpers ─────────────────────────────────────────────────────────────────

fn app_err(e: crate::infrastructure::error::AppError) -> (StatusCode, Json<ApiError>) {
    let msg = e.to_string();
    let code = if msg.contains("No vault is open") {
        StatusCode::PRECONDITION_FAILED
    } else if msg.contains("not found") || msg.contains("does not exist") {
        StatusCode::NOT_FOUND
    } else {
        StatusCode::INTERNAL_SERVER_ERROR
    };
    (code, Json(ApiError { error: msg }))
}

// ── Handlers ────────────────────────────────────────────────────────────────

async fn status(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    let vault_open = state.vault_root().is_ok();
    Json(ApiStatus {
        ok: true,
        version: env!("CARGO_PKG_VERSION"),
        vault_open,
    })
}

async fn list_notes(
    State(state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, (StatusCode, Json<ApiError>)> {
    vault_service::scan_vault(&state).map(Json).map_err(app_err)
}

async fn read_note(
    State(state): State<Arc<AppState>>,
    Path(note_path): Path<String>,
) -> Result<impl IntoResponse, (StatusCode, Json<ApiError>)> {
    vault_service::read_note(&state, &note_path)
        .map(Json)
        .map_err(app_err)
}

async fn write_note(
    State(state): State<Arc<AppState>>,
    Path(note_path): Path<String>,
    Json(body): Json<WriteNoteBody>,
) -> Result<impl IntoResponse, (StatusCode, Json<ApiError>)> {
    vault_service::write_note(&state, &note_path, &body.content)
        .map(|_| StatusCode::NO_CONTENT)
        .map_err(app_err)
}

async fn create_note(
    State(state): State<Arc<AppState>>,
    Json(body): Json<CreateNoteBody>,
) -> Result<impl IntoResponse, (StatusCode, Json<ApiError>)> {
    vault_service::create_note(
        &state,
        &body.title,
        body.folder.as_deref(),
        body.extension.as_deref(),
    )
    .map(|n| (StatusCode::CREATED, Json(n)))
    .map_err(app_err)
}

async fn delete_note_handler(
    State(state): State<Arc<AppState>>,
    Path(note_path): Path<String>,
) -> Result<impl IntoResponse, (StatusCode, Json<ApiError>)> {
    vault_service::delete_note(&state, &note_path)
        .map(|_| StatusCode::NO_CONTENT)
        .map_err(app_err)
}

async fn search(
    State(state): State<Arc<AppState>>,
    Query(q): Query<SearchQuery>,
) -> Result<impl IntoResponse, (StatusCode, Json<ApiError>)> {
    vault_service::search_vault(&state, &q.q)
        .map(Json)
        .map_err(app_err)
}

async fn vault_stats(
    State(state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, (StatusCode, Json<ApiError>)> {
    stats_service::compute_vault_stats(&state)
        .map(Json)
        .map_err(app_err)
}

async fn vault_tags(
    State(state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, (StatusCode, Json<ApiError>)> {
    vault_service::extract_vault_tags(&state)
        .map(Json)
        .map_err(app_err)
}

async fn graph_data(
    State(state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, (StatusCode, Json<ApiError>)> {
    vault_service::build_graph_data(&state)
        .map(Json)
        .map_err(app_err)
}

// ── Canvas endpoints ──────────────────────────────────────────────────────────

async fn list_canvases(
    State(state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, (StatusCode, Json<ApiError>)> {
    vault_service::scan_vault(&state)
        .map(|notes| {
            let canvases: Vec<_> = notes
                .into_iter()
                .filter(|n| n.path.ends_with(".canvas"))
                .collect();
            Json(canvases)
        })
        .map_err(app_err)
}

// ── Git endpoints ─────────────────────────────────────────────────────────────

async fn git_status_handler(
    State(state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, (StatusCode, Json<ApiError>)> {
    git_service::git_status(&state).map(Json).map_err(app_err)
}

async fn git_stage_all_handler(
    State(state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, (StatusCode, Json<ApiError>)> {
    git_service::git_stage_all(&state)
        .map(|_| StatusCode::NO_CONTENT)
        .map_err(app_err)
}

#[derive(Deserialize)]
pub struct GitCommitBody {
    pub message: String,
}

async fn git_commit_handler(
    State(state): State<Arc<AppState>>,
    Json(body): Json<GitCommitBody>,
) -> Result<impl IntoResponse, (StatusCode, Json<ApiError>)> {
    git_service::git_commit(&state, &body.message)
        .map(|_| StatusCode::NO_CONTENT)
        .map_err(app_err)
}

async fn git_push_handler(
    State(state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, (StatusCode, Json<ApiError>)> {
    git_service::git_push(&state)
        .map(|_| StatusCode::NO_CONTENT)
        .map_err(app_err)
}

async fn git_pull_handler(
    State(state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, (StatusCode, Json<ApiError>)> {
    git_service::git_pull(&state)
        .map(|_| StatusCode::NO_CONTENT)
        .map_err(app_err)
}

// ── Version endpoints ─────────────────────────────────────────────────────────

async fn list_versions_handler(
    State(state): State<Arc<AppState>>,
    Path(note_path): Path<String>,
) -> Result<impl IntoResponse, (StatusCode, Json<ApiError>)> {
    version_service::list_versions(&state, &note_path)
        .map(Json)
        .map_err(app_err)
}

#[derive(Deserialize)]
pub struct CreateVersionBody {
    pub label: Option<String>,
}

async fn create_version_handler(
    State(state): State<Arc<AppState>>,
    Path(note_path): Path<String>,
    Json(body): Json<CreateVersionBody>,
) -> Result<impl IntoResponse, (StatusCode, Json<ApiError>)> {
    version_service::create_version(&state, &note_path, body.label.as_deref())
        .map(|v| (StatusCode::CREATED, Json(v)))
        .map_err(app_err)
}

#[derive(Deserialize)]
pub struct ReadVersionQuery {
    pub id: String,
}

async fn read_version_handler(
    State(state): State<Arc<AppState>>,
    Path(note_path): Path<String>,
    Query(q): Query<ReadVersionQuery>,
) -> Result<impl IntoResponse, (StatusCode, Json<ApiError>)> {
    version_service::read_version(&state, &note_path, &q.id)
        .map(Json)
        .map_err(app_err)
}

// ── Backup endpoints ──────────────────────────────────────────────────────────

async fn list_backups_handler(
    State(state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, (StatusCode, Json<ApiError>)> {
    backup_service::list_backups(&state)
        .map(Json)
        .map_err(app_err)
}

async fn create_backup_handler(
    State(state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, (StatusCode, Json<ApiError>)> {
    backup_service::create_backup(&state)
        .map(|b| (StatusCode::CREATED, Json(b)))
        .map_err(app_err)
}

async fn delete_backup_handler(
    State(state): State<Arc<AppState>>,
    Path(backup_path): Path<String>,
) -> Result<impl IntoResponse, (StatusCode, Json<ApiError>)> {
    backup_service::delete_backup(&state, &backup_path)
        .map(|_| StatusCode::NO_CONTENT)
        .map_err(app_err)
}

// ── Smart connections endpoints ───────────────────────────────────────────────

#[derive(Deserialize)]
pub struct SimilarNotesQuery {
    pub limit: Option<usize>,
    pub min_score: Option<f64>,
}

async fn similar_notes_handler(
    State(state): State<Arc<AppState>>,
    Path(note_path): Path<String>,
    Query(q): Query<SimilarNotesQuery>,
) -> Result<impl IntoResponse, (StatusCode, Json<ApiError>)> {
    let limit = q.limit.unwrap_or(10);
    let min_score = q.min_score.unwrap_or(0.1);
    embedding_service::find_similar_notes(&state, &note_path, limit, min_score)
        .map(Json)
        .map_err(app_err)
}

#[derive(Deserialize)]
pub struct SimilarTextQuery {
    pub q: String,
    pub limit: Option<usize>,
    pub min_score: Option<f64>,
}

async fn similar_text_handler(
    State(state): State<Arc<AppState>>,
    Query(q): Query<SimilarTextQuery>,
) -> Result<impl IntoResponse, (StatusCode, Json<ApiError>)> {
    let limit = q.limit.unwrap_or(10);
    let min_score = q.min_score.unwrap_or(0.1);
    embedding_service::find_similar_to_text(&state, &q.q, limit, min_score)
        .map(Json)
        .map_err(app_err)
}

// ── Router builder ──────────────────────────────────────────────────────────

pub fn build_router(state: Arc<AppState>) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    Router::new()
        .route("/api/status", get(status))
        .route("/api/notes", get(list_notes).post(create_note))
        .route(
            "/api/notes/{*path}",
            get(read_note).put(write_note).delete(delete_note_handler),
        )
        .route("/api/search", get(search))
        .route("/api/stats", get(vault_stats))
        .route("/api/tags", get(vault_tags))
        .route("/api/graph", get(graph_data))
        // Canvas
        .route("/api/canvases", get(list_canvases))
        // Git
        .route("/api/git/status", get(git_status_handler))
        .route("/api/git/stage", axum::routing::post(git_stage_all_handler))
        .route("/api/git/commit", axum::routing::post(git_commit_handler))
        .route("/api/git/push", axum::routing::post(git_push_handler))
        .route("/api/git/pull", axum::routing::post(git_pull_handler))
        // Versions
        .route(
            "/api/versions/{*note_path}",
            get(list_versions_handler).post(create_version_handler),
        )
        .route("/api/version/{*note_path}", get(read_version_handler))
        // Backups
        .route(
            "/api/backups",
            get(list_backups_handler).post(create_backup_handler),
        )
        .route(
            "/api/backups/{*path}",
            axum::routing::delete(delete_backup_handler),
        )
        // Smart connections
        .route("/api/similar/{*note_path}", get(similar_notes_handler))
        .route("/api/similar-text", get(similar_text_handler))
        .layer(cors)
        .with_state(state)
}

/// Start the HTTP API server. Call from a `tokio::spawn`.
pub async fn start(state: Arc<AppState>) {
    let app = build_router(state);
    let addr = format!("127.0.0.1:{API_PORT}");
    tracing::info!(api_port = API_PORT, "Starting local HTTP API server");

    let listener = match tokio::net::TcpListener::bind(&addr).await {
        Ok(l) => l,
        Err(e) => {
            tracing::warn!(error = %e, "Failed to bind API server on {addr} — API disabled");
            return;
        },
    };

    if let Err(e) = axum::serve(listener, app).await {
        tracing::error!(error = %e, "API server exited with error");
    }
}
