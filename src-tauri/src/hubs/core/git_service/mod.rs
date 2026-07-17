use std::process::Command;

use serde::Serialize;

use crate::infrastructure::error::{AppError, AppResult};
use crate::infrastructure::state::AppState;

#[derive(Debug, Serialize)]
pub(crate) struct GitStatus {
    pub branch: String,
    pub clean: bool,
    pub staged: usize,
    pub modified: usize,
    pub untracked: usize,
}

fn vault_path(state: &AppState) -> AppResult<String> {
    let vault = state
        .vault
        .read()
        .map_err(|e| AppError::LockPoisoned(e.to_string()))?;
    vault
        .path
        .clone()
        .ok_or_else(|| AppError::Custom("No vault is open".into()))
}

fn run_git(cwd: &str, args: &[&str]) -> AppResult<String> {
    let output = Command::new("git")
        .args(args)
        .current_dir(cwd)
        .output()
        .map_err(|e| AppError::Custom(format!("Failed to run git: {e}")))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(AppError::Custom(format!("git error: {stderr}")));
    }
    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

pub(crate) fn git_status(state: &AppState) -> AppResult<GitStatus> {
    let cwd = vault_path(state)?;
    let branch_out = run_git(&cwd, &["rev-parse", "--abbrev-ref", "HEAD"])
        .unwrap_or_else(|_| "unknown".into());
    let status_out = run_git(&cwd, &["status", "--porcelain"])?;

    let mut staged = 0usize;
    let mut modified = 0usize;
    let mut untracked = 0usize;

    for line in status_out.lines() {
        if line.len() < 2 {
            continue;
        }
        let x = line.as_bytes()[0];
        let y = line.as_bytes()[1];
        if x == b'?' {
            untracked += 1;
        } else {
            if x != b' ' && x != b'?' {
                staged += 1;
            }
            if y != b' ' && y != b'?' {
                modified += 1;
            }
        }
    }

    Ok(GitStatus {
        branch: branch_out.trim().to_string(),
        clean: staged == 0 && modified == 0 && untracked == 0,
        staged,
        modified,
        untracked,
    })
}

pub(crate) fn git_stage_all(state: &AppState) -> AppResult<()> {
    let cwd = vault_path(state)?;
    run_git(&cwd, &["add", "-A"])?;
    Ok(())
}

pub(crate) fn git_commit(state: &AppState, message: &str) -> AppResult<()> {
    let cwd = vault_path(state)?;
    run_git(&cwd, &["commit", "-m", message])?;
    Ok(())
}

pub(crate) fn git_push(state: &AppState) -> AppResult<()> {
    let cwd = vault_path(state)?;
    run_git(&cwd, &["push"])?;
    Ok(())
}

pub(crate) fn git_pull(state: &AppState) -> AppResult<()> {
    let cwd = vault_path(state)?;
    run_git(&cwd, &["pull", "--ff-only"])?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::infrastructure::state::{ActiveVaultState, AppState};
    use std::sync::{Arc, RwLock};
    use tempfile::TempDir;

    fn setup_git_vault() -> (TempDir, AppState) {
        let dir = TempDir::new().unwrap();
        let path = dir.path().to_str().unwrap().to_string();

        Command::new("git")
            .args(["init"])
            .current_dir(&path)
            .output()
            .unwrap();
        Command::new("git")
            .args(["config", "user.email", "test@test.com"])
            .current_dir(&path)
            .output()
            .unwrap();
        Command::new("git")
            .args(["config", "user.name", "Test"])
            .current_dir(&path)
            .output()
            .unwrap();

        std::fs::write(dir.path().join("test.md"), "# Hello").unwrap();
        Command::new("git")
            .args(["add", "-A"])
            .current_dir(&path)
            .output()
            .unwrap();
        Command::new("git")
            .args(["commit", "-m", "init"])
            .current_dir(&path)
            .output()
            .unwrap();

        let state = AppState {
            vault: Arc::new(RwLock::new(ActiveVaultState {
                path: Some(path),
                name: Some("test".into()),
            })),
        };
        (dir, state)
    }

    #[test]
    fn test_git_status_clean() {
        let (_dir, state) = setup_git_vault();
        let status = git_status(&state).unwrap();
        assert!(status.clean);
        assert_eq!(status.staged, 0);
        assert_eq!(status.modified, 0);
        assert_eq!(status.untracked, 0);
    }

    #[test]
    fn test_git_status_with_changes() {
        let (dir, state) = setup_git_vault();
        std::fs::write(dir.path().join("new.md"), "new file").unwrap();
        let status = git_status(&state).unwrap();
        assert!(!status.clean);
        assert_eq!(status.untracked, 1);
    }

    #[test]
    fn test_git_stage_and_commit() {
        let (dir, state) = setup_git_vault();
        std::fs::write(dir.path().join("staged.md"), "staged").unwrap();
        git_stage_all(&state).unwrap();
        git_commit(&state, "add staged file").unwrap();
        let status = git_status(&state).unwrap();
        assert!(status.clean);
    }
}
