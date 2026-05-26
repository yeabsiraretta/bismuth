# Implementation Plan: Bismuth PKM Editor

**Branch**: `001-bismuth-pkm-editor` | **Date**: 2026-05-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-bismuth-pkm-editor/spec.md`

**Note**: This plan follows the Tauri + Svelte + Rust stack as specified by user preference. Plugins are not required; all features will be built-in during development.

## Summary

Bismuth is a high-performance, Obsidian-compatible PKM editor built with Tauri (Rust backend) + Svelte (frontend). It provides 31 user stories spanning knowledge management, long-form writing, visual tools, and publishing—all running locally with no mandatory network dependencies. The MVP focuses on core editing, wikilinks, graph view, and basic lifecycle management, establishing the foundation for advanced features.

## Technical Context

**Language/Version**: 
- **Frontend**: TypeScript 5.3+ with Svelte 4.x
- **Backend**: Rust 1.75+ (stable channel)
- **Build**: Tauri 1.5+, Vite 5.x

**Primary Dependencies**:
- **Frontend**: CodeMirror 6 (editor), Konva.js (canvas), PDF.js (PDF rendering), unified/remark (markdown parsing)
- **Backend**: tantivy (full-text search), git2 (Git integration), lopdf (PDF manipulation), candle-rs (ML embeddings), tokio (async runtime)
- **Cross-cutting**: serde (serialization), tauri (IPC bridge)

**Storage**: 
- Markdown files in user-specified vault directory (local filesystem)
- SQLite for search index, graph cache, and metadata (`.bismuth/` folder in vault)
- No remote storage required

**Testing**:
- **Frontend**: Vitest + Testing Library (unit), Playwright (E2E)
- **Backend**: cargo test (unit), cargo-tarpaulin (coverage)
- **Integration**: Tauri's test harness for IPC contracts

**Target Platform**: 
- macOS 11+ (primary), Windows 10+, Linux (Ubuntu 20.04+)
- Desktop-only (no mobile/web)

**Project Type**: Desktop application (Tauri-based)

**Performance Goals** (from NFRs):
- <16ms editor latency (NFR-001)
- 500k files indexed in <100ms (NFR-002)
- Graph render <3s for 10k nodes (NFR-003)
- Startup <3s cold, <1s warm (NFR-006)
- Memory <500MB for 10k files (NFR-007)

**Constraints**:
- Local-first: no mandatory network/accounts (FR-025)
- Obsidian theme compatibility: CSS variables + Style Settings (FR-011)
- Cross-platform: all features work on macOS/Windows/Linux unless explicitly limited
- File format: pure markdown + YAML frontmatter (no proprietary formats)

**Scale/Scope**:
- 500k notes per vault (NFR-002)
- 274 functional requirements across 31 user stories
- ~50 UI screens/views
- ~200 commands in command palette

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ Research-First Simplicity
**Status**: PASS (pending Phase 0 research completion)

**Affected Code Paths**: New codebase—no existing paths. Will establish patterns in Phase 0.

**Relevant Concepts**:
- Tauri IPC architecture (command/event patterns)
- CodeMirror 6 extension system
- Tantivy index management
- Obsidian CSS variable conventions
- Markdown AST manipulation (unified/remark)

**Viable Approaches Considered**:
1. **Tauri + Svelte** (SELECTED): Best performance/compatibility balance
2. Electron + React: Larger bundle, slower startup, but more mature ecosystem
3. Native (Swift/Kotlin): Maximum performance but 3x dev cost, no theme compatibility

**Rejected Alternatives**:
- Electron: Violates NFR-006 (startup time) and NFR-007 (memory footprint)
- Native: Cannot reuse Obsidian themes (FR-011 violation), 3 separate codebases

### ✅ Code Quality and Reuse
**Status**: PASS

**Reuse Strategy**:
- CodeMirror 6 for editor (proven in Obsidian)
- PDF.js for PDF rendering (Mozilla-maintained)
- Tantivy for search (Rust-native, high-performance)
- Svelte component library will follow Tolaria patterns (referenced in spec assumptions)

**New Abstractions Justified**:
- Vault abstraction (file watcher + index coordinator): Required for multi-platform file I/O
- IPC command layer: Required for Tauri frontend-backend bridge
- Theme engine: Required for Style Settings YAML parsing (FR-011)

**Duplication Avoidance**: Shared Svelte components for all UI surfaces, single Rust service layer for all file operations

### ✅ Testing Standard
**Status**: PASS

**Test Strategy**:
- **Unit tests**: 90%+ coverage for all Rust services and Svelte components
- **Integration tests**: All Tauri IPC commands with contract validation
- **E2E tests**: Critical user journeys (create note, link notes, search, graph view)
- **Performance tests**: Automated benchmarks for NFR-001, NFR-002, NFR-003

**Coverage Approach**:
- cargo-tarpaulin for Rust (lines/branches/statements/functions)
- Vitest coverage for TypeScript/Svelte
- CI gate: PR blocked if coverage drops below 90%

### ✅ UX Consistency
**Status**: PASS

**Existing Patterns** (from Obsidian compatibility requirement):
- Command palette (Cmd/Ctrl+P)
- Settings modal (tabbed interface)
- Sidebar panels (collapsible, draggable)
- Theme variables (`--background-primary`, `--text-normal`, etc.)

**Components to Establish** (Phase 1):
- Button, Input, Dropdown, Modal, Toast, Sidebar, Panel
- All components must support Obsidian CSS variables
- Accessibility: ARIA labels, keyboard navigation, screen reader support

**Copy Patterns**: Consistent terminology (vault, note, wikilink, frontmatter)

### ✅ Performance and Portability
**Status**: PASS

**Measurable Expectations** (from NFRs):
- Editor latency: <16ms (measured via CodeMirror profiler)
- Search: <100ms for 500k files (measured via criterion.rs benchmarks)
- Graph: <3s for 10k nodes (measured via Konva.js profiler)
- Startup: <3s cold (measured via Tauri startup hooks)
- Memory: <500MB for 10k files (measured via OS profilers)

**Cross-Platform Validation**:
- CI matrix: macOS 11+, Windows 10+, Ubuntu 20.04+
- Platform-specific code isolated in `src-tauri/src/platform/`
- File path handling via `std::path::PathBuf` (cross-platform)
- Tests run on all 3 platforms before merge

**Limitations**: None—all features cross-platform unless explicitly scoped in spec

## Project Structure

### Documentation (this feature)

```text
specs/001-bismuth-pkm-editor/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── ipc-commands.md  # Tauri IPC command contracts
│   └── events.md        # Tauri event contracts
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
bismuth/
├── src/                          # Svelte frontend
│   ├── lib/
│   │   ├── components/           # Reusable UI components
│   │   │   ├── editor/           # CodeMirror wrapper, toolbar
│   │   │   ├── graph/            # Graph view (Konva.js)
│   │   │   ├── canvas/           # Canvas view
│   │   │   ├── pdf/              # PDF viewer
│   │   │   ├── sidebar/          # Navigator, file tree, tags
│   │   │   ├── modals/           # Settings, command palette
│   │   │   └── ui/               # Button, Input, Dropdown, etc.
│   │   ├── stores/               # Svelte stores (vault state, settings)
│   │   ├── services/             # Frontend services (IPC wrappers)
│   │   ├── utils/                # Helpers, formatters
│   │   └── types/                # TypeScript types
│   ├── routes/                   # SvelteKit routes (if using routing)
│   ├── App.svelte                # Root component
│   └── main.ts                   # Entry point
│
├── src-tauri/                    # Rust backend
│   ├── src/
│   │   ├── commands/             # Tauri IPC command handlers
│   │   │   ├── vault.rs          # Vault operations (open, create, scan)
│   │   │   ├── file.rs           # File CRUD
│   │   │   ├── search.rs         # Full-text search
│   │   │   ├── graph.rs          # Graph data generation
│   │   │   ├── git.rs            # Git operations
│   │   │   └── mod.rs
│   │   ├── services/             # Core business logic
│   │   │   ├── vault_service.rs  # Vault management
│   │   │   ├── index_service.rs  # Tantivy indexing
│   │   │   ├── wikilink_service.rs # Link resolution
│   │   │   ├── frontmatter_service.rs # YAML parsing
│   │   │   ├── theme_service.rs  # Style Settings parser
│   │   │   └── mod.rs
│   │   ├── models/               # Data structures
│   │   │   ├── note.rs
│   │   │   ├── vault.rs
│   │   │   ├── link.rs
│   │   │   └── mod.rs
│   │   ├── platform/             # Platform-specific code
│   │   │   ├── macos.rs
│   │   │   ├── windows.rs
│   │   │   ├── linux.rs
│   │   │   └── mod.rs
│   │   ├── utils/                # Helpers
│   │   ├── error.rs              # Error types
│   │   ├── config.rs             # App configuration
│   │   └── main.rs               # Tauri entry point
│   ├── Cargo.toml
│   └── tauri.conf.json
│
├── tests/
│   ├── unit/                     # Unit tests (Rust + TypeScript)
│   │   ├── rust/                 # cargo test
│   │   └── ts/                   # Vitest
│   ├── integration/              # Tauri IPC contract tests
│   └── e2e/                      # Playwright E2E tests
│
├── .bismuth/                     # Sample vault for testing
│   ├── notes/
│   ├── templates/
│   └── themes/
│
├── package.json                  # Frontend deps
├── vite.config.ts                # Vite config
├── tsconfig.json                 # TypeScript config
├── playwright.config.ts          # E2E config
└── README.md
```

**Structure Decision**: 

**Tauri monorepo** with clear frontend/backend separation:
- `src/`: Svelte frontend (TypeScript) handles all UI rendering
- `src-tauri/`: Rust backend handles file I/O, indexing, search, Git
- Communication via Tauri IPC commands (async, type-safe)
- Tests organized by type (unit/integration/e2e) with 90%+ coverage target
- Sample vault (`.bismuth/`) for development and E2E tests

## Complexity Tracking

**No constitutional violations**. All checks passed. No complexity justifications required.

---

## MVP Roadmap

### MVP Scope Definition

**Goal**: Deliver a functional PKM editor that can replace Obsidian for basic note-taking workflows while establishing the architecture for advanced features.

**MVP User Stories** (Priority P0-P1 from spec):
- ✅ US1: Vault Management & File Operations
- ✅ US2: Wikilinks & Backlinks
- ✅ US3: Entity System & Deep Linking (basic Portent types)
- ✅ US4: Theming & Customization (Obsidian compatibility)
- ✅ US5: Advanced Writing (basic editor + write-good linting)
- ✅ US7: Unified Search
- ✅ US8: Graph View
- ✅ US11: Capture & Lifecycle Dashboard (basic)
- ✅ US15: Notebook Navigator

**Deferred to Post-MVP** (Priority P2-P4):
- Canvas, PDF++, Git, Long-form, Publishing, etc. (27 stories)

**MVP Feature Count**: 
- 9 user stories
- ~80 functional requirements
- ~15 UI screens/views

### Phase 0: Research & Architecture (Weeks 1-2)

**Objective**: Resolve all technical unknowns and establish architectural patterns.

**Tasks**:
1. **Tauri IPC Patterns** (research.md)
   - Command/event architecture
   - Error handling across IPC boundary
   - State synchronization strategies
   - Performance profiling setup

2. **CodeMirror 6 Integration** (research.md)
   - Extension system for wikilinks, syntax highlighting
   - Performance optimization for large files
   - Undo/redo integration
   - Custom decorations for backlinks

3. **Tantivy Index Design** (research.md)
   - Schema for full-text + metadata search
   - Incremental indexing strategy
   - Query DSL for BM25 ranking
   - Index persistence and recovery

4. **Obsidian Theme Compatibility** (research.md)
   - CSS variable extraction from Obsidian themes
   - Style Settings YAML parser implementation
   - Component library design (Tolaria reference)

5. **File Watcher Strategy** (research.md)
   - notify-rs vs. alternatives
   - Debouncing and batch processing
   - Cross-platform path handling
   - External editor sync

**Deliverables**:
- `research.md` with all decisions documented
- Proof-of-concept for critical paths (Tauri IPC, CodeMirror, Tantivy)
- Performance baseline measurements

### Phase 1: Core Architecture & Contracts (Weeks 3-5)

**Objective**: Build the foundational systems that all features depend on.

**1.1 Data Model** (Week 3)
- Define core entities: Vault, Note, Link, Tag, Portent
- YAML frontmatter schema
- Graph data structures
- SQLite schema for index/cache

**Deliverable**: `data-model.md`

**1.2 IPC Contracts** (Week 3)
- Document all Tauri commands (vault, file, search, graph)
- Event contracts (file-changed, index-updated)
- Error types and handling

**Deliverable**: `contracts/ipc-commands.md`, `contracts/events.md`

**1.3 Vault Service** (Week 4)
- Rust: VaultService (open, create, scan, watch)
- File I/O abstraction
- Path normalization (cross-platform)
- Tests: 90%+ coverage

**1.4 Index Service** (Week 4)
- Rust: IndexService (Tantivy integration)
- Incremental indexing
- Wikilink extraction and resolution
- Tests: 90%+ coverage

**1.5 Frontend Foundation** (Week 5)
- Svelte component library (Button, Input, Modal, etc.)
- Theme engine (CSS variable injection)
- IPC service wrappers
- Tests: 90%+ coverage

**Deliverable**: `quickstart.md` (how to run the app)

### Phase 2: MVP Features (Weeks 6-12)

**2.1 Editor & Wikilinks** (Weeks 6-7)
- CodeMirror 6 integration
- Wikilink syntax highlighting
- Click-to-navigate
- Backlink panel
- Tests: Create note, link notes, navigate

**User Stories**: US1 (partial), US2

**2.2 Search** (Week 8)
- Search UI (command palette integration)
- Tantivy query execution
- Result rendering with snippets
- Tests: Search accuracy, performance (<100ms)

**User Stories**: US7

**2.3 Graph View** (Week 9)
- Konva.js integration
- Node/edge rendering from index
- Basic filtering (tags, types)
- Tests: Graph generation (<3s for 10k nodes)

**User Stories**: US8

**2.4 Navigator & File Tree** (Week 10)
- Sidebar file tree
- Folder navigation
- File creation/deletion
- Tests: CRUD operations

**User Stories**: US15

**2.5 Theming & Settings** (Week 11)
- Theme loader (Obsidian CSS)
- Style Settings parser
- Settings modal
- Tests: Theme switching, setting persistence

**User Stories**: US4

**2.6 Lifecycle Dashboard** (Week 12)
- Capture dashboard (basic)
- Portent type assignment
- Lifecycle state management
- Tests: Note classification workflow

**User Stories**: US3 (partial), US11 (partial)

### Phase 3: Polish & Release (Weeks 13-14)

**3.1 Performance Optimization** (Week 13)
- Profile and optimize hot paths
- Validate all NFRs (latency, memory, startup)
- Benchmark suite automation

**3.2 Cross-Platform Testing** (Week 13)
- CI matrix: macOS, Windows, Linux
- Platform-specific bug fixes
- Installer/packaging

**3.3 Documentation** (Week 14)
- User guide (getting started, features)
- Developer docs (architecture, contributing)
- Release notes

**3.4 MVP Release** (Week 14)
- Beta testing with sample vaults
- Bug fixes
- v0.1.0 release

### Success Criteria for MVP

**Functional**:
- ✅ Can open existing Obsidian vault
- ✅ Can create, edit, delete notes
- ✅ Wikilinks work (syntax, navigation, backlinks)
- ✅ Search returns accurate results in <100ms
- ✅ Graph renders in <3s for 10k nodes
- ✅ Themes load correctly (Obsidian compatibility)

**Non-Functional**:
- ✅ Startup <3s on macOS/Windows/Linux
- ✅ Editor latency <16ms
- ✅ Memory <500MB for 10k files
- ✅ 90%+ test coverage
- ✅ No crashes in 1-hour usage session

**User Validation**:
- ✅ 10 beta testers can complete basic workflows
- ✅ No P0/P1 bugs reported
- ✅ Positive feedback on performance vs. Obsidian

### Post-MVP Roadmap (Weeks 15+)

**Phase 4: Advanced Editing** (Weeks 15-18)
- US5: Comprehensive Linter, PDF++, LaTeX Math Suite
- US6: Code Editing
- US14: Typing Rules

**Phase 5: Visual Tools** (Weeks 19-22)
- US9: Canvas
- US19: Branching Block Editor
- US20: Radial Story Timeline

**Phase 6: Long-Form Writing** (Weeks 23-26)
- US16: Note Sequencer
- US18: Long-form Project & Draft Management
- US21: RSVP Speed Reader

**Phase 7: Integration & Publishing** (Weeks 27-30)
- US10: REST API & MCP
- US22: Git Version Control
- US31: Digital Garden Publishing

**Phase 8: Intelligence & Automation** (Weeks 31-34)
- US27: Semantic Connections (ML embeddings)
- US12: Template Engine (advanced)
- Kanban boards (FR-268–272)
- Auto metadata (FR-273–274)

### Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Tauri IPC performance** | High | Early profiling in Phase 0; fallback to Electron if <16ms latency unachievable |
| **Tantivy index size** | Medium | Benchmark with 500k files; implement index compression if needed |
| **Cross-platform file watching** | Medium | Isolate platform code; extensive testing on all 3 platforms |
| **Obsidian theme compatibility** | High | Test with top 10 Obsidian themes; document incompatibilities |
| **CodeMirror 6 learning curve** | Low | Allocate extra time in Phase 0 research; use official examples |

### Dependencies & Blockers

**External Dependencies**:
- Tauri 1.5+ (stable)
- Rust 1.75+ (stable channel)
- Node.js 18+ (for frontend build)

**Internal Dependencies**:
- Phase 1 must complete before Phase 2 (architecture foundation)
- Search (2.2) depends on Index Service (1.4)
- Graph (2.3) depends on Index Service (1.4)

**No Blockers**: All dependencies are open-source and stable.

---

## Next Steps

1. **Run Phase 0 Research**: Execute research tasks documented above
2. **Generate `research.md`**: Document all technical decisions
3. **Run Phase 1 Design**: Create data-model.md, contracts/, quickstart.md
4. **Update Agent Context**: Point `.windsurf/rules/specify-rules.md` to this plan
5. **Generate Tasks**: Run `/speckit.tasks` to create actionable task breakdown

**Estimated Timeline**: 14 weeks to MVP, 34 weeks to feature-complete v1.0

**Team Size**: 2-3 developers (1 Rust backend, 1-2 Svelte frontend)

**Ready to proceed with Phase 0 research.**
