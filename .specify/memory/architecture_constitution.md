# Bismuth Architecture Constitution

**Version**: 1.4.0 | **Created**: 2026-06-08 | **Governance**: constitution.md v1.4.0

## Project Identity

- **Stack**: Svelte 5 + TypeScript + Tauri 2 (Rust backend)
  - Note: Legacy Svelte 4 syntax (export let, $:) in use; runes migration planned
- **Style**: Modular Monolith (desktop app with plugin-ready boundaries)
- **Type**: Desktop PKM editor with canvas/graph capabilities
- **Platforms**: macOS, Windows, Linux (via Tauri)
- **Styling**: CSS custom properties (tokens.css) + Tailwind v4 (CSS config)
- **State**: Svelte writable/derived stores
- **Persistence**: Tauri filesystem commands (vault JSON/Markdown files)

---

## Layer Boundaries

### Dependency Direction

Dependencies MUST flow downward only:

- **Entry** (UI Components) reads from **Application** (Stores)
- **Application** (Stores) uses **Domain** (Utils/Types)
- **Application** (Stores) calls **Data** (Services) for persistence
- **Domain** (Utils) is pure — no side effects, no imports from other layers
- **Data** (Services) wraps **External** (Tauri IPC, OS APIs)
- **Stores** MUST NOT import from `@tauri-apps/api/core` — delegate to services

### Violations (P0 Blocking)

- Stores MUST NOT import components
- Utils MUST NOT import stores or services
- Services MUST NOT import stores or components
- Components MUST NOT call Tauri `invoke()` directly — use services

---

## Module Ownership

### Component Boundaries

| Directory              | Responsibility                 | MUST NOT                     |
| ---------------------- | ------------------------------ | ---------------------------- |
| `components/sidebar/`  | Sidebar panels, tab bars       | Contain canvas logic         |
| `components/note/`     | Markdown editor, preview       | Import canvas stores         |
| `components/canvas/`   | Canvas workspace, tools        | Import note/editor stores    |
| `components/editor/`   | CodeMirror wrapper, extensions | Have direct vault knowledge  |
| `components/vault/`    | File tree, toolbar             | Import canvas internals      |
| `components/overlays/` | Modals, palettes, settings     | (May cross-reference stores) |
| `components/icons/`    | Icon components                | Have state or side effects   |

### Store Boundaries

| Store            | Owns                               | MUST NOT Import         |
| ---------------- | ---------------------------------- | ----------------------- |
| `stores/vault/`  | Notes, active note, vault state    | Canvas or layout stores |
| `stores/canvas/` | Canvas elements, tools, components | Vault or note content   |
| `stores/layout/` | Sidebar, tabs, widths              | Domain-specific stores  |
| `stores/theme/`  | Theme preference                   | Anything except types   |

### Service Boundaries

| Service                 | Responsibility                      |
| ----------------------- | ----------------------------------- |
| `services/vault/`       | Tauri IPC for vault/note CRUD       |
| `services/canvas/`      | Tauri IPC for component persistence |
| `services/design-docs/` | Design document generation          |

---

## File Organization Rules

### Size Limits

- No code or test file MUST exceed **300 lines** (tolerance to **350** when splitting harms cohesion)
- Files exceeding 350 MUST be refactored immediately
- Files over 400 lines MUST block commits (enforced by `scripts/quality/check-file-sizes.sh`)

### Folder Density Limits

- **Max 8 implementation files per frontend directory** (excludes `index.ts` barrel files and test files)
- **Max 12 implementation files per Rust directory** (excludes `mod.rs` and `*_tests.rs` files)
- When a folder exceeds 8 files, it MUST be split into domain-scoped subfolders
- Each subfolder MUST have a clear singular purpose inferable from its name
- Folders MUST NOT become catch-all dumps (e.g., no flat `utils/` with 15+ unrelated helpers)

### Layer Separation (Physical Directories)

Each layer MUST live in its own directory. Layers MUST NOT be mixed:

| Layer      | Directory                             | Contains                                   | MUST NOT Contain                                       |
| ---------- | ------------------------------------- | ------------------------------------------ | ------------------------------------------------------ |
| Services   | `services/`                           | IPC/API adapters, external communication   | UI logic, store imports, components                    |
| Stores     | `stores/`                             | Global reactive state (writables, derived) | Orchestration logic, side effects beyond store updates |
| Types      | `types/`                              | Interfaces, type definitions, enums        | Runtime code, imports with side effects                |
| Constants  | `config/`                             | Shared config, route defs, static data     | Logic, functions, class instances                      |
| Components | `components/`                         | Svelte UI components                       | Direct IPC calls, business orchestration               |
| Utils      | `utils/`                              | Pure helper functions                      | Store/service imports, side effects                    |
| Tests      | `__tests__/` or co-located `.spec.ts` | Test files only                            | Production logic                                       |

### Feature-Scoped vs Global Logic

- **Global stores** (`stores/`): State that survives navigation and is shared across features
- **Feature-scoped logic**: Orchestration, derived helpers, and complex state that belongs to one feature MUST be co-located with that feature (e.g., `components/canvas/canvasHelpers.ts`)
- When a composable/helper grows beyond 300 lines, split by domain concern (e.g., `useBuilderSync.init.ts`, `useBuilderSync.slots.ts`)
- Feature-scoped files MUST NOT be placed in global `utils/` or `stores/` if only one feature uses them

### Feature Modules (`features/`)

When a feature has artifacts in 2+ layer directories and is NOT cross-cutting infrastructure,
it MUST be organized as a feature module in `src/lib/features/<feature-name>/`:

- **Internal structure**: `stores/`, `services/`, `components/`, `types/`, `__tests__/`
- **Public API**: Single `index.ts` barrel at module root — only exported symbols are public
- **Layer separation**: Maintained WITHIN the module via sub-directories (stores/ contains only state, services/ only IPC, etc.)
- **Cross-feature imports**: MUST use the public barrel (`@/features/<name>`), never internal paths
- **Density rule**: Max 8 files per sub-directory (standard density rule applies within modules)
- **Dependency direction**: Features import from Core layer and other features' public APIs; MUST NOT create circular dependencies

**Core layer** (NOT eligible for feature-module extraction):
`stores/vault/`, `stores/layout/`, `stores/settings/`, `stores/theme/`, `services/vault/`, `utils/`, `types/`, `config/`, `components/ui/`

**Feature eligibility triggers**:

1. Code exists in 2+ layer directories (e.g., stores + services + components)
2. Feature is NOT consumed as infrastructure by 5+ other features
3. Feature has a clear single-domain boundary

### Subfolder Creation Triggers

A subfolder MUST be created when:

1. A directory exceeds 8 implementation files
2. Files within a directory serve 3+ distinct sub-domains
3. A feature requires both UI components AND supporting logic (co-locate both)
4. Test files for a directory exceed 5 files (create `__tests__/` subfolder)

### Folder-Level Review Process

Before splitting individual files, perform a **folder-level review** to assess the
directory's overall structure and determine the correct refactoring approach:

1. **Inventory**: List all files in the folder with their line counts and responsibilities
2. **Domain clustering**: Group files by the sub-domain they serve (e.g., rendering, state, interactions, data)
3. **Dependency map**: Identify which files import from each other — tightly coupled files belong together
4. **Co-location assessment**: Determine which `.ts` logic files exist only to serve one `.svelte` component
5. **Decision**: Choose between:
   - **Subfolder split** — when 3+ distinct domains exist in one folder
   - **Co-located extraction** — when a component needs supporting logic
   - **No action** — when files are cohesive and within limits

This review MUST happen before creating co-located `.ts` extractions. Random extraction
without folder context leads to scattered logic that's harder to discover.

### Co-Located Logic Files

When a `.svelte` component requires extracted logic:

- The `.ts` file MUST be named after the component or its concern (e.g., `FileTree.svelte` + `fileTreeOperations.ts`)
- Co-located logic MUST live in the **same directory** as the component it serves
- If a folder accumulates 3+ co-located `.ts` files for one feature, create a subfolder (e.g., `canvas/workspace/`)
- Co-located files MUST NOT be consumed by components outside their folder — if reuse is needed, promote to `utils/`

### File Splitting Strategy

When a file exceeds size limits:

1. Extract logic into co-located `.ts` module (e.g., `Component.svelte` + `componentLogic.ts`)
2. Use barrel re-exports from the original path for API compatibility
3. Condense CSS rules to single-line format when styles push files over limit
4. Use recursive components to eliminate template duplication in Svelte
5. Split orchestration composables by domain concern (`.init.ts`, `.crud.ts`, `.render.ts`)
6. After extraction, reassess the folder — does it now need subfolder splitting?

### Organization Conventions

- Templates and large text collections MUST go in dedicated directories
- Large data collections MUST be externalized to JSON/YAML in `config/`
- Scripts MUST be organized into categorical subfolders (`quality/`, `git/`, `build/`)
- CodeMirror extensions MUST be isolated in `components/editor/extensions/` as pure `.ts` files
- Demo/fixture data MUST live in a dedicated `demo-data/` or `fixtures/` directory, never inline

---

## Svelte Component Rules

1. **Props over global state**: Components receive data via props for component-scoped data. Stores only for truly shared state.
2. **Reactive cycle prevention**: Any `$:` block that writes to a store MUST NOT transitively trigger itself. Guard with path/reference checks.
3. **Event delegation**: Children communicate upward via callback props or `dispatch`. MUST NOT directly mutate parent state.
4. **Co-located logic**: When `.svelte` exceeds 300 lines, extract to co-located `.ts` first.
5. **Extension pattern**: CodeMirror extensions are pure `.ts` files exporting plugin/theme arrays.
6. **Compartment pattern**: Dynamic editor reconfiguration MUST use `Compartment` with reactive prop tracking and `mounted` guards.

---

## Tauri Integration Rules

1. All `invoke()` calls MUST be wrapped in service functions (`src/lib/services/`).
2. Service functions MUST catch Tauri errors and return typed results or throw domain errors.
3. New Rust commands MUST be registered in `src-tauri/src/main.rs` with a TypeScript service wrapper.
4. Data crossing IPC MUST use JSON-serializable types (no Date objects, class instances, or functions).
5. Tauri commands MUST validate path arguments against the active vault directory.

---

## Rust Backend Domain Organization

### Layer Separation (Rust)

The Rust backend preserves physical layer separation:

| Layer    | Directory   | Contains                                 |
| -------- | ----------- | ---------------------------------------- |
| Commands | `commands/` | Tauri IPC handlers (`#[tauri::command]`) |
| Services | `services/` | Business logic, orchestration            |
| Models   | `models/`   | Data structures, serialization types     |
| Domains  | `domains/`  | Thin facade re-exports (no logic)        |
| Utils    | `utils/`    | Pure shared helpers                      |

### Domain Facade Pattern (`src-tauri/src/domains/`)

Domain facades provide discoverability without moving files between layers:

- One file per domain: `canvas.rs`, `knowledge.rs`, `vault.rs`, `search.rs`, `content.rs`, `system.rs`
- Facades contain ONLY `pub use` re-exports — no business logic
- Consumers MAY import via `crate::domains::<name>::Type` for convenience
- Layer-direct imports (`crate::services::...`) remain valid and idiomatic

### Rust Naming Consistency

- Command modules MUST match their domain name (e.g., `commands/canvas/` not `commands/design/`)
- When renaming, provide backward-compat alias: `pub use new_name as old_name;`
- Service directories use `_service` suffix: `canvas_service/`, `task_service/`

### Rust File Splitting

When a `.rs` file exceeds size limits:

1. Extract cohesive function groups into sibling modules (e.g., `parser_filters.rs`, `parser_utils.rs`)
2. Declare new modules in the parent `mod.rs` as `pub(crate) mod` (internal) or `pub mod` (public API)
3. Use `super::` imports for cross-module references within the same service
4. Keep `#[cfg(test)] mod tests` in the original file — test lines are excluded from the 300-line limit
5. Re-export public items from the original module for backward compatibility

---

## Styling Architecture

1. **Token-first**: All colors, spacing, radii, typography MUST reference `var(--token)` from `tokens.css`.
2. **Fallback values**: `var(--token, #fallback)` acceptable — but the token MUST exist in `tokens.css`.
3. **Scoped CSS**: Component styles use Svelte `<style>` blocks (scoped by default).
4. **No utility sprawl**: Tailwind utilities MAY be used for layout, MUST NOT replace token references for visual properties.
5. **Dark mode**: `data-theme="dark"` on `<html>`. Components MUST NOT implement their own dark mode logic.
6. **CodeMirror themes**: `EditorView.theme()` objects MUST use `var()` references. Hex fallbacks only inside `var()`.
7. **CSS imports**: Centralized in `src/app.css`. Components MUST NOT import global stylesheets.
8. **No hardcoded values**: Direct hex colors, hardcoded spacing, or inline styles MUST be flagged in review.

---

## State Management Rules

1. `writable<T>()` for mutable state that changes over time.
2. `derived()` for computed values. MUST NOT manually sync computed state.
3. Store mutations through named exported functions — not raw `.set()`/`.update()` from components.
4. No circular subscriptions: Store A MUST NOT subscribe to Store B if B subscribes to A.
5. Barrel re-exports MUST maintain existing import paths when stores are split.

---

## Contract Rules

1. All files compile under TypeScript `strict: true`.
2. Exported functions MUST have explicit return type annotations.
3. `any` types MUST include documented justification.
4. Domain entities (Note, ComponentDefinition, FlowLink) MUST use `interface`.
5. Union string literals preferred over TypeScript `enum` for serialization safety.

---

## Architecture Evolution

### Adding Features

- New features with 2+ layer concerns MUST use a feature module (`features/<name>/`).
- New UI panels go in the feature's `components/` directory or the appropriate domain-scoped component directory.
- New stores MUST NOT cross-import existing domain stores (use public barrel APIs).
- New services wrap IPC and expose typed async functions.
- Feature additions MUST NOT increase coupling between existing domains.
- Cross-feature dependencies MUST flow through public barrel exports, never internal paths.

### Refactoring

- Module splits MUST use barrel re-exports for backward compatibility.
- Store splits MUST preserve existing import paths.
- Component splits: extract logic to `.ts` first, then template only if independently testable.

### Deprecation

- Deprecated modules documented with removal timeline.
- Removal tracked in the feature spec that replaces them.
- Import paths continue working (via re-export) for at least one release cycle.

---

## Violation Severity

| Level         | Action               | Examples                                                                                     |
| ------------- | -------------------- | -------------------------------------------------------------------------------------------- |
| P0 (Blocking) | Stop, require fix    | Store imports component; component calls `invoke()` directly                                 |
| P1 (High)     | Create refactor task | File at 380 lines; missing barrel re-export; barrel using absolute internal paths            |
| P2 (Medium)   | Track in tech debt   | Hardcoded hex without token; missing return type; component calls `.set()` directly on store |
| P3 (Low)      | Note in review       | Naming drift; unused import; `export *` in feature root barrel                               |

---

## Validation Hooks

- **Pre-commit**: `scripts/quality/check-file-sizes.sh` + lint + type check
- **CI**: Full build + test coverage gate (90%) + file size block (>400)
- **Post-plan**: `/speckit.architecture-guard.violation-detection`
- **Post-implement**: `/speckit.architecture-guard.architecture-review`

---

## Barrel Export Rules (Production-Hardened)

**Added v1.4.0 — from production readiness deep-dive (spec 052)**

### Barrel Style Requirements

Feature module barrels (`features/<name>/index.ts`) MUST use **relative imports** (`./stores/`,
`./types/`, `./components/`), never absolute `@/features/<name>/stores/` paths. Absolute paths
inside a barrel defeat the module boundary and allow external consumers to reconstruct the
internal path, bypassing the barrel rule.

```ts
// CORRECT — relative paths in barrel
export { activeDocument } from './stores/spreadsheetStore';

// WRONG — absolute internal paths in barrel
export { activeDocument } from '@/features/spreadsheet/stores/spreadsheetStore';
```

### Wildcard vs Named Re-exports

- `export *` is acceptable for sub-barrel pass-throughs (e.g., `utils/logger/index.ts` re-exporting
  its single module). It MUST NOT be used in feature root barrels that expose a deliberate public API —
  those must use named exports so the public surface is explicit and tree-shakeable.
- All feature root `index.ts` files MUST use **named re-exports only**.

### Tree-shaking Enablement

`package.json` MUST include `"sideEffects": false` at the root level. This tells Vite/rolldown
that all modules can be safely tree-shaken. Exception: CSS files and entry points with side effects
must be listed explicitly in a `sideEffects` array if needed.

### Dead Code Detection

`knip` MUST be available as `pnpm lint:unused` and run before each milestone release to surface
unused exports, types, and files. Configuration lives in `knip.json` at repo root.

### Component Contracts

Every new component added to `components/ui/` MUST have a co-located `<ComponentName>.contract.md`
file. The contract documents: what the component does, its props table, its states, accessibility
behavior, design tokens used, and data arity (1:1 vs 1:Many). A component without a contract
will be flagged as P1 in architecture review. Template: `src/lib/components/ui/COMPONENT_CONTRACT_TEMPLATE.md`.

---

## Store Encapsulation Rules (Production-Hardened)

**Added v1.4.0 — from production readiness deep-dive (spec 052)**

### Store Mutation Ownership

State mutations MUST live in the store file as **named exported action functions**. Components
MUST NOT call `.set()` or `.update()` directly on stores imported from another module.

```ts
// CORRECT — action function in store
export function selectClip(clipId: string, trackId: string): void {
  selectedClipId.set(clipId);
  selectedTrackId.set(trackId);
}

// WRONG — component mutates store directly
import { selectedClipId, selectedTrackId } from '../stores/musicStore';
selectedClipId.set(clip.id); // P2 violation
selectedTrackId.set(clip.trackId); // P2 violation
```

**Exceptions**:

- A component MAY call `.set()` on a store that is purely component-local state accidentally
  exported (discouraged — prefer component-local `let` variables for local state).
- Feature-internal simple state (e.g., `isLoading`) used by exactly one component MAY use `.set()`
  if an action function would add no logic. Apply judgment.

### Logger Exception

The unified logger (`@/utils/logger`) uses raw `console.log/warn/error` internally. This is
**intentional and not a violation** — the logger IS the console output adapter. The rule
"use unified logger in application code" means application code must call `log.*()` methods,
not call `console.*()` directly. The logger's `consoleOutput()` method is the one sanctioned
consumer of the console API.

---

## Production Release Checklist

**Added v1.4.0 — from production readiness deep-dive (spec 052)**

Before any tagged release, verify:

1. `pnpm test:ci` — coverage thresholds pass (80% baseline → 90% target)
2. `pnpm lint` — 0 errors including barrel rule violations
3. `pnpm lint:css` — 0 raw hex violations
4. `pnpm lint:unused` — no unexpected dead exports (review, do not auto-suppress)
5. `pnpm check:file-sizes` — 0 files over 400 lines
6. `cargo clippy` + `cargo audit` — no warnings or CVEs
7. `pnpm build` — production build succeeds; check `dist/` bundle size
8. Tauri CSP verified in `tauri.conf.json` — no `dangerousRemoteDomainIpcAccess`
9. Sourcemaps disabled in production (`sourcemap: isDev` in `vite.config.ts`)
10. `sideEffects: false` in `package.json` (enables full tree-shaking)
11. All new `components/ui/` components have a co-located `.contract.md` file
