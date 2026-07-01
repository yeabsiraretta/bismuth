//! Theme service for loading and parsing CSS themes
//!
//! Handles Obsidian-compatible CSS theme loading and Style Settings parsing (FR-011, FR-012).

pub mod custom_tokens;
mod style_settings;

use crate::error::{BismuthError, Result};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

/// Style Settings control types parsed from CSS comments
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "kebab-case")]
pub enum StyleSetting {
    Heading {
        id: String,
        title: String,
        description: Option<String>,
        level: u8,
        collapsed: Option<bool>,
    },
    InfoText {
        id: String,
        title: String,
        description: Option<String>,
        markdown: Option<bool>,
    },
    ClassToggle {
        id: String,
        title: String,
        description: Option<String>,
        #[serde(default)]
        default: bool,
    },
    ClassSelect {
        id: String,
        title: String,
        description: Option<String>,
        default: Option<String>,
        #[serde(default)]
        allow_empty: bool,
        options: Vec<SelectOption>,
    },
    VariableText {
        id: String,
        title: String,
        description: Option<String>,
        default: String,
        #[serde(default)]
        quotes: bool,
    },
    VariableNumber {
        id: String,
        title: String,
        description: Option<String>,
        default: f64,
        format: Option<String>,
    },
    VariableNumberSlider {
        id: String,
        title: String,
        description: Option<String>,
        default: f64,
        min: f64,
        max: f64,
        step: f64,
        format: Option<String>,
    },
    VariableSelect {
        id: String,
        title: String,
        description: Option<String>,
        default: String,
        options: Vec<SelectOption>,
    },
    VariableColor {
        id: String,
        title: String,
        description: Option<String>,
        default: String,
        format: Option<String>,
        #[serde(default)]
        opacity: bool,
        #[serde(default, rename = "alt-format")]
        alt_format: Vec<AltFormatEntry>,
    },
    VariableThemedColor {
        id: String,
        title: String,
        description: Option<String>,
        #[serde(rename = "default-light")]
        default_light: String,
        #[serde(rename = "default-dark")]
        default_dark: String,
        format: Option<String>,
        #[serde(default)]
        opacity: bool,
    },
    ColorGradient {
        id: String,
        title: Option<String>,
        from: String,
        to: String,
        step: u32,
        format: String,
        pad: Option<u32>,
    },
}

/// Option for select-type settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SelectOption {
    pub label: String,
    pub value: String,
}

/// Alternate color format output entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AltFormatEntry {
    pub id: String,
    pub format: String,
}

/// A parsed @settings block with its section metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SettingsBlock {
    pub name: String,
    pub id: String,
    pub source: String,
    pub settings: Vec<StyleSetting>,
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
    snippets_dir: PathBuf,
}

impl ThemeService {
    /// Create a new ThemeService for the given vault
    pub fn new(vault_root: &Path) -> Self {
        use crate::config::constants::filesystem::VAULT_DIR_NAME;
        Self {
            themes_dir: vault_root.join(VAULT_DIR_NAME).join("themes"),
            snippets_dir: vault_root.join(VAULT_DIR_NAME).join("snippets"),
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
        style_settings::parse_style_settings(css)
    }

    /// Scan all CSS files in themes and snippets directories for @settings blocks.
    /// Returns a list of SettingsBlock with source info.
    pub fn scan_all_settings_blocks(&self) -> Result<Vec<SettingsBlock>> {
        let mut blocks = Vec::new();

        // Scan snippets directory
        if self.snippets_dir.exists() {
            self.scan_dir_for_blocks(&self.snippets_dir, "snippet", &mut blocks)?;
        }

        // Scan themes directory
        if self.themes_dir.exists() {
            self.scan_dir_for_blocks(&self.themes_dir, "theme", &mut blocks)?;
        }

        Ok(blocks)
    }

    fn scan_dir_for_blocks(
        &self,
        dir: &Path,
        source_type: &str,
        blocks: &mut Vec<SettingsBlock>,
    ) -> Result<()> {
        for entry in fs::read_dir(dir)?.flatten() {
            let path = entry.path();
            if path.extension().map_or(false, |ext| ext == "css") {
                let content = fs::read_to_string(&path)?;
                if content.contains("@settings") {
                    let filename = path.file_stem().unwrap_or_default().to_string_lossy().to_string();
                    let source = format!("{}:{}", source_type, filename);
                    let parsed_blocks = style_settings::parse_settings_blocks(&content, &source);
                    blocks.extend(parsed_blocks);
                }
            }
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests;
