//! Debounced auto-commit and staging logic.

use crate::error::Result;
use super::GitService;
use std::time::{Duration, Instant};
use std::sync::Mutex;

/// Auto-commit configuration.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct AutoCommitConfig {
    pub enabled: bool,
    pub debounce_secs: u64,
    pub auto_push: bool,
}

impl Default for AutoCommitConfig {
    fn default() -> Self {
        Self {
            enabled: false,
            debounce_secs: 60,
            auto_push: false,
        }
    }
}

/// Tracks last commit time for debouncing.
pub struct AutoCommitState {
    pub last_commit: Mutex<Option<Instant>>,
    pub config: Mutex<AutoCommitConfig>,
}

impl AutoCommitState {
    pub fn new() -> Self {
        Self {
            last_commit: Mutex::new(None),
            config: Mutex::new(AutoCommitConfig::default()),
        }
    }

    /// Check if enough time has passed since last auto-commit.
    pub fn should_commit(&self) -> bool {
        let config = self.config.lock().unwrap();
        if !config.enabled {
            return false;
        }
        let last = self.last_commit.lock().unwrap();
        match *last {
            None => true,
            Some(t) => t.elapsed() >= Duration::from_secs(config.debounce_secs),
        }
    }

    /// Record that a commit just happened.
    pub fn mark_committed(&self) {
        let mut last = self.last_commit.lock().unwrap();
        *last = Some(Instant::now());
    }
}

impl GitService {
    /// Stage all modified vault files and commit with a timestamp message.
    pub fn auto_commit(&self) -> Result<Option<String>> {
        let status = self.git_status()?;
        if status.is_empty() {
            return Ok(None);
        }

        // Stage all modified/new files
        let paths: Vec<String> = status.iter().map(|f| f.path.clone()).collect();
        self.git_add(&paths)?;

        let timestamp = chrono::Local::now().format("%Y-%m-%d %H:%M:%S");
        let message = format!("Auto-commit: {}", timestamp);
        let sha = self.git_commit(&message)?;
        Ok(Some(sha))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_auto_commit_config_default() {
        let config = AutoCommitConfig::default();
        assert!(!config.enabled);
        assert_eq!(config.debounce_secs, 60);
        assert!(!config.auto_push);
    }

    #[test]
    fn test_auto_commit_state_should_commit() {
        let state = AutoCommitState::new();
        // Config disabled by default
        assert!(!state.should_commit());
        // Enable it
        {
            let mut config = state.config.lock().unwrap();
            config.enabled = true;
            config.debounce_secs = 0;
        }
        assert!(state.should_commit());
        state.mark_committed();
        // Immediately after commit with 0 debounce, should still commit
        assert!(state.should_commit());
    }
}
