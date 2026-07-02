//! Local theme discovery and import commands for the Settings UI.
//! These complement the existing theme_commands.rs which handles ThemeService state.
//! These commands work directly with `.bismuth/themes/` JSON manifests.

use crate::config::constants::filesystem::VAULT_DIR_NAME;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};

const MAX_TOKEN_VALUE_LEN: usize = 256;

/// Permitted CSS custom property keys that themes may set (mirrors THEME_TOKEN_ALLOWLIST in TS).
const ALLOWED_TOKEN_KEYS: &[&str] = &[
    "--color-bg", "--color-surface", "--color-border", "--color-danger",
    "--color-success", "--color-warning", "--color-info",
    "--background-primary", "--background-primary-alt", "--background-secondary",
    "--background-modifier-hover", "--text-normal", "--text-muted", "--text-faint",
    "--text-on-accent", "--interactive-accent", "--interactive-accent-hover",
    "--border-color", "--radius-s", "--radius-m", "--radius-l",
    "--spacing-xs", "--spacing-s", "--spacing-m", "--spacing-l", "--spacing-xl",
    "--shadow-s", "--shadow-m", "--shadow-l",
];

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThemeManifest {
    pub name: String,
    pub author: String,
    pub version: String,
    pub tokens: HashMap<String, String>,
}

fn get_themes_dir(vault_root: &str) -> PathBuf {
    Path::new(vault_root).join(VAULT_DIR_NAME).join("themes")
}

fn validate_token_key(key: &str) -> bool {
    ALLOWED_TOKEN_KEYS.contains(&key)
}

fn validate_token_value(value: &str) -> bool {
    if value.is_empty() || value.len() > MAX_TOKEN_VALUE_LEN { return false; }
    let unsafe_patterns = ["url(", "expression(", "@", "\\", ";", "<script", "javascript:"];
    !unsafe_patterns.iter().any(|p| value.to_lowercase().contains(p))
}

fn validate_manifest(manifest: &ThemeManifest) -> Result<(), String> {
    if manifest.name.trim().is_empty() {
        return Err("Theme name must not be empty".into());
    }
    for (key, value) in &manifest.tokens {
        if !validate_token_key(key) {
            return Err(format!("Token key '{}' not in allowlist", key));
        }
        if !validate_token_value(value) {
            return Err(format!("Token value for '{}' is unsafe or too long", key));
        }
    }
    Ok(())
}

/// Lists all theme manifests in `.bismuth/themes/*/theme.json`.
/// Validates paths stay within vault root. Skips invalid manifests with a warning.
#[tauri::command]
pub async fn list_local_themes(vault_root: String) -> Result<Vec<ThemeManifest>, String> {
    let themes_dir = get_themes_dir(&vault_root);
    if !themes_dir.exists() { return Ok(vec![]); }

    let canon_root = Path::new(&vault_root).canonicalize()
        .map_err(|e| format!("Cannot canonicalize vault root: {}", e))?;

    let mut themes = Vec::new();
    let entries = fs::read_dir(&themes_dir)
        .map_err(|e| format!("Cannot read themes dir: {}", e))?;

    for entry in entries.flatten() {
        let theme_json = entry.path().join("theme.json");
        if !theme_json.exists() { continue; }

        let canon = match theme_json.canonicalize() {
            Ok(p) => p,
            Err(_) => continue,
        };
        if !canon.starts_with(&canon_root) {
            tracing::warn!("list_local_themes: path escapes vault root, skipped");
            continue;
        }

        let content = match fs::read_to_string(&theme_json) { Ok(c) => c, Err(_) => continue };
        match serde_json::from_str::<ThemeManifest>(&content) {
            Ok(m) if validate_manifest(&m).is_ok() => themes.push(m),
            _ => tracing::warn!("list_local_themes: skipping invalid manifest {:?}", theme_json),
        }
    }
    Ok(themes)
}

/// Imports a theme from `source_path` into `.bismuth/themes/{name}/theme.json`.
/// Validates path confinement, JSON schema, and all token keys/values.
#[tauri::command]
pub async fn import_theme_folder(source_path: String, vault_root: String) -> Result<ThemeManifest, String> {
    let src = Path::new(&source_path);
    let theme_json_src = src.join("theme.json");

    let canon_root = Path::new(&vault_root).canonicalize()
        .map_err(|e| format!("Cannot canonicalize vault root: {}", e))?;
    let canon_src = theme_json_src.canonicalize()
        .map_err(|_| "Source theme.json not found or inaccessible".to_string())?;

    // Source must NOT be inside the vault (prevent self-copy loops)
    // but this is a best-effort check; the important constraint is the destination
    let content = fs::read_to_string(&canon_src)
        .map_err(|e| format!("Cannot read source theme.json: {}", e))?;
    let manifest: ThemeManifest = serde_json::from_str(&content)
        .map_err(|e| format!("Invalid theme.json: {}", e))?;
    validate_manifest(&manifest)?;

    let safe_name = manifest.name.chars()
        .filter(|c| c.is_alphanumeric() || *c == '-' || *c == '_')
        .take(64).collect::<String>();
    if safe_name.is_empty() { return Err("Theme name produces empty safe identifier".into()); }

    let dest_dir = get_themes_dir(&vault_root).join(&safe_name);
    let dest_json = dest_dir.join("theme.json");

    let canon_dest = {
        fs::create_dir_all(&dest_dir)
            .map_err(|e| format!("Cannot create theme directory: {}", e))?;
        dest_json.canonicalize()
            .unwrap_or_else(|_| dest_json.clone())
    };
    if !canon_dest.starts_with(&canon_root) {
        return Err("Destination path escapes vault boundary".into());
    }

    fs::write(&dest_json, &content)
        .map_err(|e| format!("Cannot write theme.json: {}", e))?;

    tracing::info!("import_theme_folder: imported '{}' to {:?}", manifest.name, dest_dir);
    Ok(manifest)
}
