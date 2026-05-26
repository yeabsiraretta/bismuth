# Tasks: Canvas Component Design Tool

**Feature**: `002-canvas-component-design`  
**Plan**: [plan.md](./plan.md) | **Spec**: [spec.md](./spec.md)  
**Stack**: Konva.js · Svelte 5 · TypeScript · Tauri · Rust

**Scope**: US28 (Canvas Workspace), US29 (Component Creation), US30 (Export), US31 (Annotations - deferred)

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel
- **[Story]**: User story label
- Exact file paths are relative to repo root

---

## Phase 1: Canvas Foundation

**Purpose**: Set up the Konva.js canvas infrastructure with pan/zoom, grid, and basic UI shell.

- [ ] T101 [US28] **Create canvas data models** — Create `src-tauri/src/models/canvas.rs` with `#[derive(Debug, Clone, Serialize, Deserialize)]` structs: `CanvasDocument { id, name, viewport: Viewport, elements: Vec<CanvasElement>, layers: Vec<Layer> }`, `CanvasElement { id, element_type, x, y, width, height, rotation, properties: HashMap<String, Value>, layer_id, z_index, locked, visible }`, `Layer { id, name, z_order, visible, locked }`, `Viewport { x, y, scale }`; **Success**: compiles and can serialize/deserialize
- [ ] T102 [US28] **Set up database schema** — In `src-tauri/src/db.rs`, add migration for canvas tables: `canvas_documents`, `canvas_elements`, `canvas_layers`, `canvas_templates` with indexes on `canvas_id` and `layer_id`; **Success**: tables created, indexes verified with EXPLAIN QUERY PLAN
- [ ] T103 [US28] **Implement CanvasService** — Create `src-tauri/src/services/canvas_service.rs` with methods: `create_canvas(name) -> Result<CanvasDocument>`, `save_canvas(canvas) -> Result<()>`, `load_canvas(id) -> Result<CanvasDocument>`, `list_canvases() -> Result<Vec<CanvasDocument>>`, `delete_canvas(id) -> Result<()>`; persist to database; **Success**: can create, save, load, list, delete canvases
- [ ] T104 [US28] **Create canvas IPC commands** — Create `src-tauri/src/commands/canvas_commands.rs` with `#[tauri::command]` functions: `create_canvas`, `save_canvas`, `load_canvas`, `list_canvases`, `delete_canvas`; register in `main.rs`; **Success**: frontend can invoke all commands
- [ ] T105 [P] [US28] **Create TypeScript types** — Create `src/lib/types/canvas.ts` with interfaces matching Rust models: `CanvasDocument`, `CanvasElement`, `Layer`, `Viewport`, `ElementType`, `ElementProperties`; **Success**: types compile
- [ ] T106 [P] [US28] **Create canvas IPC service** — Create `src/lib/services/canvas/canvas.ts` with async functions wrapping IPC commands: `createCanvas(name)`, `saveCanvas(canvas)`, `loadCanvas(id)`, `listCanvases()`, `deleteCanvas(id)`; **Success**: type-safe IPC calls
- [ ] T107 [US28] **Create canvas stores** — Create `src/lib/stores/canvas/canvasStore.ts` with `writable<CanvasDocument | null>`, `viewportStore` with `{ x, y, scale }`, `gridStore` with `{ size, snapToGrid }`; export actions: `setViewport`, `setGrid`, `saveCanvas`; **Success**: stores reactive
- [ ] T108 [US28] **Build CanvasWorkspace component** — Create `src/lib/components/canvas/CanvasWorkspace.svelte` with Konva Stage: `<div bind:this={container}><Stage config={{ width, height, draggable: true }} on:wheel={handleZoom}></Stage></div>`; mount Stage in `onMount`, set up pan (drag with spacebar) and zoom (wheel); **Success**: canvas pans and zooms smoothly
- [ ] T109 [US28] **Add grid overlay** — Create `src/lib/components/canvas/CanvasGrid.svelte` as Konva Layer with grid lines drawn using `Line` shapes; grid size from `gridStore`; toggle visibility; **Success**: grid renders, toggles on/off
- [ ] T110 [US28] **Build canvas toolbar** — Create `src/lib/components/canvas/CanvasToolbar.svelte` with tool buttons: Select, Rectangle, Circle, Text, Image; use Lucide icons; bind to `toolStore`; **Success**: clicking tool updates active tool
- [ ] T111 [US28] **Add minimap** — Create `src/lib/components/canvas/CanvasMinimap.svelte` with small Konva Stage showing all elements; highlight current viewport as rectangle; click to jump to location; **Success**: minimap shows viewport, click navigates
- [ ] T112 [US28] **Integrate canvas into App** — Add canvas route/tab to `src/App.svelte`; show canvas workspace when activated; add "New Canvas" button to toolbar; **Success**: can open canvas from main UI

**Checkpoint**: Canvas workspace loads, pans, zooms, shows grid and minimap. No elements yet.

---

## Phase 2: Element Creation & Editing

**Purpose**: Implement tools for creating and manipulating canvas elements.

- [ ] T113 [US29] **Create element stores** — Create `src/lib/stores/canvas/elementsStore.ts` with `writable<CanvasElement[]>`, `selectionStore` with `writable<string[]>` (selected element IDs); export actions: `addElement`, `updateElement`, `deleteElement`, `selectElement`, `clearSelection`; **Success**: stores update reactively
- [ ] T114 [US29] **Implement SelectTool** — Create `src/lib/components/canvas/tools/SelectTool.ts` with logic: click element to select, drag to move, show resize handles on selection, drag handles to resize; use Konva Transformer; **Success**: can select, move, resize elements
- [ ] T115 [US29] **Implement RectangleTool** — Create `src/lib/components/canvas/tools/RectangleTool.ts`: on mousedown, create rectangle at cursor; on drag, update width/height; on mouseup, finalize and add to `elementsStore`; **Success**: can drag to create rectangles
- [ ] T116 [US29] **Implement CircleTool** — Create `src/lib/components/canvas/tools/CircleTool.ts`: similar to RectangleTool but creates circles; **Success**: can drag to create circles
- [ ] T117 [US29] **Implement TextTool** — Create `src/lib/components/canvas/tools/TextTool.ts`: on click, create text element with editable input; double-click existing text to edit; **Success**: can create and edit text
- [ ] T118 [US29] **Build PropertyPanel** — Create `src/lib/components/canvas/PropertyPanel.svelte`: show properties of selected element (x, y, width, height, fill, stroke, opacity); bind inputs to `elementsStore`; update on change; **Success**: editing properties updates canvas
- [ ] T119 [US29] **Build LayerPanel** — Create `src/lib/components/canvas/LayerPanel.svelte`: list all elements grouped by layer; show/hide layers; lock/unlock; drag to reorder z-index; **Success**: layer panel controls element visibility and order
- [ ] T120 [US29] **Implement element deletion** — Listen for Delete/Backspace key; remove selected elements from `elementsStore`; **Success**: Delete key removes selected elements
- [ ] T121 [US29] **Add snap-to-grid** — In all tools, when `gridStore.snapToGrid` is true, round element positions to nearest grid increment; **Success**: elements snap to grid when enabled

**Checkpoint**: Can create rectangles, circles, text. Can select, move, resize, delete. Property and layer panels functional.

---

## Phase 3: Advanced Editing Features

**Purpose**: Add copy/paste, undo/redo, grouping, and alignment tools.

- [ ] T122 [US29] **Create history store** — Create `src/lib/stores/canvas/historyStore.ts` with undo/redo stack (max 50 entries); implement Command pattern: `CreateElementCommand`, `DeleteElementCommand`, `MoveElementCommand`, `ResizeElementCommand`, `ChangePropertyCommand`; export `undo()`, `redo()`, `execute(command)`; **Success**: undo/redo works
- [ ] T123 [US29] **Implement copy/paste** — Listen for Cmd+C/Cmd+V; on copy, store selected elements in clipboard; on paste, duplicate elements with offset; **Success**: Cmd+C/Cmd+V duplicates elements
- [ ] T124 [US29] **Implement duplicate** — Listen for Cmd+D; duplicate selected elements with small offset; **Success**: Cmd+D duplicates
- [ ] T125 [US29] **Implement group/ungroup** — Add `GroupElement` type; on group (Cmd+G), create group containing selected elements; on ungroup (Cmd+Shift+G), extract elements from group; **Success**: grouping works
- [ ] T126 [US29] **Add alignment tools** — Create `src/lib/components/canvas/AlignmentToolbar.svelte` with buttons: align left, center, right, top, middle, bottom; implement alignment logic in `src/lib/utils/canvasUtils.ts`; **Success**: alignment buttons work
- [ ] T127 [US29] **Add distribution tools** — Add distribute horizontally/vertically buttons; implement distribution logic; **Success**: distribution works
- [ ] T128 [US29] **Implement keyboard shortcuts** — Listen for arrow keys (nudge 1px or 10px with Shift), Cmd+A (select all), Cmd+Z/Cmd+Shift+Z (undo/redo); **Success**: all shortcuts work

**Checkpoint**: Full editing capabilities: copy/paste, undo/redo, grouping, alignment, keyboard shortcuts.

---

## Phase 4: Export & Integration

**Purpose**: Enable exporting canvas designs as code and images, and integrate with Bismuth's note system.

- [ ] T129 [US30] **Implement PNG export** — Create `src/lib/components/canvas/export/ComponentExporter.svelte` with export dialog; use Konva's `stage.toDataURL()` to export as PNG; download file; **Success**: can export canvas as PNG
- [ ] T130 [US30] **Implement SVG export** — Use Konva's `stage.toSVG()` (via plugin) to export as SVG; **Success**: can export as SVG
- [ ] T131 [US30] **Create Svelte component generator** — Create `src/lib/services/canvas/componentGenerator.ts` with function `generateSvelteComponent(elements: CanvasElement[]) -> string`; convert elements to Svelte markup with styles; **Success**: generates valid Svelte code
- [ ] T132 [US30] **Build component library** — Create `src/lib/components/canvas/ComponentLibrary.svelte`: list saved templates; drag template onto canvas to instantiate; **Success**: can save and reuse templates
- [ ] T133 [US30] **Implement template save/load** — Add `save_template(name, elements)` and `load_template(id)` IPC commands; persist to `canvas_templates` table; **Success**: templates persist across sessions
- [ ] T134 [US30] **Link canvas to notes** — Add `note_id` field to `CanvasDocument`; allow linking canvas to a note; show canvas in note sidebar; **Success**: canvas linked to notes
- [ ] T135 [US30] **Add canvas management UI** — Create "Canvas Library" view listing all canvases; show thumbnails, creation date; buttons to open, rename, delete; **Success**: can manage canvases

**Checkpoint**: US28, US29, US30 fully functional. Canvas can create, edit, export components. Integrated with Bismuth.

---

## Deferred (Post-MVP)

- [ ] T136 [US31] Implement sticky notes and annotations
- [ ] T137 [US31] Add arrow connectors between elements
- [ ] T138 [US31] Implement measurement guides and rulers
- [ ] T139 [US31] Add comment threads on elements
- [ ] T140 Real-time collaboration (multiple cursors)
- [ ] T141 Import from Figma/Sketch
- [ ] T142 Animation timeline
- [ ] T143 Component variants and states
- [ ] T144 Auto-layout (flexbox/grid)

---

## Summary

- **Phase 1 (Foundation)**: 12 tasks (T101-T112)
- **Phase 2 (Elements)**: 9 tasks (T113-T121)
- **Phase 3 (Advanced)**: 7 tasks (T122-T128)
- **Phase 4 (Export)**: 7 tasks (T129-T135)
- **Total**: 35 tasks
- **Estimated**: 8-11 days
