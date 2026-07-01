# Bismuth Small-Scale Demo Plan

## Objective

Build a minimal viable demo showcasing Bismuth's core value proposition:
**A local-first markdown editor with Johnny.Decimal organization and Zettelkasten linking.**

**Timeline**: 2 weeks (10 working days)  
**Scope**: Prove the concept works, not production-ready  
**Goal**: Demonstrate to potential users/investors

---

## Demo Features (Minimal Viable)

### ✅ Must Have (Week 1)

**1. Vault Management**

- Open existing folder as vault
- Scan markdown files
- Display file list

**2. Basic Editor**

- Open markdown file
- Edit with CodeMirror
- Save changes (disk-first)
- Syntax highlighting

**3. Johnny.Decimal Basics**

- Parse JD IDs from filenames (e.g., `15.52 Trip to NYC.md`)
- Display JD badge on notes
- Group by Area in sidebar (10-19, 20-29, etc.)
- Category filter

**4. Wikilinks**

- Parse `[[wikilinks]]` in content
- Click to navigate
- Show backlinks panel

**5. Simple Layout**

- Sidebar (file tree + JD areas)
- Note list (filtered)
- Editor (CodeMirror)
- Right panel (backlinks)

### 🎯 Nice to Have (Week 2)

**6. JD Auto-Suggest**

- Suggest next available ID in category
- Show in "Create Note" dialog

**7. Search**

- Simple text search across files
- Filter by JD category

**8. Graph View**

- Basic force-directed graph
- Nodes = notes, edges = wikilinks
- Click to navigate

**9. Polish**

- Keyboard shortcuts (Cmd+N, Cmd+P, etc.)
- Loading states
- Error handling

---

## Tech Stack (Simplified)

### Frontend

- **Framework**: Svelte 5 (simpler than React for demo)
- **Editor**: CodeMirror 6 (lightweight, extensible)
- **UI**: TailwindCSS (no component library for speed)
- **Icons**: Phosphor Icons
- **Graph**: force-graph (simple force-directed layout)

### Backend

- **Desktop**: Tauri v2
- **Language**: Rust
- **File Parsing**: gray_matter (frontmatter), pulldown-cmark (markdown)
- **Watcher**: notify (filesystem changes)

### No Database

- Read files on demand
- In-memory cache for current session
- No SQLite, no complex indexing (yet)

---

## File Structure

```
bismuth/
├── src/                          # Svelte frontend
│   ├── lib/
│   │   ├── components/
│   │   │   ├── Sidebar.svelte
│   │   │   ├── NoteList.svelte
│   │   │   ├── Editor.svelte
│   │   │   ├── BacklinksPanel.svelte
│   │   │   └── GraphView.svelte
│   │   ├── stores/
│   │   │   ├── vault.ts
│   │   │   ├── selection.ts
│   │   │   └── wikilinks.ts
│   │   └── utils/
│   │       ├── jd.ts             # JD parsing
│   │       ├── wikilinks.ts      # Wikilink parsing
│   │       └── markdown.ts       # Markdown utilities
│   ├── App.svelte
│   └── main.ts
├── src-tauri/                    # Rust backend
│   ├── src/
│   │   ├── commands/
│   │   │   ├── vault.rs          # Vault operations
│   │   │   ├── notes.rs          # Note CRUD
│   │   │   └── search.rs         # Simple search
│   │   ├── models/
│   │   │   └── note.rs           # Note struct
│   │   └── main.rs
│   └── Cargo.toml
└── docs/
    ├── TOLARIA_ARCHITECTURE_ANALYSIS.md
    ├── BISMUTH_ARCHITECTURE_PROPOSAL.md
    └── DEMO_PLAN.md
```

---

## Day-by-Day Plan

### Week 1: Core Functionality

#### Day 1: Project Setup

- [x] Initialize Tauri + Svelte project
- [ ] Set up TailwindCSS
- [ ] Install CodeMirror 6
- [ ] Basic app shell (empty panels)

**Deliverable**: App opens with empty layout

#### Day 2: Vault Management

- [ ] Tauri command: `open_vault(path)` → scan directory
- [ ] Tauri command: `list_notes()` → return note list
- [ ] Svelte store: `vault` (current vault path, notes)
- [ ] Sidebar: Display file tree

**Deliverable**: Open folder, see files in sidebar

#### Day 3: Basic Editor

- [ ] Tauri command: `read_note(path)` → return content
- [ ] Tauri command: `write_note(path, content)` → save to disk
- [ ] CodeMirror integration
- [ ] Save on Cmd+S

**Deliverable**: Open file, edit, save

#### Day 4: Johnny.Decimal Parsing

- [ ] Rust: Parse JD ID from filename (`15.52 Trip.md` → `{area: 10, category: 15, item: 52}`)
- [ ] Add `jd_id`, `jd_area`, `jd_category` to Note struct
- [ ] Svelte: Display JD badge on notes
- [ ] Sidebar: Group by Area (10-19, 20-29, etc.)

**Deliverable**: Notes show JD badges, grouped by area

#### Day 5: Wikilink Parsing

- [ ] Rust: Parse `[[wikilinks]]` from markdown content
- [ ] Add `outgoing_links` to Note struct
- [ ] Svelte: Compute backlinks (reverse index)
- [ ] Editor: Click wikilink to navigate
- [ ] Right panel: Show backlinks

**Deliverable**: Click wikilinks, see backlinks

### Week 2: Enhancement & Polish

#### Day 6: JD Auto-Suggest

- [ ] Rust: `suggest_next_jd_id(category)` → scan existing, suggest next
- [ ] Svelte: "Create Note" dialog
- [ ] Show suggested ID
- [ ] Create note with JD ID in filename

**Deliverable**: Create note with auto-suggested JD ID

#### Day 7: Simple Search

- [ ] Rust: `search_notes(query)` → grep-like search
- [ ] Svelte: Search input in sidebar
- [ ] Filter note list by search results
- [ ] Highlight matches

**Deliverable**: Search for text, see matching notes

#### Day 8: Graph View

- [ ] Svelte: Force-directed graph with `force-graph`
- [ ] Nodes = notes (colored by JD area)
- [ ] Edges = wikilinks
- [ ] Click node to open note
- [ ] Right panel toggle: Backlinks ↔ Graph

**Deliverable**: Visual graph of note connections

#### Day 9: Keyboard Shortcuts

- [ ] Cmd+N: Create note
- [ ] Cmd+P: Quick open (fuzzy search)
- [ ] Cmd+F: Search
- [ ] Cmd+G: Toggle graph view
- [ ] Cmd+\: Toggle sidebar

**Deliverable**: Keyboard-driven workflow

#### Day 10: Polish & Demo Prep

- [ ] Loading states (spinner while scanning vault)
- [ ] Error handling (file not found, permission denied)
- [ ] Empty states (no vault open, no notes)
- [ ] Demo vault with sample notes
- [ ] Record demo video (3-5 minutes)

**Deliverable**: Polished demo ready to show

---

## Demo Vault Structure

Create a sample vault to showcase features:

```
demo-vault/
├── 10-19 Life Admin/
│   ├── 11 Personal/
│   │   ├── 11.01 Goals 2026.md
│   │   └── 11.02 Health Tracker.md
│   └── 15 Travel/
│       ├── 15.51 Vietnam 2024.md
│       ├── 15.52 New Zealand 2024.md
│       └── 15.53 Japan 2025.md
├── 20-29 Projects/
│   ├── 21 Software/
│   │   ├── 21.01 Bismuth PKM.md
│   │   ├── 21.02 Portfolio Site.md
│   │   └── 21.03 Open Source Contributions.md
│   └── 22 Writing/
│       ├── 22.01 Blog Post Ideas.md
│       └── 22.02 Book Outline.md
└── 30-39 Learning/
    ├── 31 Programming/
    │   ├── 31.01 Rust Basics.md
    │   ├── 31.02 Svelte Tutorial.md
    │   └── 31.03 Tauri Deep Dive.md
    └── 32 Design/
        ├── 32.01 UI Patterns.md
        └── 32.02 Color Theory.md
```

**Sample Note** (`21.01 Bismuth PKM.md`):

```markdown
---
jd_id: '21.01'
jd_area: 20
jd_category: 21
type: Project
status: active
tags: [pkm, software, tauri, svelte]
---

# Bismuth PKM

A local-first personal knowledge management system combining [[Johnny.Decimal]] organization with [[Zettelkasten]] linking.

## Goals

- Prove the concept works
- Demo to potential users
- Validate architecture decisions

## Related

- [[31.01 Rust Basics]] - Backend implementation
- [[31.02 Svelte Tutorial]] - Frontend framework
- [[31.03 Tauri Deep Dive]] - Desktop shell

## Resources

- [Tolaria](https://github.com/refactoringhq/tolaria) - Inspiration
- [Johnny.Decimal](https://johnnydecimal.com) - Organization system
```

---

## What's NOT in the Demo

### Explicitly Out of Scope

❌ **Zettelkasten IDs** - Just use JD IDs for now  
❌ **Ontology/Concepts** - Too complex for demo  
❌ **GraphRAG** - Advanced feature, not needed  
❌ **Git Integration** - Manual saves only  
❌ **Multi-vault** - Single vault only  
❌ **Templates** - Manual note creation  
❌ **Tags UI** - Just frontmatter for now  
❌ **Export** - Not needed for demo  
❌ **Settings Panel** - Hardcoded defaults  
❌ **Themes** - Single light theme  
❌ **Mobile** - Desktop only

### Can Add Later

These are important but not for initial demo:

- Full Zettelkasten workflow (timestamp IDs, note types)
- Lightweight ontologies (concept extraction)
- GraphRAG (multi-hop search)
- Git version control
- Advanced search (Tantivy)
- Saved views/filters
- Customization (themes, fonts, etc.)

---

## Success Criteria

### Demo Must Show

1. ✅ **Open a vault** - Select folder, see notes
2. ✅ **JD organization** - Notes grouped by area, JD badges visible
3. ✅ **Edit a note** - Open, edit, save (disk-first)
4. ✅ **Navigate via wikilinks** - Click `[[link]]` to open note
5. ✅ **See backlinks** - Right panel shows incoming links
6. ✅ **Create note with JD ID** - Auto-suggest next ID (e.g., "15.54")
7. ✅ **Search** - Find notes by content
8. ✅ **Graph view** - Visual representation of connections

### Demo Should Feel

- **Fast** - No lag when opening notes
- **Reliable** - No crashes, no data loss
- **Intuitive** - Clear what each panel does
- **Professional** - Clean UI, no obvious bugs

---

## Technical Decisions for Demo

### Simplifications

1. **No Database**: Read files on demand, cache in memory
2. **No Complex Parsing**: Simple regex for JD IDs and wikilinks
3. **No Frontmatter Validation**: Trust user input
4. **No Conflict Resolution**: Last write wins
5. **No Undo/Redo**: Browser/editor handles it
6. **No Auto-Save**: Manual save only (Cmd+S)

### Why These Are OK for Demo

- **Speed**: Get to working demo faster
- **Simplicity**: Less code = fewer bugs
- **Proof of Concept**: Show the idea works
- **Iterate Later**: Can add complexity after validation

---

## Demo Script (5 minutes)

### Minute 1: Introduction

> "Bismuth is a local-first PKM that combines Johnny.Decimal organization with Zettelkasten linking. Let me show you how it works."

### Minute 2: Open Vault & JD Organization

> "I'll open my demo vault. Notice how notes are automatically grouped by Johnny.Decimal areas: 10-19 Life Admin, 20-29 Projects, 30-39 Learning. Each note has a JD ID like 15.52 or 21.01."

### Minute 3: Edit & Wikilinks

> "Let's open this note about Bismuth. I can edit it with full markdown support. Notice the wikilinks in double brackets? I can click them to navigate. The right panel shows backlinks—other notes that link here."

### Minute 4: Create Note & Auto-Suggest

> "When I create a new note, Bismuth suggests the next available JD ID. I'm in the Travel category (15), and the last note was 15.53, so it suggests 15.54. This keeps my system organized without thinking."

### Minute 5: Search & Graph

> "I can search across all notes. And here's the graph view—each node is a note, colored by JD area. Edges show wikilinks. This helps me see how my knowledge is connected."

**Closing**:

> "That's Bismuth—local-first, organized by Johnny.Decimal, connected by Zettelkasten. Your notes, your structure, your control."

---

## Next Steps After Demo

### If Demo Goes Well

1. **User Feedback**: Show to 5-10 potential users
2. **Iterate**: Fix pain points, add most-requested features
3. **Expand Scope**: Add Zettelkasten IDs, ontologies, GraphRAG
4. **Production Ready**: Testing, error handling, edge cases
5. **Beta Launch**: Limited release to early adopters

### If Demo Needs Work

1. **Identify Issues**: What didn't work? What felt clunky?
2. **Prioritize Fixes**: Focus on biggest pain points
3. **Refine**: Improve UX, performance, reliability
4. **Re-demo**: Show improved version

---

## Resources Needed

### Development

- **Time**: 2 weeks (80 hours)
- **Tools**: VS Code, Rust toolchain, Node.js, pnpm
- **Hardware**: Mac/Linux/Windows for testing

### Demo

- **Sample Vault**: 20-30 markdown files with JD structure
- **Recording**: Screen recording software (QuickTime, OBS)
- **Presentation**: Slides or script

### Optional

- **Feedback**: Google Form or Typeform for user feedback
- **Analytics**: Simple usage tracking (optional)

---

## Risk Mitigation

### Technical Risks

**Risk**: CodeMirror integration is complex  
**Mitigation**: Use basic setup first, add features incrementally

**Risk**: Wikilink parsing breaks on edge cases  
**Mitigation**: Simple regex for demo, improve later

**Risk**: Performance issues with large vaults  
**Mitigation**: Test with 100-500 notes, optimize if needed

### Scope Risks

**Risk**: Feature creep (adding too much)  
**Mitigation**: Stick to must-have list, defer nice-to-haves

**Risk**: Not enough to impress  
**Mitigation**: Focus on core value prop (JD + ZK), polish what's there

### Timeline Risks

**Risk**: 2 weeks isn't enough  
**Mitigation**: Cut nice-to-haves, ship minimal demo

**Risk**: Bugs delay demo  
**Mitigation**: Test daily, fix critical bugs immediately

---

## Conclusion

This plan focuses on **proving the concept** with a minimal but polished demo. By limiting scope to Johnny.Decimal organization and Zettelkasten linking, we can deliver a working demo in 2 weeks that showcases Bismuth's unique value proposition.

**Key Principle**: Ship something small that works, then iterate based on feedback.

**Success Metric**: Can a user open a vault, navigate via wikilinks, and create a new note with auto-suggested JD ID in under 5 minutes?

If yes, the demo succeeds. 🚀

---

**Created**: 2026-05-25  
**Author**: Cascade AI  
**Status**: Ready to Execute
