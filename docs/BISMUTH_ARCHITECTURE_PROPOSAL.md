# Bismuth Architecture Proposal

## Executive Summary

This document proposes a comprehensive architecture for Bismuth, a next-generation Personal Knowledge Management (PKM) system that integrates:

1. **Johnny.Decimal** - Physical organization (10-folder hierarchy)
2. **Zettelkasten** - Conceptual connections (atomic notes + wikilinks)
3. **Lightweight Ontologies** - Semantic intelligence (concept extraction)
4. **GraphRAG** - Multi-hop retrieval (knowledge graph + vector search)
5. **Posner Workflow** - Research asset management (capture, metadata, retrieval)

**Inspired by**: Tolaria's production-grade architecture  
**Tech Stack**: Tauri v2 + Svelte 5 + Rust + TypeScript  
**Philosophy**: Local-first, filesystem as truth, convention over configuration

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Core Principles](#core-principles)
3. [Data Model](#data-model)
4. [Four-Panel Layout](#four-panel-layout)
5. [Feature Modules](#feature-modules)
6. [Component Architecture](#component-architecture)
7. [State Management](#state-management)
8. [Constants & Configuration](#constants--configuration)
9. [Views & Filters](#views--filters)
10. [Button Standardization](#button-standardization)
11. [Implementation Roadmap](#implementation-roadmap)

---

## System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      BISMUTH APPLICATION                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Sidebar   │  │ Note List  │  │   Editor   │  Right     │
│  │            │  │            │  │            │  Panel      │
│  │ • Filters  │  │ • Search   │  │ • CodeMir  │            │
│  │ • Views    │  │ • Sort     │  │ • Preview  │ • Props    │
│  │ • JD Areas │  │ • Filter   │  │ • Raw      │ • TOC      │
│  │ • Folders  │  │ • Items    │  │ • Diff     │ • Graph    │
│  └────────────┘  └────────────┘  └────────────┘            │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                        Status Bar                            │
│  Version │ Branch │ Sync Status │ Vault │ JD Mode │ ZK Mode │
└─────────────────────────────────────────────────────────────┘
         ↓                    ↓                    ↓
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Svelte Stores  │  │  Tauri Commands │  │  Rust Backend   │
│                 │  │                 │  │                 │
│ • vault         │  │ • scan_vault    │  │ • vault/        │
│ • entries       │  │ • create_note   │  │ • jd/           │
│ • selection     │  │ • update_fm     │  │ • zk/           │
│ • layout        │  │ • search        │  │ • ontology/     │
│ • graph         │  │ • graph_query   │  │ • graphrag/     │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         ↓                    ↓                    ↓
┌─────────────────────────────────────────────────────────────┐
│                    FILESYSTEM (Source of Truth)              │
│                                                              │
│  vault/                                                      │
│  ├── .bismuth/                                               │
│  │   ├── config/                                             │
│  │   │   ├── johnny-decimal.yml                              │
│  │   │   ├── zettelkasten.yml                                │
│  │   │   ├── ontology.yml                                    │
│  │   │   └── graphrag.yml                                    │
│  │   ├── cache/                                              │
│  │   │   ├── entries.json                                    │
│  │   │   ├── graph.db                                        │
│  │   │   └── search.index                                    │
│  │   ├── views/                                              │
│  │   │   ├── all-notes.yml                                   │
│  │   │   └── inbox.yml                                       │
│  │   └── templates/                                          │
│  │       ├── permanent-note.md                               │
│  │       └── literature-note.md                              │
│  ├── 10-19 Life Admin/                                       │
│  │   ├── 11 Me/                                              │
│  │   │   ├── 11.01 Personal Goals.md                         │
│  │   │   └── 11.02 Health Records.md                         │
│  │   └── 15 Travel/                                          │
│  │       ├── 15.51 Vietnam 2024.md                           │
│  │       └── 15.52 New Zealand 2024.md                       │
│  ├── 20-29 Projects/                                         │
│  │   └── 21 Software/                                        │
│  │       ├── 21.01 Bismuth.md                                │
│  │       └── 21.02 Portfolio Site.md                         │
│  └── zettelkasten/                                           │
│      ├── 202405251912 Machine Learning Basics.md             │
│      ├── 202405251915 Deep Learning.md                       │
│      └── structure/                                          │
│          └── ML Research MOC.md                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Principles

### 1. Filesystem as Single Source of Truth

**Three Representations, One Authority** (from Tolaria):

```
FILESYSTEM (.md files)
    ↓
CACHE (~/.bismuth/cache/)
    ↓
SVELTE STORES (reactive state)
```

**Rules**:
- Filesystem owns the data
- Cache is always reconstructible
- State is derived from cache or filesystem
- Disk writes before state updates
- Reload/recovery mechanisms available

### 2. Convention Over Configuration

**Standard Frontmatter Fields**:

| Field | Meaning | UI Behavior |
|-------|---------|-------------|
| `type:` | Note type (Project, Person, etc.) | Type chip in note list |
| `status:` | Lifecycle stage (active, done, blocked) | Colored status badge |
| `tags:` | Topic tags | Tag chips, filterable |
| `aliases:` | Alternative names | Wikilink resolution |
| `belongs_to:` | Parent relationships | Humanized to "Belongs to" |
| `related_to:` | Lateral relationships | Humanized to "Related to" |
| `url:` | External link | Clickable link chip |
| `date:` | Single date | Formatted date badge |
| `start_date:` + `end_date:` | Duration | Date range badge |

**Johnny.Decimal Fields**:
| Field | Meaning | UI Behavior |
|-------|---------|-------------|
| `jd_id:` | Full JD ID (e.g., "15.52") | Badge, category filter |
| `jd_area:` | Area number (10, 20, etc.) | Sidebar grouping |
| `jd_category:` | Category number (15, 21, etc.) | Category badge |

**Zettelkasten Fields**:
| Field | Meaning | UI Behavior |
|-------|---------|-------------|
| `zk_id:` | Zettel ID (timestamp) | Unique identifier |
| `zk_type:` | Note type (permanent, literature, fleeting, structure) | Icon, color |
| `zk_source:` | Source reference | Citation link |

**Ontology Fields**:
| Field | Meaning | UI Behavior |
|-------|---------|-------------|
| `concepts:` | Extracted concepts | Concept chips, graph nodes |
| `subsumes:` | Broader concepts | Hierarchy visualization |
| `subsumed_by:` | Narrower concepts | Hierarchy visualization |

**System Properties (Underscore Convention)**:
```yaml
_pinned_properties:       # Properties in editor inline bar
  - key: status
    icon: circle-dot
_icon: shapes             # Note icon
_color: blue              # Note color
_width: wide              # Editor width override
_jd_auto_suggest: true    # Auto-suggest next JD ID
_zk_auto_link: true       # Auto-create backlinks
```

### 3. Knowledge Trinity Integration

**Layer 1: Physical Organization (Johnny.Decimal)**
- 10-folder limit at Area and Category levels
- Auto-suggest next decimal number
- JDex (index) integration with notes
- Category-based search and filtering

**Layer 2: Conceptual Connections (Zettelkasten)**
- Atomic notes with unique IDs
- Wikilinks for connections
- Backlinks panel
- Graph visualization
- Structure notes (MOCs)

**Layer 3: Semantic Intelligence (Ontologies)**
- Concept extraction from notes
- Subsumption relationships (⊑)
- Semantic search
- Concept recommendations

**Layer 4: Multi-Hop Retrieval (GraphRAG)**
- Hierarchical lexical graph
- Vector + graph hybrid search
- Multi-hop query processing
- Answer synthesis with citations

**Layer 5: Research Workflow (Posner)**
- Capture (web clipper, file import)
- Metadata (auto-capture source, date, location)
- Organization (JD + ZK + Ontology)
- Retrieval (search + graph + filters)

### 4. Disk-First Writes with Optimistic UI

**Invariants** (from Tolaria):
1. All vault changes write to disk first (via Tauri)
2. State updates only after successful disk write
3. Optimistic UI for responsiveness, with rollback on error
4. Recovery via `Reload Vault` command

**Example Flow**:
```typescript
// ❌ WRONG: Update state before disk
entries.update(e => [...e, newEntry])
await invoke('create_note', { ... })

// ✅ CORRECT: Disk first, then state
const path = await invoke('create_note', { ... })
const newEntry = await invoke('get_entry', { path })
entries.update(e => [...e, newEntry])
```

### 5. Where to Store State

**Decision Framework** (from Tolaria):
> "Would the user want this to follow them across all installations?"

| Follows Vault | Stays with Installation |
|---------------|-------------------------|
| JD structure | Editor zoom level |
| ZK templates | Window size/position |
| Ontology config | API keys |
| Note icons/colors | Auto-sync interval |
| Saved views | Theme preference |
| Type definitions | Panel widths |

**Storage Locations**:
- **Vault**: `.bismuth/config/*.yml`, frontmatter, note content
- **Installation**: `~/.config/com.bismuth.app/settings.json`, localStorage

---

## Data Model

### BismuthEntry (Core Type)

```typescript
// src/types/vault.ts
interface BismuthEntry {
  // Core identifiers
  path: string              // Absolute file path
  filename: string          // Just the filename
  title: string             // From first # heading or filename
  
  // Johnny.Decimal
  jdId: string | null       // "15.52"
  jdArea: number | null     // 10
  jdCategory: number | null // 15
  jdItemNumber: number | null // 52
  jdDescription: string | null // From JDex
  jdLocation: string | null    // Where to find it
  jdKeywords: string[]         // Search keywords
  
  // Zettelkasten
  zkId: string | null       // "202405251912"
  zkType: 'permanent' | 'literature' | 'fleeting' | 'structure' | null
  zkSource: string | null   // Source reference
  zkTags: string[]          // ZK-specific tags
  
  // Ontology
  concepts: string[]        // Extracted concepts
  subsumes: string[]        // Broader concepts (this ⊑ X)
  subsumedBy: string[]      // Narrower concepts (X ⊑ this)
  ontologyRelations: Record<string, string[]> // Custom relations
  
  // Standard fields
  type: string | null       // Note type
  status: string | null     // Status
  tags: string[]            // Tags
  aliases: string[]         // Aliases
  
  // Relationships
  belongsTo: string[]       // Parent links
  relatedTo: string[]       // Related links
  has: string[]             // Child links
  outgoingLinks: string[]   // All wikilinks in body
  backlinks: string[]       // Incoming links
  
  // Metadata
  modifiedAt: number | null // Unix timestamp
  createdAt: number | null  // Unix timestamp
  fileSize: number
  wordCount: number | null
  snippet: string | null    // First 200 chars
  
  // System
  archived: boolean
  properties: Record<string, any> // Custom properties
  fileKind: 'markdown' | 'text' | 'binary'
  
  // Graph
  graphNodeId: string | null    // Graph database node ID
  graphEmbedding: number[] | null // Vector embedding
}
```

### JDexEntry (Johnny.Decimal Index)

```typescript
// src/types/jd.ts
interface JDexEntry {
  id: string                // "15.52"
  area: number              // 10
  category: number          // 15
  itemNumber: number        // 52
  title: string             // "Trip to NYC"
  description: string       // What this is about
  location: string          // Where to find it (filesystem, email, etc.)
  relatesTo: string[]       // Links to other JD IDs
  keywords: string[]        // Search keywords
  createdAt: number
  updatedAt: number
  notePath: string | null   // Path to associated note
}
```

### ZettelEntry (Zettelkasten Note)

```typescript
// src/types/zk.ts
interface ZettelEntry {
  zkId: string              // "202405251912"
  title: string
  type: 'permanent' | 'literature' | 'fleeting' | 'structure'
  source: string | null     // Source reference
  tags: string[]
  links: string[]           // Outgoing wikilinks
  backlinks: string[]       // Incoming wikilinks
  content: string
  createdAt: number
  modifiedAt: number
  path: string
}
```

### ConceptNode (Ontology)

```typescript
// src/types/ontology.ts
interface ConceptNode {
  id: string                // Unique concept ID
  label: string             // Human-readable label
  definition: string | null // Concept definition
  subsumes: string[]        // Broader concepts (this ⊑ X)
  subsumedBy: string[]      // Narrower concepts (X ⊑ this)
  relatedConcepts: string[] // Lateral relationships
  instances: string[]       // Notes that mention this concept
  frequency: number         // How often mentioned
  createdAt: number
  updatedAt: number
}
```

### GraphNode (GraphRAG)

```typescript
// src/types/graph.ts
interface GraphNode {
  id: string
  nodeType: 'document' | 'chunk' | 'entity' | 'fact' | 'concept'
  label: string
  properties: Record<string, any>
  embedding: number[] | null // Vector embedding
  createdAt: number
  updatedAt: number
}

interface GraphEdge {
  id: string
  fromNodeId: string
  toNodeId: string
  edgeType: string          // "CONTAINS", "LINKS_TO", "IS_A", etc.
  properties: Record<string, any>
  weight: number            // Relationship strength
  createdAt: number
}
```

---

## Four-Panel Layout

### Layout Structure (from Tolaria)

```
┌────────┬─────────────┬─────────────────────────┬────────────┐
│Sidebar │ Note List   │ Editor                  │ Right Panel│
│(250px) │ (300px)     │ (flex-1)                │ (280px)    │
│        │             │                         │            │
│ Filters│ • Search    │ [Breadcrumb Bar]        │ Properties │
│ Views  │ • Sort      │                         │ OR         │
│ Areas  │ • Filter    │ # Note Title            │ TOC        │
│ Folders│             │                         │ OR         │
│        │ Note 1      │ Content...              │ Graph      │
│        │ Note 2      │                         │ OR         │
│        │ Note 3      │ (CodeMirror)            │ Backlinks  │
│        │ ...         │                         │            │
├────────┴─────────────┴─────────────────────────┴────────────┤
│ StatusBar: v1.0.0 │ main │ Synced │ Vault │ JD │ ZK │ Onto │
└──────────────────────────────────────────────────────────────┘
```

### Panel Specifications

#### 1. Sidebar (220-400px, resizable)

**Sections**:
```svelte
<aside class="sidebar">
  <!-- Top Filters -->
  <SidebarFilters>
    <FilterItem icon="list" label="All Notes" />
    <FilterItem icon="inbox" label="Inbox" />
    <FilterItem icon="git-branch" label="Changes" />
    <FilterItem icon="pulse" label="Pulse" />
  </SidebarFilters>
  
  <!-- Saved Views -->
  <SidebarViews>
    {#each savedViews as view}
      <ViewItem {view} />
    {/each}
  </SidebarViews>
  
  <!-- Johnny.Decimal Areas -->
  <SidebarAreas>
    <AreaSection area={10} label="Life Admin" />
    <AreaSection area={20} label="Projects" />
    <AreaSection area={30} label="Research" />
  </SidebarAreas>
  
  <!-- Zettelkasten -->
  <SidebarZettelkasten>
    <ZKSection type="permanent" label="Permanent Notes" />
    <ZKSection type="literature" label="Literature Notes" />
    <ZKSection type="structure" label="Structure Notes" />
  </SidebarZettelkasten>
  
  <!-- Folder Tree -->
  <SidebarFolders>
    <FolderTree root={vaultPath} />
  </SidebarFolders>
</aside>
```

**Features**:
- Collapsible sections
- Drag-and-drop reordering
- Right-click context menus
- Badge counts per section
- Quick jump (type "15" to jump to Travel category)

#### 2. Note List (220-500px, resizable)

**Modes**:
1. **Filtered List**: Notes matching selected filter
2. **JD Category View**: Notes in selected JD category
3. **ZK Graph View**: Connected notes in Zettelkasten
4. **Search Results**: Full-text search results

**Features**:
```svelte
<div class="note-list">
  <!-- Controls -->
  <div class="controls">
    <SearchInput placeholder="Search notes..." />
    <SortDropdown options={sortOptions} />
    <FilterBuilder />
  </div>
  
  <!-- List -->
  <VirtualList items={filteredNotes} itemHeight={80}>
    {#each visibleNotes as note}
      <NoteItem 
        {note}
        selected={note.path === activeNote?.path}
        on:click={() => openNote(note)}
      />
    {/each}
  </VirtualList>
</div>
```

**NoteItem Display**:
```
┌─────────────────────────────────────────┐
│ 📄 Machine Learning Basics              │
│ 15.52 • permanent • #ml #ai             │
│ Modified 2 hours ago                    │
│ Introduction to machine learning...     │
└─────────────────────────────────────────┘
```

#### 3. Editor (flex, fills remaining space)

**View Modes**:
1. **Rich Editor**: CodeMirror with syntax highlighting
2. **Preview**: Rendered markdown
3. **Raw**: Plain text editing
4. **Diff**: Git diff view

**Features**:
```svelte
<div class="editor">
  <!-- Breadcrumb Bar -->
  <BreadcrumbBar>
    <PathBreadcrumb {note} />
    <div class="actions">
      <IconButton icon="eye" tooltip="Toggle Preview" />
      <IconButton icon="code" tooltip="Raw Mode" />
      <IconButton icon="git-compare" tooltip="Diff View" />
      <WordCount count={wordCount} />
    </div>
  </BreadcrumbBar>
  
  <!-- Editor Content -->
  {#if viewMode === 'rich'}
    <CodeMirrorEditor 
      content={note.content}
      on:change={handleChange}
    />
  {:else if viewMode === 'preview'}
    <MarkdownPreview content={note.content} />
  {:else if viewMode === 'raw'}
    <RawEditor content={note.rawContent} />
  {:else if viewMode === 'diff'}
    <DiffView original={note.original} modified={note.content} />
  {/if}
</div>
```

#### 4. Right Panel (200-500px or hidden)

**Panels** (mutually exclusive):
1. **Properties**: Frontmatter, metadata, relationships
2. **Table of Contents**: H1/H2/H3 hierarchy
3. **Graph**: Local graph view
4. **Backlinks**: Incoming links
5. **Ontology**: Concept hierarchy

**Features**:
```svelte
<aside class="right-panel">
  <!-- Panel Switcher -->
  <div class="panel-tabs">
    <Tab icon="list" label="Properties" active={activePanel === 'properties'} />
    <Tab icon="list-tree" label="TOC" active={activePanel === 'toc'} />
    <Tab icon="graph" label="Graph" active={activePanel === 'graph'} />
    <Tab icon="link" label="Backlinks" active={activePanel === 'backlinks'} />
    <Tab icon="brain" label="Ontology" active={activePanel === 'ontology'} />
  </div>
  
  <!-- Panel Content -->
  {#if activePanel === 'properties'}
    <PropertiesPanel {note} />
  {:else if activePanel === 'toc'}
    <TableOfContentsPanel {note} />
  {:else if activePanel === 'graph'}
    <GraphPanel {note} />
  {:else if activePanel === 'backlinks'}
    <BacklinksPanel {note} />
  {:else if activePanel === 'ontology'}
    <OntologyPanel {note} />
  {/if}
</aside>
```

---

## Feature Modules

### 1. Johnny.Decimal Module

**Files**:
```
src/lib/features/johnny-decimal/
├── JDNavigator.svelte        # Category browser
├── JDAutoSuggest.svelte      # Next ID suggestion
├── JDexPanel.svelte          # JDex index panel
├── JDCategoryBadge.svelte    # Category badge component
├── JDFolderCreator.svelte    # Folder creation dialog
└── jd.ts                     # JD utilities
```

**JD Navigator**:
```svelte
<!-- JDNavigator.svelte -->
<script lang="ts">
  import { jdex } from '$lib/stores/jdex'
  
  $: areas = groupByArea($jdex.entries)
</script>

<div class="jd-navigator">
  {#each areas as area}
    <AreaSection {area}>
      {#each area.categories as category}
        <CategorySection {category}>
          {#each category.items as item}
            <JDItem {item} />
          {/each}
        </CategorySection>
      {/each}
    </AreaSection>
  {/each}
</div>
```

**JD Auto-Suggest**:
```svelte
<!-- JDAutoSuggest.svelte -->
<script lang="ts">
  export let category: number
  
  $: nextId = suggestNextId(category)
</script>

<div class="jd-auto-suggest">
  <label>Suggested ID:</label>
  <input value={nextId} readonly />
  <Button on:click={() => createWithId(nextId)}>
    Create {nextId}
  </Button>
</div>
```

**JDex Panel**:
```svelte
<!-- JDexPanel.svelte -->
<script lang="ts">
  import { jdex } from '$lib/stores/jdex'
  
  export let jdId: string
  
  $: entry = $jdex.entries.find(e => e.id === jdId)
</script>

<div class="jdex-panel">
  <h3>{entry.id} {entry.title}</h3>
  
  <Field label="Description">
    <EditableText bind:value={entry.description} />
  </Field>
  
  <Field label="Location">
    <EditableText bind:value={entry.location} />
  </Field>
  
  <Field label="Keywords">
    <TagInput bind:tags={entry.keywords} />
  </Field>
  
  <Field label="Relates to">
    <RelationshipInput bind:relations={entry.relatesTo} />
  </Field>
</div>
```

### 2. Zettelkasten Module

**Files**:
```
src/lib/features/zettelkasten/
├── ZKNoteCreator.svelte      # Note creation dialog
├── ZKBacklinks.svelte        # Backlinks panel
├── ZKGraph.svelte            # Graph visualization
├── ZKStructureNote.svelte    # MOC creator
├── ZKWikilink.svelte         # Wikilink autocomplete
└── zk.ts                     # ZK utilities
```

**ZK Note Creator**:
```svelte
<!-- ZKNoteCreator.svelte -->
<script lang="ts">
  import { zkActions } from '$lib/stores/zkActions'
  
  let title = ''
  let type: ZKType = 'permanent'
  let tags: string[] = []
  
  async function createNote() {
    const zkId = generateZKId() // "202405251912"
    await zkActions.createNote({
      zkId,
      title,
      type,
      tags,
    })
  }
</script>

<Dialog title="Create Zettelkasten Note">
  <Input label="Title" bind:value={title} />
  
  <Select label="Type" bind:value={type}>
    <option value="permanent">Permanent Note</option>
    <option value="literature">Literature Note</option>
    <option value="fleeting">Fleeting Note</option>
    <option value="structure">Structure Note</option>
  </Select>
  
  <TagInput label="Tags" bind:tags />
  
  <Button on:click={createNote}>Create</Button>
</Dialog>
```

**ZK Backlinks**:
```svelte
<!-- ZKBacklinks.svelte -->
<script lang="ts">
  export let note: BismuthEntry
  
  $: backlinks = getBacklinks(note.path)
</script>

<div class="zk-backlinks">
  <h3>Backlinks ({backlinks.length})</h3>
  
  {#each backlinks as backlink}
    <BacklinkItem {backlink} />
  {/each}
</div>
```

**ZK Graph**:
```svelte
<!-- ZKGraph.svelte -->
<script lang="ts">
  import { ForceGraph } from '@svelte-force-graph'
  
  export let note: BismuthEntry
  
  $: graphData = buildLocalGraph(note, 2) // 2 hops
</script>

<div class="zk-graph">
  <ForceGraph
    nodes={graphData.nodes}
    links={graphData.links}
    on:nodeClick={handleNodeClick}
  />
</div>
```

### 3. Ontology Module

**Files**:
```
src/lib/features/ontology/
├── OntologyPanel.svelte      # Concept hierarchy panel
├── ConceptExtractor.svelte   # Concept extraction UI
├── ConceptGraph.svelte       # Concept graph visualization
├── SubsumptionEditor.svelte  # Subsumption relationship editor
└── ontology.ts               # Ontology utilities
```

**Ontology Panel**:
```svelte
<!-- OntologyPanel.svelte -->
<script lang="ts">
  export let note: BismuthEntry
  
  $: concepts = note.concepts || []
  $: hierarchy = buildConceptHierarchy(concepts)
</script>

<div class="ontology-panel">
  <h3>Concepts</h3>
  
  <!-- Concept List -->
  <div class="concepts">
    {#each concepts as concept}
      <ConceptChip {concept} />
    {/each}
  </div>
  
  <!-- Concept Hierarchy -->
  <div class="hierarchy">
    <ConceptTree {hierarchy} />
  </div>
  
  <!-- Actions -->
  <Button on:click={extractConcepts}>
    Extract Concepts
  </Button>
</div>
```

**Concept Extractor**:
```svelte
<!-- ConceptExtractor.svelte -->
<script lang="ts">
  import { ontologyActions } from '$lib/stores/ontologyActions'
  
  export let note: BismuthEntry
  
  let extracting = false
  let extractedConcepts: string[] = []
  
  async function extract() {
    extracting = true
    extractedConcepts = await ontologyActions.extractConcepts(note.content)
    extracting = false
  }
</script>

<div class="concept-extractor">
  <Button on:click={extract} loading={extracting}>
    Extract Concepts
  </Button>
  
  {#if extractedConcepts.length > 0}
    <div class="extracted">
      <h4>Extracted Concepts:</h4>
      {#each extractedConcepts as concept}
        <ConceptChip 
          {concept}
          on:add={() => addConcept(concept)}
        />
      {/each}
    </div>
  {/if}
</div>
```

### 4. GraphRAG Module

**Files**:
```
src/lib/features/graphrag/
├── GraphRAGSearch.svelte     # Multi-hop search UI
├── GraphBuilder.svelte       # Graph construction UI
├── QueryPanel.svelte         # Query builder
├── AnswerPanel.svelte        # Answer synthesis display
└── graphrag.ts               # GraphRAG utilities
```

**GraphRAG Search**:
```svelte
<!-- GraphRAGSearch.svelte -->
<script lang="ts">
  import { graphragActions } from '$lib/stores/graphragActions'
  
  let query = ''
  let strategy: 'vector' | 'graph' | 'hybrid' = 'hybrid'
  let results: QueryResult | null = null
  let loading = false
  
  async function search() {
    loading = true
    results = await graphragActions.query(query, strategy)
    loading = false
  }
</script>

<div class="graphrag-search">
  <Input 
    placeholder="Ask a question..."
    bind:value={query}
    on:submit={search}
  />
  
  <Select bind:value={strategy}>
    <option value="vector">Vector Only</option>
    <option value="graph">Graph Only</option>
    <option value="hybrid">Hybrid (Vector + Graph)</option>
  </Select>
  
  <Button on:click={search} {loading}>
    Search
  </Button>
  
  {#if results}
    <AnswerPanel {results} />
  {/if}
</div>
```

### 5. Search Module

**Files**:
```
src/lib/features/search/
├── SearchPanel.svelte        # Main search UI
├── SearchResults.svelte      # Results display
├── FilterBuilder.svelte      # Advanced filters
├── SearchHistory.svelte      # Search history
└── search.ts                 # Search utilities
```

**Search Panel**:
```svelte
<!-- SearchPanel.svelte -->
<script lang="ts">
  import { searchStore } from '$lib/stores/search'
  
  let query = ''
  let filters: Filter[] = []
  
  $: results = $searchStore.results
</script>

<div class="search-panel">
  <!-- Search Input -->
  <SearchInput 
    bind:value={query}
    on:search={() => searchStore.search(query, filters)}
  />
  
  <!-- Filter Builder -->
  <FilterBuilder bind:filters />
  
  <!-- Results -->
  <SearchResults {results} />
</div>
```

---

## State Management

### Svelte Stores Architecture

**Core Stores**:
```typescript
// stores/vault.ts
export const vault = createVaultStore()

// stores/entries.ts
export const entries = derived(vault, $vault => $vault.entries)

// stores/selection.ts
export const selection = createSelectionStore()

// stores/layout.ts
export const layout = createLayoutStore()

// stores/jdex.ts
export const jdex = createJDexStore()

// stores/zettelkasten.ts
export const zettelkasten = createZettelkastenStore()

// stores/ontology.ts
export const ontology = createOntologyStore()

// stores/graph.ts
export const graph = createGraphStore()

// stores/search.ts
export const search = createSearchStore()
```

**Vault Store**:
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
  
  function updateEntry(entry: BismuthEntry) {
    entries.update(e => 
      e.map(existing => 
        existing.path === entry.path ? entry : existing
      )
    )
  }
  
  function removeEntry(path: string) {
    entries.update(e => e.filter(existing => existing.path !== path))
  }
  
  function addEntry(entry: BismuthEntry) {
    entries.update(e => [...e, entry])
  }
  
  return {
    entries,
    isLoading,
    error,
    currentVaultPath,
    loadVault,
    reloadVault,
    updateEntry,
    removeEntry,
    addEntry,
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

export const entriesByZKType = derived(
  vault.entries,
  $entries => groupBy($entries, 'zkType')
)
```

**Actions Pattern**:
```typescript
// stores/noteActions.ts
import { get } from 'svelte/store'
import { invoke } from '@tauri-apps/api/tauri'
import { vault } from './vault'

export const noteActions = {
  async createNote(title: string, options?: CreateNoteOptions) {
    // Disk-first write
    const path = await invoke<string>('create_note', { 
      title, 
      ...options 
    })
    
    // Get fresh entry from disk
    const newEntry = await invoke<BismuthEntry>('get_entry', { path })
    
    // Update state
    vault.addEntry(newEntry)
    
    return newEntry
  },
  
  async deleteNote(path: string) {
    // Disk-first write
    await invoke('delete_note', { path })
    
    // Update state
    vault.removeEntry(path)
  },
  
  async updateFrontmatter(path: string, key: string, value: any) {
    // Disk-first write
    await invoke('update_frontmatter', { path, key, value })
    
    // Get fresh entry from disk
    const updatedEntry = await invoke<BismuthEntry>('get_entry', { path })
    
    // Update state
    vault.updateEntry(updatedEntry)
  },
  
  async moveNote(oldPath: string, newPath: string) {
    // Disk-first write
    await invoke('move_note', { oldPath, newPath })
    
    // Get fresh entry from disk
    const movedEntry = await invoke<BismuthEntry>('get_entry', { 
      path: newPath 
    })
    
    // Update state
    vault.removeEntry(oldPath)
    vault.addEntry(movedEntry)
  },
}
```

---

## Constants & Configuration

### App Storage Keys

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
  zkTypeColors: 'bismuth:zk-type-colors',
  
  // Layout
  sidebarCollapsed: 'bismuth:sidebar-collapsed',
  sidebarWidth: 'bismuth:sidebar-width',
  noteListWidth: 'bismuth:note-list-width',
  inspectorWidth: 'bismuth:inspector-width',
  
  // Preferences
  sortPreferences: 'bismuth:sort-preferences',
  filterPreferences: 'bismuth:filter-preferences',
  
  // Features
  jdEnabled: 'bismuth:jd-enabled',
  zkEnabled: 'bismuth:zk-enabled',
  ontologyEnabled: 'bismuth:ontology-enabled',
  graphragEnabled: 'bismuth:graphrag-enabled',
  
  // Onboarding
  welcomeDismissed: 'bismuth:welcome-dismissed',
  tutorialCompleted: 'bismuth:tutorial-completed',
  
  // Migration
  configMigrated: 'bismuth:config-migrated-to-vault',
} as const
```

### Vault Configuration Files

**Johnny.Decimal Config** (`.bismuth/config/johnny-decimal.yml`):
```yaml
enabled: true
auto_suggest: true
enforce_limits: true
max_items_per_category: 99
areas:
  - id: 10
    label: Life Admin
    color: blue
    icon: user
  - id: 20
    label: Projects
    color: green
    icon: folder
  - id: 30
    label: Research
    color: purple
    icon: book
```

**Zettelkasten Config** (`.bismuth/config/zettelkasten.yml`):
```yaml
enabled: true
auto_link: true
id_format: timestamp  # or uuid
templates:
  permanent: templates/permanent-note.md
  literature: templates/literature-note.md
  fleeting: templates/fleeting-note.md
  structure: templates/structure-note.md
```

**Ontology Config** (`.bismuth/config/ontology.yml`):
```yaml
enabled: true
auto_extract: true
min_concept_frequency: 2
subsumption_threshold: 0.7
concept_sources:
  - wikidata
  - dbpedia
```

**GraphRAG Config** (`.bismuth/config/graphrag.yml`):
```yaml
enabled: true
embedding_model: all-MiniLM-L6-v2
chunk_size: 512
chunk_overlap: 50
max_hops: 3
vector_search_top_k: 10
graph_search_depth: 2
```

---

## Views & Filters

### Saved Views

**View Definition** (`.bismuth/views/active-projects.yml`):
```yaml
name: Active Projects
description: All active projects sorted by modified date
icon: folder
color: blue
filter:
  type: Project
  status: active
  jdArea: 20
sort: modifiedAt
order: desc
columns:
  - status
  - jdId
  - modifiedAt
  - tags
groupBy: jdCategory
```

**View Component**:
```svelte
<!-- SavedView.svelte -->
<script lang="ts">
  export let view: SavedView
  
  $: filteredNotes = applyView(view, $vault.entries)
</script>

<div class="saved-view">
  <h2>{view.name}</h2>
  <p>{view.description}</p>
  
  <NoteList notes={filteredNotes} />
</div>
```

### Filter Builder

**Filter Types**:
```typescript
type FilterOperator = 
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'in'
  | 'not_in'

interface Filter {
  field: string
  operator: FilterOperator
  value: any
}

interface FilterGroup {
  operator: 'AND' | 'OR'
  filters: (Filter | FilterGroup)[]
}
```

**Filter Builder Component**:
```svelte
<!-- FilterBuilder.svelte -->
<script lang="ts">
  let filterGroup: FilterGroup = {
    operator: 'AND',
    filters: []
  }
  
  function addFilter() {
    filterGroup.filters = [
      ...filterGroup.filters,
      { field: '', operator: 'equals', value: '' }
    ]
  }
  
  function removeFilter(index: number) {
    filterGroup.filters = filterGroup.filters.filter((_, i) => i !== index)
  }
</script>

<div class="filter-builder">
  <Select bind:value={filterGroup.operator}>
    <option value="AND">Match all (AND)</option>
    <option value="OR">Match any (OR)</option>
  </Select>
  
  {#each filterGroup.filters as filter, index}
    <FilterRow 
      {filter}
      on:change={(e) => updateFilter(index, e.detail)}
      on:remove={() => removeFilter(index)}
    />
  {/each}
  
  <Button on:click={addFilter}>Add Filter</Button>
</div>
```

---

## Button Standardization

### Button Component (shadcn/ui Svelte)

```svelte
<!-- ui/button/Button.svelte -->
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
  export let loading = false
  
  let className = ''
  export { className as class }
</script>

<button
  class={cn(buttonVariants({ variant, size }), className)}
  {disabled}
  on:click
  {...$$restProps}
>
  {#if loading}
    <LoadingSpinner class="mr-2 h-4 w-4" />
  {/if}
  <slot />
</button>
```

### Common Button Patterns

**1. Primary Action**:
```svelte
<Button>Create Note</Button>
```

**2. Secondary Action**:
```svelte
<Button variant="outline">Cancel</Button>
```

**3. Destructive Action**:
```svelte
<Button variant="destructive">Delete Note</Button>
```

**4. Icon Button**:
```svelte
<Button variant="ghost" size="icon">
  <Icon name="plus" />
</Button>
```

**5. Button with Icon**:
```svelte
<Button>
  <Icon name="plus" class="mr-2 h-4 w-4" />
  Create Note
</Button>
```

**6. Loading Button**:
```svelte
<Button loading={isCreating}>
  Create Note
</Button>
```

---

## Implementation Roadmap

### Phase 1: Core Infrastructure (Weeks 1-2)

**Week 1: Layout & Data Model**
- ✅ Four-panel layout with resizable panels
- ✅ BismuthEntry type definition
- ✅ Vault store with Svelte stores
- ✅ Tauri commands for vault operations

**Week 2: Component Library**
- ✅ shadcn/ui Svelte components (Button, Input, Dialog, etc.)
- ✅ NoteItem, FolderTree, BreadcrumbBar
- ✅ ResizeHandle, VirtualList
- ✅ SearchInput, FilterBuilder

### Phase 2: MVP Features (Weeks 3-6)

**Week 3: Vault Management (US1)**
- ✅ Vault creation, opening, closing
- ✅ Vault switcher
- ✅ Vault settings

**Week 4: Wikilinks (US2)**
- ✅ Wikilink parsing
- ✅ Wikilink autocomplete
- ✅ Backlinks panel

**Week 5: Search (US7)**
- ✅ Full-text search with Tantivy
- ✅ Search panel UI
- ✅ Filter builder

**Week 6: Graph View (US8)**
- ✅ Local graph visualization
- ✅ Global graph view
- ✅ Graph filtering

### Phase 3: Johnny.Decimal (Weeks 7-10)

**Week 7: JD Core**
- ✅ JD structure validation
- ✅ 10-folder limit enforcement
- ✅ JD ID parsing and validation

**Week 8: JD Navigator**
- ✅ Category browser
- ✅ Area sections in sidebar
- ✅ JD badge components

**Week 9: JDex**
- ✅ JDex index creation
- ✅ JDex panel UI
- ✅ Metadata fields (Description, Location, Keywords)

**Week 10: JD Auto-Suggest**
- ✅ Next ID suggestion
- ✅ Folder creation dialog
- ✅ Auto-categorization

### Phase 4: Zettelkasten (Weeks 11-14)

**Week 11: ZK Core**
- ✅ ZK ID generation (timestamp)
- ✅ ZK note types (permanent, literature, fleeting, structure)
- ✅ ZK templates

**Week 12: ZK Backlinks**
- ✅ Backlink detection
- ✅ Backlinks panel
- ✅ Bidirectional linking

**Week 13: ZK Graph**
- ✅ Local graph view
- ✅ Graph navigation
- ✅ Graph filtering

**Week 14: ZK Structure Notes**
- ✅ MOC creation
- ✅ Structure note templates
- ✅ Hierarchical organization

### Phase 5: Ontology (Weeks 15-18)

**Week 15: Concept Extraction**
- ✅ NLP-based concept extraction
- ✅ Concept frequency analysis
- ✅ Concept normalization

**Week 16: Subsumption**
- ✅ Subsumption relationship detection
- ✅ Concept hierarchy building
- ✅ Subsumption editor

**Week 17: Ontology Panel**
- ✅ Concept hierarchy visualization
- ✅ Concept graph view
- ✅ Concept recommendations

**Week 18: Semantic Search**
- ✅ Concept-based search
- ✅ Semantic similarity
- ✅ Concept filtering

### Phase 6: GraphRAG (Weeks 19-22)

**Week 19: Graph Construction**
- ✅ Hierarchical lexical graph
- ✅ Document/chunk/entity nodes
- ✅ Relationship extraction

**Week 20: Vector Search**
- ✅ Embedding generation
- ✅ Vector similarity search
- ✅ Hybrid search (vector + graph)

**Week 21: Multi-Hop Queries**
- ✅ Graph traversal (BFS, DFS)
- ✅ Path finding
- ✅ Multi-hop retrieval

**Week 22: Answer Synthesis**
- ✅ LLM integration
- ✅ Answer generation
- ✅ Citation tracking

### Phase 7: Polish & Optimization (Weeks 23-26)

**Week 23: Performance**
- ✅ Virtual scrolling
- ✅ Debounced operations
- ✅ Web Workers
- ✅ Lazy loading

**Week 24: Accessibility**
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ Focus management
- ✅ ARIA labels

**Week 25: Testing**
- ✅ Unit tests (Vitest)
- ✅ E2E tests (Playwright)
- ✅ Integration tests
- ✅ Performance tests

**Week 26: Documentation**
- ✅ User guide
- ✅ Developer docs
- ✅ API reference
- ✅ Tutorial videos

---

## Conclusion

This architecture proposal integrates:

✅ **Tolaria's Proven Patterns**: Filesystem as truth, disk-first writes, convention over configuration  
✅ **Johnny.Decimal**: Physical organization with 10-folder hierarchy  
✅ **Zettelkasten**: Conceptual connections with atomic notes and wikilinks  
✅ **Lightweight Ontologies**: Semantic intelligence with concept extraction  
✅ **GraphRAG**: Multi-hop retrieval with knowledge graph + vector search  
✅ **Posner Workflow**: Research asset management with capture, metadata, retrieval  

**Result**: A next-generation PKM system that combines the best of all methodologies into a cohesive, production-ready application.

**Next Steps**:
1. Review and approve architecture
2. Set up project structure
3. Implement Phase 1 (Core Infrastructure)
4. Iterate through phases 2-7
5. Beta launch and user feedback

**Documentation Date**: 2026-05-25  
**Author**: Cascade AI  
**Status**: Proposal - Pending Approval
