# Implementation Tasks: Canvas Self-Design System

**Spec**: `specs/007-canvas-self-design-system/spec.md`  
**Plan**: `specs/007-canvas-self-design-system/plan.md`  
**Generated**: 2026-06-05  

---

## Phase 1: Document Schema & Store (Foundation)

**Goal**: Define TypeScript interfaces for all 6 design document types and a CRUD service for reading/writing them as JSON files.

**Blocks**: Phases 2–6 (all document operations depend on types + store)

### Type Definitions

- [x] T001 [P] Create `src/lib/types/design-documents/envelope.ts` — shared DesignDocument<T> envelope interface (schema_version, document_type, document_id, canvas_source, version, payload generic)
- [x] T002 [P] Create `src/lib/types/design-documents/token.ts` — TokenPayload interface (collections, tokens with css_var references)
- [x] T003 [P] Create `src/lib/types/design-documents/component.ts` — ComponentPayload interface (props, slots, states, token_bindings, variants, code_connect)
- [x] T004 [P] Create `src/lib/types/design-documents/layout.ts` — LayoutPayload interface (breakpoints, regions, css_grid_template)
- [x] T005 [P] Create `src/lib/types/design-documents/flow.ts` — FlowPayload interface (steps, error_paths, components_used)
- [x] T006 [P] Create `src/lib/types/design-documents/theme.ts` — ThemePayload interface (extends, attribute, overrides, css_output_path)
- [x] T007 [P] Create `src/lib/types/design-documents/page.ts` — PagePayload interface (route, layout ref, component instances, responsive_variants)
- [x] T008 Create `src/lib/types/design-documents/index.ts` — barrel exports for all document types + union type DesignDocumentAny

### Document Store Service

- [x] T009 [P] Create `src/lib/services/design-docs/store.ts` — DesignDocStore class: read(type, id), write(doc), list(type), delete(id) operating on `.bismuth/design-docs/`
- [x] T010 [P] Create `src/lib/services/design-docs/validation.ts` — schema validation for each document type (runtime type guards)
- [x] T011 Create `src/lib/services/design-docs/index.ts` — barrel exports for store and validation
- [x] T012 Create `.bismuth/design-docs/.gitkeep` — empty directory marker for storage location

### Tests

- [x] T013 [P] Write unit tests for document store (read/write/list/delete round-trip) in `src/lib/services/design-docs/store.test.ts`
- [x] T014 [P] Write unit tests for schema validation (valid + invalid docs) in `src/lib/services/design-docs/validation.test.ts`

**Checkpoint**: All 6 document types have TypeScript interfaces, store service passes unit tests

---

## Phase 2: Document Generator (Canvas → Documents)

**Goal**: Transform canvas state into design documents. Each extractor reads canvas elements/variables and produces a typed document.

**Depends on**: Phase 1 (types + store)

### Extractors

- [x] T015 [P] Create `src/lib/services/canvas/documentGenerator/tokenExtractor.ts` — CanvasVariable[] → TokenPayload (maps variable collections to token document structure)
- [x] T016 [P] Create `src/lib/services/canvas/documentGenerator/componentExtractor.ts` — Component frames → ComponentPayload (reads frame elements, props, variants from tagged canvas elements)
- [x] T017 [P] Create `src/lib/services/canvas/documentGenerator/layoutExtractor.ts` — Layout frames → LayoutPayload (reads grid/flex configurations from auto-layout settings)
- [x] T018 [P] Create `src/lib/services/canvas/documentGenerator/flowExtractor.ts` — Flow link elements → FlowPayload (reads flowLinks between frames as navigation steps)
- [x] T019 [P] Create `src/lib/services/canvas/documentGenerator/themeExtractor.ts` — Variable modes → ThemePayload (reads per-mode values as theme overrides)
- [x] T020 [P] Create `src/lib/services/canvas/documentGenerator/pageExtractor.ts` — Page composition frames → PagePayload (reads component instances with region placement)

### Orchestrator

- [x] T021 Create `src/lib/services/canvas/documentGenerator/index.ts` — generateDocuments(canvasDocument: CanvasDocument): DesignDocumentAny[] orchestrator that delegates to extractors by page
- [x] T022 Create `src/lib/services/canvas/documentGenerator/tagging.ts` — utility for reading "design-source" tags from canvas elements that mark which elements participate in document generation

### Integration

- [ ] T023 Wire document generation into canvas save flow — after canvas document saves, trigger generateDocuments() and persist results to store

### Tests

- [x] T024 [P] Write unit tests for tokenExtractor (CanvasVariable[] → TokenPayload) in `src/lib/services/canvas/documentGenerator/tokenExtractor.test.ts`
- [x] T025 [P] Write unit tests for componentExtractor (frame elements → ComponentPayload) in `src/lib/services/canvas/documentGenerator/componentExtractor.test.ts`
- [ ] T026 Write integration test: mock canvas document → generateDocuments() → validate all output docs in `src/lib/services/canvas/documentGenerator/generator.test.ts`

**Checkpoint**: Canvas document with tagged elements produces valid design documents on save

---

## Phase 3: MCP Tools for Design Documents

**Goal**: Expose design documents to AI agents via new MCP tools extending the existing server.

**Depends on**: Phase 1 (store), Phase 2 (generator)

### New MCP Tool Handlers

- [x] T027 [P] Create `src/lib/services/canvas/mcpDesignServer/documentTools.ts` — handler for `get_design_document(type, id)` tool
- [x] T028 [P] Add `list_design_documents(type?)` tool handler — returns all documents, optionally filtered by type
- [x] T029 [P] Add `put_design_document(document)` tool handler — writes a document (for code→canvas sync via agent)
- [x] T030 [P] Add `diff_design_document(type, id, version_a, version_b)` tool handler — returns JSON diff between two document versions
- [x] T031 Add `sync_design_state(direction: "canvas_to_code" | "code_to_canvas")` tool handler — triggers full sync pipeline

### MCP Registration

- [x] T032 Register new tools in MCP tool manifest (update `tools/list` response in existing mcpDesignServer)
- [x] T033 Update `src/lib/services/canvas/mcpDesignServer/index.ts` — add re-exports for documentTools module

### Tests

- [x] T034 [P] Write unit tests for each document MCP tool handler in `src/lib/services/canvas/mcpDesignServer/documentTools.test.ts`
- [ ] T035 Write integration test: generate doc from canvas → retrieve via MCP get_design_document → validate round-trip

**Checkpoint**: AI agent can retrieve and push design documents via MCP protocol

---

## Phase 4: Code Reflector (Code → Canvas)

**Goal**: Parse running Bismuth source code state and produce design documents that can be pushed back to canvas.

**Depends on**: Phase 1 (types + store)

### Reflectors

- [x] T036 [P] Create `src/lib/services/design-docs/reflectors/tokenReflector.ts` — parses `src/lib/styles/tokens.css` → TokenPayload (reads CSS custom properties with --color-*, --space-* prefixes)
- [x] T037 [P] Create `src/lib/services/design-docs/reflectors/componentReflector.ts` — parses Svelte component file → ComponentPayload (reads props from `export let`, slots from `<slot>`, CSS var references)
- [x] T038 [P] Create `src/lib/services/design-docs/reflectors/layoutReflector.ts` — parses `src/lib/styles/grid-system.css` → LayoutPayload (reads grid-template definitions)
- [x] T039 Create `src/lib/services/design-docs/reflectors/themeReflector.ts` — parses tokens.css dark mode vars → ThemePayload
- [x] T040 Create `src/lib/services/design-docs/reflectors/index.ts` — barrel exports + reflectAll() orchestrator

### Canvas Injection

- [x] T041 Create `src/lib/services/design-docs/canvasInjector.ts` — takes a DesignDocument and creates/updates canvas elements to represent it visually (inverse of extraction)

### Tests

- [x] T042 [P] Write unit tests for tokenReflector (parse actual tokens.css → validate TokenPayload) in `src/lib/services/design-docs/reflectors/tokenReflector.test.ts`
- [x] T043 [P] Write unit tests for componentReflector (parse sample Svelte file → validate ComponentPayload) in `src/lib/services/design-docs/reflectors/componentReflector.test.ts`

**Checkpoint**: Running `reflectAll()` produces valid documents from Bismuth's own source code

---

## Phase 5: Canvas UI for Design Documents

**Goal**: Provide UI within the canvas for viewing document status, triggering sync, and navigating the fixed page structure.

**Depends on**: Phases 2, 3, 4

### Components

- [x] T044 [P] Create `src/lib/components/canvas/DesignDocPanel.svelte` — sidebar panel showing list of generated design documents with type icons, version, and last-modified
- [x] T045 [P] Create `src/lib/components/canvas/DocumentSyncButton.svelte` — button component triggering canvas→code or code→canvas sync with loading state
- [x] T046 Create `src/lib/components/canvas/DocumentDiffView.svelte` — inline diff viewer showing changes between document versions (uses JSON diff output)

### Canvas Page Templates

- [x] T047 [P] Create `src/lib/services/canvas/pageTemplates.ts` — factory function that produces the fixed page structure [Tokens, Components, Layouts, Flows, Pages, Sandbox] for a new "Design System" canvas document
- [ ] T048 Add "New Design System Canvas" option to canvas creation flow — uses page template factory

### Integration

- [ ] T049 Wire DesignDocPanel into canvas inspector sidebar (conditionally shown when mcpConfig.enabled is true)
- [ ] T050 Wire DocumentSyncButton actions to store and generator services

### Tests

- [ ] T051 Write component tests for DesignDocPanel (renders document list) in `src/lib/components/canvas/DesignDocPanel.test.ts`
- [ ] T052 Write unit test for pageTemplates factory (produces 6 pages with correct names) in `src/lib/services/canvas/pageTemplates.test.ts`

**Checkpoint**: Canvas UI shows document status and allows manual sync trigger

---

## Phase 6: Diff Engine & Versioning

**Goal**: Track document version history and compute structured diffs for incremental code updates.

**Depends on**: Phase 1 (store)

### Diff Engine

- [x] T053 [P] Create `src/lib/services/design-docs/diffEngine.ts` — computeDiff(docA, docB): DesignDocDiff (JSON patch format, RFC 6902)
- [x] T054 [P] Create `src/lib/services/design-docs/versionStore.ts` — version history management: save version, list versions, get version, rollback to version

### Version Integration

- [x] T055 Wire version creation into document store write path — every write auto-increments version and saves previous to history
- [ ] T056 Add version selector to DesignDocPanel (dropdown showing version history with diff preview)

### Tests

- [x] T057 [P] Write unit tests for diffEngine (known input pairs → expected patches) in `src/lib/services/design-docs/diffEngine.test.ts`
- [x] T058 [P] Write unit tests for versionStore (save/list/get/rollback) in `src/lib/services/design-docs/versionStore.test.ts`

**Checkpoint**: Documents have version history, diffs compute correctly between versions

---

## Phase 7: End-to-End Validation

**Goal**: Prove the system works by designing one real Bismuth page using the canvas and generating working code from it.

**Depends on**: All previous phases

- [ ] T059 Create a "Bismuth Design System" canvas document using the page template (Tokens + Components pages populated)
- [ ] T060 Tag canvas elements as design sources and generate Token + Component documents
- [ ] T061 Use MCP tools to have an AI agent generate a Svelte component from a Component document
- [ ] T062 Run code reflector on the generated component to produce a round-trip document
- [ ] T063 Verify diff between original canvas-generated doc and reflector-generated doc is minimal (validates fidelity)

**Checkpoint**: Full round-trip validated — canvas → doc → code → doc with minimal drift

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1**: No dependencies — start immediately
- **Phase 2**: Depends on Phase 1 (types must exist)
- **Phase 3**: Depends on Phase 1 + Phase 2 (store + generator)
- **Phase 4**: Depends on Phase 1 only (independent of Phase 2/3)
- **Phase 5**: Depends on Phases 2, 3, 4 (all services must exist)
- **Phase 6**: Depends on Phase 1 (store only)
- **Phase 7**: Depends on all phases

### Parallel Opportunities

- **Phase 1**: All T001–T008 type files can run in parallel
- **Phase 2**: All T015–T020 extractors can run in parallel
- **Phase 3**: T027–T031 tool handlers can run in parallel
- **Phase 4**: T036–T039 reflectors can run in parallel (independent of Phase 2/3)
- **Phase 6**: Can run in parallel with Phases 3–5 (only depends on Phase 1)

### Critical Path

```
Phase 1 (types+store) → Phase 2 (generators) → Phase 3 (MCP) → Phase 5 (UI) → Phase 7 (validation)
                      → Phase 4 (reflectors) ↗ 
                      → Phase 6 (diff) ↗
```

---

## Task Metadata

| Metric | Value |
| --- | --- |
| Total tasks | 63 |
| Parallelizable tasks | 38 (marked [P]) |
| Estimated new files | ~30 |
| Constitution risk areas | File size (all modules designed <200 lines) |
