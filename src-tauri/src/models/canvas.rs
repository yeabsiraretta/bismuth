//! Infinite canvas data model (FR-013)
//!
//! Defines the document, element, and layer structures persisted
//! by [`CanvasService`](crate::services::canvas_service::CanvasService).

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// A canvas document containing layers and elements.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CanvasDocument {
    /// Unique UUID identifier.
    pub id: String,
    /// Display name.
    pub name: String,
    /// Associated vault ID (optional).
    pub vault_id: Option<String>,
    /// Current viewport pan/zoom state.
    pub viewport: Viewport,
    /// Grid cell size in pixels.
    pub grid_size: u32,
    /// Whether elements snap to the grid.
    pub snap_to_grid: bool,
    /// All elements on this canvas.
    pub elements: Vec<CanvasElement>,
    /// Layer stack (bottom to top by `z_order`).
    pub layers: Vec<Layer>,
    /// Multi-page support.
    #[serde(default)]
    pub pages: Vec<Page>,
    /// Currently active page ID.
    #[serde(default, rename = "activePageId")]
    pub active_page_id: String,
    /// Reusable component definitions.
    #[serde(default)]
    pub components: Vec<ComponentDefinition>,
    /// Unix timestamp of creation.
    pub created_at: i64,
    /// Unix timestamp of last modification.
    pub modified_at: i64,
}

/// Camera viewport state (pan + zoom).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Viewport {
    /// Horizontal offset in canvas coordinates.
    pub x: f64,
    /// Vertical offset in canvas coordinates.
    pub y: f64,
    /// Zoom level (1.0 = 100%).
    pub scale: f64,
}

impl Default for Viewport {
    fn default() -> Self {
        Self {
            x: 0.0,
            y: 0.0,
            scale: 1.0,
        }
    }
}

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

/// A layer in the canvas stacking order.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Layer {
    /// Unique UUID identifier.
    pub id: String,
    /// Display name.
    pub name: String,
    /// Stack order (lower = further back).
    pub z_order: i32,
    /// Whether this layer is rendered.
    pub visible: bool,
    /// Whether elements on this layer are selectable.
    pub locked: bool,
}

/// A page within a canvas document.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Page {
    /// Unique page ID.
    pub id: String,
    /// Display name.
    pub name: String,
    /// Sort order.
    pub order: i32,
    /// Element IDs belonging to this page.
    #[serde(default)]
    pub elements: Vec<String>,
    /// Optional background color.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub background: Option<String>,
}

/// A reusable component definition (symbol).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComponentDefinition {
    /// Unique component ID.
    pub id: String,
    /// Display name.
    pub name: String,
    /// Optional description.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    /// Optional category for organization.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub category: Option<String>,
    /// The master element tree for this component.
    pub elements: Vec<CanvasElement>,
    /// Exposed props that instances can override.
    #[serde(default, rename = "exposedProps")]
    pub exposed_props: Vec<ComponentProp>,
    /// Component width.
    pub width: f64,
    /// Component height.
    pub height: f64,
    /// Unix timestamp of creation.
    pub created_at: i64,
    /// Unix timestamp of last modification.
    pub modified_at: i64,
}

/// A property exposed by a component for override.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComponentProp {
    /// Property key.
    pub key: String,
    /// Display label.
    pub label: String,
    /// Value type.
    #[serde(rename = "type")]
    pub prop_type: String,
    /// Default value.
    #[serde(rename = "defaultValue")]
    pub default_value: serde_json::Value,
}

impl CanvasDocument {
    /// Creates a new blank canvas with a single default layer.
    pub fn new(name: String) -> Self {
        let now = chrono::Utc::now().timestamp();
        let default_layer = Layer {
            id: uuid::Uuid::new_v4().to_string(),
            name: "Layer 1".to_string(),
            z_order: 0,
            visible: true,
            locked: false,
        };

        let page_id = uuid::Uuid::new_v4().to_string();
        let default_page = Page {
            id: page_id.clone(),
            name: "Page 1".to_string(),
            order: 1,
            elements: Vec::new(),
            background: None,
        };

        Self {
            id: uuid::Uuid::new_v4().to_string(),
            name,
            vault_id: None,
            viewport: Viewport::default(),
            grid_size: 16,
            snap_to_grid: true,
            elements: Vec::new(),
            layers: vec![default_layer],
            pages: vec![default_page],
            active_page_id: page_id,
            components: Vec::new(),
            created_at: now,
            modified_at: now,
        }
    }

    /// Adds an element to the canvas and updates `modified_at`.
    pub fn add_element(&mut self, element: CanvasElement) {
        self.elements.push(element);
        self.modified_at = chrono::Utc::now().timestamp();
    }

    /// Removes an element by ID. Returns the removed element or `None`.
    pub fn remove_element(&mut self, element_id: &str) -> Option<CanvasElement> {
        if let Some(pos) = self.elements.iter().position(|e| e.id == element_id) {
            self.modified_at = chrono::Utc::now().timestamp();
            Some(self.elements.remove(pos))
        } else {
            None
        }
    }

    /// Replaces an element by ID. Returns `true` if found and updated.
    pub fn update_element(&mut self, element: CanvasElement) -> bool {
        if let Some(existing) = self.elements.iter_mut().find(|e| e.id == element.id) {
            *existing = element;
            self.modified_at = chrono::Utc::now().timestamp();
            true
        } else {
            false
        }
    }

    /// Looks up an element by ID.
    pub fn get_element(&self, element_id: &str) -> Option<&CanvasElement> {
        self.elements.iter().find(|e| e.id == element_id)
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_canvas_document() {
        let canvas = CanvasDocument::new("Test Canvas".to_string());
        assert_eq!(canvas.name, "Test Canvas");
        assert_eq!(canvas.layers.len(), 1);
        assert_eq!(canvas.elements.len(), 0);
        assert_eq!(canvas.grid_size, 16);
        assert!(canvas.snap_to_grid);
    }

    #[test]
    fn test_add_element() {
        let mut canvas = CanvasDocument::new("Test".to_string());
        let layer_id = canvas.layers[0].id.clone();
        let element = CanvasElement::new_rectangle(0.0, 0.0, 100.0, 50.0, layer_id);
        
        canvas.add_element(element.clone());
        assert_eq!(canvas.elements.len(), 1);
        assert_eq!(canvas.elements[0].id, element.id);
    }

    #[test]
    fn test_remove_element() {
        let mut canvas = CanvasDocument::new("Test".to_string());
        let layer_id = canvas.layers[0].id.clone();
        let element = CanvasElement::new_rectangle(0.0, 0.0, 100.0, 50.0, layer_id);
        let element_id = element.id.clone();
        
        canvas.add_element(element);
        assert_eq!(canvas.elements.len(), 1);
        
        let removed = canvas.remove_element(&element_id);
        assert!(removed.is_some());
        assert_eq!(canvas.elements.len(), 0);
    }

    #[test]
    fn test_create_rectangle() {
        let element = CanvasElement::new_rectangle(10.0, 20.0, 100.0, 50.0, "layer1".to_string());
        assert_eq!(element.element_type, ElementType::Rectangle);
        assert_eq!(element.x, 10.0);
        assert_eq!(element.y, 20.0);
        assert_eq!(element.width, 100.0);
        assert_eq!(element.height, 50.0);
        assert!(element.properties.contains_key("fill"));
    }
}
