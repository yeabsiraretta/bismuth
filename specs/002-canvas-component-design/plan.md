# Implementation Plan: Canvas Component Design Tool

**Feature**: `002-canvas-component-design`  
**Tech Stack**: Konva.js · Svelte 5 · TypeScript · Tauri · Rust  
**Estimated Effort**: 8-11 days

---

## Architecture Overview

### Frontend Architecture

```
Canvas Layer (Konva.js)
├── Stage (viewport container)
├── Grid Layer (background grid)
├── Elements Layer (user-created shapes)
├── Selection Layer (selection boxes, handles)
└── UI Layer (controls, minimap)

State Management (Svelte Stores)
├── canvasStore (viewport, zoom, pan)
├── elementsStore (all canvas elements)
├── selectionStore (selected elements)
├── historyStore (undo/redo stack)
└── toolStore (active tool, settings)
```

### Backend Architecture

```
Rust Services
├── CanvasService (CRUD operations)
├── ExportService (component generation)
└── TemplateService (component library)

Database Schema
├── canvas_documents (id, name, viewport, created_at)
├── canvas_elements (id, canvas_id, type, properties)
└── canvas_templates (id, name, elements_json)
```

---

## File Structure

```
src/lib/components/canvas/
├── CanvasWorkspace.svelte           # Main canvas container with Konva Stage
├── CanvasToolbar.svelte             # Tool selection bar
├── CanvasGrid.svelte                # Grid overlay component
├── CanvasMinimap.svelte             # Minimap navigation
├── PropertyPanel.svelte             # Element property editor
├── LayerPanel.svelte                # Layer management panel
├── tools/
│   ├── SelectTool.ts                # Selection and transformation
│   ├── RectangleTool.ts             # Rectangle creation
│   ├── CircleTool.ts                # Circle creation
│   ├── TextTool.ts                  # Text creation
│   └── ImageTool.ts                 # Image placement
├── elements/
│   ├── CanvasRectangle.svelte       # Rectangle element
│   ├── CanvasCircle.svelte          # Circle element
│   ├── CanvasText.svelte            # Text element
│   └── CanvasImage.svelte           # Image element
└── export/
    ├── ComponentExporter.svelte     # Export dialog
    └── exportUtils.ts               # Export logic

src/lib/stores/canvas/
├── canvasStore.ts                   # Canvas state (viewport, zoom)
├── elementsStore.ts                 # Elements state
├── selectionStore.ts                # Selection state
├── historyStore.ts                  # Undo/redo state
└── toolStore.ts                     # Active tool state

src/lib/types/canvas.ts              # TypeScript interfaces

src/lib/services/canvas/
└── canvas.ts                        # IPC wrappers

src-tauri/src/services/
├── canvas_service.rs                # Canvas CRUD operations
├── export_service.rs                # Component export logic
└── template_service.rs              # Template management

src-tauri/src/commands/
└── canvas_commands.rs               # Tauri IPC commands

src-tauri/src/models/
└── canvas.rs                        # Canvas data models
```

---

## Database Schema

```sql
-- Canvas documents
CREATE TABLE canvas_documents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    vault_id TEXT,
    viewport_x REAL DEFAULT 0,
    viewport_y REAL DEFAULT 0,
    viewport_scale REAL DEFAULT 1.0,
    grid_size INTEGER DEFAULT 16,
    snap_to_grid INTEGER DEFAULT 1,
    created_at INTEGER NOT NULL,
    modified_at INTEGER NOT NULL
);

-- Canvas elements
CREATE TABLE canvas_elements (
    id TEXT PRIMARY KEY,
    canvas_id TEXT NOT NULL,
    element_type TEXT NOT NULL,
    x REAL NOT NULL,
    y REAL NOT NULL,
    width REAL NOT NULL,
    height REAL NOT NULL,
    rotation REAL DEFAULT 0,
    properties TEXT, -- JSON
    layer_id TEXT,
    z_index INTEGER DEFAULT 0,
    locked INTEGER DEFAULT 0,
    visible INTEGER DEFAULT 1,
    FOREIGN KEY (canvas_id) REFERENCES canvas_documents(id) ON DELETE CASCADE
);

-- Canvas layers
CREATE TABLE canvas_layers (
    id TEXT PRIMARY KEY,
    canvas_id TEXT NOT NULL,
    name TEXT NOT NULL,
    z_order INTEGER NOT NULL,
    visible INTEGER DEFAULT 1,
    locked INTEGER DEFAULT 0,
    FOREIGN KEY (canvas_id) REFERENCES canvas_documents(id) ON DELETE CASCADE
);

-- Component templates
CREATE TABLE canvas_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    elements_json TEXT NOT NULL,
    thumbnail_path TEXT,
    created_at INTEGER NOT NULL
);

-- Indexes
CREATE INDEX idx_canvas_elements_canvas_id ON canvas_elements(canvas_id);
CREATE INDEX idx_canvas_elements_layer_id ON canvas_elements(layer_id);
CREATE INDEX idx_canvas_layers_canvas_id ON canvas_layers(canvas_id);
```

---

## Implementation Phases

### Phase 1: Canvas Foundation (Days 1-3)

**Tasks:**
1. Set up Konva.js Stage and Layer system
2. Implement pan (drag with spacebar) and zoom (mouse wheel)
3. Add grid overlay with configurable size
4. Create canvas toolbar with tool icons
5. Implement viewport state persistence
6. Add minimap component

**Deliverables:**
- Working canvas with pan/zoom
- Grid overlay with snap-to-grid
- Toolbar UI (no tools yet)
- Minimap showing viewport

### Phase 2: Element Creation (Days 4-6)

**Tasks:**
1. Implement SelectTool (click to select, drag to move, handles to resize)
2. Implement RectangleTool (drag to create)
3. Implement CircleTool (drag to create)
4. Implement TextTool (click to place, type to edit)
5. Create PropertyPanel for editing element attributes
6. Add LayerPanel for layer management
7. Implement element deletion (Delete key)

**Deliverables:**
- All basic tools functional
- Property panel updates on selection
- Layer panel shows all elements
- Elements can be created, selected, moved, resized, deleted

### Phase 3: Advanced Features (Days 7-9)

**Tasks:**
1. Implement copy/paste (Cmd+C, Cmd+V)
2. Implement duplicate (Cmd+D)
3. Add undo/redo system with history stack
4. Implement group/ungroup
5. Add alignment tools (align left, center, right, top, middle, bottom)
6. Add distribution tools (distribute horizontally, vertically)
7. Implement keyboard shortcuts (arrow keys to nudge, Cmd+A to select all)

**Deliverables:**
- Full editing capabilities
- Undo/redo working
- Grouping and alignment
- Keyboard shortcuts

### Phase 4: Export & Integration (Days 10-11)

**Tasks:**
1. Implement export as PNG/SVG
2. Create Svelte component code generator
3. Build component library system
4. Add template save/load
5. Integrate canvas with note system (link canvas to notes)
6. Add canvas document management (create, open, save, delete)

**Deliverables:**
- Export functionality working
- Component code generation
- Template library
- Canvas integrated into Bismuth

---

## Technical Decisions

### Why Konva.js?
- Already in dependencies (used for graph view)
- Hardware-accelerated Canvas API
- Built-in event handling and transformations
- Export to PNG/SVG out of the box
- Active community and good documentation

### State Management
- Use Svelte 5 runes for reactive state
- Separate stores for different concerns (canvas, elements, selection, history, tools)
- Persist canvas state to backend on change (debounced)

### Undo/Redo Strategy
- Command pattern: each action is a reversible command
- History stack with max 50 entries
- Commands: CreateElement, DeleteElement, MoveElement, ResizeElement, ChangeProperty

### Component Export Format
```svelte
<script lang="ts">
  export let width = 200;
  export let height = 100;
  export let fill = '#3b82f6';
</script>

<div 
  class="component"
  style="width: {width}px; height: {height}px; background: {fill};"
>
  <!-- Generated from canvas design -->
</div>

<style>
  .component {
    /* Styles from canvas properties */
  }
</style>
```

---

## Performance Considerations

- Limit canvas to 1000 elements (warn user if approaching)
- Use Konva's built-in caching for complex shapes
- Debounce property updates (100ms)
- Lazy-load minimap (only render when visible)
- Use requestAnimationFrame for smooth animations

---

## Testing Strategy

- Unit tests for canvas utilities (alignment, distribution, grouping)
- Integration tests for IPC commands
- Manual testing for UI interactions
- Performance testing with 500+ elements

---

## Future Enhancements (Post-MVP)

- Real-time collaboration (multiple cursors)
- Import from Figma/Sketch
- Animation timeline
- Component variants and states
- Auto-layout (flexbox/grid)
- Design tokens integration
- Comments and annotations
- Version history
