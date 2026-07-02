//! Git service for vault version control.
//!
//! Provides repository management, status queries, commit operations,
//! and branch navigation. Uses `git2` crate for all git operations.

pub mod commit;
pub mod credentials;
pub mod diff;
pub mod history;
pub mod submodule;
pub mod sync;

use crate::error::{BismuthError, Result};
use git2::{Repository, StatusOptions, Signature};
use std::path::{Path, PathBuf};

/// Represents a file's git status.
#[derive(Debug, Clone, serde::Serialize)]
pub struct FileStatus {
    pub path: String,
    pub status: String,
}

/// A single commit entry.
#[derive(Debug, Clone, serde::Serialize)]
pub struct CommitEntry {
    pub sha: String,
    pub message: String,
    pub author: String,
    pub timestamp: i64,
}

/// Core git service bound to a vault root.
pub struct GitService {
    vault_root: PathBuf,
}

impl GitService {
    /// Create a new GitService for the given vault root.
    pub fn new(vault_root: &Path) -> Self {
        Self {
            vault_root: vault_root.to_path_buf(),
        }
    }

    /// Open the repository at vault root.
    fn open_repo(&self) -> Result<Repository> {
        Repository::open(&self.vault_root)
            .map_err(|e| BismuthError::Git(format!("Failed to open repository: {}", e)))
    }

    /// Get the current branch name.
    pub fn current_branch(&self) -> Result<String> {
        let repo = self.open_repo()?;
        let head = repo.head()
            .map_err(|e| BismuthError::Git(format!("Failed to get HEAD: {}", e)))?;
        let name = head.shorthand().unwrap_or("HEAD").to_string();
        Ok(name)
    }

    /// List all local branch names.
    pub fn list_branches(&self) -> Result<Vec<String>> {
        let repo = self.open_repo()?;
        let branches = repo.branches(Some(git2::BranchType::Local))
            .map_err(|e| BismuthError::Git(format!("Failed to list branches: {}", e)))?;

        let mut names = Vec::new();
        for branch in branches.flatten() {
            if let Ok(Some(name)) = branch.0.name() {
                names.push(name.to_string());
            }
        }
        Ok(names)
    }

    /// Get status of modified/staged/untracked files.
    pub fn git_status(&self) -> Result<Vec<FileStatus>> {
        let repo = self.open_repo()?;
        let mut opts = StatusOptions::new();
        opts.include_untracked(true)
            .recurse_untracked_dirs(true);

        let statuses = repo.statuses(Some(&mut opts))
            .map_err(|e| BismuthError::Git(format!("Failed to get status: {}", e)))?;

        let mut results = Vec::new();
        for entry in statuses.iter() {
            let path = entry.path().unwrap_or("").to_string();
            let status = format_status(entry.status());
            if !status.is_empty() {
                results.push(FileStatus { path, status });
            }
        }
        Ok(results)
    }

    /// Stage files by relative path.
    pub fn git_add(&self, paths: &[String]) -> Result<()> {
        let repo = self.open_repo()?;
        let mut index = repo.index()
            .map_err(|e| BismuthError::Git(format!("Failed to get index: {}", e)))?;

        for p in paths {
            index.add_path(Path::new(p))
                .map_err(|e| BismuthError::Git(format!("Failed to add '{}': {}", p, e)))?;
        }
        index.write()
            .map_err(|e| BismuthError::Git(format!("Failed to write index: {}", e)))?;
        Ok(())
    }

    /// Create a commit with the current index state.
    pub fn git_commit(&self, message: &str) -> Result<String> {
        let repo = self.open_repo()?;
        let sig = repo.signature()
            .or_else(|_| Signature::now("Bismuth", "bismuth@local"))
            .map_err(|e| BismuthError::Git(format!("Failed to create signature: {}", e)))?;

        let mut index = repo.index()
            .map_err(|e| BismuthError::Git(format!("Failed to get index: {}", e)))?;
        let tree_oid = index.write_tree()
            .map_err(|e| BismuthError::Git(format!("Failed to write tree: {}", e)))?;
        let tree = repo.find_tree(tree_oid)
            .map_err(|e| BismuthError::Git(format!("Failed to find tree: {}", e)))?;

        let parent = match repo.head() {
            Ok(head) => {
                let commit = head.peel_to_commit()
                    .map_err(|e| BismuthError::Git(format!("Failed to peel HEAD: {}", e)))?;
                Some(commit)
            }
            Err(_) => None,
        };

        let parents: Vec<&git2::Commit> = parent.iter().collect();
        let oid = repo.commit(Some("HEAD"), &sig, &sig, message, &tree, &parents)
            .map_err(|e| BismuthError::Git(format!("Failed to commit: {}", e)))?;

        Ok(oid.to_string())
    }

    /// Get recent commit log.
    pub fn git_log(&self, limit: usize) -> Result<Vec<CommitEntry>> {
        let repo = self.open_repo()?;
        let mut revwalk = repo.revwalk()
            .map_err(|e| BismuthError::Git(format!("Failed to create revwalk: {}", e)))?;

        revwalk.push_head()
            .map_err(|e| BismuthError::Git(format!("Failed to push HEAD: {}", e)))?;

        let mut entries = Vec::new();
        for (i, oid) in revwalk.flatten().enumerate() {
            if i >= limit {
                break;
            }
            if let Ok(commit) = repo.find_commit(oid) {
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

fn format_status(status: git2::Status) -> String {
    if status.is_index_new() || status.is_wt_new() {
        "new".to_string()
    } else if status.is_index_modified() || status.is_wt_modified() {
        "modified".to_string()
    } else if status.is_index_deleted() || status.is_wt_deleted() {
        "deleted".to_string()
    } else if status.is_index_renamed() || status.is_wt_renamed() {
        "renamed".to_string()
    } else if status.is_conflicted() {
        "conflicted".to_string()
    } else {
        String::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    fn setup_git_vault() -> (TempDir, GitService) {
        let dir = TempDir::new().unwrap();
        Repository::init(dir.path()).unwrap();
        let service = GitService::new(dir.path());
        (dir, service)
    }

    #[test]
    fn test_current_branch_empty_repo() {
        let (dir, _service) = setup_git_vault();
        // Empty repo has no HEAD yet so current_branch will error
        let service = GitService::new(dir.path());
        assert!(service.current_branch().is_err());
    }

    #[test]
    fn test_git_status_empty_repo() {
        let (_dir, service) = setup_git_vault();
        let status = service.git_status().unwrap();
        assert!(status.is_empty());
    }

    #[test]
    fn test_add_and_commit() {
        let (dir, service) = setup_git_vault();
        std::fs::write(dir.path().join("test.md"), "# Hello").unwrap();

        let status = service.git_status().unwrap();
        assert_eq!(status.len(), 1);
        assert_eq!(status[0].status, "new");

        service.git_add(&["test.md".to_string()]).unwrap();
        let sha = service.git_commit("Initial commit").unwrap();
        assert!(!sha.is_empty());

        let log = service.git_log(10).unwrap();
        assert_eq!(log.len(), 1);
        assert_eq!(log[0].message, "Initial commit");
    }
}
