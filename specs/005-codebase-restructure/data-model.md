# Data Model: Codebase Restructure

**Date**: 2026-06-05

## Overview

This is a refactoring spec — no new data entities are introduced. The data model documents the **module boundary changes** that affect import paths and file organization.

## Module Boundary Changes

### Frontend Types (`src/lib/types/`)

**Before**: Single `canvas.ts` file (629 lines, 19 section separators)

**After**: `canvas/` directory with focused modules

```text
src/lib/types/canvas/
├── index.ts          # Barrel re-export (all public types)
├── document.ts       # CanvasDocument, Page, Layer, Viewport
├── elements.ts       # CanvasElement, ElementProperties, ElementType
├── paint.ts          # Paint, Fill, Stroke, TextStyle, VectorNode, Effects
├── interactions.ts   # Interaction, Trigger, Action, CodeConnect, GridLayout
├── components.ts     # ComponentDefinition, ComponentProp, ComponentInstance, FlowLink
└── settings.ts       # Tool, CanvasSettings, SharedStyle, CanvasVariable
```

### Frontend Store (`src/lib/stores/canvas/`)

**Before**: `componentLibrary.ts` (370 lines) contains CRUD + edit mode + instance placement

**After**: Split into focused modules

```text
src/lib/stores/canvas/
├── componentLibrary.ts   # Core store (search, filter, CRUD) ≤200 lines
├── componentEdit.ts      # Edit mode (enter/exit, snapshot) ≤100 lines
└── componentActions.ts   # createFromSelection, placeInstance ≤100 lines
```

### Frontend Config (`src/lib/config/`)

**Before**: `presets.ts` (440 lines) — all placeholder data in one file

**After**: Split by domain

```text
src/lib/config/
├── presets/
│   ├── index.ts              # Barrel
│   ├── ipc-placeholders.ts   # IPC_PLACEHOLDERS object
│   ├── canvas-presets.ts     # DEFAULT_CANVAS, canvas config
│   └── template-presets.ts   # Vault templates, default settings
└── ...
```

### Backend (`src-tauri/src/`)

**Before**: `main.rs` (226 lines) — all state init + handler registration

**After**: Extracted modules

```text
src-tauri/src/
├── main.rs           # ~30 lines: logger init → app::run()
├── app/
│   ├── mod.rs        # pub fn run() — Tauri builder
│   ├── state.rs      # All XxxState struct initialization
│   └── handlers.rs   # Command group arrays for invoke_handler
├── db/
│   ├── mod.rs        # Database struct + connection
│   ├── schema.rs     # Table creation, migrations
│   └── queries.rs    # Shared query helpers
└── ...
```

## Import Path Migration

All external consumers continue using the same paths via barrel re-exports:

```typescript
// Before AND after — no breaking changes
import type { CanvasDocument, CanvasElement } from '@/types/canvas';
import { componentLibrary } from '@/stores/canvas/componentLibrary';
```

The barrel `index.ts` files ensure backward compatibility.

## State Entities (Unchanged)

No new state is introduced. Existing entities remain:

- **AppState** — VaultService mutex
- **SearchState** — IndexService option
- **GraphState** — DB reference
- **WikilinkState** — WikilinkService + VaultService
- **CanvasState** — CanvasService mutex
- **EntityState** — EntityService option
- **ThemeState** — ThemeService option
- **PluginState** — PluginService option
- **EmbeddingState** — EmbeddingService option
- **ComponentState** — vault_root mutex
