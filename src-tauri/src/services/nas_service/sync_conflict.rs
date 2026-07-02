//! NAS sync conflict detection and diff logic.
//!
//! Computes the diff between a local cache directory and a set of remote
//! PROPFIND entries, categorising files as upload, download, or conflict.

use super::sync::{ConflictEntry, SyncDiff, SyncError};
use std::path::Path;

/// 30-second tolerance window for conflict detection.
const CONFLICT_THRESHOLD_SECS: u64 = 30;

/// Diff local cache directory against remote PROPFIND entries.
///
/// - `to_upload`: files locally present but absent remotely, or locally newer (>30s diff)
/// - `to_download`: files remotely present but absent locally, or remotely newer (>30s diff)
/// - `conflicts`: files modified on both sides with mtime diff >30s
pub fn diff_local_remote(
    local_root: &Path,
    last_sync_ts: u64,
    remote_entries: &[crate::services::nas_service::webdav_client::RemoteEntry],
) -> Result<SyncDiff, SyncError> {
    use std::collections::HashMap;

    let mut diff = SyncDiff::default();

    // Build remote map: filename → RemoteEntry
    let remote_map: HashMap<String, &crate::services::nas_service::webdav_client::RemoteEntry> =
        remote_entries
            .iter()
            .map(|e| {
                let name = e.href.trim_end_matches('/').rsplit('/').next().unwrap_or("").to_string();
                (name, e)
            })
            .collect();

    // Walk local cache
    if local_root.exists() {
        for entry in std::fs::read_dir(local_root)? {
            let entry = entry?;
            let path = entry.path();

            // SECURITY: canonicalize enforced for every cache path — do not remove.
            let canonical = match std::fs::canonicalize(&path) {
                Ok(p) if p.starts_with(local_root) => p,
                Ok(_) => return Err(SyncError::PathTraversal),
                Err(e) => return Err(SyncError::Io(e)),
            };

            if canonical.is_dir() { continue; }

            let filename = canonical
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("")
                .to_string();

            let local_mtime = canonical
                .metadata()
                .and_then(|m| m.modified())
                .ok()
                .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                .map(|d| d.as_secs())
                .unwrap_or(0);

            if let Some(remote) = remote_map.get(&filename) {
                // File exists on both sides — check for conflict
                let remote_mtime = parse_http_date(&remote.last_modified);
                let local_modified_since_sync = local_mtime > last_sync_ts;
                let remote_modified_since_sync = remote_mtime > last_sync_ts;

                if local_modified_since_sync && remote_modified_since_sync {
                    let diff_secs = if local_mtime > remote_mtime {
                        local_mtime - remote_mtime
                    } else {
                        remote_mtime - local_mtime
                    };

                    if diff_secs > CONFLICT_THRESHOLD_SECS {
                        diff.conflicts.push(ConflictEntry {
                            file_path: filename,
                            local_mtime,
                            remote_mtime,
                            detected_at: chrono::Utc::now().to_rfc3339(),
                        });
                    } else {
                        // Within 30 seconds: last-write-wins silently
                        if remote_mtime > local_mtime {
                            diff.to_download.push((*remote).clone());
                        } else {
                            diff.to_upload.push(canonical);
                        }
                    }
                } else if local_modified_since_sync {
                    diff.to_upload.push(canonical);
                } else if remote_modified_since_sync {
                    diff.to_download.push((*remote).clone());
                }
            } else {
                // Only on local — upload
                diff.to_upload.push(canonical);
            }
        }
    }

    // Files only on remote (not in local) — download
    let local_files: std::collections::HashSet<String> = if local_root.exists() {
        std::fs::read_dir(local_root)?
            .filter_map(|e| e.ok())
            .filter_map(|e| e.file_name().into_string().ok())
            .collect()
    } else {
        std::collections::HashSet::new()
    };

    for entry in remote_entries {
        if entry.is_collection { continue; }
        let name = entry.href.trim_end_matches('/').rsplit('/').next().unwrap_or("").to_string();
        if !local_files.contains(&name) {
            diff.to_download.push(entry.clone());
        }
    }

    Ok(diff)
}

/// Parse an HTTP-date string to a Unix timestamp (seconds). Returns 0 on failure.
pub(super) fn parse_http_date(date_str: &str) -> u64 {
    if let Ok(dt) = chrono::DateTime::parse_from_rfc2822(date_str) {
        return dt.timestamp().max(0) as u64;
    }
    0
}
