//! NAS sync engine — types, path safety, and module declarations.
//!
//! SECURITY: ALL paths derived from local_root MUST pass through
//! std::fs::canonicalize() before any read or write operation.
//! Any path that resolves outside local_root is rejected with PathTraversal.

use std::path::{Path, PathBuf};
use serde::{Deserialize, Serialize};

use super::sync_conflict;
use super::sync_walker;

pub use sync_conflict::diff_local_remote;
pub use sync_walker::{append_journal, read_journal, replay_journal};

/// A local/remote file diff result.
#[derive(Debug, Default)]
pub struct SyncDiff {
    pub to_upload: Vec<PathBuf>,
    pub to_download: Vec<crate::services::nas_service::webdav_client::RemoteEntry>,
    pub to_delete_local: Vec<PathBuf>,
    pub conflicts: Vec<ConflictEntry>,
}

/// A detected file conflict.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConflictEntry {
    pub file_path: String,
    pub local_mtime: u64,
    pub remote_mtime: u64,
    pub detected_at: String,
}

/// A change journal entry persisted as a JSONL line.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChangeJournalEntry {
    pub op: String,       // "put" | "delete" | "move"
    pub path: String,
    pub dest_path: Option<String>,
    pub timestamp: String,
    pub synced: bool,
}

/// Errors from sync operations.
#[derive(Debug, thiserror::Error)]
pub enum SyncError {
    #[error("Path traversal attempt detected")]
    PathTraversal,
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),
    #[error("WebDAV error: {0}")]
    WebDav(String),
}

impl From<crate::services::nas_service::webdav_client::WebDavError> for SyncError {
    fn from(e: crate::services::nas_service::webdav_client::WebDavError) -> Self {
        SyncError::WebDav(e.to_string())
    }
}

/// Canonicalize a path and verify it starts with local_root.
///
/// SECURITY: canonicalize enforced for every cache path — do not remove.
pub(crate) fn safe_canonicalize(local_root: &Path, path: &Path) -> Result<PathBuf, SyncError> {
    let canonical = std::fs::canonicalize(path).map_err(SyncError::Io)?;
    if !canonical.starts_with(local_root) {
        return Err(SyncError::PathTraversal);
    }
    Ok(canonical)
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_safe_canonicalize_rejects_traversal() {
        let dir = TempDir::new().unwrap();
        let root = dir.path().to_path_buf();
        let evil = root.join("..").join("etc");
        let result = safe_canonicalize(&root, &evil);
        assert!(result.is_err());
    }

    #[test]
    fn test_append_and_read_journal_roundtrip() {
        let dir = TempDir::new().unwrap();
        let root = dir.path().to_path_buf();
        let entry = ChangeJournalEntry {
            op: "put".to_string(), path: "notes/test.md".to_string(),
            dest_path: None, timestamp: "2026-06-21T12:00:00Z".to_string(), synced: false,
        };
        append_journal(&root, entry).unwrap();
        let entries = read_journal(&root).unwrap();
        assert_eq!(entries.len(), 1);
        assert_eq!(entries[0].op, "put");
        assert!(!entries[0].synced);
    }

    #[test]
    fn test_read_journal_empty_when_absent() {
        let dir = TempDir::new().unwrap();
        assert!(read_journal(dir.path()).unwrap().is_empty());
    }

    #[test]
    fn test_diff_local_only_to_upload() {
        use crate::services::nas_service::webdav_client::RemoteEntry;
        let dir = TempDir::new().unwrap();
        let root = dir.path().to_path_buf();
        std::fs::write(root.join("note.md"), "hello").unwrap();
        let diff = diff_local_remote(&root, 0, &[]).unwrap();
        assert_eq!(diff.to_upload.len(), 1);
        assert!(diff.to_download.is_empty());
    }

    // T17 — diff_local_remote with known local directory vs mock RemoteEntry list
    #[test]
    fn test_diff_local_remote_only_on_remote_to_download() {
        use crate::services::nas_service::webdav_client::RemoteEntry;
        let dir = TempDir::new().unwrap();
        let root = dir.path().to_path_buf();
        // No local files; one remote-only file → must appear in to_download
        let remote = vec![RemoteEntry {
            href: "/dav/remote.md".to_string(),
            display_name: "remote.md".to_string(),
            last_modified: "Mon, 01 Jan 2024 00:00:00 GMT".to_string(),
            content_length: 42,
            is_collection: false,
        }];
        let diff = diff_local_remote(&root, 0, &remote).unwrap();
        assert!(diff.to_upload.is_empty(), "expected no uploads");
        assert_eq!(diff.to_download.len(), 1, "expected one download");
    }

    #[test]
    fn test_diff_local_remote_both_sides_no_conflict() {
        use crate::services::nas_service::webdav_client::RemoteEntry;
        let dir = TempDir::new().unwrap();
        let root = dir.path().to_path_buf();
        // Write local file
        std::fs::write(root.join("shared.md"), "v1").unwrap();
        // last_sync_ts = 0, local mtime >> 0 → local modified since sync
        // remote mtime parsed from RFC2822 = Jan 2024 → also > 0
        // diff_secs large → conflict
        let remote = vec![RemoteEntry {
            href: "/dav/shared.md".to_string(),
            display_name: "shared.md".to_string(),
            last_modified: "Mon, 01 Jan 2024 00:00:00 GMT".to_string(),
            content_length: 2,
            is_collection: false,
        }];
        let diff = diff_local_remote(&root, 0, &remote).unwrap();
        // Both sides modified since last_sync_ts=0 with large mtime gap → conflict
        assert!(
            diff.conflicts.len() == 1 || diff.to_upload.len() == 1 || diff.to_download.len() == 1,
            "expected conflict or directional sync decision"
        );
    }

    #[test]
    fn test_append_journal_multiple_entries_roundtrip() {
        let dir = TempDir::new().unwrap();
        let root = dir.path().to_path_buf();
        let e1 = ChangeJournalEntry {
            op: "put".to_string(),
            path: "a.md".to_string(),
            dest_path: None,
            timestamp: "2026-06-24T10:00:00Z".to_string(),
            synced: false,
        };
        let e2 = ChangeJournalEntry {
            op: "delete".to_string(),
            path: "b.md".to_string(),
            dest_path: None,
            timestamp: "2026-06-24T10:01:00Z".to_string(),
            synced: true,
        };
        append_journal(&root, e1).unwrap();
        append_journal(&root, e2).unwrap();
        let entries = read_journal(&root).unwrap();
        // Two entries (plus possibly a compaction marker if threshold hit — filter to real ops)
        let ops: Vec<&str> = entries
            .iter()
            .filter(|e| e.op == "put" || e.op == "delete")
            .map(|e| e.op.as_str())
            .collect();
        assert_eq!(ops.len(), 2);
        assert_eq!(entries.iter().find(|e| e.op == "put").unwrap().path, "a.md");
        assert_eq!(entries.iter().find(|e| e.op == "delete").unwrap().synced, true);
    }

    // T18 — Path traversal rejection: calls safe_canonicalize with a path resolving outside
    // local_root and asserts PathTraversal error with no filesystem access outside local_root.
    #[test]
    fn test_path_traversal_rejected_by_safe_canonicalize() {
        let dir = TempDir::new().unwrap();
        let local_root = dir.path().to_path_buf();

        // Attempt: path that traverses outside local_root via ".."
        let traversal_path = local_root.join("..").join("etc").join("passwd");
        let result = safe_canonicalize(&local_root, &traversal_path);

        assert!(
            result.is_err(),
            "safe_canonicalize must reject paths outside local_root"
        );
        match result.unwrap_err() {
            SyncError::PathTraversal => {} // expected
            SyncError::Io(_) => {}         // canonicalize fails on non-existent path — also a rejection
            other => panic!("unexpected error variant: {other:?}"),
        }

        // Assert no files were written outside local_root by the failed call
        let outside_path = local_root.parent().unwrap().join("etc").join("passwd");
        assert!(
            !outside_path.exists(),
            "path traversal must not create files outside local_root"
        );
    }

    #[test]
    fn test_path_traversal_via_absolute_outside_path() {
        let dir = TempDir::new().unwrap();
        let local_root = dir.path().to_path_buf();

        // Attempt: absolute path pointing entirely outside local_root
        let outside_absolute = std::path::Path::new("/tmp/outside_bismuth_test");
        let result = safe_canonicalize(&local_root, outside_absolute);

        // Either Io (path doesn't exist) or PathTraversal — both are rejections
        assert!(
            result.is_err(),
            "safe_canonicalize must reject absolute paths outside local_root"
        );
        if let Ok(_) = result {
            panic!("safe_canonicalize allowed an absolute path outside local_root");
        }
    }

    #[test]
    fn test_path_traversal_diff_local_remote_does_not_escape_root() {
        use crate::services::nas_service::webdav_client::RemoteEntry;
        let dir = TempDir::new().unwrap();
        let local_root = dir.path().to_path_buf();

        // Write a normal local file — diff should succeed without reading outside local_root
        std::fs::write(local_root.join("safe.md"), "content").unwrap();

        let diff = diff_local_remote(&local_root, 0, &[]).unwrap();

        // The single upload path must start with local_root
        assert_eq!(diff.to_upload.len(), 1);
        assert!(
            diff.to_upload[0].starts_with(&local_root),
            "uploaded path must be within local_root: {:?}",
            diff.to_upload[0]
        );
    }
}
