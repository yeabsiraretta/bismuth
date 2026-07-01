//! Style Settings parser for CSS @settings blocks.
//!
//! Uses serde_yaml for robust YAML parsing, supporting the full
//! Obsidian Style Settings plugin specification.

use crate::error::Result;
use super::{AltFormatEntry, SelectOption, SettingsBlock, StyleSetting};
use serde::Deserialize;

/// Raw YAML structure of a @settings block
#[derive(Deserialize)]
struct RawSettingsBlock {
    name: Option<String>,
    id: Option<String>,
    settings: Option<Vec<serde_yaml::Value>>,
}

/// Parse Style Settings from CSS content (returns flat list for backward compat)
pub fn parse_style_settings(css: &str) -> Result<Vec<StyleSetting>> {
    let blocks = parse_settings_blocks(css, "unknown");
    Ok(blocks.into_iter().flat_map(|b| b.settings).collect())
}

/// Parse @settings blocks from CSS content, returning structured SettingsBlock list.
pub fn parse_settings_blocks(css: &str, source: &str) -> Vec<SettingsBlock> {
    let mut blocks = Vec::new();

    for yaml_str in extract_settings_yaml(css) {
        if let Ok(raw) = serde_yaml::from_str::<RawSettingsBlock>(&yaml_str) {
            let name = raw.name.unwrap_or_else(|| "Unnamed".to_string());
            let id = raw.id.unwrap_or_else(|| "unnamed".to_string());
            let settings = raw
                .settings
                .unwrap_or_default()
                .into_iter()
                .filter_map(|v| parse_setting_value(&v))
                .collect();
            blocks.push(SettingsBlock {
                name,
                id,
                source: source.to_string(),
                settings,
            });
        }
    }

    blocks
}

/// Extract raw YAML strings from `/* @settings ... */` comment blocks.
fn extract_settings_yaml(css: &str) -> Vec<String> {
    let mut results = Vec::new();
    let mut in_block = false;
    let mut yaml = String::new();

    for line in css.lines() {
        let trimmed = line.trim();
        if !in_block && trimmed.contains("@settings") && trimmed.starts_with("/*") {
            in_block = true;
            yaml.clear();
            continue;
        }
        if in_block {
            if trimmed.contains("*/") {
                in_block = false;
                results.push(yaml.clone());
            } else {
                yaml.push_str(line);
                yaml.push('\n');
            }
        }
    }

    results
}

/// Parse a single setting entry from a YAML value
fn parse_setting_value(value: &serde_yaml::Value) -> Option<StyleSetting> {
    let map = value.as_mapping()?;

    let id = get_str(map, "id")?;
    let title = get_str(map, "title").unwrap_or_default();
    let description = get_str(map, "description");
    let setting_type = get_str(map, "type")?;

    match setting_type.as_str() {
        "heading" => Some(StyleSetting::Heading {
            id,
            title,
            description,
            level: get_u8(map, "level").unwrap_or(1),
            collapsed: get_bool(map, "collapsed"),
        }),
        "info-text" => Some(StyleSetting::InfoText {
            id,
            title,
            description,
            markdown: get_bool(map, "markdown"),
        }),
        "class-toggle" => Some(StyleSetting::ClassToggle {
            id,
            title,
            description,
            default: get_bool(map, "default").unwrap_or(false),
        }),
        "class-select" => Some(StyleSetting::ClassSelect {
            id,
            title,
            description,
            default: get_str(map, "default"),
            allow_empty: get_bool(map, "allowEmpty").unwrap_or(false),
            options: parse_options(map),
        }),
        "variable-text" => Some(StyleSetting::VariableText {
            id,
            title,
            description,
            default: get_str(map, "default").unwrap_or_default(),
            quotes: get_bool(map, "quotes").unwrap_or(false),
        }),
        "variable-number" => Some(StyleSetting::VariableNumber {
            id,
            title,
            description,
            default: get_f64(map, "default").unwrap_or(0.0),
            format: get_str(map, "format"),
        }),
        "variable-number-slider" => Some(StyleSetting::VariableNumberSlider {
            id,
            title,
            description,
            default: get_f64(map, "default").unwrap_or(0.0),
            min: get_f64(map, "min").unwrap_or(0.0),
            max: get_f64(map, "max").unwrap_or(100.0),
            step: get_f64(map, "step").unwrap_or(1.0),
            format: get_str(map, "format"),
        }),
        "variable-select" => Some(StyleSetting::VariableSelect {
            id,
            title,
            description,
            default: get_str(map, "default").unwrap_or_default(),
            options: parse_options(map),
        }),
        "variable-color" => Some(StyleSetting::VariableColor {
            id,
            title,
            description,
            default: get_str(map, "default").unwrap_or_default(),
            format: get_str(map, "format"),
            opacity: get_bool(map, "opacity").unwrap_or(false),
            alt_format: parse_alt_format(map),
        }),
        "variable-themed-color" => Some(StyleSetting::VariableThemedColor {
            id,
            title,
            description,
            default_light: get_str(map, "default-light").unwrap_or_default(),
            default_dark: get_str(map, "default-dark").unwrap_or_default(),
            format: get_str(map, "format"),
            opacity: get_bool(map, "opacity").unwrap_or(false),
        }),
        "color-gradient" => Some(StyleSetting::ColorGradient {
            id,
            title: get_str(map, "title"),
            from: get_str(map, "from").unwrap_or_default(),
            to: get_str(map, "to").unwrap_or_default(),
            step: get_u8(map, "step").unwrap_or(10) as u32,
            format: get_str(map, "format").unwrap_or_else(|| "hex".to_string()),
            pad: get_u8(map, "pad").map(|v| v as u32),
        }),
        _ => None,
    }
}

/// Parse options list (supports both string and {label, value} forms)
fn parse_options(map: &serde_yaml::Mapping) -> Vec<SelectOption> {
    let key = serde_yaml::Value::String("options".to_string());
    let Some(serde_yaml::Value::Sequence(seq)) = map.get(&key) else {
        return Vec::new();
    };

    seq.iter()
        .filter_map(|item| match item {
            serde_yaml::Value::String(s) => Some(SelectOption {
                label: s.clone(),
                value: s.clone(),
            }),
            serde_yaml::Value::Mapping(m) => {
                let label = get_str(m, "label")?;
                let value = get_str(m, "value")?;
                Some(SelectOption { label, value })
            }
            _ => None,
        })
        .collect()
}

/// Parse alt-format list for variable-color settings
fn parse_alt_format(map: &serde_yaml::Mapping) -> Vec<AltFormatEntry> {
    let key = serde_yaml::Value::String("alt-format".to_string());
    let Some(serde_yaml::Value::Sequence(seq)) = map.get(&key) else {
        return Vec::new();
    };

    seq.iter()
        .filter_map(|item| {
            let m = item.as_mapping()?;
            let id = get_str(m, "id")?;
            let format = get_str(m, "format")?;
            Some(AltFormatEntry { id, format })
        })
        .collect()
}

// ─── YAML Helpers ─────────────────────────────────────────────────────────────

fn get_str(map: &serde_yaml::Mapping, key: &str) -> Option<String> {
    let k = serde_yaml::Value::String(key.to_string());
    map.get(&k).and_then(|v| match v {
        serde_yaml::Value::String(s) => Some(s.clone()),
        serde_yaml::Value::Number(n) => Some(n.to_string()),
        serde_yaml::Value::Bool(b) => Some(b.to_string()),
        _ => None,
    })
}

fn get_f64(map: &serde_yaml::Mapping, key: &str) -> Option<f64> {
    let k = serde_yaml::Value::String(key.to_string());
    map.get(&k).and_then(|v| match v {
        serde_yaml::Value::Number(n) => n.as_f64(),
        serde_yaml::Value::String(s) => s.parse().ok(),
        _ => None,
    })
}

fn get_u8(map: &serde_yaml::Mapping, key: &str) -> Option<u8> {
    get_f64(map, key).map(|v| v as u8)
}

fn get_bool(map: &serde_yaml::Mapping, key: &str) -> Option<bool> {
    let k = serde_yaml::Value::String(key.to_string());
    map.get(&k).and_then(|v| v.as_bool())
}
