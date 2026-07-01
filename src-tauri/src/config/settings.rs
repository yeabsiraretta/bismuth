/// User-configurable settings
///
/// This module provides a type-safe settings system that can be persisted
/// and modified by users through the UI or configuration files.

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

use crate::error::Result;

/// Application settings with sensible defaults
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct AppSettings {
    pub editor: EditorSettings,
    pub layout: LayoutSettings,
    pub performance: PerformanceSettings,
    pub advanced: AdvancedSettings,
}

/// Editor-specific settings
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct EditorSettings {
    /// Auto-save delay in milliseconds
    pub auto_save_delay_ms: u64,

    /// Enable auto-save
    pub enable_auto_save: bool,

    /// Tab size in spaces
    pub tab_size: u32,

    /// Use spaces instead of tabs
    pub use_spaces: bool,

    /// Line wrap column (0 = no wrap)
    pub line_wrap_column: u32,

    /// Show line numbers
    pub show_line_numbers: bool,

    /// Enable spell check
    pub enable_spell_check: bool,
}

/// Layout and UI settings
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct LayoutSettings {
    /// Left sidebar width in pixels
    pub left_sidebar_width: u32,

    /// Right sidebar width in pixels
    pub right_sidebar_width: u32,

    /// Left sidebar visible on startup
    pub left_sidebar_visible: bool,

    /// Right sidebar visible on startup
    pub right_sidebar_visible: bool,

    /// Theme name
    pub theme: String,

    /// Font family
    pub font_family: String,

    /// Font size in pixels
    pub font_size: u32,
}

/// Performance-related settings
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct PerformanceSettings {
    /// Maximum search results
    pub max_search_results: usize,

    /// Search timeout in milliseconds
    pub search_timeout_ms: u64,

    /// Enable file size warnings
    pub enable_size_warnings: bool,

    /// File size warning threshold in bytes
    pub file_size_warning_bytes: usize,

    /// Maximum history entries per file
    pub max_history_entries: usize,
}

/// Advanced settings (for power users)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct AdvancedSettings {
    /// Enable crash recovery
    pub enable_crash_recovery: bool,

    /// Enable edit history
    pub enable_edit_history: bool,

    /// Enable depth warnings
    pub enable_depth_warnings: bool,

    /// Maximum directory depth
    pub max_directory_depth: usize,

    /// Database connection pool size
    pub db_pool_size: u32,

    /// Enable WAL mode for SQLite
    pub enable_wal_mode: bool,

    /// Log level (trace, debug, info, warn, error)
    pub log_level: String,

    /// Maximum log file size in bytes
    pub log_max_size_bytes: u64,

    /// Number of log files to retain
    pub log_retention_count: u32,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            editor: EditorSettings::default(),
            layout: LayoutSettings::default(),
            performance: PerformanceSettings::default(),
            advanced: AdvancedSettings::default(),
        }
    }
}

impl AppSettings {
    /// Load settings from file, or create default if not exists
    pub fn load(path: &Path) -> Result<Self> {
        if path.exists() {
            let contents = fs::read_to_string(path)?;
            let settings: AppSettings = serde_json::from_str(&contents)?;
            Ok(settings)
        } else {
            let settings = Self::default();
            settings.save(path)?;
            Ok(settings)
        }
    }

    /// Save settings to file
    pub fn save(&self, path: &Path) -> Result<()> {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }

        let contents = serde_json::to_string_pretty(self)?;
        fs::write(path, contents)?;
        Ok(())
    }

    /// Get settings file path for a vault
    pub fn vault_settings_path(vault_root: &Path) -> PathBuf {
        vault_root.join(".bismuth/settings.json")
    }

    /// Get global settings file path
    pub fn global_settings_path() -> Result<PathBuf> {
        let config_dir = dirs::config_dir()
            .ok_or_else(|| crate::error::BismuthError::ConfigError("Could not find config directory".to_string()))?;
        
        Ok(config_dir.join("bismuth/settings.json"))
    }

    /// Validate settings and apply constraints
    pub fn validate(&mut self) {
        // Clamp sidebar widths
        self.layout.left_sidebar_width = self.layout.left_sidebar_width.clamp(200, 600);
        self.layout.right_sidebar_width = self.layout.right_sidebar_width.clamp(200, 600);

        // Clamp font size
        self.layout.font_size = self.layout.font_size.clamp(10, 32);

        // Clamp tab size
        self.editor.tab_size = self.editor.tab_size.clamp(1, 8);

        // Ensure positive values
        if self.performance.max_search_results == 0 {
            self.performance.max_search_results = 100;
        }

        if self.performance.search_timeout_ms == 0 {
            self.performance.search_timeout_ms = 200;
        }

        // Validate log level
        let valid_levels = ["trace", "debug", "info", "warn", "error"];
        if !valid_levels.contains(&self.advanced.log_level.as_str()) {
            self.advanced.log_level = "info".to_string();
        }
    }

    /// Reset to defaults
    pub fn reset(&mut self) {
        *self = Self::default();
    }

    /// Reset specific section
    pub fn reset_editor(&mut self) {
        self.editor = EditorSettings::default();
    }

    pub fn reset_layout(&mut self) {
        self.layout = LayoutSettings::default();
    }

    pub fn reset_performance(&mut self) {
        self.performance = PerformanceSettings::default();
    }

    pub fn reset_advanced(&mut self) {
        self.advanced = AdvancedSettings::default();
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_default_settings() {
        let settings = AppSettings::default();
        assert_eq!(settings.editor.auto_save_delay_ms, 500);
        assert_eq!(settings.layout.left_sidebar_width, 300);
        assert!(settings.advanced.enable_crash_recovery);
    }

    #[test]
    fn test_save_and_load() {
        let dir = tempdir().unwrap();
        let path = dir.path().join("settings.json");

        let settings = AppSettings::default();
        settings.save(&path).unwrap();

        let loaded = AppSettings::load(&path).unwrap();
        assert_eq!(loaded.editor.tab_size, settings.editor.tab_size);
    }

    #[test]
    fn test_validation() {
        let mut settings = AppSettings::default();
        settings.layout.left_sidebar_width = 1000;
        settings.layout.font_size = 50;
        settings.editor.tab_size = 20;

        settings.validate();

        assert_eq!(settings.layout.left_sidebar_width, 600);
        assert_eq!(settings.layout.font_size, 32);
        assert_eq!(settings.editor.tab_size, 8);
    }
}
