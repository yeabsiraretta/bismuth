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

- [x] T101 [US28] **Create canvas data models** — Create `src-tauri/src/models/canvas.rs` with `#[derive(Debug, Clone, Serialize, Deserialize)]` structs: `CanvasDocument { id, name, viewport: Viewport, elements: Vec<CanvasElement>, layers: Vec<Layer> }`, `CanvasElement { id, element_type, x, y, width, height, rotation, properties: HashMap<String, Value>, layer_id, z_index, locked, visible }`, `Layer { id, name, z_order, visible, locked }`, `Viewport { x, y, scale }`; **Success**: compiles and can serialize/deserialize
- [x] T102 [US28] **Set up database schema** — In `src-tauri/src/db.rs`, add migration for canvas tables: `canvas_documents`, `canvas_elements`, `canvas_layers`, `canvas_templates` with indexes on `canvas_id` and `layer_id`; **Success**: tables created, indexes verified with EXPLAIN QUERY PLAN
- [x] T103 [US28] **Implement CanvasService** — Create `src-tauri/src/services/canvas_service.rs` with methods: `create_canvas(name) -> Result<CanvasDocument>`, `save_canvas(canvas) -> Result<()>`, `load_canvas(id) -> Result<CanvasDocument>`, `list_canvases() -> Result<Vec<CanvasDocument>>`, `delete_canvas(id) -> Result<()>`; persist to database; **Success**: can create, save, load, list, delete canvases
- [x] T104 [US28] **Create canvas IPC commands** — Create `src-tauri/src/commands/canvas_commands.rs` with `#[tauri::command]` functions: `create_canvas`, `save_canvas`, `load_canvas`, `list_canvases`, `delete_canvas`; register in `main.rs`; **Success**: frontend can invoke all commands
- [x] T105 [P] [US28] **Create TypeScript types** — Create `src/lib/types/canvas.ts` with interfaces matching Rust models: `CanvasDocument`, `CanvasElement`, `Layer`, `Viewport`, `ElementType`, `ElementProperties`; **Success**: types compile
- [x] T106 [P] [US28] **Create canvas IPC service** — Create `src/lib/services/canvas/canvas.ts` with async functions wrapping IPC commands: `createCanvas(name)`, `saveCanvas(canvas)`, `loadCanvas(id)`, `listCanvases()`, `deleteCanvas(id)`; **Success**: type-safe IPC calls
- [x] T107 [US28] **Create canvas stores** — Create `src/lib/stores/canvas/canvasStore.ts` with `writable<CanvasDocument | null>`, `viewportStore` with `{ x, y, scale }`, `gridStore` with `{ size, snapToGrid }`; export actions: `setViewport`, `setGrid`, `saveCanvas`; **Success**: stores reactive
- [x] T108 [US28] **Build CanvasWorkspace component** — Create `src/lib/components/canvas/CanvasWorkspaceInteractive.svelte` with HTML5 Canvas rendering, pan (spacebar drag) and zoom (wheel); custom 2D rendering engine; **Success**: canvas pans and zooms smoothly
- [x] T109 [US28] **Add grid overlay** — Grid rendering integrated into `CanvasWorkspaceInteractive.svelte` via canvas 2D context; grid size from `canvasSettings` store; toggle visibility; **Success**: grid renders, toggles on/off
- [x] T110 [US28] **Build canvas toolbar** — Create `src/lib/components/canvas/CanvasToolbar.svelte` with tool buttons: Select, Pan, Frame, Rectangle, Circle, Line, Arrow, Pen, Text, Image, Screen, Component; use Lucide icons; bind to `activeTool` store; **Success**: clicking tool updates active tool
- [ ] T111 [US28] **Add minimap** — Create `src/lib/components/canvas/CanvasMinimap.svelte` with mini canvas showing all elements; highlight current viewport as rectangle; click to jump to location; **Success**: minimap shows viewport, click navigates — **DEFERRED**
- [x] T112 [US28] **Integrate canvas into App** — Add canvas route/tab to `src/App.svelte`; show canvas workspace when activated via `currentView === 'canvas'`; "Canvas" button in toolbar navigates to CanvasApp; **Success**: can open canvas from main UI

**Checkpoint**: Canvas workspace loads, pans, zooms, shows grid and minimap. No elements yet.

---

## Phase 2: Element Creation & Editing

**Purpose**: Implement tools for creating and manipulating canvas elements.

- [x] T113 [US29] **Create element stores** — Create `src/lib/stores/canvas/canvasElements.ts` with `addElement`, `updateElement`, `deleteElement`; selection in `canvasStore.ts` with `selectedElements`, `selectElement`, `clearSelection`; **Success**: stores update reactively
- [x] T114 [US29] **Implement SelectTool** — Select tool logic in `CanvasWorkspaceInteractive.svelte`: click element to select, drag to move, resize handles; **Success**: can select, move, resize elements
- [x] T115 [US29] **Implement RectangleTool** — Rectangle creation via `createRectangle` in `canvasElementFactory.ts`; tool logic in workspace; **Success**: can drag to create rectangles
- [x] T116 [US29] **Implement CircleTool** — Circle creation via `createCircle` in `canvasElementFactory.ts`; tool logic in workspace; **Success**: can drag to create circles
- [x] T117 [US29] **Implement TextTool** — Text creation via `createText` in `canvasElementFactory.ts`; tool logic in workspace; **Success**: can create and edit text
- [x] T118 [US29] **Build PropertyPanel** — Create `src/lib/components/canvas/PropertyPanel.svelte`: show properties of selected element (x, y, width, height, fill, stroke, opacity); bind inputs to store; update on change; **Success**: editing properties updates canvas
- [x] T119 [US29] **Build LayerPanel** — Create `src/lib/components/canvas/LayerPanel.svelte`: list all elements grouped by layer; show/hide layers; lock/unlock; reorder z-index; **Success**: layer panel controls element visibility and order
- [x] T120 [US29] **Implement element deletion** — `deleteSelectedElements` in canvasStore; triggered via Delete/Backspace key; **Success**: Delete key removes selected elements
- [x] T121 [US29] **Add snap-to-grid** — `snapToGrid` utility in `canvasUtils.ts`; applied in all tools when `canvasSettings.snapToGrid` is true; **Success**: elements snap to grid when enabled

**Checkpoint**: Can create rectangles, circles, text. Can select, move, resize, delete. Property and layer panels functional.

---

## Phase 3: Advanced Editing Features

**Purpose**: Add copy/paste, undo/redo, grouping, and alignment tools.

- [x] T122 [US29] **Create history store** — Create `src/lib/stores/canvas/historyStore.ts` with undo/redo stack (max 50 entries); implement Command pattern: `CreateElementCommand`, `DeleteElementCommand`, `MoveElementCommand`, `ResizeElementCommand`, `ChangePropertyCommand`; export `undo()`, `redo()`, `execute(command)`; **Success**: undo/redo works
- [x] T123 [US29] **Implement copy/paste** — `copySelectedElements`/`pasteElements` in canvasStore; keyboard handler in `canvasShortcuts.ts` (Cmd+C/V); **Success**: Cmd+C/Cmd+V duplicates elements
- [x] T124 [US29] **Implement duplicate** — `duplicateSelectedElements` in canvasStore; Cmd+D handled in `canvasShortcuts.ts`; **Success**: Cmd+D duplicates
- [x] T125 [US29] **Implement group/ungroup** — `groupSelectedElements`/`ungroupSelectedElements` in `canvasArrangement.ts`; Cmd+G/Cmd+Shift+G handled in `canvasShortcuts.ts`; **Success**: grouping works
- [x] T126 [US29] **Add alignment tools** — `alignElements` imported in `canvasArrangement.ts`; `alignSelectedElements` action in canvasStore; logic in `canvasUtils.ts`; **Success**: alignment works
- [x] T127 [US29] **Add distribution tools** — `distributeElements` imported in `canvasArrangement.ts`; distribution logic in `canvasUtils.ts`; **Success**: distribution works
- [x] T128 [US29] **Implement keyboard shortcuts** — `canvasShortcuts.ts` handles Cmd+C/V/D/G/Shift+G/Z/Shift+Z/S; `CanvasApp.svelte` registers keydown listener; **Success**: all shortcuts work

**Checkpoint**: Full editing capabilities: copy/paste, undo/redo, grouping, alignment, keyboard shortcuts.

---

## Phase 4: Export & Integration

**Purpose**: Enable exporting canvas designs as code and images, and integrate with Bismuth's note system.

- [x] T129 [US30] **Implement PNG export** — `exportToPNG` in `src/lib/utils/canvasExport.ts` using offscreen canvas rendering; download via `downloadFile`; **Success**: can export canvas as PNG
- [x] T130 [US30] **Implement SVG export** — `exportToSVG` in `src/lib/utils/canvasExport.ts` generating SVG markup from elements; download via `downloadSVG`; **Success**: can export as SVG
- [x] T131 [US30] **Create Svelte component generator** — Create `src/lib/services/canvas/componentGenerator.ts` with function `generateSvelteComponent(elements: CanvasElement[]) -> string`; convert elements to Svelte markup with styles; **Success**: generates valid Svelte code
- [x] T132 [US30] **Build component library** — `src/lib/components/canvas/ComponentsPanel.svelte`: list components; `createComponentFromSelection`/`insertComponentInstance` in canvasStore; **Success**: can save and reuse components
- [x] T133 [US30] **Implement template save/load** — Add `save_template(name, elements)` and `load_template(id)` IPC commands; persist to `canvas_templates` table; `src/lib/services/canvas/templates.ts` and Rust IPC in `canvas_commands.rs`/`canvas_service.rs`; **Success**: templates persist across sessions
- [x] T134 [US30] **Link canvas to notes** — Add `note_id` field to `CanvasDocument` in both TS types and Rust model; `linkCanvasToNote`/`getCanvasesForNote` IPC commands; **Success**: canvas linked to notes via note_id field
- [x] T135 [US30] **Add canvas management UI** — `src/lib/components/canvas/CanvasLibrary.svelte`: lists all canvases with search, create, open, delete; **Success**: can manage canvases

**Checkpoint**: US28, US29, US30 fully functional. Canvas can create, edit, export components. Integrated with Bismuth.

---

## Deferred (Post-MVP)

- [x] T136 [US31] Implement sticky notes and annotations — **POST-MVP COMPLETE**: `canvasAnnotations.ts` with sticky notes, pins, freehand, highlights
- [x] T137 [US31] Add arrow connectors between elements — **POST-MVP COMPLETE**: `canvasConnectors.ts` with anchor detection, orthogonal/curved routing, SVG path gen
- [x] T138 [US31] Implement measurement guides and rulers — **POST-MVP COMPLETE**: `canvasMeasurements.ts` with distance measurement, alignment guides, ruler ticks, token-snap
- [x] T139 [US31] Add comment threads on elements — **POST-MVP COMPLETE**: `canvasComments.ts` with threaded replies, resolution status, @mentions
- [ ] T140 Real-time collaboration (multiple cursors) — architecture stub with CRDT-compatible ops
- [x] T141 [US31] MCP design server — expose Bismuth canvas data to AI agents and code generators via MCP protocol; deterministic component-to-code mapping pipeline (GDS-inspired extraction → translation → token resolution) — **POST-MVP COMPLETE**: `designImport.ts` refactored as MCP export service
- [ ] T142 Animation timeline — transition definitions between component states
- [x] T143 [US31] Component variants and states — GDS-inspired 3-tier variant system (axes, overrides, states) with deterministic property resolution and token bindings — **POST-MVP COMPLETE**: `canvasComponentVariants.ts`
- [x] T144 [US31] Auto-layout engine (flexbox + CSS Grid) — **POST-MVP COMPLETE**: `canvasAutoLayout.ts` extended with full grid computation, auto-fill/fit, explicit placement

---

## Summary

| Phase                    | Tasks          | Complete | Remaining                                     |
| ------------------------ | -------------- | -------- | --------------------------------------------- |
| **Phase 1 (Foundation)** | 12 (T101-T112) | 11       | 1 (minimap deferred)                          |
| **Phase 2 (Elements)**   | 9 (T113-T121)  | 9        | 0                                             |
| **Phase 3 (Advanced)**   | 7 (T122-T128)  | 7        | 0                                             |
| **Phase 4 (Export)**     | 7 (T129-T135)  | 7        | 0                                             |
| **Deferred**             | 9 (T136-T144)  | 7        | 2 (T140 collab stub, T142 animation stub)     |
| **Total**                | 44             | 41       | 3 (minimap + 2 stubs)                         |

**Completion**: 41/44 tasks done. All MVP + 7/9 post-MVP complete.
**Status**: Bismuth canvas functions as a full design tool (Figma-equivalent) with MCP integration for AI-powered code generation. Type system extended to support multi-fill, multi-stroke, blend modes, boolean operations, vector networks, effects stack, prototyping/interactions, shared styles, Code Connect, and design variables.
