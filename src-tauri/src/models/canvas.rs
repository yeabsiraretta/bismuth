use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CanvasDocument {
    pub id: String,
    pub name: String,
    pub vault_id: Option<String>,
    pub viewport: Viewport,
    pub grid_size: u32,
    pub snap_to_grid: bool,
    pub elements: Vec<CanvasElement>,
    pub layers: Vec<Layer>,
    pub created_at: i64,
    pub modified_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Viewport {
    pub x: f64,
    pub y: f64,
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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CanvasElement {
    pub id: String,
    pub element_type: ElementType,
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    pub rotation: f64,
    pub properties: HashMap<String, serde_json::Value>,
    pub layer_id: String,
    pub z_index: i32,
    pub locked: bool,
    pub visible: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ElementType {
    Rectangle,
    Circle,
    Text,
    Image,
    Group,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Layer {
    pub id: String,
    pub name: String,
    pub z_order: i32,
    pub visible: bool,
    pub locked: bool,
}

impl CanvasDocument {
    pub fn new(name: String) -> Self {
        let now = chrono::Utc::now().timestamp();
        let default_layer = Layer {
            id: uuid::Uuid::new_v4().to_string(),
            name: "Layer 1".to_string(),
            z_order: 0,
            visible: true,
            locked: false,
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
            created_at: now,
            modified_at: now,
        }
    }

    pub fn add_element(&mut self, element: CanvasElement) {
        self.elements.push(element);
        self.modified_at = chrono::Utc::now().timestamp();
    }

    pub fn remove_element(&mut self, element_id: &str) -> Option<CanvasElement> {
        if let Some(pos) = self.elements.iter().position(|e| e.id == element_id) {
            self.modified_at = chrono::Utc::now().timestamp();
            Some(self.elements.remove(pos))
        } else {
            None
        }
    }

    pub fn update_element(&mut self, element: CanvasElement) -> bool {
        if let Some(existing) = self.elements.iter_mut().find(|e| e.id == element.id) {
            *existing = element;
            self.modified_at = chrono::Utc::now().timestamp();
            true
        } else {
            false
        }
    }

    pub fn get_element(&self, element_id: &str) -> Option<&CanvasElement> {
        self.elements.iter().find(|e| e.id == element_id)
    }
}

impl CanvasElement {
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
        }
    }

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
        }
    }

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
