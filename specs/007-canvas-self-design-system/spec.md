# Feature Specification: Canvas Self-Design System

**Spec ID**: 007  
**Date**: 2026-06-05  
**Status**: Draft  

---

## Summary

Bismuth uses its own canvas as the primary design tool for developing Bismuth itself — a self-referential design system where the canvas produces structured design documents that are consumed via MCP to generate and evolve the application's UI. This is the "Bismuth designs Bismuth" architecture, analogous to how Figma is used to design applications through its MCP connection and layered page system.

## Problem Statement

Currently, Bismuth's canvas can export design context to AI agents via MCP (spec 004), but there is no standardized document format or workflow for using the canvas to **design Bismuth itself**. The design-to-code pipeline is generic — it doesn't understand that the canvas elements *represent* Bismuth's own components, tokens, layouts, and pages.

We need a versioned, bi-directional document system where:
1. **Canvas → Code**: Designs in Bismuth canvas produce structured documents that AI agents consume to generate/update Bismuth source code
2. **Code → Canvas**: The running Bismuth application can reflect its current state back onto the canvas for visual inspection and iteration
3. **Side-by-side evolution**: Both the canvas system and the application evolve together, with design documents as the shared contract

## Core Concept: Design Documents

A **Design Document** is a structured JSON artifact produced by the canvas that represents a specific aspect of Bismuth's design. These documents are:
- **Versioned**: Each document has a schema version and tracks changes
- **Layered**: Documents compose — tokens feed into components, components into pages, pages into flows
- **Bi-directional**: Can be produced from canvas OR from running code state
- **MCP-consumable**: AI agents read these via MCP tools to generate code

### Document Types

1. **Token Document** — Design tokens (colors, spacing, typography, shadows)
2. **Component Document** — Component definitions with variants, props, states
3. **Layout Document** — Page layouts, grid systems, responsive breakpoints
4. **Flow Document** — Navigation flows, state transitions, interaction patterns
5. **Theme Document** — Dark/light mode mappings, brand presets
6. **Page Document** — Full page compositions using components and layouts

## Canvas Requirements

### Layered Page System
- Each page in a canvas document represents a design category (Tokens, Components, Layouts, Pages)
- Layers within pages separate concerns (annotations, measurements, live preview)
- Pages can reference elements from other pages (token usage in components)

### Design Document Generation
- Canvas elements tagged as "design sources" auto-generate documents on save
- Document generation is deterministic — same canvas state always produces same document
- Diff generation between document versions for incremental code updates

### Web Building Tools
- Frame-based page composition (like Figma's frame system)
- Component instance placement with property overrides
- Auto-layout for responsive container queries
- Grid system overlays matching Bismuth's grid-system.css

### MCP Integration
- New MCP tools specifically for design document CRUD
- `get_design_document` — fetch a specific document by type and version
- `put_design_document` — push updated document from code state back to canvas
- `diff_design_document` — get changes between two document versions
- `sync_design_state` — bi-directional sync between canvas and running app

## Document Schema

Each design document follows this envelope:

```json
{
  "schema_version": "1.0.0",
  "document_type": "component | token | layout | flow | theme | page",
  "document_id": "uuid",
  "name": "human-readable-name",
  "canvas_source": {
    "document_id": "canvas-doc-id",
    "page_id": "page-id",
    "frame_ids": ["frame-1", "frame-2"]
  },
  "created_at": "ISO-8601",
  "modified_at": "ISO-8601",
  "version": 3,
  "payload": { /* type-specific content */ }
}
```

## Success Criteria

1. A Bismuth canvas document can produce all 6 document types
2. AI agents can consume documents via MCP and generate valid Svelte components
3. Changes to running code can be reflected back into the canvas
4. The system is used to actually design and implement at least one Bismuth UI page
5. Document format is extensible for future design tools

## Non-Goals

- Real-time collaborative editing (future spec)
- Export to external design tools (Figma, Sketch)
- Full pixel-perfect rendering engine (canvas is structural, not visual)
