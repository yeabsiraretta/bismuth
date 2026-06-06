//! Canvas document, viewport, layer, page, and component definition types

use serde::{Deserialize, Serialize};

use super::elements::CanvasElement;

/// A canvas document containing layers and elements.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CanvasDocument {
    /// Unique UUID identifier.
    pub id: String,
    /// Display name.
    pub name: String,
    /// Associated vault ID (optional).
    pub vault_id: Option<String>,
    /// Associated note path (links canvas to a specific note).
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub note_id: Option<String>,
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
            note_id: None,
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
