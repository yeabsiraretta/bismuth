//! Versioning IPC command handlers.
//!
//! Exposes four `#[tauri::command]` functions for the frontend:
//! - `compute_diff_metrics` — compute metrics from old/new content
//! - `bump_version` — derive new semver string from current version + metrics
//! - `save_diff` — persist a version entry to `.bismuth/versions/{file_id}/`
//! - `list_versions` — retrieve stored version history, newest-first

pub mod version;

pub use version::*;
