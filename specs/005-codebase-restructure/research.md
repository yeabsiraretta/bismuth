# Research: Codebase Restructure & Modular Infrastructure

**Date**: 2026-06-05

## R1: Files Over 300 Lines (Must Split)

### Frontend TypeScript/Svelte (30 files over limit)

| File | Lines | Split Strategy |
|------|-------|----------------|
| `CanvasWorkspaceInteractive.svelte` | 770 | Extract rendering, interactions, drag-drop into composable modules |
| `FileTree.svelte` | 701 | Extract tree operations, context menu, drag logic |
| `GraphView.svelte` | 643 | Extract force simulation, rendering, event handlers |
| `canvas.ts` (types) | 629 | Split by section comments into `document.ts`, `elements.ts`, `paint.ts`, `vector.ts`, `effects.ts`, `components.ts`, `flow.ts` |
| `ConnectionsView.svelte` | 585 | Extract connection logic, filtering |
| `mcpDesignServer.ts` | 493 | Extract protocol handling, endpoint definitions |
| `TagPanel.svelte` | 479 | Extract tag tree logic, rename/merge operations |
| `AutoLinker.svelte` | 476 | Extract matching engine, UI sections |
| `SettingsModal.svelte` | 475 | Extract tab panels into sub-components |
| `presets.ts` | 440 | Split into `ipc-placeholders.ts`, `canvas-presets.ts`, `template-presets.ts` |
| `App.svelte` | 440 | Extract navigation logic, shortcut registration |
| `measurements.ts` | 426 | Already well-structured but can extract by measurement type |
| `autoLayout.ts` | 423 | Extract algorithm steps into sub-modules |
| `SearchPanel.svelte` (sidebar) | 420 | Extract search logic, results rendering |
| `SearchPanel.svelte` (modals) | 376 | Similar split to sidebar version |
| `NoteEditor.svelte` | 372 | Extract toolbar, editing logic |
| `AutoLayoutPanel.svelte` | 372 | Extract config UI from layout engine calls |
| `componentLibrary.ts` | 370 | Extract edit mode, CRUD into sub-modules |
| `CommandPalette.svelte` | 369 | Extract command matching, rendering |
| `Backlinks.svelte` | 367 | Extract link resolution, grouping |
| `PropertyPanel.svelte` | 352 | Extract property editors |
| `OutgoingLinks.svelte` | 351 | Extract link detection |
| `WelcomeScreen.svelte` | 350 | Extract template picker, vault actions |
| `CaptureDashboard.svelte` | 345 | Extract inbox, capture form |
| `GraphFilter.svelte` | 339 | Extract filter logic |
| `InspectPanel.svelte` | 334 | Extract code generation |
| `EditorToolbar.svelte` | 331 | Extract formatting actions |
| `StyleSettingsPanel.svelte` | 317 | Extract theme preview |
| `connectors.ts` | 308 | Extract routing algorithms |

### Backend Rust (8 files over limit)

| File | Lines | Split Strategy |
|------|-------|----------------|
| `vault_service.rs` | 554 | Extract file operations, note CRUD, link operations |
| `db.rs` | 551 | Extract schema, queries, migrations into sub-modules |
| `canvas_service.rs` | 525 | Extract template operations, note-linking |
| `embedding_service.rs` | 500 | Extract indexing, search, config |
| `canvas.rs` (models) | 436 | Split parallel to frontend types |
| `vault_commands.rs` | 421 | Extract navigator commands, frontmatter commands |
| `theme_service.rs` | 393 | Extract CSS generation, theme parsing |
| `entity_service.rs` | 368 | Extract type definitions, relationship logic |

## R2: Section-Comment Files Analysis

**`src/lib/types/canvas.ts`** has 18 `// ─── Section` separators indicating natural module boundaries:

1. Document (lines 1-67)
2. Pages (lines 68-81)
3. Elements (lines 82-251)
4. Paint System (lines 252-313)
5. Text System (lines 314-331)
6. Vector Network (lines 332-364)
7. Boolean Operations (lines 365-369)
8. Effects System (lines 370-389)
9. Prototyping/Interactions (lines 390-421)
10. Code Connect (lines 422-437)
11. Grid Layout (lines 438-450)
12. Shared Styles (lines 451-462)
13. Supporting Types (lines 463-526)
14. Components (lines 527-548)
15. Component Instances (lines 549-558)
16. Flow Links (lines 559-590)
17. Layers (lines 591-602)
18. Tools (lines 603-620)
19. Settings (lines 621+)

**Decision**: Split into 7 focused modules with barrel re-export:
- `types/canvas/document.ts` — Document, Pages, Layers
- `types/canvas/elements.ts` — CanvasElement, ElementProperties
- `types/canvas/paint.ts` — Paint, Text, Vector, Effects
- `types/canvas/interactions.ts` — Prototyping, Code Connect, Grid
- `types/canvas/components.ts` — Components, Instances, Flow Links
- `types/canvas/settings.ts` — Tools, Settings, SharedStyles
- `types/canvas/index.ts` — Barrel re-export

## R3: Backend `main.rs` Modularization

**Decision**: Create `src-tauri/src/app.rs` module containing:
- `state.rs` — All state struct initialization
- `handlers.rs` — Command group registration macros/functions

This reduces `main.rs` to ~30 lines (logger init + `app::run()`).

**Alternatives considered**:
- Tauri plugin per feature domain → overkill for this project size
- Separate binary crates → unnecessary complexity for monorepo

## R4: Tailwind Integration Research

**Current state**:
- Canvas components use `var(--background-primary-alt)`, `var(--spacing-m)`, `var(--radius-s)` etc.
- These vars are defined in `tokens.css` and mapped to Tailwind in `app.css` @theme block
- Canvas `<style>` blocks are scoped CSS, not Tailwind utility classes
- This is **intentional** per the project memory: "Components use scoped CSS with var() references to tokens, NOT Tailwind utility classes"

**Decision**: The current approach is correct. The integration task is to:
1. Verify all `var()` references resolve to defined tokens
2. Add any missing canvas-specific tokens to `tokens.css`
3. Ensure dark mode `data-theme="dark"` variant applies to canvas UI
4. Remove any orphaned hardcoded colors (e.g., `#7c3aed` in flow components)

## R5: System Integration Issues

**Welcome screen**: Currently functional — routes from `WelcomeScreen.svelte` → `openVault()` → main app layout.

**Settings/style**: `StyleSettingsPanel.svelte` dispatches theme changes via `@/stores/theme/theme` → `ThemeState` backend → CSS variable injection.

**Logging**: Frontend uses `@/utils/logger` (structured log with levels), backend uses `tracing` crate. Both are functional but frontend logger could use consistent error boundaries.

**Module resolution errors**: All `Cannot find module 'svelte/store'` errors resolve after `pnpm install` — these are IDE-only when `node_modules` is stale.
