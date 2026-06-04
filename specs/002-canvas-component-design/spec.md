# Feature Specification: Canvas Component Design Tool

**Feature ID**: `002-canvas-component-design`  
**Priority**: P2 (Enhancement)  
**Status**: Draft  
**Created**: 2026-05-26  
**Dependencies**: 001-bismuth-pkm-editor (Phase 1-5 complete)

---

## Overview

Add an infinite canvas workspace to Bismuth that enables visual component design, UI prototyping, and spatial organization of design artifacts. This canvas will integrate with the existing note system, allowing designers and developers to create, arrange, and export component designs that can be used in Bismuth's development.

## User Stories

### US28: Infinite Canvas Workspace (P2)
**As a** designer/developer  
**I want** an infinite canvas where I can visually design UI components  
**So that** I can prototype and organize Bismuth's interface components spatially

**Acceptance Criteria:**
- Canvas supports pan and zoom (mouse wheel, trackpad gestures)
- Canvas is infinite in all directions with no boundaries
- Grid overlay with snap-to-grid option (configurable 8px/16px/24px)
- Minimap shows current viewport position
- Canvas state persists per vault in `.bismuth/canvas/`

### US29: Component Creation & Editing (P2)
**As a** designer  
**I want** to create and edit visual components on the canvas  
**So that** I can design UI elements with precise control

**Acceptance Criteria:**
- Create rectangles, circles, text boxes, images
- Edit properties: size, position, color, border, opacity
- Layer management (bring to front, send to back, reorder)
- Group/ungroup elements
- Copy/paste/duplicate elements
- Undo/redo support (Cmd+Z, Cmd+Shift+Z)

### US30: Component Library Integration (P2)
**As a** developer  
**I want** to export canvas designs as Svelte components  
**So that** I can use designed components directly in Bismuth

**Acceptance Criteria:**
- Export selected elements as Svelte component code
- Generate TypeScript interfaces for component props
- Export as PNG/SVG for documentation
- Save component templates to library
- Import existing components onto canvas

### US31: Collaborative Annotations (P3)
**As a** team member  
**I want** to add comments and annotations to canvas designs  
**So that** I can provide feedback and document design decisions

**Acceptance Criteria:**
- Add sticky notes with markdown support
- Draw arrows connecting elements
- Add measurement guides and rulers
- Comment threads linked to specific elements
- Export annotated designs as images

---

## Technical Architecture

### Frontend Components

```
src/lib/components/canvas/
├── CanvasWorkspace.svelte       # Main canvas container
├── CanvasToolbar.svelte         # Tool selection (select, rectangle, circle, text, etc.)
├── CanvasElement.svelte         # Base component for canvas elements
├── CanvasGrid.svelte            # Grid overlay
├── CanvasMinimap.svelte         # Minimap navigation
├── PropertyPanel.svelte         # Element property editor
├── LayerPanel.svelte            # Layer management
└── ComponentExporter.svelte     # Export dialog
```

### Canvas Engine

Use **Konva.js** (already in dependencies for graph view) for canvas rendering:
- Hardware-accelerated rendering via Canvas API
- Built-in event handling (drag, resize, rotate)
- Layer management
- Export to PNG/SVG

### Data Model

```typescript
interface CanvasDocument {
  id: string;
  name: string;
  created_at: string;
  modified_at: string;
  viewport: {
    x: number;
    y: number;
    scale: number;
  };
  elements: CanvasElement[];
  layers: Layer[];
}

interface CanvasElement {
  id: string;
  type: 'rectangle' | 'circle' | 'text' | 'image' | 'component';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  properties: {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    opacity?: number;
    text?: string;
    fontSize?: number;
    fontFamily?: string;
    src?: string; // for images
  };
  layerId: string;
  locked: boolean;
  visible: boolean;
}

interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  order: number;
}
```

### Backend Storage

```rust
// src-tauri/src/services/canvas_service.rs
pub struct CanvasService {
    db: Arc<Database>,
}

impl CanvasService {
    pub fn save_canvas(&self, canvas: CanvasDocument) -> Result<()>;
    pub fn load_canvas(&self, id: &str) -> Result<CanvasDocument>;
    pub fn list_canvases(&self) -> Result<Vec<CanvasDocument>>;
    pub fn export_as_component(&self, elements: Vec<CanvasElement>) -> Result<String>;
}
```

---

## Implementation Phases

### Phase 1: Canvas Foundation (2-3 days)
- Set up Konva.js canvas workspace
- Implement pan/zoom controls
- Add grid overlay with snap-to-grid
- Create basic toolbar with tool selection
- Implement viewport persistence

### Phase 2: Element Creation (2-3 days)
- Rectangle, circle, text, image tools
- Drag to create elements
- Selection and transformation (move, resize, rotate)
- Property panel for editing attributes
- Layer panel for organization

### Phase 3: Advanced Features (2-3 days)
- Copy/paste/duplicate
- Undo/redo system
- Group/ungroup elements
- Alignment tools (align left, center, distribute)
- Minimap navigation

### Phase 4: Export & Integration (1-2 days)
- Export as Svelte component
- Export as PNG/SVG
- Component library system
- Integration with note system

---

## Success Metrics

- Canvas loads and renders 100+ elements at 60fps
- Pan/zoom feels smooth and responsive
- Component export generates valid Svelte code
- Canvas state persists across sessions
- Users can create a complete UI mockup in <30 minutes

---

## Open Questions

1. Should canvas documents be linked to notes, or standalone?
2. Do we need real-time collaboration features?
3. Should we support importing Figma/Sketch files?
4. What's the maximum canvas size we should support?

---

## References

- Konva.js Documentation: https://konvajs.org/
- Excalidraw (inspiration): https://excalidraw.com/
- tldraw (inspiration): https://tldraw.com/
