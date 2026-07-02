use super::*;
use std::fs;
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

name: Test Theme
id: test-theme
settings:
    -
        id: accent-color
        title: Accent Color
        type: variable-color
        default: '#6366f1'
        format: hex
    -
        id: font-size
        title: Font Size
        type: variable-number-slider
        default: 16
        min: 10
        max: 24
        step: 1
    -
        id: dark-mode
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
        _ => panic!("Expected VariableColor, got {:?}", &settings[0]),
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
        "/* @settings\nname: X\nid: x\nsettings:\n    -\n        id: y\n        title: Y\n        type: class-toggle\n*/\n:root {}",
    )
    .unwrap();
    fs::write(themes_dir.join("plain.css"), ":root {}").unwrap();

    let themes = service.get_available_themes().unwrap();
    let with = themes.iter().find(|t| t.name == "with-settings").unwrap();
    let plain = themes.iter().find(|t| t.name == "plain").unwrap();
    assert!(with.has_style_settings);
    assert!(!plain.has_style_settings);
}

#[test]
fn test_parse_alt_format() {
    let css = r#"/* @settings
name: Alt Test
id: alt-test
settings:
    -
        id: my-color
        title: My Color
        type: variable-color
        default: '#ff0000'
        format: hex
        alt-format:
            -
                id: my-color-rgb
                format: rgb
            -
                id: my-color-hsl
                format: hsl
*/
"#;
    let settings = ThemeService::parse_style_settings(css).unwrap();
    assert_eq!(settings.len(), 1);
    match &settings[0] {
        StyleSetting::VariableColor { id, alt_format, .. } => {
            assert_eq!(id, "my-color");
            assert_eq!(alt_format.len(), 2);
            assert_eq!(alt_format[0].id, "my-color-rgb");
            assert_eq!(alt_format[0].format, "rgb");
            assert_eq!(alt_format[1].id, "my-color-hsl");
            assert_eq!(alt_format[1].format, "hsl");
        }
        _ => panic!("Expected VariableColor"),
    }
}

#[test]
fn test_parse_variable_themed_color() {
    let css = r#"/* @settings
name: Themed
id: themed
settings:
    -
        id: bg-color
        title: Background
        type: variable-themed-color
        default-light: '#ffffff'
        default-dark: '#1a1a1a'
        format: hsl
        opacity: true
*/
"#;
    let settings = ThemeService::parse_style_settings(css).unwrap();
    assert_eq!(settings.len(), 1);
    match &settings[0] {
        StyleSetting::VariableThemedColor { id, default_light, default_dark, format, opacity, .. } => {
            assert_eq!(id, "bg-color");
            assert_eq!(default_light, "#ffffff");
            assert_eq!(default_dark, "#1a1a1a");
            assert_eq!(format.as_deref(), Some("hsl"));
            assert!(*opacity);
        }
        _ => panic!("Expected VariableThemedColor"),
    }
}

#[test]
fn test_parse_color_gradient() {
    let css = r#"/* @settings
name: Gradient
id: gradient
settings:
    -
        id: fade
        type: color-gradient
        from: '#000000'
        to: '#ffffff'
        step: 25
        format: rgb
        pad: 3
*/
"#;
    let settings = ThemeService::parse_style_settings(css).unwrap();
    assert_eq!(settings.len(), 1);
    match &settings[0] {
        StyleSetting::ColorGradient { id, from, to, step, format, pad, .. } => {
            assert_eq!(id, "fade");
            assert_eq!(from, "#000000");
            assert_eq!(to, "#ffffff");
            assert_eq!(*step, 25);
            assert_eq!(format, "rgb");
            assert_eq!(*pad, Some(3));
        }
        _ => panic!("Expected ColorGradient"),
    }
}

#[test]
fn test_scan_snippets_and_themes() {
    let (dir, service) = setup_test_vault();
    let snippets_dir = dir.path().join(".bismuth").join("snippets");
    let themes_dir = dir.path().join(".bismuth").join("themes");
    fs::create_dir_all(&snippets_dir).unwrap();
    fs::create_dir_all(&themes_dir).unwrap();

    fs::write(
        snippets_dir.join("custom.css"),
        "/* @settings\nname: Snippet\nid: snippet-1\nsettings:\n    -\n        id: s1\n        title: S1\n        type: class-toggle\n*/\n",
    ).unwrap();
    fs::write(
        themes_dir.join("mytheme.css"),
        "/* @settings\nname: Theme\nid: theme-1\nsettings:\n    -\n        id: t1\n        title: T1\n        type: variable-text\n        default: hello\n*/\n",
    ).unwrap();

    let blocks = service.scan_all_settings_blocks().unwrap();
    assert_eq!(blocks.len(), 2);
    assert!(blocks.iter().any(|b| b.source.starts_with("snippet:")));
    assert!(blocks.iter().any(|b| b.source.starts_with("theme:")));
}

#[test]
fn test_parse_all_setting_types() {
    let css = r#"/* @settings
name: All Types
id: all-types
settings:
    -
        id: h1
        title: Section
        type: heading
        level: 2
    -
        id: info1
        title: Notice
        type: info-text
        markdown: true
    -
        id: cs1
        title: Layout
        type: class-select
        default: compact
        allowEmpty: true
        options:
            -
                label: Compact
                value: compact
            -
                label: Wide
                value: wide
    -
        id: vt1
        title: Font
        type: variable-text
        default: Inter
        quotes: true
    -
        id: vn1
        title: Size
        type: variable-number
        default: 16
        format: px
    -
        id: vs1
        title: Weight
        type: variable-select
        default: normal
        options:
            - normal
            - bold
*/
"#;
    let settings = ThemeService::parse_style_settings(css).unwrap();
    assert_eq!(settings.len(), 6);

    match &settings[0] {
        StyleSetting::Heading { level, .. } => assert_eq!(*level, 2),
        _ => panic!("Expected Heading"),
    }
    match &settings[1] {
        StyleSetting::InfoText { markdown, .. } => assert_eq!(*markdown, Some(true)),
        _ => panic!("Expected InfoText"),
    }
    match &settings[2] {
        StyleSetting::ClassSelect { allow_empty, options, .. } => {
            assert!(*allow_empty);
            assert_eq!(options.len(), 2);
        }
        _ => panic!("Expected ClassSelect"),
    }
    match &settings[3] {
        StyleSetting::VariableText { quotes, default, .. } => {
            assert!(*quotes);
            assert_eq!(default, "Inter");
        }
        _ => panic!("Expected VariableText"),
    }
    match &settings[4] {
        StyleSetting::VariableNumber { format, default, .. } => {
            assert_eq!(format.as_deref(), Some("px"));
            assert_eq!(*default, 16.0);
        }
        _ => panic!("Expected VariableNumber"),
    }
    match &settings[5] {
        StyleSetting::VariableSelect { options, .. } => {
            assert_eq!(options.len(), 2);
            assert_eq!(options[0].label, "normal");
        }
        _ => panic!("Expected VariableSelect"),
    }
}
