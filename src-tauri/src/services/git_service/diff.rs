//! Diff computation for file changes.

use crate::error::{BismuthError, Result};
use super::GitService;
use git2::{DiffOptions, Diff};

/// A unified diff result for a single file.
#[derive(Debug, Clone, serde::Serialize)]
pub struct FileDiff {
    pub path: String,
    pub hunks: Vec<DiffHunk>,
}

/// A single hunk within a diff.
#[derive(Debug, Clone, serde::Serialize)]
pub struct DiffHunk {
    pub header: String,
    pub lines: Vec<DiffLine>,
}

/// A line within a diff hunk.
#[derive(Debug, Clone, serde::Serialize)]
pub struct DiffLine {
    pub origin: char,
    pub content: String,
}

impl GitService {
    /// Get unified diff for a specific file against HEAD.
    pub fn get_diff(&self, path: &str) -> Result<FileDiff> {
        let repo = self.open_repo()?;

        let head_tree = match repo.head() {
            Ok(head) => {
                let commit = head.peel_to_commit()
                    .map_err(|e| BismuthError::Git(format!("Failed to peel HEAD: {}", e)))?;
                Some(commit.tree()
                    .map_err(|e| BismuthError::Git(format!("Failed to get tree: {}", e)))?)
            }
            Err(_) => None,
        };

        let mut opts = DiffOptions::new();
        opts.pathspec(path);

        let diff = repo.diff_tree_to_workdir_with_index(
            head_tree.as_ref(),
            Some(&mut opts),
        ).map_err(|e| BismuthError::Git(format!("Diff failed: {}", e)))?;

        parse_diff(&diff, path)
    }

    /// Get changes for a specific commit SHA.
    pub fn get_commit_diff(&self, sha: &str) -> Result<Vec<FileDiff>> {
        let repo = self.open_repo()?;
        let oid = git2::Oid::from_str(sha)
            .map_err(|e| BismuthError::Git(format!("Invalid SHA: {}", e)))?;
        let commit = repo.find_commit(oid)
            .map_err(|e| BismuthError::Git(format!("Commit not found: {}", e)))?;

        let tree = commit.tree()
            .map_err(|e| BismuthError::Git(format!("No tree: {}", e)))?;

        let parent_tree = commit.parent(0)
            .ok()
            .and_then(|p| p.tree().ok());

        let diff = repo.diff_tree_to_tree(
            parent_tree.as_ref(),
            Some(&tree),
            None,
        ).map_err(|e| BismuthError::Git(format!("Commit diff failed: {}", e)))?;

        let mut results = Vec::new();
        let deltas: Vec<_> = diff.deltas().collect();
        for delta in &deltas {
            let path = delta.new_file().path()
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or_default();
            if let Ok(fd) = parse_diff(&diff, &path) {
                results.push(fd);
            }
        }
        Ok(results)
    }
}

fn parse_diff(diff: &Diff, path: &str) -> Result<FileDiff> {
    let mut hunks = Vec::new();

    diff.print(git2::DiffFormat::Patch, |delta, hunk, line| {
        let file_path = delta.new_file().path()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_default();

        if file_path != path {
            return true;
        }

        if let Some(h) = hunk {
            let header = String::from_utf8_lossy(h.header()).trim().to_string();
            if hunks.last().map(|hk: &DiffHunk| hk.header != header).unwrap_or(true) {
                hunks.push(DiffHunk { header, lines: Vec::new() });
            }
        }

        if let Some(current_hunk) = hunks.last_mut() {
            let content = String::from_utf8_lossy(line.content()).to_string();
            let origin = line.origin();
            current_hunk.lines.push(DiffLine { origin, content });
        }

        true
    }).map_err(|e| BismuthError::Git(format!("Diff print failed: {}", e)))?;

    Ok(FileDiff {
        path: path.to_string(),
        hunks,
    })
}
