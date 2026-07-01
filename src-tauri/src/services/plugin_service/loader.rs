//! Plugin discovery and manifest loading.
//!
//! Scans the plugins directory, reads and validates `plugin.json` manifests.

use crate::error::{BismuthError, Result};
use std::fs;
use std::path::Path;

use super::mod_types::{LoadedPlugin, PluginManifest, PluginStatus};

/// Scans a plugins directory and loads all valid plugin manifests.
pub fn scan_plugins(plugins_dir: &Path) -> Result<Vec<LoadedPlugin>> {
    let mut plugins = Vec::new();

    if !plugins_dir.exists() {
        return Ok(plugins);
    }

    let entries = fs::read_dir(plugins_dir)?;

    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }

        let manifest_path = path.join("plugin.json");
        if !manifest_path.exists() {
            tracing::warn!(
                "Plugin directory {:?} missing plugin.json, skipping",
                path.file_name().unwrap_or_default()
            );
            plugins.push(make_error_plugin(&path, None));
            continue;
        }

        match load_manifest(&manifest_path) {
            Ok(manifest) => {
                let status = if manifest.enabled {
                    PluginStatus::Active
                } else {
                    PluginStatus::Disabled
                };
                plugins.push(LoadedPlugin {
                    manifest,
                    dir: path.display().to_string(),
                    status,
                });
            }
            Err(e) => {
                tracing::warn!(
                    "Failed to load plugin manifest at {:?}: {}",
                    manifest_path,
                    e
                );
                plugins.push(make_error_plugin(&path, Some(&e.to_string())));
            }
        }
    }

    plugins.sort_by(|a, b| a.manifest.name.cmp(&b.manifest.name));
    Ok(plugins)
}

/// Loads and validates a plugin manifest from a `plugin.json` file.
pub fn load_manifest(path: &Path) -> Result<PluginManifest> {
    let content = fs::read_to_string(path)?;
    let manifest: PluginManifest = serde_json::from_str(&content)
        .map_err(|e| BismuthError::ParseError(format!("Invalid plugin.json: {}", e)))?;

    if manifest.id.is_empty() {
        return Err(BismuthError::ParseError(
            "Plugin manifest missing 'id' field".to_string(),
        ));
    }
    if manifest.name.is_empty() {
        return Err(BismuthError::ParseError(
            "Plugin manifest missing 'name' field".to_string(),
        ));
    }

    Ok(manifest)
}

fn make_error_plugin(path: &Path, description: Option<&str>) -> LoadedPlugin {
    let name = path.file_name().unwrap_or_default().to_string_lossy().to_string();
    LoadedPlugin {
        manifest: PluginManifest {
            id: name.clone(),
            name,
            version: "0.0.0".to_string(),
            description: description.map(|d| format!("Load error: {}", d)).unwrap_or_default(),
            author: String::new(),
            min_app_version: None,
            main: None,
            enabled: false,
        },
        dir: path.display().to_string(),
        status: PluginStatus::Error,
    }
}
