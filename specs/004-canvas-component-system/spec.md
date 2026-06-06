# 004 — Canvas Component System

## Summary

Replace the artificial variant/component abstraction (carried over from a different system) with a real **component system** native to the Bismuth canvas. Components are reusable composites built directly from canvas primitives. Users create component libraries, assemble layered page experiences and flows, and orchestrate/preview them at both a high level and in fine detail.

## Problem Statement

The current `canvasComponentVariants.ts` module models "components" as configuration objects with token bindings and variant matrices. This is a design-system-token approach lifted from an external tool — it doesn't represent how Bismuth users actually build things on the canvas. Real canvas work involves:

1. Composing rectangles, text, frames, and other primitives into reusable groups.
2. Saving those groups as named components that can be instantiated many times.
3. Building page layouts and multi-screen flows from those components.
4. Previewing and orchestrating the flow at different zoom levels.

## Goals

- **G1**: Users can select any group of canvas elements and "Create Component" to make it reusable.
- **G2**: Components live in a library (per-vault or shared) and appear in a component browser panel.
- **G3**: Placing a component creates an instance that stays linked to its definition — edits to the definition propagate.
- **G4**: Users can build multi-page flows (sequences of frames/screens) and preview them as a prototype walkthrough.
- **G5**: High-level overview mode shows the full flow graph; detail mode drills into any frame.
- **G6**: Remove the legacy variant/token-binding system (`canvasComponentVariants.ts`, `canvasDesignTokens.ts` configuration objects) and replace with the native component model.

## User Stories

### US01 — Create Component from Selection

> As a designer, I want to select a group of canvas elements and save them as a named component so I can reuse the group elsewhere.

**Acceptance Criteria**:
- Multi-select elements → right-click → "Create Component"
- Prompted for component name
- Selected elements become a single component instance on canvas
- Component definition stored in vault's component library

### US02 — Component Library Browser

> As a designer, I want to browse my saved components and drag them onto the canvas.

**Acceptance Criteria**:
- A "Components" panel in the canvas sidebar lists all saved components
- Searching/filtering by name
- Drag a component from the panel onto the canvas to create a new instance
- Shows thumbnail preview of each component

### US03 — Instance ↔ Definition Linking

> As a designer, I want all instances of a component to update when I edit the component's definition.

**Acceptance Criteria**:
- Double-click instance → enters component editing mode (edits the definition)
- On exit from editing mode, all instances on all pages reflect changes
- Instances can have per-instance overrides (e.g., text content) that survive definition updates

### US04 — Multi-Page Flows

> As a designer, I want to arrange multiple frames into a navigational flow and preview it as a prototype.

**Acceptance Criteria**:
- Frames can be connected with "flow links" (arrows with interaction metadata)
- A "Preview" mode plays through the flow (click hotspots advance to linked frame)
- Flow graph visible in an overview minimap

### US05 — Overview & Detail Modes

> As a designer, I want to zoom out to see the full flow structure, then zoom into any single frame for detail work.

**Acceptance Criteria**:
- Overview mode: all pages shown at reduced scale with flow connections visible
- Double-click a frame in overview → transitions to detail (100% zoom on that frame)
- Keyboard shortcut to toggle overview/detail

## Non-Goals (this spec)

- Collaborative real-time editing of components
- External package manager for sharing component libraries across vaults
- Animation/motion design within components
- Code export from components

## Technical Constraints

- Must integrate with existing canvas store (`canvasStore.ts`, `canvasElements.ts`)
- Component definitions stored as JSON files in vault (`.bismuth/components/`)
- Instance linking must be lightweight — no deep cloning of element trees on every render
- Preview mode runs client-side only (no server involvement)

## Migration

- Remove `canvasComponentVariants.ts` (BUILTIN_COMPONENT_CONFIGS, resolveTokenBindings, etc.)
- Remove `canvasDesignTokens.ts` token collection system (DEFAULT_COLOR_COLLECTION, etc.)
- Remove MCP design server endpoints that reference these (`get_component_defs`, `get_variable_defs`)
- Preserve canvas primitives and element factory — those are real
