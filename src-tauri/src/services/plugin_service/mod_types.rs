//! Shared types for plugin_service submodules.

use serde::{Deserialize, Serialize};

/// Plugin manifest read from `plugin.json` in each plugin directory.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginManifest {
    pub id: String,
    pub name: String,
    pub version: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub author: String,
    #[serde(default)]
    pub min_app_version: Option<String>,
    #[serde(default)]
    pub main: Option<String>,
    #[serde(default = "default_enabled")]
    pub enabled: bool,
}

fn default_enabled() -> bool { true }

/// A loaded plugin with its manifest and resolved directory path.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoadedPlugin {
    pub manifest: PluginManifest,
    pub dir: String,
    pub status: PluginStatus,
}

/// Status of a loaded plugin.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum PluginStatus {
    Active,
    Error,
    Disabled,
}
