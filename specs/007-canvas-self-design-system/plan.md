# Implementation Plan: Canvas Self-Design System

**Branch**: `007-canvas-self-design-system` | **Date**: 2026-06-05 | **Spec**: `specs/007-canvas-self-design-system/spec.md`

## Summary

Build the "Bismuth designs Bismuth" architecture — a document-based pipeline where Bismuth's canvas produces structured design documents consumed via MCP to generate and evolve its own UI. The system enables side-by-side development where canvas changes flow to code and code state reflects back to canvas.

## Technical Context

**Language/Version**: TypeScript 5.x (frontend), Rust stable (Tauri 2.x backend)
**Primary Dependencies**: Svelte 4, Tauri 2, existing MCP Design Server (spec 004), Canvas type system
**Storage**: SQLite (canvas data), JSON files (design documents in `.bismuth/design-docs/`)
**Testing**: Vitest (frontend), cargo test (backend)
**Target Platform**: macOS, Windows, Linux (Tauri desktop)
**Performance Goals**: Document generation <200ms, MCP response <100ms, sync round-trip <500ms

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│ BISMUTH CANVAS (Design Surface)                                     │
│                                                                     │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│ │  Tokens  │ │Components│ │ Layouts  │ │  Flows   │ │  Pages   │  │
│ │  Page    │ │  Page    │ │  Page    │ │  Page    │ │  Page    │  │
│ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘  │
│      │             │            │             │            │         │
│      └─────────────┴────────────┴─────────────┴────────────┘         │
│                                 │                                    │
│                    ┌────────────▼────────────┐                       │
│                    │  Document Generator     │                       │
│                    │  (canvas → JSON docs)   │                       │
│                    └────────────┬────────────┘                       │
└─────────────────────────────────┼───────────────────────────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │  Design Document Store     │
                    │  .bismuth/design-docs/     │
                    │                           │
                    │  ├── tokens.json          │
                    │  ├── components/          │
                    │  │   ├── button.json      │
                    │  │   └── card.json        │
                    │  ├── layouts/             │
                    │  ├── flows/               │
                    │  ├── themes/              │
                    │  └── pages/               │
                    └─────────────┬─────────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
    ┌─────────▼─────────┐  ┌─────▼─────┐  ┌─────────▼─────────┐
    │  MCP Tools         │  │  Diff     │  │  Code Reflector   │
    │  (AI agent access) │  │  Engine   │  │  (code → canvas)  │
    └─────────┬─────────┘  └─────┬─────┘  └─────────┬─────────┘
              │                   │                   │
              └───────────────────┼───────────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │  BISMUTH SOURCE CODE       │
                    │                           │
                    │  src/lib/styles/tokens.css │
                    │  src/lib/components/       │
                    │  src/routes/               │
                    └───────────────────────────┘
```

## Design Decisions

### D1: Document Store Location

**Chosen**: `.bismuth/design-docs/` (local project directory)
**Alternatives considered**:
- SQLite: Too coupled to canvas DB, harder for agents to read directly
- Git-tracked `docs/design/`: Good for versioning but large JSON diffs
- **Decision**: Local `.bismuth/` mirrors the vault pattern, agents can read files directly via MCP resources, and it's gitignore-optional

### D2: Document Granularity

**Chosen**: One file per logical unit (one component = one document)
**Alternatives considered**:
- Single monolithic design.json: Too large, poor diff behavior
- Per-element documents: Too granular, explosion of files
- **Decision**: Component-level granularity maps 1:1 to code files

### D3: Bi-directional Sync Strategy

**Chosen**: Event-driven with manual trigger (not real-time)
**Alternatives considered**:
- Real-time watch: Too complex, race conditions
- Build-step only: Too slow for iteration
- **Decision**: Generate on canvas save + explicit "reflect" command for code→canvas

### D4: Canvas Page Organization

**Chosen**: Fixed page structure per design document canvas
**Pages**: `[Tokens] [Components] [Layouts] [Flows] [Pages] [Sandbox]`
**Rationale**: Consistent structure makes document generation deterministic and agents can navigate predictably

## Document Schemas (Detailed)

### Token Document (`tokens.json`)

```json
{
  "schema_version": "1.0.0",
  "document_type": "token",
  "document_id": "tok_001",
  "name": "Bismuth Design Tokens",
  "canvas_source": { "document_id": "...", "page_id": "tokens-page", "frame_ids": [] },
  "version": 1,
  "payload": {
    "collections": [
      {
        "name": "colors",
        "tokens": [
          {
            "name": "primary",
            "type": "color",
            "values": { "light": "#3b82f6", "dark": "#60a5fa" },
            "css_var": "--color-primary",
            "description": "Primary brand color"
          }
        ]
      },
      {
        "name": "spacing",
        "tokens": [
          {
            "name": "m",
            "type": "number",
            "values": { "default": 16 },
            "css_var": "--space-m",
            "unit": "px"
          }
        ]
      }
    ]
  }
}
```

### Component Document (`components/{name}.json`)

```json
{
  "schema_version": "1.0.0",
  "document_type": "component",
  "document_id": "comp_button",
  "name": "Button",
  "canvas_source": { "document_id": "...", "page_id": "components-page", "frame_ids": ["frame_btn_primary", "frame_btn_variants"] },
  "version": 1,
  "payload": {
    "component_name": "Button",
    "file_path": "src/lib/components/ui/Button.svelte",
    "description": "Primary button component with variants",
    "props": [
      { "name": "variant", "type": "enum", "values": ["primary", "secondary", "ghost"], "default": "primary" },
      { "name": "size", "type": "enum", "values": ["sm", "md", "lg"], "default": "md" },
      { "name": "disabled", "type": "boolean", "default": false }
    ],
    "slots": [
      { "name": "default", "description": "Button label content" },
      { "name": "icon", "description": "Optional leading icon" }
    ],
    "states": ["default", "hover", "active", "focus", "disabled"],
    "token_bindings": {
      "background": "var(--color-primary)",
      "text": "var(--color-on-primary)",
      "border-radius": "var(--radius-m)",
      "padding": "var(--space-s) var(--space-m)"
    },
    "variants": [
      {
        "name": "primary",
        "frame_id": "frame_btn_primary",
        "overrides": { "background": "var(--color-primary)" }
      },
      {
        "name": "secondary",
        "frame_id": "frame_btn_secondary",
        "overrides": { "background": "var(--color-surface-elevated)" }
      }
    ],
    "code_connect": {
      "import": "import Button from '@/components/ui/Button.svelte';",
      "usage": "<Button variant=\"primary\" size=\"md\">Label</Button>"
    }
  }
}
```

### Layout Document (`layouts/{name}.json`)

```json
{
  "schema_version": "1.0.0",
  "document_type": "layout",
  "document_id": "layout_sidebar",
  "name": "Sidebar Layout",
  "canvas_source": { "document_id": "...", "page_id": "layouts-page", "frame_ids": ["frame_sidebar_layout"] },
  "version": 1,
  "payload": {
    "layout_name": "SidebarLayout",
    "type": "grid",
    "breakpoints": {
      "mobile": { "max_width": 768, "columns": 1, "sidebar": "hidden" },
      "tablet": { "max_width": 1024, "columns": 2, "sidebar": "collapsed" },
      "desktop": { "min_width": 1025, "columns": 3, "sidebar": "expanded" }
    },
    "regions": [
      { "name": "sidebar-left", "grid_area": "sidebar", "min_width": 200, "max_width": 360 },
      { "name": "content", "grid_area": "main", "flex": 1 },
      { "name": "sidebar-right", "grid_area": "inspector", "min_width": 240, "max_width": 400 }
    ],
    "css_grid_template": "\"sidebar main inspector\" 1fr / minmax(200px, 360px) 1fr minmax(240px, 400px)"
  }
}
```

### Flow Document (`flows/{name}.json`)

```json
{
  "schema_version": "1.0.0",
  "document_type": "flow",
  "document_id": "flow_vault_open",
  "name": "Vault Open Flow",
  "canvas_source": { "document_id": "...", "page_id": "flows-page", "frame_ids": ["frame_flow_vault"] },
  "version": 1,
  "payload": {
    "flow_name": "VaultOpenFlow",
    "description": "User opens a vault from welcome screen or file picker",
    "steps": [
      { "id": "step_1", "screen": "WelcomeScreen", "action": "click_open_vault", "transition": "navigate" },
      { "id": "step_2", "screen": "FilePicker", "action": "select_directory", "transition": "async_load" },
      { "id": "step_3", "screen": "MainEditor", "action": "vault_loaded", "transition": "render" }
    ],
    "error_paths": [
      { "from": "step_2", "condition": "invalid_directory", "target": "step_1", "message": "Not a valid vault" }
    ],
    "components_used": ["WelcomeScreen", "FileTree", "NoteEditor", "Toolbar"]
  }
}
```

### Theme Document (`themes/{name}.json`)

```json
{
  "schema_version": "1.0.0",
  "document_type": "theme",
  "document_id": "theme_bismuth_dark",
  "name": "Bismuth Dark",
  "canvas_source": { "document_id": "...", "page_id": "tokens-page", "frame_ids": ["frame_dark_palette"] },
  "version": 1,
  "payload": {
    "theme_name": "dark",
    "extends": "tokens.json",
    "attribute": "data-theme=\"dark\"",
    "overrides": {
      "colors": {
        "surface": "#1a1a2e",
        "surface-elevated": "#25253e",
        "text-primary": "#e2e8f0",
        "primary": "#60a5fa"
      }
    },
    "css_output_path": "src/lib/styles/tokens.css"
  }
}
```

### Page Document (`pages/{name}.json`)

```json
{
  "schema_version": "1.0.0",
  "document_type": "page",
  "document_id": "page_main_editor",
  "name": "Main Editor Page",
  "canvas_source": { "document_id": "...", "page_id": "pages-page", "frame_ids": ["frame_editor_desktop", "frame_editor_mobile"] },
  "version": 1,
  "payload": {
    "page_name": "MainEditor",
    "route": "/editor",
    "layout": "layout_sidebar",
    "components": [
      { "id": "inst_1", "component": "comp_toolbar", "region": "sidebar-left", "props": {} },
      { "id": "inst_2", "component": "comp_file_tree", "region": "sidebar-left", "props": { "expanded": true } },
      { "id": "inst_3", "component": "comp_note_editor", "region": "content", "props": {} },
      { "id": "inst_4", "component": "comp_property_panel", "region": "sidebar-right", "props": {} }
    ],
    "responsive_variants": {
      "mobile": { "hidden_regions": ["sidebar-right"], "collapsed_regions": ["sidebar-left"] },
      "tablet": { "collapsed_regions": ["sidebar-right"] }
    }
  }
}
```

## Implementation Phases

### Phase 1: Document Schema & Store (Foundation)

**Files**:
- `src/lib/types/design-documents/` — TypeScript interfaces for all 6 document types
- `src/lib/services/design-docs/` — Document CRUD service (read/write JSON files)
- `.bismuth/design-docs/` — Storage directory with gitkeep

**Risk**: Low — pure data modeling, no UI changes

### Phase 2: Document Generator (Canvas → Documents)

**Files**:
- `src/lib/services/canvas/documentGenerator.ts` — Transforms canvas state to design docs
- `src/lib/services/canvas/tokenExtractor.ts` — CanvasVariable[] → Token Document
- `src/lib/services/canvas/componentExtractor.ts` — Component frames → Component Documents
- `src/lib/services/canvas/layoutExtractor.ts` — Layout frames → Layout Documents

**Risk**: Medium — depends on consistent canvas element tagging

### Phase 3: MCP Tools for Design Documents

**Files**:
- `src/lib/services/canvas/mcpDesignServer/documents.ts` — New MCP tool handlers
- New tools: `get_design_document`, `list_design_documents`, `put_design_document`, `diff_design_document`

**Risk**: Low — extends existing MCP server infrastructure

### Phase 4: Code Reflector (Code → Canvas)

**Files**:
- `src/lib/services/design-docs/codeReflector.ts` — Parses running code state to documents
- `src/lib/services/design-docs/tokenReflector.ts` — Reads tokens.css → Token Document
- `src/lib/services/design-docs/componentReflector.ts` — Parses Svelte files → Component Docs

**Risk**: Medium — requires reliable code parsing

### Phase 5: Canvas UI for Design Documents

**Files**:
- `src/lib/components/canvas/DesignDocumentPanel.svelte` — Sidebar panel showing doc status
- `src/lib/components/canvas/DocumentSyncButton.svelte` — Trigger sync operations
- Canvas page templates for the fixed structure (Tokens/Components/Layouts/Flows/Pages)

**Risk**: Low — standard UI component work

### Phase 6: Diff Engine & Versioning

**Files**:
- `src/lib/services/design-docs/diffEngine.ts` — JSON diff between document versions
- `src/lib/services/design-docs/versionStore.ts` — Version history with rollback

**Risk**: Low — well-understood diff algorithms on structured JSON

## Affected Code Paths

- `src/lib/services/canvas/mcpDesignServer/` — Extended with document tools
- `src/lib/types/canvas/document.ts` — MCPCanvasConfig may need document fields
- `.bismuth/` directory — New `design-docs/` subdirectory
- `src/lib/styles/tokens.css` — Target for token document code generation

## Rejected Alternatives

1. **Embedding design docs in SQLite**: Harder for external tools/agents to access; JSON files are more portable
2. **Real-time canvas↔code sync via file watchers**: Race conditions, complexity explosion; event-driven is simpler
3. **Single "master design" document**: Poor diffability, doesn't scale to large design systems
4. **Using Figma export format**: Proprietary, not optimized for Bismuth's internal structure

## Test Strategy

- **Unit**: Document schema validation, extractor functions, diff engine
- **Integration**: Canvas save → document generation → MCP retrieval round-trip
- **E2E**: Design a component in canvas → generate doc → AI produces code → code renders correctly

## Constitution Compliance

| Principle | Status | Notes |
| --- | --- | --- |
| I. Code Quality | Compliant | All new files <300 lines via service splitting |
| II. Testing | Compliant | Unit tests for extractors and schemas |
| III. Consistent UX | Compliant | Panel design follows existing inspector pattern |
| IV. Performance | Compliant | Doc gen <200ms target, async file I/O |
| V. Research-First | Compliant | Modeled on Figma MCP + Code Connect patterns |
| VI. Code Organization | Compliant | Domain folders, barrel exports |
| VII. Spec-Driven | Compliant | This plan follows spec 007 |
| VIII. Token Architecture | Compliant | Token documents generate tokens.css |
| IX. Multi-Agent | Compliant | MCP tools accessible to all agents |

## Complexity Tracking

| Aspect | Status | Notes |
| --- | --- | --- |
| New document format | Design complete | 6 schemas defined above |
| MCP extensions | Low risk | Builds on existing server |
| Bi-directional sync | Medium risk | Code reflector parsing complexity |
| File size compliance | Pre-planned | Each extractor is a focused module |
