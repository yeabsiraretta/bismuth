//! Plugin management IPC commands (FR-012)
//!
//! Provides plugin discovery, status queries, and enable/disable toggling.
//! Plugins are scanned from the `.bismuth/plugins/` directory.

use crate::services::plugin_service::{LoadedPlugin, PluginService};
use std::sync::Mutex;
use tauri::State;

/// Managed state holding the plugin service.
///
/// Initialized when a vault is opened.
pub struct PluginState {
    pub plugin_service: Mutex<Option<PluginService>>,
}

/// Initializes the plugin service for the given vault root.
///
/// Should be called after a vault is opened. Scans the `plugins/` directory
/// and loads all valid manifests.
///
/// # Arguments
///
/// * `vault_root` — Absolute path to the vault root directory.
#[tauri::command]
pub async fn initialize_plugins(
    state: State<'_, PluginState>,
    vault_root: String,
) -> Result<Vec<LoadedPlugin>, String> {
    let path = std::path::PathBuf::from(&vault_root);
    let service = PluginService::new(&path);
    let plugins = service
        .scan_plugins()
        .map_err(|e| format!("Failed to scan plugins: {}", e))?;
    let mut guard = state.plugin_service.lock().unwrap();
    *guard = Some(service);
    Ok(plugins)
}

/// Returns all loaded plugins with their status.
#[tauri::command]
pub async fn get_plugins(state: State<'_, PluginState>) -> Result<Vec<LoadedPlugin>, String> {
    let guard = state.plugin_service.lock().unwrap();
    let service = guard
        .as_ref()
        .ok_or_else(|| "Plugin service not initialized".to_string())?;

    service
        .scan_plugins()
        .map_err(|e| format!("Failed to scan plugins: {}", e))
}

/// Enables or disables a plugin by ID.
///
/// # Arguments
///
/// * `id` — The plugin identifier from its manifest.
/// * `enabled` — Whether to enable (`true`) or disable (`false`) the plugin.
#[tauri::command]
pub async fn set_plugin_enabled(
    state: State<'_, PluginState>,
    id: String,
    enabled: bool,
) -> Result<(), String> {
    let guard = state.plugin_service.lock().unwrap();
    let service = guard
        .as_ref()
        .ok_or_else(|| "Plugin service not initialized".to_string())?;

    service
        .set_plugin_enabled(&id, enabled)
        .map_err(|e| format!("Failed to update plugin: {}", e))
}
