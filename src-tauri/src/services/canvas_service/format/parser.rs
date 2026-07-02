//! Standard .canvas JSON format parser.
//!
//! Parses canvas files into structured node/edge data with metadata support.

use serde::{Deserialize, Serialize};
use std::path::Path;
use crate::error::{BismuthError, Result};

/// A canvas document in the standard .canvas JSON format.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CanvasDocument {
    pub nodes: Vec<CanvasNode>,
    pub edges: Vec<CanvasEdge>,
    #[serde(default)]
    pub metadata: CanvasMetadata,
}

/// A node in the canvas.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CanvasNode {
    pub id: String,
    #[serde(rename = "type")]
    pub node_type: String,
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    #[serde(default)]
    pub text: Option<String>,
    #[serde(default)]
    pub file: Option<String>,
    #[serde(default)]
    pub url: Option<String>,
    #[serde(default)]
    pub color: Option<String>,
    #[serde(default, rename = "styleAttributes")]
    pub style_attributes: Option<serde_json::Value>,
}

/// An edge between two nodes.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CanvasEdge {
    pub id: String,
    #[serde(rename = "fromNode")]
    pub from_node: String,
    #[serde(rename = "toNode")]
    pub to_node: String,
    #[serde(default, rename = "fromSide")]
    pub from_side: Option<String>,
    #[serde(default, rename = "toSide")]
    pub to_side: Option<String>,
    #[serde(default)]
    pub label: Option<String>,
    #[serde(default)]
    pub color: Option<String>,
}

/// Canvas-level metadata.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct CanvasMetadata {
    #[serde(default)]
    pub version: Option<String>,
    #[serde(default)]
    pub created: Option<String>,
    #[serde(default)]
    pub modified: Option<String>,
}

/// Parse a .canvas JSON file into a CanvasDocument.
pub fn parse_canvas_file(path: &Path) -> Result<CanvasDocument> {
    let content = std::fs::read_to_string(path)
        .map_err(|e| BismuthError::Io(format!("Read canvas file: {}", e)))?;
    parse_canvas_json(&content)
}

/// Parse canvas JSON string.
pub fn parse_canvas_json(json: &str) -> Result<CanvasDocument> {
    serde_json::from_str(json)
        .map_err(|e| BismuthError::ParseError(format!("Invalid canvas JSON: {}", e)))
}

/// Serialize a canvas document back to JSON.
pub fn serialize_canvas(doc: &CanvasDocument) -> Result<String> {
    serde_json::to_string_pretty(doc)
        .map_err(|e| BismuthError::Io(format!("Serialize canvas: {}", e)))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_minimal_canvas() {
        let json = r#"{"nodes":[],"edges":[]}"#;
        let doc = parse_canvas_json(json).unwrap();
        assert!(doc.nodes.is_empty());
        assert!(doc.edges.is_empty());
    }

    #[test]
    fn test_parse_with_nodes() {
        let json = r#"{
            "nodes": [
                {"id":"1","type":"text","x":0,"y":0,"width":200,"height":100,"text":"Hello"}
            ],
            "edges": []
        }"#;
        let doc = parse_canvas_json(json).unwrap();
        assert_eq!(doc.nodes.len(), 1);
        assert_eq!(doc.nodes[0].text.as_deref(), Some("Hello"));
    }

    #[test]
    fn test_round_trip() {
        let json = r#"{"nodes":[{"id":"1","type":"text","x":0.0,"y":0.0,"width":200.0,"height":100.0}],"edges":[],"metadata":{}}"#;
        let doc = parse_canvas_json(json).unwrap();
        let output = serialize_canvas(&doc).unwrap();
        let reparsed = parse_canvas_json(&output).unwrap();
        assert_eq!(reparsed.nodes.len(), 1);
    }
}
