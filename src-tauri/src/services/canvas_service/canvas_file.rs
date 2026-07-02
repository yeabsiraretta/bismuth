//! Canvas file I/O (JSON Canvas format)
//!
//! Reads and writes `.canvas` files in the JSON Canvas open spec format.
//! Converts between Bismuth's internal `CanvasDocument` model and the
//! portable `PortableCanvas` file format.

use crate::error::Result;
use crate::models::canvas::{
    CanvasDocument, CanvasElement, ElementType, PortableCanvas, PortableEdge, PortableNode,
    BismuthNodeExtension, FlowLink,
};
use std::path::Path;

/// Writes a canvas document to a `.canvas` JSON file.
///
/// Uses atomic write (temp file + rename) for crash safety.
/// The path must be within the vault boundary (caller enforces).
pub fn write_canvas_file(path: &Path, canvas: &CanvasDocument) -> Result<()> {
    let portable = document_to_portable(canvas);
    let json = serde_json::to_string_pretty(&portable)?;

    // Atomic write: temp file then rename
    let tmp_path = path.with_extension("canvas.tmp");
    std::fs::create_dir_all(path.parent().unwrap_or(Path::new(".")))?;
    std::fs::write(&tmp_path, &json)?;
    std::fs::rename(&tmp_path, path)?;

    Ok(())
}

/// Reads a `.canvas` JSON file and converts to a CanvasDocument.
///
/// Returns an error if the file doesn't exist or has invalid JSON.
pub fn read_canvas_file(path: &Path) -> Result<CanvasDocument> {
    let content = std::fs::read_to_string(path)?;
    let portable: PortableCanvas = serde_json::from_str(&content)?;

    let name = path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("Untitled")
        .to_string();

    Ok(portable_to_document(&portable, &name))
}

/// Converts a Bismuth CanvasDocument to the portable JSON Canvas format.
pub fn document_to_portable(canvas: &CanvasDocument) -> PortableCanvas {
    let nodes: Vec<PortableNode> = canvas
        .elements
        .iter()
        .map(|el| element_to_node(el))
        .collect();

    // Convert arrow/line elements that connect two elements into edges
    let edges: Vec<PortableEdge> = canvas
        .elements
        .iter()
        .filter_map(|el| element_to_edge(el))
        .collect();

    // Serialize flow links as a Bismuth extension array
    let bismuth_flow_links: Vec<serde_json::Value> = canvas
        .flow_links
        .iter()
        .filter_map(|fl| serde_json::to_value(fl).ok())
        .collect();

    PortableCanvas { nodes, edges, bismuth_flow_links }
}

/// Converts a portable JSON Canvas back to a Bismuth CanvasDocument.
pub fn portable_to_document(portable: &PortableCanvas, name: &str) -> CanvasDocument {
    let now = chrono::Utc::now().timestamp();
    let default_layer_id = uuid::Uuid::new_v4().to_string();

    let elements: Vec<CanvasElement> = portable
        .nodes
        .iter()
        .map(|node| node_to_element(node, &default_layer_id))
        .collect();

    let mut canvas = CanvasDocument::new(name.to_string());
    canvas.elements = elements;

    // Restore flow links from Bismuth extension field
    canvas.flow_links = portable
        .bismuth_flow_links
        .iter()
        .filter_map(|v| serde_json::from_value::<FlowLink>(v.clone()).ok())
        .collect();

    // Override layer ID to match what we assigned
    if let Some(layer) = canvas.layers.first_mut() {
        layer.id = default_layer_id;
    }
    canvas.created_at = now;
    canvas.modified_at = now;

    canvas
}

/// Maps a CanvasElement to a PortableNode.
fn element_to_node(el: &CanvasElement) -> PortableNode {
    let node_type = match &el.element_type {
        ElementType::Text => "text",
        ElementType::Image => "file",
        ElementType::Frame | ElementType::Group => "group",
        _ => "text", // Default to text for shapes without a direct canvas spec mapping
    };

    let text = el
        .properties
        .get("text")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    let file = el
        .properties
        .get("src")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    let color = el
        .properties
        .get("fill")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    PortableNode {
        id: el.id.clone(),
        node_type: node_type.to_string(),
        x: el.x,
        y: el.y,
        width: el.width,
        height: el.height,
        text,
        file,
        url: None,
        color,
        label: el.name.clone(),
        bismuth: Some(BismuthNodeExtension {
            element_type: Some(el.element_type.as_str().to_string()),
            layer_id: Some(el.layer_id.clone()),
            z_index: Some(el.z_index),
            rotation: if el.rotation != 0.0 { Some(el.rotation) } else { None },
            locked: if el.locked { Some(true) } else { None },
            properties: if el.properties.is_empty() {
                None
            } else {
                Some(el.properties.clone())
            },
        }),
    }
}

/// Checks if an element represents an edge (arrow/line with connections).
fn element_to_edge(el: &CanvasElement) -> Option<PortableEdge> {
    if !matches!(el.element_type, ElementType::Arrow | ElementType::Line) {
        return None;
    }

    let from = el.properties.get("startElementId")?.as_str()?;
    let to = el.properties.get("endElementId")?.as_str()?;

    Some(PortableEdge {
        id: el.id.clone(),
        from_node: from.to_string(),
        to_node: to.to_string(),
        label: el.name.clone(),
    })
}

/// Maps a PortableNode back to a CanvasElement.
fn node_to_element(node: &PortableNode, default_layer_id: &str) -> CanvasElement {
    let (element_type, layer_id, z_index, rotation, locked, properties) =
        if let Some(ref ext) = node.bismuth {
            (
                ext.element_type
                    .as_deref()
                    .map(ElementType::from_str)
                    .unwrap_or_else(|| type_from_node_type(&node.node_type)),
                ext.layer_id
                    .clone()
                    .unwrap_or_else(|| default_layer_id.to_string()),
                ext.z_index.unwrap_or(0),
                ext.rotation.unwrap_or(0.0),
                ext.locked.unwrap_or(false),
                ext.properties.clone().unwrap_or_default(),
            )
        } else {
            let mut props = std::collections::HashMap::new();
            if let Some(ref text) = node.text {
                props.insert("text".to_string(), serde_json::Value::String(text.clone()));
            }
            if let Some(ref file) = node.file {
                props.insert("src".to_string(), serde_json::Value::String(file.clone()));
            }
            if let Some(ref color) = node.color {
                props.insert("fill".to_string(), serde_json::Value::String(color.clone()));
            }
            (
                type_from_node_type(&node.node_type),
                default_layer_id.to_string(),
                0,
                0.0,
                false,
                props,
            )
        };

    CanvasElement {
        id: node.id.clone(),
        element_type,
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
        rotation,
        properties,
        layer_id,
        z_index,
        locked,
        visible: true,
        parent_id: None,
        name: node.label.clone(),
    }
}

/// Maps JSON Canvas node type string to Bismuth ElementType.
fn type_from_node_type(node_type: &str) -> ElementType {
    match node_type {
        "text" => ElementType::Text,
        "file" => ElementType::Image,
        "group" => ElementType::Group,
        "link" => ElementType::Text,
        _ => ElementType::Rectangle,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::canvas::CanvasElement;

    #[test]
    fn test_write_and_read_canvas_file() {
        let tmp = tempfile::TempDir::new().unwrap();
        let file_path = tmp.path().join("test.canvas");

        let mut canvas = CanvasDocument::new("Test".to_string());
        let layer_id = canvas.layers[0].id.clone();
        let element = CanvasElement::new_rectangle(10.0, 20.0, 100.0, 50.0, layer_id);
        canvas.add_element(element);

        write_canvas_file(&file_path, &canvas).unwrap();
        assert!(file_path.exists());

        let loaded = read_canvas_file(&file_path).unwrap();
        assert_eq!(loaded.elements.len(), 1);
        assert_eq!(loaded.elements[0].x, 10.0);
        assert_eq!(loaded.elements[0].y, 20.0);
    }

    #[test]
    fn test_roundtrip_preserves_properties() {
        let tmp = tempfile::TempDir::new().unwrap();
        let file_path = tmp.path().join("roundtrip.canvas");

        let mut canvas = CanvasDocument::new("Roundtrip".to_string());
        let layer_id = canvas.layers[0].id.clone();
        let mut el = CanvasElement::new_rectangle(0.0, 0.0, 200.0, 100.0, layer_id);
        el.rotation = 45.0;
        el.locked = true;
        canvas.add_element(el);

        write_canvas_file(&file_path, &canvas).unwrap();
        let loaded = read_canvas_file(&file_path).unwrap();

        assert_eq!(loaded.elements[0].rotation, 45.0);
        assert!(loaded.elements[0].locked);
    }

    #[test]
    fn test_file_is_valid_json() {
        let tmp = tempfile::TempDir::new().unwrap();
        let file_path = tmp.path().join("valid.canvas");

        let canvas = CanvasDocument::new("JSON Test".to_string());
        write_canvas_file(&file_path, &canvas).unwrap();

        let content = std::fs::read_to_string(&file_path).unwrap();
        let _: serde_json::Value = serde_json::from_str(&content).unwrap();
        assert!(content.contains("\"nodes\""));
        assert!(content.contains("\"edges\""));
    }

    #[test]
    fn test_flow_links_roundtrip() {
        let tmp = tempfile::TempDir::new().unwrap();
        let file_path = tmp.path().join("flow.canvas");

        let mut canvas = CanvasDocument::new("Flow Test".to_string());
        canvas.flow_links = vec![
            FlowLink {
                id: "fl-1".to_string(),
                from_frame_id: "frame-a".to_string(),
                to_frame_id: "frame-b".to_string(),
                hotspot_element_id: None,
                transition: crate::models::canvas::FlowTransition {
                    transition_type: "dissolve".to_string(),
                    duration: 300,
                },
                label: Some("Next".to_string()),
            },
        ];

        write_canvas_file(&file_path, &canvas).unwrap();
        let loaded = read_canvas_file(&file_path).unwrap();

        assert_eq!(loaded.flow_links.len(), 1);
        assert_eq!(loaded.flow_links[0].id, "fl-1");
        assert_eq!(loaded.flow_links[0].from_frame_id, "frame-a");
        assert_eq!(loaded.flow_links[0].to_frame_id, "frame-b");
        assert_eq!(loaded.flow_links[0].transition.transition_type, "dissolve");
        assert_eq!(loaded.flow_links[0].label.as_deref(), Some("Next"));
    }

    #[test]
    fn test_empty_flow_links_not_serialized() {
        let tmp = tempfile::TempDir::new().unwrap();
        let file_path = tmp.path().join("no-flow.canvas");
        let canvas = CanvasDocument::new("No Flow".to_string());
        write_canvas_file(&file_path, &canvas).unwrap();
        let content = std::fs::read_to_string(&file_path).unwrap();
        assert!(!content.contains("bismuthFlowLinks"));
    }
}
