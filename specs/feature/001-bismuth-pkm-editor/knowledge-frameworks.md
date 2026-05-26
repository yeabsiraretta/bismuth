# Bismuth Knowledge Management Frameworks

**Document Version**: 2.0.0  
**Date**: 2026-05-25  
**Status**: Reference Documentation  
**Related**: [spec.md](./spec.md), [plan.md](./plan.md)

---

## Table of Contents

1. [Overview](#overview)
2. [The Knowledge Trinity](#the-knowledge-trinity)
3. [Lightweight Ontologies](#lightweight-ontologies)
4. [Johnny.Decimal System](#johnny-decimal-system)
5. [Zettelkasten Method](#zettelkasten-method)
6. [SWOT Analysis Framework](#swot-analysis-framework)
7. [Posner Research Workflow](#posner-research-workflow)
8. [GraphRAG & Hierarchical Lexical Graphs](#graphrag--hierarchical-lexical-graphs)
9. [Integration Strategy](#integration-strategy)
10. [Implementation Roadmap](#implementation-roadmap)
11. [Technical Architecture](#technical-architecture)
12. [User Experience](#user-experience)
13. [Success Metrics](#success-metrics)

---

## Overview

### Purpose

This document consolidates six complementary knowledge management, research workflow, and strategic planning frameworks that form the foundation of Bismuth's unique approach to personal knowledge management (PKM).

### The Six Frameworks

1. **Lightweight Ontologies**: Semantic intelligence layer for concept extraction and classification
2. **Johnny.Decimal**: Physical organization layer for numerical filing and structure
3. **Zettelkasten**: Conceptual connection layer for atomic notes and emergent insights
4. **SWOT Analysis**: Strategic decision-making framework for feature prioritization
5. **Posner Research Workflow**: Practical asset management, metadata capture, and preservation
6. **GraphRAG**: Intelligence layer for multi-hop reasoning over the knowledge graph

### Why These Six?

**Complementary Strengths**:
- **Ontologies** answer "What does this mean?"
- **Johnny.Decimal** answers "Where is it?"
- **Zettelkasten** answers "How is it connected?"
- **SWOT** answers "Should we build it?"
- **Posner** answers "How do I actually use it day-to-day?"
- **GraphRAG** answers "What can I discover across my entire knowledge base?"

**Unique Positioning**: No other PKM system combines proven methodologies (Zettelkasten, JD) with academic rigor (Ontologies), practical research workflows (Posner), strategic frameworks (SWOT), and AI-powered graph reasoning (GraphRAG).

---

## The Knowledge Trinity

### Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────┐
│ Layer 1: Physical Organization (Johnny.Decimal)        │
│ • Numerical filing: 11.05 Research Papers/             │
│ • 10-folder limits at each level                       │
│ • JDex index for cross-system tracking                 │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 2: Conceptual Connections (Zettelkasten)         │
│ • Atomic notes: 202405251912 ML Basics                 │
│ • Bidirectional links: [[202405251912]] ↔ [[...]]     │
│ • Structure notes (MOCs) for organization              │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 3: Semantic Intelligence (Lightweight Ontologies)│
│ • Concept extraction: machine_learning ⊓ research      │
│ • Subsumption: machine_learning ⊑ artificial_intel...  │
│ • Automatic classification and semantic search         │
└─────────────────────────────────────────────────────────┘
```

### Example Workflow

**Scenario**: User reads research paper on machine learning

**Step 1: Capture** (Zettelkasten)
```
Create buffer note in inbox
Quick highlights and thoughts
```

**Step 2: Organize** (Johnny.Decimal)
```
System suggests: "11.05 Research Papers"
Creates: 11.05/202405251912 ML Paper.md
Creates JDex note with metadata
```

**Step 3: Process** (Zettelkasten)
```
Create atomic notes:
  202405251912 ML Definition
  202405251915 ML Applications
  202405251920 Structure: ML Research (MOC)
Link notes together
```

**Step 4: Understand** (Lightweight Ontology)
```
Extract concepts: machine_learning ⊓ research ⊓ paper
Infer hierarchy: ML ⊑ AI ⊑ Computer Science
Build semantic graph
```

**Step 5: Retrieve** (All Layers)
```
By location:    "11.05"                  (Johnny.Decimal)
By connection:  "[[202405251920]]"        (Zettelkasten)
By meaning:     "concept:machine_learning" (Ontology)
By reasoning:   "How does this connect    (GraphRAG)
                 to my other research?"
```

**Step 6: Cite & Preserve** (Posner Workflow)
```
Capture metadata at point of collection:
  source, date, page/URL, project context
Add full citation to note footer:
  [#smith2024ml]: Smith (2024): _ML Basics_, Publisher.
Backup vault; export to Markdown/JSON
```

---

## Lightweight Ontologies

### Definition

**Formal**: A lightweight ontology is a triple O = ⟨N, E, C⟩ where:
- **N** = finite set of nodes
- **E** = set of edges on N (forming a rooted tree)
- **C** = finite set of concepts in formal language F
- For any node nᵢ ∈ N, there is one concept cᵢ ∈ C
- If nᵢ is parent of nⱼ, then cⱼ ⊑ cᵢ (subsumption)

**Practical**: Simplified ontologies that are:
- Easy to understand and construct
- Automatically built from user behavior
- Backbone taxonomy with "is-a" relations
- Suitable for propositional Description Logic

### Four Categories of Complexity

#### Category A: Atomic Labels + "is-a" Edges
- **Labels**: Single concepts ("theft", "organisms")
- **Relations**: "is-a" only
- **Examples**: Biological taxonomies
- **Use**: Descriptive

#### Category B: Complex Labels + "is-a" Edges
- **Labels**: Compound phrases ("Open Source in Education")
- **Relations**: "is-a" only
- **Examples**: Thesauri, business catalogues
- **Use**: Descriptive or classification

#### Category C: Atomic Labels + "Intersection" Edges
- **Labels**: Single concepts
- **Relations**: "intersection" (parent specifies child meaning)
- **Examples**: Faceted classifications
- **Use**: Classification only
- **Power**: Hierarchical specificity

#### Category D: Complex Labels + "Intersection" Edges
- **Labels**: Complex concepts, individual names
- **Relations**: "intersection"
- **Examples**: Web directories, user classifications
- **Use**: Classification only
- **Power**: Maximum classification capability

### Concept Extraction Process

**From Natural Language to Formal Concepts**:

1. **NLP Processing**:
   - Extract nouns, adjectives, proper names
   - Part-of-speech tagging
   - Named entity recognition

2. **WordNet Mapping**:
   - Map words to WordNet senses
   - Format: `lemma-pos-sn` (e.g., `machine_learning-noun-1`)
   - Handle proper names: `george_bushNNP`

3. **Concept Formation**:
   - Atomic concepts: Single WordNet senses
   - Complex concepts: Logical combinations
   - Operators: ⊓ (conjunction), ⊔ (disjunction), ⊑ (subsumption)

4. **Example**:
   ```
   Input: "Machine Learning for Knowledge Graph Construction"
   
   Concepts:
   - machine_learning-noun-1
   - knowledge_graph-noun-1
   - construction-noun-1
   
   Complex concept:
   machine_learning-noun-1 ⊓ knowledge_graph-noun-1 ⊓ construction-noun-1
   
   Subsumption:
   machine_learning ⊑ artificial_intelligence ⊑ computer_science
   ```

### Benefits for Bismuth

1. **Semantic Search**: Query by concepts, not just keywords
2. **Automatic Classification**: System learns from user patterns
3. **Flexible Taxonomy**: Support simple and complex hierarchies
4. **Intelligent Recommendations**: Suggest related notes by concept
5. **Future-Proof**: Can evolve into full ontologies if needed

### Implementation (Phase 8)

**FR-278**: Concept extraction from note titles/content using NLP
**FR-279**: Build subsumption hierarchy automatically
**FR-280**: Visualize ontology graph alongside file tree
**FR-281**: Support faceted classification with intersection edges
**FR-282**: Enable complex concept queries (propositional DL)
**FR-283**: Automatic concept-based note recommendations

---

## Johnny.Decimal System

### Core Philosophy

**Goal**: Find things quickly, with more confidence, and less stress.

**Three Pillars**:
1. **Limit Choices**: Max 10 folders at each level
2. **Benefit from Friction**: Creating categories requires thought
3. **Time Well Spent**: Upfront organization pays dividends

### Structure

#### Three-Level Hierarchy

```
Area (10-19)           → Filing Cabinet
  ├─ Category (11-15)  → Drawer
  │   └─ ID (11.01-11.99) → Manila Folder
```

#### Anatomy of a Johnny.Decimal ID

**Format**: `AC.ID`

- **A** = Area digit (1-9, groups 10 categories)
- **C** = Category digit (0-9, within area)
- **ID** = Item number (01-99, unique within category)

**Example**: `15.52 Trip to NYC`
- `1` = Area 10-19 (Life Admin)
- `15` = Category 15 (Travel)
- `52` = 52nd item in Travel category

#### Areas (10-19, 20-29, etc.)

**Definition**: Broad "areas of life" or "areas of expertise"

**Properties**:
- Group 10 categories each
- Leave room for expansion
- Examples: 10-19 Life Admin, 20-29 Home Business, 30-39 Tennis Club

**Special**: Area 00-09 exists for advanced use

#### Categories (11, 12, 13, etc.)

**Definition**: Collections of similar stuff (most important concept)

**Properties**:
- The place where you work
- Group related IDs (max 100 per category)
- Prefer fewer, broader categories (avoid ambiguity)

**Examples**:
- 11 Me
- 12 House
- 13 Money
- 14 Online
- 15 Travel

#### IDs (11.01, 11.02, etc.)

**Definition**: Where you actually store stuff

**Properties**:
- Start at .01 (not .00)
- Max 99 per category
- Recent items have higher numbers
- Can contain subfolders (max 1 level)

**Examples**:
- `15.52 Trip to NYC` (flight PDFs, hotel booking, notes)
- `15.22 Travel insurance` (claims, policy documents)
- `12.32 Motor vehicle insurance & claims`

### The JDex (Johnny.Decimal Index)

**Definition**: The master record of every ID in a system. **This IS your Johnny.Decimal system.**

**Why Essential**:
1. Know where everything is (email, cloud, filesystem, apps)
2. Never re-use IDs (central store prevents duplicates)
3. Next-level note-taking (quick notes with guaranteed findability)
4. System memory (document decisions and structure)

**Implementation**: One note per ID in notes app (Bear, Obsidian, Apple Notes)

**Metadata Fields**:
- **Description**: What this is about
- **Location**: Where to find it (filesystem, email, physical, app)
- **Relates to**: Links to other IDs
- **Keywords**: Specific search terms

**Example**:
```markdown
# 12.32 Motor vehicle insurance & claims

> Description: Car insurance policy and claims
> Location: Email, filesystem
> Relates to: 12.31 Home insurance
> Keywords: car, policy, vehicle, insurance
```

### File Management Rules

**Structure vs. Content**:
```
Before decimal (AC) = Structure (Area + Category)
After decimal (.ID) = Content (Individual items)
```

**DO**:
- ✅ Save files in ID folders (15.52, 11.01)
- ✅ Use subfolders (max 1 level deep)
- ✅ Name with `yyyy-mm-dd` prefix for chronological sorting

**DON'T**:
- ❌ Save files in Area folders (10-19, 20-29)
- ❌ Save files in Category folders (11, 12, 13)
- ❌ Create boxes-in-boxes-in-boxes chaos

### Date Sorting Strategy

**Format**: `yyyy-mm-dd` prefix for all subfolders and files

**Why**: Automatic chronological sorting, fits lifetime of data in one ID

**Example**:
```
15.41 All short trips
├─ 2016-10-10 Weekend in Darwin/
├─ 2017-03-01 Drive to the coast/
├─ 2018-02-09 Boat to Tasmania/
├─ 2023-09-30 Train to Adelaide/
├─ 2024-02-13 CBR-SYD Weekend in Sydney/
└─ 2026-01-07 Hotel in Cobar/
```

### The Librarian Role

**Definition**: Person who oversees the Johnny.Decimal system

**Responsibilities**:
1. Understand structure (know what goes where and why)
2. Own the index (maintain JDex, keep up-to-date)
3. Annotate system (create process documentation)
4. Monitor usage (keep system neat, help users)
5. Resolve disputes (final arbiter on categorization)
6. Onboard users (guide new users on structure)

**Resource Allocation**:
- Personal system: One partner takes role
- Work system: Find team member who enjoys organization
- Large projects: 1 day/week funding

### Implementation (Phase 4)

**FR-275**: Enforce 10-folder limit at Area and Category levels
**FR-276**: Auto-suggest next decimal number
**FR-277**: JDex integration with note system
**FR-278**: Smart search by category
**FR-279**: Date-prefix automation
**FR-280**: Header support (optional)
**FR-281**: Librarian dashboard
**FR-282**: Template system

---

### Community Deep Dive: PARA Hybrid + 3-Digit IDs

> Source: Johnny.Decimal forum — "PARA + JD + 3 digits" (jdm, Dec 2022)

The canonical JD system allows up to 10 categories per area (10-folder limit). A common real-world adaptation relaxes this to **3-digit category numbers**, which provides more granularity at the cost of some simplicity. This pattern is widely used when integrated with **PARA** (Projects, Areas, Resources, Archive).

#### 3-Digit Category Structure

Rather than `AC.ID` (two-digit area + two-digit item), the 3-digit variant uses `NNN` category numbers within single-digit top-level areas:

```
0 System
├── 000 Meta
├── 001 Inbox
├── 002 Notes
├── 003 Todo
├── 004 Someday
└── 099 Archive

1 Personal Life
├── 100 Admin
├── 110 Projects
├── 120 Health and Fitness
├── 130 Home
├── 140 People and Relationships
├── 150 Travel
├── 160 Finances
├── 180 Legal
└── 199 Archive

3 Work
├── 301 Career
├── 310 Company 1   (decimalized internally)
├── 311 Company 2   (yyyy-mm project name folders)
└── 312 Company 3   (yyyy-mm client name folders)

8 Resources
├── 801 Legal
├── 802 Finances
├── 803 Tech
├── 804 Health
└── 805 Places

9 Archive
```

**Key differences from canonical JD**:
- Single-digit top-level areas (0–9 instead of 10–99)
- 3-digit categories (100, 110, 120…) instead of 2-digit (11, 12, 13…)
- Reserve `X99` for **Archive** within each area (e.g., `199`, `299`)
- Reserve `X00` for **Admin/Meta** within each area (e.g., `100`, `300`)
- Area `0` = System (meta, inbox, todo)
- Area `9` = Global archive

#### The `0 System` Area

Johnny Noble himself noted this in the forum thread — using `00-09` (or simply `0`) as a **System area** is cleaner than "Management & Meta":

```
00-09 System
  00 Meta          // or 000 Meta
  01 Inbox         // capture area
  02 Notes         // scratch space
  03 Todo          // active tasks
  04 Someday       // future ideas
  09 Archive       // system-level archive
```

**Bismuth implication**: The inbox/buffer pattern from Zettelkasten maps cleanly here — `001 Inbox` in JD = buffer notes in ZK. Same physical location, two conceptual roles.

#### File Naming Philosophy (Independent of JD Numbers)

A key principle from this community pattern: **JD numbers are an attribute of a file's location, not inherent to its contents.**

> "I don't think I will ever label files with the JD number, as where a file is categorized is an attribute of the file rather than something inherent with the contents."

This means:
- Files named for their **lifetime**: `yyyy-mm-dd meaningful-title.ext`
- JD category is the *folder* the file lives in, not the filename
- Files can be re-categorized without renaming them
- Stands in contrast to embedding the JD ID in every filename

**Two valid schools**:

| Approach | Filename | Pro | Con |
|----------|----------|-----|-----|
| **Embedded ID** | `15.52 Trip to NYC.pdf` | ID always visible | Rename needed if recategorized |
| **Content-first** | `2024-03-15 Tokyo itinerary.pdf` | Permanent name | Must open folder to know category |

**Bismuth recommendation**: Support both. JDex note records the category; filename is user's choice. The JDex is the authoritative source of the ID-to-file mapping.

#### Archive-as-Area (Area 9)

Reserving an entire top-level area for **Archive** is a clean pattern:
- Completed relationships, projects, bills, old jobs → move to `9 Archive`
- Reduces cognitive load — don't see dead items in active areas
- Each sub-area within Archive mirrors the original area structure
- Items retain their original category number for traceability

```
9 Archive
├── 9-1 Personal Life (archived)
├── 9-3 Work (archived)
└── 9-4 Media (archived)
```

#### Consulting / Client Project Inversion

When work involves clients or projects that each generate their own nested structure, the forum proposed **inverting** the standard `PRO.AC.ID` to `CompanyCategory/ClientDate/SubItem`:

```
310 Company 1/
  310.01 Project Alpha/
    310.01.01 Contracts/
    310.01.02 Deliverables/
  310.02 Project Beta/

311 Company 2/
  2023-04 Client X/
  2023-09 Client Y/
```

This is pragmatic: older work follows `yyyy-mm client` folder naming (matching how it was originally organized), while newer work can be fully decimalized.

**Bismuth implication**: The system should allow **per-category folder strategies** — some categories are decimalized, others use date-prefix folders, others are repo-name folders. This is opt-in at the category level.

#### PARA Integration

PARA (Projects, Areas, Resources, Archive) maps well onto the 3-digit JD scheme:

| PARA | JD Area | Example |
|------|---------|---------|
| **Projects** | `110 Projects` / `310 Work Projects` | Active, time-bounded work |
| **Areas** | `1 Personal Life`, `3 Work` | Ongoing responsibilities |
| **Resources** | `8 Resources` | Reference material by topic |
| **Archive** | `9 Archive` / per-area `X99` | Completed/inactive items |

The hybrid gives PARA's conceptual clarity + JD's numerical stability and JDex searchability.

#### New FR from Community Patterns

- **FR-304**: 3-digit category mode — opt-in alternative to canonical 2-digit `AC.ID` scheme; supports `NNN` category numbers with single-digit top-level areas; system validates against chosen scheme consistently
- **FR-305**: Per-category folder strategy — allow each JD category to declare its internal organization style: decimalized sub-IDs, `yyyy-mm-dd` date prefix, free-form (repo names, client names), or mixed; strategy stored in JDex note metadata
- **FR-306**: Archive area/category — first-class support for `Archive` as a top-level area (`9 Archive` or `00-09 System` + `X99` convention); one-click "archive" moves item to the corresponding archive location while preserving its category lineage

---

## Zettelkasten Method

### Core Philosophy

**Goal**: Optimize workflow of learning and producing knowledge through interconnected atomic notes.

**Guiding Principle**: "Principles are higher than techniques. Principles produce techniques in an instant." —Ido Portal

### Three Fundamental Principles

#### 1. Principle of Atomicity

**Definition**: Put things that belong together into a single note, give it an ID, but limit its content to that single topic.

**Why**:
- Each note is a complete thought
- Easy to link and recombine
- Prevents information overload
- Enables modular knowledge building

**Implementation**:
- One idea per note
- Self-contained (understandable without context)
- Unique ID for referencing
- Focused topic scope

#### 2. Principle of Connectivity

**Definition**: Create a web of knowledge through links between notes.

**Techniques** (all implement same principle):
- Direct links between notes
- Note sequences (Folgezettel)
- Structure notes (MOCs)
- Tags as entry points

**Why**: Search alone is not enough. Connections create context and enable serendipitous discovery.

#### 3. Trust the Process

**Definition**: Thinking and memory retention improve by working through problems, not just collecting.

**The Collector's Fallacy**: Bookmarking/reading/annotating ≠ learning

**Must Do**:
1. Interpret sources
2. Write in your own words
3. Connect to existing knowledge
4. Rely on your thoughts henceforth

### System Architecture

**Three Building Blocks**:
1. **Inbox**: Capture thoughts, temporary storage
2. **Note Archive**: Permanent Zettelkasten notes
3. **Reference Manager**: Bibliography, source tracking

**Two Forms of Every Zettel**:
1. **Inner Form**: Content, ideas, arguments
2. **Outer Form**: ID, links, tags, metadata

### Note Types & Layers

#### Layers of Evidence (Content Types)

**Layer 1: Data Description & Patterns**
- Raw observations
- Facts from sources
- Direct quotes
- Statistical patterns

**Layer 2: Interpretation**
- Analysis of descriptions
- Explanation of patterns
- Your understanding
- Critical commentary

**Layer 3: Synthesis**
- Combining multiple interpretations
- Novel insights
- Theoretical frameworks
- Original arguments

#### Structural Layers (Organization)

**Bottom Layer: Content Notes**
- Individual Zettel
- Atomic ideas
- Linked to related notes

**Middle Layer: Structure Notes**
- Collections of related notes
- Topic overviews
- Entry points to knowledge areas
- Like "Maps of Content" (MOCs)

**Top Layer: Main Structure Notes**
- High-level organization
- Major themes/projects
- Double hashes (special tags: `##project`, `##index`)
- System navigation

### Workflow Processes

#### Reading Workflow

**The Barbell Method**:
- **Quick skim** (low risk): Most content
- **Deep read** (high investment): When necessary

**Reading for Zettelkasten = Searching**:
- Look for specific extractable information
- Don't read passively
- Active extraction mindset

**Paper Reading**:
1. Make proper reading marks (not margin annotations)
2. Take reading notes (get stuff OUT of book)
3. Create Zettel from reading notes

#### Writing Workflow

**Make Writing Part of Identity**:
- Schedule time for writing
- Create lasting habits
- Daily writing practice
- Track progress (word counts, metrics)

**From Notes to Draft**:
1. Use **buffer files** to collect writing ideas
2. Create **outlines** for first draft
3. **Ease into writing** by adding Zettel to outline
4. Paste Zettel contents into draft
5. **Divide composing from editing** (flow state)
6. **Publish iteratively**

#### Note Creation Workflow

**When to Start New Note**:
- One complete thought
- Atomic idea
- Self-contained concept
- Reusable knowledge unit

**How to Write Notes**:
- Write for your future self
- Use your own words (interpretation)
- Add context for understanding
- Include source references
- Create links to related notes

**First Note Anxiety**: "What should my first note be?"
- **Answer**: It doesn't matter. Just start.
- Any note is better than no note
- System grows organically

### Linking Strategy

**Why Links Matter**:

Search alone is insufficient:
- Too many results
- No context
- No relationships
- Misses serendipity

Links provide:
- Context
- Relationships
- Navigation paths
- Surprise connections

**Types of Ties Between Notes**:
- **Direct Links**: Explicit connections, "see also" references
- **Note Sequences (Folgezettel)**: Linear progression of ideas
- **Structure Notes**: Hub notes, topic collections
- **Tags**: Entry points, thematic grouping

### Tags vs Categories

**Don't use categories. Use tags instead.**

**Why**:
- Categories are rigid hierarchies
- Tags are flexible, multi-dimensional
- Notes can have multiple tags
- Tags enable faceted navigation

**Good Tags**:
- Specific, actionable
- Represent concepts, not folders
- Enable discovery
- Limited in number

**Bad Tags**:
- Too generic ("important", "todo")
- Duplicate folder structure
- Too many tags per note
- Inconsistent naming

### Identity & References

**Every note needs**:
- Unique ID (timestamp, sequential, hybrid)
- Stable reference
- Permanent address

**ID Formats**:
- Timestamp: `202405251912` (YYYYMMDDHHmm)
- Sequential: `001`, `002`, `003`
- Hybrid: `20240525-001`

**Why**:
- Enable linking
- Prevent duplicates
- Track relationships
- Future-proof references

### Scaling Strategies

#### Buffer Notes (Temporary)

**Purpose**: Collect incoming information before processing

**Use for**:
- Quick captures
- Unprocessed reading notes
- Ideas to develop
- Project staging

**Process**:
1. Capture to buffer
2. Process regularly
3. Create permanent notes
4. Archive or delete buffer

#### Structure Notes (Permanent)

**Purpose**: Organize growing knowledge web

**Create when**:
- Topic has >10 related notes
- Need overview of area
- Starting new project
- Connecting disparate ideas

**Content**:
- Brief introduction
- Curated list of links
- Narrative flow
- Entry point for exploration

### Implementation (MVP)

**FR-285**: Atomic note creation with auto-generated IDs
**FR-286**: Bidirectional linking with backlink detection
**FR-287**: Structure notes (MOCs) with visual distinction
**FR-288**: Flexible tag system with autocomplete
**FR-289**: Buffer note workflow (Post-MVP)
**FR-290**: Link graph visualization (Post-MVP)
**FR-291**: Zettelkasten analytics (Post-MVP)
**FR-292**: Reading workflow integration (Post-MVP)

---

### Deep Dive: Luhmann's Original System

> Sources: zettelkasten.de — Sascha Fast & Christian Tietze (2013–2020)

#### The Fixed Address Problem

Every note needs a **fixed, unique address** to enable linking. Luhmann's paper-based numbering (`1`, `1a`, `1b`, `1a1`, `1a2`…) had two consequences:
1. Enables **organic growth** — place notes anywhere and branch indefinitely
2. Enables **linking** — every note has a stable address to reference

#### Luhmann's Register vs Tag System

Luhmann's index/register was **entry points only**, not a tag system:
- Single entry per term — "system" had just **ONE** entry despite being central to his life's work
- Used to find the most central cluster, then **surf via links** from there
- **Key insight**: Register is for entry; links are for navigation

**Bismuth implication**: Tags should behave like Luhmann's register — sparse, high-value entry points, not a full categorization system.

#### Productivity Record
- 50 books, 600+ articles, 150+ unfinished manuscripts
- 90,000+ notes over ~40 years
- "Working in partnership with his Zettelkasten"

---

### Deep Dive: Anatomy of a Zettel

Every Zettel has exactly **three mandatory components**:

| Component | Purpose | Notes |
|-----------|---------|-------|
| **Unique Identifier** | Fixed address for linking | Never changes |
| **Body** | The knowledge, in your own words | Not raw quotes |
| **Reference** | Source citation at bottom | Blank = own thought |

#### ID Strategy for Bismuth

| ID Type | Format | Recommendation |
|---------|--------|----------------|
| **Time-based** | `202006110955` (YYYYMMDDHHmm) | ✅ **Recommended** |
| Luhmann-ID | `1a2b` hierarchical | Paper-only; not ideal digitally |
| Title-based | Unique title as ID | ❌ Title changes break links |
| Arbitrary string | Random hex/UUID | ❌ Not human-readable |

**Bismuth default**: `YYYYMMDDHHmm`. Collision handling: append `-01`, `-02`. ID appears in **both filename AND note body** (redundancy enables portability).

#### The Body: Information vs Knowledge

> "Dead" information = just a fact. Knowledge = information + context + relevance + your interpretation.

- Write in **your own words** — forces processing, improves recall
- Verbatim quotes are permitted at the top, but must be followed by your interpretation
- Length is determined by objective: one excerpt OR one thought per note

---

### Deep Dive: Three Layers of Evidence

> Source: Sascha Fast, "Three Layers of Evidence" — zettelkasten.de (May 2019)

Never conflate observation with interpretation. Always divide explicitly.

#### Layer 1 — Phenomenon (What did you see?)

- Raw observations, correlations, empirical findings
- "0.9 correlation between pool drownings and nuclear power output" — just the pattern, no causality claimed
- **Nassim Taleb**: "Phenomenologies stay; theories come and go"
- Rarely reaches Layer 1 in journalism — treat with skepticism

#### Layer 2 — Interpretation (Why does the pattern exist?)

- Causality claims, theories, hypotheses
- **Fragile**: interpretations break and need maintenance
- Common failure: processing an empirical study but writing only an interpretation note — later can't reconstruct the conditions

#### Layer 3 — Synthesis (What does it all mean?)

- Combining multiple interpretations into a bigger picture
- String together hypotheses, theories, models
- On the edge between knowledge work and writing

#### How to Apply

**Approach 1** (preferred for complex topics): Separate notes per layer
```
Phenomenon note [[ID1]] ← linked from interpretation note [[ID2]] ← linked from synthesis note [[ID3]]
```

**Approach 2** (simpler): Single note divided top-to-bottom
```
## Phenomenon
[raw observation]
## Interpretation
[why it happens]
## Synthesis
[broader meaning]
```

**FR-301**: Three-layer evidence tagging — classify notes as Phenomenon / Interpretation / Synthesis; visual indicator per note; filter by layer.

---

### Deep Dive: Link Context Enforcement

> Source: Sascha Fast, "Introduction to the Zettelkasten Method" — zettelkasten.de

**Always state explicitly WHY you made the connection.** A bare wikilink creates no knowledge.

**Bad** (creates no knowledge):
```
[[202001121202]]
```

**Good** (creates knowledge):
```
Investing starts with liquidity: [[202001121202]]
You have to have liquidity to make investment decisions unless using leverage.
But if Cash is Alpha, Cashflow is Omega...
```

> "If you add links without explanation, you do NOT create knowledge. Your future self won't know why to follow the link, and surfing feels unreliable and disappointing."

> "Shallow linking = making shallowness a habit = lowering creative knowledge worker skill."

**FR-302**: Link context enforcement — warn/prompt user when a wikilink is inserted without surrounding explanation text (configurable threshold: e.g., <20 characters around the link).

---

### Deep Dive: Structure Notes as Semilattice

Structure Notes are **not** strict trees. They form a **semilattice**:
- A Zettel can and should appear in **multiple** Structure Notes
- Not: one parent → one child
- Reality is heterarchy; cross-connections are a feature, not a bug

**Nested list** (most common):
```markdown
# Structure Note: Zettelkasten Method
- [[202405251912]] Introduction
- [[202405251915]] Atomicity
  - [[202405251916]] One thought per note
  - [[202405251917]] Self-containment
- [[202405251918]] Linking
```

**Sequential structure** (argumentation):
```markdown
(a) Cold receptor stimulation [[202005201056]]
(b) is main driver of cold adaptation [[202005201057]]
Therefore (c) cold showers are viable cold adaptation training [[202005201058]]
```

Create a Structure Note when a topic has **>10 related notes**, when starting a new project, or when connecting disparate idea clusters.

---

### Deep Dive: The Barbell Method of Reading

> Source: Sascha Fast, "The Barbell Method of Reading" — zettelkasten.de (May 2018)

**Two conflicting demands**:
1. Read a lot (high influx of information)
2. Process deeply (transform information into knowledge)

**Two traps**: speed-reading (no processing) vs. reading everything carefully (wastes energy on bad books).

#### The Two-Pass Approach

| Pass | Action | Energy |
|------|--------|--------|
| **First pass** | Read swiftly; mark ALL useful/interesting/inspiring passages | Low |
| **Second pass** | Read ONLY marked parts; make ZK notes, connect to existing notes, think | High |

Quality determines depth of second pass:
- Bad book → second pass = 30 minutes
- Dense book (e.g., *Antifragile*) → second pass = 12 full deep-work days over 6 weeks

#### Four Content Types

|  | Difficult | Easy |
|--|-----------|------|
| **Useful** | Read twice, process heavily | Read once, process heavily |
| **Not useful** | Read twice, don't process | Read once, mostly ignore |

#### Deep Processing Rules

- Never rely on an author's interpretation of their own work
- Go to primary sources; construct your own continuity from evidence
- True reading = reading + thinking + writing (all three required)
- **Writing IS thinking**: "You have to write if you want to think properly."

**FR-303**: Barbell reading workflow — two-pass reading mode: first pass = highlight passages; second pass = process highlights into Zettels with one-click note creation from each highlight.

---

### Deep Dive: Citation Management

> Source: Christian Tietze, "Manage Citations for a Zettelkasten" — zettelkasten.de (Oct 2013)

#### Recommended Stack

- **BibDesk** (Mac) or **JabRef** (cross-platform) for bibliography management
- **BibTeX format** for storage (plain text, LaTeX compatible)
- **MultiMarkdown citation syntax** in Zettel body

#### Citation Format in Zettel

```markdown
Body text with citation.[p 123][#evans2006ddd]

[#evans2006ddd]: Eric Evans (2006): _Domain-Driven Design_, Addison-Wesley.
```

**Citekey format** (`%a1%Y%t4`): `lastname + year + 4-char-title`
Example: `mccracken2004bibd`

#### Why Full Citation Per Zettel (Self-Containment)

1. Each Zettel is **self-contained** — readable without external lookup
2. Can **reconstruct bibliography** from notes alone
3. Preview tools work without extra setup
4. **Redundant storage = safe** — each note carries its own provenance

**FR-300**: Citation management integration — BibTeX/Zotero/Mendeley import; MultiMarkdown citekey syntax (`[p N][#citekey]`); full citation stored in note footer; bibliography auto-generation from vault.

#### Reference Footer Template

```markdown
---
## References
[#lastnameYEAR]: Author (Year): _Title_, Publisher.
```

---

### New FRs from Zettelkasten Deep Dive

- **FR-300**: Citation management (BibTeX/Zotero import, MultiMarkdown citekeys, full citation in footer)
- **FR-301**: Three-layer evidence tagging (Phenomenon / Interpretation / Synthesis classification per note)
- **FR-302**: Link context enforcement (warn when wikilink lacks surrounding explanation text)
- **FR-303**: Barbell reading workflow (two-pass: highlight → process → create Zettel)

---

## SWOT Analysis Framework

### Definition

**SWOT**: Strategic planning technique examining four key areas:
- **S**trengths: What we excel at, competitive advantages
- **W**eaknesses: Areas needing improvement to remain competitive
- **O**pportunities: Favorable external factors for competitive advantage
- **T**hreats: External factors that could harm the organization

### Core Principles

1. **Realistic, fact-based, data-driven**: Not aspirational or biased
2. **Diverse perspectives**: Input from multiple stakeholders
3. **Balanced view**: Internal (S/W) + External (O/T) factors
4. **Action-oriented**: Analysis must lead to strategic decisions
5. **Periodic updates**: Business environment constantly changes

### SWOT Table Structure

```
┌─────────────────────┬─────────────────────┐
│ STRENGTHS           │ WEAKNESSES          │
│ (Internal/Positive) │ (Internal/Negative) │
│                     │                     │
│ - Strong brand      │ - High debt         │
│ - Unique tech       │ - Weak supply chain │
│ - Loyal customers   │ - Limited capital   │
└─────────────────────┴─────────────────────┘
┌─────────────────────┬─────────────────────┐
│ OPPORTUNITIES       │ THREATS             │
│ (External/Positive) │ (External/Negative) │
│                     │                     │
│ - Market expansion  │ - New competitors   │
│ - Tech trends       │ - Regulations       │
│ - Partnerships      │ - Economic downturn │
└─────────────────────┴─────────────────────┘
```

**Layout Logic**:
- **Top row**: Internal factors (controllable)
- **Bottom row**: External factors (less controllable)
- **Left side**: Positive/favorable aspects
- **Right side**: Concerning/negative elements

### Five-Step SWOT Process

#### Step 1: Determine Objective

**Purpose**: Focus the analysis on specific decision

**Questions**:
- What decision are we trying to make?
- What's the scope (product, feature, market, strategy)?
- What do we hope to achieve?

**Bismuth Example**: "Should we implement Johnny.Decimal system in MVP or defer to post-MVP?"

#### Step 2: Gather Resources

**Data Requirements**:
- Internal data (financials, capabilities, performance)
- External data (market trends, competitors, regulations)
- Stakeholder perspectives (users, developers, investors)

**Personnel Mix**:
- External-facing: Marketing, sales, partnerships
- Internal-facing: Engineering, operations, finance
- Cross-functional: Product, design, leadership

#### Step 3: Compile Ideas

**Brainstorming Guidelines**:
- No right or wrong answers
- Encourage all contributions
- Quantity over quality initially
- Use whiteboarding/sticky notes
- Defer judgment

**Internal Factor Questions**:

**Strengths**:
- What are we doing well?
- What's our strongest asset?
- What advantages do we have?
- What unique resources exist?

**Weaknesses**:
- What are our detractors?
- What are lowest-performing areas?
- Where do we lack resources?
- What do competitors do better?

**External Factor Questions**:

**Opportunities**:
- What trends are evident?
- What demographics aren't we targeting?
- What new technology can we use?
- What partnerships are possible?

**Threats**:
- How many competitors exist?
- What's their market share?
- Are regulations changing?
- How are consumer trends shifting?

#### Step 4: Refine Findings

**Prioritization**:
- Clean up duplicate ideas
- Combine similar items
- Rank by importance/impact
- Focus on best ideas and largest risks

**Filtering Criteria**:
- Impact magnitude
- Probability/likelihood
- Time sensitivity
- Resource requirements

#### Step 5: Develop Strategy

**Synthesis**:
- Convert bulleted lists into strategic plan
- Address original objective
- Create actionable initiatives
- Set timelines and owners

**Decision Framework**:
- Do strengths + opportunities outweigh weaknesses + threats?
- Can we mitigate weaknesses?
- Can we defend against threats?
- What's the risk-adjusted return?

### Bismuth SWOT Example

**Objective**: "Should Bismuth integrate Johnny.Decimal, Zettelkasten, and Lightweight Ontologies in MVP or phase them?"

```
┌─────────────────────────────────────┬─────────────────────────────────────┐
│ STRENGTHS                           │ WEAKNESSES                          │
├─────────────────────────────────────┼─────────────────────────────────────┤
│ • Tauri + Rust performance          │ • New codebase (no existing users)  │
│ • Obsidian theme compatibility      │ • Small team (2-3 developers)       │
│ • Local-first architecture          │ • No brand recognition              │
│ • Unique 3-layer knowledge system   │ • Limited development resources     │
│ • Strong technical foundation       │ • Unproven market fit               │
│ • Clear differentiation             │ • Long development timeline (34wks) │
└─────────────────────────────────────┴─────────────────────────────────────┘
┌─────────────────────────────────────┬─────────────────────────────────────┐
│ OPPORTUNITIES                       │ THREATS                             │
├─────────────────────────────────────┼─────────────────────────────────────┤
│ • Growing PKM market                │ • Obsidian dominance (mature)       │
│ • Privacy concerns (local-first)    │ • Notion/Roam competition           │
│ • Obsidian plugin fatigue           │ • User switching costs high         │
│ • Academic/research users           │ • Open-source alternatives          │
│ • Johnny.Decimal community          │ • Feature creep risk                │
│ • Zettelkasten methodology fans     │ • Economic downturn (luxury tool)   │
└─────────────────────────────────────┴─────────────────────────────────────┘
```

**Strategic Insights**:

**Strengths + Opportunities**:
- Unique 3-layer system appeals to methodology enthusiasts
- Local-first + performance addresses Obsidian pain points
- Academic users need better organization (JD + Ontologies)

**Weaknesses + Threats**:
- Small team can't compete on feature breadth
- Long timeline risks market changes
- Must focus on differentiation, not parity

**Recommended Strategy**:
1. **MVP**: Core Zettelkasten only (proven, Obsidian-compatible)
2. **Phase 4**: Add Johnny.Decimal (unique differentiator)
3. **Phase 8**: Add Ontologies (advanced intelligence)
4. **Rationale**: Phased approach manages resources, validates market fit, builds community

### Application to Bismuth

**Use SWOT At Key Decision Points**:

1. **MVP Scope Definition** (Completed)
   - Objective: Which features in MVP?
   - Result: 9 user stories, 14-week timeline

2. **Tech Stack Selection** (Completed)
   - Objective: Tauri vs Electron vs Native?
   - Result: Tauri + Svelte + Rust

3. **Feature Phasing** (Ongoing)
   - Objective: When to add JD/Zettelkasten/Ontologies?
   - Result: Phased approach (MVP → Phase 4 → Phase 8)

4. **Market Entry** (Future)
   - Objective: Beta launch timing and target users?
   - Result: TBD

5. **Competitive Response** (Future)
   - Objective: How to respond to Obsidian updates?
   - Result: TBD

**SWOT Cadence**:
- **Quarterly**: Feature prioritization review
- **Bi-annually**: Competitive landscape analysis
- **Annually**: Strategic direction assessment
- **Ad-hoc**: Major market events, competitor launches

---

## Posner Research Workflow

> **Source**: Miriam Posner, "Embarrassments of riches: Managing research assets" (2011–2013). Digital Humanities scholar. Emphasis: practical, tool-agnostic methodology.

### Core Philosophy

**Problem**: Digital files proliferate frighteningly quickly during research.

**Key Principle**: "There's no 'right' research workflow. The practice that makes sense for you will depend on your own research habits and the kinds of material you work with."

### Library of Congress Four-Step Preservation Framework

| Step | Action | Bismuth Equivalent |
|------|--------|--------------------|
| **Identify** | Audit all digital assets | Vault scan, orphan detection |
| **Decide** | Prioritize what to keep | Lifecycle dashboard (US11) |
| **Organize** | Descriptive names, logical structure | JD + ZK integration |
| **Make Copies** | Multiple locations, periodic checks | Auto-backup, Markdown export |

> **Critical**: "Write down your organizational scheme." Future you won't remember the system.

### Three Pillars

#### 1. Capturing Sources

**Design for how you actually work**, not how you wish you worked.

- Match tool to real workflow (online, archive, library)
- Easy capture is essential — friction kills habits
- Format must be preservable (open formats, not proprietary)
- Organization should be automatic or near-automatic

#### 2. Metadata (Non-Negotiable)

> "Few things are more frustrating than locating just the information you need but not being able to determine its origin."

**Essential fields at point of collection**:
- Source (URL, archive box, page number)
- Date captured
- Project/topic context
- Importance to research

**Bismuth**: Auto-capture source + date in frontmatter; JDex `Location` and `Keywords` fields; ZK reference footer.

#### 3. Searching and Retrieving

- Full-text indexing (Tantivy)
- OCR for scanned documents
- Fuzzy matching for imperfect queries
- Tag-based retrieval
- **Critical question**: Can you export your data? (Bismuth: yes — plain Markdown)

### Tool Categories & Bismuth Mapping

| Tool Category | Purpose | Bismuth Response |
|---------------|---------|-----------------|
| **Backup** | Redundancy, version history | Auto-backup, vault export |
| **Bibliographic** | Save/cite/track sources | Zotero/BibTeX integration (FR-300) |
| **File Renaming** | Descriptive names, date prefixes | JD automation, batch rename (FR-294) |
| **Indexers / Buckets** | Quick capture, full-text search | Inbox buffer + Tantivy |
| **Annotation** | Highlight, comment, markup | PDF annotation (FR-295) |
| **OCR** | Make scans searchable | OCR integration (FR-293) |
| **Databases** | Structured data queries | SQLite + Dataview queries |

### Research Workflow Patterns

#### Pattern 1: Archive Research (Photo-Heavy)
```
Capture → Batch rename (yyyy-mm-dd) → OCR → Annotate → JD organize → Backup
```

#### Pattern 2: Online Research (Web-Heavy)
```
Web clip + annotations → Zotero citation → Tag → Wikilink → Full-text search
```

#### Pattern 3: Library Research (Book-Heavy)
```
Bibliographic capture → PDF annotate → Extract atomic ZK notes → Build MOC → Cite
```

### Bismuth Feature Requirements

- **FR-293**: Research asset management — web clipper, photo import with auto-rename, PDF/OCR import, metadata auto-capture, multi-location backup, Markdown/JSON export
- **FR-294**: Workflow automation — batch rename by pattern, rules-based auto-filing, auto-tagging, template system (research note, web clip, archive photo, bibliography)
- **FR-295**: Annotation system — PDF highlighting + margin comments, web clip with highlights, annotation-to-Zettel pipeline (highlight → quote → interpretation)

### Key Principles for Bismuth

1. **Capture ≠ Organization** — easy capture creates digital hoarding; inbox must funnel to permanent notes
2. **Metadata at point of collection** — not retroactively; auto-capture reduces friction
3. **Document the system** — in-app help, tooltips, and onboarding wizard
4. **Open formats only** — Markdown, JSON; no proprietary lock-in
5. **Workflow must match reality** — flexible defaults, not prescriptive rules

---

## GraphRAG & Hierarchical Lexical Graphs

> **Source**: AWS Labs GraphRAG Toolkit (2024–2026). Open-source Python toolkit for graph-enhanced GenAI applications. Focus: hierarchical lexical graphs for multi-hop retrieval.

### Core Concept

**GraphRAG** combines LLMs with structured knowledge graphs for enhanced question-answering and retrieval. The key innovation is a **hierarchical lexical graph model** that enables multi-hop reasoning over knowledge bases — going far beyond keyword or vector similarity search.

### Vector RAG vs GraphRAG

| Aspect | Vector RAG (Traditional) | GraphRAG (Enhanced) |
|--------|--------------------------|---------------------|
| **Retrieval** | Semantic similarity (top-k chunks) | Graph traversal (multi-hop paths) |
| **Relationships** | None | Typed edges between entities |
| **Reasoning** | Single-hop | Multi-hop |
| **Complexity** | Low | Medium–High |
| **Best for** | Simple factual queries | Complex relational queries |

**Bismuth approach**: Hybrid — vector search for initial retrieval, then graph traversal for relationship discovery, LLM synthesis of combined results.

### Hierarchical Lexical Graph Model

```
Level 1: Document Level
  ├─ Document nodes (title, author, date, source)
  └─ Links to chunks

Level 2: Chunk Level
  ├─ Text segments with vector embeddings
  └─ Links to entities/facts

Level 3: Entity/Fact Level
  ├─ Named entities (Person, Org, Location, Concept)
  ├─ Typed relationships between entities
  └─ Facts as Subject–Predicate–Object triples
```

### Relationship Types

**Hierarchical**: `CONTAINS` (Doc→Chunk), `EXTRACTED_FROM` (Entity→Chunk)

**Semantic**: `RELATED_TO`, `IS_A`, `PART_OF`, `WORKS_FOR`

**Temporal**: `BEFORE`, `AFTER`, `DURING`

**Causal**: `CAUSES`, `ENABLES`, `PREVENTS`

### Multi-Hop Retrieval Examples

**Single-hop** (simple):
```
"Who is the CEO of Tesla?"
Vector search → chunk → answer
Graph: [Tesla] --CEO--> [Elon Musk]
```

**Multi-hop** (complex):
```
"How has the attention mechanism evolved since 2017?"
1. Find "attention mechanism" entity
2. Traverse TEMPORAL edges (BEFORE/AFTER papers)
3. Traverse CITES edges (citation graph)
4. LLM synthesizes evolution narrative
```

### Integration with Bismuth's Knowledge Layers

| Layer | Framework | GraphRAG Enhancement |
|-------|-----------|----------------------|
| Physical | Johnny.Decimal | Document nodes map to JD IDs; graph mirrors folder hierarchy |
| Conceptual | Zettelkasten | Wikilinks → graph edges; Structure Notes → hub nodes; backlinks → bidirectional edges |
| Semantic | Ontologies | Subsumption (⊑) → IS_A edges; concepts → entity nodes |
| Operational | Posner | Metadata → node attributes; capture pipeline → document ingestion |

### Bismuth Feature Requirements

- **FR-296**: Hierarchical lexical graph — auto-create doc nodes for all notes, semantic chunking with embeddings, NER entity extraction, typed relationship edges
- **FR-297**: Multi-hop query engine — natural language query parsing, BFS/DFS/bidirectional traversal, hybrid vector+graph strategy selection, LLM answer synthesis with cited sources
- **FR-298**: Graph visualization — interactive graph view filtered by node/edge type, centrality analysis (important entities), community detection (topic clusters), query path highlighting
- **FR-299**: Automatic graph construction — background vault indexing, incremental graph updates on note change, entity resolution (deduplication, aliases), implicit relationship inference

### Technical Architecture (Bismuth)

**Embedded graph database** (SQLite with graph extension):
- Local-first, no external dependencies
- Fast for small–medium graphs (<100k nodes)
- Exportable to Neo4j/Neptune for large graphs

```sql
CREATE TABLE graph_nodes (
  id TEXT PRIMARY KEY,
  node_type TEXT,       -- "document" | "chunk" | "entity" | "fact"
  label TEXT,
  properties JSON,
  embedding BLOB,       -- for chunk nodes
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE graph_edges (
  id TEXT PRIMARY KEY,
  from_node_id TEXT REFERENCES graph_nodes(id),
  to_node_id   TEXT REFERENCES graph_nodes(id),
  edge_type TEXT,       -- "CONTAINS" | "IS_A" | "LINKS_TO" | etc.
  properties JSON,
  weight REAL,
  created_at TIMESTAMP
);
```

### Key Takeaway

> GraphRAG transforms Bismuth from a note-taking app into an **intelligent knowledge assistant**:
> - **JD**: graph mirrors folder hierarchy
> - **ZK**: wikilinks become graph edges
> - **Ontology**: concepts become entity nodes
> - **Posner**: metadata enriches node attributes
> - **GraphRAG**: ties everything together with multi-hop reasoning

---

## Integration Strategy

### How the Six Frameworks Work Together

```
┌──────────────────────────────────────────────────────────────────┐
│ SWOT Analysis (Strategic Layer)                                 │
│ • Feature prioritization  • Competitive analysis                │
│ • Resource allocation      • Risk assessment                    │
└──────────────────────────────────────────────────────────────────┘
                           ↓ Informs
┌──────────────────────────────────────────────────────────────────┐
│ Posner Research Workflow (Operational Layer)                     │
│ • Capture → Metadata → Organize → Preserve                      │
│ • Bibliographic management • OCR • Annotation • Backup          │
└──────────────────────────────────────────────────────────────────┘
                           ↓ Feeds data into
┌──────────────────────────────────────────────────────────────────┐
│ Knowledge Organization (Core Layers)                            │
│  ┌───────────────┐  ┌───────────────┐  ┌──────────────────────┐ │
│  │Johnny.Decimal │  │ Zettelkasten  │  │ Lightweight Ontology │ │
│  │ (Where is it?)│  │(How connected)│  │  (What does it mean) │ │
│  └───────────────┘  └───────────────┘  └──────────────────────┘ │
│        ↓                    ↓                      ↓             │
│  11.05 Research     [[202405251912]]       machine_learning      │
│  Papers/            ↔ [[202405251915]]     ⊑ AI                 │
└──────────────────────────────────────────────────────────────────┘
                           ↓ Indexes everything into
┌──────────────────────────────────────────────────────────────────┐
│ GraphRAG (Intelligence Layer)                                   │
│ • Hierarchical lexical graph (Doc → Chunk → Entity)             │
│ • Multi-hop reasoning across all notes                          │
│ • Hybrid vector + graph retrieval • LLM synthesis               │
└──────────────────────────────────────────────────────────────────┘
```

### Unified Workflow Example

**Scenario**: Processing a research paper on machine learning

**1. Strategic Decision** (SWOT)
```
Question: Should we add ML paper processing features?
SWOT Analysis:
  Strengths: Academic user base, technical capability
  Weaknesses: Limited resources, not core to MVP
  Opportunities: Research community, differentiation
  Threats: Scope creep, delays
Decision: Defer to Phase 5, focus on core note-taking
```

**2. Physical Organization** (Johnny.Decimal)
```
Create: 11.05 Research Papers/
JDex Note:
  Description: ML research papers and notes
  Location: Filesystem, Zotero
  Keywords: machine-learning, research, papers
```

**3. Conceptual Connection** (Zettelkasten)
```
Buffer: Quick highlights in inbox
Process:
  202405251912 ML Definition (atomic note)
  202405251915 ML Applications (atomic note)
  202405251920 Structure: ML Research (MOC)
Links: [[202405251912]] ↔ [[202405251915]]
```

**4. Semantic Understanding** (Ontology)
```
Extract: machine_learning ⊓ research ⊓ paper
Infer: machine_learning ⊑ artificial_intelligence
Graph: Build semantic relationships
```

**5. Cite & Preserve** (Posner Workflow)
```
Add citation footer:
  [#smith2024ml]: Smith (2024): _ML Basics_, Publisher.
Auto-capture metadata (source, date, URL) in frontmatter
Backup vault, export plain Markdown
```

**6. Retrieval** (All Layers)
```
By location:    Search "11.05"              → All research papers (JD)
By connection:  Navigate [[202405251920]]   → All ML notes (ZK)
By meaning:     Query "concept:ML"          → Related concepts (Ontology)
By reasoning:   "How does X relate to Y?"  → Multi-hop answer (GraphRAG)
```

### Benefits of Integration

1. **Reduced Cognitive Load**: JD limits choices, ZK provides connections, Ontologies add meaning
2. **Multiple Access Paths**: By location (JD), connection (ZK), concept (Ontology), or reasoning (GraphRAG)
3. **Automatic Organization**: System learns from user behavior (Ontologies + GraphRAG)
4. **Strategic Clarity**: SWOT guides feature decisions, prevents scope creep
5. **Practical Workflow**: Posner principles ground the system in real research habits
6. **Intelligent Retrieval**: GraphRAG answers complex multi-hop questions across the whole vault
7. **Scalability**: Each layer scales independently; GraphRAG improves as vault grows
8. **Future-Proof**: Plain Markdown base; can add/remove layers without data loss

---

## Implementation Roadmap

### Phase-by-Phase Integration

#### MVP (Weeks 6-12): Zettelkasten Core

**Why First**: Most immediately useful, Obsidian-compatible, proven methodology

**Features**:
- FR-285: Atomic note creation with auto-generated IDs
- FR-286: Bidirectional linking with backlink detection
- FR-287: Structure notes (MOCs) with visual distinction
- FR-288: Flexible tag system with autocomplete

**Success Criteria**:
- Can create atomic notes with unique IDs
- Wikilinks work bidirectionally
- Backlinks panel shows all references
- Tags enable filtering and discovery

#### Phase 4 (Weeks 15-18): Johnny.Decimal

**Why Second**: Provides structure as vault grows, unique differentiator

**Features**:
- FR-275: Enforce 10-folder limit at Area/Category levels
- FR-276: Auto-suggest next decimal number
- FR-277: JDex integration with note system
- FR-278: Smart search by category

**Success Criteria**:
- Folder creation validates against 10-limit
- System suggests next available ID
- JDex note auto-created with metadata
- Search "15." filters to Travel category

#### Phase 8 (Weeks 31-34): Lightweight Ontologies

**Why Last**: Requires ML/NLP, builds on existing notes, advanced feature

**Features**:
- FR-278: Extract concepts from note titles/content using NLP
- FR-279: Build subsumption hierarchy automatically
- FR-280: Visualize ontology graph alongside file tree
- FR-281: Support faceted classification
- FR-282: Enable complex concept queries
- FR-283: Automatic concept-based recommendations

**Success Criteria**:
- Concepts extracted from notes automatically
- Ontology graph visualizes semantic relationships
- Can query by concept (e.g., "concept:machine_learning")
- System recommends related notes by semantic similarity

#### Ongoing: SWOT Analysis

**When to Use**:
- Quarterly: Feature prioritization review
- Bi-annually: Competitive landscape analysis
- Annually: Strategic direction assessment
- Ad-hoc: Major market events, competitor launches

**Process**:
1. Define objective (e.g., "Add feature X?")
2. Gather data (internal capabilities, external market)
3. Compile SWOT matrix (brainstorm with team)
4. Refine findings (prioritize top 3-5 per quadrant)
5. Develop strategy (Go/No-Go/Defer decision)
6. Document in `/specs/swot/YYYY-MM-DD-[objective].md`

---

## Technical Architecture

### Database Schema

```sql
-- Johnny.Decimal Index
CREATE TABLE jdex_entries (
  id TEXT PRIMARY KEY,           -- "15.52"
  area INTEGER,                  -- 10
  category INTEGER,              -- 15
  item_number INTEGER,           -- 52
  title TEXT,                    -- "Trip to NYC"
  description TEXT,
  location TEXT,                 -- "filesystem, email"
  keywords TEXT,                 -- "travel, nyc, vacation"
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE jdex_relations (
  from_id TEXT,
  to_id TEXT,
  relation_type TEXT,            -- "relates_to", "part_of"
  FOREIGN KEY (from_id) REFERENCES jdex_entries(id),
  FOREIGN KEY (to_id) REFERENCES jdex_entries(id)
);

-- Zettelkasten Notes
CREATE TABLE zettel_notes (
  id TEXT PRIMARY KEY,              -- "202405251912"
  title TEXT,
  content TEXT,
  note_type TEXT,                   -- "content", "structure", "buffer"
  jd_location TEXT,                 -- "11.05" (optional JD integration)
  source_citation TEXT,
  created_at TIMESTAMP,
  modified_at TIMESTAMP
);

CREATE TABLE zettel_links (
  from_note_id TEXT,
  to_note_id TEXT,
  link_type TEXT,                   -- "direct", "sequence", "structure"
  context TEXT,                     -- surrounding text
  FOREIGN KEY (from_note_id) REFERENCES zettel_notes(id),
  FOREIGN KEY (to_note_id) REFERENCES zettel_notes(id)
);

CREATE TABLE zettel_tags (
  note_id TEXT,
  tag TEXT,
  FOREIGN KEY (note_id) REFERENCES zettel_notes(id)
);

-- Lightweight Ontologies
CREATE TABLE ontology_concepts (
  id TEXT PRIMARY KEY,              -- "machine_learning-noun-1"
  concept_type TEXT,                -- "atomic", "complex"
  label TEXT,                       -- "Machine Learning"
  definition TEXT,                  -- WordNet definition or custom
  propositional_dl TEXT,            -- "ML ⊓ research ⊓ paper"
  created_at TIMESTAMP
);

CREATE TABLE ontology_subsumptions (
  child_concept_id TEXT,
  parent_concept_id TEXT,
  confidence REAL,                  -- 0.0-1.0 (for learned relationships)
  FOREIGN KEY (child_concept_id) REFERENCES ontology_concepts(id),
  FOREIGN KEY (parent_concept_id) REFERENCES ontology_concepts(id)
);

CREATE TABLE note_concepts (
  note_id TEXT,
  concept_id TEXT,
  extraction_method TEXT,           -- "title", "content", "manual"
  confidence REAL,
  FOREIGN KEY (note_id) REFERENCES zettel_notes(id),
  FOREIGN KEY (concept_id) REFERENCES ontology_concepts(id)
);
```

### Service Layer Architecture

```rust
// src-tauri/src/services/

// Johnny.Decimal Service
pub struct JDexService {
    db: Arc<Database>,
}

impl JDexService {
    pub fn suggest_next_id(&self, category: u8) -> Result<String>;
    pub fn validate_id(&self, id: &str) -> Result<JDexId>;
    pub fn create_entry(&self, entry: JDexEntry) -> Result<()>;
    pub fn search_by_category(&self, category: u8) -> Result<Vec<JDexEntry>>;
}

// Zettelkasten Service
pub struct ZettelkastenService {
    db: Arc<Database>,
    index: Arc<SearchIndex>,
}

impl ZettelkastenService {
    pub fn generate_id(&self) -> String;
    pub fn create_note(&self, note: ZettelNote) -> Result<()>;
    pub fn extract_links(&self, content: &str) -> Vec<String>;
    pub fn update_backlinks(&self, note_id: &str) -> Result<()>;
    pub fn find_orphans(&self) -> Result<Vec<String>>;
}

// Ontology Service
pub struct OntologyService {
    db: Arc<Database>,
    nlp: Arc<NLPProcessor>,
}

impl OntologyService {
    pub fn extract_concepts(&self, text: &str) -> Result<Vec<Concept>>;
    pub fn build_subsumption(&self, child: &str, parent: &str) -> Result<()>;
    pub fn query_by_concept(&self, concept: &str) -> Result<Vec<String>>;
    pub fn recommend_related(&self, note_id: &str) -> Result<Vec<String>>;
}

// SWOT Service (for documentation/tracking)
pub struct SWOTService {
    db: Arc<Database>,
}

impl SWOTService {
    pub fn create_analysis(&self, swot: SWOTAnalysis) -> Result<()>;
    pub fn list_analyses(&self) -> Result<Vec<SWOTAnalysis>>;
    pub fn get_by_objective(&self, objective: &str) -> Result<SWOTAnalysis>;
}
```

### Frontend Components

```typescript
// src/lib/components/

// Johnny.Decimal Components
- JDexBrowser.svelte           // Browse JDex entries by category
- JDexCreator.svelte           // Create new JDex entry with validation
- JDexSearch.svelte            // Search JDex by category/keywords
- CategoryNavigator.svelte     // Tree view of Areas/Categories/IDs

// Zettelkasten Components
- ZettelEditor.svelte          // CodeMirror editor with wikilink support
- BacklinkPanel.svelte         // Show backlinks to current note
- StructureNoteBuilder.svelte  // Create/edit MOCs
- TagBrowser.svelte            // Browse notes by tag
- LinkGraph.svelte             // Visualize note connections

// Ontology Components
- ConceptExtractor.svelte      // Show extracted concepts from note
- OntologyGraph.svelte         // Visualize concept hierarchy
- SemanticSearch.svelte        // Search by concept
- ConceptRecommender.svelte    // Suggest related notes

// SWOT Components
- SWOTMatrix.svelte            // 4-quadrant SWOT editor
- SWOTHistory.svelte           // List past SWOT analyses
- DecisionLog.svelte           // Track decisions from SWOT
```

---

## User Experience

### Unified Interface

**Main Window Layout**:

```
┌────────────────────────────────────────────────────────────┐
│ Bismuth                                    [Search] [⚙️]    │
├──────────┬─────────────────────────────────────────────────┤
│          │                                                  │
│ Navigator│  Editor                                          │
│          │                                                  │
│ 10-19    │  # 202405251912 Machine Learning Basics          │
│ Life     │                                                  │
│ Admin    │  Machine learning is a subset of AI...          │
│          │                                                  │
│ ├─ 11 Me │  ## Key Concepts                                │
│ ├─ 12    │  - [[202405251915]] Supervised Learning         │
│ │  House │  - [[202405251918]] Neural Networks             │
│ └─ 15    │                                                  │
│    Travel│  #machine-learning #ai #basics                  │
│    ├─15.52│                                                 │
│    └─15.53│  ---                                            │
│          │  Backlinks (3):                                 │
│ 20-29    │  - [[202405251920]] Structure: ML Research      │
│ Projects │  - [[202405252001]] Deep Learning Overview      │
│          │                                                  │
├──────────┼─────────────────────────────────────────────────┤
│ Views:   │ Concepts: machine_learning ⊑ AI                 │
│ • JDex   │ Related: [[202405251930]] AI Ethics             │
│ • Graph  │                                                  │
│ • Tags   │                                                  │
│ • Ontology│                                                 │
└──────────┴─────────────────────────────────────────────────┘
```

### View Modes

#### 1. JDex View (Johnny.Decimal)

```
┌─────────────────────────────────────┐
│ JDex Browser                        │
├─────────────────────────────────────┤
│ Search: [15.                    ]   │
│                                     │
│ 15 Travel (34 items)                │
│ ├─ 15.22 Travel insurance           │
│ │  Location: Email, filesystem      │
│ │  Keywords: policy, claim          │
│ ├─ 15.51 Vietnam, 2024              │
│ ├─ 15.52 New Zealand, 2024          │
│ └─ 15.53 Japan, 2025                │
│                                     │
│ [Create New ID]                     │
└─────────────────────────────────────┘
```

#### 2. Graph View (Zettelkasten)

```
┌─────────────────────────────────────┐
│ Link Graph                          │
├─────────────────────────────────────┤
│ Filter: [Tags ▼] [Date ▼] [Type ▼] │
│                                     │
│     [Structure: ML] ──┬── [ML Basics]
│                       ├── [Deep Learning]
│                       ├── [Neural Nets]
│                       └── [Applications]
│                              ├── [Image Recognition]
│                              └── [NLP]
│                                     │
│ Selected: ML Basics                 │
│ Links: 5 outbound, 3 inbound        │
│ Tags: #machine-learning #basics     │
└─────────────────────────────────────┘
```

#### 3. Ontology View (Lightweight Ontologies)

```
┌─────────────────────────────────────┐
│ Concept Hierarchy                   │
├─────────────────────────────────────┤
│ Computer Science                    │
│ └─ Artificial Intelligence          │
│    ├─ Machine Learning              │
│    │  ├─ Supervised Learning        │
│    │  ├─ Unsupervised Learning      │
│    │  └─ Deep Learning              │
│    │     └─ Neural Networks         │
│    └─ Natural Language Processing   │
│                                     │
│ Notes tagged with "Machine Learning":
│ - 202405251912 ML Basics (5 links)  │
│ - 202405251915 ML Applications      │
│ - 202405251920 Structure: ML        │
│                                     │
│ [Search by Concept]                 │
└─────────────────────────────────────┘
```

### Folder Creation Dialog (Integrated)

```
┌─────────────────────────────────────┐
│ Create New Note                     │
├─────────────────────────────────────┤
│ Title: [Machine Learning Basics]    │
│                                     │
│ ┌─ Johnny.Decimal ─────────────┐   │
│ │ Category: [11 Research ▼]    │   │
│ │ Next ID: 11.05 (suggested)   │   │
│ │ Location: Filesystem         │   │
│ └──────────────────────────────┘   │
│                                     │
│ ┌─ Zettelkasten ───────────────┐   │
│ │ ID: 202405251912 (auto)      │   │
│ │ Type: ○ Content Note         │   │
│ │       ● Structure Note       │   │
│ │       ○ Buffer Note          │   │
│ │ Tags: #machine-learning      │   │
│ └──────────────────────────────┘   │
│                                     │
│ ┌─ Ontology ────────────────────┐  │
│ │ Auto-extract concepts: ✓      │  │
│ │ Detected: machine_learning,   │  │
│ │           basics, research    │  │
│ └──────────────────────────────┘  │
│                                     │
│ This will create:                   │
│ • Folder: 11.05 ML Basics/          │
│ • JDex Note: 11.05 ML Basics        │
│ • Zettel: 202405251912              │
│ • Concepts: 3 extracted             │
│                                     │
│ [Cancel]              [Create]      │
└─────────────────────────────────────┘
```

---

## Success Metrics

### Quantitative Metrics

#### Johnny.Decimal
- **Folder Compliance**: % of folders following JD structure
- **JDex Coverage**: % of IDs with JDex notes
- **Search Efficiency**: Time to find item by category (target: <5s)
- **Duplicate Prevention**: # of duplicate IDs prevented

#### Zettelkasten
- **Note Count**: Total notes created over time
- **Link Density**: Average links per note (target: >3)
- **Orphan Rate**: % of notes with 0 links (target: <10%)
- **Structure Note Coverage**: % of notes in at least one MOC

#### Lightweight Ontologies
- **Concept Extraction Accuracy**: % of correctly extracted concepts (target: >80%)
- **Subsumption Correctness**: % of correct parent-child relationships
- **Semantic Search Precision**: Relevance of concept-based search results
- **Recommendation Click-Through**: % of recommended notes opened

#### SWOT Analysis
- **Decision Velocity**: Time from SWOT to decision (target: <1 week)
- **Analysis Frequency**: # of SWOT analyses per quarter
- **Implementation Rate**: % of SWOT decisions implemented
- **Outcome Accuracy**: % of decisions that achieved intended result

### Qualitative Metrics

#### User Satisfaction
- **Ease of Finding Information**: Survey rating (1-5)
- **Confidence in Organization**: Survey rating (1-5)
- **Serendipitous Discovery**: Frequency of unexpected connections
- **Learning Retention**: Self-reported knowledge retention

#### System Health
- **Consistency**: Adherence to organizational principles
- **Maintainability**: Ease of system upkeep
- **Scalability**: Performance with growing vault size
- **Flexibility**: Ability to adapt to new workflows

### Success Criteria by Phase

#### MVP (Zettelkasten)
- ✅ Can create atomic notes with unique IDs
- ✅ Wikilinks work bidirectionally
- ✅ Backlinks panel shows all references
- ✅ Tags enable filtering and discovery
- ✅ Link density >2 per note
- ✅ Orphan rate <15%

#### Phase 4 (Johnny.Decimal)
- ✅ Folder creation validates against 10-limit
- ✅ System suggests next available ID
- ✅ JDex note auto-created with metadata
- ✅ Search "15." filters to Travel category
- ✅ JDex coverage >80%
- ✅ Search time <5s

#### Phase 8 (Lightweight Ontologies)
- ✅ Concepts extracted from notes automatically
- ✅ Ontology graph visualizes semantic relationships
- ✅ Can query by concept
- ✅ System recommends related notes
- ✅ Extraction accuracy >80%
- ✅ Recommendation CTR >20%

---

## Appendices

### A. Glossary

**Atomic Note**: A note containing a single, complete idea that is self-contained and reusable.

**Backlink**: A reference showing which notes link to the current note.

**Category**: In Johnny.Decimal, a collection of similar items (e.g., 15 Travel).

**Concept**: In ontologies, a formal representation of an idea or class of objects.

**JDex**: Johnny.Decimal Index, the master record of all IDs in a system.

**MOC (Map of Content)**: A structure note that organizes related notes on a topic.

**Ontology**: A formal specification of concepts and their relationships.

**Subsumption**: A relationship where one concept is a subset of another (⊑).

**SWOT**: Strengths, Weaknesses, Opportunities, Threats analysis framework.

**Zettel**: A single note in the Zettelkasten system.

### B. References

**Lightweight Ontologies**:
- Giunchiglia, F., & Zaihrayeu, I. (2007). Lightweight Ontologies. University of Trento.

**Johnny.Decimal**:
- Noble, J. (2024). Johnny.Decimal System. https://johnnydecimal.com

**Zettelkasten**:
- Ahrens, S. (2017). How to Take Smart Notes. Sönke Ahrens.
- Luhmann, N. (1992). Communicating with Slip Boxes. Translated by Manfred Kuehn.
- Sascha Fast (2020). Introduction to the Zettelkasten Method. zettelkasten.de
- Sascha Fast (2019). Three Layers of Evidence. zettelkasten.de
- Christian Tietze (2013). Manage Citations for a Zettelkasten. zettelkasten.de
- Sascha Fast (2018). The Barbell Method of Reading. zettelkasten.de

**SWOT Analysis**:
- Andrews, K. (1971). The Concept of Corporate Strategy. Dow Jones-Irwin.

**Posner Research Workflow**:
- Posner, M. (2013). Embarrassments of riches: Managing research assets.
- Library of Congress Digital Preservation Guidelines.
- Turkel, W. J. Workflow for Digital Research Using Off-the-Shelf Tools.

**GraphRAG**:
- AWS Labs GraphRAG Toolkit (2024–2026). Hierarchical Lexical Graph for Enhanced Multi-Hop Retrieval.
- Microsoft GraphRAG (2024).
- LlamaIndex Knowledge Graph documentation.

### C. Related Documents

- [spec.md](./spec.md) - Feature specification (306 FRs)
- [plan.md](./plan.md) - Implementation plan (14-week MVP, 34-week full)
- [research.md](./research.md) - Phase 0 technical research
- [requirements.md](./checklists/requirements.md) - Requirements checklist

### D. Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2026-05-25 | Initial documentation of all four frameworks | Cascade |
| 2.0.0 | 2026-05-25 | Added Posner Research Workflow (FR-293–295), GraphRAG (FR-296–299), Zettelkasten deep dive (FR-300–303); expanded to six frameworks | Cascade |
| 2.1.0 | 2026-05-25 | Added JD community deep dive: 3-digit IDs, PARA hybrid, System area, archive-as-area, file naming philosophy, consulting inversion (FR-304–306) | Cascade |

---

**Document Status**: ✅ Complete  
**Next Review**: 2026-06-25 (monthly)  
**Owner**: Product Team  
**Stakeholders**: Engineering, Design, Users

