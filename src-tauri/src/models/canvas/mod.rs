//! Infinite canvas data model (FR-013)
//!
//! Defines the document, element, and layer structures persisted
//! by [`CanvasService`](crate::services::canvas_service::CanvasService).

pub mod document;
pub mod elements;
pub mod portable;

pub use document::*;
pub use elements::*;
pub use portable::*;

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
