# Bismuth MVP Implementation Checklist

**Generated**: 2026-05-26  
**Current Status**: Phase 1 Complete ✅ | UI Prototype Working ✅  
**Next Phase**: Phase 2 - Foundational Infrastructure

---

## ✅ Phase 1: Project Setup (COMPLETE)

- [x] T001 Initialize Tauri monorepo
- [x] T002 Install frontend dependencies
- [x] T003 Install Rust dependencies
- [x] T004 Configure linting
- [x] T005 Configure Rust formatting
- [x] T006 Configure unit testing
- [x] T007 Configure E2E testing
- [x] T008 Create sample vault structure
- [x] T009 Verify toolchain end-to-end

**Status**: ✅ All tasks complete. App runs with functional UI prototype.

---

## 🚧 Phase 2: Foundational Infrastructure (IN PROGRESS)

### 2.1 — Rust Data Models

- [ ] T010 Define `Note` struct (`src-tauri/src/models/note.rs`)
  - Fields: path, title, content, frontmatter, created_at, modified_at
  - Constructor with frontmatter parsing
  - **Acceptance**: `cargo check` passes

- [ ] T011 Define `Vault` struct (`src-tauri/src/models/vault.rs`)
  - Fields: root_path, settings_path, name
  - Validation in constructor
  - **Acceptance**: Can instantiate from valid path

- [ ] T012 Define `Link` struct (`src-tauri/src/models/link.rs`)
  - Fields: source_path, target_title, target_path, alias, is_resolved
  - Resolve method for path resolution
  - **Acceptance**: Compiles successfully

- [ ] T013 Define `Tag` and `SearchResult` structs (`src-tauri/src/models/mod.rs`)
  - Tag: name, count
  - SearchResult: path, title, snippet, score
  - Module exports
  - **Acceptance**: All models accessible via `use crate::models::*`

### 2.2 — Error Handling & Config

- [ ] T014 Define error types (`src-tauri/src/error.rs`)
  - BismuthError enum with thiserror
  - Variants: IoError, ParseError, IndexError, NotFound, InvalidPath, DatabaseError
  - Result<T> type alias
  - **Acceptance**: All services can use Result<T> consistently

- [ ] T015 Define app config (`src-tauri/src/config.rs`)
  - AppConfig struct with serde
  - Fields: vault_root, theme_path, default_note_location, search_http_port, auto_save_ms
  - Load/save methods with JSON serialization
  - **Acceptance**: Can load/save config from `.bismuth/config.json`

### 2.3 — SQLite Database Layer

- [ ] T016 Initialize database with migrations (`src-tauri/src/db.rs`)
  - Database struct with Arc<Mutex<Connection>>
  - Migration system
  - Tables: notes, links, tags, jdex_entries, graph_nodes, graph_edges
  - **Acceptance**: Database file created, all tables exist

- [ ] T017 Add performance indexes
  - Indexes on: notes.path, links.source_path, links.target_title, tags.name, graph edges
  - ANALYZE command
  - **Acceptance**: EXPLAIN QUERY PLAN shows index usage

### 2.4 — Vault Service (FR-001)

- [ ] T018 Implement vault operations (`src-tauri/src/services/vault_service.rs`)
  - VaultService struct with db and vault
  - Methods: open, create, scan, get_note, write_note, delete_note, rename_note
  - **Acceptance**: Can open vault, read/write notes, all operations update database

- [ ] T019 Implement path security (`src-tauri/src/utils/path.rs`)
  - normalize_path, is_within_vault, vault_relative_path
  - Unit tests for path traversal attacks
  - **Acceptance**: All path traversal attempts rejected

- [ ] T020 Wire into Tauri state (`src-tauri/src/main.rs`)
  - AppState struct with vault_service and db
  - Initialize in setup closure
  - **Acceptance**: IPC commands can access State<AppState>

### 2.5 — File Watcher (Research §5)

- [ ] T021 Implement file watcher (`src-tauri/src/services/watcher_service.rs`)
  - VaultWatcher with notify crate
  - 500ms debounce
  - Ignore patterns: .bismuth, .git, .tmp, .swp, .DS_Store
  - Emit Tauri events: vault://file-created, vault://file-modified, vault://file-deleted
  - **Acceptance**: External file changes trigger events within 600ms

### 2.6 — Frontmatter Service

- [ ] T022 Implement frontmatter parser (`src-tauri/src/services/frontmatter_service.rs`)
  - FrontmatterService struct
  - Methods: parse, serialize, get_field, set_field
  - Handle edge cases: no frontmatter, malformed YAML, nested keys
  - **Acceptance**: Can round-trip parse/serialize without data loss

### 2.7 — Tantivy Index Service (FR-028, Research §3)

- [ ] T023 Build Tantivy schema (`src-tauri/src/services/index_service.rs`)
  - IndexService struct with Index, IndexReader, IndexWriter
  - Schema: path, title, content, tags, portent_type, created, modified, outbound_links, link_count
  - Index directory at `.bismuth/index/`
  - **Acceptance**: Schema compiles, index directory created

- [ ] T024 Implement indexing operations
  - Methods: index_note, index_all, delete_entry, search
  - Wire to file watcher events
  - **Acceptance**: Search returns results <200ms on 1000-note vault

### 2.8 — Tauri IPC Command Layer (Research §1)

- [ ] T025 Implement vault commands (`src-tauri/src/commands/vault.rs`)
  - Commands: open_vault, create_vault, get_note, write_note, delete_note, rename_note, list_notes
  - Async with State<AppState>
  - Error mapping to String
  - **Acceptance**: Frontend can invoke all commands

- [ ] T026 Implement search commands (`src-tauri/src/commands/search.rs`)
  - Commands: search_vault, search_in_file
  - **Acceptance**: Search returns results with snippets

- [ ] T027 Implement graph commands (`src-tauri/src/commands/graph.rs`)
  - Commands: get_graph_data, get_backlinks
  - **Acceptance**: Graph view can render from returned data

- [ ] T028 Register all IPC commands (`src-tauri/src/main.rs`)
  - invoke_handler with all commands
  - **Acceptance**: All commands callable from frontend without runtime errors

### 2.9 — Svelte Foundation

- [ ] T029 Create design token system (`src/lib/styles/tokens.css`)
  - CSS custom properties matching Obsidian theme spec
  - Variables: background, text, interactive, font, radius, spacing
  - Import in App.svelte
  - **Acceptance**: All tokens accessible via var(--background-primary)

- [ ] T030 Build base UI components
  - Button.svelte (variants: primary, secondary, ghost)
  - Input.svelte, Dropdown.svelte, Modal.svelte, Toast.svelte, Tooltip.svelte
  - **Acceptance**: Demo page shows all variants

- [ ] T031 Build layout shell (`src/App.svelte`)
  - Three-column layout: left-sidebar, editor-pane, right-sidebar
  - Command palette overlay
  - Layout store with visibility and width state
  - **Acceptance**: Sidebars toggle and resize

- [ ] T032 Create IPC service wrappers
  - `src/lib/services/vault.ts` with async functions
  - `src/lib/services/search.ts` and `src/lib/services/graph.ts`
  - TypeScript interfaces in types/
  - **Acceptance**: Type-safe IPC calls from components

- [ ] T033 Create vault store (`src/lib/stores/vault.ts`)
  - VaultState with currentVault, openNotes, activeNotePath
  - Actions: openVault
  - Subscribe to Tauri events
  - **Acceptance**: Components reactively update on vault state changes

**Checkpoint**: Foundation ready. All Rust services compile, IPC commands respond, Svelte shell renders.

---

## 📋 Phase 3: User Story 1 — Core Vault & Editor (P1) 🎯 MVP

- [ ] T034 Build welcome screen (`src/lib/components/WelcomeScreen.svelte`)
- [ ] T035 Implement vault templates (Blank, PARA, JohnnyDecimal, Zettelkasten)
- [ ] T036 Integrate CodeMirror 6 (`src/lib/components/editor/Editor.svelte`)
- [ ] T037 Implement wikilink extension (syntax highlighting, click to open)
- [ ] T038 Implement auto-save (500ms debounce, status indicator)
- [ ] T039 Build crash recovery (`.bismuth/recovery/` temp files)
- [ ] T040 Build split-pane layout (horizontal/vertical splits)
- [ ] T041 Implement edit history (`.bismuth/history/*.jsonl`)
- [ ] T042 Implement size/depth warnings (10MB limit, deep nesting)

**Goal**: User can open vault, create/edit/save notes with markdown rendering and <16ms latency.

---

## 📋 Phase 4: User Story 15 — Notebook Navigator (P1) 🎯 MVP

- [ ] T043 Build Navigator shell (two-pane layout)
- [ ] T044 Build folder tree component (recursive, keyboard nav)
- [ ] T045 Build file list component (preview, thumbnails)
- [ ] T046 Implement pinning (persist to `.bismuth/navigator.json`)
- [ ] T047 Implement folder/file color + icon assignment
- [ ] T048 Implement vault profiles (hidden folders, sort preferences)
- [ ] T049 Implement shortcut bar (Cmd/Ctrl+1-9)
- [ ] T050 Implement calendar panel (daily notes)
- [ ] T051 Implement drag-and-drop file move
- [ ] T052 Implement file context menu operations
- [ ] T053 Implement `update_links_on_rename` (FR-005)
- [ ] T054 Add tag tree tab to Navigator
- [ ] T055 Add property browser tab to Navigator

**Goal**: Two-pane keyboard-first file browser with all file operations.

---

## 📋 Phase 5: User Story 2 — Wikilinks & Graph View (P2)

- [ ] T056 Implement WikilinkService (extract, resolve, backlinks)
- [ ] T057 Implement unresolved wikilink note creation
- [ ] T058 Build backlinks panel
- [ ] T059 Implement graph data builder
- [ ] T060 Build graph view with Konva.js (force-directed layout)
- [ ] T061 Implement graph filtering controls
- [ ] T062 Implement graph interaction (click, hover, pan/zoom)
- [ ] T063 Implement note linker (FR-256/257/258 auto-linking)

**Goal**: Wikilinks resolve, backlinks update, graph renders <3s for 10k nodes.

---

## 📋 Phase 6: User Story 8 — Advanced Search (P3)

- [ ] T064 Implement search query parser (BM25, typo tolerance)
- [ ] T065 Build search panel UI (Vim navigation)
- [ ] T066 Implement search filters (type, tag, date)
- [ ] T067 Implement in-file search mode
- [ ] T068 Implement search HTTP API endpoint (port 42042)
- [ ] T069 Implement OCR search (FR-033)

**Goal**: Unified search with <200ms response time on 1000-note vault.

---

## 📋 Phase 7: User Story 11 — Capture & Lifecycle Dashboard (P2)

- [ ] T070 Build inbox triage UI
- [ ] T071 Implement quick capture (global hotkey)
- [ ] T072 Implement batch classify operations
- [ ] T073 Implement lifecycle state tracking
- [ ] T074 Build dashboard view (inbox, active, archived)
- [ ] T075 Integrate with REST API (US10)

**Goal**: Quick capture and lifecycle management for notes.

---

## 📋 Phase 8: User Story 4 — Theming System (P2)

- [ ] T076 Implement theme loader (CSS file parsing)
- [ ] T077 Build theme switcher UI
- [ ] T078 Implement Obsidian theme compatibility
- [ ] T079 Implement Style Settings system
- [ ] T080 Create default dark/light themes

**Goal**: Obsidian-compatible theming with Style Settings support.

---

## 📋 Phase 9: User Story 3 — Entity System (P2)

- [ ] T081 Implement Portent type system (frontmatter-based)
- [ ] T082 Build entity type editor
- [ ] T083 Implement entity templates
- [ ] T084 Build entity relationship tracking
- [ ] T085 Implement entity queries

**Goal**: Flexible entity system with types, templates, and relationships.

---

## 📋 Phase 10: User Story 27 — Semantic Connections (P2)

- [ ] T086 Integrate local embedding model
- [ ] T087 Implement background indexing
- [ ] T088 Build Connections view (auto-update, pin, pause)
- [ ] T089 Build Lookup view (natural language queries)
- [ ] T090 Implement drag-to-insert wikilink
- [ ] T091 Configure excluded paths/tags

**Goal**: AI-powered semantic connections and natural language search.

---

## 📋 Phase 11: User Story 7 — Tag Management (P2)

- [ ] T092 Implement tag extraction from notes
- [ ] T093 Build tag browser UI
- [ ] T094 Implement tag rename (hierarchical propagation)
- [ ] T095 Implement tag merge
- [ ] T096 Implement tag pages (create/open aliased notes)
- [ ] T097 Implement drag-and-drop tag reorganization

**Goal**: Comprehensive tag management with Tag Wrangler features.

---

## Testing Strategy

### Unit Tests (Target: 90% coverage per SC-005)

**Priority 1 (Phase 2)**:
- [ ] Path security tests (T019)
- [ ] Frontmatter parser tests (T022)
- [ ] Error handling tests (T014)
- [ ] Database migration tests (T016)

**Priority 2 (Phase 3-5)**:
- [ ] Wikilink extraction tests (T056)
- [ ] Graph data builder tests (T059)
- [ ] Search query parser tests (T064)
- [ ] Vault operations tests (T018)

**Priority 3 (Phase 6+)**:
- [ ] Entity system tests (T081-T085)
- [ ] Tag management tests (T092-T097)
- [ ] Lifecycle tracking tests (T070-T075)

### Integration Tests

- [ ] Vault creation → note creation → save → reload
- [ ] Wikilink creation → graph update → backlinks update
- [ ] File rename → wikilink update → index update
- [ ] Search → filter → open note
- [ ] Theme switch → UI update

### E2E Tests (Playwright)

- [ ] Welcome screen → create vault → create note
- [ ] Open vault → browse files → edit note → save
- [ ] Search notes → open result → verify content
- [ ] Create wikilink → click link → verify navigation
- [ ] Drag file → verify move → verify wikilink update

### Performance Tests

- [ ] Editor latency <16ms (T036)
- [ ] Search response <200ms on 1000 notes (T024)
- [ ] Graph render <3s for 10k nodes (T060)
- [ ] Auto-save debounce 500ms (T038)
- [ ] File watcher event <600ms (T021)

---

## Code Quality Checklist

### Before Each Commit

- [ ] Run `pnpm lint` (no errors)
- [ ] Run `pnpm format:check` (no errors)
- [ ] Run `cargo clippy` (no warnings)
- [ ] Run `cargo fmt --check` (formatted)
- [ ] Run `pnpm test` (all tests pass)
- [ ] Update relevant documentation

### Before Each Phase Completion

- [ ] All tasks in phase complete
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing
- [ ] Integration tests passing
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Git commit with detailed message

### Before MVP Release

- [ ] All P1-P2 user stories complete
- [ ] 90% test coverage achieved
- [ ] All performance budgets met
- [ ] Cross-platform validation (Windows, macOS, Linux)
- [ ] Security audit complete
- [ ] User documentation complete
- [ ] Demo vault included

---

## Risk Mitigation

### High-Risk Areas

1. **Tantivy Integration** (T023-T024)
   - Risk: Complex API, performance tuning needed
   - Mitigation: Start early, benchmark frequently, consider fallback to simpler search

2. **File Watcher** (T021)
   - Risk: Event storms, cross-platform differences
   - Mitigation: Robust debouncing, extensive testing on all platforms

3. **Graph Rendering** (T060-T062)
   - Risk: Performance with large graphs (10k+ nodes)
   - Mitigation: Implement node culling, lazy loading, consider WebGL fallback

4. **Wikilink Resolution** (T056-T057)
   - Risk: Ambiguous targets, path traversal
   - Mitigation: Strict path validation, clear resolution rules, user warnings

5. **Database Migrations** (T016)
   - Risk: Data loss on schema changes
   - Mitigation: Backup before migration, rollback support, version tracking

### Dependency Risks

- **Tauri 2.x**: Still evolving, API changes possible
  - Mitigation: Pin versions, monitor changelog
- **Tantivy**: Complex search engine
  - Mitigation: Extensive testing, consider alternatives
- **CodeMirror 6**: Large API surface
  - Mitigation: Use stable extensions only

---

## Success Criteria

### MVP Definition (Phases 1-5 Complete)

- ✅ User can create and open vaults
- ✅ User can create, edit, and save markdown notes
- ✅ Wikilinks work and update on file rename
- ✅ Graph view renders and is interactive
- ✅ Search returns results <200ms
- ✅ File browser with keyboard navigation works
- ✅ Auto-save and crash recovery work
- ✅ App runs on Windows, macOS, Linux
- ✅ 90% test coverage achieved
- ✅ All P1 user stories complete

### Post-MVP (Phases 6-11)

- User can manage lifecycle states
- Theming system works with Obsidian themes
- Entity system supports custom types
- Semantic connections provide AI-powered suggestions
- Tag management with full Tag Wrangler features

---

## Timeline Estimate

**Phase 2**: 5-7 days (foundational infrastructure)  
**Phase 3**: 3-4 days (core editor)  
**Phase 4**: 3-4 days (navigator)  
**Phase 5**: 2-3 days (wikilinks & graph)  
**Phase 6**: 2-3 days (search)  
**Phase 7**: 2-3 days (lifecycle)  
**Phase 8**: 2 days (theming)  
**Phase 9**: 2-3 days (entity system)  
**Phase 10**: 3-4 days (semantic connections)  
**Phase 11**: 2 days (tag management)  

**Total MVP (Phases 2-5)**: ~13-18 days  
**Total Full Feature Set (Phases 2-11)**: ~26-35 days

---

## Next Immediate Actions

1. **Start Phase 2.1**: Define Rust data models (T010-T013)
2. **Parallel**: Set up testing infrastructure for models
3. **Verify**: All ignore files are properly configured
4. **Document**: Architecture decisions as we go

---

**Status**: Ready to begin Phase 2 implementation! 🚀
