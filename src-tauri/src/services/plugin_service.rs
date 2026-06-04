//! Plugin loader service (FR-012)
//!
//! Scans the `plugins/` directory on vault open, loads and validates
//! `plugin.json` manifests, and provides metadata to the frontend for
//! dynamic component injection. Invalid or erroring plugins are skipped
//! with a warning log.

use crate::error::{BismuthError, Result};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

/// Plugin manifest read from `plugin.json` in each plugin directory.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginManifest {
    /// Unique plugin identifier (e.g., "com.example.my-plugin").
    pub id: String,
    /// Human-readable display name.
    pub name: String,
    /// Semantic version string.
    pub version: String,
    /// Short description of what the plugin does.
    #[serde(default)]
    pub description: String,
    /// Plugin author name.
    #[serde(default)]
    pub author: String,
    /// Minimum Bismuth version required (optional).
    #[serde(default)]
    pub min_app_version: Option<String>,
    /// Frontend entry point (relative to plugin dir, e.g., "main.js").
    #[serde(default)]
    pub main: Option<String>,
    /// Whether the plugin is enabled (defaults to true).
    #[serde(default = "default_enabled")]
    pub enabled: bool,
}

fn default_enabled() -> bool {
    true
}

/// A loaded plugin with its manifest and resolved directory path.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoadedPlugin {
    /// The parsed manifest.
    pub manifest: PluginManifest,
    /// Absolute path to the plugin directory.
    pub dir: String,
    /// Whether the plugin loaded successfully.
    pub status: PluginStatus,
}

/// Status of a loaded plugin.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum PluginStatus {
    /// Plugin loaded successfully.
    Active,
    /// Plugin manifest was invalid or loading failed.
    Error,
    /// Plugin is disabled by the user.
    Disabled,
}

/// Service for discovering and loading vault plugins.
pub struct PluginService {
    plugins_dir: PathBuf,
}

impl PluginService {
    /// Creates a new `PluginService` for the given vault root.
    pub fn new(vault_root: &Path) -> Self {
        Self {
            plugins_dir: vault_root.join(".bismuth").join("plugins"),
        }
    }

    /// Scans the plugins directory and loads all valid plugin manifests.
    ///
    /// Invalid plugins are logged as warnings and returned with `PluginStatus::Error`.
    /// Disabled plugins are returned with `PluginStatus::Disabled`.
    pub fn scan_plugins(&self) -> Result<Vec<LoadedPlugin>> {
        let mut plugins = Vec::new();

        if !self.plugins_dir.exists() {
            return Ok(plugins);
        }

        let entries = fs::read_dir(&self.plugins_dir)?;

        for entry in entries.flatten() {
            let path = entry.path();
            if !path.is_dir() {
                continue;
            }

            let manifest_path = path.join("plugin.json");
            if !manifest_path.exists() {
                log::warn!(
                    "Plugin directory {:?} missing plugin.json, skipping",
                    path.file_name().unwrap_or_default()
                );
                plugins.push(LoadedPlugin {
                    manifest: PluginManifest {
                        id: path
                            .file_name()
                            .unwrap_or_default()
                            .to_string_lossy()
                            .to_string(),
                        name: path
                            .file_name()
                            .unwrap_or_default()
                            .to_string_lossy()
                            .to_string(),
                        version: "0.0.0".to_string(),
                        description: String::new(),
                        author: String::new(),
                        min_app_version: None,
                        main: None,
                        enabled: false,
                    },
                    dir: path.display().to_string(),
                    status: PluginStatus::Error,
                });
                continue;
            }

            match self.load_manifest(&manifest_path) {
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
                    log::warn!(
                        "Failed to load plugin manifest at {:?}: {}",
                        manifest_path,
                        e
                    );
                    plugins.push(LoadedPlugin {
                        manifest: PluginManifest {
                            id: path
                                .file_name()
                                .unwrap_or_default()
                                .to_string_lossy()
                                .to_string(),
                            name: path
                                .file_name()
                                .unwrap_or_default()
                                .to_string_lossy()
                                .to_string(),
                            version: "0.0.0".to_string(),
                            description: format!("Load error: {}", e),
                            author: String::new(),
                            min_app_version: None,
                            main: None,
                            enabled: false,
                        },
                        dir: path.display().to_string(),
                        status: PluginStatus::Error,
                    });
                }
            }
        }

        plugins.sort_by(|a, b| a.manifest.name.cmp(&b.manifest.name));
        Ok(plugins)
    }

    /// Gets a single plugin by ID.
    pub fn get_plugin(&self, id: &str) -> Result<Option<LoadedPlugin>> {
        let plugins = self.scan_plugins()?;
        Ok(plugins.into_iter().find(|p| p.manifest.id == id))
    }

    /// Enables or disables a plugin by rewriting its manifest.
    pub fn set_plugin_enabled(&self, id: &str, enabled: bool) -> Result<()> {
        let plugins = self.scan_plugins()?;
        let plugin = plugins
            .iter()
            .find(|p| p.manifest.id == id)
            .ok_or_else(|| BismuthError::NotFound(format!("Plugin '{}' not found", id)))?;

        let manifest_path = PathBuf::from(&plugin.dir).join("plugin.json");
        let mut manifest = self.load_manifest(&manifest_path)?;
        manifest.enabled = enabled;

        let json = serde_json::to_string_pretty(&manifest)?;
        fs::write(&manifest_path, json)?;

        Ok(())
    }

    /// Loads and validates a plugin manifest from a `plugin.json` file.
    fn load_manifest(&self, path: &Path) -> Result<PluginManifest> {
        let content = fs::read_to_string(path)?;
        let manifest: PluginManifest = serde_json::from_str(&content)
            .map_err(|e| BismuthError::ParseError(format!("Invalid plugin.json: {}", e)))?;

        // Validate required fields
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
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    fn setup_test_vault() -> (TempDir, PluginService) {
        let dir = TempDir::new().unwrap();
        let service = PluginService::new(dir.path());
        (dir, service)
    }

    #[test]
    fn test_scan_empty_plugins_dir() {
        let (_dir, service) = setup_test_vault();
        let plugins = service.scan_plugins().unwrap();
        assert!(plugins.is_empty());
    }

    #[test]
    fn test_scan_valid_plugin() {
        let (dir, service) = setup_test_vault();
        let plugins_dir = dir.path().join(".bismuth").join("plugins");
        let plugin_dir = plugins_dir.join("my-plugin");
        fs::create_dir_all(&plugin_dir).unwrap();

        let manifest = r#"{
            "id": "com.example.my-plugin",
            "name": "My Plugin",
            "version": "1.0.0",
            "description": "A test plugin",
            "author": "Test Author",
            "main": "main.js"
        }"#;
        fs::write(plugin_dir.join("plugin.json"), manifest).unwrap();

        let plugins = service.scan_plugins().unwrap();
        assert_eq!(plugins.len(), 1);
        assert_eq!(plugins[0].manifest.id, "com.example.my-plugin");
        assert_eq!(plugins[0].manifest.name, "My Plugin");
        assert_eq!(plugins[0].status, PluginStatus::Active);
    }

    #[test]
    fn test_scan_invalid_manifest() {
        let (dir, service) = setup_test_vault();
        let plugins_dir = dir.path().join(".bismuth").join("plugins");
        let plugin_dir = plugins_dir.join("bad-plugin");
        fs::create_dir_all(&plugin_dir).unwrap();

        fs::write(plugin_dir.join("plugin.json"), "not valid json").unwrap();

        let plugins = service.scan_plugins().unwrap();
        assert_eq!(plugins.len(), 1);
        assert_eq!(plugins[0].status, PluginStatus::Error);
    }

    #[test]
    fn test_scan_missing_manifest() {
        let (dir, service) = setup_test_vault();
        let plugins_dir = dir.path().join(".bismuth").join("plugins");
        let plugin_dir = plugins_dir.join("no-manifest");
        fs::create_dir_all(&plugin_dir).unwrap();

        let plugins = service.scan_plugins().unwrap();
        assert_eq!(plugins.len(), 1);
        assert_eq!(plugins[0].status, PluginStatus::Error);
    }

    #[test]
    fn test_disabled_plugin() {
        let (dir, service) = setup_test_vault();
        let plugins_dir = dir.path().join(".bismuth").join("plugins");
        let plugin_dir = plugins_dir.join("disabled-plugin");
        fs::create_dir_all(&plugin_dir).unwrap();

        let manifest = r#"{
            "id": "com.example.disabled",
            "name": "Disabled Plugin",
            "version": "1.0.0",
            "enabled": false
        }"#;
        fs::write(plugin_dir.join("plugin.json"), manifest).unwrap();

        let plugins = service.scan_plugins().unwrap();
        assert_eq!(plugins.len(), 1);
        assert_eq!(plugins[0].status, PluginStatus::Disabled);
    }

    #[test]
    fn test_set_plugin_enabled() {
        let (dir, service) = setup_test_vault();
        let plugins_dir = dir.path().join(".bismuth").join("plugins");
        let plugin_dir = plugins_dir.join("toggle-plugin");
        fs::create_dir_all(&plugin_dir).unwrap();

        let manifest = r#"{
            "id": "com.example.toggle",
            "name": "Toggle Plugin",
            "version": "1.0.0",
            "enabled": true
        }"#;
        fs::write(plugin_dir.join("plugin.json"), manifest).unwrap();

        // Disable it
        service
            .set_plugin_enabled("com.example.toggle", false)
            .unwrap();

        // Verify
        let plugins = service.scan_plugins().unwrap();
        assert_eq!(plugins[0].status, PluginStatus::Disabled);
        assert!(!plugins[0].manifest.enabled);
    }
}
