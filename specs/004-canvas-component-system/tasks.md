# Tasks: Canvas Component System

**Input**: Design documents from `/specs/004-canvas-component-system/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Legacy Removal + Type Foundation)

**Purpose**: Remove the artificial variant/token system and establish the native component type foundation

- [x] T001 Remove legacy componentVariants.ts from src/lib/utils/canvas/componentVariants.ts
- [x] T002 Remove legacy designTokens.ts from src/lib/utils/canvas/designTokens.ts
- [x] T003 Remove MCP design server endpoints (get_component_defs, get_variable_defs) from src/lib/services/canvas/mcpDesignServer.ts
- [x] T004 [P] Remove componentVariants and designTokens re-exports from src/lib/utils/canvas/index.ts
- [x] T005 [P] Update src/lib/types/canvas.ts: remove codeConnect and variantProperties from ComponentDefinition, add thumbnail and tags fields
- [x] T006 [P] Add FlowLink, FlowTransition, and ComponentInstance types to src/lib/types/canvas.ts
- [x] T007 Add flowLinks field to CanvasDocument interface in src/lib/types/canvas.ts
- [x] T008 Fix all import errors caused by removal of legacy modules across codebase

---

## Phase 2: Foundational (Backend + Core Store)

**Purpose**: Tauri commands for component persistence and the core component library store

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T009 Create Rust component commands file at src-tauri/src/commands/component_commands.rs with list_components, read_component, save_component, delete_component
- [x] T010 Register component commands in src-tauri/src/main.rs
- [x] T011 [P] Create frontend service wrapper at src/lib/services/canvas/components.ts (IPC calls to Rust commands)
- [x] T012 Create component library store at src/lib/stores/canvas/componentLibrary.ts (writable stores, loadLibrary, CRUD actions)
- [x] T013 [P] Create component resolver utility at src/lib/utils/canvas/componentResolver.ts (resolveInstance merges definition + overrides)

**Checkpoint**: Foundation ready — component definitions can be persisted and resolved

---

## Phase 3: User Story 1 — Create Component from Selection (Priority: P1) 🎯 MVP

**Goal**: Users can select canvas elements, right-click "Create Component", and save them as a reusable definition in the vault library.

**Independent Test**: Select 3 elements → Create Component → verify definition appears in .bismuth/components/ → verify elements on canvas become a linked instance

### Implementation for User Story 1

- [x] T014 [US1] Implement createComponentFromSelection action in src/lib/stores/canvas/componentLibrary.ts
- [x] T015 [US1] Add placeComponentInstance action in src/lib/stores/canvas/componentLibrary.ts (creates instance element on canvas)
- [x] T016 [US1] Add "Create Component" item to canvas context menu in src/lib/components/canvas/CanvasContextMenu.svelte
- [x] T017 [US1] Create component naming dialog in src/lib/components/canvas/CreateComponentDialog.svelte
- [x] T018 [US1] Wire context menu → dialog → createComponentFromSelection flow
- [x] T019 [US1] Handle component_instance element type in canvas renderer (resolve and paint child elements) in src/lib/components/canvas/CanvasWorkspaceInteractive.svelte

**Checkpoint**: User Story 1 fully functional — components can be created from selection and rendered as instances

---

## Phase 4: User Story 2 — Component Library Browser (Priority: P2)

**Goal**: A sidebar panel listing all saved components with search, filtering, and drag-to-place.

**Independent Test**: Open Components panel → see all saved components → search by name → drag one onto canvas → verify instance placed at drop position

### Implementation for User Story 2

- [x] T020 [P] [US2] Create ComponentBrowser panel at src/lib/components/canvas/ComponentBrowser.svelte (list, search, category filter)
- [x] T021 [P] [US2] Add filteredComponents derived store and componentSearch/componentCategoryFilter writables to src/lib/stores/canvas/componentLibrary.ts
- [x] T022 [US2] Implement drag-from-panel-to-canvas interaction in ComponentBrowser.svelte (drag start → canvas drop → placeComponentInstance)
- [x] T023 [US2] Add "Components" tab to canvas sidebar (integrate with existing TabbedPanel pattern)
- [x] T024 [US2] Generate and store thumbnail on component save (base64 mini-preview) in src/lib/stores/canvas/componentLibrary.ts

**Checkpoint**: User Story 2 functional — library panel works independently of other stories

---

## Phase 5: User Story 3 — Instance ↔ Definition Linking (Priority: P3)

**Goal**: Double-click an instance to enter edit mode on its definition; all instances update on exit. Per-instance overrides survive definition updates.

**Independent Test**: Place 3 instances of same component → double-click one → change a child element → exit edit mode → verify all 3 instances show the change → verify per-instance text override survives

### Implementation for User Story 3

- [x] T025 [US3] Create ComponentEditor mode UI at src/lib/components/canvas/ComponentEditor.svelte (breadcrumb, highlighted border, Done button)
- [x] T026 [US3] Implement enterComponentEditMode / exitComponentEditMode actions in src/lib/stores/canvas/componentLibrary.ts
- [x] T027 [US3] On exitComponentEditMode: save updated definition, trigger re-resolve of all instances of that component
- [x] T028 [US3] Implement override management: applyOverride, resetOverride, getEffectiveProps in src/lib/utils/canvas/componentResolver.ts
- [x] T029 [US3] Add "Detach Instance" context menu option (converts instance to plain group, breaks link)
- [x] T030 [US3] Handle definition deletion gracefully (detach all instances of deleted component)

**Checkpoint**: User Story 3 functional — instance-definition linking works with override persistence

---

## Phase 6: User Story 4 — Multi-Page Flows (Priority: P4)

**Goal**: Connect frames with flow links and preview the navigation flow as a prototype.

**Independent Test**: Create 3 frames → connect with flow links → enter Preview mode → click hotspot → verify navigation to linked frame → press Escape → back to edit mode

### Implementation for User Story 4

- [x] T031 [P] [US4] Create flow graph utility at src/lib/utils/canvas/flowGraph.ts (buildFlowGraph, resolveFlowTarget, getReachableFrames)
- [x] T032 [P] [US4] Add "flow_link" tool to canvas tool system in src/lib/stores/canvas/canvasStore.ts
- [x] T033 [US4] Implement flow link creation interaction (click source hotspot → click target frame) in src/lib/components/canvas/CanvasWorkspaceInteractive.svelte
- [x] T034 [US4] Render flow link arrows on canvas (SVG overlay between frames) in src/lib/components/canvas/FlowLinkOverlay.svelte
- [x] T035 [US4] Create FlowPreview component at src/lib/components/canvas/FlowPreview.svelte (fullscreen frame view, hotspot click handlers)
- [x] T036 [US4] Add Preview mode toggle (Cmd+Enter) to canvas toolbar and wire activeTool='preview' state

**Checkpoint**: User Story 4 functional — flows can be created and previewed as prototypes

---

## Phase 7: User Story 5 — Overview & Detail Modes (Priority: P5)

**Goal**: Zoom out to see all frames with flow connections, double-click to drill into detail.

**Independent Test**: Create multi-frame flow → activate overview mode → see all frames at reduced scale with arrows → double-click a frame → transitions to 100% zoom on that frame → shortcut to toggle back

### Implementation for User Story 5

- [x] T037 [P] [US5] Create FlowOverview component at src/lib/components/canvas/FlowOverview.svelte (minimap showing all frames + flow connections)
- [x] T038 [US5] Implement overview/detail mode toggle in src/lib/stores/canvas/canvasStore.ts (add viewMode writable: 'detail' | 'overview')
- [x] T039 [US5] Handle double-click frame in overview → animate viewport to frame at 100% zoom
- [x] T040 [US5] Add keyboard shortcut (Cmd+0) for overview/detail toggle in src/lib/stores/hotkeys/hotkeys.ts
- [x] T041 [US5] Render flow connections in overview mode (lines/arrows between frame thumbnails)

**Checkpoint**: User Story 5 functional — overview and detail modes work independently

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T042 [P] Add component library loading on vault open (hook into vault store initialization)
- [x] T043 [P] Add error handling and logging for all component CRUD operations
- [x] T044 [P] Update docs/architecture/bismuth-canvas-system.md with native component model
- [x] T045 Remove DesignTokensPanel.svelte references to legacy token system (repurpose or remove)
- [x] T046 Validate all files stay under 300 lines per constitution
- [x] T047 Run quickstart.md validation (manual walkthrough of all user flows)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (types must exist before store/service)
- **User Stories (Phase 3-7)**: All depend on Phase 2 completion
  - US1 (Phase 3): Independent — no dependency on other stories
  - US2 (Phase 4): Independent — uses same library store as US1 but different UI
  - US3 (Phase 5): Depends on US1 (instances must exist to edit them)
  - US4 (Phase 6): Independent — flow system is separate from components
  - US5 (Phase 7): Depends on US4 (overview renders flow connections)
- **Polish (Phase 8)**: Depends on all user stories being complete

### Within Each User Story

- Store actions before UI components
- Utilities before components that use them
- Core interaction before polish

### Parallel Opportunities

- T001-T004 can all run in parallel (independent file deletions/edits)
- T005-T007 can run in parallel (different type additions)
- T011, T013 can run in parallel with T009-T010 (frontend doesn't block on backend)
- US1 and US4 are fully independent and can run in parallel after Phase 2
- US2 can run in parallel with US1 (different files)
- All [P] tasks within a phase can run simultaneously

---

## Parallel Example: User Story 1

```text
# After Phase 2 completes, launch US1:
T014: createComponentFromSelection in componentLibrary.ts
T015: placeComponentInstance in componentLibrary.ts (same file, sequential with T014)
T016: context menu item (parallel with T014/T015 — different file)
T017: naming dialog (parallel — different file)
# Then sequential:
T018: wire the flow together
T019: canvas renderer support
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Remove legacy system
2. Complete Phase 2: Foundational infrastructure
3. Complete Phase 3: User Story 1 (Create Component)
4. **STOP and VALIDATE**: Test creating components from selection
5. Demo if ready — users can already create and reuse components

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 (Create Component) → Test → MVP!
3. US2 (Library Browser) → Test → Discoverable components
4. US3 (Instance Linking) → Test → Live updates
5. US4 (Multi-Page Flows) → Test → Prototype preview
6. US5 (Overview Mode) → Test → Full flow visualization

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Constitution: All new files must stay under 300 lines
