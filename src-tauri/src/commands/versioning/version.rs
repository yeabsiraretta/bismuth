//! Versioning Tauri command implementations.
//!
//! All four handlers delegate to the `version_service` domain layer.
//! Each call is logged via `tracing::info!` for an audit trail.

use crate::services::version_service::diff::{classify_bump, compute_diff_metrics, BumpType, DiffMetrics};
use crate::services::version_service::storage::{list_versions, save_diff, VersionEntry};
use std::path::Path;

/// Compute diff metrics between old and new document content.
///
/// Returns a [`DiffMetrics`] struct with line-level counts, heading delta,
/// and structural token delta.
#[tauri::command]
pub async fn compute_version_diff_metrics(
    old_content: String,
    new_content: String,
) -> Result<DiffMetrics, String> {
    tracing::info!("Versioning: compute_version_diff_metrics called");
    let metrics = compute_diff_metrics(&old_content, &new_content);
    Ok(metrics)
}

/// Derive a new semver string by applying the appropriate bump to `current_version`.
///
/// Parses `current_version` as `MAJOR.MINOR.PATCH` and increments the relevant
/// component based on `metrics`. Returns the resulting semver string.
#[tauri::command]
pub async fn bump_version(current_version: String, metrics: DiffMetrics) -> Result<String, String> {
    tracing::info!("Versioning: bump_version called for version={}", current_version);

    let bump = classify_bump(&metrics);
    let new_version = apply_bump(&current_version, &bump)?;
    Ok(new_version)
}

/// Save a version diff entry for `file_id` in the vault.
///
/// Creates `.bismuth/versions/{file_id}/` if absent, writes a timestamped JSON file,
/// and returns the created [`VersionEntry`].
#[tauri::command]
pub async fn save_note_version(
    vault_root: String,
    file_id: String,
    version: String,
    old_content: String,
    new_content: String,
) -> Result<VersionEntry, String> {
    tracing::info!(
        "Versioning: save_note_version called — file_id={}, version={}",
        file_id,
        version
    );
    let vault_path = Path::new(&vault_root);
    save_diff(vault_path, &file_id, &old_content, &new_content, &version)
}

/// List stored versions for `file_id`, newest-first, capped at 50.
#[tauri::command]
pub async fn list_note_versions(
    vault_root: String,
    file_id: String,
) -> Result<Vec<VersionEntry>, String> {
    tracing::info!("Versioning: list_note_versions called — file_id={}", file_id);
    let vault_path = Path::new(&vault_root);
    list_versions(vault_path, &file_id, 50)
}

/// Retrieve the raw diff JSON for a specific version file.
///
/// `version_path` must be a relative path beginning with `.bismuth/versions/`.
/// The vault root is prepended and the resulting path is safety-checked.
#[tauri::command]
pub async fn get_note_diff(vault_root: String, file_id: String, version: String) -> Result<String, String> {
    tracing::info!(
        "Versioning: get_note_diff called — file_id={}, version={}",
        file_id,
        version
    );

    // Validate file_id has no path traversal characters.
    if file_id.contains('/') || file_id.contains('\\') || file_id.contains("..") || file_id.is_empty() {
        tracing::warn!("Versioning: rejected invalid file_id in get_note_diff: {:?}", file_id);
        return Err("invalid file_id".to_string());
    }

    let vault_path = Path::new(&vault_root);
    let vault_canonical = vault_path
        .canonicalize()
        .map_err(|e| format!("Failed to canonicalize vault root: {}", e))?;

    // `version` here is the filename (not a semver string) or the relative diff_path.
    // We accept a relative path starting with `.bismuth/versions/` OR just a filename.
    let relative = if version.starts_with(".bismuth/versions/") {
        version.clone()
    } else {
        format!(".bismuth/versions/{}/{}", file_id, version)
    };

    let candidate = vault_canonical.join(&relative);
    let canonical = candidate
        .canonicalize()
        .map_err(|e| format!("Version file not found: {}", e))?;

    if !canonical.starts_with(&vault_canonical) {
        tracing::warn!("Versioning: path traversal attempt detected in get_note_diff");
        return Err("path traversal detected".to_string());
    }

    std::fs::read_to_string(&canonical)
        .map_err(|e| format!("Failed to read version file: {}", e))
}

/// Apply a semver bump to `current_version`, returning the bumped string.
fn apply_bump(current_version: &str, bump: &BumpType) -> Result<String, String> {
    // Initialize with "0.1.0" if blank or unparseable.
    if current_version.is_empty() || current_version == "0.0.0" {
        return Ok("0.1.0".to_string());
    }

    let parts: Vec<&str> = current_version.split('.').collect();
    if parts.len() != 3 {
        return Ok("0.1.0".to_string());
    }

    let major: u64 = parts[0].parse().unwrap_or(0);
    let minor: u64 = parts[1].parse().unwrap_or(1);
    let patch: u64 = parts[2].parse().unwrap_or(0);

    let (new_major, new_minor, new_patch) = match bump {
        BumpType::Major => (major + 1, 0, 0),
        BumpType::Minor => (major, minor + 1, 0),
        BumpType::Patch => (major, minor, patch + 1),
    };

    Ok(format!("{}.{}.{}", new_major, new_minor, new_patch))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_apply_bump_patch() {
        assert_eq!(apply_bump("1.2.3", &BumpType::Patch).unwrap(), "1.2.4");
    }

    #[test]
    fn test_apply_bump_minor() {
        assert_eq!(apply_bump("1.2.3", &BumpType::Minor).unwrap(), "1.3.0");
    }

    #[test]
    fn test_apply_bump_major() {
        assert_eq!(apply_bump("1.2.3", &BumpType::Major).unwrap(), "2.0.0");
    }

    #[test]
    fn test_apply_bump_empty_version_initializes() {
        assert_eq!(apply_bump("", &BumpType::Patch).unwrap(), "0.1.0");
    }
}
