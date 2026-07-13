use std::path::{Path, PathBuf};
use std::sync::{Arc, RwLock};

use serde::{Deserialize, Serialize};

use super::error::{AppError, AppResult};

#[derive(Debug, Default, Serialize, Deserialize)]
pub struct ActiveVaultState {
    pub path: Option<String>,
    pub name: Option<String>,
}

#[derive(Debug, Clone)]
pub struct AppState {
    pub vault: Arc<RwLock<ActiveVaultState>>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            vault: Arc::new(RwLock::new(ActiveVaultState::default())),
        }
    }
}

impl AppState {
    /// Get the vault root path, returning an error if no vault is open or the lock is poisoned.
    pub fn vault_root(&self) -> AppResult<PathBuf> {
        let guard = self
            .vault
            .read()
            .map_err(|e| AppError::LockPoisoned(e.to_string()))?;
        guard
            .path
            .as_ref()
            .map(PathBuf::from)
            .ok_or_else(|| AppError::Custom("No vault is open".into()))
    }
}

/// Ensure that the parent directory of a path exists.
pub fn ensure_parent(path: &Path) -> AppResult<()> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    Ok(())
}
