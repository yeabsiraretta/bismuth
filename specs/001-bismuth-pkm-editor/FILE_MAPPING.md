# Bismuth PKM Editor - File System Mapping

**Feature**: `001-bismuth-pkm-editor`  
**Purpose**: Map every task to its file location in the codebase for quick navigation and implementation

---

## Project Structure Overview

```
bismuth/
├── src/                          # Frontend (Svelte + TypeScript)
│   ├── lib/
│   │   ├── components/          # UI Components
│   │   │   ├── ui/             # Base components (Button, Input, Modal, etc.)
│   │   │   ├── editor/         # CodeMirror editor components
│   │   │   ├── sidebar/        # Navigator, panels, file tree
│   │   │   ├── graph/          # Graph view (Konva.js)
│   │   │   ├── modals/         # Search, settings, command palette
│   │   │   └── vault/          # Vault-specific UI
│   │   ├── services/           # Frontend IPC wrappers
│   │   ├── stores/             # Svelte stores (state management)
│   │   ├── styles/             # CSS tokens, typography
│   │   └── types/              # TypeScript interfaces
│   ├── App.svelte              # Root component
│   └── main.ts                 # Entry point
├── src-tauri/                   # Backend (Rust + Tauri)
│   ├── src/
│   │   ├── commands/           # Tauri IPC command handlers
│   │   ├── models/             # Data structures (Note, Vault, Link, etc.)
│   │   ├── services/           # Business logic
│   │   ├── utils/              # Helper functions
│   │   ├── db.rs               # SQLite database layer
│   │   ├── error.rs            # Error types
│   │   ├── config.rs           # App configuration
│   │   └── main.rs             # Tauri app entry point
│   ├── Cargo.toml              # Rust dependencies
│   └── tauri.conf.json         # Tauri configuration
├── tests/
│   ├── unit/ts/                # Frontend unit tests (Vitest)
│   ├── e2e/                    # E2E tests (Playwright)
│   └── src-tauri/              # Rust unit tests
├── .bismuth/                    # Sample vault structure
│   ├── notes/                  # Sample markdown files
│   ├── templates/              # Note templates
│   ├── themes/                 # CSS themes
│   └── plugins/                # Plugin directory
├── package.json                # Node dependencies
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript configuration
└── playwright.config.ts        # E2E test configuration
```

---

## Phase 1: Project Setup - File Mapping

| Task | Files Modified/Created |
|------|----------------------|
| T001 | Root: `package.json`, `vite.config.ts`, `tsconfig.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json` |
| T002 | `package.json` (add frontend deps) |
| T003 | `src-tauri/Cargo.toml` (add Rust deps) |
| T004 | `.eslintrc.cjs`, `.prettierrc` |
| T005 | `src-tauri/.cargo/config.toml`, `src-tauri/rustfmt.toml` |
| T006 | `vite.config.ts` (test config), `tests/unit/ts/example.test.ts` |
| T007 | `playwright.config.ts`, `tests/e2e/smoke.spec.ts` |
| T008 | `.bismuth/notes/`, `.bismuth/templates/`, `.bismuth/themes/`, `.bismuth/plugins/`, `.bismuth/tips/` |
| T009 | N/A (verification task) |

---

## Phase 2: Foundational Infrastructure - File Mapping

### 2.1 - Rust Data Models

| Task | Files Created |
|------|--------------|
| T010 | `src-tauri/src/models/note.rs` |
| T011 | `src-tauri/src/models/vault.rs` |
| T012 | `src-tauri/src/models/link.rs` |
| T013 | `src-tauri/src/models/mod.rs` (Tag, SearchResult structs) |

### 2.2 - Error Handling & Config

| Task | Files Created |
|------|--------------|
| T014 | `src-tauri/src/error.rs` |
| T015 | `src-tauri/src/config.rs` |

### 2.3 - SQLite Database Layer

| Task | Files Created |
|------|--------------|
| T016 | `src-tauri/src/db.rs` (Database struct, migrations, tables) |
| T017 | `src-tauri/src/db.rs` (add indexes to existing file) |

### 2.4 - Vault Service

| Task | Files Created/Modified |
|------|----------------------|
| T018 | `src-tauri/src/services/vault_service.rs` |
| T019 | `src-tauri/src/utils/path.rs` |
| T020 | `src-tauri/src/main.rs` (AppState initialization) |

### 2.5 - File Watcher

| Task | Files Created |
|------|--------------|
| T021 | `src-tauri/src/services/watcher_service.rs` |

### 2.6 - Frontmatter Service

| Task | Files Created |
|------|--------------|
| T022 | `src-tauri/src/services/frontmatter_service.rs` |

### 2.7 - Tantivy Index Service

| Task | Files Created |
|------|--------------|
| T023 | `src-tauri/src/services/index_service.rs` (schema definition) |
| T024 | `src-tauri/src/services/index_service.rs` (add indexing methods) |

### 2.8 - Tauri IPC Command Layer

| Task | Files Created/Modified |
|------|----------------------|
| T025 | `src-tauri/src/commands/vault.rs` |
| T026 | `src-tauri/src/commands/search.rs` |
| T027 | `src-tauri/src/commands/graph.rs` |
| T028 | `src-tauri/src/main.rs` (register all commands) |

### 2.9 - Svelte Foundation

| Task | Files Created |
|------|--------------|
| T029 | `src/lib/styles/tokens.css` |
| T030 | `src/lib/components/ui/Button.svelte`, `Input.svelte`, `Dropdown.svelte`, `Modal.svelte`, `Toast.svelte`, `Tooltip.svelte` |
| T031 | `src/App.svelte` (layout shell), `src/lib/stores/layout.ts` |
| T032 | `src/lib/services/vault.ts`, `src/lib/services/search.ts`, `src/lib/services/graph.ts`, `src/lib/types/vault.ts`, `src/lib/types/note.ts`, `src/lib/types/search.ts` |
| T033 | `src/lib/stores/vault.ts` |

---

## Phase 3: User Story 1 (Core Vault & Editor) - File Mapping

| Task | Files Created/Modified |
|------|----------------------|
| T034 | `src/lib/components/vault/WelcomeScreen.svelte` |
| T035 | `src-tauri/src/services/vault_service.rs` (add create_from_template method) |
| T036 | `src/lib/components/editor/Editor.svelte` |
| T037 | `src/lib/components/editor/extensions/wikilink.ts` |
| T038 | `src/lib/components/editor/Editor.svelte` (add auto-save logic) |
| T039 | `src-tauri/src/services/vault_recovery.rs`, `src-tauri/src/services/vault_operations.rs` |
| T040 | `src/lib/components/editor/SplitPane.svelte` |
| T041 | `src-tauri/src/services/vault_history.rs`, `src-tauri/src/services/vault_operations.rs` |
| T042 | `src-tauri/src/services/vault_operations.rs`, `src/lib/components/ui/ToastManager.svelte` |

---

## Phase 4: User Story 15 (Navigator) - File Mapping

| Task | Files Created/Modified |
|------|----------------------|
| T043 | `src/lib/components/sidebar/Navigator.svelte`, `src/lib/stores/navigator.ts` |
| T044 | `src/lib/components/sidebar/FolderTree.svelte` |
| T045 | `src/lib/components/sidebar/FileList.svelte` |
| T046 | `src/lib/stores/navigator.ts` (pinning logic), `.bismuth/navigator.json` (data file) |
| T047 | `src/lib/stores/navigator.ts`, `src/lib/components/sidebar/FolderTree.svelte`, `src/lib/components/sidebar/FileList.svelte` |
| T048 | `src-tauri/src/services/vault_service.rs`, `src/lib/stores/navigator.ts` |
| T049 | `src/lib/components/sidebar/ShortcutBar.svelte` |
| T050 | `src/lib/components/sidebar/CalendarPanel.svelte` |
| T051 | `src/lib/components/sidebar/FileList.svelte`, `src-tauri/src/commands/vault.rs` |
| T052 | `src-tauri/src/commands/vault_commands.rs` |
| T053 | `src-tauri/src/services/wikilink_service.rs` |
| T054 | `src/lib/components/sidebar/Navigator.svelte` (tag tree tab) |
| T055 | `src/lib/components/sidebar/Navigator.svelte` (property browser tab) |

---

## Phase 5: User Story 2 (Wikilinks & Graph) - File Mapping

| Task | Files Created/Modified |
|------|----------------------|
| T056 | `src-tauri/src/services/wikilink_service.rs` |
| T057 | `src-tauri/src/services/wikilink_service.rs` (add create_note_from_wikilink), `src-tauri/src/commands/vault.rs` |
| T058 | `src/lib/components/sidebar/BacklinksPanel.svelte` |
| T059 | `src-tauri/src/commands/graph.rs` (get_graph_data method) |
| T060 | `src/lib/components/graph/GraphView.svelte` |
| T061 | `src/lib/components/graph/GraphFilter.svelte` |
| T062 | `src/lib/components/graph/GraphView.svelte` (add interaction handlers) |
| T063 | `src-tauri/src/services/wikilink_service.rs` (find_unlinked_references), `src/lib/components/modals/AutoLinker.svelte` |

---

## Phase 6: User Story 8 (Advanced Search) - File Mapping

| Task | Files Created/Modified |
|------|----------------------|
| T064 | `src-tauri/src/services/index_service.rs` (SearchQuery struct, to_tantivy_query) |
| T065 | `src-tauri/src/services/index_service.rs` (fuzzy search implementation) |
| T066 | `src/lib/components/modals/SearchPanel.svelte` |
| T067 | `src/lib/components/modals/SearchPanel.svelte` (in-file search mode) |
| T068 | `src-tauri/src/commands/search.rs` (HTTP server) |

---

## Phase 7: User Story 11 (Capture Dashboard) - File Mapping

| Task | Files Created/Modified |
|------|----------------------|
| T069 | `src-tauri/src/services/frontmatter_service.rs` (lifecycle conventions) |
| T070 | `src-tauri/src/services/index_service.rs` (get_captured_notes) |
| T071 | `src/lib/components/CaptureDashboard.svelte` |
| T072 | `src-tauri/src/commands/vault.rs` (quick_capture command), `src/lib/stores/hotkeys.ts` |
| T073 | `src/lib/components/CaptureDashboard.svelte` (batch classify) |
| T074 | `src/lib/components/CaptureDashboard.svelte` (event subscriptions) |
| T075 | `src/lib/components/sidebar/FolderTree.svelte`, `src/lib/components/sidebar/FileList.svelte`, `src-tauri/src/services/index_service.rs` |

---

## Phase 8: User Story 3 (Entity System) - File Mapping

| Task | Files Created/Modified |
|------|----------------------|
| T076 | `src-tauri/src/services/entity_service.rs`, `.bismuth/entity-types.json` (data file) |
| T077 | `src-tauri/src/services/entity_service.rs` (relationship resolution) |
| T078 | `src/lib/components/sidebar/EntityPanel.svelte` |
| T079 | `src-tauri/src/services/wikilink_service.rs` (get_concept_suggestions) |
| T080 | `src/lib/components/editor/Editor.svelte` (concept suggestion popover) |
| T081 | `src/lib/components/sidebar/EntityBrowser.svelte` |

---

## Phase 9: User Story 4 (Theming) - File Mapping

| Task | Files Created/Modified |
|------|----------------------|
| T082 | `src-tauri/src/services/theme_service.rs` |
| T083 | `src-tauri/src/commands/theme.rs` |
| T084 | `src/lib/services/theme.ts` |
| T085 | `src/lib/components/modals/StyleSettingsPanel.svelte`, `.bismuth/style-settings.json` (data file) |
| T086 | `src-tauri/src/main.rs` (plugin loader) |
| T087 | `src/lib/components/modals/SettingsModal.svelte`, `.bismuth/settings.json` (data file) |
| T088 | `src/lib/stores/layout.ts`, `.bismuth/layout.json` (data file) |

---

## Phase 10: User Story 7 (Tag Management) - File Mapping

| Task | Files Created/Modified |
|------|----------------------|
| T089 | `src/lib/components/sidebar/TagPanel.svelte` |
| T090 | `src-tauri/src/services/index_service.rs` (rename_tag method) |
| T091 | `src/lib/components/sidebar/TagPanel.svelte` (context menu) |
| T092 | `src-tauri/src/services/index_service.rs` (visibility filters) |

---

## Phase 11: User Story 27 (Semantic Connections) - File Mapping

| Task | Files Created/Modified |
|------|----------------------|
| T093 | `src-tauri/src/services/embedding_service.rs`, `src-tauri/resources/model.gguf` (model file) |
| T094 | `src-tauri/src/services/embedding_service.rs` (incremental indexing), `.bismuth/embeddings/` (vector storage) |
| T095 | `src/lib/components/sidebar/ConnectionsView.svelte` |
| T096 | `src/lib/components/sidebar/ConnectionsView.svelte` (Lookup tab) |
| T097 | `src-tauri/src/services/embedding_service.rs` (exclusion logic) |

---

## Phase 12: Performance Hardening - File Mapping

| Task | Files Created/Modified |
|------|----------------------|
| T098 | `src-tauri/benches/` (Criterion benchmarks) |
| T099 | `tests/e2e/graph-perf.spec.ts` |
| T100 | `tests/e2e/editor-perf.spec.ts` |
| T101 | `tests/e2e/startup-perf.spec.ts` |
| T102 | N/A (profiling task) |
| T103 | `.github/workflows/ci.yml` |

---

## Phase 13: Polish & Cross-Cutting - File Mapping

| Task | Files Created/Modified |
|------|----------------------|
| T104 | `src/lib/components/modals/CommandPalette.svelte`, `src/lib/stores/commands.ts` |
| T105 | `src/lib/stores/hotkeys.ts`, `src/lib/components/modals/SettingsModal.svelte` |
| T106 | `src/lib/components/StatusBar.svelte` |
| T107 | `src/lib/components/ui/ToastManager.svelte` |
| T108 | `src-tauri/src/services/*_test.rs` (unit tests for all services) |
| T109 | `tests/unit/ts/vault.test.ts`, `tests/unit/ts/search.test.ts`, `tests/unit/ts/layout.test.ts` |
| T110 | `tests/e2e/smoke.spec.ts`, `tests/e2e/search.spec.ts`, `tests/e2e/graph.spec.ts`, `tests/e2e/capture.spec.ts` |
| T111 | `README.md` |
| T112 | `specs/001-bismuth-pkm-editor/research.md` |

---

## Quick Reference: File Locations by Feature

### Vault Operations
- **Backend**: `src-tauri/src/services/vault_service.rs`, `src-tauri/src/commands/vault.rs`
- **Frontend**: `src/lib/services/vault.ts`, `src/lib/stores/vault.ts`
- **UI**: `src/lib/components/vault/WelcomeScreen.svelte`

### Editor
- **Component**: `src/lib/components/editor/Editor.svelte`
- **Extensions**: `src/lib/components/editor/extensions/wikilink.ts`
- **Layout**: `src/lib/components/editor/SplitPane.svelte`

### Search
- **Backend**: `src-tauri/src/services/index_service.rs`, `src-tauri/src/commands/search.rs`
- **Frontend**: `src/lib/services/search.ts`
- **UI**: `src/lib/components/modals/SearchPanel.svelte`

### Graph
- **Backend**: `src-tauri/src/commands/graph.rs`
- **Frontend**: `src/lib/services/graph.ts`
- **UI**: `src/lib/components/graph/GraphView.svelte`, `src/lib/components/graph/GraphFilter.svelte`

### Navigator
- **Components**: `src/lib/components/sidebar/Navigator.svelte`, `FolderTree.svelte`, `FileList.svelte`
- **Store**: `src/lib/stores/navigator.ts`
- **Data**: `.bismuth/navigator.json`

### Wikilinks
- **Backend**: `src-tauri/src/services/wikilink_service.rs`
- **UI**: `src/lib/components/sidebar/BacklinksPanel.svelte`

### Themes
- **Backend**: `src-tauri/src/services/theme_service.rs`
- **Frontend**: `src/lib/services/theme.ts`
- **UI**: `src/lib/components/modals/StyleSettingsPanel.svelte`
- **Tokens**: `src/lib/styles/tokens.css`

### Database
- **Schema**: `src-tauri/src/db.rs`
- **Models**: `src-tauri/src/models/*.rs`

### Configuration
- **App Config**: `src-tauri/src/config.rs`
- **Error Handling**: `src-tauri/src/error.rs`
- **Main Entry**: `src-tauri/src/main.rs`

---

## Data Files Created During Runtime

| File | Purpose | Created By |
|------|---------|-----------|
| `.bismuth/bismuth.db` | SQLite database | T016 |
| `.bismuth/index/` | Tantivy search index | T023 |
| `.bismuth/config.json` | App configuration | T015 |
| `.bismuth/navigator.json` | Navigator state (pins, colors) | T046 |
| `.bismuth/style-settings.json` | Theme customizations | T085 |
| `.bismuth/settings.json` | User preferences | T087 |
| `.bismuth/layout.json` | Panel sizes/visibility | T088 |
| `.bismuth/entity-types.json` | Custom entity definitions | T076 |
| `.bismuth/recovery/*.tmp` | Crash recovery files | T039 |
| `.bismuth/history/*.jsonl` | Edit history | T041 |
| `.bismuth/embeddings/*.vec` | Semantic embeddings | T094 |

---

## Testing File Structure

```
tests/
├── unit/
│   └── ts/
│       ├── vault.test.ts          # T109 - Vault store tests
│       ├── search.test.ts         # T109 - Search service tests
│       └── layout.test.ts         # T109 - Layout store tests
├── e2e/
│   ├── smoke.spec.ts              # T110 - Basic workflow
│   ├── search.spec.ts             # T110 - Search functionality
│   ├── graph.spec.ts              # T110 - Graph rendering
│   ├── capture.spec.ts            # T110 - Capture dashboard
│   ├── editor-perf.spec.ts        # T100 - Editor latency
│   ├── graph-perf.spec.ts         # T099 - Graph render time
│   └── startup-perf.spec.ts       # T101 - Cold startup
└── src-tauri/
    └── src/
        └── services/
            ├── vault_service_test.rs      # T108
            ├── index_service_test.rs      # T108
            ├── wikilink_service_test.rs   # T108
            ├── frontmatter_service_test.rs # T108
            └── theme_service_test.rs      # T108
```

---

## Notes

- **All file paths are relative to project root** (`bismuth/`)
- **Data files** (`.bismuth/*`) are created at runtime, not in version control
- **Test files** follow the same directory structure as source files
- **Rust services** are in `src-tauri/src/services/`, **commands** in `src-tauri/src/commands/`
- **Svelte components** are organized by feature in `src/lib/components/`
- **Stores** (state management) are in `src/lib/stores/`
- **IPC wrappers** (frontend ↔ backend) are in `src/lib/services/`

---

**Last Updated**: 2026-05-26  
**Status**: All 112 tasks mapped to file locations
