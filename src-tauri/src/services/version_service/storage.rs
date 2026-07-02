//! Version storage layer — read/write `.bismuth/versions/{file_id}/` diff files.
//!
//! SECURITY NOTE: Diff content is derived from vault-local file content only.
//! These files are never transmitted over the network. The `save_diff` function
//! does not call any external service or IPC endpoint. LLM classification
//! (Phase 7) sends only the `summary` string, never raw diff content.
//!
//! Path safety: all paths are canonicalized and verified to remain inside the
//! vault root before any filesystem operation, preventing path traversal attacks.

use crate::services::version_service::diff::{classify_bump, compute_diff_metrics, BumpType, DiffMetrics};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

/// A single stored version entry, serialized as JSON in `.bismuth/versions/`.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VersionEntry {
    /// Semver string, e.g. `"1.2.3"`.
    pub version: String,
    /// ISO 8601 timestamp.
    pub timestamp: String,
    /// The computed bump type for this version.
    pub bump_type: BumpType,
    /// Auto-generated one-line description of what changed.
    pub summary: String,
    /// Relative path to this JSON file inside the vault root.
    pub diff_path: String,
    /// Quantitative diff metrics used to derive the bump type.
    pub metrics: DiffMetrics,
}

/// Validate that `file_id` contains no path-traversal characters.
///
/// Rejects any `file_id` containing `/`, `\`, or `..` components.
/// Returns `Err("invalid file_id")` for invalid inputs.
fn validate_file_id(file_id: &str) -> Result<(), String> {
    if file_id.contains('/') || file_id.contains('\\') || file_id.contains("..") || file_id.is_empty() {
        tracing::warn!("Versioning: rejected invalid file_id: {:?}", file_id);
        return Err("invalid file_id".to_string());
    }
    Ok(())
}

/// Resolve the versions directory for `file_id` within `vault_root` and
/// canonicalize it to ensure the result stays inside the vault.
///
/// Returns `(versions_dir, vault_canonical)` on success.
fn resolve_versions_dir(vault_root: &Path, file_id: &str) -> Result<(PathBuf, PathBuf), String> {
    validate_file_id(file_id)?;

    // Canonicalize the vault root first so we have an absolute baseline.
    let vault_canonical = vault_root
        .canonicalize()
        .map_err(|e| format!("Failed to canonicalize vault root: {}", e))?;

    let versions_dir = vault_canonical
        .join(".bismuth")
        .join("versions")
        .join(file_id);

    Ok((versions_dir, vault_canonical))
}

/// Save a diff between `old_content` and `new_content` as a version entry.
///
/// Creates `.bismuth/versions/{file_id}/` if it does not exist.
/// Writes `{timestamp_ms}-{version}.json` containing metrics, bump type, and summary.
/// Returns the created [`VersionEntry`].
pub fn save_diff(
    vault_root: &Path,
    file_id: &str,
    old_content: &str,
    new_content: &str,
    version: &str,
) -> Result<VersionEntry, String> {
    let (versions_dir, vault_canonical) = resolve_versions_dir(vault_root, file_id)?;

    std::fs::create_dir_all(&versions_dir)
        .map_err(|e| format!("Failed to create versions directory: {}", e))?;

    // After creation, canonicalize and verify it is inside the vault.
    let dir_canonical = versions_dir
        .canonicalize()
        .map_err(|e| format!("Failed to canonicalize versions dir: {}", e))?;
    if !dir_canonical.starts_with(&vault_canonical) {
        tracing::warn!("Versioning: path traversal attempt detected for file_id={:?}", file_id);
        return Err("path traversal detected".to_string());
    }

    let metrics = compute_diff_metrics(old_content, new_content);
    let bump_type = classify_bump(&metrics);
    let summary = build_summary(&metrics, &bump_type);

    let now = chrono::Utc::now();
    let timestamp_ms = now.timestamp_millis();
    let timestamp_iso = now.to_rfc3339();

    let filename = format!("{}-{}.json", timestamp_ms, sanitize_version(version));
    let file_path = dir_canonical.join(&filename);

    // Relative diff_path for portability across machines.
    let diff_path = format!(".bismuth/versions/{}/{}", file_id, filename);

    let entry = VersionEntry {
        version: version.to_string(),
        timestamp: timestamp_iso,
        bump_type,
        summary,
        diff_path,
        metrics,
    };

    let json = serde_json::to_string_pretty(&entry)
        .map_err(|e| format!("Failed to serialize version entry: {}", e))?;
    std::fs::write(&file_path, json)
        .map_err(|e| format!("Failed to write version file: {}", e))?;

    tracing::info!(
        "Versioning: saved version {} for file_id={} at {:?}",
        version,
        file_id,
        file_path
    );

    Ok(entry)
}

/// List stored versions for `file_id`, newest-first, capped at `retention_cap`.
///
/// Filenames sort lexicographically (timestamp prefix ensures temporal order).
/// Returns an empty `Vec` when no versions exist yet.
pub fn list_versions(
    vault_root: &Path,
    file_id: &str,
    retention_cap: usize,
) -> Result<Vec<VersionEntry>, String> {
    let (versions_dir, vault_canonical) = resolve_versions_dir(vault_root, file_id)?;

    if !versions_dir.exists() {
        return Ok(Vec::new());
    }

    // Canonicalize and safety-check the directory.
    let dir_canonical = versions_dir
        .canonicalize()
        .map_err(|e| format!("Failed to canonicalize versions dir: {}", e))?;
    if !dir_canonical.starts_with(&vault_canonical) {
        return Err("path traversal detected".to_string());
    }

    let mut entries: Vec<(String, PathBuf)> = std::fs::read_dir(&dir_canonical)
        .map_err(|e| format!("Failed to read versions directory: {}", e))?
        .filter_map(|r| r.ok())
        .filter_map(|entry| {
            let path = entry.path();
            if path.extension().and_then(|e| e.to_str()) == Some("json") {
                let name = path.file_name()?.to_string_lossy().to_string();
                Some((name, path))
            } else {
                None
            }
        })
        .collect();

    // Sort descending by filename (timestamp prefix gives temporal order).
    entries.sort_by(|a, b| b.0.cmp(&a.0));

    // Apply retention cap.
    entries.truncate(retention_cap);

    let mut version_entries = Vec::with_capacity(entries.len());
    for (_, path) in entries {
        let raw = std::fs::read_to_string(&path)
            .map_err(|e| format!("Failed to read version file {:?}: {}", path, e))?;
        let entry: VersionEntry = serde_json::from_str(&raw)
            .map_err(|e| format!("Failed to parse version file {:?}: {}", path, e))?;
        version_entries.push(entry);
    }

    Ok(version_entries)
}

/// Generate a human-readable one-line summary from metrics.
fn build_summary(metrics: &DiffMetrics, bump_type: &BumpType) -> String {
    let label = match bump_type {
        BumpType::Patch => "Minor edit",
        BumpType::Minor => "Content updated",
        BumpType::Major => "Major revision",
    };
    format!(
        "{}: +{} -{} lines",
        label, metrics.added_lines, metrics.removed_lines
    )
}

/// Sanitize a semver string for use in a filename (replace `.` with `-`).
fn sanitize_version(version: &str) -> String {
    version.replace('.', "-")
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    fn vault() -> TempDir { TempDir::new().unwrap() }

    #[test]
    fn test_save_creates_dir_and_file() {
        let v = vault();
        let entry = save_diff(v.path(), "test-id", "old", "new content added", "0.1.0").unwrap();
        assert!(v.path().join(".bismuth/versions/test-id").exists());
        assert_eq!(entry.version, "0.1.0");
        assert!(entry.diff_path.starts_with(".bismuth/versions/test-id/"));
    }

    #[test]
    fn test_filename_contains_sanitized_version() {
        let v = vault();
        save_diff(v.path(), "my-note", "a", "b", "1.0.0").unwrap();
        let dir = v.path().join(".bismuth/versions/my-note");
        let files: Vec<_> = std::fs::read_dir(&dir).unwrap().filter_map(|e| e.ok()).collect();
        assert_eq!(files.len(), 1);
        let name = files[0].file_name().to_string_lossy().to_string();
        assert!(name.ends_with(".json") && name.contains("-1-0-0.json"), "name={}", name);
    }

    #[test]
    fn test_json_round_trips() {
        let v = vault();
        let entry = save_diff(v.path(), "rt", "hello", "hello world", "0.2.0").unwrap();
        let raw = std::fs::read_to_string(v.path().join(&entry.diff_path)).unwrap();
        let parsed: VersionEntry = serde_json::from_str(&raw).unwrap();
        assert_eq!(parsed.version, "0.2.0");
    }

    #[test]
    fn test_two_saves_produce_two_files() {
        let v = vault();
        save_diff(v.path(), "mv", "v1", "v2 change", "0.1.0").unwrap();
        std::thread::sleep(std::time::Duration::from_millis(2));
        save_diff(v.path(), "mv", "v2 change", "v3 bigger change", "0.2.0").unwrap();
        let files: Vec<_> = std::fs::read_dir(v.path().join(".bismuth/versions/mv"))
            .unwrap().filter_map(|e| e.ok()).collect();
        assert_eq!(files.len(), 2);
    }

    #[test]
    fn test_list_newest_first() {
        let v = vault();
        for (i, ver) in ["0.1.0", "0.2.0", "0.3.0"].iter().enumerate() {
            if i > 0 { std::thread::sleep(std::time::Duration::from_millis(2)); }
            save_diff(v.path(), "ord", "old", "new", ver).unwrap();
        }
        let entries = list_versions(v.path(), "ord", 50).unwrap();
        assert_eq!(entries[0].version, "0.3.0");
        assert_eq!(entries[2].version, "0.1.0");
    }

    #[test]
    fn test_retention_cap_50() {
        let v = vault();
        for i in 0..55u32 {
            let ver = format!("0.{}.0", i);
            save_diff(v.path(), "ret", &format!("old{}", i), &format!("new{}", i), &ver).unwrap();
            std::thread::sleep(std::time::Duration::from_millis(2));
        }
        assert_eq!(list_versions(v.path(), "ret", 50).unwrap().len(), 50);
    }

    #[test]
    fn test_invalid_file_ids_rejected() {
        let v = vault();
        assert_eq!(save_diff(v.path(), "../secrets", "a", "b", "1.0.0").unwrap_err(), "invalid file_id");
        assert_eq!(save_diff(v.path(), "/etc/passwd", "a", "b", "1.0.0").unwrap_err(), "invalid file_id");
        assert_eq!(save_diff(v.path(), "", "a", "b", "1.0.0").unwrap_err(), "invalid file_id");
    }

    #[test]
    fn test_valid_file_id_accepted() {
        let v = vault();
        assert!(save_diff(v.path(), "valid-uuid-4-note-id", "old", "new content", "1.0.0").is_ok());
    }

    #[test]
    fn test_list_empty_when_no_dir() {
        let v = vault();
        assert!(list_versions(v.path(), "nonexistent-id", 50).unwrap().is_empty());
    }
}
