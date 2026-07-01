//! Embedding pipeline helpers — configuration management and exclusion filtering.
//!
//! Contains the exclusion logic and glob matching used by `EmbeddingService`.

use crate::error::{BismuthError, Result};
use super::{EmbeddingConfig};
use std::path::Path;

/// Loads embedding configuration from `.bismuth/embedding-config.json`.
/// Returns default config if the file does not exist or cannot be parsed.
pub(super) fn load_config(vault_root: &Path) -> EmbeddingConfig {
    use crate::config::constants::filesystem::VAULT_DIR_NAME;
    let config_path = vault_root.join(VAULT_DIR_NAME).join("embedding-config.json");
    if let Ok(content) = std::fs::read_to_string(&config_path) {
        if let Ok(config) = serde_json::from_str::<EmbeddingConfig>(&content) {
            return config;
        }
    }
    EmbeddingConfig::default()
}

/// Persists an embedding configuration to `.bismuth/embedding-config.json`.
pub(super) fn save_config(vault_root: &Path, config: &EmbeddingConfig) -> Result<()> {
    use crate::config::constants::filesystem::VAULT_DIR_NAME;
    let config_path = vault_root.join(VAULT_DIR_NAME).join("embedding-config.json");
    let content = serde_json::to_string_pretty(config)
        .map_err(|e| BismuthError::Generic(e.to_string()))?;
    std::fs::write(&config_path, content)?;
    Ok(())
}

/// Returns `true` if a note should be excluded from embedding.
pub(super) fn is_excluded(config: &EmbeddingConfig, path: &str, tags: &[String]) -> bool {
    for pattern in &config.excluded_paths {
        if path.contains(pattern) || glob_match(pattern, path) {
            return true;
        }
    }
    for tag in tags {
        if config.excluded_tags.contains(tag) {
            return true;
        }
    }
    false
}

/// Simple glob matching (supports `*` and `**` patterns).
pub(super) fn glob_match(pattern: &str, path: &str) -> bool {
    if pattern.contains("**") {
        let parts: Vec<&str> = pattern.split("**").collect();
        if parts.len() == 2 {
            return path.starts_with(parts[0]) && path.ends_with(parts[1]);
        }
    }
    if pattern.starts_with('*') {
        return path.ends_with(&pattern[1..]);
    }
    if pattern.ends_with('*') {
        return path.starts_with(&pattern[..pattern.len() - 1]);
    }
    path == pattern
}
