//! Canvas element types and constructors

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// A visual element placed on the canvas.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CanvasElement {
    /// Unique UUID identifier.
    pub id: String,
    /// Shape/type discriminator.
    pub element_type: ElementType,
    /// X position in canvas coordinates.
    pub x: f64,
    /// Y position in canvas coordinates.
    pub y: f64,
    /// Bounding box width.
    pub width: f64,
    /// Bounding box height.
    pub height: f64,
    /// Rotation angle in degrees.
    pub rotation: f64,
    /// Type-specific properties (fill, stroke, text, etc.).
    pub properties: HashMap<String, serde_json::Value>,
    /// ID of the layer this element belongs to.
    pub layer_id: String,
    /// Z-index within the layer (higher = on top).
    pub z_index: i32,
    /// If true, the element cannot be moved or edited.
    pub locked: bool,
    /// If false, the element is hidden from view.
    pub visible: bool,
    /// Optional parent element ID (for elements inside frames/groups).
    #[serde(default, rename = "parentId", skip_serializing_if = "Option::is_none")]
    pub parent_id: Option<String>,
    /// User-assigned display name.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
}

/// Supported canvas element shape types.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ElementType {
    Rectangle,
    Circle,
    Text,
    Image,
    Group,
    Frame,
    Line,
    Arrow,
    Pen,
    #[serde(rename = "component_instance")]
    ComponentInstance,
    Screen,
}

impl ElementType {
    /// Returns the string representation for DB storage.
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Rectangle => "rectangle",
            Self::Circle => "circle",
            Self::Text => "text",
            Self::Image => "image",
            Self::Group => "group",
            Self::Frame => "frame",
            Self::Line => "line",
            Self::Arrow => "arrow",
            Self::Pen => "pen",
            Self::ComponentInstance => "component_instance",
            Self::Screen => "screen",
        }
    }

    /// Parses from DB string representation.
    pub fn from_str(s: &str) -> Self {
        match s {
            "rectangle" => Self::Rectangle,
            "circle" => Self::Circle,
            "text" => Self::Text,
            "image" => Self::Image,
            "group" => Self::Group,
            "frame" => Self::Frame,
            "line" => Self::Line,
            "arrow" => Self::Arrow,
            "pen" => Self::Pen,
            "component_instance" => Self::ComponentInstance,
            "screen" => Self::Screen,
            _ => Self::Rectangle,
        }
    }
}

impl CanvasElement {
    /// Creates a rectangle element with default blue fill and stroke.
    pub fn new_rectangle(x: f64, y: f64, width: f64, height: f64, layer_id: String) -> Self {
        let mut properties = HashMap::new();
        properties.insert("fill".to_string(), serde_json::json!("#3b82f6"));
        properties.insert("stroke".to_string(), serde_json::json!("#1e40af"));
        properties.insert("strokeWidth".to_string(), serde_json::json!(2));
        properties.insert("opacity".to_string(), serde_json::json!(1.0));

        Self {
            id: uuid::Uuid::new_v4().to_string(),
            element_type: ElementType::Rectangle,
            x,
            y,
            width,
            height,
            rotation: 0.0,
            properties,
            layer_id,
            z_index: 0,
            locked: false,
            visible: true,
            parent_id: None,
            name: None,
        }
    }

    /// Creates a circle element with default green fill and stroke.
    pub fn new_circle(x: f64, y: f64, radius: f64, layer_id: String) -> Self {
        let mut properties = HashMap::new();
        properties.insert("fill".to_string(), serde_json::json!("#10b981"));
        properties.insert("stroke".to_string(), serde_json::json!("#059669"));
        properties.insert("strokeWidth".to_string(), serde_json::json!(2));
        properties.insert("opacity".to_string(), serde_json::json!(1.0));
        properties.insert("radius".to_string(), serde_json::json!(radius));

        Self {
            id: uuid::Uuid::new_v4().to_string(),
            element_type: ElementType::Circle,
            x,
            y,
            width: radius * 2.0,
            height: radius * 2.0,
            rotation: 0.0,
            properties,
            layer_id,
            z_index: 0,
            locked: false,
            visible: true,
            parent_id: None,
            name: None,
        }
    }

    /// Creates a text element with default font settings.
    pub fn new_text(x: f64, y: f64, text: String, layer_id: String) -> Self {
        let mut properties = HashMap::new();
        properties.insert("text".to_string(), serde_json::json!(text));
        properties.insert("fontSize".to_string(), serde_json::json!(16));
        properties.insert("fontFamily".to_string(), serde_json::json!("Inter, sans-serif"));
        properties.insert("fill".to_string(), serde_json::json!("#000000"));
        properties.insert("opacity".to_string(), serde_json::json!(1.0));

        Self {
            id: uuid::Uuid::new_v4().to_string(),
            element_type: ElementType::Text,
            x,
            y,
            width: 100.0,
            height: 24.0,
            rotation: 0.0,
            properties,
            layer_id,
            z_index: 0,
            locked: false,
            visible: true,
            parent_id: None,
            name: None,
        }
    }
}
