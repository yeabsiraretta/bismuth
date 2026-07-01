//! Component Markdown file I/O (010 Data Portability)
//!
//! Reads and writes component definitions as `.md` files with YAML frontmatter
//! and a fenced JSON code block for element data.

use crate::commands::design::component::{ComponentDefinition, ComponentProp};
use crate::error::Result;
use crate::services::frontmatter_service::FrontmatterService;
use serde_json::Value;
use std::collections::HashMap;
use std::path::Path;

/// Writes a component definition as a Markdown file with YAML frontmatter.
///
/// Format:
/// ```text
/// ---
/// title: Component Name
/// id: comp-id
/// category: buttons
/// dimensions: { width: 200, height: 48 }
/// exposedProps: [...]
/// created: 2026-01-01T00:00:00Z
/// modified: 2026-01-01T00:00:00Z
/// ---
///
/// # Component Name
///
/// Description text here.
///
/// ```json
/// { "elements": [...] }
/// ```
/// ```
pub fn write_component_md(path: &Path, component: &ComponentDefinition) -> Result<()> {
    let mut frontmatter: HashMap<String, Value> = HashMap::new();

    frontmatter.insert("title".to_string(), Value::String(component.name.clone()));
    frontmatter.insert("id".to_string(), Value::String(component.id.clone()));

    if let Some(ref cat) = component.category {
        frontmatter.insert("category".to_string(), Value::String(cat.clone()));
    }

    // Dimensions
    let mut dims = serde_json::Map::new();
    dims.insert("width".to_string(), Value::Number(serde_json::Number::from_f64(component.width).unwrap_or(serde_json::Number::from(0))));
    dims.insert("height".to_string(), Value::Number(serde_json::Number::from_f64(component.height).unwrap_or(serde_json::Number::from(0))));
    frontmatter.insert("dimensions".to_string(), Value::Object(dims));

    // Exposed props
    let props_val = serde_json::to_value(&component.exposed_props)?;
    frontmatter.insert("exposedProps".to_string(), props_val);

    // Timestamps
    let created = chrono::DateTime::from_timestamp(component.created_at, 0)
        .map(|d| d.to_rfc3339())
        .unwrap_or_default();
    let modified = chrono::DateTime::from_timestamp(component.modified_at, 0)
        .map(|d| d.to_rfc3339())
        .unwrap_or_default();
    frontmatter.insert("created".to_string(), Value::String(created));
    frontmatter.insert("modified".to_string(), Value::String(modified));

    if let Some(ref tags) = component.tags {
        let tags_val: Vec<Value> = tags.iter().map(|t| Value::String(t.clone())).collect();
        frontmatter.insert("tags".to_string(), Value::Array(tags_val));
    }

    // Build body
    let description = component.description.as_deref().unwrap_or("");
    let elements_json = serde_json::to_string_pretty(&component.elements)?;
    let body = format!(
        "# {}\n\n{}\n\n```json\n{}\n```\n",
        component.name, description, elements_json
    );

    let content = FrontmatterService::serialize(&frontmatter, &body)?;

    // Atomic write
    let tmp_path = path.with_extension("md.tmp");
    std::fs::create_dir_all(path.parent().unwrap_or(Path::new(".")))?;
    std::fs::write(&tmp_path, &content)?;
    std::fs::rename(&tmp_path, path)?;

    Ok(())
}

/// Reads a component definition from a Markdown file.
///
/// Parses YAML frontmatter for metadata and extracts the first fenced
/// JSON code block for element data.
pub fn read_component_md(path: &Path) -> Result<ComponentDefinition> {
    let content = std::fs::read_to_string(path)?;
    let (frontmatter, body) = FrontmatterService::parse(&content)?;

    let id = frontmatter
        .get("id")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();

    let name = frontmatter
        .get("title")
        .and_then(|v| v.as_str())
        .unwrap_or("Untitled")
        .to_string();

    let description = if body.contains("# ") {
        // Extract text between heading and code block
        body.lines()
            .skip_while(|l| l.starts_with('#'))
            .take_while(|l| !l.starts_with("```"))
            .collect::<Vec<_>>()
            .join("\n")
            .trim()
            .to_string()
    } else {
        String::new()
    };

    let category = frontmatter
        .get("category")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    let (width, height) = if let Some(dims) = frontmatter.get("dimensions") {
        (
            dims.get("width").and_then(|v| v.as_f64()).unwrap_or(0.0),
            dims.get("height").and_then(|v| v.as_f64()).unwrap_or(0.0),
        )
    } else {
        (0.0, 0.0)
    };

    let exposed_props: Vec<ComponentProp> = frontmatter
        .get("exposedProps")
        .and_then(|v| serde_json::from_value(v.clone()).ok())
        .unwrap_or_default();

    let tags: Option<Vec<String>> = frontmatter
        .get("tags")
        .and_then(|v| serde_json::from_value(v.clone()).ok());

    let created_at = frontmatter
        .get("created")
        .and_then(|v| v.as_str())
        .and_then(|s| chrono::DateTime::parse_from_rfc3339(s).ok())
        .map(|d| d.timestamp())
        .unwrap_or(0);

    let modified_at = frontmatter
        .get("modified")
        .and_then(|v| v.as_str())
        .and_then(|s| chrono::DateTime::parse_from_rfc3339(s).ok())
        .map(|d| d.timestamp())
        .unwrap_or(0);

    // Extract JSON from first fenced code block
    let elements: Vec<Value> = extract_json_block(&body)
        .and_then(|json_str| serde_json::from_str(&json_str).ok())
        .unwrap_or_default();

    let thumbnail = frontmatter
        .get("thumbnail")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    Ok(ComponentDefinition {
        id,
        name,
        description: if description.is_empty() { None } else { Some(description) },
        category,
        elements,
        exposed_props,
        width,
        height,
        thumbnail,
        tags,
        created_at,
        modified_at,
    })
}

/// Extracts the content of the first fenced JSON code block from markdown body.
fn extract_json_block(body: &str) -> Option<String> {
    let mut in_block = false;
    let mut json_lines = Vec::new();

    for line in body.lines() {
        if !in_block && (line.trim() == "```json" || line.trim() == "``` json") {
            in_block = true;
            continue;
        }
        if in_block {
            if line.trim() == "```" {
                break;
            }
            json_lines.push(line);
        }
    }

    if json_lines.is_empty() {
        None
    } else {
        Some(json_lines.join("\n"))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_component() -> ComponentDefinition {
        ComponentDefinition {
            id: "btn-primary".to_string(),
            name: "Primary Button".to_string(),
            description: Some("A standard primary button".to_string()),
            category: Some("buttons".to_string()),
            elements: vec![serde_json::json!({
                "id": "bg",
                "type": "rectangle",
                "width": 200,
                "height": 48
            })],
            exposed_props: vec![ComponentProp {
                key: "label".to_string(),
                label: "Label".to_string(),
                prop_type: "string".to_string(),
                default_value: Value::String("Click me".to_string()),
            }],
            width: 200.0,
            height: 48.0,
            thumbnail: None,
            tags: Some(vec!["ui".to_string(), "button".to_string()]),
            created_at: 1718000000,
            modified_at: 1718000000,
        }
    }

    #[test]
    fn test_write_and_read_component_md() {
        let tmp = tempfile::TempDir::new().unwrap();
        let file_path = tmp.path().join("Button.md");

        let original = sample_component();
        write_component_md(&file_path, &original).unwrap();

        assert!(file_path.exists());
        let content = std::fs::read_to_string(&file_path).unwrap();
        assert!(content.contains("title: Primary Button") || content.contains("title: \"Primary Button\""));
        assert!(content.contains("```json"));

        let loaded = read_component_md(&file_path).unwrap();
        assert_eq!(loaded.id, "btn-primary");
        assert_eq!(loaded.name, "Primary Button");
        assert_eq!(loaded.category, Some("buttons".to_string()));
        assert_eq!(loaded.elements.len(), 1);
        assert_eq!(loaded.exposed_props.len(), 1);
    }

    #[test]
    fn test_roundtrip_preserves_metadata() {
        let tmp = tempfile::TempDir::new().unwrap();
        let file_path = tmp.path().join("test.md");

        let original = sample_component();
        write_component_md(&file_path, &original).unwrap();
        let loaded = read_component_md(&file_path).unwrap();

        assert_eq!(loaded.width, 200.0);
        assert_eq!(loaded.height, 48.0);
        assert_eq!(loaded.tags, Some(vec!["ui".to_string(), "button".to_string()]));
    }
}
