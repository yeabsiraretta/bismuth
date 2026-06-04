//! Theme service for loading and parsing CSS themes
//!
//! Handles Obsidian-compatible CSS theme loading and Style Settings parsing (FR-011, FR-012).

use crate::error::{BismuthError, Result};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

/// Style Settings control types parsed from CSS comments
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "kebab-case")]
pub enum StyleSetting {
    VariableColor {
        id: String,
        title: String,
        description: Option<String>,
        default: String,
    },
    VariableNumberSlider {
        id: String,
        title: String,
        description: Option<String>,
        default: f64,
        min: f64,
        max: f64,
        step: f64,
    },
    VariableSelect {
        id: String,
        title: String,
        description: Option<String>,
        default: String,
        options: Vec<SelectOption>,
    },
    ClassToggle {
        id: String,
        title: String,
        description: Option<String>,
        default: bool,
    },
}

/// Option for select-type settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SelectOption {
    pub label: String,
    pub value: String,
}

/// Theme metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThemeInfo {
    pub name: String,
    pub filename: String,
    pub has_style_settings: bool,
}

/// Theme service for managing CSS themes
pub struct ThemeService {
    themes_dir: PathBuf,
}

impl ThemeService {
    /// Create a new ThemeService for the given vault
    pub fn new(vault_root: &Path) -> Self {
        Self {
            themes_dir: vault_root.join(".bismuth").join("themes"),
        }
    }

    /// Get list of available themes
    pub fn get_available_themes(&self) -> Result<Vec<ThemeInfo>> {
        let mut themes = Vec::new();

        if !self.themes_dir.exists() {
            return Ok(themes);
        }

        let entries = fs::read_dir(&self.themes_dir)?;

        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().map_or(false, |ext| ext == "css") {
                let filename = path
                    .file_name()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .to_string();
                let name = path
                    .file_stem()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .to_string();

                let content = fs::read_to_string(&path)?;
                let has_style_settings = content.contains("@settings");

                themes.push(ThemeInfo {
                    name,
                    filename,
                    has_style_settings,
                });
            }
        }

        themes.sort_by(|a, b| a.name.cmp(&b.name));
        Ok(themes)
    }

    /// Load theme CSS content by name
    pub fn load_theme(&self, name: &str) -> Result<String> {
        let path = self.themes_dir.join(format!("{}.css", name));
        if !path.exists() {
            return Err(BismuthError::NotFound(format!("Theme '{}' not found", name)));
        }
        fs::read_to_string(&path).map_err(|e| e.into())
    }

    /// Parse Style Settings from CSS content
    ///
    /// Extracts `/* @settings ... */` YAML blocks from CSS comments.
    pub fn parse_style_settings(css: &str) -> Result<Vec<StyleSetting>> {
        let mut settings = Vec::new();
        let mut in_settings_block = false;
        let mut yaml_content = String::new();

        for line in css.lines() {
            let trimmed = line.trim();
            if trimmed.contains("@settings") && trimmed.starts_with("/*") {
                in_settings_block = true;
                continue;
            }
            if in_settings_block {
                if trimmed.contains("*/") {
                    in_settings_block = false;
                    // Parse accumulated YAML
                    if let Ok(parsed) = Self::parse_settings_yaml(&yaml_content) {
                        settings.extend(parsed);
                    }
                    yaml_content.clear();
                } else {
                    yaml_content.push_str(line);
                    yaml_content.push('\n');
                }
            }
        }

        Ok(settings)
    }

    /// Parse individual settings from YAML content within a @settings block
    fn parse_settings_yaml(yaml: &str) -> Result<Vec<StyleSetting>> {
        let mut settings = Vec::new();

        // Simple line-based parser for Style Settings YAML format
        let mut current_id = String::new();
        let mut current_title = String::new();
        let mut current_type = String::new();
        let mut current_default = String::new();
        let mut current_min: f64 = 0.0;
        let mut current_max: f64 = 100.0;
        let mut current_step: f64 = 1.0;

        for line in yaml.lines() {
            let trimmed = line.trim();
            if trimmed.starts_with("- ") || trimmed.starts_with("-\t") {
                // Flush previous setting
                if !current_id.is_empty() {
                    if let Some(setting) = Self::build_setting(
                        &current_type,
                        &current_id,
                        &current_title,
                        &current_default,
                        current_min,
                        current_max,
                        current_step,
                    ) {
                        settings.push(setting);
                    }
                }
                current_id.clear();
                current_title.clear();
                current_type.clear();
                current_default.clear();
                current_min = 0.0;
                current_max = 100.0;
                current_step = 1.0;
            }

            if let Some(val) = Self::extract_field(trimmed, "id:") {
                current_id = val;
            } else if let Some(val) = Self::extract_field(trimmed, "title:") {
                current_title = val;
            } else if let Some(val) = Self::extract_field(trimmed, "type:") {
                current_type = val;
            } else if let Some(val) = Self::extract_field(trimmed, "default:") {
                current_default = val;
            } else if let Some(val) = Self::extract_field(trimmed, "min:") {
                current_min = val.parse().unwrap_or(0.0);
            } else if let Some(val) = Self::extract_field(trimmed, "max:") {
                current_max = val.parse().unwrap_or(100.0);
            } else if let Some(val) = Self::extract_field(trimmed, "step:") {
                current_step = val.parse().unwrap_or(1.0);
            }
        }

        // Flush last setting
        if !current_id.is_empty() {
            if let Some(setting) = Self::build_setting(
                &current_type,
                &current_id,
                &current_title,
                &current_default,
                current_min,
                current_max,
                current_step,
            ) {
                settings.push(setting);
            }
        }

        Ok(settings)
    }

    fn extract_field(line: &str, prefix: &str) -> Option<String> {
        let trimmed = line.trim().trim_start_matches("- ");
        if trimmed.starts_with(prefix) {
            Some(trimmed[prefix.len()..].trim().trim_matches('"').to_string())
        } else {
            None
        }
    }

    fn build_setting(
        setting_type: &str,
        id: &str,
        title: &str,
        default: &str,
        min: f64,
        max: f64,
        step: f64,
    ) -> Option<StyleSetting> {
        match setting_type {
            "variable-color" => Some(StyleSetting::VariableColor {
                id: id.to_string(),
                title: title.to_string(),
                description: None,
                default: default.to_string(),
            }),
            "variable-number-slider" => Some(StyleSetting::VariableNumberSlider {
                id: id.to_string(),
                title: title.to_string(),
                description: None,
                default: default.parse().unwrap_or(0.0),
                min,
                max,
                step,
            }),
            "class-toggle" => Some(StyleSetting::ClassToggle {
                id: id.to_string(),
                title: title.to_string(),
                description: None,
                default: default == "true",
            }),
            _ => None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    fn setup_test_vault() -> (TempDir, ThemeService) {
        let dir = TempDir::new().unwrap();
        let service = ThemeService::new(dir.path());
        (dir, service)
    }

    #[test]
    fn test_get_available_themes_empty() {
        let (_dir, service) = setup_test_vault();
        let themes = service.get_available_themes().unwrap();
        assert!(themes.is_empty());
    }

    #[test]
    fn test_get_available_themes() {
        let (dir, service) = setup_test_vault();
        let themes_dir = dir.path().join(".bismuth").join("themes");
        fs::create_dir_all(&themes_dir).unwrap();
        fs::write(themes_dir.join("dark.css"), ":root { --bg: #1a1a1a; }").unwrap();
        fs::write(themes_dir.join("light.css"), ":root { --bg: #ffffff; }").unwrap();

        let themes = service.get_available_themes().unwrap();
        assert_eq!(themes.len(), 2);
        assert_eq!(themes[0].name, "dark");
        assert_eq!(themes[1].name, "light");
    }

    #[test]
    fn test_load_theme() {
        let (dir, service) = setup_test_vault();
        let themes_dir = dir.path().join(".bismuth").join("themes");
        fs::create_dir_all(&themes_dir).unwrap();
        let css = ":root { --accent: #6366f1; }";
        fs::write(themes_dir.join("indigo.css"), css).unwrap();

        let loaded = service.load_theme("indigo").unwrap();
        assert_eq!(loaded, css);
    }

    #[test]
    fn test_load_theme_not_found() {
        let (_dir, service) = setup_test_vault();
        let result = service.load_theme("nonexistent");
        assert!(result.is_err());
    }

    #[test]
    fn test_parse_style_settings() {
        let css = r#"
/* @settings
- id: accent-color
  title: Accent Color
  type: variable-color
  default: #6366f1
- id: font-size
  title: Font Size
  type: variable-number-slider
  default: 16
  min: 10
  max: 24
  step: 1
- id: dark-mode
  title: Dark Mode
  type: class-toggle
  default: true
*/
:root { --accent: var(--accent-color); }
"#;

        let settings = ThemeService::parse_style_settings(css).unwrap();
        assert_eq!(settings.len(), 3);

        match &settings[0] {
            StyleSetting::VariableColor { id, default, .. } => {
                assert_eq!(id, "accent-color");
                assert_eq!(default, "#6366f1");
            }
            _ => panic!("Expected VariableColor"),
        }

        match &settings[1] {
            StyleSetting::VariableNumberSlider { id, min, max, step, .. } => {
                assert_eq!(id, "font-size");
                assert_eq!(*min, 10.0);
                assert_eq!(*max, 24.0);
                assert_eq!(*step, 1.0);
            }
            _ => panic!("Expected VariableNumberSlider"),
        }

        match &settings[2] {
            StyleSetting::ClassToggle { id, default, .. } => {
                assert_eq!(id, "dark-mode");
                assert_eq!(*default, true);
            }
            _ => panic!("Expected ClassToggle"),
        }
    }

    #[test]
    fn test_has_style_settings_detection() {
        let (dir, service) = setup_test_vault();
        let themes_dir = dir.path().join(".bismuth").join("themes");
        fs::create_dir_all(&themes_dir).unwrap();
        fs::write(
            themes_dir.join("with-settings.css"),
            "/* @settings\n- id: x\n*/\n:root {}",
        )
        .unwrap();
        fs::write(themes_dir.join("plain.css"), ":root {}").unwrap();

        let themes = service.get_available_themes().unwrap();
        let with = themes.iter().find(|t| t.name == "with-settings").unwrap();
        let plain = themes.iter().find(|t| t.name == "plain").unwrap();
        assert!(with.has_style_settings);
        assert!(!plain.has_style_settings);
    }
}
