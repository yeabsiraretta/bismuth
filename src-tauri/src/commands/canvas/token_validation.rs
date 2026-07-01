//! Token collection type definitions and validation helpers (SC-01, SC-06).
//!
//! Pure functions for path sanitization and payload limit enforcement,
//! plus the core data types. Used by the IPC command handlers in `token.rs`.

use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

/// Maximum tokens per collection (SC-06).
pub(super) const MAX_TOKENS_PER_COLLECTION: usize = 1000;
/// Maximum modes per collection (SC-06).
pub(super) const MAX_MODES_PER_COLLECTION: usize = 10;
/// Maximum file size in bytes (SC-06).
pub(super) const MAX_COLLECTION_FILE_SIZE: usize = 50 * 1024;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenCollection {
    pub id: String,
    pub name: String,
    pub modes: Vec<TokenMode>,
    pub tokens: Vec<DesignToken>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenMode {
    pub id: String,
    pub name: String,
    #[serde(rename = "isDefault")]
    pub is_default: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DesignToken {
    pub id: String,
    pub name: String,
    #[serde(rename = "collectionId")]
    pub collection_id: String,
    #[serde(rename = "type")]
    pub token_type: String,
    pub values: serde_json::Value,
    pub description: Option<String>,
    #[serde(rename = "aliasOf")]
    pub alias_of: Option<String>,
}

/// Sanitizes a filename to prevent path traversal (SC-01).
pub(super) fn sanitize_filename(name: &str) -> String {
    name.chars()
        .filter(|c| c.is_alphanumeric() || *c == '-' || *c == '_' || *c == ' ')
        .collect::<String>()
        .trim()
        .to_string()
}

/// Returns the tokens directory path within the vault.
pub(super) fn tokens_dir(vault_path: &Path) -> PathBuf {
    use crate::config::constants::filesystem::VAULT_DIR_NAME;
    vault_path.join(VAULT_DIR_NAME).join("tokens")
}

/// Validates payload size limits on a `TokenCollection` (SC-06).
///
/// Returns `Err` with a descriptive message if any limit is exceeded.
pub(super) fn validate_collection_limits(collection: &TokenCollection) -> Result<(), String> {
    if collection.tokens.len() > MAX_TOKENS_PER_COLLECTION {
        return Err(format!(
            "Token collection exceeds limit: {} tokens (max {})",
            collection.tokens.len(),
            MAX_TOKENS_PER_COLLECTION
        ));
    }
    if collection.modes.len() > MAX_MODES_PER_COLLECTION {
        return Err(format!(
            "Token collection exceeds mode limit: {} modes (max {})",
            collection.modes.len(),
            MAX_MODES_PER_COLLECTION
        ));
    }
    Ok(())
}

/// Validates a token collection file path is within the expected directory (SC-01).
///
/// Returns `Err` with a message if the path escapes the tokens directory.
pub(super) fn validate_path_within_dir(file_path: &Path, dir: &Path) -> Result<(), String> {
    let canonical_dir = dir.canonicalize().unwrap_or_else(|_| dir.to_path_buf());
    if !file_path.starts_with(&canonical_dir) && !file_path.starts_with(dir) {
        tracing::error!("Path traversal attempt blocked");
        return Err("Invalid file path".to_string());
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sanitize_filename_normal() {
        assert_eq!(sanitize_filename("My Collection"), "My Collection");
        assert_eq!(sanitize_filename("colors-v2"), "colors-v2");
        assert_eq!(sanitize_filename("tokens_main"), "tokens_main");
    }

    #[test]
    fn test_sanitize_filename_path_traversal_sc01() {
        assert_eq!(sanitize_filename("../../../etc/passwd"), "etcpasswd");
        assert_eq!(sanitize_filename(".."), "");
        assert_eq!(sanitize_filename("./foo/../bar"), "foobar");
        assert_eq!(sanitize_filename("foo/bar"), "foobar");
        assert_eq!(sanitize_filename("foo\\bar"), "foobar");
    }

    #[test]
    fn test_sanitize_filename_special_chars() {
        assert_eq!(sanitize_filename("<script>alert(1)</script>"), "scriptalert1script");
        assert_eq!(sanitize_filename(""), "");
        assert_eq!(sanitize_filename("   "), "");
    }

    #[test]
    fn test_tokens_dir_path() {
        let vault = Path::new("/tmp/test-vault");
        let dir = tokens_dir(vault);
        assert_eq!(dir, PathBuf::from("/tmp/test-vault/.bismuth/tokens"));
    }

    #[test]
    fn test_payload_size_limit_tokens_sc06() {
        let mut tokens = Vec::new();
        for i in 0..=MAX_TOKENS_PER_COLLECTION {
            tokens.push(DesignToken {
                id: format!("tok-{}", i),
                name: format!("Token {}", i),
                collection_id: "col-1".to_string(),
                token_type: "color".to_string(),
                values: serde_json::json!({}),
                description: None,
                alias_of: None,
            });
        }
        let collection = TokenCollection {
            id: "col-1".to_string(),
            name: "Test".to_string(),
            modes: vec![],
            tokens,
        };
        assert!(validate_collection_limits(&collection).is_err());
    }

    #[test]
    fn test_payload_size_limit_modes_sc06() {
        let mut modes = Vec::new();
        for i in 0..=MAX_MODES_PER_COLLECTION {
            modes.push(TokenMode {
                id: format!("mode-{}", i),
                name: format!("Mode {}", i),
                is_default: i == 0,
            });
        }
        let collection = TokenCollection {
            id: "col-1".to_string(),
            name: "Test".to_string(),
            modes,
            tokens: vec![],
        };
        assert!(validate_collection_limits(&collection).is_err());
    }
}

