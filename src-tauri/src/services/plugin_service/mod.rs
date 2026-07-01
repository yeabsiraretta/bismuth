//! Plugin loader service (FR-012)
//!
//! Scans the `plugins/` directory on vault open, loads and validates
//! `plugin.json` manifests, and provides metadata to the frontend.

pub mod mod_types;
pub(crate) mod loader;
pub(crate) mod lifecycle;

pub use mod_types::{LoadedPlugin, PluginManifest, PluginStatus};

use crate::error::Result;
use std::path::{Path, PathBuf};

/// Service for discovering and loading vault plugins.
pub struct PluginService {
    plugins_dir: PathBuf,
}

impl PluginService {
    pub fn new(vault_root: &Path) -> Self {
        use crate::config::constants::filesystem::VAULT_DIR_NAME;
        Self {
            plugins_dir: vault_root.join(VAULT_DIR_NAME).join("plugins"),
        }
    }

    pub fn scan_plugins(&self) -> Result<Vec<LoadedPlugin>> {
        loader::scan_plugins(&self.plugins_dir)
    }

    pub fn get_plugin(&self, id: &str) -> Result<Option<LoadedPlugin>> {
        lifecycle::get_plugin(&self.plugins_dir, id)
    }

    pub fn set_plugin_enabled(&self, id: &str, enabled: bool) -> Result<()> {
        lifecycle::set_plugin_enabled(&self.plugins_dir, id, enabled)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
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
        let manifest = r#"{"id":"com.example.my-plugin","name":"My Plugin","version":"1.0.0","description":"A test plugin","author":"Test Author","main":"main.js"}"#;
        fs::write(plugin_dir.join("plugin.json"), manifest).unwrap();
        let plugins = service.scan_plugins().unwrap();
        assert_eq!(plugins.len(), 1);
        assert_eq!(plugins[0].manifest.id, "com.example.my-plugin");
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
        assert_eq!(plugins[0].status, PluginStatus::Error);
    }

    #[test]
    fn test_disabled_plugin() {
        let (dir, service) = setup_test_vault();
        let plugins_dir = dir.path().join(".bismuth").join("plugins");
        let plugin_dir = plugins_dir.join("disabled-plugin");
        fs::create_dir_all(&plugin_dir).unwrap();
        let manifest = r#"{"id":"com.example.disabled","name":"Disabled","version":"1.0.0","enabled":false}"#;
        fs::write(plugin_dir.join("plugin.json"), manifest).unwrap();
        let plugins = service.scan_plugins().unwrap();
        assert_eq!(plugins[0].status, PluginStatus::Disabled);
    }

    #[test]
    fn test_set_plugin_enabled() {
        let (dir, service) = setup_test_vault();
        let plugins_dir = dir.path().join(".bismuth").join("plugins");
        let plugin_dir = plugins_dir.join("toggle-plugin");
        fs::create_dir_all(&plugin_dir).unwrap();
        let manifest = r#"{"id":"com.example.toggle","name":"Toggle","version":"1.0.0","enabled":true}"#;
        fs::write(plugin_dir.join("plugin.json"), manifest).unwrap();
        service.set_plugin_enabled("com.example.toggle", false).unwrap();
        let plugins = service.scan_plugins().unwrap();
        assert_eq!(plugins[0].status, PluginStatus::Disabled);
    }
}
