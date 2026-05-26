# Tolaria Architecture Analysis for Bismuth

## Executive Summary

This document analyzes Tolaria's production-grade architecture to inform Bismuth's design. Tolaria is a mature Tauri-based PKM application with 10,000+ note capacity, demonstrating battle-tested patterns for local-first knowledge management.

**Repository**: https://github.com/refactoringhq/tolaria  
**Analysis Date**: 2026-05-25  
**Bismuth Relevance**: High - Similar tech stack (Tauri + React/Svelte), local-first philosophy, markdown-based

---

## Table of Contents

1. [Core Architecture Principles](#core-architecture-principles)
2. [Tech Stack Comparison](#tech-stack-comparison)
3. [Four-Panel Layout System](#four-panel-layout-system)
4. [Data Model & State Management](#data-model--state-management)
5. [Component Architecture](#component-architecture)
6. [Constants & Configuration](#constants--configuration)
7. [Hook Patterns](#hook-patterns)
8. [File Organization](#file-organization)
9. [Views & UI Patterns](#views--ui-patterns)
10. [Button Standardization](#button-standardization)
11. [Implementation Recommendations](#implementation-recommendations)

---

## Core Architecture Principles

### 1. Filesystem as Single Source of Truth

**Tolaria's Principle**:
> "The vault is a folder of plain markdown files. The app never owns the data — it only reads and writes files. The cache, React state, and any in-memory representation are always derived from the filesystem and must be reconstructible by deleting them. When in doubt, the file on disk wins."

**Three Representations, One Authority**:
```
┌─────────────────────────────────────────────────────────┐
│ 1. FILESYSTEM (.md files on disk)                       │
│    - Single source of truth                             │
│    - Plain markdown + YAML frontmatter                   │
│    - Owned by Tauri Rust commands                       │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 2. CACHE (~/.laputa/cache/<hash>.json)                  │
│    - Fast startup index                                 │
│    - Always reconstructible from filesystem             │
│    - Owned by scan_vault_cached()                       │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 3. REACT STATE (VaultEntry[] in memory)                 │
│    - In-memory session state                            │
│    - Derived from cache or filesystem                   │
│    - Owned by useVaultLoader + hooks                    │
└─────────────────────────────────────────────────────────┘
```

**Bismuth Application**:
- ✅ Adopt same three-layer architecture
- ✅ Rust backend owns all filesystem writes
- ✅ Svelte stores for reactive state (instead of React)
- ✅ Cache in `~/.bismuth/cache/` for fast startup
- ✅ Invalidate cache on external changes

### 2. Convention Over Configuration

**Tolaria's Approach**:
- Standard field names (`type:`, `status:`, `url:`, `belongs_to:`, `related_to:`) have well-defined meanings
- Trigger specific UI behavior without setup
- Defaults work out of the box
- Users can override via config files in vault

**Semantic Field Names**:
| Field | Meaning | UI Behavior |
|-------|---------|-------------|
| `type:` | Entity type (Project, Person, etc.) | Type chip in note list + sidebar grouping |
| `status:` | Lifecycle stage (active, done, blocked) | Colored chip in note list + editor header |
| `icon:` | Per-note icon (emoji or Phosphor name) | Rendered on note title surfaces |
| `url:` | External link | Clickable link chip in editor header |
| `date:` | Single date | Formatted date badge |
| `start_date:` + `end_date:` | Duration/timespan | Date range badge |
| `belongs_to:` | Parent relationship | Humanized to "Belongs to" in UI |
| `related_to:` | Lateral relationship | Humanized to "Related to" in UI |

**System Properties (Underscore Convention)**:
```yaml
_pinned_properties:       # Which properties appear in editor inline bar
  - key: status
    icon: circle-dot
_icon: shapes             # Icon assigned to a type
_color: blue              # Color assigned to a type
_order: 10                # Sort order in sidebar
_sidebar_label: Projects  # Override label in sidebar
_width: wide              # Rich-editor width override
```

**Rule**: Any field starting with `_` is hidden from user-facing UI but editable in raw mode.

**Bismuth Application**:
- ✅ Adopt underscore convention for system fields
- ✅ Define standard semantic fields for Johnny.Decimal, Zettelkasten
- ✅ Example: `_jd_area`, `_jd_category`, `_zk_id`, `_ontology_concepts`

### 3. Disk-First Writes with Optimistic UI

**Invariants**:
1. **Disk-first writes**: All functions that change vault data must write to disk (via Tauri IPC) *before* updating React state
2. **Optimistic UI with rollback**: Where responsiveness matters, state may update before disk confirmation — but failure callback must revert
3. **No orphan state updates**: Never call `updateEntry()` before corresponding `handleUpdateFrontmatter()` has resolved
4. **Recovery via reload**: If state diverges from disk, `Reload Vault` invalidates cache and does full filesystem rescan

**Bismuth Application**:
- ✅ Implement same disk-first pattern in Rust commands
- ✅ Svelte stores update only after successful Tauri command
- ✅ Provide `reloadVault()` command for recovery
- ✅ Use optimistic updates for typing, with rollback on error

### 4. Where to Store State: Vault vs. App Settings

**Decision Framework**:
> "Would the user want this to follow them across all their Tolaria installations — other devices, future platforms?"

| Follows the Vault | Stays with Installation |
|-------------------|-------------------------|
| Type icon, type color | Editor zoom level |
| Pinned properties per type | API keys (OpenAI, Google) |
| Sidebar label overrides | Auto-sync interval |
| Property display order | Window size / position |
| Per-note `_width` override | Default rich-editor note width |
| Vault-authored `.gitignore` | Whether installation hides Gitignored files |

**Rule**: If it's about *how content is structured or presented*, store in vault. If it's about *this specific installation*, store in `~/.config/com.bismuth.app/settings.json` or localStorage.

**Bismuth Application**:
- ✅ Johnny.Decimal structure → Vault (in frontmatter or config files)
- ✅ Zettelkasten templates → Vault
- ✅ Editor preferences (zoom, theme) → Installation
- ✅ Window size, panel widths → Installation

---

## Tech Stack Comparison

| Layer | Tolaria | Bismuth | Notes |
|-------|---------|---------|-------|
| **Desktop Shell** | Tauri v2 (2.10.0) | Tauri v2 | ✅ Same |
| **Frontend** | React 19 + TypeScript 5.9 | Svelte 5 + TypeScript 5.9 | Different framework, same patterns |
| **Editor** | BlockNote 0.46.2 | CodeMirror 6 | Bismuth uses CodeMirror |
| **Code Highlighting** | @blocknote/code-block | CodeMirror extensions | Different approach |
| **Diagrams** | Mermaid 11.14.0 | Mermaid (planned) | Can adopt |
| **Whiteboard** | tldraw 4.5.10 | N/A | Optional for Bismuth |
| **Raw Editor** | CodeMirror 6 | CodeMirror 6 | ✅ Same |
| **Styling** | Tailwind CSS v4 + CSS variables | TailwindCSS v4 | ✅ Same |
| **UI Primitives** | Radix UI + shadcn/ui | shadcn/ui (Svelte) | Similar patterns |
| **Icons** | Phosphor Icons | Phosphor Icons | ✅ Same |
| **Build** | Vite 7.3.1 | Vite 7.x | ✅ Same |
| **Backend** | Rust (edition 2021) | Rust (edition 2021) | ✅ Same |
| **Frontmatter** | gray_matter (Rust) | gray_matter | ✅ Same |
| **Watcher** | notify 6.1 | notify | ✅ Same |
| **Search** | Keyword (walkdir-based) | Tantivy (full-text) | Bismuth more advanced |
| **Tests** | Vitest + Playwright + cargo test | Vitest + Playwright + cargo test | ✅ Same |
| **Package Manager** | pnpm | pnpm | ✅ Same |

**Key Takeaway**: Bismuth can adopt 90% of Tolaria's patterns with Svelte instead of React.

---

## Four-Panel Layout System

### Layout Structure

```
┌────────┬─────────────┬─────────────────────────┬────────────┐
│Sidebar │ Note List   │ Editor                  │ Right Panel│
│(250px) │ (300px)     │ (flex-1)                │ (280px)    │
│        │ OR          │                         │ OR         │
│ All    │ Pulse View  │ [Breadcrumb Bar]        │ TOC        │
│ Changes│             │                         │ OR         │
│ Pulse  │ [Search]    │ # My Note               │ AI Agent   │
│ Inbox  │ [Sort/Filt] │                         │            │
│        │             │                         │ Context    │
│Projects│ Note 1      │ Content here...         │ Messages   │
│Experim.│ Note 2      │ (BlockNote or Raw)      │ Actions    │
│Respons.│ Note 3      │                         │ Input      │
│People  │ ...         │                         │            │
│Events  │             │                         │            │
│Topics  │             │                         │            │
├────────┴─────────────┴─────────────────────────┴────────────┤
│ StatusBar: v0.4.2 │ main │ Synced 2m ago │ Vault: ~/Laputa │
└──────────────────────────────────────────────────────────────┘
```

### Panel Specifications

#### 1. Sidebar (220-400px, resizable)

**Components**:
- Top-level filters (All Notes, Changes, Pulse)
- Saved Views (YAML-based, ordered)
- Collapsible type-based section groups
- Dedicated folder tree

**Features**:
- Vault-root row labeled from opened vault path
- Root-level files shown when selected
- Nested user-created folders + default folders (`attachments/`, `views/`)
- `type/` directory hidden (types have own sidebar section)
- Drag-and-drop for reordering
- Right-click context menu (rename, delete, reveal, copy path)
- Auto-expand ancestor folders for current selection
- Drop targets: dropping note on type updates `type:` frontmatter, dropping on folder moves file

**Bismuth Adaptation**:
```svelte
<!-- Sidebar.svelte -->
<aside class="sidebar" style="width: {sidebarWidth}px">
  <!-- Top Filters -->
  <nav class="filters">
    <FilterItem icon="list" label="All Notes" />
    <FilterItem icon="git-branch" label="Changes" />
    <FilterItem icon="pulse" label="Pulse" />
    <FilterItem icon="inbox" label="Inbox" />
  </nav>
  
  <!-- Saved Views -->
  <section class="saved-views">
    <SectionHeader title="Views" />
    {#each savedViews as view}
      <ViewItem {view} />
    {/each}
  </section>
  
  <!-- Types (Johnny.Decimal Areas) -->
  <section class="types">
    <SectionHeader title="Areas" />
    {#each areas as area}
      <TypeSection {area} />
    {/each}
  </section>
  
  <!-- Folder Tree -->
  <section class="folders">
    <FolderTree root={vaultPath} />
  </section>
</aside>
```

#### 2. Note List / Pulse View (220-500px, resizable)

**Modes**:
1. **Filtered List**: Shows notes matching selected filter/type/view
2. **Neighborhood Mode**: When entity selected, shows relationships (outgoing first, then backlinks)
3. **Pulse View**: Chronological git activity feed grouped by day

**Features**:
- Snippets, modified dates, status indicators
- Per-context note-list controls (sort, filter, columns)
- Inbox organization auto-advance
- Non-Markdown files shown with indicators
- Saved views persist sort and column preferences

**Bismuth Adaptation**:
```svelte
<!-- NoteList.svelte -->
<div class="note-list" style="width: {noteListWidth}px">
  <!-- Controls -->
  <div class="controls">
    <SearchInput />
    <SortDropdown />
    <FilterBuilder />
  </div>
  
  <!-- List -->
  <div class="list">
    {#each filteredNotes as note}
      <NoteItem 
        {note}
        selected={note.path === activeNote?.path}
        on:click={() => openNote(note)}
        on:contextmenu={(e) => showContextMenu(e, note)}
      />
    {/each}
  </div>
</div>
```

#### 3. Editor (flex, fills remaining space)

**Features**:
- Single note open at a time (no tabs — see ADR-0003)
- Breadcrumb bar with filename controls
- Word count, width toggle, TOC action
- BlockNote rich text editor (Bismuth: CodeMirror)
- Toggle to diff view, raw CodeMirror view, or wide reading surface
- Inline images open in lightbox on double-click
- Binary files (images, audio, video, PDF) render through FilePreview
- Unsupported binaries show fallback + external-open controls

**Bismuth Adaptation**:
```svelte
<!-- Editor.svelte -->
<div class="editor">
  <!-- Breadcrumb Bar -->
  <BreadcrumbBar 
    {note}
    {wordCount}
    {noteWidth}
    on:toggleWidth
    on:openTOC
  />
  
  <!-- Editor Content -->
  {#if viewMode === 'rich'}
    <CodeMirrorEditor 
      content={note.content}
      on:change={handleChange}
    />
  {:else if viewMode === 'raw'}
    <RawEditor 
      content={note.rawContent}
      on:change={handleRawChange}
    />
  {:else if viewMode === 'diff'}
    <DiffView 
      original={note.original}
      modified={note.content}
    />
  {/if}
</div>
```

#### 4. Right Panel (200-500px or hidden)

**Mutually Exclusive Panels**:
- **Properties**: Frontmatter, relationships, instances, backlinks, git history
- **Table of Contents**: Lazy-mounted, H1/H2/H3 hierarchy via Web Worker
- **AI Agent**: CLI/API target controller, tool execution, chat state

**Features**:
- Breadcrumb bar toggles between panels
- Per-note `icon` field editable from Properties
- Type notes show **Instances** section (all notes of that type)

**Bismuth Adaptation**:
```svelte
<!-- EditorRightPanel.svelte -->
<aside class="right-panel" style="width: {inspectorWidth}px">
  {#if activePanel === 'properties'}
    <PropertiesPanel {note} />
  {:else if activePanel === 'toc'}
    <TableOfContentsPanel {note} />
  {:else if activePanel === 'ai'}
    <AiPanel {note} />
  {/if}
</aside>
```

### Resizable Panels

**Implementation** (`ResizeHandle.tsx`):
```typescript
// Tolaria pattern
export function ResizeHandle({ 
  direction, 
  onResize 
}: ResizeHandleProps) {
  const handleMouseDown = (e: React.MouseEvent) => {
    const startX = e.clientX
    const startY = e.clientY
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX
      const deltaY = e.clientY - startY
      onResize(direction === 'horizontal' ? deltaX : deltaY)
    }
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }
  
  return (
    <div 
      className="resize-handle"
      onMouseDown={handleMouseDown}
    />
  )
}
```

**Bismuth Adaptation**:
```svelte
<!-- ResizeHandle.svelte -->
<script lang="ts">
  export let direction: 'horizontal' | 'vertical'
  export let onResize: (delta: number) => void
  
  function handleMouseDown(e: MouseEvent) {
    const startX = e.clientX
    const startY = e.clientY
    
    function handleMouseMove(e: MouseEvent) {
      const delta = direction === 'horizontal' 
        ? e.clientX - startX 
        : e.clientY - startY
      onResize(delta)
    }
    
    function handleMouseUp() {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }
</script>

<div 
  class="resize-handle {direction}"
  on:mousedown={handleMouseDown}
/>
```

### Layout Persistence

**Tolaria Pattern** (`useLayoutPanels.ts`):
```typescript
export function useLayoutPanels() {
  const [sidebarWidth, setSidebarWidth] = useState(() => 
    parseInt(localStorage.getItem('tolaria:layout-panels:sidebar') || '250')
  )
  
  const [noteListWidth, setNoteListWidth] = useState(() =>
    parseInt(localStorage.getItem('tolaria:layout-panels:noteList') || '300')
  )
  
  const [inspectorWidth, setInspectorWidth] = useState(() =>
    parseInt(localStorage.getItem('tolaria:layout-panels:inspector') || '280')
  )
  
  useEffect(() => {
    localStorage.setItem('tolaria:layout-panels:sidebar', sidebarWidth.toString())
  }, [sidebarWidth])
  
  // ... similar for other panels
  
  return {
    sidebarWidth,
    setSidebarWidth: (width: number) => setSidebarWidth(clamp(width, 220, 400)),
    noteListWidth,
    setNoteListWidth: (width: number) => setNoteListWidth(clamp(width, 220, 500)),
    inspectorWidth,
    setInspectorWidth: (width: number) => setInspectorWidth(clamp(width, 200, 500)),
  }
}
```

**Bismuth Adaptation**:
```typescript
// stores/layout.ts
import { writable } from 'svelte/store'

function createLayoutStore() {
  const sidebar = writable(
    parseInt(localStorage.getItem('bismuth:layout:sidebar') || '250')
  )
  const noteList = writable(
    parseInt(localStorage.getItem('bismuth:layout:noteList') || '300')
  )
  const inspector = writable(
    parseInt(localStorage.getItem('bismuth:layout:inspector') || '280')
  )
  
  sidebar.subscribe(value => {
    localStorage.setItem('bismuth:layout:sidebar', value.toString())
  })
  
  // ... similar for other panels
  
  return {
    sidebar,
    noteList,
    inspector,
    setSidebarWidth: (width: number) => sidebar.set(clamp(width, 220, 400)),
    setNoteListWidth: (width: number) => noteList.set(clamp(width, 220, 500)),
    setInspectorWidth: (width: number) => inspector.set(clamp(width, 200, 500)),
  }
}

export const layout = createLayoutStore()
```

---

## Data Model & State Management

### VaultEntry (Core Data Type)

**Tolaria Definition** (`src/types.ts`):
```typescript
interface VaultEntry {
  path: string              // Absolute file path
  filename: string          // Just the filename
  title: string             // From first # heading, or filename fallback
  isA: string | null        // Entity type: Project, Person, etc. (from `type:`)
  aliases: string[]         // Alternative names for wikilink resolution
  belongsTo: string[]       // Parent relationships (wikilinks)
  relatedTo: string[]       // Related entity links (wikilinks)
  relationships: Record<string, string[]>  // All frontmatter fields containing wikilinks
  outgoingLinks: string[]   // All [[wikilinks]] found in note body
  status: string | null     // Active, Done, Paused, Archived, Dropped
  noteWidth?: 'normal' | 'wide' | null // Rich-editor width mode from `_width`
  modifiedAt: number | null // Unix timestamp (seconds)
  createdAt: number | null  // Unix timestamp (seconds)
  fileSize: number
  wordCount: number | null  // Body word count (excludes frontmatter)
  snippet: string | null    // First 200 chars of body
  workspace?: WorkspaceIdentity // Mounted-workspace provenance
  archived: boolean         // Archived flag
  trashed: boolean          // Legacy (Trash system removed)
  trashedAt: number | null  // Legacy
  properties: Record<string, VaultPropertyValue>  // Custom properties
  fileKind?: 'markdown' | 'text' | 'binary'  // Controls editor behavior
}
```

**Bismuth Adaptation**:
```typescript
// src/types/vault.ts
interface BismuthEntry {
  // Core identifiers
  path: string
  filename: string
  title: string
  
  // Johnny.Decimal
  jdId: string | null       // "15.52"
  jdArea: number | null     // 10
  jdCategory: number | null // 15
  jdItemNumber: number | null // 52
  
  // Zettelkasten
  zkId: string | null       // "202405251912"
  zkType: 'permanent' | 'literature' | 'fleeting' | 'structure' | null
  
  // Ontology
  concepts: string[]        // Extracted concepts
  ontologyRelations: Record<string, string[]> // Concept relationships
  
  // Standard fields
  type: string | null       // Note type
  status: string | null     // Status
  tags: string[]            // Tags
  aliases: string[]         // Aliases
  
  // Relationships
  belongsTo: string[]       // Parent links
  relatedTo: string[]       // Related links
  outgoingLinks: string[]   // All wikilinks
  backlinks: string[]       // Incoming links
  
  // Metadata
  modifiedAt: number | null
  createdAt: number | null
  fileSize: number
  wordCount: number | null
  snippet: string | null
  
  // System
  archived: boolean
  properties: Record<string, any>
  fileKind: 'markdown' | 'text' | 'binary'
}
```

### State Management Pattern

**Tolaria Approach** (React):
```typescript
// useVaultLoader.ts
export function useVaultLoader() {
  const [entries, setEntries] = useState<VaultEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  useEffect(() => {
    async function loadVault() {
      try {
        setIsLoading(true)
        const result = await invoke<VaultEntry[]>('scan_vault_cached', {
          vaultPath: currentVaultPath
        })
        setEntries(result)
      } catch (err) {
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadVault()
  }, [currentVaultPath])
  
  return { entries, isLoading, error }
}
```

**Bismuth Adaptation** (Svelte):
```typescript
// stores/vault.ts
import { writable, derived } from 'svelte/store'
import { invoke } from '@tauri-apps/api/tauri'

function createVaultStore() {
  const entries = writable<BismuthEntry[]>([])
  const isLoading = writable(true)
  const error = writable<Error | null>(null)
  const currentVaultPath = writable<string | null>(null)
  
  async function loadVault(vaultPath: string) {
    try {
      isLoading.set(true)
      error.set(null)
      
      const result = await invoke<BismuthEntry[]>('scan_vault_cached', {
        vaultPath
      })
      
      entries.set(result)
      currentVaultPath.set(vaultPath)
    } catch (err) {
      error.set(err as Error)
    } finally {
      isLoading.set(false)
    }
  }
  
  async function reloadVault() {
    const path = get(currentVaultPath)
    if (path) {
      await invoke('invalidate_cache', { vaultPath: path })
      await loadVault(path)
    }
  }
  
  return {
    entries,
    isLoading,
    error,
    currentVaultPath,
    loadVault,
    reloadVault,
  }
}

export const vault = createVaultStore()

// Derived stores
export const entriesByType = derived(
  vault.entries,
  $entries => groupBy($entries, 'type')
)

export const entriesByJDArea = derived(
  vault.entries,
  $entries => groupBy($entries, 'jdArea')
)
```

---

## Constants & Configuration

### App Storage Keys

**Tolaria Pattern** (`src/constants/appStorage.ts`):
```typescript
export const APP_STORAGE_KEYS = {
  theme: 'tolaria-theme',
  zoom: 'tolaria:zoom-level',
  viewMode: 'tolaria-view-mode',
  tagColors: 'tolaria:tag-color-overrides',
  statusColors: 'tolaria:status-color-overrides',
  propertyModes: 'tolaria:display-mode-overrides',
  configMigrationFlag: 'tolaria:config-migrated-to-vault',
  legacyMigrationFlag: 'tolaria:legacy-storage-migrated',
  sortPreferences: 'tolaria-sort-preferences',
  sidebarCollapsed: 'tolaria:sidebar-collapsed',
  layoutPanels: 'tolaria:layout-panels',
  welcomeDismissed: 'tolaria_welcome_dismissed',
} as const
```

**Bismuth Adaptation**:
```typescript
// src/constants/appStorage.ts
export const APP_STORAGE_KEYS = {
  // Theme & Display
  theme: 'bismuth:theme',
  zoom: 'bismuth:zoom-level',
  viewMode: 'bismuth:view-mode',
  editorFont: 'bismuth:editor-font',
  editorFontSize: 'bismuth:editor-font-size',
  
  // Colors
  tagColors: 'bismuth:tag-color-overrides',
  statusColors: 'bismuth:status-color-overrides',
  jdAreaColors: 'bismuth:jd-area-colors',
  
  // Layout
  sidebarCollapsed: 'bismuth:sidebar-collapsed',
  layoutPanels: 'bismuth:layout-panels',
  panelWidths: 'bismuth:panel-widths',
  
  // Preferences
  sortPreferences: 'bismuth:sort-preferences',
  filterPreferences: 'bismuth:filter-preferences',
  
  // Features
  jdEnabled: 'bismuth:jd-enabled',
  zkEnabled: 'bismuth:zk-enabled',
  ontologyEnabled: 'bismuth:ontology-enabled',
  
  // Onboarding
  welcomeDismissed: 'bismuth:welcome-dismissed',
  tutorialCompleted: 'bismuth:tutorial-completed',
  
  // Migration
  configMigrated: 'bismuth:config-migrated-to-vault',
  legacyMigrated: 'bismuth:legacy-storage-migrated',
} as const

export type AppStorageKey = keyof typeof APP_STORAGE_KEYS

export function getAppStorageItem(key: AppStorageKey): string | null {
  try {
    return localStorage.getItem(APP_STORAGE_KEYS[key])
  } catch {
    return null
  }
}

export function setAppStorageItem(key: AppStorageKey, value: string): void {
  try {
    localStorage.setItem(APP_STORAGE_KEYS[key], value)
  } catch {
    // Ignore storage errors
  }
}
```

### Configuration Files

**Tolaria Vault Config Structure**:
```
vault/
├── config/
│   ├── relations.md          # Custom relationship definitions
│   ├── semantic-properties.md # Property semantics
│   └── types.md              # Type definitions
├── views/                    # Saved views (YAML files)
│   ├── active-projects.yml
│   └── recent-notes.yml
└── type/                     # Type documents
    ├── Project.md
    ├── Person.md
    └── Event.md
```

**Bismuth Vault Config Structure**:
```
vault/
├── .bismuth/
│   ├── config/
│   │   ├── johnny-decimal.yml    # JD structure definition
│   │   ├── zettelkasten.yml      # ZK settings
│   │   ├── ontology.yml          # Ontology configuration
│   │   └── relations.yml         # Relationship definitions
│   ├── views/                    # Saved views
│   │   ├── all-notes.yml
│   │   ├── inbox.yml
│   │   └── recent.yml
│   └── templates/                # Note templates
│       ├── permanent-note.md
│       ├── literature-note.md
│       └── project.md
├── type/                         # Type documents (Tolaria pattern)
│   ├── Project.md
│   └── Person.md
└── [user notes]
```

---

## Component Architecture

### Component Organization

**Tolaria Structure**:
```
src/components/
├── App.tsx                   # Main orchestrator
├── WelcomeScreen.tsx         # Onboarding
├── Sidebar.tsx               # Left navigation
├── NoteList.tsx              # Middle panel
├── Editor.tsx                # Main editor
├── EditorRightPanel.tsx      # Right panel
├── StatusBar.tsx             # Bottom bar
├── CommandPalette.tsx        # Cmd+K launcher
├── SearchPanel.tsx           # Search UI
├── PulseView.tsx             # Git activity feed
├── Inspector.tsx             # Properties panel
├── TableOfContentsPanel.tsx  # TOC panel
├── AiPanel.tsx               # AI agent panel
├── ui/                       # Reusable UI components
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Dialog.tsx
│   └── ...
└── [feature-specific]/
    ├── BreadcrumbBar.tsx
    ├── NoteItem.tsx
    ├── FolderTree.tsx
    └── ...
```

**Bismuth Adaptation**:
```
src/lib/components/
├── App.svelte                # Main orchestrator
├── WelcomeScreen.svelte      # Onboarding
├── layout/
│   ├── Sidebar.svelte        # Left navigation
│   ├── NoteList.svelte       # Middle panel
│   ├── Editor.svelte         # Main editor
│   ├── RightPanel.svelte     # Right panel
│   └── StatusBar.svelte      # Bottom bar
├── features/
│   ├── vault/
│   │   ├── VaultManager.svelte
│   │   └── VaultSettings.svelte
│   ├── johnny-decimal/
│   │   ├── JDNavigator.svelte
│   │   ├── JDCategoryBrowser.svelte
│   │   └── JDAutoSuggest.svelte
│   ├── zettelkasten/
│   │   ├── ZKNoteCreator.svelte
│   │   ├── ZKBacklinks.svelte
│   │   └── ZKGraph.svelte
│   ├── search/
│   │   ├── SearchPanel.svelte
│   │   └── SearchResults.svelte
│   └── graph/
│       └── GraphView.svelte
├── ui/                       # Reusable UI (shadcn/ui Svelte)
│   ├── button/
│   ├── input/
│   ├── dialog/
│   └── ...
└── shared/
    ├── BreadcrumbBar.svelte
    ├── NoteItem.svelte
    ├── FolderTree.svelte
    └── ResizeHandle.svelte
```

### Component Patterns

#### 1. Container/Presenter Pattern

**Tolaria Example** (`NoteList.tsx`):
```typescript
// Container (logic)
export function NoteList() {
  const { entries, isLoading } = useVaultLoader()
  const { selectedNote, selectNote } = useNoteSelection()
  const { sortBy, filterBy } = useNoteListControls()
  
  const filteredNotes = useMemo(() => 
    entries
      .filter(filterBy)
      .sort(sortBy),
    [entries, filterBy, sortBy]
  )
  
  return (
    <NoteListPresenter 
      notes={filteredNotes}
      selectedNote={selectedNote}
      onSelectNote={selectNote}
      isLoading={isLoading}
    />
  )
}

// Presenter (UI)
function NoteListPresenter({ notes, selectedNote, onSelectNote, isLoading }) {
  if (isLoading) return <LoadingSpinner />
  
  return (
    <div className="note-list">
      {notes.map(note => (
        <NoteItem 
          key={note.path}
          note={note}
          selected={note.path === selectedNote?.path}
          onClick={() => onSelectNote(note)}
        />
      ))}
    </div>
  )
}
```

**Bismuth Adaptation**:
```svelte
<!-- NoteList.svelte (Container) -->
<script lang="ts">
  import { vault } from '$lib/stores/vault'
  import { noteSelection } from '$lib/stores/selection'
  import { noteListControls } from '$lib/stores/controls'
  import NoteListPresenter from './NoteListPresenter.svelte'
  
  $: filteredNotes = $vault.entries
    .filter($noteListControls.filterBy)
    .sort($noteListControls.sortBy)
</script>

<NoteListPresenter 
  notes={filteredNotes}
  selectedNote={$noteSelection.selectedNote}
  onSelectNote={noteSelection.select}
  isLoading={$vault.isLoading}
/>

<!-- NoteListPresenter.svelte (Presenter) -->
<script lang="ts">
  export let notes: BismuthEntry[]
  export let selectedNote: BismuthEntry | null
  export let onSelectNote: (note: BismuthEntry) => void
  export let isLoading: boolean
</script>

{#if isLoading}
  <LoadingSpinner />
{:else}
  <div class="note-list">
    {#each notes as note (note.path)}
      <NoteItem 
        {note}
        selected={note.path === selectedNote?.path}
        on:click={() => onSelectNote(note)}
      />
    {/each}
  </div>
{/if}
```

#### 2. Compound Components Pattern

**Tolaria Example** (`Sidebar.tsx`):
```typescript
export function Sidebar() {
  return (
    <aside className="sidebar">
      <SidebarFilters />
      <SidebarViews />
      <SidebarTypes />
      <SidebarFolders />
    </aside>
  )
}

function SidebarFilters() {
  return (
    <nav className="filters">
      <FilterItem icon="list" label="All Notes" />
      <FilterItem icon="git-branch" label="Changes" />
      <FilterItem icon="pulse" label="Pulse" />
    </nav>
  )
}
```

**Bismuth Adaptation**:
```svelte
<!-- Sidebar.svelte -->
<script lang="ts">
  import SidebarFilters from './SidebarFilters.svelte'
  import SidebarViews from './SidebarViews.svelte'
  import SidebarAreas from './SidebarAreas.svelte'
  import SidebarFolders from './SidebarFolders.svelte'
</script>

<aside class="sidebar">
  <SidebarFilters />
  <SidebarViews />
  <SidebarAreas />
  <SidebarFolders />
</aside>

<!-- SidebarFilters.svelte -->
<script lang="ts">
  import FilterItem from './FilterItem.svelte'
</script>

<nav class="filters">
  <FilterItem icon="list" label="All Notes" />
  <FilterItem icon="git-branch" label="Changes" />
  <FilterItem icon="pulse" label="Pulse" />
  <FilterItem icon="inbox" label="Inbox" />
</nav>
```

---

## Hook Patterns

### Custom Hooks in Tolaria

**Common Patterns**:
1. **Data Loading**: `useVaultLoader`, `useNoteSearch`
2. **Actions**: `useNoteActions`, `useEntryActions`, `useFolderActions`
3. **UI State**: `useViewMode`, `useTheme`, `useZoom`
4. **Keyboard**: `useKeyboardNavigation`, `useAppKeyboard`
5. **Git**: `useGitRepositories`, `useCommitFlow`, `useAutoGit`

**Example** (`useNoteActions.ts`):
```typescript
export function useNoteActions() {
  const { entries, updateEntry } = useVaultLoader()
  
  const createNote = useCallback(async (title: string, type?: string) => {
    const path = await invoke('create_note', { title, type })
    const newEntry = await invoke('get_entry', { path })
    updateEntry(newEntry)
    return newEntry
  }, [updateEntry])
  
  const deleteNote = useCallback(async (path: string) => {
    await invoke('delete_note', { path })
    updateEntry(null, path) // Remove from state
  }, [updateEntry])
  
  const updateFrontmatter = useCallback(async (
    path: string, 
    key: string, 
    value: any
  ) => {
    await invoke('update_frontmatter', { path, key, value })
    const updatedEntry = await invoke('get_entry', { path })
    updateEntry(updatedEntry)
  }, [updateEntry])
  
  return {
    createNote,
    deleteNote,
    updateFrontmatter,
  }
}
```

### Svelte Equivalent (Actions/Stores)

**Bismuth Adaptation**:
```typescript
// stores/noteActions.ts
import { get } from 'svelte/store'
import { invoke } from '@tauri-apps/api/tauri'
import { vault } from './vault'

export const noteActions = {
  async createNote(title: string, type?: string) {
    const path = await invoke<string>('create_note', { title, type })
    const newEntry = await invoke<BismuthEntry>('get_entry', { path })
    
    vault.entries.update(entries => [...entries, newEntry])
    
    return newEntry
  },
  
  async deleteNote(path: string) {
    await invoke('delete_note', { path })
    
    vault.entries.update(entries => 
      entries.filter(e => e.path !== path)
    )
  },
  
  async updateFrontmatter(path: string, key: string, value: any) {
    await invoke('update_frontmatter', { path, key, value })
    
    const updatedEntry = await invoke<BismuthEntry>('get_entry', { path })
    
    vault.entries.update(entries =>
      entries.map(e => e.path === path ? updatedEntry : e)
    )
  },
}
```

**Usage in Component**:
```svelte
<script lang="ts">
  import { noteActions } from '$lib/stores/noteActions'
  
  async function handleCreateNote() {
    const note = await noteActions.createNote('New Note', 'Project')
    // Note automatically added to vault.entries
  }
</script>

<button on:click={handleCreateNote}>
  Create Note
</button>
```

---

## Views & UI Patterns

### Saved Views (YAML-based)

**Tolaria Pattern** (`views/active-projects.yml`):
```yaml
name: Active Projects
filter:
  type: Project
  status: active
sort: modified_at
order: desc
listPropertiesDisplay:
  - status
  - owner
  - due_date
```

**Bismuth Adaptation** (`.bismuth/views/active-projects.yml`):
```yaml
name: Active Projects
description: All active projects sorted by modified date
filter:
  type: Project
  status: active
  jdArea: 20  # Projects area
sort: modified_at
order: desc
columns:
  - status
  - owner
  - jdId
  - modifiedAt
icon: folder
color: blue
```

### Filter Builder

**Tolaria Pattern** (`FilterBuilder.tsx`):
```typescript
export function FilterBuilder() {
  const [filters, setFilters] = useState<Filter[]>([])
  
  const addFilter = () => {
    setFilters([...filters, { field: '', operator: '', value: '' }])
  }
  
  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index))
  }
  
  return (
    <div className="filter-builder">
      {filters.map((filter, index) => (
        <FilterRow 
          key={index}
          filter={filter}
          onChange={(updated) => {
            const newFilters = [...filters]
            newFilters[index] = updated
            setFilters(newFilters)
          }}
          onRemove={() => removeFilter(index)}
        />
      ))}
      <button onClick={addFilter}>Add Filter</button>
    </div>
  )
}
```

**Bismuth Adaptation**:
```svelte
<!-- FilterBuilder.svelte -->
<script lang="ts">
  import { writable } from 'svelte/store'
  import FilterRow from './FilterRow.svelte'
  
  interface Filter {
    field: string
    operator: string
    value: string
  }
  
  let filters = writable<Filter[]>([])
  
  function addFilter() {
    filters.update(f => [...f, { field: '', operator: '', value: '' }])
  }
  
  function removeFilter(index: number) {
    filters.update(f => f.filter((_, i) => i !== index))
  }
  
  function updateFilter(index: number, updated: Filter) {
    filters.update(f => {
      const newFilters = [...f]
      newFilters[index] = updated
      return newFilters
    })
  }
</script>

<div class="filter-builder">
  {#each $filters as filter, index}
    <FilterRow 
      {filter}
      on:change={(e) => updateFilter(index, e.detail)}
      on:remove={() => removeFilter(index)}
    />
  {/each}
  <button on:click={addFilter}>Add Filter</button>
</div>
```

---

## Button Standardization

### Button Component Hierarchy

**Tolaria Pattern** (`ui/button.tsx`):
```typescript
import { cva, type VariantProps } from 'class-variance-authority'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
```

**Bismuth Adaptation** (`ui/button/Button.svelte`):
```svelte
<script lang="ts">
  import { cn } from '$lib/utils'
  import { cva, type VariantProps } from 'class-variance-authority'
  
  const buttonVariants = cva(
    'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
    {
      variants: {
        variant: {
          default: 'bg-primary text-primary-foreground hover:bg-primary/90',
          destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
          outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
          secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
          ghost: 'hover:bg-accent hover:text-accent-foreground',
          link: 'text-primary underline-offset-4 hover:underline',
        },
        size: {
          default: 'h-10 px-4 py-2',
          sm: 'h-9 rounded-md px-3',
          lg: 'h-11 rounded-md px-8',
          icon: 'h-10 w-10',
        },
      },
      defaultVariants: {
        variant: 'default',
        size: 'default',
      },
    }
  )
  
  type Variant = VariantProps<typeof buttonVariants>['variant']
  type Size = VariantProps<typeof buttonVariants>['size']
  
  export let variant: Variant = 'default'
  export let size: Size = 'default'
  export let disabled = false
  
  let className = ''
  export { className as class }
</script>

<button
  class={cn(buttonVariants({ variant, size }), className)}
  {disabled}
  on:click
  {...$$restProps}
>
  <slot />
</button>
```

### Common Button Patterns

**1. Icon Button**:
```svelte
<Button variant="ghost" size="icon">
  <Icon name="plus" />
</Button>
```

**2. Button with Icon**:
```svelte
<Button>
  <Icon name="plus" class="mr-2 h-4 w-4" />
  Create Note
</Button>
```

**3. Destructive Action**:
```svelte
<Button variant="destructive">
  Delete Note
</Button>
```

**4. Secondary Action**:
```svelte
<Button variant="outline">
  Cancel
</Button>
```

---

## Implementation Recommendations

### Phase 1: Core Infrastructure (Weeks 1-2)

**Priority 1: Layout System**
- ✅ Four-panel layout with resizable panels
- ✅ Panel width persistence in localStorage
- ✅ Responsive breakpoints
- ✅ Keyboard shortcuts for panel toggling

**Files to Create**:
```
src/lib/components/layout/
├── MainLayout.svelte
├── Sidebar.svelte
├── NoteList.svelte
├── Editor.svelte
├── RightPanel.svelte
├── StatusBar.svelte
└── ResizeHandle.svelte

src/lib/stores/
├── layout.ts
├── vault.ts
└── selection.ts

src/lib/constants/
├── appStorage.ts
└── layout.ts
```

**Priority 2: Data Model**
- ✅ VaultEntry type definition
- ✅ Vault store with Svelte stores
- ✅ Tauri commands for vault operations
- ✅ Cache system for fast startup

**Files to Create**:
```
src/types/
├── vault.ts
├── entry.ts
└── config.ts

src-tauri/src/vault/
├── mod.rs
├── scanner.rs
├── cache.rs
└── frontmatter.rs

src/lib/stores/
├── vault.ts
└── entries.ts
```

### Phase 2: Component Library (Weeks 3-4)

**Priority 1: UI Components (shadcn/ui Svelte)**
- ✅ Button, Input, Dialog, Dropdown
- ✅ Tooltip, Popover, Select
- ✅ Toast notifications
- ✅ Loading states

**Files to Create**:
```
src/lib/components/ui/
├── button/
├── input/
├── dialog/
├── dropdown/
├── tooltip/
├── popover/
├── select/
├── toast/
└── loading/
```

**Priority 2: Feature Components**
- ✅ NoteItem, FolderTree, BreadcrumbBar
- ✅ FilterBuilder, SortDropdown
- ✅ SearchPanel, CommandPalette

**Files to Create**:
```
src/lib/components/shared/
├── NoteItem.svelte
├── FolderTree.svelte
├── BreadcrumbBar.svelte
├── FilterBuilder.svelte
├── SortDropdown.svelte
├── SearchPanel.svelte
└── CommandPalette.svelte
```

### Phase 3: Feature Modules (Weeks 5-14)

**Priority 1: Vault Management (US1)**
- ✅ Vault creation, opening, closing
- ✅ Vault switcher
- ✅ Vault settings

**Priority 2: Johnny.Decimal (Phased)**
- ✅ JD structure validation
- ✅ Auto-suggest next ID
- ✅ Category browser
- ✅ JDex integration

**Priority 3: Zettelkasten (US2)**
- ✅ Wikilinks
- ✅ Backlinks
- ✅ Graph view
- ✅ Note creation workflow

**Priority 4: Search (US7)**
- ✅ Full-text search with Tantivy
- ✅ Category search
- ✅ Filter builder
- ✅ Search results

### Phase 4: Polish & Optimization (Ongoing)

**Performance**:
- ✅ Virtual scrolling for large note lists
- ✅ Debounced search
- ✅ Lazy loading for panels
- ✅ Web Workers for heavy computation

**Accessibility**:
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ Focus management
- ✅ ARIA labels

**Testing**:
- ✅ Unit tests (Vitest)
- ✅ E2E tests (Playwright)
- ✅ Integration tests
- ✅ Performance tests

---

## Key Learnings from Tolaria

### 1. **Filesystem is King**
- Never own the data
- Cache is always disposable
- Disk writes before state updates
- Provide reload/recovery mechanisms

### 2. **Convention Over Configuration**
- Standard field names have meaning
- Underscore prefix for system fields
- Sensible defaults that work out of the box
- Config files for power users

### 3. **Modular Architecture**
- Features are self-contained
- Clear separation of concerns
- Hooks/stores for reusable logic
- Component composition over inheritance

### 4. **Performance Matters**
- Cache for fast startup
- Virtual scrolling for large lists
- Debounced operations
- Web Workers for heavy tasks
- Progressive loading

### 5. **User Experience First**
- Keyboard shortcuts everywhere
- Responsive UI with loading states
- Graceful error handling
- Undo/redo support
- Contextual help

### 6. **Local-First Philosophy**
- No cloud dependencies
- Git for version control
- Plain text files
- Export capabilities
- User owns their data

---

## Conclusion

Tolaria provides a battle-tested blueprint for building a production-grade PKM application with Tauri. Bismuth can adopt:

✅ **Architecture Patterns**: Three-layer data model, disk-first writes, convention over configuration  
✅ **Layout System**: Four-panel resizable layout with persistence  
✅ **Component Patterns**: Container/presenter, compound components, reusable UI  
✅ **State Management**: Svelte stores instead of React hooks, same patterns  
✅ **Constants & Config**: Standardized storage keys, vault-based configuration  
✅ **Performance**: Caching, virtual scrolling, lazy loading, Web Workers  

**Next Steps**:
1. Implement core layout system
2. Build data model and vault store
3. Create component library
4. Develop feature modules following modular architecture
5. Optimize and polish

**Documentation Date**: 2026-05-25  
**Analyzed By**: Cascade AI  
**Repository**: https://github.com/refactoringhq/tolaria  
**Bismuth Repository**: /Users/yeabsiramoges/Desktop/bismuth
