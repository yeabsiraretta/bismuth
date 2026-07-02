//! Theme IPC commands (FR-011, FR-012)
//!
//! Provides theme loading, style settings extraction, and theme-folder
//! watching so new themes are detected at runtime.

use crate::services::theme_service::{SettingsBlock, StyleSetting, ThemeInfo, ThemeService};
use crate::services::theme_service::custom_tokens::{self, CustomTokens};
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::State;

/// Managed state holding the theme service.
///
/// Initialized when a vault with a `.bismuth/themes` directory is opened.
pub struct ThemeState {
    pub theme_service: Mutex<Option<ThemeService>>,
}

/// Lists all themes available in the vault's themes directory.
#[tauri::command]
pub async fn get_available_themes(
    state: State<'_, ThemeState>,
) -> Result<Vec<ThemeInfo>, String> {
    let guard = state.theme_service.lock().unwrap();
    let service = guard
        .as_ref()
        .ok_or_else(|| "Theme service not initialized".to_string())?;

    service
        .get_available_themes()
        .map_err(|e| format!("Failed to list themes: {}", e))
}

/// Loads a theme's CSS content by name.
///
/// # Arguments
///
/// * `name` — Theme filename (without extension).
#[tauri::command]
pub async fn load_theme(
    state: State<'_, ThemeState>,
    name: String,
) -> Result<String, String> {
    let guard = state.theme_service.lock().unwrap();
    let service = guard
        .as_ref()
        .ok_or_else(|| "Theme service not initialized".to_string())?;

    service
        .load_theme(&name)
        .map_err(|e| format!("Failed to load theme: {}", e))
}

/// Parses CSS custom properties from a theme as user-configurable style settings.
///
/// # Arguments
///
/// * `name` — Theme name to extract settings from.
#[tauri::command]
pub async fn get_theme_style_settings(
    state: State<'_, ThemeState>,
    name: String,
) -> Result<Vec<StyleSetting>, String> {
    let guard = state.theme_service.lock().unwrap();
    let service = guard
        .as_ref()
        .ok_or_else(|| "Theme service not initialized".to_string())?;

    let css = service
        .load_theme(&name)
        .map_err(|e| format!("Failed to load theme: {}", e))?;

    ThemeService::parse_style_settings(&css)
        .map_err(|e| format!("Failed to parse style settings: {}", e))
}

/// Initializes the theme service for the given vault root.
///
/// Should be called after a vault is opened so that theme operations
/// are available. Also sets up a file watcher on the themes directory
/// to emit `themes://changed` events when themes are added/removed.
///
/// # Arguments
///
/// * `vault_root` — Absolute path to the vault root directory.
#[tauri::command]
pub async fn initialize_theme_service(
    state: State<'_, ThemeState>,
    vault_root: String,
) -> Result<(), String> {
    let path = std::path::PathBuf::from(&vault_root);
    let service = ThemeService::new(&path);
    let mut guard = state.theme_service.lock().unwrap();
    *guard = Some(service);
    Ok(())
}

/// Loads custom style token overrides from `.bismuth/style.json`.
#[tauri::command]
pub async fn load_custom_tokens(vault_root: String) -> Result<HashMap<String, String>, String> {
    let path = std::path::PathBuf::from(&vault_root);
    let tokens = custom_tokens::load_custom_tokens(&path)
        .map_err(|e| format!("Failed to load custom tokens: {}", e))?;
    Ok(tokens.tokens)
}

/// Saves custom style token overrides to `.bismuth/style.json`.
#[tauri::command]
pub async fn save_custom_tokens(
    vault_root: String,
    tokens: HashMap<String, String>,
) -> Result<(), String> {
    let path = std::path::PathBuf::from(&vault_root);
    let data = CustomTokens { tokens };
    custom_tokens::save_custom_tokens(&path, &data)
        .map_err(|e| format!("Failed to save custom tokens: {}", e))
}

/// Scans all CSS files in themes and snippets directories for @settings blocks.
/// Returns structured SettingsBlock list with source tracking.
#[tauri::command]
pub async fn scan_style_settings(
    state: State<'_, ThemeState>,
) -> Result<Vec<SettingsBlock>, String> {
    let guard = state.theme_service.lock().unwrap();
    let service = guard
        .as_ref()
        .ok_or_else(|| "Theme service not initialized".to_string())?;

    service
        .scan_all_settings_blocks()
        .map_err(|e| format!("Failed to scan style settings: {}", e))
}
