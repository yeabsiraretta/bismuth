# Implementation Plan: Bismuth PKM Editor - Demo MVP

**Branch**: `001-bismuth-pkm-editor` | **Date**: 2026-05-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-bismuth-pkm-editor/spec.md`

**Scope**: 2-week demo focusing on Johnny.Decimal organization + Zettelkasten linking

## Summary

Build a minimal viable demo of Bismuth showcasing core value proposition: a local-first markdown editor with Johnny.Decimal organization and Zettelkasten linking. The demo proves the concept works with vault management, basic CodeMirror editing, JD ID parsing/grouping, wikilink navigation, backlinks panel, auto-suggest for next JD ID, simple text search, and basic graph visualization. Explicitly excludes full Zettelkasten IDs (timestamp-based), ontologies, GraphRAG, Git integration, multi-vault, templates, and advanced features to ship a polished proof-of-concept in 10 working days.

## Technical Context

**Language/Version**: 
- Frontend: TypeScript 5.9 + Svelte 5
- Backend: Rust 1.75 (edition 2021)

**Primary Dependencies**:
- Frontend: CodeMirror 6, TailwindCSS v4, Phosphor Icons, force-graph
- Backend: Tauri v2.10.0, gray_matter (frontmatter), pulldown-cmark (markdown), notify 6.1 (filesystem watcher)
- Build: Vite 7.3.1, pnpm

**Storage**: 
- Filesystem as single source of truth (plain markdown files)
- In-memory cache for current session
- No database (SQLite deferred to post-demo)

**Testing**: 
- Frontend: Vitest
- Backend: cargo test
- E2E: Playwright (deferred to post-demo for speed)

**Target Platform**: 
- macOS (primary), Windows, Linux (cross-platform via Tauri)
- Desktop only (no mobile/web)

**Project Type**: Desktop application (Tauri-based PKM editor)

**Performance Goals**:
- Vault scan: <3s for 500 files
- Note open: <200ms
- Editor typing: <16ms per frame (60fps)
- Search: <200ms for 1000 notes
- Graph render: <3s for 10,000 nodes

**Constraints**:
- Local-first (no cloud dependencies)
- Disk-first writes (state updates after successful file write)
- Sub-100ms UI response for core interactions
- Offline-capable (no internet required)

**Scale/Scope**:
- Demo vault: 20-30 sample notes
- Target capacity: 100-500 notes (demo scale)
- Production target: 10,000+ notes (deferred)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ Research-First Simplicity
- **Affected code paths**: New codebase (greenfield)
- **Relevant concepts**: Tolaria architecture analysis completed, Johnny.Decimal system documented, Zettelkasten patterns researched
- **Viable approaches**: 
  1. Electron + React (rejected: heavier, slower)
  2. **Tauri + Svelte (selected)**: Lighter, faster, Rust backend, similar to Tolaria patterns
  3. Native Swift/Kotlin (rejected: platform-specific, slower development)
- **Selected approach**: Tauri v2 + Svelte 5 + Rust, following Tolaria's proven patterns (filesystem as truth, disk-first writes, convention over configuration)
- **Rejected alternatives**: Documented in research.md

### ✅ Code Quality and Reuse
- **Reuse strategy**: Adopt Tolaria's architectural patterns (3-layer data model, 4-panel layout, component composition)
- **New abstractions**: Minimal - only JD parser, wikilink parser, vault scanner (all justified by core requirements)
- **Duplication avoidance**: Use shadcn/ui Svelte components, shared utilities for markdown/frontmatter parsing
- **Justification**: Greenfield project requires foundational code; patterns borrowed from proven Tolaria architecture

### ⚠️ Testing Standard (EXCEPTION)
- **Demo exception**: 90% coverage deferred to post-demo
- **Demo testing**: Manual testing only, focus on working demo over test coverage
- **Rationale**: 2-week timeline prioritizes proof-of-concept over comprehensive testing
- **Remediation**: Full test suite (Vitest + Playwright) planned for Phase 3 (post-demo)
- **Risk**: Acknowledged - demo may have bugs, but acceptable for concept validation

### ✅ UX Consistency
- **Existing patterns**: None (new project)
- **Adopted patterns**: Tolaria's 4-panel layout, keyboard-first navigation, disk-first saves
- **Components**: shadcn/ui Svelte (Button, Input, Dialog, etc.)
- **Accessibility**: Basic keyboard navigation, ARIA labels on interactive elements
- **Copy**: Consistent terminology (vault, note, wikilink, JD ID, area, category)

### ✅ Performance and Portability
- **Performance expectations**: Defined in Technical Context (vault scan <3s, note open <200ms, etc.)
- **Cross-platform**: Tauri supports macOS, Windows, Linux
- **Primary platform**: macOS (development), Windows/Linux tested before demo
- **Platform-specific**: None - Tauri abstracts OS differences
- **Validation**: Manual testing on all three platforms before demo recording

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
bismuth/
├── src/                          # Svelte frontend
│   ├── lib/
│   │   ├── components/
│   │   │   ├── Sidebar.svelte
│   │   │   ├── NoteList.svelte
│   │   │   ├── Editor.svelte
│   │   │   ├── CodeMirrorEditor.svelte
│   │   │   ├── BacklinksPanel.svelte
│   │   │   ├── GraphView.svelte
│   │   │   ├── CreateNoteDialog.svelte
│   │   │   ├── SearchInput.svelte
│   │   │   ├── JDBadge.svelte
│   │   │   ├── AreaSection.svelte
│   │   │   └── ResizeHandle.svelte
│   │   ├── stores/
│   │   │   ├── vault.ts          # Vault state management
│   │   │   ├── selection.ts      # Active note selection
│   │   │   ├── wikilinks.ts      # Backlinks computation
│   │   │   ├── layout.ts         # Panel widths/visibility
│   │   │   └── search.ts         # Search state
│   │   ├── utils/
│   │   │   ├── jd.ts             # JD ID parsing/validation
│   │   │   ├── wikilinks.ts      # Wikilink parsing
│   │   │   ├── markdown.ts       # Markdown utilities
│   │   │   └── shortcuts.ts      # Keyboard shortcuts
│   │   └── constants/
│   │       └── appStorage.ts     # LocalStorage keys
│   ├── App.svelte                # Main app component
│   └── main.ts                   # Entry point
├── src-tauri/                    # Rust backend
│   ├── src/
│   │   ├── commands/
│   │   │   ├── vault.rs          # Vault operations (open, scan)
│   │   │   ├── notes.rs          # Note CRUD (read, write)
│   │   │   └── search.rs         # Simple text search
│   │   ├── models/
│   │   │   └── note.rs           # Note struct
│   │   ├── utils/
│   │   │   ├── jd.rs             # JD ID parser (Rust)
│   │   │   └── wikilinks.rs      # Wikilink parser (Rust)
│   │   └── main.rs               # Tauri entry point
│   └── Cargo.toml
├── demo-vault/                   # Sample vault for demo
│   ├── 10-19 Life Admin/
│   ├── 20-29 Projects/
│   └── 30-39 Learning/
├── docs/                         # Architecture docs
│   ├── TOLARIA_ARCHITECTURE_ANALYSIS.md
│   ├── BISMUTH_ARCHITECTURE_PROPOSAL.md
│   ├── DEMO_PLAN.md
│   └── DEMO_CHECKLIST.md
└── specs/                        # Feature specs
    └── feature/001-bismuth-pkm-editor/
        ├── spec.md
        ├── plan.md               # This file
        ├── research.md           # Phase 0 (next)
        ├── data-model.md         # Phase 1
        └── quickstart.md         # Phase 1

```

**Structure Decision**: Tauri desktop application structure selected. Frontend (Svelte) and backend (Rust) are tightly coupled via Tauri IPC. No separate API server needed - Tauri commands serve as the interface between frontend and backend. Demo vault included for testing and demonstration purposes.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| 90% test coverage deferred | 2-week demo timeline requires focus on working proof-of-concept | Full test suite would consume 3-4 days, leaving insufficient time for core features. Manual testing acceptable for demo validation. |

---

## Phase 0: Research & Clarifications

### Research Tasks Completed

✅ **Tolaria Architecture Analysis** (`docs/TOLARIA_ARCHITECTURE_ANALYSIS.md`)
- Analyzed production-grade PKM architecture
- Documented core principles: filesystem as truth, disk-first writes, convention over configuration
- Identified reusable patterns: 4-panel layout, 3-layer data model, component composition
- Tech stack comparison: Tauri + React → Tauri + Svelte (same patterns, lighter framework)

✅ **Johnny.Decimal System** (from retrieved memory)
- 3-level hierarchy: Area (10-19) → Category (11-15) → ID (11.01-11.99)
- 10-folder limit at each level
- JDex (index) integration with notes
- Auto-suggest next available ID

✅ **Zettelkasten Methodology** (from retrieved memory)
- Atomic notes with unique IDs
- Wikilinks for connections (`[[Note Title]]`)
- Backlinks panel (reverse index)
- Graph visualization

✅ **Demo Scope Definition** (`docs/DEMO_PLAN.md`, `docs/DEMO_CHECKLIST.md`)
- 2-week timeline (10 working days)
- Must-have features identified
- Nice-to-have features prioritized
- Explicitly excluded features documented

### Key Clarifications & Decisions

#### 1. File Watching Strategy
**Decision**: Watch files and auto-reload with notification toast

**Rationale**: Best user experience - files stay in sync automatically when edited externally (e.g., VS Code), but users are informed so they don't lose context. Simpler to implement than conflict resolution for demo.

**Implementation**: 
- Use `notify` crate (Rust) to watch vault directory
- Emit `vault-changed` event on file modifications
- Frontend listens for events and reloads affected notes
- Show toast notification: "Note updated externally"
- Auto-reload unless note has unsaved changes (show conflict dialog)

**Alternatives Rejected**:
- Manual reload only: Poor UX, files get out of sync
- Silent auto-reload: Confusing when content changes unexpectedly
- No file watching: Unacceptable for multi-editor workflow

#### 2. Wikilink Resolution Strategy
**Decision**: Case-insensitive title matching with fallback to filename

**Rationale**: Most user-friendly - handles common variations (`[[Machine Learning]]` matches `machine-learning.md` or `Machine Learning.md`). Aligns with Obsidian behavior.

**Implementation**:
- Normalize wikilink text: lowercase, trim whitespace
- Search vault for matching note title (from frontmatter or first H1)
- Fallback to filename match (case-insensitive, ignore extension)
- If no match, mark as unresolved (create-on-click)

**Alternatives Rejected**:
- Exact match only: Too strict, breaks on case differences
- Filename only: Ignores note titles, less intuitive
- Fuzzy matching: Too complex for demo, can cause ambiguity

#### 3. JD ID Validation Level
**Decision**: Warn on invalid format, don't block

**Rationale**: Flexible for demo - allows non-JD files in vault, but guides users toward correct format. Strict validation can be added post-demo.

**Implementation**:
- Parse JD ID from filename: `(\d{2})\.(\d{2})\s+(.+)\.md`
- If match: Extract area, category, item number
- If no match: Note has `jd_id: null`, appears in "Uncategorized" section
- Show warning badge on invalid format (e.g., `15.100` exceeds max)
- Don't prevent file operations

**Alternatives Rejected**:
- Strict validation (block invalid files): Too rigid for demo, breaks existing vaults
- No validation: Confusing when JD features don't work
- Auto-fix invalid IDs: Risky, could rename files unexpectedly

#### 4. Search Implementation
**Decision**: Simple grep-like search for demo, Tantivy deferred

**Rationale**: Grep is fast enough for demo scale (100-500 notes), zero dependencies, instant results. Tantivy adds complexity and build time.

**Implementation**:
- Rust: Iterate all notes, search in filename + content
- Case-insensitive substring match
- Return matching notes with snippet (50 chars before/after match)
- Highlight search term in results
- Filter by JD category (optional)

**Alternatives Rejected**:
- Tantivy (full-text search engine): Overkill for demo, adds dependency
- Regex search: More complex, not needed for simple queries
- Frontend-only search: Slower, can't handle large vaults

#### 5. Graph Rendering Library
**Decision**: `force-graph` (simple force-directed layout)

**Rationale**: Lightweight, easy to integrate, good enough for demo. Handles 10,000 nodes acceptably. No WebGL complexity.

**Implementation**:
- Build graph data from notes and wikilinks
- Nodes: `{ id: path, label: title, color: areaColor }`
- Edges: `{ source: fromPath, target: toPath }`
- Click node → open note
- Filter by JD area, tag, or link depth

**Alternatives Rejected**:
- D3.js force layout: More complex API, steeper learning curve
- Cytoscape.js: Heavier, more features than needed
- Custom WebGL: Too complex for demo timeline

### Technology Best Practices

#### Tauri v2
- Use `#[tauri::command]` for all Rust → JS functions
- Serialize with `serde_json` for complex types
- Handle errors with `Result<T, String>` (return error messages to frontend)
- Use `tauri::State` for shared app state (vault path, cache)

#### Svelte 5
- Use `$state()` for reactive variables (runes syntax)
- Use `$derived()` for computed values
- Use `$effect()` for side effects (file watching)
- Prefer `writable` stores for complex state (vault, selection)

#### CodeMirror 6
- Use `EditorView` with `markdown` language support
- Add extensions: `lineNumbers`, `highlightActiveLineGutter`, `keymap`
- Custom extension for wikilink click handling
- Save on `Mod-s` keymap

#### File System Operations
- Always use absolute paths in Rust
- Atomic writes: Write to temp file, then rename
- Handle permission errors gracefully
- Normalize paths (handle `~`, `.`, `..`)

### Performance Optimizations

1. **Vault Scanning**: 
   - Use `WalkDir` with `max_depth` limit
   - Filter `.md` files only
   - Parse frontmatter lazily (only when note opened)
   - Cache results in memory (invalidate on file change)

2. **Wikilink Parsing**:
   - Regex: `\[\[([^\]]+)\]\]`
   - Parse once on note open, cache results
   - Recompute backlinks only when vault changes

3. **Graph Rendering**:
   - Limit initial render to 1000 nodes (pagination for larger vaults)
   - Use canvas rendering (not SVG) for better performance
   - Debounce filter changes (300ms)

4. **Search**:
   - Limit results to 100 (pagination for more)
   - Debounce search input (200ms)
   - Cancel previous search when new query starts

### Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| CodeMirror integration complex | Medium | High | Use basic setup first, add features incrementally |
| Wikilink parsing breaks on edge cases | Medium | Medium | Simple regex for demo, improve post-demo |
| Performance issues with large vaults | Low | Medium | Test with 500 notes, optimize if needed |
| Cross-platform bugs | Medium | Medium | Test on macOS, Windows, Linux before demo |
| File watching unreliable | Low | High | Fallback to manual reload if watcher fails |

### Out of Scope (Deferred to Post-Demo)

❌ Full Zettelkasten IDs (timestamp-based)
❌ Ontology/concept extraction
❌ GraphRAG (multi-hop search)
❌ Git integration
❌ Multi-vault support
❌ Template engine
❌ Advanced search (Tantivy)
❌ Saved views/filters
❌ Themes/customization
❌ Plugin system
❌ Export functionality
❌ REST API
❌ Comprehensive test suite (90% coverage)

---

## Phase 1: Design & Contracts

### Data Model (`data-model.md`)

**Core Entities**:

1. **Note** (primary entity)
   - `path: string` (absolute filesystem path)
   - `filename: string`
   - `title: string` (from first H1 or filename)
   - `content: string` (raw markdown)
   - `jd_id: string | null` (parsed from filename)
   - `jd_area: number | null`
   - `jd_category: number | null`
   - `outgoing_links: string[]` (wikilinks in content)
   - `modified_at: number` (Unix timestamp)
   - `created_at: number`

2. **Vault** (container)
   - `path: string` (root directory)
   - `notes: Note[]` (all markdown files)
   - `is_loading: boolean`

3. **JDArea** (grouping)
   - `area_number: number` (10, 20, 30, etc.)
   - `label: string` ("Life Admin", "Projects", etc.)
   - `categories: JDCategory[]`

4. **JDCategory** (grouping)
   - `category_number: number` (11, 12, 13, etc.)
   - `label: string` ("Me", "House", etc.)
   - `notes: Note[]`

**Relationships**:
- Vault → Notes (1:N)
- JDArea → JDCategory (1:N)
- JDCategory → Notes (1:N)
- Note → Note (N:N via wikilinks)

**Validation Rules**:
- JD ID format: `(\d{2})\.(\d{2})\s+(.+)\.md`
- Area: 10-99 (first two digits)
- Category: 0-9 (second digit)
- Item: 01-99 (after decimal)
- Wikilink format: `\[\[([^\]]+)\]\]`

**State Transitions**:
- Note: `unloaded` → `loading` → `loaded` → `modified` → `saving` → `saved`
- Vault: `closed` → `opening` → `open` → `scanning` → `ready`

### IPC Contracts (`contracts/`)

**Tauri Commands** (`contracts/tauri-commands.md`):

```typescript
// Vault Operations
interface OpenVaultRequest {
  path: string;
}

interface OpenVaultResponse {
  path: string;
  notes: Note[];
}

command open_vault(request: OpenVaultRequest): Promise<OpenVaultResponse>

// Note Operations
interface ReadNoteRequest {
  path: string;
}

interface ReadNoteResponse {
  path: string;
  content: string;
  modified_at: number;
}

command read_note(request: ReadNoteRequest): Promise<ReadNoteResponse>

interface WriteNoteRequest {
  path: string;
  content: string;
}

command write_note(request: WriteNoteRequest): Promise<void>

// Search Operations
interface SearchRequest {
  query: string;
  category?: number;
}

interface SearchResponse {
  results: SearchResult[];
}

interface SearchResult {
  path: string;
  title: string;
  snippet: string;
  score: number;
}

command search_notes(request: SearchRequest): Promise<SearchResponse>

// JD Operations
interface SuggestNextIdRequest {
  category: number;
}

interface SuggestNextIdResponse {
  suggested_id: string;
}

command suggest_next_jd_id(request: SuggestNextIdRequest): Promise<SuggestNextIdResponse>
```

**Tauri Events** (`contracts/tauri-events.md`):

```typescript
// File System Events
interface VaultChangedEvent {
  change_type: 'created' | 'modified' | 'deleted';
  path: string;
}

event vault-changed: VaultChangedEvent

// Error Events
interface ErrorEvent {
  message: string;
  code: string;
}

event error: ErrorEvent
```

### Quickstart Guide (`quickstart.md`)

**For Developers**:

1. **Clone Repository**:
   ```bash
   git clone https://github.com/your-org/bismuth.git
   cd bismuth
   ```

2. **Install Dependencies**:
   ```bash
   pnpm install
   cd src-tauri && cargo build
   ```

3. **Run Development Server**:
   ```bash
   pnpm tauri dev
   ```

4. **Create Demo Vault**:
   ```bash
   mkdir -p demo-vault/10-19\ Life\ Admin/11\ Me
   echo "# My First Note" > demo-vault/10-19\ Life\ Admin/11\ Me/11.01\ Goals.md
   ```

5. **Open Bismuth**: Select `demo-vault` folder

**For Users** (post-demo):

1. **Download Installer**: [bismuth.app/download](https://bismuth.app/download)
2. **Install**: Run installer for your platform (macOS/Windows/Linux)
3. **Launch**: Open Bismuth from Applications
4. **Create Vault**: Click "Create Blank Vault" or "Use Template"
5. **Start Writing**: Create your first note with Cmd+N

---

## Phase 2: Implementation Timeline

### Week 1: Core Infrastructure

**Day 1: Project Setup** (4 hours)
- [x] Initialize Tauri + Svelte project
- [ ] Configure TailwindCSS
- [ ] Install CodeMirror 6, Phosphor Icons, force-graph
- [ ] Create basic 4-panel layout structure
- **Deliverable**: App opens with empty layout

**Day 2: Vault Management** (8 hours)
- [ ] Rust: `open_vault` command (scan directory, parse filenames)
- [ ] Rust: `Note` struct with JD ID parsing
- [ ] Svelte: `vault` store (writable)
- [ ] Svelte: Sidebar component (file tree display)
- **Deliverable**: Open folder, see markdown files in sidebar

**Day 3: Basic Editor** (8 hours)
- [ ] Rust: `read_note`, `write_note` commands
- [ ] Svelte: CodeMirror integration (markdown mode)
- [ ] Svelte: `selection` store (active note)
- [ ] Save on Cmd+S
- **Deliverable**: Open file, edit, save to disk

**Day 4: Johnny.Decimal Parsing** (8 hours)
- [ ] Rust: JD ID parser (`(\d{2})\.(\d{2})\s+(.+)\.md`)
- [ ] Rust: Add `jd_area`, `jd_category` to Note struct
- [ ] Svelte: JDBadge component
- [ ] Svelte: AreaSection component (group by area)
- **Deliverable**: Notes show JD badges, grouped by area

**Day 5: Wikilink Parsing** (8 hours)
- [ ] Rust: Wikilink parser (`\[\[([^\]]+)\]\]`)
- [ ] Rust: Add `outgoing_links` to Note struct
- [ ] Svelte: Compute backlinks (derived store)
- [ ] CodeMirror: Wikilink click handler
- [ ] Svelte: BacklinksPanel component
- **Deliverable**: Click wikilinks, see backlinks

### Week 2: Enhancement & Polish

**Day 6: JD Auto-Suggest** (8 hours)
- [ ] Rust: `suggest_next_jd_id` command
- [ ] Svelte: CreateNoteDialog component
- [ ] Show suggested ID, create note with JD filename
- **Deliverable**: Create note with auto-suggested JD ID

**Day 7: Simple Search** (8 hours)
- [ ] Rust: `search_notes` command (grep-like)
- [ ] Svelte: SearchInput component
- [ ] Filter note list by search results
- [ ] Highlight search term
- **Deliverable**: Search for text, see filtered results

**Day 8: Graph View** (8 hours)
- [ ] Svelte: GraphView component (force-graph)
- [ ] Build graph data from notes + wikilinks
- [ ] Click node → open note
- [ ] Right panel toggle: Backlinks ↔ Graph
- **Deliverable**: Visual graph of note connections

**Day 9: Keyboard Shortcuts** (6 hours)
- [ ] Cmd+N: Create note
- [ ] Cmd+P: Quick open (fuzzy search)
- [ ] Cmd+F: Search
- [ ] Cmd+G: Toggle graph view
- [ ] Cmd+\\: Toggle sidebar
- **Deliverable**: Keyboard-driven workflow

**Day 10: Polish & Demo Prep** (8 hours)
- [ ] Loading spinner during vault scan
- [ ] Error toast notifications
- [ ] Empty states (no vault, no notes, no results)
- [ ] Create demo vault (20-30 sample notes)
- [ ] Test on macOS, Windows, Linux
- [ ] Record demo video (5 minutes)
- **Deliverable**: Polished demo ready to show

---

## Success Criteria

### Functional Requirements

✅ **Must Work**:
1. Open vault (folder selection)
2. Scan markdown files (<3s for 500 files)
3. Display notes in sidebar (grouped by JD area)
4. Open note in editor (<200ms)
5. Edit note (CodeMirror, syntax highlighting)
6. Save note (disk-first, Cmd+S)
7. Parse JD IDs from filenames
8. Display JD badges on notes
9. Parse wikilinks from content
10. Click wikilink to navigate
11. Show backlinks panel
12. Auto-suggest next JD ID
13. Search notes (simple text search)
14. Display graph view (force-directed)
15. Keyboard shortcuts (Cmd+N, Cmd+P, Cmd+F, etc.)

⚠️ **May Have Bugs** (acceptable for demo):
- Edge cases in wikilink resolution
- Performance issues with >500 notes
- Cross-platform quirks
- File watching reliability

❌ **Not Required**:
- Full test coverage (90%)
- Comprehensive error handling
- Production-ready polish
- Advanced features (templates, Git, etc.)

### Non-Functional Requirements

**Performance** (from Technical Context):
- Vault scan: <3s for 500 files ✅
- Note open: <200ms ✅
- Editor typing: <16ms per frame (60fps) ✅
- Search: <200ms for 1000 notes ✅
- Graph render: <3s for 10,000 nodes ✅

**Usability**:
- Clear visual hierarchy (4-panel layout)
- Intuitive navigation (wikilinks, sidebar)
- Responsive UI (no lag on interactions)
- Helpful error messages (toast notifications)

**Reliability**:
- No data loss (disk-first writes)
- Graceful degradation (if file watcher fails, manual reload works)
- Cross-platform compatibility (macOS, Windows, Linux)

---

## Post-Demo Roadmap

### Phase 3: Production Hardening (Weeks 11-14)

**Testing**:
- Unit tests (Vitest): 90% coverage target
- E2E tests (Playwright): Critical user flows
- Performance tests: Benchmark vault operations
- Cross-platform tests: Automated CI on all platforms

**Error Handling**:
- Comprehensive error messages
- Retry logic for file operations
- Conflict resolution for external edits
- Crash recovery (auto-save, session restore)

**Polish**:
- Themes (light/dark mode)
- Settings panel (preferences, keybindings)
- Onboarding tutorial
- Help documentation

### Phase 4: Advanced Features (Weeks 15-20)

**Full Zettelkasten**:
- Timestamp-based IDs (`202405251912`)
- Note types (permanent, literature, fleeting, structure)
- Templates
- MOCs (Maps of Content)

**Advanced Search**:
- Tantivy integration (full-text search)
- Fuzzy matching
- Filter by metadata (tags, type, date)
- Saved searches

**Git Integration**:
- Auto-commit on save
- Diff view
- Version history
- Conflict resolution

### Phase 5: Intelligence Layer (Weeks 21-26)

**Lightweight Ontologies**:
- Concept extraction (NLP)
- Subsumption relationships
- Semantic search
- Concept recommendations

**GraphRAG**:
- Hierarchical lexical graph
- Multi-hop queries
- Vector + graph hybrid search
- Answer synthesis

---

## Appendix

### References

- **Tolaria Architecture**: `docs/TOLARIA_ARCHITECTURE_ANALYSIS.md`
- **Demo Plan**: `docs/DEMO_PLAN.md`
- **Demo Checklist**: `docs/DEMO_CHECKLIST.md`
- **Johnny.Decimal System**: Retrieved memory (complete documentation)
- **Research Decisions**: `specs/feature/001-bismuth-pkm-editor/research.md`

### Glossary

- **JD**: Johnny.Decimal (organization system)
- **ZK**: Zettelkasten (note-taking methodology)
- **MOC**: Map of Content (structure note)
- **Wikilink**: `[[Note Title]]` (internal link)
- **Backlink**: Reverse link (notes that link to current note)
- **JDex**: Johnny.Decimal Index (master record of all IDs)
- **Vault**: Root folder containing all notes
- **IPC**: Inter-Process Communication (Tauri commands/events)

---

**Plan Status**: ✅ Complete  
**Next Step**: Generate `data-model.md`, `contracts/`, `quickstart.md` (Phase 1 outputs)  
**Ready for**: `/speckit.tasks` command to generate task breakdown
