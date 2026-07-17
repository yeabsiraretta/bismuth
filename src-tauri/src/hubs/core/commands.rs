use crate::infrastructure::error::AppResult;
use crate::infrastructure::state::AppState;

use super::backup_service::{self, BackupInfo, BackupListResult};
use super::embedding_service::{self, SmartConnection};
use super::git_service::{self, GitStatus};
use super::import_service::{self, ImportResult, ImportSource};
use super::publish_service::{self, ExportFormat, PublishResult};
use super::service::CoreService;
use super::stats_service::{self, VaultStats};
use super::types::{
    AppInfo, BatchNoteContent, GraphDataResult, NoteMeta, NoteResponse, SearchResult,
    VaultResponse,
};
use super::vault_service;
use super::version_service::{self, NoteVersion};

#[tauri::command]
pub(crate) fn greet(name: &str, state: tauri::State<'_, AppState>) -> AppResult<String> {
    tracing::debug!(hub = "core", cmd = "greet", name, "IPC command invoked");
    let result = CoreService::greet(&state, name);
    if let Err(ref e) = result {
        tracing::error!(hub = "core", cmd = "greet", error = %e, "Command failed");
    }
    result
}

#[tauri::command]
pub(crate) fn get_app_info(state: tauri::State<'_, AppState>) -> AppResult<AppInfo> {
    tracing::debug!(hub = "core", cmd = "get_app_info", "IPC command invoked");
    let result = CoreService::app_info(&state);
    if let Err(ref e) = result {
        tracing::error!(hub = "core", cmd = "get_app_info", error = %e, "Command failed");
    }
    result
}

// ── Vault commands ───────────────────────────────────────────────────────────

#[tauri::command]
pub(crate) fn open_vault(path: &str, state: tauri::State<'_, AppState>) -> AppResult<VaultResponse> {
    tracing::debug!(hub = "core", cmd = "open_vault", path, "IPC command invoked");
    let result = vault_service::open_vault(&state, path);
    if let Err(ref e) = result {
        tracing::error!(hub = "core", cmd = "open_vault", error = %e, "Command failed");
    }
    result
}

#[tauri::command]
pub(crate) fn create_vault(
    path: &str,
    name: &str,
    state: tauri::State<'_, AppState>,
) -> AppResult<VaultResponse> {
    tracing::debug!(hub = "core", cmd = "create_vault", path, name, "IPC command invoked");
    let result = vault_service::create_vault(&state, path, name);
    if let Err(ref e) = result {
        tracing::error!(hub = "core", cmd = "create_vault", error = %e, "Command failed");
    }
    result
}

#[tauri::command]
pub(crate) fn scan_vault(state: tauri::State<'_, AppState>) -> AppResult<Vec<NoteMeta>> {
    tracing::debug!(hub = "core", cmd = "scan_vault", "IPC command invoked");
    let result = vault_service::scan_vault(&state);
    if let Err(ref e) = result {
        tracing::error!(hub = "core", cmd = "scan_vault", error = %e, "Command failed");
    }
    result
}

// ── Note CRUD commands ───────────────────────────────────────────────────────

#[tauri::command]
pub(crate) fn read_note(path: &str, state: tauri::State<'_, AppState>) -> AppResult<NoteResponse> {
    tracing::debug!(hub = "core", cmd = "read_note", path, "IPC command invoked");
    let result = vault_service::read_note(&state, path);
    if let Err(ref e) = result {
        tracing::error!(hub = "core", cmd = "read_note", error = %e, "Command failed");
    }
    result
}

#[tauri::command]
pub(crate) fn write_note(
    path: &str,
    content: &str,
    state: tauri::State<'_, AppState>,
) -> AppResult<()> {
    tracing::debug!(hub = "core", cmd = "write_note", path, "IPC command invoked");
    let result = vault_service::write_note(&state, path, content);
    if let Err(ref e) = result {
        tracing::error!(hub = "core", cmd = "write_note", error = %e, "Command failed");
    }
    result
}

#[tauri::command]
pub(crate) fn create_note(
    title: &str,
    folder: Option<&str>,
    extension: Option<&str>,
    state: tauri::State<'_, AppState>,
) -> AppResult<NoteResponse> {
    tracing::debug!(hub = "core", cmd = "create_note", title, "IPC command invoked");
    let result = vault_service::create_note(&state, title, folder, extension);
    if let Err(ref e) = result {
        tracing::error!(hub = "core", cmd = "create_note", error = %e, "Command failed");
    }
    result
}

#[tauri::command]
pub(crate) fn delete_note(path: &str, state: tauri::State<'_, AppState>) -> AppResult<()> {
    tracing::debug!(hub = "core", cmd = "delete_note", path, "IPC command invoked");
    let result = vault_service::delete_note(&state, path);
    if let Err(ref e) = result {
        tracing::error!(hub = "core", cmd = "delete_note", error = %e, "Command failed");
    }
    result
}

#[tauri::command]
pub(crate) fn rename_note(
    old_path: &str,
    new_title: &str,
    state: tauri::State<'_, AppState>,
) -> AppResult<NoteResponse> {
    tracing::debug!(hub = "core", cmd = "rename_note", old_path, new_title, "IPC command invoked");
    let result = vault_service::rename_note(&state, old_path, new_title);
    if let Err(ref e) = result {
        tracing::error!(hub = "core", cmd = "rename_note", error = %e, "Command failed");
    }
    result
}

// ── Search commands ──────────────────────────────────────────────────────────

#[tauri::command]
pub(crate) fn search_vault(
    query: &str,
    state: tauri::State<'_, AppState>,
) -> AppResult<Vec<SearchResult>> {
    tracing::debug!(hub = "core", cmd = "search_vault", query, "IPC command invoked");
    let result = vault_service::search_vault(&state, query);
    if let Err(ref e) = result {
        tracing::error!(hub = "core", cmd = "search_vault", error = %e, "Command failed");
    }
    result
}

// ── Batch / performance commands ────────────────────────────────────────────

#[tauri::command]
pub(crate) fn batch_read_notes(
    paths: Vec<String>,
    state: tauri::State<'_, AppState>,
) -> AppResult<Vec<BatchNoteContent>> {
    tracing::debug!(hub = "core", cmd = "batch_read_notes", count = paths.len(), "IPC command invoked");
    let result = vault_service::batch_read_notes(&state, &paths);
    if let Err(ref e) = result {
        tracing::error!(hub = "core", cmd = "batch_read_notes", error = %e, "Command failed");
    }
    result
}

#[tauri::command]
pub(crate) fn build_graph_data(state: tauri::State<'_, AppState>) -> AppResult<GraphDataResult> {
    tracing::debug!(hub = "core", cmd = "build_graph_data", "IPC command invoked");
    let result = vault_service::build_graph_data(&state);
    if let Err(ref e) = result {
        tracing::error!(hub = "core", cmd = "build_graph_data", error = %e, "Command failed");
    }
    result
}

#[tauri::command]
pub(crate) fn extract_vault_tags(
    state: tauri::State<'_, AppState>,
) -> AppResult<Vec<stats_service::TagCount>> {
    tracing::debug!(hub = "core", cmd = "extract_vault_tags", "IPC command invoked");
    let result = vault_service::extract_vault_tags(&state);
    if let Err(ref e) = result {
        tracing::error!(hub = "core", cmd = "extract_vault_tags", error = %e, "Command failed");
    }
    result
}

// ── Version history commands ────────────────────────────────────────────────

#[tauri::command]
pub(crate) fn list_versions(
    note_path: &str,
    state: tauri::State<'_, AppState>,
) -> AppResult<Vec<NoteVersion>> {
    tracing::debug!(hub = "core", cmd = "list_versions", note_path, "IPC command invoked");
    let result = version_service::list_versions(&state, note_path);
    if let Err(ref e) = result {
        tracing::error!(hub = "core", cmd = "list_versions", error = %e, "Command failed");
    }
    result
}

#[tauri::command]
pub(crate) fn create_version(
    note_path: &str,
    label: Option<&str>,
    state: tauri::State<'_, AppState>,
) -> AppResult<NoteVersion> {
    tracing::debug!(hub = "core", cmd = "create_version", note_path, "IPC command invoked");
    let result = version_service::create_version(&state, note_path, label);
    if let Err(ref e) = result {
        tracing::error!(hub = "core", cmd = "create_version", error = %e, "Command failed");
    }
    result
}

#[tauri::command]
pub(crate) fn read_version(
    note_path: &str,
    version_id: &str,
    state: tauri::State<'_, AppState>,
) -> AppResult<String> {
    tracing::debug!(hub = "core", cmd = "read_version", note_path, version_id, "IPC command invoked");
    let result = version_service::read_version(&state, note_path, version_id);
    if let Err(ref e) = result {
        tracing::error!(hub = "core", cmd = "read_version", error = %e, "Command failed");
    }
    result
}

#[tauri::command]
pub(crate) fn delete_version(
    note_path: &str,
    version_id: &str,
    state: tauri::State<'_, AppState>,
) -> AppResult<()> {
    tracing::debug!(hub = "core", cmd = "delete_version", note_path, version_id, "IPC command invoked");
    let result = version_service::delete_version(&state, note_path, version_id);
    if let Err(ref e) = result {
        tracing::error!(hub = "core", cmd = "delete_version", error = %e, "Command failed");
    }
    result
}

// ── Git commands ────────────────────────────────────────────────────────────

#[tauri::command]
pub(crate) fn git_status(state: tauri::State<'_, AppState>) -> AppResult<GitStatus> {
    tracing::debug!(hub = "core", cmd = "git_status", "IPC command invoked");
    let result = git_service::git_status(&state);
    if let Err(ref e) = result {
        tracing::error!(hub = "core", cmd = "git_status", error = %e, "Command failed");
    }
    result
}

#[tauri::command]
pub(crate) fn git_stage_all(state: tauri::State<'_, AppState>) -> AppResult<()> {
    tracing::debug!(hub = "core", cmd = "git_stage_all", "IPC command invoked");
    let result = git_service::git_stage_all(&state);
    if let Err(ref e) = result {
        tracing::error!(hub = "core", cmd = "git_stage_all", error = %e, "Command failed");
    }
    result
}

#[tauri::command]
pub(crate) fn git_commit(message: &str, state: tauri::State<'_, AppState>) -> AppResult<()> {
    tracing::debug!(hub = "core", cmd = "git_commit", message, "IPC command invoked");
    let result = git_service::git_commit(&state, message);
    if let Err(ref e) = result {
        tracing::error!(hub = "core", cmd = "git_commit", error = %e, "Command failed");
    }
    result
}

#[tauri::command]
pub(crate) fn git_push(state: tauri::State<'_, AppState>) -> AppResult<()> {
    tracing::debug!(hub = "core", cmd = "git_push", "IPC command invoked");
    let result = git_service::git_push(&state);
    if let Err(ref e) = result {
        tracing::error!(hub = "core", cmd = "git_push", error = %e, "Command failed");
    }
    result
}

#[tauri::command]
pub(crate) fn git_pull(state: tauri::State<'_, AppState>) -> AppResult<()> {
    tracing::debug!(hub = "core", cmd = "git_pull", "IPC command invoked");
    let result = git_service::git_pull(&state);
    if let Err(ref e) = result {
        tracing::error!(hub = "core", cmd = "git_pull", error = %e, "Command failed");
    }
    result
}

// ── Import commands ────────────────────────────────────────────────────────

#[tauri::command]
pub(crate) fn import_notes(
    source: ImportSource,
    source_path: &str,
    state: tauri::State<'_, AppState>,
) -> AppResult<ImportResult> {
    tracing::debug!(hub = "core", cmd = "import_notes", ?source, source_path, "IPC command invoked");
    let result = import_service::import_notes(&state, source, source_path);
    if let Err(ref e) = result {
        tracing::error!(hub = "core", cmd = "import_notes", error = %e, "Command failed");
    }
    result
}

// ── Backup commands ────────────────────────────────────────────────────────

#[tauri::command]
pub(crate) fn create_backup(state: tauri::State<'_, AppState>) -> AppResult<BackupInfo> {
    tracing::debug!(hub = "core", cmd = "create_backup", "IPC command invoked");
    let result = backup_service::create_backup(&state);
    if let Err(ref e) = result {
        tracing::error!(hub = "core", cmd = "create_backup", error = %e, "Command failed");
    }
    result
}

#[tauri::command]
pub(crate) fn list_backups(state: tauri::State<'_, AppState>) -> AppResult<BackupListResult> {
    tracing::debug!(hub = "core", cmd = "list_backups", "IPC command invoked");
    let result = backup_service::list_backups(&state);
    if let Err(ref e) = result {
        tracing::error!(hub = "core", cmd = "list_backups", error = %e, "Command failed");
    }
    result
}

#[tauri::command]
pub(crate) fn delete_backup(backup_path: &str, state: tauri::State<'_, AppState>) -> AppResult<()> {
    tracing::debug!(hub = "core", cmd = "delete_backup", backup_path, "IPC command invoked");
    let result = backup_service::delete_backup(&state, backup_path);
    if let Err(ref e) = result {
        tracing::error!(hub = "core", cmd = "delete_backup", error = %e, "Command failed");
    }
    result
}

// ── Publish commands ───────────────────────────────────────────────────────

#[tauri::command]
pub(crate) fn publish_notes(
    format: ExportFormat,
    note_paths: Vec<String>,
    output_dir: Option<&str>,
    state: tauri::State<'_, AppState>,
) -> AppResult<PublishResult> {
    tracing::debug!(hub = "core", cmd = "publish_notes", ?format, count = note_paths.len(), "IPC command invoked");
    let result = publish_service::publish_notes(&state, format, &note_paths, output_dir);
    if let Err(ref e) = result {
        tracing::error!(hub = "core", cmd = "publish_notes", error = %e, "Command failed");
    }
    result
}

// ── Stats commands ────────────────────────────────────────────────────────

#[tauri::command]
pub(crate) fn compute_vault_stats(state: tauri::State<'_, AppState>) -> AppResult<VaultStats> {
    tracing::debug!(hub = "core", cmd = "compute_vault_stats", "IPC command invoked");
    let result = stats_service::compute_vault_stats(&state);
    if let Err(ref e) = result {
        tracing::error!(hub = "core", cmd = "compute_vault_stats", error = %e, "Command failed");
    }
    result
}

// ── HTTP proxy command ────────────────────────────────────────────────────

#[tauri::command]
pub async fn fetch_url(url: String) -> AppResult<String> {
    tracing::debug!(hub = "core", cmd = "fetch_url", %url, "IPC command invoked");

    let result = async {
        // Validate URL scheme — only allow HTTPS and HTTP
        if !url.starts_with("https://") && !url.starts_with("http://") {
            return Err(crate::infrastructure::error::AppError::Custom(
                "Only http:// and https:// URLs are allowed".into(),
            ));
        }

        // Reject requests to localhost / private IPs (SSRF prevention)
        let host = url
            .trim_start_matches("https://")
            .trim_start_matches("http://")
            .split('/')
            .next()
            .unwrap_or("")
            .split(':')
            .next()
            .unwrap_or("");
        let blocked = [
            "localhost", "127.0.0.1", "0.0.0.0", "[::1]", "169.254.",
            "10.", "192.168.", "172.16.", "172.17.", "172.18.", "172.19.",
            "172.20.", "172.21.", "172.22.", "172.23.", "172.24.", "172.25.",
            "172.26.", "172.27.", "172.28.", "172.29.", "172.30.", "172.31.",
        ];
        if blocked.iter().any(|b| host.starts_with(b) || host == *b) {
            return Err(crate::infrastructure::error::AppError::Custom(
                "Requests to private/local addresses are not allowed".into(),
            ));
        }

        let output = tokio::process::Command::new("curl")
            .args(["-fsSL", "--max-time", "15", &url])
            .output()
            .await
            .map_err(|e| crate::infrastructure::error::AppError::Custom(format!("Failed to run curl: {e}")))?;
        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(crate::infrastructure::error::AppError::Custom(
                format!("curl failed ({}): {}", output.status, stderr.trim()),
            ));
        }
        String::from_utf8(output.stdout)
            .map_err(|e| crate::infrastructure::error::AppError::Custom(format!("Invalid UTF-8 response: {e}")))
    }.await;

    if let Err(ref e) = result {
        tracing::error!(hub = "core", cmd = "fetch_url", error = %e, "Command failed");
    }
    result
}

// ── Smart connections commands ────────────────────────────────────────────

#[tauri::command]
pub(crate) fn find_similar_notes(
    note_path: &str,
    limit: usize,
    min_score: f64,
    state: tauri::State<'_, AppState>,
) -> AppResult<Vec<SmartConnection>> {
    tracing::debug!(hub = "core", cmd = "find_similar_notes", note_path, limit, "IPC command invoked");
    let result = embedding_service::find_similar_notes(&state, note_path, limit, min_score);
    if let Err(ref e) = result {
        tracing::error!(hub = "core", cmd = "find_similar_notes", error = %e, "Command failed");
    }
    result
}

#[tauri::command]
pub(crate) fn find_similar_to_text(
    query: &str,
    limit: usize,
    min_score: f64,
    state: tauri::State<'_, AppState>,
) -> AppResult<Vec<SmartConnection>> {
    tracing::debug!(hub = "core", cmd = "find_similar_to_text", query, limit, "IPC command invoked");
    let result = embedding_service::find_similar_to_text(&state, query, limit, min_score);
    if let Err(ref e) = result {
        tracing::error!(hub = "core", cmd = "find_similar_to_text", error = %e, "Command failed");
    }
    result
}
