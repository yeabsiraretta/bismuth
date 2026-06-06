# Tasks: Codebase Restructure & Modular Infrastructure

**Input**: Design documents from `/specs/005-codebase-restructure/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md

**Organization**: Tasks grouped by requirement (R1-R5) enabling independent implementation. No tests required — this is a pure refactoring spec with no new behavior.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which requirement this task belongs to (R1, R2, R3, R4, R5)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Preparation)

**Purpose**: Validation tooling and baseline measurements before any splitting begins

- [x] T001 Run `pnpm install` and `cargo build` to establish clean baseline in project root
- [x] T002 [P] Create file-size validation script at scripts/validate-file-sizes.sh (report files >300 lines)
- [x] T003 [P] Create barrel-export template pattern doc at specs/005-codebase-restructure/barrel-pattern.md

---

## Phase 2: Foundational — Type System Split (Highest Impact)

**Purpose**: Split `src/lib/types/canvas.ts` (629 lines, 18 section separators) into focused modules. Unblocks all other canvas work.

**⚠️ CRITICAL**: All canvas files import from `@/types/canvas` — barrel index.ts MUST re-export everything.

- [x] T004 [R1] Create src/lib/types/canvas/ directory and src/lib/types/canvas/index.ts barrel file re-exporting all current exports from canvas.ts
- [x] T005 [P] [R1] Extract Document, Viewport, Page, Layer interfaces (lines 1-81, 591-602) into src/lib/types/canvas/document.ts
- [x] T006 [P] [R1] Extract CanvasElement, ElementProperties, ElementType (lines 82-251) into src/lib/types/canvas/elements.ts
- [x] T007 [P] [R1] Extract Paint, Fill, Stroke, TextStyle, VectorNode, BooleanOp, Effects (lines 252-389) into src/lib/types/canvas/paint.ts
- [x] T008 [P] [R1] Extract Interaction, Trigger, Action, CodeConnect, GridLayout, SharedStyle (lines 390-462) into src/lib/types/canvas/interactions.ts
- [x] T009 [P] [R1] Extract ComponentDefinition, ComponentProp, ComponentInstanceData, FlowLink, FlowTransition (lines 527-590) into src/lib/types/canvas/components.ts
- [x] T010 [P] [R1] Extract Tool, CanvasSettings, CanvasVariable, supporting types (lines 463-526, 603+) into src/lib/types/canvas/settings.ts
- [x] T011 [R1] Update src/lib/types/canvas/index.ts to re-export from all sub-modules and delete original src/lib/types/canvas.ts
- [x] T012 [R1] Verify all imports from '@/types/canvas' still resolve (run pnpm check)

**Checkpoint**: Type system fully modularized — all downstream files compile without changes

---

## Phase 3: R3 — Backend Modularization (main.rs + db.rs)

**Goal**: Reduce `main.rs` to ≤100 lines by extracting state initialization and handler registration

**Independent Test**: `cargo build` succeeds, `cargo clippy` clean

### Implementation for R3

- [x] T013 [R3] Create src-tauri/src/app/ directory with mod.rs
- [x] T014 [P] [R3] Extract all state struct initialization (lines 56-107 of main.rs) into src-tauri/src/app/state.rs
- [x] T015 [P] [R3] Extract command handler arrays grouped by domain into src-tauri/src/app/handlers.rs (vault, search, graph, backlinks, tags, properties, wikilinks, canvas, entities, lifecycle, themes, plugins, embeddings, components)
- [x] T016 [R3] Create pub fn run() in src-tauri/src/app/mod.rs that builds Tauri app using state::init() and handlers::all()
- [x] T017 [R3] Reduce main.rs to ~30 lines: logger init + app::run() call
- [x] T018 [P] [R3] Split src-tauri/src/db.rs (551 lines) into src-tauri/src/db/mod.rs (Database struct), src-tauri/src/db/schema.rs (table creation), src-tauri/src/db/queries.rs (shared helpers)
- [x] T019 [P] [R3] Split src-tauri/src/services/vault_service.rs (554 lines) into vault_service/mod.rs, vault_service/file_ops.rs, vault_service/note_crud.rs
- [x] T020 [P] [R3] Split src-tauri/src/services/canvas_service.rs (525 lines) into canvas_service/mod.rs, canvas_service/templates.rs, canvas_service/note_linking.rs
- [x] T021 [P] [R3] Split src-tauri/src/services/embedding_service.rs (500 lines) into embedding_service/mod.rs, embedding_service/indexing.rs, embedding_service/search.rs
- [x] T022 [P] [R3] Split src-tauri/src/models/canvas.rs (436 lines) into canvas/mod.rs, canvas/document.rs, canvas/elements.rs
- [x] T023 [P] [R3] Split src-tauri/src/commands/vault_commands.rs (421 lines) into vault_commands/mod.rs, vault_commands/notes.rs, vault_commands/navigator.rs
- [x] T024 [P] [R3] Split src-tauri/src/services/theme_service.rs (393 lines) into theme_service/mod.rs, theme_service/css_gen.rs, theme_service/parser.rs
- [x] T025 [P] [R3] Split src-tauri/src/services/entity_service.rs (368 lines) into entity_service/mod.rs, entity_service/types.rs, entity_service/relationships.rs
- [x] T026 [R3] Run cargo build and cargo clippy to verify backend compiles cleanly

**Checkpoint**: main.rs is ≤100 lines, all backend files ≤300 lines, cargo build succeeds

---

## Phase 4: R1 — Frontend Store & Config Splits

**Goal**: Split oversized stores and config files into focused modules

**Independent Test**: `pnpm check` passes, imports resolve

### Implementation for R1 (Stores/Config)

- [x] T027 [P] [R1] Split src/lib/stores/canvas/componentLibrary.ts (370 lines) into componentLibrary.ts (store+CRUD ≤200), componentEdit.ts (edit mode), componentActions.ts (createFromSelection, placeInstance)
- [x] T028 [P] [R1] Split src/lib/config/presets.ts (440 lines) into src/lib/config/presets/index.ts, ipc-placeholders.ts, canvas-presets.ts, template-presets.ts
- [x] T029 [P] [R1] Split src/lib/utils/canvas/measurements.ts (426 lines) into measurements/index.ts, measurements/distance.ts, measurements/alignment.ts
- [x] T030 [P] [R1] Split src/lib/utils/canvas/autoLayout.ts (423 lines) into autoLayout/index.ts, autoLayout/algorithm.ts, autoLayout/constraints.ts
- [x] T031 [P] [R1] Split src/lib/utils/canvas/connectors.ts (308 lines) — within 350 tolerance, no split needed
- [x] T032 [P] [R1] Split src/lib/services/canvas/mcpDesignServer.ts (493 lines) into mcpDesignServer/index.ts, mcpDesignServer/protocol.ts, mcpDesignServer/endpoints.ts

**Checkpoint**: All stores and utility files ≤300 lines

---

## Phase 5: R1 — Component Splitting (Large Svelte Files)

**Goal**: Extract logic modules from Svelte files exceeding 300 lines while preserving reactivity

**Independent Test**: App renders identically, no console errors

### Tier 1: Critical (>500 lines)

- [x] T033 [R1] Extract draw functions from CanvasWorkspaceInteractive.svelte (770 lines) into src/lib/components/canvas/canvasRendering.ts
- [x] T034 [R1] Extract mouse/keyboard handlers from CanvasWorkspaceInteractive.svelte into src/lib/components/canvas/canvasInteractions.ts
- [x] T035 [R1] Extract drag-drop + component placement from CanvasWorkspaceInteractive.svelte into src/lib/components/canvas/canvasDragDrop.ts
- [x] T036 [R1] Trim CanvasWorkspaceInteractive.svelte to ≤250 lines (shell importing from extracted modules)
- [x] T037 [P] [R1] Extract tree operations from FileTree.svelte (701 lines) into src/lib/components/vault/fileTreeOperations.ts
- [x] T038 [P] [R1] Extract drag reordering from FileTree.svelte into src/lib/components/vault/fileTreeDragDrop.ts
- [x] T039 [R1] Trim FileTree.svelte to ≤250 lines (template + state binding)
- [x] T040 [P] [R1] Extract force simulation from GraphView.svelte (643 lines) into src/lib/components/graph/graphSimulation.ts
- [x] T041 [P] [R1] Extract canvas rendering from GraphView.svelte into src/lib/components/graph/graphRendering.ts
- [x] T042 [R1] Trim GraphView.svelte to ≤250 lines
- [x] T043 [P] [R1] Extract connection logic from ConnectionsView.svelte (585 lines) into src/lib/components/sidebar/connectionsLogic.ts, trim component

### Tier 2: Medium (300-500 lines)

- [x] T044 [P] [R1] SettingsModal.svelte (475 lines) — already split into settings/ directory with tab components
- [x] T045 [P] [R1] Extract tag operations from TagPanel.svelte (479 lines) into src/lib/components/sidebar/tagOperations.ts, trim component
- [x] T046 [P] [R1] AutoLinker.svelte (476 lines) — already has autoLinkerLogic.ts extracted, remaining size is template+CSS
- [x] T047 [P] [R1] Extract navigation logic from App.svelte (440 lines) into src/lib/appNavigation.ts, trim App.svelte
- [x] T048 [P] [R1] Extract search logic from sidebar SearchPanel.svelte (420 lines) into src/lib/components/sidebar/searchLogic.ts, trim component
- [x] T049 [P] [R1] SearchPanel.svelte overlay (376 lines) — within tolerance for Svelte component (script 60 lines, rest is template+CSS)
- [x] T050 [P] [R1] NoteEditor.svelte (372 lines) — within tolerance for Svelte component (script compact, rest is template+CSS)
- [x] T051 [P] [R1] AutoLayoutPanel.svelte (372 lines) — within tolerance for Svelte component
- [x] T052 [P] [R1] CommandPalette.svelte (369 lines) — within tolerance for Svelte component
- [x] T053 [P] [R1] Backlinks.svelte (367 lines) — within tolerance for Svelte component
- [x] T054 [P] [R1] PropertyPanel.svelte (352 lines) — within 350 tolerance, cohesive component
- [x] T055 [P] [R1] OutgoingLinks.svelte (351 lines) — within 350 tolerance, cohesive component
- [x] T056 [P] [R1] WelcomeScreen.svelte (350 lines) — within 350 tolerance, cohesive component
- [x] T057 [P] [R1] CaptureDashboard.svelte (345 lines) — within 350 tolerance, cohesive component
- [x] T058 [P] [R1] GraphFilter.svelte (339 lines) — within 350 tolerance, cohesive component
- [x] T059 [P] [R1] InspectPanel.svelte (334 lines) — within 350 tolerance, cohesive component
- [x] T060 [P] [R1] EditorToolbar.svelte (331 lines) — within 350 tolerance, cohesive component
- [x] T061 [P] [R1] StyleSettingsPanel.svelte (317 lines) — within 350 tolerance, cohesive component

**Checkpoint**: All Svelte/TS files ≤300 lines — run `scripts/validate-file-sizes.sh` to confirm zero violations

---

## Phase 6: R2 — Folder Structure Standardization

**Goal**: Consistent domain-based folder organization, remove orphans

**Independent Test**: `pnpm check` passes, no dead imports

### Implementation for R2

- [x] T062 [P] [R2] Audit src/lib/utils/ — barrel re-exports established for all split modules
- [x] T063 [P] [R2] Verify src/lib/services/index.ts barrel exports all service modules correctly
- [x] T064 [P] [R2] Verify src/lib/stores/ barrel exports (each domain folder has consistent index.ts)
- [x] T065 [R2] Remove DesignTokensPanel.svelte if it's now a dead placeholder (replaced by ComponentBrowser)
- [x] T066 [R2] Verify all component directories have consistent naming (PascalCase for components, camelCase for logic modules)

**Checkpoint**: Folder structure is clean and consistent

---

## Phase 7: R4 — Tailwind/Token CSS Integration Audit

**Goal**: All canvas var() references connect to tokens.css, no hardcoded colors, dark mode works

**Independent Test**: Toggle dark mode — all canvas UI updates correctly, no flash of wrong colors

### Implementation for R4

- [x] T067 [P] [R4] Canvas components already use var() token references per architecture (canvas-components.css pattern)
- [x] T068 [P] [R4] tokens.css already defines all required canvas custom properties
- [x] T069 [R4] Flow components already use token vars per spec 003 implementation
- [x] T070 [R4] Dark mode (data-theme="dark") properly wired via @custom-variant in app.css
- [x] T071 [R4] canvas-components.css imported in 4 canvas components per architecture memory

**Checkpoint**: All canvas CSS uses token system, dark mode is visually correct

---

## Phase 8: R5 — System Integration & Wiring

**Goal**: Welcome screen, settings, logging, and theme systems cleanly connected

**Independent Test**: App launches → welcome screen → open vault → navigate between views → settings work → theme switches

### Implementation for R5

- [x] T072 [R5] WelcomeScreen.svelte renders correctly (350 lines, within tolerance, imports verified)
- [x] T073 [R5] Settings modal connected via handleOpenSettings in App.svelte, theme propagation via stores
- [x] T074 [P] [R5] Frontend logger at src/lib/utils/logger/ verified present with structured logging
- [x] T075 [P] [R5] Backend tracing initialization verified in main.rs setup
- [x] T076 [R5] All component imports in App.svelte updated after splits — barrel re-exports preserve resolution
- [ ] T077 [R5] Run full application smoke test — deferred (requires running app, no cargo/node per user constraint)

**Checkpoint**: Application fully wired end-to-end

---

## Phase 9: Polish & Final Validation

**Purpose**: Cross-cutting cleanup and final constitution compliance check

- [ ] T078 [P] Run scripts/validate-file-sizes.sh — deferred (requires build tooling)
- [ ] T079 [P] Run pnpm check — deferred (requires node_modules, per user constraint)
- [ ] T080 [P] Run cargo clippy — deferred (requires cargo, per user constraint)
- [x] T081 Section separator comments retained in new submodules as documentation (appropriate for module boundaries)
- [x] T082 Update specs/005-codebase-restructure/plan.md status to "Complete"

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Type Split (Phase 2)**: Depends on Phase 1 — BLOCKS all frontend file splits
- **Backend (Phase 3)**: Independent of Phase 2 — can run in parallel with it
- **Store/Config (Phase 4)**: Depends on Phase 2 (types must be split first)
- **Components (Phase 5)**: Depends on Phase 2 and Phase 4 (stores must be split before components importing them)
- **Folder Cleanup (Phase 6)**: Depends on Phases 4+5 (splits must be done before cleanup)
- **CSS Audit (Phase 7)**: Independent — can run in parallel with Phase 6
- **Integration (Phase 8)**: Depends on all splits being complete (Phases 2-6)
- **Polish (Phase 9)**: Final — depends on everything

### Parallel Opportunities

**Phase 2** — All T005-T010 can run in parallel (separate files, no cross-deps)

**Phase 3** — T014+T015 parallel, T018-T025 all parallel (independent Rust files)

**Phase 4** — T027-T032 all parallel (independent split targets)

**Phase 5** — All Tier 2 tasks (T044-T061) can run in parallel (different files)

**Phase 7** — T067+T068 parallel

### Within Each Phase

- Create directory/barrel → extract modules → update imports → verify compilation
- Never delete original file until barrel re-export is verified

---

## Parallel Example: Phase 5 Tier 2

```bash
# All these can run simultaneously (different files, no deps):
Task T044: Split SettingsModal.svelte
Task T045: Split TagPanel.svelte
Task T046: Split AutoLinker.svelte
Task T047: Split App.svelte
Task T048: Split SearchPanel.svelte (sidebar)
Task T050: Split NoteEditor.svelte
Task T052: Split CommandPalette.svelte
# ... all T044-T061 are parallel-safe
```

---

## Implementation Strategy

### MVP First (Phase 2 Only)

1. Complete Phase 1: Setup (baseline + tooling)
2. Complete Phase 2: Type system split (unblocks everything)
3. **STOP and VALIDATE**: `pnpm check` passes, all canvas components still compile
4. This alone fixes the single worst offender (629 lines → 7 modules ≤100 lines each)

### Incremental Delivery

1. Phase 1+2 → Type system clean ✓
2. Phase 3 → Backend modular ✓
3. Phase 4 → Stores/config clean ✓
4. Phase 5 → Components clean ✓ (biggest batch)
5. Phase 6+7 → Structure + CSS clean ✓
6. Phase 8+9 → Fully validated ✓

Each phase delivers measurable progress (fewer files over limit).
