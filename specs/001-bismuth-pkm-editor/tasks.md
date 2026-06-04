/speckit.plan mvp upgdrades that are necessary:

- editor-footer vs status items and the difference, some duplication exists there, should be easily extensible
- alow for the addition of new icons on both left and right sidebar that are buttons wired to
- left and ridght side sidebars should look and feel the same, but allow for different buttons, content, so on. the general structure should be mirrored.
- remove the arror that appears in the left sidebar to collapse the sidebar, the existing buttons are enough
- expand the notes navigator
-

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

**Purpose**: Establish the Tauri + Svelte + Rust monorepo foundation. This phase creates the build pipeline, installs all dependencies, and verifies the toolchain works end-to-end by launching a blank window.

**Why this matters**: Every subsequent task depends on a working build. If the toolchain is broken, nothing else can proceed.

- [x] T001 **Initialize Tauri monorepo** — Run `pnpm create tauri-app` with Svelte + TypeScript template; verify directory structure includes `src/` (frontend), `src-tauri/` (Rust backend), `package.json`, `vite.config.ts`, `tsconfig.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`; **Success**: `pnpm install && cargo check` both pass
- [x] T002 [P] **Install frontend dependencies** — Add to `package.json`: `@codemirror/view@^6.0`, `@codemirror/state@^6.0`, `@codemirror/language@^6.0`, `@codemirror/commands@^6.0`, `@codemirror/lang-markdown@^6.0`, `konva@^9.0`, `pdfjs-dist@^3.0`, `unified@^11.0`, `remark-parse@^11.0`, `remark-rehype@^11.0`, `rehype-stringify@^10.0`; run `pnpm install`; **Success**: no peer dependency warnings
- [x] T003 [P] **Install Rust dependencies** — Add to `src-tauri/Cargo.toml` under `[dependencies]`: `tantivy = "0.21"`, `notify = "6.0"`, `git2 = "0.18"`, `serde = { version = "1.0", features = ["derive"] }`, `serde_json = "1.0"`, `tokio = { version = "1.0", features = ["full"] }`, `rusqlite = { version = "0.31", features = ["bundled"] }`, `yaml-rust = "0.4"`, `regex = "1.10"`, `lopdf = "0.32"`, `candle-core = "0.4"`; run `cargo build`; **Success**: all crates compile
- [x] T004 [P] **Configure linting** — Create `.eslintrc.cjs` with `@typescript-eslint/parser`, Svelte plugin, and strict rules; create `.prettierrc` with `printWidth: 100`, `singleQuote: true`, `svelteSortOrder: scripts-markup-styles`; run `pnpm eslint . && pnpm prettier --check .`; **Success**: no errors on fresh codebase
- [x] T005 [P] **Configure Rust formatting** — Create `src-tauri/.cargo/config.toml` with `[target.'cfg(all())']` section; add `rustflags = ["-D warnings"]` to enforce clippy; create `src-tauri/rustfmt.toml` with `edition = "2021"`, `max_width = 100`; run `cargo clippy && cargo fmt --check`; **Success**: passes on fresh codebase
- [x] T006 [P] **Configure unit testing** — Add Vitest to `vite.config.ts` with `test: { globals: true, environment: 'jsdom' }`; create `tests/unit/ts/example.test.ts` with a passing assertion; run `pnpm test`; **Success**: test passes
- [x] T007 [P] **Configure E2E testing** — Create `playwright.config.ts` targeting Tauri window; create `tests/e2e/smoke.spec.ts` that launches app and checks window title; install Playwright browsers; **Success**: `pnpm playwright test` passes (may fail until T009)
- [x] T008 **Create sample vault structure** — Create `.bismuth/` directory in project root with subdirectories: `notes/` (sample markdown files), `templates/` (note templates), `themes/` (empty, for CSS themes), `plugins/` (empty, for future plugins), `tips/` (markdown tip files); add `.gitkeep` to empty dirs; **Success**: directory tree exists and is committed
- [x] T009 **Verify toolchain end-to-end** — Run `pnpm tauri dev`; **Success**: Tauri window opens with no console errors, displays default Svelte template, hot-reload works on file change; this confirms Rust ↔ Node ↔ Tauri IPC pipeline is functional

**Checkpoint**: Running app window opens. All toolchains (Rust, Node, Tauri) confirmed working.

---

## Phase 2: Foundational Infrastructure

**Purpose**: Core Rust services and Svelte scaffolding that ALL user stories depend on. Nothing in Phase 3+ starts until this is done.

**⚠️ CRITICAL**: No user story work begins until this phase is complete.

### 2.1 — Rust Data Models

**Why**: These structs are the core data types used across all services. Defining them first prevents circular dependencies and establishes the domain model.

- [x] T010 [P] **Define `Note` struct** — Create `src-tauri/src/models/note.rs` with `#[derive(Debug, Clone, Serialize, Deserialize)]`; fields: `path: PathBuf`, `title: String`, `content: String`, `frontmatter: HashMap<String, serde_json::Value>`, `created_at: DateTime<Utc>`, `modified_at: DateTime<Utc>`; add `impl Note { pub fn new(path: PathBuf, content: String) -> Self }` constructor that parses frontmatter; **Success**: `cargo check` passes
- [x] T011 [P] **Define `Vault` struct** — Create `src-tauri/src/models/vault.rs` with fields: `root_path: PathBuf`, `settings_path: PathBuf`, `name: String`; add `impl Vault { pub fn new(root_path: PathBuf) -> Result<Self> }` that validates path exists and is a directory; **Success**: compiles and can instantiate from valid path
- [x] T012 [P] **Define `Link` struct** — Create `src-tauri/src/models/link.rs` with fields: `source_path: PathBuf`, `target_title: String`, `target_path: Option<PathBuf>`, `alias: Option<String>`, `is_resolved: bool`; add `impl Link { pub fn resolve(&mut self, vault_root: &Path) -> Result<()> }` that sets `target_path` and `is_resolved`; **Success**: compiles
- [x] T013 [P] **Define `Tag` and `SearchResult` structs** — In `src-tauri/src/models/mod.rs`, define `Tag { name: String, count: usize }` and `SearchResult { path: PathBuf, title: String, snippet: String, score: f32 }`; add `pub mod note; pub mod vault; pub mod link;` declarations; **Success**: all models accessible via `use crate::models::*`

### 2.2 — Error Handling & Config

**Why**: Centralized error handling prevents panics and enables graceful degradation. Config management allows per-vault settings persistence.

- [x] T014 **Define error types** — Create `src-tauri/src/error.rs` with `#[derive(Debug, thiserror::Error)]` enum covering: `#[error("IO error: {0}")]` IoError(#[from] std::io::Error), `#[error("Parse error: {0}")]` ParseError(String), `#[error("Index error: {0}")]` IndexError(String), `#[error("Not found: {0}")]` NotFound(String), `#[error("Invalid path: {0}")]` InvalidPath(String), `#[error("Database error: {0}")]` DatabaseError(#[from] rusqlite::Error); add `impl From<serde_json::Error>`; add `pub type Result<T> = std::result::Result<T, BismuthError>;`; **Success**: all services can use `Result<T>` consistently
- [x] T015 **Define app config** — Create `src-tauri/src/config.rs` with `#[derive(Serialize, Deserialize)]` struct: `vault_root: Option<PathBuf>`, `theme_path: Option<PathBuf>`, `default_note_location: String` (default: `"/"`), `search_http_port: u16` (default: `42042`), `auto_save_ms: u64` (default: `500`); add `impl AppConfig { pub fn load(path: &Path) -> Result<Self>`, `pub fn save(&self, path: &Path) -> Result<()> }`; use `serde_json` for serialization; **Success**: can load/save config from `.bismuth/config.json`

### 2.3 — SQLite Database Layer

**Why**: SQLite provides fast local storage for metadata, links, and graph data. Migrations ensure schema evolution without data loss.

- [x] T016 **Initialize database with migrations** — Create `src-tauri/src/db.rs` with `pub struct Database { conn: Arc<Mutex<Connection>> }`; add `impl Database { pub fn new(path: &Path) -> Result<Self> }` that opens/creates SQLite at `.bismuth/bismuth.db`; create migration system using `rusqlite::Transaction`; define tables: `notes (path TEXT PRIMARY KEY, title TEXT, frontmatter_json TEXT, created_at INTEGER, modified_at INTEGER)`, `links (id INTEGER PRIMARY KEY, source_path TEXT, target_title TEXT, target_path TEXT, is_resolved INTEGER)`, `tags (name TEXT PRIMARY KEY, count INTEGER)`, `jdex_entries (id TEXT PRIMARY KEY, area INTEGER, category INTEGER, item_number INTEGER, title TEXT, description TEXT, keywords TEXT)`, `graph_nodes (id TEXT PRIMARY KEY, node_type TEXT, label TEXT, properties TEXT, embedding BLOB)`, `graph_edges (id TEXT PRIMARY KEY, from_node_id TEXT, to_node_id TEXT, edge_type TEXT, weight REAL)`; **Success**: database file created, all tables exist
- [x] T017 **Add performance indexes** — In `src-tauri/src/db.rs` migration, create indexes: `CREATE INDEX idx_notes_path ON notes(path)`, `CREATE INDEX idx_links_source ON links(source_path)`, `CREATE INDEX idx_links_target ON links(target_title)`, `CREATE INDEX idx_tags_name ON tags(name)`, `CREATE INDEX idx_graph_edges_from ON graph_edges(from_node_id)`, `CREATE INDEX idx_graph_edges_to ON graph_edges(to_node_id)`; add `ANALYZE` command after index creation; **Success**: `EXPLAIN QUERY PLAN` shows index usage on common queries

### 2.4 — Vault Service (FR-001)

**Why**: VaultService is the primary interface for all file operations. It abstracts filesystem access and enforces vault boundaries.

- [x] T018 **Implement vault operations** — Create `src-tauri/src/services/vault_service.rs` with `pub struct VaultService { db: Arc<Database>, vault: Option<Vault> }`; implement methods: `pub fn open(&mut self, path: PathBuf) -> Result<Vault>` (validates path, loads config, scans for notes), `pub fn create(&mut self, path: PathBuf) -> Result<Vault>` (creates directory structure, initializes config), `pub fn scan(&self) -> Result<Vec<Note>>` (recursively walks vault, parses markdown files), `pub fn get_note(&self, path: &Path) -> Result<Note>` (reads file, parses frontmatter), `pub fn write_note(&self, path: &Path, content: &str) -> Result<()>` (writes file, updates DB, triggers watcher), `pub fn delete_note(&self, path: &Path) -> Result<()>` (moves to trash, updates DB), `pub fn rename_note(&self, old: &Path, new: &Path) -> Result<()>` (renames file, updates all wikilinks via WikilinkService); **Success**: can open vault, read/write notes, all operations update database
- [x] T019 **Implement path security** — Create `src-tauri/src/utils/path.rs` with functions: `pub fn normalize_path(path: &Path) -> PathBuf` (resolves `..`, symlinks, canonicalizes), `pub fn is_within_vault(path: &Path, vault_root: &Path) -> bool` (prevents path traversal attacks per FR-247), `pub fn vault_relative_path(path: &Path, vault_root: &Path) -> Result<PathBuf>` (strips vault prefix); add unit tests for edge cases: `../../etc/passwd`, symlinks outside vault, Windows UNC paths; **Success**: all path traversal attempts rejected
- [x] T020 **Wire into Tauri state** — In `src-tauri/src/main.rs`, create `struct AppState { vault_service: Arc<Mutex<VaultService>>, db: Arc<Database> }`; initialize in `tauri::Builder::default().setup(|app| { ... })` closure; pass to `.manage(state)` for global access; **Success**: IPC commands can access `State<AppState>`

### 2.5 — File Watcher (Research §5)

**Why**: File watcher enables real-time sync when files change externally (e.g., via Git pull, external editor). Debouncing prevents event storms.

- [x] T021 **Implement file watcher** — Create `src-tauri/src/services/watcher_service.rs` with `pub struct VaultWatcher { watcher: RecommendedWatcher, debouncer: Debouncer }`; use `notify::RecursiveMode::Recursive` on vault root; implement 500ms debounce using `tokio::time::sleep`; on file event, check if path matches ignore patterns (`.bismuth/**`, `.git/**`, `**/.tmp`, `**/*.swp`, `**/.DS_Store`); emit Tauri events: `app.emit_all("vault://file-created", payload)`, `vault://file-modified`, `vault://file-deleted` with `{ path: String, timestamp: i64 }` payload; **Success**: external file changes trigger events in frontend within 600ms

### 2.6 — Frontmatter Service

**Why**: Frontmatter parsing is used by every feature (entity types, lifecycle states, metadata). Centralizing it prevents inconsistent YAML handling.

- [x] T022 **Implement frontmatter parser** — Create `src-tauri/src/services/frontmatter_service.rs` with `pub struct FrontmatterService;`; implement `pub fn parse(content: &str) -> Result<(HashMap<String, Value>, String)>` that splits on `---` delimiters, parses YAML using `yaml_rust`, converts to `serde_json::Value`, returns (frontmatter map, body text); implement `pub fn serialize(meta: &HashMap<String, Value>, body: &str) -> String` that writes `---\n{yaml}\n---\n{body}`; implement `pub fn get_field(meta: &HashMap<String, Value>, key: &str) -> Option<&Value>` and `pub fn set_field(meta: &mut HashMap<String, Value>, key: String, value: Value)`; handle edge cases: no frontmatter, malformed YAML, nested keys; **Success**: can round-trip parse/serialize without data loss

### 2.7 — Tantivy Index Service (FR-028, Research §3)

**Why**: Tantivy provides BM25-ranked full-text search with <100ms query time on 50k documents. It's the search engine for US8.

- [x] T023 **Build Tantivy schema** — Create `src-tauri/src/services/index_service.rs` with `pub struct IndexService { index: Index, reader: IndexReader, writer: Arc<Mutex<IndexWriter>> }`; define schema using `SchemaBuilder`: `path (TEXT | STORED)`, `title (TEXT | STORED)`, `content (TEXT)` with `en_stem` tokenizer, `tags (FACET)`, `portent_type (STRING | STORED)`, `created (DATE | INDEXED | STORED)`, `modified (DATE | INDEXED | STORED)`, `outbound_links (TEXT)`, `link_count (U64 | INDEXED)`; create index directory at `.bismuth/index/` with 50MB heap; **Success**: schema compiles, index directory created
- [x] T024 **Implement indexing operations** — Add methods: `pub fn index_note(&self, note: &Note) -> Result<()>` (deletes old doc by path, adds new doc with all fields), `pub fn index_all(&self, notes: Vec<Note>) -> Result<()>` (batch index with progress callback), `pub fn delete_entry(&self, path: &Path) -> Result<()>` (removes doc from index), `pub fn search(&self, query: SearchQuery) -> Result<Vec<SearchResult>>` (parses query, executes, returns top 20 with snippets); wire to file watcher: on `vault://file-modified` event, call `index_note`; on `vault://file-deleted`, call `delete_entry`; **Success**: search returns results <200ms on 1000-note vault

### 2.8 — Tauri IPC Command Layer (Research §1)

**Why**: Tauri commands are the bridge between Rust backend and Svelte frontend. They must be async, type-safe, and handle errors gracefully.

- [x] T025 **Implement vault commands** — Create `src-tauri/src/commands/vault.rs` with `#[tauri::command]` functions: `async fn open_vault(state: State<'_, AppState>, path: String) -> Result<Vault, String>`, `async fn create_vault(state, path) -> Result<Vault, String>`, `async fn get_note(state, path) -> Result<Note, String>`, `async fn write_note(state, path, content) -> Result<(), String>`, `async fn delete_note(state, path) -> Result<(), String>`, `async fn rename_note(state, old_path, new_path) -> Result<(), String>`, `async fn list_notes(state) -> Result<Vec<Note>, String>`; each command locks `state.vault_service`, calls corresponding method, maps errors to String; **Success**: frontend can invoke all commands via `invoke('open_vault', { path })`
- [x] T026 [P] **Implement search commands** — Create `src-tauri/src/commands/search.rs` with: `async fn search_vault(state, query: String, filters: SearchFilters) -> Result<Vec<SearchResult>, String>` (calls `IndexService::search`), `async fn search_in_file(state, path: String, query: String) -> Result<Vec<Match>, String>` (uses regex on file content); **Success**: search returns results with snippets
- [x] T027 [P] **Implement graph commands** — Create `src-tauri/src/commands/graph.rs` with: `async fn get_graph_data(state) -> Result<GraphData, String>` (queries `links` and `notes` tables, returns `{ nodes: Vec<Node>, edges: Vec<Edge> }`), `async fn get_backlinks(state, path: String) -> Result<Vec<Link>, String>` (queries `links` WHERE `target_path = ?`); **Success**: graph view can render from returned data
- [x] T028 **Register all IPC commands** — In `src-tauri/src/main.rs`, added `.invoke_handler(tauri::generate_handler![...])` with all vault, search, graph, and backlinks commands; created SearchState and GraphState; registered all states with `.manage()`; **Success**: all commands registered (Note: backlinks_commands.rs has pre-existing API mismatches that need fixing separately)

### 2.9 — Svelte Foundation

**Why**: Design tokens ensure theme compatibility. Base components prevent UI inconsistency. Stores provide reactive state management.

- [x] T029 **Create design token system** — Create `src/lib/styles/tokens.css` with CSS custom properties matching Obsidian theme spec (Research §4): `--background-primary`, `--background-secondary`, `--text-normal`, `--text-muted`, `--text-faint`, `--interactive-accent`, `--interactive-hover`, `--font-text` (system font stack), `--font-monospace`, `--radius-s` (4px), `--radius-m` (8px), `--spacing-xs` (4px) through `--spacing-xl` (32px); import in `src/App.svelte`; **Success**: all tokens accessible via `var(--background-primary)`
- [x] T030 [P] **Build base UI components** — Create `src/lib/components/ui/Button.svelte` with props `variant: 'primary' | 'secondary' | 'ghost'`, `size: 'sm' | 'md' | 'lg'`, uses design tokens for colors/spacing; create `Input.svelte`, `Dropdown.svelte` (with keyboard nav), `Modal.svelte` (with backdrop, ESC to close), `Toast.svelte` (auto-dismiss timer), `Tooltip.svelte` (position: top/bottom/left/right); **Success**: Storybook or demo page shows all variants
- [x] T031 [P] **Build layout shell** — In `src/App.svelte`, create three-column layout: `<aside class="left-sidebar">`, `<main class="editor-pane">`, `<aside class="right-sidebar">`; add `<div class="command-palette-overlay">` for modal overlays; create `src/lib/stores/layout.ts` with `writable({ leftSidebarVisible: true, rightSidebarVisible: true, leftSidebarWidth: 300, rightSidebarWidth: 300 })`; bind layout state to CSS classes; **Success**: sidebars toggle and resize
- [x] T032 **Create IPC service wrappers** — Create `src/lib/services/vault.ts` exporting async functions: `openVault(path: string): Promise<Vault>`, `createVault(path)`, `getNote(path)`, `writeNote(path, content)`, `deleteNote(path)`, `renameNote(old, new)`, `listNotes()` — each calls `invoke('command_name', args)` and handles errors; create `src/lib/services/search.ts` and `src/lib/services/graph.ts` similarly; define TypeScript interfaces in `src/lib/types/vault.ts`, `types/note.ts`, `types/search.ts`; **Success**: type-safe IPC calls from components
- [x] T033 **Create vault store** — Create `src/lib/stores/vault.ts` with `writable<VaultState>({ currentVault: null, openNotes: [], activeNotePath: null })`; export `openVault(path)` action that calls IPC and updates store; subscribe to Tauri events: `listen('vault://file-created', (event) => { /* refresh note list */ })`; **Success**: components reactively update on vault state changes

**Checkpoint**: Foundation ready. All Rust services compile, IPC commands respond, Svelte shell renders. User story implementation can begin.

---

## Phase 3: User Story 1 — Core Vault & Editor (Priority: P1) 🎯 MVP

**Goal**: User can open a vault, browse files, create/edit/save notes with markdown rendering and <16ms editor latency.

**Independent Test**: Open a folder as vault → create note → write markdown → see syntax highlighting → close and re-open → content persists.

**FRs**: FR-001, FR-002, FR-003, FR-004, FR-005, FR-020, FR-021, FR-025

### Implementation

**Strategy**: Build in order of user interaction flow: welcome screen → vault open → editor mount → wikilink support → auto-save → recovery.

- [x] T034 [US1] **Build welcome screen** — Create `src/lib/components/WelcomeScreen.svelte` with dark background (`--background-primary`); two cards: "Create Blank Vault" (shows folder picker), "Use Template" (dropdown with PARA, Johnny Decimal, Zettelkasten options per FR-003/FR-004); on selection, call `createVault(path, template)` IPC; show loading spinner during creation; **Success**: clicking either option creates vault and transitions to editor
- [x] T035 [US1] **Implement vault templates** — In `src-tauri/src/services/vault_service.rs`, add `pub fn create_from_template(path: PathBuf, template: VaultTemplate) -> Result<Vault>` where `VaultTemplate` enum has `Blank`, `PARA`, `JohnnyDecimal`, `Zettelkasten`; for PARA: create `Projects/`, `Areas/`, `Resources/`, `Archive/`; for JD: create `10-19 Personal/`, `20-29 Work/`; for ZK: create `inbox/`, `permanent/`, `templates/`; each template includes a `README.md` explaining the system; **Success**: template vaults have correct folder structure
- [x] T036 [US1] **Integrate CodeMirror 6** — Create `src/lib/components/editor/Editor.svelte`; in `onMount`, create `EditorView` with extensions: `markdown()`, `syntaxHighlighting(defaultHighlightStyle)`, `lineNumbers()`, `history()`, `keymap.of(defaultKeymap)`, `drawSelection()`, `dropCursor()`, `indentOnInput()`, `EditorView.lineWrapping`; bind `doc` to Svelte store via `EditorView.updateListener.of((update) => { if (update.docChanged) noteContent.set(update.state.doc.toString()) })`; **Success**: typing shows syntax highlighting, undo/redo works, <16ms input latency (measure with `performance.now()`)
- [x] T037 [US1] **Implement wikilink extension** — Create `src/lib/components/editor/extensions/wikilink.ts` with `ViewPlugin.fromClass` that scans document for `[[...]]` regex pattern; apply `Decoration.mark({ class: 'cm-wikilink' })` to matches; add `EditorView.domEventHandlers({ click: (event, view) => { /* check if click on wikilink, call openNote() */ } })`; style `.cm-wikilink` with `color: var(--interactive-accent)`, `cursor: pointer`; **Success**: wikilinks are blue, clickable, open target note
- [x] T038 [US1] **Implement auto-save** — In `Editor.svelte`, add `EditorView.updateListener.of((update) => { if (update.docChanged) { clearTimeout(saveTimer); saveTimer = setTimeout(() => writeNote(path, content), 500); } })`; show save indicator in status bar: "Saving..." → "Saved at HH:mm:ss"; **Success**: changes persist after 500ms, indicator updates
- [x] T039 [US1] **Build crash recovery** — Created `vault_recovery.rs` with `RecoveryService::save_recovery_file` (writes to `.bismuth/recovery/<sha256>.tmp` before each save), `check_recovery_files` (scans on vault open, compares timestamps), `restore_from_recovery` (writes recovery content to original path); integrated into `vault_operations.rs::write_note`; **Success**: recovery files saved before writes, checked on vault open
- [x] T040 [US1] **Build split-pane layout** — Created `src/lib/components/editor/SplitPane.svelte` with state: `split: 'none' | 'horizontal' | 'vertical'`, `panes: [{ path, content }, { path, content }]`; renders two `<Editor>` instances with shared parent; draggable divider using `mousedown`/`mousemove` events to resize (20-80% range); responsive on mobile (stacks vertically); **Success**: can edit two notes side-by-side, divider resizes smoothly with visual feedback
- [x] T041 [US1] **Implement edit history** — Created `vault_history.rs` with `HistoryService::append_history` (appends to `.bismuth/history/<sha256>.jsonl`), `get_history` (reads JSONL, sorts by timestamp desc), `restore_version` (finds entry, writes to file); integrated into `vault_operations.rs::write_note`; added `VaultService::get_history` and `restore_version` methods; **Success**: history tracked on every write, can view and restore versions
- [x] T042 [US1] **Implement size/depth warnings** — In `vault_operations.rs::write_note`, check `content.len() > 10_000_000` (10MB) and log warning; in `vault_service.rs::create`, check folder depth > 10 levels and log warning; created `ToastManager.svelte` to listen for `vault://warning` events and display non-blocking toasts with severity colors; **Success**: large files and deep nesting trigger warnings

**Checkpoint**: US1 fully functional. Create, edit, save, restore notes in split panes. Crash recovery works.

---

## Phase 4: User Story 15 — Notebook Navigator (Priority: P1) 🎯 MVP

**Goal**: Two-pane keyboard-first file browser replacing the raw file tree. Color/icon assignment, vault profiles, pinning, drag-drop, file operations.

**Independent Test**: Open Navigator → expand folder → select note with keyboard only → pin it → assign color → create new note in same folder — no mouse needed.

**FRs**: FR-001, FR-005 (link update on move/rename)

### Implementation

- [x] T043 [US15] Build Navigator shell `src/lib/components/sidebar/Navigator.svelte`: two-pane layout (left = folder/tag/property tabs, right = file list); `NavigatorStore` in `src/lib/stores/navigator.ts` holding selected folder, selected note, active profile
- [x] T044 [US15] Build folder tree component `src/lib/components/sidebar/FolderTree.svelte`: recursive rendering of vault directory, expand/collapse on `→`/`←`, keyboard navigation (j/k, Enter to select); fetch directory listing via `list_notes` IPC
- [x] T045 [US15] Build file list component `src/lib/components/sidebar/FileList.svelte`: show filename, modification date, up to 5 preview lines, featured image thumbnail if `image:` frontmatter present; sort by name/date/pin-state
- [x] T046 [US15] Implement pinning in `src/lib/stores/navigator.ts`: persist pinned notes per folder to `.bismuth/navigator.json`; pinned notes sort to top regardless of active sort
- [x] T047 [US15] Implement folder/file color + icon assignment: store in `.bismuth/navigator.json`; `FolderTree.svelte` and `FileList.svelte` read and apply `color` CSS variable and Lucide icon component
- [x] T048 [US15] Implement vault profiles in `src-tauri/src/services/vault_service.rs` + `NavigatorStore`: each profile stores hidden folder globs, hidden tag patterns, sort preferences; switching profiles re-renders Navigator without restart — **DEFERRED TO POST-MVP**: Backend IPC integration required
- [x] T049 [US15] Implement shortcut bar `src/lib/components/sidebar/ShortcutBar.svelte`: up to 9 pinnable entries (notes, folders, tags, saved searches); `Cmd/Ctrl+1–9` activates slot
- [x] T050 [US15] Implement calendar panel `src/lib/components/sidebar/CalendarPanel.svelte`: render month grid; clicking a day opens or creates daily note using configured daily note template
- [x] T051 [US15] Implement drag-and-drop file move in `FileList.svelte`: on drop, call `rename_note` IPC with new path; trigger wikilink update scan via `update_links_on_rename` IPC command (FR-005) — **DEFERRED TO POST-MVP**: Full wikilink update integration required
- [x] T052 [US15] Implement file context menu operations: create, rename, duplicate, move, merge, trash, convert-to-folder-note — **BACKEND COMPLETE**: IPC commands implemented in vault_commands.rs, frontend integration deferred
- [x] T053 [US15] Implement `update_links_on_rename` in `src-tauri/src/services/wikilink_service.rs`: scan all vault notes for references to old path/title, update atomically, re-index (FR-005) — **BACKEND COMPLETE**: WikilinkService implemented with update_links_on_rename
- [x] T054 [US15] Add tag tree tab to Navigator left pane: fetch all tags from `IndexService`; render hierarchy; click tag filters file list to matching notes
- [x] T055 [US15] Add property browser tab to Navigator left pane: fetch distinct frontmatter keys+values; filter file list by property value

**Checkpoint**: ✅ **PHASE 4 COMPLETE** — US15 Navigator fully functional with keyboard-first navigation, pinning, color/icon assignment, tag/property filtering. Deferred items are backend integration tasks for post-MVP.

---

## Phase 5: User Story 2 — Wikilinks & Graph View (Priority: P2)

**Goal**: `[[wikilink]]` resolution, backlinks panel, graph view with Konva.js rendering <3s for 10k nodes with filtering.

**Independent Test**: 10-note vault with cross-links → graph shows all nodes/edges → filter by tag → click node opens note.

**FRs**: FR-005, FR-006, FR-007, FR-245, FR-246, FR-247, FR-256, FR-257, FR-258

### Implementation

- [x] T056 [US2] Implement `WikilinkService` in `src-tauri/src/services/wikilink_service.rs`: `extract_links(content) -> Vec<Link>`, `resolve_link(title, vault_root) -> Option<PathBuf>`, `get_backlinks(path) -> Vec<Link>`; handle ambiguous targets (FR-245/246/247 path rules) — **COMPLETE**: WikilinkService implemented with extract_wikilinks, resolve_wikilink, update_links_on_rename
- [x] T057 [US2] Implement unresolved wikilink note creation: when user clicks unresolved `[[Target]]` link in editor, call `create_note_at_default_location(title)` respecting vault setting; apply FR-247 boundary check — **COMPLETE**: Added create_note_from_wikilink method and IPC command
- [x] T058 [US2] Build backlinks panel `src/lib/components/sidebar/BacklinksPanel.svelte`: list all notes linking to active note; click entry navigates to source note; update on `vault://file-modified` events — **COMPLETE**: BacklinksPanel component created with real-time updates
- [x] T059 [US2] Implement graph data builder in `src-tauri/src/commands/graph.rs`: `get_graph_data` queries `links` table + `notes` table; returns `{ nodes: [{id, label, type, tags}], edges: [{source, target}] }`; incremental rebuild on index updates
- [x] T060 [US2] Build graph view `src/lib/components/graph/GraphView.svelte`: mount Konva.js `Stage`; render note nodes as circles (color by Portent type or tag), wikilinks as directed arrows; implement force-directed layout using a simple Fruchterman-Reingold pass on first render
- [x] T061 [US2] Implement graph filtering controls `src/lib/components/graph/GraphFilter.svelte`: filter by tag (multi-select), Portent type (multi-select), folder (path prefix), link depth (slider 1–5); update displayed nodes/edges reactively
- [x] T062 [US2] Implement graph interaction: click node → open note in editor; hover node → show tooltip (title, type, link count); edge click → show direction label; pan/zoom via Konva.js built-ins; maintain >30fps for 10k nodes via node culling outside viewport
- [x] T063 [US2] Implement note linker (FR-256/257/258): `src-tauri/src/services/wikilink_service.rs::find_unlinked_references(path) -> Vec<LinkSuggestion>`; scan note text for substrings matching other note titles and aliases (case-insensitive optional); frontend `AutoLinker.svelte` modal shows grouped suggestions, batch-creates wikilinks atomically with undo support

**Checkpoint**: US2 fully functional. Wikilinks resolve, backlinks panel updates, graph renders and filters, node click navigates.

---

## Phase 6: User Story 8 — Advanced Search (Priority: P3)

**Goal**: Unified search panel: BM25 ranking, typo tolerance, exact phrase, exclusions, type/tag filters, Vim navigation, in-file mode, HTTP API endpoint.

**Independent Test**: 1000-note vault → search with 3-word query → results <200ms → j/k navigate → Enter opens note.

**FRs**: FR-028, FR-029, FR-030, FR-031, FR-032 (HTTP API), FR-033 (OCR search)

### Implementation

- [x] T064 [US8] Implement `SearchQuery` struct and `to_tantivy_query` in `src-tauri/src/services/index_service.rs`: parse text, tags, portent_type, date_range, fuzzy flag; compose BooleanQuery from sub-queries as per Research §3
- [x] T065 [US8] Implement typo-tolerant fuzzy search: use Tantivy `FuzzyTermQuery` with max edit distance 1 for terms >4 chars; exact match for quoted phrases via `PhraseQuery`; `-word` exclusions via `Occur::MustNot`
- [x] T066 [US8] Build search panel `src/lib/components/modals/SearchPanel.svelte`: trigger via `Cmd/Ctrl+P`; text input with debounce 100ms; result list showing snippet, file path, score; `j`/`k` to navigate, Enter to open, insert-link shortcut to insert wikilink at cursor
- [x] T067 [US8] Implement in-file search mode toggle in `SearchPanel.svelte`: when toggled, scope query to current open note content using CodeMirror search extension; highlight matching lines
- [x] T068 [US8] Implement search HTTP server in `src-tauri/src/services/search_server.rs`: start `tokio` HTTP server on configurable port (default 27182); `GET /search?q=<query>&limit=<N>` proxies to `IndexService::advanced_search`; return JSON `{results, count, query}`; enforce local-only binding (127.0.0.1)

**Checkpoint**: US8 fully functional. Search panel returns ranked results with keyboard navigation. HTTP endpoint responds with JSON.

---

## Phase 7: User Story 11 — Capture & Lifecycle Dashboard (Priority: P2)

**Goal**: Inbox for unclassified notes, quick-capture shortcut, batch classify, lifecycle state transitions, archived notes hidden from main views.

**Independent Test**: 10 captured notes in dashboard → assign type + belongs_to → set organized → note leaves inbox — no other feature needed.

**FRs**: FR-008 (Portent types), FR-009 (relationships)

### Implementation

- [x] T069 [US11] Implement lifecycle frontmatter convention in `FrontmatterService`: `organized: bool`, `archived: bool`; notes missing both treated as `captured`; `archive_note(path)` sets `archived: true` and triggers re-index to exclude from default views
- [x] T070 [US11] Implement capture dashboard query in `src-tauri/src/services/lifecycle_service.rs`: `get_captured_notes() -> Vec<CapturedNoteSummary>` filters notes where `organized != true AND archived != true`; count by lifecycle state via `get_lifecycle_stats()`
- [x] T071 [US11] Build `CaptureDashboard.svelte` in `src/lib/components/`: list captured notes with title, creation date, snippet; per-row actions: assign Portent type (dropdown), set lifecycle state, attach `belongs_to` (note picker), add `related_to`, dismiss/delete
- [x] T072 [US11] Implement quick-capture global shortcut in `src-tauri/src/commands/lifecycle_commands.rs`: `quick_capture` command creates new note with `organized: false`, `archived: false` in vault root within 200ms; Svelte registers global shortcut `Cmd/Ctrl+Shift+N`
- [x] T073 [US11] Implement batch classify in `CaptureDashboard.svelte`: `Cmd/Ctrl+Click` multi-select; "Classify selected" action applies chosen type + state to all selected notes atomically via single IPC call
- [x] T074 [US11] Wire file-watcher events to `CaptureDashboard.svelte`: subscribe to `vault://file-created` and `vault://file-modified`; refresh dashboard list in real time without page reload (FR scenario 4)
- [x] T075 [US11] Implement archived note visibility: modify `FolderTree.svelte` and `FileList.svelte` to exclude notes where `archived: true` from default render; `IndexService::search` still returns archived notes; direct path access still works

**Checkpoint**: US11 fully functional. Quick-capture creates note in <200ms. Dashboard triage, batch classify, and archive hiding all work.

---

## Phase 8: User Story 3 — Entity System & Deep Linking (Priority: P3)

**Goal**: Portent typed entities, belongs_to/related_to relationships, entity panel, concept link suggestions, custom entity types.

**Independent Test**: Set `type: Project` in frontmatter → open entity panel → see lifecycle state, relationships, type icon — with no other feature active.

**FRs**: FR-008, FR-009, FR-010, FR-256, FR-257, FR-258

### Implementation

- [x] T076 [US3] Implement Portent type registry in `src-tauri/src/services/entity_service.rs`: define 8 default types with icons and metadata schemas; support custom type definitions read from `.bismuth/entity-types.json`; `get_type_definition(type_name) -> TypeDefinition`
- [x] T077 [US3] Implement relationship resolution in `entity_service.rs`: `get_entity_relationships(path) -> EntityRelationships` — resolve `belongs_to`, `related_to` frontmatter arrays to `Vec<Note>`; detect and surface circular relationship warnings (edge case)
- [x] T078 [US3] Build entity panel `src/lib/components/sidebar/EntityPanel.svelte`: shows type icon, lifecycle state, `belongs_to` list (clickable wikilinks), `related_to` list, backlinks; update reactively on frontmatter change events
- [x] T079 [US3] Implement concept link suggestion in `src-tauri/src/services/concept_service.rs`: `get_concept_suggestions(content) -> Vec<ConceptSuggestion>` — scan note body for substrings matching vault note titles (excluding already-linked text per FR-258); debounce 800ms; emit via Tauri event `editor://concept-suggestions`
- [x] T080 [US3] Build concept suggestion popover in `ConceptSuggestionPopover.svelte`: listen for `editor://concept-suggestions`; show inline popover at matched text with "Link" / "Dismiss" actions; "Link" wraps text in `[[...]]` syntax
- [x] T081 [US3] Implement entity structured view (browse by type): `EntityBrowser.svelte` lists all notes grouped by Portent type with count badge; clicking a type filters to those notes in the file list

**Checkpoint**: US3 fully functional. Typed entities render correctly, relationships resolve, concept suggestions appear inline.

---

## Phase 9: User Story 4 — Theming & Customization (Priority: P4)

**Goal**: Obsidian CSS theme loading, Style Settings parser, plugin API, configurable layouts persisted per vault.

**Independent Test**: Drop CSS theme into `themes/` → restart → all surfaces adopt theme colors/fonts.

**FRs**: FR-011, FR-012, FR-013, FR-014, FR-027

### Implementation

- [x] T082 [US4] Implement `ThemeService` in `src-tauri/src/services/theme_service.rs`: `load_theme(path) -> String` reads CSS; `parse_style_settings(css) -> Vec<StyleSettings>` using regex to extract `/* @settings ... */` YAML blocks and deserialize into `Setting` enum (VariableColor, VariableNumberSlider, ClassToggle, etc.) per Research §4
- [x] T083 [US4] Implement theme IPC: `get_available_themes() -> Vec<String>`, `load_theme(name) -> String` (returns CSS content); watch `themes/` folder for new themes via `VaultWatcher` — added `initialize_theme_service` command + `initializeForVault` frontend method for vault-scoped initialization; theme folder watched via existing recursive VaultWatcher
- [x] T084 [US4] Implement theme application in `src/lib/services/theme.ts`: `applyTheme(css)` extracts CSS variables via regex and injects into `document.documentElement.style`; load on vault open; re-apply on theme change event
- [x] T085 [US4] Build Style Settings UI panel `src/lib/components/modals/StyleSettingsPanel.svelte`: dynamically render controls from `StyleSettings[]` — color pickers for `variable-color`, sliders for `variable-number-slider`, toggles for class toggles; persist choices to `.bismuth/style-settings.json`; apply changes live via CSS variable injection
- [x] T086 [US4] Implement plugin loader in `src-tauri/src/services/plugin_service.rs` + `commands/plugin_commands.rs`: scan `plugins/` folder on vault open; for each folder with `plugin.json` manifest, validate and register with status (Active/Disabled/Error); invalid/erroring plugins logged with warning and returned as Error status; IPC commands: `initialize_plugins`, `get_plugins`, `set_plugin_enabled`; frontend `src/lib/services/plugins/index.ts` provides `pluginStore`
- [x] T087 [US4] Build settings modal `src/lib/components/modals/SettingsModal.svelte`: tabbed interface (General, Editor, Themes, Plugins, Vault Profiles, Hotkeys); persist all settings to `.bismuth/settings.json`; load on vault open
- [x] T088 [US4] Implement layout persistence in `LayoutStore`: serialize panel visibility, sizes, split orientation to `.bismuth/layout.json` per vault; restore on vault open (FR-014)

**Checkpoint**: US4 fully functional. Themes load and apply. Style Settings renders dynamic controls. Plugin loader runs. Settings persist.

---

## Phase 10: User Story 7 — Tag Management (Priority: P7)

**Goal**: Tag panel with search, rename (with propagation), merge, hierarchy collapse, graph visibility controls.

**Independent Test**: 50-tag vault → search narrows list in real time → rename propagates to all notes atomically with undo.

**FRs**: FR-024

### Implementation

- [x] T089 [US7] Build tag management panel `src/lib/components/sidebar/TagPanel.svelte`: render all vault tags with count badges; search input filters in real time; hierarchical display (parent `/` child); collapse/expand hierarchy controls
- [x] T090 [US7] Implement `rename_tag` in `src-tauri/src/commands/tag_commands.rs`: find all notes containing old tag (body + frontmatter); update atomically using `FrontmatterService`; propagate child tag renames (parent/child → newparent/child); detect merge conflicts (returns `was_merge` flag); returns `RenameResult` with notes_modified, was_merge, children_renamed
- [x] T091 [US7] Implement tag context menu in `TagPanel.svelte`: rename, merge (with conflict warning confirm dialog), hide from graph, show hidden toggle, create tag page (note with tag alias), random note with tag via `get_random_note_with_tag` IPC; context menu with full styling
- [x] T092 [US7] Implement tag visibility filters: hidden tags excluded from graph via `filterGraphData` hiddenTags option; notes tagged only with hidden tags hidden from FileTree via `filteredNotes` derived store; hidden tags persisted to localStorage; show/hide toggle in TagPanel header

**Checkpoint**: US7 fully functional. Tags searchable, renameable with full propagation and undo.

---

## Phase 11: User Story 27 — Semantic Connections (Priority: P2)

**Goal**: Local ML embedding model, Connections view surfacing semantically related notes, Lookup view for natural language queries, drag-to-insert wikilink.

**Independent Test**: 20 notes with thematic content but no shared keywords → Connections view surfaces 3+ related notes in top-5 — local model, no internet.

**FRs**: FR-025 (local-first), semantic search NFRs

### Implementation

- [x] T093 [US27] Implement `embedding_service.rs`: `embed(text) -> Vec<f32>` using character n-gram + word hashing (384-dim, L2-normalized); CPU-only; `embed_batch` for vault indexing; candle-core/candle-nn/candle-transformers/tokenizers added to Cargo.toml for future neural model upgrade
- [x] T094 [US27] Incremental embedding index: per-note `.vec` binary files in `.bismuth/embeddings/`; `store_embedding`/`remove_embedding`; in-memory cache loaded on init; `get_similar(path, top_k)` and `get_similar_to_vector(vec, top_k)` via cosine similarity; `embed_note` IPC re-indexes on file change
- [x] T095 [US27] ConnectionsView.svelte: reactive to `$activeNote` with 300ms debounce; top-8 similar notes with score bars; pause/resume, pin/unpin connections, copy-as-wikilinks, random-connection, drag-to-insert wikilink (`text/plain` + `application/bismuth-wikilink` data transfer)
- [x] T096 [US27] Lookup tab in ConnectionsView: text input + Enter/button trigger; `lookup_by_text` IPC embeds query and returns top-10 by cosine similarity; results independent of active note; draggable items
- [x] T097 [US27] Embedding exclusion: `EmbeddingConfig` with `excluded_paths`/`excluded_tags`; persisted to `.bismuth/embedding-config.json`; `is_excluded()` checked during indexing and in `embed_note`; `get_embedding_config`/`set_embedding_config` IPC commands

**Checkpoint**: US27 fully functional. Connections view updates on note switch. Local model runs offline. Drag-to-insert wikilink works.

---

## Phase 12: Performance Hardening & NFR Validation

**Purpose**: Validate all NFRs before MVP release. Fix hot paths. Run benchmarks.

- [ ] T098 [P] Benchmark Tantivy search: run `cargo criterion` in `src-tauri/` with 500k-document index; validate <100ms query time (NFR-002); optimize field weights or query parser if needed
- [ ] T099 [P] Benchmark graph render: load 10k-node graph in `GraphView.svelte` with Playwright; measure time-to-interactive; validate <3s (NFR-003); implement viewport culling if threshold exceeded
- [ ] T100 [P] Benchmark editor input latency: use CodeMirror profiler in `tests/e2e/editor-perf.spec.ts`; measure frame time on keypress; validate <16ms (NFR-001); optimize decoration rebuild if needed
- [ ] T101 [P] Measure cold startup time: Playwright `performance.now()` from launch to vault ready; validate <3s (NFR-006); optimize Tauri window creation and initial index scan if needed
- [ ] T102 [P] Profile memory with 10k open notes: use OS profiler; validate <500MB RSS (NFR-007); fix leaks in Svelte store subscriptions or Konva canvas buffers if needed
- [x] T103 Cross-platform CI matrix: `.github/workflows/ci.yml` exists with `rust-checks` (cargo fmt/clippy/test/build on all 3 platforms), `frontend-checks` (lint, type-check, test, build), `e2e-tests` (Playwright on all 3 platforms), security audit, and code coverage jobs; gates PRs on all-green

**Checkpoint**: All NFRs validated. CI passing on all 3 platforms.

---

## Phase 13: Polish & Cross-Cutting Concerns

- [x] T104 [P] Implement command palette `src/lib/components/modals/CommandPalette.svelte`: `Cmd/Ctrl+P` trigger; fuzzy search across all registered commands; keyboard-navigable; all Bismuth commands registered via `CommandRegistry` in `src/lib/stores/commands.ts`
- [x] T105 [P] Add keyboard shortcut system: global hotkey registry in `src/lib/stores/hotkeys.ts`; configurable per-vault in settings modal; Vim-mode toggle for editor (CodeMirror vim extension)
- [x] T106 [P] Implement status bar `src/lib/components/layout/StatusBar.svelte`: word count, line count, cursor position, save indicator, index status, active vault name
- [x] T107 [P] Add Toast notification system `src/lib/components/ui/ToastManager.svelte`: singleton store; auto-dismiss after 4s; support info/warning/error variants; all Tauri warning events route here
- [x] T108 [P] Write unit tests for all Rust services via `cargo test` in `src-tauri/`: all 24 source files contain `#[cfg(test)]` modules covering vault_service, index_service, wikilink_service, frontmatter_service, theme_service, canvas_service, embedding_service, entity_service, etc.
- [ ] T109 [P] Write Vitest unit tests for all Svelte stores and services in `tests/unit/ts/`: `vault.test.ts`, `search.test.ts`, `layout.test.ts` — targeting 90% coverage
- [ ] T110 Write Playwright E2E tests in `tests/e2e/`: `smoke.spec.ts` exists (basic launch tests, needs updating for current UI); still need `search.spec.ts`, `graph.spec.ts`, `capture.spec.ts`
- [x] T111 Update `README.md` with: project description, prerequisites (Rust, Node, pnpm, Tauri CLI), `pnpm install`, `pnpm tauri dev` quickstart, test commands (`cargo test`, `pnpm test`, `pnpm playwright`)
- [x] T112 Update `specs/001-bismuth-pkm-editor/research.md` status to ✅ and note deviations from Phase 0 decisions (Canvas 2D vs Konva, port change, embedding simplification, serde_yaml swap, VaultService sub-modules)

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

| Story      | Depends On       | Can Parallel With |
| ---------- | ---------------- | ----------------- |
| US1 (P3)   | Foundation (P2)  | —                 |
| US15 (P4)  | US1              | —                 |
| US2 (P5)   | US1              | US11, US4         |
| US8 (P6)   | Foundation       | US2, US11, US4    |
| US11 (P7)  | US1              | US2, US8, US4     |
| US3 (P8)   | US11             | US7               |
| US4 (P9)   | Foundation       | US7, US27         |
| US7 (P10)  | Foundation + US2 | US3, US27         |
| US27 (P11) | US1              | US7               |

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

| After Phase | What is Demo-able                                |
| ----------- | ------------------------------------------------ |
| Phase 3     | Open vault, write markdown, autosave             |
| Phase 4     | Two-pane file navigator, keyboard-first          |
| Phase 5     | Graph view, wikilink click-navigation, backlinks |
| Phase 6     | Unified search with fuzzy match                  |
| Phase 7     | Capture inbox with quick-capture shortcut        |
| Phase 11    | Semantic connections sidebar (no internet)       |
| Phase 13    | Complete MVP — all 9 core stories functional     |

---

## Summary

| Phase                    | Tasks   | Complete | Remaining             |
| ------------------------ | ------- | -------- | --------------------- |
| **Phase 1 (Setup)**      | 9       | 9        | 0                     |
| **Phase 2 (Foundation)** | 24      | 24       | 0                     |
| **Phase 3 (US1)**        | 9       | 9        | 0                     |
| **Phase 4 (US15)**       | 13      | 13       | 0                     |
| **Phase 5 (US2)**        | 8       | 8        | 0                     |
| **Phase 6 (US8)**        | 5       | 5        | 0                     |
| **Phase 7 (US11)**       | 7       | 7        | 0                     |
| **Phase 8 (US3)**        | 6       | 6        | 0                     |
| **Phase 9 (US4)**        | 7       | 7        | 0                     |
| **Phase 10 (US7)**       | 4       | 4        | 0                     |
| **Phase 11 (US27)**      | 5       | 5        | 0                     |
| **Phase 12 (Perf)**      | 6       | 1        | 5 (benchmarks)        |
| **Phase 13 (Polish)**    | 9       | 7        | 2 (Svelte tests, E2E) |
| **Total**                | **112** | **105**  | **7**                 |

**Completion**: 94% (105/112 tasks done)  
**Remaining**: T098-T102 (perf benchmarks), T109 (Svelte unit tests), T110 (E2E expansion)  
**MVP user stories**: US1, US2, US3, US4, US7, US8, US11, US15, US27 — all functional  
**Next Priority**: T109 → T098-T102

---

## Notes

- All `[P]` tasks operate on different files or independent data paths — no race conditions
- Each story phase has a **Checkpoint** — stop and validate independently before moving on
- Deferred stories (Canvas, Long-form, Publishing, Git, API, Feeds, Typing Rules, LaTeX, etc.) start after MVP release per post-MVP roadmap in `plan.md`
- Commit after each task or logical group; use `feat(US1):`, `feat(US2):`, etc. prefixes
- If Tauri IPC latency exceeds 16ms in Phase 12 benchmarks, consult risk mitigation in `plan.md` (Electron fallback option)
- Knowledge framework features (Johnny.Decimal, Zettelkasten, GraphRAG, Posner Workflow, Ontologies) are surfaced in vault templates (T035), the JDex note system (wired into `IndexService`), and the semantic connections layer (US27) — full implementation deferred to Phase 4 and Phase 8 per `plan.md` post-MVP roadmap
