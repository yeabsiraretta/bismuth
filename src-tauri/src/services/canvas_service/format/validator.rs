//! Canvas format schema validation and sanitization.
//!
//! Rejects malformed documents and sanitizes text content (XSS prevention).

use super::parser::{CanvasDocument, CanvasNode};
use crate::error::{BismuthError, Result};

/// Maximum allowed nodes in a single canvas for safety.
const MAX_NODES: usize = 5000;
/// Maximum allowed edges.
const MAX_EDGES: usize = 10000;
/// Maximum text content length per node.
const MAX_TEXT_LENGTH: usize = 100_000;

/// Validate a canvas document against schema constraints.
pub fn validate_canvas(doc: &CanvasDocument) -> Result<()> {
    if doc.nodes.len() > MAX_NODES {
        return Err(BismuthError::Validation(
            format!("Too many nodes: {} (max {})", doc.nodes.len(), MAX_NODES),
        ));
    }
    if doc.edges.len() > MAX_EDGES {
        return Err(BismuthError::Validation(
            format!("Too many edges: {} (max {})", doc.edges.len(), MAX_EDGES),
        ));
    }

    for node in &doc.nodes {
        validate_node(node)?;
    }

    // Validate edge references
    let node_ids: std::collections::HashSet<&str> = doc.nodes.iter().map(|n| n.id.as_str()).collect();
    for edge in &doc.edges {
        if !node_ids.contains(edge.from_node.as_str()) {
            return Err(BismuthError::Validation(
                format!("Edge references non-existent fromNode: {}", edge.from_node),
            ));
        }
        if !node_ids.contains(edge.to_node.as_str()) {
            return Err(BismuthError::Validation(
                format!("Edge references non-existent toNode: {}", edge.to_node),
            ));
        }
    }

    Ok(())
}

fn validate_node(node: &CanvasNode) -> Result<()> {
    if node.id.is_empty() {
        return Err(BismuthError::Validation("Node has empty ID".to_string()));
    }
    if let Some(text) = &node.text {
        if text.len() > MAX_TEXT_LENGTH {
            return Err(BismuthError::Validation(
                format!("Node text too long: {} bytes (max {})", text.len(), MAX_TEXT_LENGTH),
            ));
        }
    }
    if node.width <= 0.0 || node.height <= 0.0 {
        return Err(BismuthError::Validation(
            format!("Node {} has invalid dimensions", node.id),
        ));
    }
    Ok(())
}

/// Sanitize text content in all nodes (remove script tags, event handlers).
pub fn sanitize_canvas(doc: &mut CanvasDocument) {
    for node in &mut doc.nodes {
        if let Some(ref mut text) = node.text {
            *text = sanitize_text(text);
        }
    }
    for edge in &mut doc.edges {
        if let Some(ref mut label) = edge.label {
            *label = sanitize_text(label);
        }
    }
}

/// Remove potentially dangerous HTML from text content.
fn sanitize_text(input: &str) -> String {
    input
        .replace("<script", "&lt;script")
        .replace("</script", "&lt;/script")
        .replace("javascript:", "")
        .replace("onerror=", "")
        .replace("onload=", "")
        .replace("onclick=", "")
}

#[cfg(test)]
mod tests {
    use super::*;
    use super::super::parser::{CanvasDocument, CanvasNode, CanvasEdge, CanvasMetadata};

    fn make_node(id: &str) -> CanvasNode {
        CanvasNode {
            id: id.to_string(),
            node_type: "text".to_string(),
            x: 0.0, y: 0.0, width: 100.0, height: 50.0,
            text: None, file: None, url: None, color: None,
            style_attributes: None,
        }
    }

    #[test]
    fn test_validate_empty_canvas() {
        let doc = CanvasDocument { nodes: vec![], edges: vec![], metadata: CanvasMetadata::default() };
        assert!(validate_canvas(&doc).is_ok());
    }

    #[test]
    fn test_validate_invalid_edge_ref() {
        let doc = CanvasDocument {
            nodes: vec![make_node("1")],
            edges: vec![CanvasEdge {
                id: "e1".to_string(),
                from_node: "1".to_string(),
                to_node: "nonexistent".to_string(),
                from_side: None, to_side: None, label: None, color: None,
            }],
            metadata: CanvasMetadata::default(),
        };
        assert!(validate_canvas(&doc).is_err());
    }

    #[test]
    fn test_sanitize_script() {
        let result = sanitize_text("<script>alert('xss')</script>");
        assert!(!result.contains("<script"));
    }
}
