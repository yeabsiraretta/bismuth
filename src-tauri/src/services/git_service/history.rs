//! File history traversal for git log queries.

use crate::error::{BismuthError, Result};
use super::{GitService, CommitEntry};
use std::path::Path;

impl GitService {
    /// Get commits that touched a specific file.
    pub fn get_file_history(&self, path: &str, limit: usize) -> Result<Vec<CommitEntry>> {
        let repo = self.open_repo()?;
        let mut revwalk = repo.revwalk()
            .map_err(|e| BismuthError::Git(format!("Revwalk failed: {}", e)))?;

        revwalk.push_head()
            .map_err(|e| BismuthError::Git(format!("Push HEAD failed: {}", e)))?;
        revwalk.set_sorting(git2::Sort::TIME)
            .map_err(|e| BismuthError::Git(format!("Sort failed: {}", e)))?;

        let file_path = Path::new(path);
        let mut entries = Vec::new();

        for oid in revwalk.flatten() {
            if entries.len() >= limit {
                break;
            }

            let commit = match repo.find_commit(oid) {
                Ok(c) => c,
                Err(_) => continue,
            };

            let tree = match commit.tree() {
                Ok(t) => t,
                Err(_) => continue,
            };

            // Check if file exists in this commit's tree
            if tree.get_path(file_path).is_err() {
                continue;
            }

            // Check parent to see if file was modified in this commit
            let dominated = if let Ok(parent) = commit.parent(0) {
                if let Ok(parent_tree) = parent.tree() {
                    let diff = repo.diff_tree_to_tree(
                        Some(&parent_tree),
                        Some(&tree),
                        None,
                    );
                    match diff {
                        Ok(d) => {
                            d.deltas().any(|delta| {
                                delta.new_file().path()
                                    .map(|p| p == file_path)
                                    .unwrap_or(false)
                            })
                        }
                        Err(_) => false,
                    }
                } else {
                    true // Initial commit with file
                }
            } else {
                true // First commit, file introduced
            };

            if dominated {
                entries.push(CommitEntry {
                    sha: oid.to_string()[..7].to_string(),
                    message: commit.message().unwrap_or("").trim().to_string(),
                    author: commit.author().name().unwrap_or("Unknown").to_string(),
                    timestamp: commit.time().seconds(),
                });
            }
        }

        Ok(entries)
    }
}
