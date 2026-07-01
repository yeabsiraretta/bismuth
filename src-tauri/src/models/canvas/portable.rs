//! Portable canvas types (JSON Canvas open spec)
//!
//! Defines the file format for `.canvas` files following the JSON Canvas
//! specification (jsoncanvas.org). These types serialize/deserialize to
//! the standard format for interoperability with other tools.

use serde::{Deserialize, Serialize};

/// A portable canvas document in JSON Canvas format.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PortableCanvas {
    /// All nodes (visual elements) on the canvas.
    #[serde(default)]
    pub nodes: Vec<PortableNode>,
    /// All edges (connections) between nodes.
    #[serde(default)]
    pub edges: Vec<PortableEdge>,
    /// Bismuth flow links (spec 004) — stored as a Bismuth extension field.
    #[serde(default, skip_serializing_if = "Vec::is_empty", rename = "bismuthFlowLinks")]
    pub bismuth_flow_links: Vec<serde_json::Value>,
}

/// A node in the JSON Canvas format.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PortableNode {
    /// Unique node identifier.
    pub id: String,
    /// Node type discriminator.
    #[serde(rename = "type")]
    pub node_type: String,
    /// X position.
    pub x: f64,
    /// Y position.
    pub y: f64,
    /// Width.
    pub width: f64,
    /// Height.
    pub height: f64,
    /// Text content (for text nodes).
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub text: Option<String>,
    /// File path (for file nodes, relative to vault root).
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub file: Option<String>,
    /// URL (for link nodes).
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
    /// Background color.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub color: Option<String>,
    /// Display label.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub label: Option<String>,
    /// Extended properties (Bismuth-specific, non-standard).
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub bismuth: Option<BismuthNodeExtension>,
}

/// Bismuth-specific extension data stored alongside standard fields.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BismuthNodeExtension {
    /// Original element type in Bismuth's type system.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub element_type: Option<String>,
    /// Layer ID.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub layer_id: Option<String>,
    /// Z-index.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub z_index: Option<i32>,
    /// Rotation.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub rotation: Option<f64>,
    /// Whether element is locked.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub locked: Option<bool>,
    /// Type-specific properties.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub properties: Option<std::collections::HashMap<String, serde_json::Value>>,
}

/// An edge (connection) between two nodes.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PortableEdge {
    /// Unique edge identifier.
    pub id: String,
    /// Source node ID.
    #[serde(rename = "fromNode")]
    pub from_node: String,
    /// Target node ID.
    #[serde(rename = "toNode")]
    pub to_node: String,
    /// Optional label.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub label: Option<String>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_serialize_portable_canvas() {
        let canvas = PortableCanvas {
            nodes: vec![
                PortableNode {
                    id: "abc".to_string(),
                    node_type: "text".to_string(),
                    x: 100.0,
                    y: 200.0,
                    width: 300.0,
                    height: 200.0,
                    text: Some("Hello world".to_string()),
                    file: None,
                    url: None,
                    color: None,
                    label: None,
                    bismuth: None,
                },
            ],
            edges: vec![],
            bismuth_flow_links: vec![],
        };

        let json = serde_json::to_string_pretty(&canvas).unwrap();
        assert!(json.contains("\"type\": \"text\""));
        assert!(json.contains("\"text\": \"Hello world\""));
    }

    #[test]
    fn test_deserialize_portable_canvas() {
        let json = r#"{
            "nodes": [
                { "id": "n1", "type": "file", "x": 0, "y": 0, "width": 200, "height": 100, "file": "notes/test.md" }
            ],
            "edges": [
                { "id": "e1", "fromNode": "n1", "toNode": "n2" }
            ]
        }"#;

        let canvas: PortableCanvas = serde_json::from_str(json).unwrap();
        assert_eq!(canvas.nodes.len(), 1);
        assert_eq!(canvas.nodes[0].file.as_deref(), Some("notes/test.md"));
        assert_eq!(canvas.edges.len(), 1);
        assert_eq!(canvas.edges[0].from_node, "n1");
    }

    #[test]
    fn test_roundtrip_portable_canvas() {
        let canvas = PortableCanvas {
            nodes: vec![PortableNode {
                id: "test".to_string(),
                node_type: "text".to_string(),
                x: 50.0,
                y: 75.0,
                width: 150.0,
                height: 100.0,
                text: Some("Content".to_string()),
                file: None,
                url: None,
                color: Some("#ff0000".to_string()),
                label: Some("My Node".to_string()),
                bismuth: Some(BismuthNodeExtension {
                    element_type: Some("rectangle".to_string()),
                    layer_id: Some("layer1".to_string()),
                    z_index: Some(5),
                    rotation: Some(45.0),
                    locked: Some(false),
                    properties: None,
                }),
            }],
            edges: vec![],
            bismuth_flow_links: vec![],
        };

        let json = serde_json::to_string(&canvas).unwrap();
        let restored: PortableCanvas = serde_json::from_str(&json).unwrap();
        assert_eq!(restored.nodes[0].id, "test");
        assert_eq!(restored.nodes[0].bismuth.as_ref().unwrap().rotation, Some(45.0));
    }
}
