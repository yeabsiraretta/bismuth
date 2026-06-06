# Research: Canvas Component System

## R1: Instance-Definition Linking Strategy

**Decision**: Shallow reference model — instances store `definitionId` + `overrides` map. At render time, the component resolver merges definition elements with instance overrides.

**Rationale**: Avoids deep-cloning element trees (expensive for 1000+ instances). Overrides are sparse — most instances only change text content or position. Merge is O(overrides) not O(elements).

**Alternatives considered**:
- **Deep clone on create**: Simple but O(n) memory per instance, stale when definition changes
- **Proxy/reactive wrapper**: Complex, hard to serialize, breaks canvas element assumptions
- **Copy-on-write with diff**: Over-engineered for our use case where overrides are typically <5 properties

## R2: Component Storage Format

**Decision**: Each component definition stored as a standalone JSON file in `.bismuth/components/{id}.json`. A manifest file `.bismuth/components/manifest.json` indexes names, categories, and thumbnails for fast library browsing.

**Rationale**: Standalone files allow git-friendly diffing, selective loading, and simple Tauri file operations. Manifest avoids reading every file to populate the library panel.

**Alternatives considered**:
- **Single monolithic JSON**: Merge conflicts, must load entire library into memory
- **SQLite database**: Overkill for <500 items, adds dependency, not git-friendly
- **Embedded in canvas document**: Prevents sharing components across canvases

## R3: Flow Link Model

**Decision**: Flow links are a new edge type stored on the canvas document (alongside elements). Each `FlowLink` has `fromFrameId`, `toFrameId`, `hotspotElementId` (optional click target), and `transition` metadata.

**Rationale**: Treating flows as document-level edges (not element properties) keeps the element model clean and allows the flow graph to be computed independently of element rendering.

**Alternatives considered**:
- **Property on frame elements**: Couples navigation to element model, hard to visualize flow graph separately
- **Separate flow document**: Unnecessary indirection; flows are inherently part of a canvas document

## R4: Preview Mode Architecture

**Decision**: Preview mode is a distinct UI state (`activeTool = 'preview'`) that hides the editor chrome, renders one frame at a time at 100% scale, and intercepts clicks on hotspot elements to traverse flow links.

**Rationale**: Reuses existing viewport/tool switching. No new rendering pipeline — just filter which elements to show and how to handle clicks.

**Alternatives considered**:
- **Separate preview window**: Platform complexity, synchronization issues
- **Overlay on canvas**: Confusing UX, hard to distinguish edit vs preview
- **Export to HTML**: Out of scope, not interactive in the same session

## R5: Removal Scope for Legacy System

**Decision**: Remove `componentVariants.ts` and `designTokens.ts` entirely. Remove MCP server endpoints that depend on them (`get_component_defs`, `get_variable_defs` in `mcpDesignServer.ts`). Keep `DesignTokensPanel.svelte` shell but rewire it to reference the new component library. Keep `ComponentDefinition` type in `canvas.ts` but evolve it.

**Rationale**: The variant/token system models an external design-system tool's concepts (variant axes, token collections with modes, code-connect mappings). These don't map to how users actually compose canvas elements into reusable groups.

**What is preserved**:
- `elementFactory.ts` — real canvas primitives
- `canvasUtils.ts` (now `utils.ts`) — geometry, alignment, element hit-testing
- `canvasExport.ts` (now `export.ts`) — PNG/SVG export
- `canvasStore.ts`, `canvasElements.ts` — core state management
- `canvasArrangement.ts` — grouping, pages, alignment operations
- `ComponentDefinition` type (evolved to match native model)

## R6: Existing ComponentDefinition Type Assessment

**Decision**: The existing `ComponentDefinition` interface is a good starting point — it already has `elements: CanvasElement[]`, `exposedProps: ComponentProp[]`, `width`, `height`. We extend it minimally rather than rewriting.

**Changes needed**:
- Remove `codeConnect` field (MCP artifact)
- Remove `variantProperties` field (variant system artifact)
- Add `thumbnail?: string` (base64 preview for library panel)
- Add `tags?: string[]` (library organization)
- Keep `exposedProps` → maps to per-instance overrides

**Preserved as-is**: `id`, `name`, `description`, `category`, `elements`, `exposedProps`, `width`, `height`, `created_at`, `modified_at`
