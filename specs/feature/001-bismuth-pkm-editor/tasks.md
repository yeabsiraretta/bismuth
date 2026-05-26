# Tasks: Bismuth PKM Editor — MVP

**Feature**: `001-bismuth-pkm-editor`
**Plan**: [plan.md](./plan.md) | **Spec**: [spec.md](./spec.md) | **Research**: [research.md](./research.md)
**Stack**: Tauri 1.5+ · Rust 1.75+ · Svelte 4.x · TypeScript 5.3+ · CodeMirror 6 · Tantivy · Konva.js · SQLite

**MVP Scope**: US1 (Vault & Editor), US2 (Wikilinks & Graph), US11 (Capture Dashboard), US15 (Navigator), US4 (Theming), US8 (Search), US3 (Entity System), US27 (Semantic Connections), US7 (Tag Management)  
**Deferred**: All P4+ user stories (Canvas, Canvas, Long-form, Publishing, Git, API, etc.)

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no cross-task dependencies at this phase)
- **[Story]**: User story label (US1–US27)
- Exact file paths are relative to repo root

---

## Phase 1: Project Setup

**Purpose**: Initialize the Tauri + Svelte + Rust monorepo, wire up the build pipeline, and produce a "Hello Bismuth" window.

- [ ] T001 Initialize Tauri project with `create-tauri-app` using Svelte + TypeScript template; produce working `src/`, `src-tauri/`, `package.json`, `vite.config.ts`, `tsconfig.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`
- [ ] T002 [P] Add frontend dependencies to `package.json`: `@codemirror/view`, `@codemirror/state`, `@codemirror/language`, `@codemirror/commands`, `@codemirror/lang-markdown`, `konva`, `pdfjs-dist`, `unified`, `remark-parse`, `remark-rehype`, `rehype-stringify`
- [ ] T003 [P] Add Rust dependencies to `src-tauri/Cargo.toml`: `tantivy`, `notify`, `git2`, `serde`, `serde_json`, `tokio`, `rusqlite`, `yaml-rust`, `regex`, `lopdf`, `candle-core`
- [ ] T004 [P] Configure ESLint + Prettier for TypeScript/Svelte in `.eslintrc.cjs` and `.prettierrc`
- [ ] T005 [P] Configure `clippy` + `rustfmt` in `src-tauri/.cargo/config.toml`
- [ ] T006 [P] Configure Vitest in `vite.config.ts` and add `tests/unit/ts/` directory with placeholder spec
- [ ] T007 [P] Add Playwright config at `playwright.config.ts` and `tests/e2e/` directory with smoke test scaffold
- [ ] T008 Create sample vault at `.bismuth/` with subdirectories `notes/`, `templates/`, `themes/`, `plugins/`, `tips/`
- [ ] T009 Verify `pnpm tauri dev` opens a blank Tauri window with no errors — this is the Phase 1 checkpoint

**Checkpoint**: Running app window opens. All toolchains (Rust, Node, Tauri) confirmed working.

---

## Phase 2: Foundational Infrastructure

**Purpose**: Core Rust services and Svelte scaffolding that ALL user stories depend on. Nothing in Phase 3+ starts until this is done.

**⚠️ CRITICAL**: No user story work begins until this phase is complete.

### 2.1 — Rust Data Models

- [ ] T010 [P] Define `Note` struct in `src-tauri/src/models/note.rs`: fields `path`, `title`, `content`, `frontmatter` (`HashMap<String, serde_json::Value>`), `created_at`, `modified_at`
- [ ] T011 [P] Define `Vault` struct in `src-tauri/src/models/vault.rs`: fields `root_path`, `settings_path`, `name`
- [ ] T012 [P] Define `Link` struct in `src-tauri/src/models/link.rs`: fields `source_path`, `target_title`, `target_path` (Option), `alias` (Option), `is_resolved`
- [ ] T013 [P] Define `Tag` struct and `SearchResult` struct in `src-tauri/src/models/mod.rs`; expose all models via `mod.rs`

### 2.2 — Error Handling & Config

- [ ] T014 Define `BismuthError` enum in `src-tauri/src/error.rs` covering `IoError`, `ParseError`, `IndexError`, `NotFound`, `InvalidPath`, `DatabaseError`; implement `From` conversions for `std::io::Error`, `rusqlite::Error`, `serde_json::Error`
- [ ] T015 Define `AppConfig` struct in `src-tauri/src/config.rs` covering `vault_root`, `theme_path`, `default_note_location`, `search_http_port`, `auto_save_ms`; implement serialize/deserialize + load-from-file

### 2.3 — SQLite Database Layer

- [ ] T016 Create `src-tauri/src/db.rs`: initialize SQLite at `.bismuth/bismuth.db`; run migrations for tables: `notes` (path, title, frontmatter_json, created_at, modified_at), `links` (source_path, target_title, target_path, is_resolved), `tags` (name, count), `jdex_entries`, `graph_nodes`, `graph_edges`
- [ ] T017 Add index migrations: `idx_notes_path`, `idx_links_source`, `idx_tags_name`, `idx_graph_edges_from`, `idx_graph_edges_to` in `src-tauri/src/db.rs`

### 2.4 — Vault Service (FR-001)

- [ ] T018 Implement `VaultService` in `src-tauri/src/services/vault_service.rs`: methods `open(path) -> Result<Vault>`, `create(path) -> Result<Vault>`, `scan() -> Result<Vec<Note>>`, `get_note(path) -> Result<Note>`, `write_note(path, content) -> Result<()>`, `delete_note(path) -> Result<()>`, `rename_note(old, new) -> Result<()>`
- [ ] T019 Implement cross-platform path normalization in `src-tauri/src/utils/path.rs`: `normalize_path`, `is_within_vault`, `vault_relative_path`; enforce vault-root boundary check for FR-247
- [ ] T020 Wire `VaultService` into Tauri `AppState` via `tauri::State` in `src-tauri/src/main.rs`

### 2.5 — File Watcher (Research §5)

- [ ] T021 Implement `VaultWatcher` in `src-tauri/src/services/watcher_service.rs` using `notify` crate: watch vault root recursively, debounce 500 ms, emit Tauri events `vault://file-created`, `vault://file-modified`, `vault://file-deleted`; ignore `.bismuth/`, `.git/`, `.tmp`, `.swp`, `.DS_Store`

### 2.6 — Frontmatter Service

- [ ] T022 Implement `FrontmatterService` in `src-tauri/src/services/frontmatter_service.rs`: `parse(content) -> (HashMap<String, Value>, String)`, `serialize(meta, body) -> String`, `get_field(meta, key) -> Option<Value>`, `set_field(meta, key, value) -> HashMap<String, Value>`

### 2.7 — Tantivy Index Service (FR-028, Research §3)

- [ ] T023 Implement `IndexService` in `src-tauri/src/services/index_service.rs`: build Tantivy schema (`path TEXT|STORED`, `title TEXT|STORED`, `content TEXT`, `tags FACET`, `portent_type STRING|STORED`, `created DATE|INDEXED|STORED`, `modified DATE|INDEXED|STORED`, `outbound_links TEXT`, `link_count U64`); persist index at `.bismuth/index/`
- [ ] T024 Implement `IndexService::index_note(note)`, `index_all(vault)`, `delete_entry(path)`, `search(query: SearchQuery) -> Vec<SearchResult>` — wire watcher events to trigger incremental re-index

### 2.8 — Tauri IPC Command Layer (Research §1)

- [ ] T025 Implement vault IPC commands in `src-tauri/src/commands/vault.rs`: `open_vault`, `create_vault`, `get_note`, `write_note`, `delete_note`, `rename_note`, `list_notes`
- [ ] T026 [P] Implement search IPC commands in `src-tauri/src/commands/search.rs`: `search_vault`, `search_in_file`
- [ ] T027 [P] Implement graph IPC commands in `src-tauri/src/commands/graph.rs`: `get_graph_data` (returns nodes + edges JSON), `get_backlinks(path)`
- [ ] T028 Register all commands in `src-tauri/src/main.rs` via `.invoke_handler(tauri::generate_handler![...])`

### 2.9 — Svelte Foundation

- [ ] T029 Create Svelte design token file at `src/lib/styles/tokens.css` with all Obsidian-compatible CSS variables (`--background-primary`, `--text-normal`, `--interactive-accent`, spacing tokens, font tokens) as per Research §4
- [ ] T030 [P] Build base UI components in `src/lib/components/ui/`: `Button.svelte` (variant, size props), `Input.svelte`, `Dropdown.svelte`, `Modal.svelte`, `Toast.svelte`, `Tooltip.svelte` — all using design tokens
- [ ] T031 [P] Build layout shell in `src/App.svelte`: left sidebar slot, main editor slot, right sidebar slot, command palette overlay slot; implement `LayoutStore` in `src/lib/stores/layout.ts`
- [ ] T032 Create Svelte IPC service wrappers in `src/lib/services/`: `vault.ts` (wraps all vault commands), `search.ts`, `graph.ts` — typed using shared TypeScript interfaces in `src/lib/types/`
- [ ] T033 Create `src/lib/stores/vault.ts`: reactive Svelte store holding `currentVault`, `openNotes`, `activeNotePath`; subscribe to Tauri file-change events

**Checkpoint**: Foundation ready. All Rust services compile, IPC commands respond, Svelte shell renders. User story implementation can begin.

---

## Phase 3: User Story 1 — Core Vault & Editor (Priority: P1) 🎯 MVP

**Goal**: User can open a vault, browse files, create/edit/save notes with markdown rendering and <16ms editor latency.

**Independent Test**: Open a folder as vault → create note → write markdown → see syntax highlighting → close and re-open → content persists.

**FRs**: FR-001, FR-002, FR-003, FR-004, FR-005, FR-020, FR-021, FR-025

### Implementation

- [ ] T034 [US1] Build welcome screen component `src/lib/components/WelcomeScreen.svelte`: two options (blank vault with `+` button, template vault selector); dark background; vault template list (PARA, Johnny Decimal, Zettelkasten) per FR-003/FR-004
- [ ] T035 [US1] Implement vault template scaffolding in `src-tauri/src/services/vault_service.rs`: `create_from_template(path, template_type)` creates pre-structured folder hierarchies for each template type
- [ ] T036 [US1] Integrate CodeMirror 6 in `src/lib/components/editor/Editor.svelte`: mount `EditorView` with `markdown()` language, `syntaxHighlighting(defaultHighlightStyle)`, `lineNumbers()`, `history()`, `drawSelection()`, `dropCursor()`, `indentOnInput()`; bind to note content via Svelte store
- [ ] T037 [US1] Implement wikilink CM6 extension `src/lib/components/editor/extensions/wikilink.ts`: `ViewPlugin` scanning for `[[...]]` patterns, applying `cm-wikilink` decoration class; click handler invokes `open_note` IPC command (FR-005)
- [ ] T038 [US1] Implement auto-save in `src/lib/components/editor/Editor.svelte`: debounce 500ms on `docChanged`; call `write_note` IPC; show save indicator in status bar
- [ ] T039 [US1] Build crash recovery in `src-tauri/src/services/vault_service.rs`: write recovery file to `.bismuth/recovery/<path>.tmp` on each save; on vault open check for recovery files and prompt restore (FR scenario 5)
- [ ] T040 [US1] Build split-pane layout in `src/lib/components/editor/SplitPane.svelte`: horizontal/vertical split with resizable divider; each pane hosts an independent `Editor.svelte` instance
- [ ] T041 [US1] Implement edit history per FR-020: on each save, append snapshot to `.bismuth/history/<note-hash>.jsonl`; implement `get_history(path)`, `restore_version(path, timestamp)` IPC commands
- [ ] T042 [US1] Implement file size + nesting depth warning per FR-021: in `VaultService::write_note`, check file size >10MB and folder depth >10; emit Tauri event `vault://warning` with message; `Toast.svelte` subscribes and displays non-blocking warning

**Checkpoint**: US1 fully functional. Create, edit, save, restore notes in split panes. Crash recovery works.

---

## Phase 4: User Story 15 — Notebook Navigator (Priority: P1) 🎯 MVP

**Goal**: Two-pane keyboard-first file browser replacing the raw file tree. Color/icon assignment, vault profiles, pinning, drag-drop, file operations.

**Independent Test**: Open Navigator → expand folder → select note with keyboard only → pin it → assign color → create new note in same folder — no mouse needed.

**FRs**: FR-001, FR-005 (link update on move/rename)

### Implementation

- [ ] T043 [US15] Build Navigator shell `src/lib/components/sidebar/Navigator.svelte`: two-pane layout (left = folder/tag/property tabs, right = file list); `NavigatorStore` in `src/lib/stores/navigator.ts` holding selected folder, selected note, active profile
- [ ] T044 [US15] Build folder tree component `src/lib/components/sidebar/FolderTree.svelte`: recursive rendering of vault directory, expand/collapse on `→`/`←`, keyboard navigation (j/k, Enter to select); fetch directory listing via `list_notes` IPC
- [ ] T045 [US15] Build file list component `src/lib/components/sidebar/FileList.svelte`: show filename, modification date, up to 5 preview lines, featured image thumbnail if `image:` frontmatter present; sort by name/date/pin-state
- [ ] T046 [US15] Implement pinning in `src/lib/stores/navigator.ts`: persist pinned notes per folder to `.bismuth/navigator.json`; pinned notes sort to top regardless of active sort
- [ ] T047 [US15] Implement folder/file color + icon assignment: store in `.bismuth/navigator.json`; `FolderTree.svelte` and `FileList.svelte` read and apply `color` CSS variable and Lucide icon component
- [ ] T048 [US15] Implement vault profiles in `src-tauri/src/services/vault_service.rs` + `NavigatorStore`: each profile stores hidden folder globs, hidden tag patterns, sort preferences; switching profiles re-renders Navigator without restart
- [ ] T049 [US15] Implement shortcut bar `src/lib/components/sidebar/ShortcutBar.svelte`: up to 9 pinnable entries (notes, folders, tags, saved searches); `Cmd/Ctrl+1–9` activates slot
- [ ] T050 [US15] Implement calendar panel `src/lib/components/sidebar/CalendarPanel.svelte`: render month grid; clicking a day opens or creates daily note using configured daily note template
- [ ] T051 [US15] Implement drag-and-drop file move in `FileList.svelte`: on drop, call `rename_note` IPC with new path; trigger wikilink update scan via `update_links_on_rename` IPC command (FR-005)
- [ ] T052 [US15] Implement file context menu operations: create, rename, duplicate, move, merge, trash, convert-to-folder-note — all as IPC commands in `src-tauri/src/commands/vault.rs`; `merge_notes` concatenates content of selected notes into new note, moves originals to trash
- [ ] T053 [US15] Implement `update_links_on_rename` in `src-tauri/src/services/wikilink_service.rs`: scan all vault notes for references to old path/title, update atomically, re-index (FR-005)
- [ ] T054 [US15] Add tag tree tab to Navigator left pane: fetch all tags from `IndexService`; render hierarchy; click tag filters file list to matching notes
- [ ] T055 [US15] Add property browser tab to Navigator left pane: fetch distinct frontmatter keys+values; filter file list by property value

**Checkpoint**: US15 fully functional. All file operations work keyboard-first. Drag-drop moves files and updates wikilinks.

---

## Phase 5: User Story 2 — Wikilinks & Graph View (Priority: P2)

**Goal**: `[[wikilink]]` resolution, backlinks panel, graph view with Konva.js rendering <3s for 10k nodes with filtering.

**Independent Test**: 10-note vault with cross-links → graph shows all nodes/edges → filter by tag → click node opens note.

**FRs**: FR-005, FR-006, FR-007, FR-245, FR-246, FR-247, FR-256, FR-257, FR-258

### Implementation

- [ ] T056 [US2] Implement `WikilinkService` in `src-tauri/src/services/wikilink_service.rs`: `extract_links(content) -> Vec<Link>`, `resolve_link(title, vault_root) -> Option<PathBuf>`, `get_backlinks(path) -> Vec<Link>`; handle ambiguous targets (FR-245/246/247 path rules)
- [ ] T057 [US2] Implement unresolved wikilink note creation: when user clicks unresolved `[[Target]]` link in editor, call `create_note_at_default_location(title)` respecting vault setting; apply FR-247 boundary check
- [ ] T058 [US2] Build backlinks panel `src/lib/components/sidebar/BacklinksPanel.svelte`: list all notes linking to active note; click entry navigates to source note; update on `vault://file-modified` events
- [ ] T059 [US2] Implement graph data builder in `src-tauri/src/commands/graph.rs`: `get_graph_data` queries `links` table + `notes` table; returns `{ nodes: [{id, label, type, tags}], edges: [{source, target}] }`; incremental rebuild on index updates
- [ ] T060 [US2] Build graph view `src/lib/components/graph/GraphView.svelte`: mount Konva.js `Stage`; render note nodes as circles (color by Portent type or tag), wikilinks as directed arrows; implement force-directed layout using a simple Fruchterman-Reingold pass on first render
- [ ] T061 [US2] Implement graph filtering controls `src/lib/components/graph/GraphFilter.svelte`: filter by tag (multi-select), Portent type (multi-select), folder (path prefix), link depth (slider 1–5); update displayed nodes/edges reactively
- [ ] T062 [US2] Implement graph interaction: click node → open note in editor; hover node → show tooltip (title, type, link count); edge click → show direction label; pan/zoom via Konva.js built-ins; maintain >30fps for 10k nodes via node culling outside viewport
- [ ] T063 [US2] Implement note linker (FR-256/257/258): `src-tauri/src/services/wikilink_service.rs::find_unlinked_references(path) -> Vec<LinkSuggestion>`; scan note text for substrings matching other note titles and aliases (case-insensitive optional); frontend `AutoLinker.svelte` modal shows grouped suggestions, batch-creates wikilinks atomically with undo support

**Checkpoint**: US2 fully functional. Wikilinks resolve, backlinks panel updates, graph renders and filters, node click navigates.

---

## Phase 6: User Story 8 — Advanced Search (Priority: P3)

**Goal**: Unified search panel: BM25 ranking, typo tolerance, exact phrase, exclusions, type/tag filters, Vim navigation, in-file mode, HTTP API endpoint.

**Independent Test**: 1000-note vault → search with 3-word query → results <200ms → j/k navigate → Enter opens note.

**FRs**: FR-028, FR-029, FR-030, FR-031, FR-032 (HTTP API), FR-033 (OCR search)

### Implementation

- [ ] T064 [US8] Implement `SearchQuery` struct and `to_tantivy_query` in `src-tauri/src/services/index_service.rs`: parse text, tags, portent_type, date_range, fuzzy flag; compose BooleanQuery from sub-queries as per Research §3
- [ ] T065 [US8] Implement typo-tolerant fuzzy search: use Tantivy `FuzzyTermQuery` with max edit distance 1 for terms >4 chars; exact match for quoted phrases via `PhraseQuery`; `-word` exclusions via `Occur::MustNot`
- [ ] T066 [US8] Build search panel `src/lib/components/modals/SearchPanel.svelte`: trigger via `Cmd/Ctrl+P`; text input with debounce 100ms; result list showing snippet, file path, score; `j`/`k` to navigate, Enter to open, insert-link shortcut to insert wikilink at cursor
- [ ] T067 [US8] Implement in-file search mode toggle in `SearchPanel.svelte`: when toggled, scope query to current open note content using CodeMirror search extension; highlight matching lines
- [ ] T068 [US8] Implement search HTTP server in `src-tauri/src/commands/search.rs`: start `tokio` HTTP server on configurable port; `GET /search?q=<query>` proxies to `IndexService::search`; return JSON `[{path, title, snippet, score}]`; enforce local-only binding (127.0.0.1)

**Checkpoint**: US8 fully functional. Search panel returns ranked results with keyboard navigation. HTTP endpoint responds with JSON.

---

## Phase 7: User Story 11 — Capture & Lifecycle Dashboard (Priority: P2)

**Goal**: Inbox for unclassified notes, quick-capture shortcut, batch classify, lifecycle state transitions, archived notes hidden from main views.

**Independent Test**: 10 captured notes in dashboard → assign type + belongs_to → set organized → note leaves inbox — no other feature needed.

**FRs**: FR-008 (Portent types), FR-009 (relationships)

### Implementation

- [ ] T069 [US11] Implement lifecycle frontmatter convention in `FrontmatterService`: `organized: bool`, `archived: bool`; notes missing both treated as `captured`; `archive_note(path)` sets `archived: true` and triggers re-index to exclude from default views
- [ ] T070 [US11] Implement capture dashboard query in `src-tauri/src/services/index_service.rs`: `get_captured_notes() -> Vec<Note>` filters notes where `organized != true AND archived != true`; count by lifecycle state
- [ ] T071 [US11] Build `CaptureDashboard.svelte` in `src/lib/components/`: list captured notes with title, creation date, snippet; per-row actions: assign Portent type (dropdown), set lifecycle state, attach `belongs_to` (note picker), add `related_to`, dismiss/delete
- [ ] T072 [US11] Implement quick-capture global shortcut in `src-tauri/src/commands/vault.rs`: `quick_capture` command creates new note with `organized: false`, `archived: false` in default location within 200ms; Svelte registers Tauri global shortcut `Cmd/Ctrl+Shift+N`
- [ ] T073 [US11] Implement batch classify in `CaptureDashboard.svelte`: `Cmd/Ctrl+Click` multi-select; "Classify selected" action applies chosen type + state to all selected notes atomically via single IPC call
- [ ] T074 [US11] Wire file-watcher events to `CaptureDashboard.svelte`: subscribe to `vault://file-created` and `vault://file-modified`; refresh dashboard list in real time without page reload (FR scenario 4)
- [ ] T075 [US11] Implement archived note visibility: modify `FolderTree.svelte` and `FileList.svelte` to exclude notes where `archived: true` from default render; `IndexService::search` still returns archived notes; direct path access still works

**Checkpoint**: US11 fully functional. Quick-capture creates note in <200ms. Dashboard triage, batch classify, and archive hiding all work.

---

## Phase 8: User Story 3 — Entity System & Deep Linking (Priority: P3)

**Goal**: Portent typed entities, belongs_to/related_to relationships, entity panel, concept link suggestions, custom entity types.

**Independent Test**: Set `type: Project` in frontmatter → open entity panel → see lifecycle state, relationships, type icon — with no other feature active.

**FRs**: FR-008, FR-009, FR-010, FR-256, FR-257, FR-258

### Implementation

- [ ] T076 [US3] Implement Portent type registry in `src-tauri/src/services/entity_service.rs`: define 8 default types with icons and metadata schemas; support custom type definitions read from `.bismuth/entity-types.json`; `get_type_definition(type_name) -> TypeDefinition`
- [ ] T077 [US3] Implement relationship resolution in `entity_service.rs`: `get_entity_relationships(path) -> EntityRelationships` — resolve `belongs_to`, `related_to` frontmatter arrays to `Vec<Note>`; detect and surface circular relationship warnings (edge case)
- [ ] T078 [US3] Build entity panel `src/lib/components/sidebar/EntityPanel.svelte`: shows type icon, lifecycle state, `belongs_to` list (clickable wikilinks), `related_to` list, backlinks; update reactively on frontmatter change events
- [ ] T079 [US3] Implement concept link suggestion in `src-tauri/src/services/wikilink_service.rs`: `get_concept_suggestions(content) -> Vec<ConceptSuggestion>` — scan note body for substrings matching vault note titles (excluding already-linked text per FR-258); debounce 800ms; emit via Tauri event `editor://concept-suggestions`
- [ ] T080 [US3] Build concept suggestion popover in `Editor.svelte`: listen for `editor://concept-suggestions`; show inline popover at matched text with "Link" / "Dismiss" actions; "Link" wraps text in `[[...]]` syntax
- [ ] T081 [US3] Implement entity structured view (browse by type): `EntityBrowser.svelte` lists all notes grouped by Portent type with count badge; clicking a type filters to those notes in the file list

**Checkpoint**: US3 fully functional. Typed entities render correctly, relationships resolve, concept suggestions appear inline.

---

## Phase 9: User Story 4 — Theming & Customization (Priority: P4)

**Goal**: Obsidian CSS theme loading, Style Settings parser, plugin API, configurable layouts persisted per vault.

**Independent Test**: Drop CSS theme into `themes/` → restart → all surfaces adopt theme colors/fonts.

**FRs**: FR-011, FR-012, FR-013, FR-014, FR-027

### Implementation

- [ ] T082 [US4] Implement `ThemeService` in `src-tauri/src/services/theme_service.rs`: `load_theme(path) -> String` reads CSS; `parse_style_settings(css) -> Vec<StyleSettings>` using regex to extract `/* @settings ... */` YAML blocks and deserialize into `Setting` enum (VariableColor, VariableNumberSlider, ClassToggle, etc.) per Research §4
- [ ] T083 [US4] Implement theme IPC: `get_available_themes() -> Vec<String>`, `load_theme(name) -> String` (returns CSS content); watch `themes/` folder for new themes via `VaultWatcher`
- [ ] T084 [US4] Implement theme application in `src/lib/services/theme.ts`: `applyTheme(css)` extracts CSS variables via regex and injects into `document.documentElement.style`; load on vault open; re-apply on theme change event
- [ ] T085 [US4] Build Style Settings UI panel `src/lib/components/modals/StyleSettingsPanel.svelte`: dynamically render controls from `StyleSettings[]` — color pickers for `variable-color`, sliders for `variable-number-slider`, toggles for class toggles; persist choices to `.bismuth/style-settings.json`; apply changes live via CSS variable injection
- [ ] T086 [US4] Implement plugin loader in `src-tauri/src/main.rs`: scan `plugins/` folder on startup; for each folder with `plugin.json` manifest, load and register (frontend plugins inject Svelte components via dynamic import, backend plugins register Tauri commands); invalid/erroring plugins skipped with warning toast (FR scenario 5)
- [ ] T087 [US4] Build settings modal `src/lib/components/modals/SettingsModal.svelte`: tabbed interface (General, Editor, Themes, Plugins, Vault Profiles, Hotkeys); persist all settings to `.bismuth/settings.json`; load on vault open
- [ ] T088 [US4] Implement layout persistence in `LayoutStore`: serialize panel visibility, sizes, split orientation to `.bismuth/layout.json` per vault; restore on vault open (FR-014)

**Checkpoint**: US4 fully functional. Themes load and apply. Style Settings renders dynamic controls. Plugin loader runs. Settings persist.

---

## Phase 10: User Story 7 — Tag Management (Priority: P7)

**Goal**: Tag panel with search, rename (with propagation), merge, hierarchy collapse, graph visibility controls.

**Independent Test**: 50-tag vault → search narrows list in real time → rename propagates to all notes atomically with undo.

**FRs**: FR-024

### Implementation

- [ ] T089 [US7] Build tag management panel `src/lib/components/sidebar/TagPanel.svelte`: render all vault tags with count badges; search input filters in real time; hierarchical display (parent `/` child); collapse/expand hierarchy controls
- [ ] T090 [US7] Implement `rename_tag` in `src-tauri/src/services/index_service.rs`: find all notes containing old tag (body + frontmatter); update atomically using `FrontmatterService`; propagate child tag renames; detect merge conflicts (target tag already exists); enqueue as undoable operation in editor history
- [ ] T091 [US7] Implement tag context menu in `TagPanel.svelte`: rename, merge (with conflict warning), hide from graph, hide from active views, create tag page (note aliased to tag), drag-and-drop reorganization; "random note with tag" opens random matching note
- [ ] T092 [US7] Implement tag visibility filters: hidden tags excluded from graph node rendering; notes tagged only with hidden tags hidden from file list; `IndexService` respects visibility filters in query results

**Checkpoint**: US7 fully functional. Tags searchable, renameable with full propagation and undo.

---

## Phase 11: User Story 27 — Semantic Connections (Priority: P2)

**Goal**: Local ML embedding model, Connections view surfacing semantically related notes, Lookup view for natural language queries, drag-to-insert wikilink.

**Independent Test**: 20 notes with thematic content but no shared keywords → Connections view surfaces 3+ related notes in top-5 — local model, no internet.

**FRs**: FR-025 (local-first), semantic search NFRs

### Implementation

- [ ] T093 [US27] Integrate `candle-core` + bundled GGUF embedding model in `src-tauri/src/services/embedding_service.rs`: `embed(text: &str) -> Vec<f32>`; load model from `src-tauri/resources/model.gguf`; run on CPU (no GPU required); batch processing for initial vault indexing
- [ ] T094 [US27] Implement incremental embedding index in `embedding_service.rs`: store vectors in `.bismuth/embeddings/` as per-note `.vec` binary files; rebuild on `vault://file-modified`; `get_similar(path, top_k) -> Vec<(path, score)>` via cosine similarity scan
- [ ] T095 [US27] Build Connections view `src/lib/components/sidebar/ConnectionsView.svelte`: auto-update on active note change (debounced 300ms); display top-N semantically similar notes with score badge; pause button, pin connection, copy-as-wikilinks button, random-connection button; drag entry into editor to insert wikilink at drop position
- [ ] T096 [US27] Build Lookup view tab in ConnectionsView: text input for natural language query; embed query text via `embed()` IPC; return top-K vault notes by cosine similarity; results ranked by relevance independent of active note
- [ ] T097 [US27] Implement embedding exclusion: read `excluded_paths` and `excluded_tags` from settings; skip matching notes in `embedding_service.rs` during indexing and similarity queries; reflect changes on next index pass

**Checkpoint**: US27 fully functional. Connections view updates on note switch. Local model runs offline. Drag-to-insert wikilink works.

---

## Phase 12: Performance Hardening & NFR Validation

**Purpose**: Validate all NFRs before MVP release. Fix hot paths. Run benchmarks.

- [ ] T098 [P] Benchmark Tantivy search: run `cargo criterion` in `src-tauri/` with 500k-document index; validate <100ms query time (NFR-002); optimize field weights or query parser if needed
- [ ] T099 [P] Benchmark graph render: load 10k-node graph in `GraphView.svelte` with Playwright; measure time-to-interactive; validate <3s (NFR-003); implement viewport culling if threshold exceeded
- [ ] T100 [P] Benchmark editor input latency: use CodeMirror profiler in `tests/e2e/editor-perf.spec.ts`; measure frame time on keypress; validate <16ms (NFR-001); optimize decoration rebuild if needed
- [ ] T101 [P] Measure cold startup time: Playwright `performance.now()` from launch to vault ready; validate <3s (NFR-006); optimize Tauri window creation and initial index scan if needed
- [ ] T102 [P] Profile memory with 10k open notes: use OS profiler; validate <500MB RSS (NFR-007); fix leaks in Svelte store subscriptions or Konva canvas buffers if needed
- [ ] T103 Cross-platform CI matrix: add GitHub Actions workflow `.github/workflows/ci.yml` running `cargo test`, `pnpm test`, `pnpm playwright` on macOS-latest, windows-latest, ubuntu-latest; gate PRs on all-green

**Checkpoint**: All NFRs validated. CI passing on all 3 platforms.

---

## Phase 13: Polish & Cross-Cutting Concerns

- [ ] T104 [P] Implement command palette `src/lib/components/modals/CommandPalette.svelte`: `Cmd/Ctrl+P` trigger; fuzzy search across all registered commands; keyboard-navigable; all Bismuth commands registered via `CommandRegistry` in `src/lib/stores/commands.ts`
- [ ] T105 [P] Add keyboard shortcut system: global hotkey registry in `src/lib/stores/hotkeys.ts`; configurable per-vault in settings modal; Vim-mode toggle for editor (CodeMirror vim extension)
- [ ] T106 [P] Implement status bar `src/lib/components/StatusBar.svelte`: word count, line count, cursor position, save indicator, index status, active vault name
- [ ] T107 [P] Add Toast notification system `src/lib/components/ui/ToastManager.svelte`: singleton store; auto-dismiss after 4s; support info/warning/error variants; all Tauri warning events route here
- [ ] T108 [P] Write Vitest unit tests for all Rust services via `cargo test` in `src-tauri/`: `vault_service_test.rs`, `index_service_test.rs`, `wikilink_service_test.rs`, `frontmatter_service_test.rs`, `theme_service_test.rs` — targeting 90% line coverage
- [ ] T109 [P] Write Vitest unit tests for all Svelte stores and services in `tests/unit/ts/`: `vault.test.ts`, `search.test.ts`, `layout.test.ts` — targeting 90% coverage
- [ ] T110 Write Playwright E2E tests in `tests/e2e/`: `smoke.spec.ts` (open vault, create note, write, save, re-open), `search.spec.ts` (search returns results), `graph.spec.ts` (graph renders, filter works, click opens note), `capture.spec.ts` (quick-capture, dashboard classify)
- [ ] T111 Update `README.md` with: project description, prerequisites (Rust, Node, pnpm, Tauri CLI), `pnpm install`, `pnpm tauri dev` quickstart, test commands (`cargo test`, `pnpm test`, `pnpm playwright`)
- [ ] T112 Update `specs/feature/001-bismuth-pkm-editor/research.md` status to ✅ and note any deviations from Phase 0 decisions discovered during implementation

**Checkpoint**: All polish tasks complete. App is demo-ready. Tests pass. README accurate.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundation)**: Depends on Phase 1 — **BLOCKS all user stories**
- **Phase 3 (US1)**: Depends on Phase 2 — core editor and vault ops
- **Phase 4 (US15)**: Depends on Phase 2 + Phase 3 (needs vault open, note write)
- **Phase 5 (US2)**: Depends on Phase 2 + Phase 3 (needs editor, vault index)
- **Phase 6 (US8)**: Depends on Phase 2 (Tantivy index must exist)
- **Phase 7 (US11)**: Depends on Phase 2 + Phase 3 (needs note create/write, frontmatter)
- **Phase 8 (US3)**: Depends on Phase 7 (entity panel builds on lifecycle states)
- **Phase 9 (US4)**: Depends on Phase 2 (theme service, plugin loader in main.rs)
- **Phase 10 (US7)**: Depends on Phase 2 (IndexService tags) + Phase 5 (tag from graph)
- **Phase 11 (US27)**: Depends on Phase 3 (notes must exist) + Phase 2 (embedding service)
- **Phase 12 (Perf)**: Depends on Phases 3–11 all complete
- **Phase 13 (Polish)**: Depends on all previous phases

### User Story Cross-Dependencies

| Story | Depends On | Can Parallel With |
|-------|-----------|-------------------|
| US1 (P3) | Foundation (P2) | — |
| US15 (P4) | US1 | — |
| US2 (P5) | US1 | US11, US4 |
| US8 (P6) | Foundation | US2, US11, US4 |
| US11 (P7) | US1 | US2, US8, US4 |
| US3 (P8) | US11 | US7 |
| US4 (P9) | Foundation | US7, US27 |
| US7 (P10) | Foundation + US2 | US3, US27 |
| US27 (P11) | US1 | US7 |

### Within Each Phase

1. Data models before services
2. Services before IPC commands
3. IPC commands before Svelte wrappers
4. Svelte stores before UI components
5. UI components before integration/E2E tests

---

## Parallel Execution Examples

### Phase 2 — Run Together After T015

```
T016 (DB schema)          T017 (DB indexes) — same file, sequential
T018 (VaultService)       T019 (path utils)       T020 (AppState wire)
T021 (VaultWatcher)       T022 (FrontmatterSvc)
T023 (IndexService schema) T024 (IndexService search)
T025 (vault commands)     T026 (search commands)  T027 (graph commands)
T029 (design tokens)      T030 (UI components)    T031 (App shell)
```

### Phase 3 — US1 Can Parallel

```
T036 (CodeMirror mount)   T037 (wikilink extension)   T038 (auto-save)
T039 (crash recovery)     T041 (edit history)          T042 (file warning)
```

### Phase 5 — US2 Can Parallel

```
T056 (WikilinkService)    T059 (graph data builder)
T060 (GraphView render)   T061 (graph filters)         T062 (graph interaction)
```

---

## Implementation Strategy

### MVP First (Phases 1–13 in order)

1. Complete **Phase 1**: Setup — toolchain confirmed
2. Complete **Phase 2**: Foundation — all services + IPC working
3. Complete **Phase 3** (US1): Notes open, edit, save ← **earliest demo point**
4. Complete **Phase 4** (US15): Navigator functional
5. Complete **Phase 5** (US2): Graph renders, wikilinks resolve
6. Complete **Phase 6** (US8): Search panel returns results
7. Complete **Phase 7** (US11): Capture dashboard operational
8. Complete **Phase 8** (US3): Entity panel renders
9. Complete **Phase 9** (US4): Themes load, plugins run
10. Complete **Phase 10** (US7): Tags manageable
11. Complete **Phase 11** (US27): Semantic connections live
12. Complete **Phase 12**: All NFRs pass benchmarks
13. Complete **Phase 13**: Polish, tests, docs → **v0.1.0 MVP release**

### Incremental Delivery Checkpoints

| After Phase | What is Demo-able |
|-------------|-------------------|
| Phase 3 | Open vault, write markdown, autosave |
| Phase 4 | Two-pane file navigator, keyboard-first |
| Phase 5 | Graph view, wikilink click-navigation, backlinks |
| Phase 6 | Unified search with fuzzy match |
| Phase 7 | Capture inbox with quick-capture shortcut |
| Phase 11 | Semantic connections sidebar (no internet) |
| Phase 13 | Complete MVP — all 9 core stories functional |

---

## Summary

| Metric | Value |
|--------|-------|
| **Total tasks** | 112 |
| **Phase 1 (Setup)** | 9 tasks |
| **Phase 2 (Foundation)** | 24 tasks |
| **Phase 3 (US1)** | 9 tasks |
| **Phase 4 (US15)** | 13 tasks |
| **Phase 5 (US2)** | 8 tasks |
| **Phase 6 (US8)** | 5 tasks |
| **Phase 7 (US11)** | 7 tasks |
| **Phase 8 (US3)** | 6 tasks |
| **Phase 9 (US4)** | 7 tasks |
| **Phase 10 (US7)** | 4 tasks |
| **Phase 11 (US27)** | 5 tasks |
| **Phase 12 (Perf)** | 6 tasks |
| **Phase 13 (Polish)** | 9 tasks |
| **Parallel opportunities** | ~60 tasks marked [P] |
| **MVP user stories covered** | US1, US2, US3, US4, US7, US8, US11, US15, US27 |
| **Estimated timeline** | 14 weeks (per plan.md) |

---

## Notes

- All `[P]` tasks operate on different files or independent data paths — no race conditions
- Each story phase has a **Checkpoint** — stop and validate independently before moving on
- Deferred stories (Canvas, Long-form, Publishing, Git, API, Feeds, Typing Rules, LaTeX, etc.) start after MVP release per post-MVP roadmap in `plan.md`
- Commit after each task or logical group; use `feat(US1):`, `feat(US2):`, etc. prefixes
- If Tauri IPC latency exceeds 16ms in Phase 12 benchmarks, consult risk mitigation in `plan.md` (Electron fallback option)
- Knowledge framework features (Johnny.Decimal, Zettelkasten, GraphRAG, Posner Workflow, Ontologies) are surfaced in vault templates (T035), the JDex note system (wired into `IndexService`), and the semantic connections layer (US27) — full implementation deferred to Phase 4 and Phase 8 per `plan.md` post-MVP roadmap
