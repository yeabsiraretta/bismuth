//! Canvas domain — infinite canvas document editing
//!
//! **Commands**: `commands/design/` (canvas, component, design_doc, styles, token)
//! **Services**: `services/canvas_service/` (persistence, rendering, format, templates)
//! **Models**: `models/canvas/` (document, elements, portable)

pub use crate::models::canvas::{
    CanvasDocument, CanvasElement, ComponentDefinition, ElementType, Layer, Page, Viewport,
};
pub use crate::services::canvas_service::CanvasService;
