//! Plugin lifecycle management — enable, disable, and query individual plugins.

use crate::error::{BismuthError, Result};
use std::fs;
use std::path::PathBuf;

use super::mod_types::LoadedPlugin;
use super::loader;

/// Gets a single plugin by ID from the scanned list.
pub fn get_plugin(plugins_dir: &std::path::Path, id: &str) -> Result<Option<LoadedPlugin>> {
    let plugins = loader::scan_plugins(plugins_dir)?;
    Ok(plugins.into_iter().find(|p| p.manifest.id == id))
}

/// Enables or disables a plugin by rewriting its manifest's `enabled` field.
pub fn set_plugin_enabled(plugins_dir: &std::path::Path, id: &str, enabled: bool) -> Result<()> {
    let plugins = loader::scan_plugins(plugins_dir)?;
    let plugin = plugins
        .iter()
        .find(|p| p.manifest.id == id)
        .ok_or_else(|| BismuthError::NotFound(format!("Plugin '{}' not found", id)))?;

    let manifest_path = PathBuf::from(&plugin.dir).join("plugin.json");
    let mut manifest = loader::load_manifest(&manifest_path)?;
    manifest.enabled = enabled;

    let json = serde_json::to_string_pretty(&manifest)?;
    fs::write(&manifest_path, json)?;

    Ok(())
}
