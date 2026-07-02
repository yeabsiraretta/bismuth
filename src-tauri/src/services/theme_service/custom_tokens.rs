//! Custom token persistence — saves/loads user style overrides to vault.
//!
//! Tokens are stored in `.bismuth/style.json` within the vault root.

use crate::error::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::Path;

/// Persisted style overrides.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct CustomTokens {
    pub tokens: HashMap<String, String>,
}

use crate::config::constants::filesystem::VAULT_DIR_NAME;

const STYLE_FILENAME: &str = "style.json";

/// Computed style file path: `.bismuth/style.json`
fn style_file_path(vault_root: &Path) -> std::path::PathBuf {
    vault_root.join(VAULT_DIR_NAME).join(STYLE_FILENAME)
}

/// Load custom tokens from the vault's `.bismuth/style.json`.
pub fn load_custom_tokens(vault_root: &Path) -> Result<CustomTokens> {
    let path = style_file_path(vault_root);
    if !path.exists() {
        return Ok(CustomTokens::default());
    }
    let content = fs::read_to_string(&path)?;
    let tokens: CustomTokens = serde_json::from_str(&content)?;
    Ok(tokens)
}

/// Save custom tokens to the vault's `.bismuth/style.json`.
pub fn save_custom_tokens(vault_root: &Path, tokens: &CustomTokens) -> Result<()> {
    let path = style_file_path(vault_root);
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    let content = serde_json::to_string_pretty(tokens)?;
    fs::write(&path, content)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_load_missing_file_returns_default() {
        let dir = TempDir::new().unwrap();
        let tokens = load_custom_tokens(dir.path()).unwrap();
        assert!(tokens.tokens.is_empty());
    }

    #[test]
    fn test_save_and_load_roundtrip() {
        let dir = TempDir::new().unwrap();
        let mut tokens = CustomTokens::default();
        tokens.tokens.insert("--accent".to_string(), "#6366f1".to_string());
        tokens.tokens.insert("--bg".to_string(), "#1a1a1a".to_string());

        save_custom_tokens(dir.path(), &tokens).unwrap();
        let loaded = load_custom_tokens(dir.path()).unwrap();

        assert_eq!(loaded.tokens.len(), 2);
        assert_eq!(loaded.tokens["--accent"], "#6366f1");
        assert_eq!(loaded.tokens["--bg"], "#1a1a1a");
    }
}
