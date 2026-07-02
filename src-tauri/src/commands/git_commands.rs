//! Git IPC commands for vault version control.

use crate::services::git_service::{CommitEntry, FileStatus, GitService};
use std::sync::Mutex;
use tauri::State;

/// Managed state for the git service.
pub struct GitState {
    pub git_service: Mutex<Option<GitService>>,
}

/// Initialize the git service for a vault root.
#[tauri::command]
pub async fn initialize_git_service(
    state: State<'_, GitState>,
    vault_root: String,
) -> Result<bool, String> {
    let path = std::path::PathBuf::from(&vault_root);
    if !path.join(".git").exists() {
        let mut guard = state.git_service.lock().unwrap();
        *guard = None;
        return Ok(false);
    }
    let service = GitService::new(&path);
    let mut guard = state.git_service.lock().unwrap();
    *guard = Some(service);
    Ok(true)
}

/// Get current branch name.
#[tauri::command]
pub async fn git_current_branch(state: State<'_, GitState>) -> Result<String, String> {
    let guard = state.git_service.lock().unwrap();
    let service = guard.as_ref().ok_or("Git service not initialized")?;
    service.current_branch().map_err(|e| e.to_string())
}

/// List all local branches.
#[tauri::command]
pub async fn git_list_branches(state: State<'_, GitState>) -> Result<Vec<String>, String> {
    let guard = state.git_service.lock().unwrap();
    let service = guard.as_ref().ok_or("Git service not initialized")?;
    service.list_branches().map_err(|e| e.to_string())
}

/// Get status of all modified/staged/untracked files.
#[tauri::command]
pub async fn git_status(state: State<'_, GitState>) -> Result<Vec<FileStatus>, String> {
    let guard = state.git_service.lock().unwrap();
    let service = guard.as_ref().ok_or("Git service not initialized")?;
    service.git_status().map_err(|e| e.to_string())
}

/// Stage files for commit.
#[tauri::command]
pub async fn git_add(state: State<'_, GitState>, paths: Vec<String>) -> Result<(), String> {
    let guard = state.git_service.lock().unwrap();
    let service = guard.as_ref().ok_or("Git service not initialized")?;
    service.git_add(&paths).map_err(|e| e.to_string())
}

/// Create a commit with a message.
#[tauri::command]
pub async fn git_commit(state: State<'_, GitState>, message: String) -> Result<String, String> {
    let guard = state.git_service.lock().unwrap();
    let service = guard.as_ref().ok_or("Git service not initialized")?;
    service.git_commit(&message).map_err(|e| e.to_string())
}

/// Get recent commit log entries.
#[tauri::command]
pub async fn git_log(state: State<'_, GitState>, limit: usize) -> Result<Vec<CommitEntry>, String> {
    let guard = state.git_service.lock().unwrap();
    let service = guard.as_ref().ok_or("Git service not initialized")?;
    service.git_log(limit).map_err(|e| e.to_string())
}
