# Bismuth Demo - Implementation Checklist

## Pre-Development Setup

- [ ] Verify Tauri CLI installed (`cargo install tauri-cli`)
- [ ] Verify Node.js 18+ and pnpm installed
- [ ] Create demo vault with sample notes (20-30 files)
- [ ] Set up Git branch: `git checkout -b demo/mvp`

---

## Week 1: Core Functionality

### Day 1: Project Setup ✅
- [x] Tauri + Svelte project initialized
- [ ] Install dependencies:
  ```bash
  pnpm add -D tailwindcss postcss autoprefixer
  pnpm add codemirror @codemirror/lang-markdown @codemirror/theme-one-dark
  pnpm add phosphor-svelte
  ```
- [ ] Configure TailwindCSS
- [ ] Create basic layout structure:
  - [ ] `src/lib/components/Sidebar.svelte`
  - [ ] `src/lib/components/NoteList.svelte`
  - [ ] `src/lib/components/Editor.svelte`
  - [ ] `src/lib/components/BacklinksPanel.svelte`
- [ ] Test: App opens with empty 4-panel layout

### Day 2: Vault Management
**Rust Backend**:
- [ ] Create `src-tauri/src/commands/vault.rs`
- [ ] Implement `open_vault(path: String) -> Result<Vec<Note>>`
  - [ ] Scan directory recursively
  - [ ] Filter for `.md` files
  - [ ] Parse filename for JD ID
  - [ ] Return note list
- [ ] Implement `list_notes() -> Result<Vec<Note>>`
- [ ] Add Note struct:
  ```rust
  #[derive(Serialize, Deserialize)]
  pub struct Note {
      pub path: String,
      pub filename: String,
      pub title: String,
      pub jd_id: Option<String>,
      pub jd_area: Option<u8>,
      pub jd_category: Option<u8>,
      pub modified_at: u64,
  }
  ```

**Svelte Frontend**:
- [ ] Create `src/lib/stores/vault.ts`
  ```typescript
  export const vault = writable<{
    path: string | null
    notes: Note[]
    isLoading: boolean
  }>({
    path: null,
    notes: [],
    isLoading: false
  })
  ```
- [ ] Implement vault opening flow
- [ ] Display notes in Sidebar
- [ ] Test: Open folder, see markdown files listed

### Day 3: Basic Editor
**Rust Backend**:
- [ ] Create `src-tauri/src/commands/notes.rs`
- [ ] Implement `read_note(path: String) -> Result<String>`
  - [ ] Read file from disk
  - [ ] Return content
- [ ] Implement `write_note(path: String, content: String) -> Result<()>`
  - [ ] Write to disk (atomic write)
  - [ ] Update modified timestamp
- [ ] Add error handling (file not found, permission denied)

**Svelte Frontend**:
- [ ] Create `src/lib/components/CodeMirrorEditor.svelte`
- [ ] Set up CodeMirror 6:
  - [ ] Markdown language support
  - [ ] Basic extensions (line numbers, highlight active line)
  - [ ] Save on Cmd+S
- [ ] Create `src/lib/stores/selection.ts`
  ```typescript
  export const selection = writable<{
    activeNote: Note | null
    content: string
    isDirty: boolean
  }>({
    activeNote: null,
    content: '',
    isDirty: false
  })
  ```
- [ ] Implement open note flow
- [ ] Implement save flow (disk-first)
- [ ] Test: Open file, edit, save, verify on disk

### Day 4: Johnny.Decimal Parsing
**Rust Backend**:
- [ ] Create `src-tauri/src/utils/jd.rs`
- [ ] Implement JD ID parser:
  ```rust
  pub fn parse_jd_id(filename: &str) -> Option<JDId> {
      // Regex: (\d{2})\.(\d{2})\s+(.+)\.md
      // Example: "15.52 Trip to NYC.md"
      // Returns: JDId { area: 10, category: 15, item: 52 }
  }
  ```
- [ ] Update Note struct with JD fields
- [ ] Parse JD ID during vault scan
- [ ] Test: Verify JD parsing with various filenames

**Svelte Frontend**:
- [ ] Create `src/lib/components/JDBadge.svelte`
  ```svelte
  <span class="jd-badge">
    {jdId}
  </span>
  ```
- [ ] Create `src/lib/components/AreaSection.svelte`
- [ ] Group notes by area in Sidebar
- [ ] Display JD badge on each note
- [ ] Test: Notes show JD badges, grouped by area (10-19, 20-29, etc.)

### Day 5: Wikilink Parsing
**Rust Backend**:
- [ ] Create `src-tauri/src/utils/wikilinks.rs`
- [ ] Implement wikilink parser:
  ```rust
  pub fn parse_wikilinks(content: &str) -> Vec<String> {
      // Regex: \[\[([^\]]+)\]\]
      // Returns: ["Note Title", "Another Note"]
  }
  ```
- [ ] Add `outgoing_links: Vec<String>` to Note struct
- [ ] Parse wikilinks during note read
- [ ] Test: Verify wikilink parsing

**Svelte Frontend**:
- [ ] Create `src/lib/stores/wikilinks.ts`
- [ ] Compute backlinks (reverse index):
  ```typescript
  export const backlinks = derived(
    [vault, selection],
    ([$vault, $selection]) => {
      if (!$selection.activeNote) return []
      return $vault.notes.filter(note =>
        note.outgoing_links.includes($selection.activeNote.title)
      )
    }
  )
  ```
- [ ] Create `src/lib/components/BacklinksPanel.svelte`
- [ ] Make wikilinks clickable in editor (CodeMirror extension)
- [ ] Test: Click wikilink, navigate to note; see backlinks in panel

---

## Week 2: Enhancement & Polish

### Day 6: JD Auto-Suggest
**Rust Backend**:
- [ ] Implement `suggest_next_jd_id(category: u8) -> Result<String>`
  - [ ] Scan existing notes in category
  - [ ] Find highest item number
  - [ ] Return next available (e.g., "15.54")
- [ ] Test: Verify suggestion logic

**Svelte Frontend**:
- [ ] Create `src/lib/components/CreateNoteDialog.svelte`
- [ ] Add category selector
- [ ] Show suggested JD ID
- [ ] Create note with JD ID in filename
- [ ] Test: Create note, verify filename format

### Day 7: Simple Search
**Rust Backend**:
- [ ] Create `src-tauri/src/commands/search.rs`
- [ ] Implement `search_notes(query: String) -> Result<Vec<Note>>`
  - [ ] Simple grep-like search
  - [ ] Search in filename and content
  - [ ] Return matching notes
- [ ] Test: Search for text, verify results

**Svelte Frontend**:
- [ ] Create `src/lib/components/SearchInput.svelte`
- [ ] Add search input to Sidebar
- [ ] Filter note list by search results
- [ ] Highlight search term in results
- [ ] Test: Search, see filtered results

### Day 8: Graph View
**Svelte Frontend**:
- [ ] Install force-graph: `pnpm add force-graph`
- [ ] Create `src/lib/components/GraphView.svelte`
- [ ] Build graph data from notes and wikilinks:
  ```typescript
  const graphData = {
    nodes: notes.map(n => ({
      id: n.path,
      label: n.title,
      color: getAreaColor(n.jd_area)
    })),
    links: notes.flatMap(n =>
      n.outgoing_links.map(target => ({
        source: n.path,
        target: findNoteByTitle(target)?.path
      }))
    )
  }
  ```
- [ ] Add click handler to open note
- [ ] Add toggle in right panel: Backlinks ↔ Graph
- [ ] Test: View graph, click node, navigate

### Day 9: Keyboard Shortcuts
**Svelte Frontend**:
- [ ] Create `src/lib/utils/shortcuts.ts`
- [ ] Implement shortcuts:
  - [ ] Cmd+N: Create note
  - [ ] Cmd+P: Quick open (fuzzy search)
  - [ ] Cmd+F: Search
  - [ ] Cmd+G: Toggle graph view
  - [ ] Cmd+\: Toggle sidebar
  - [ ] Cmd+S: Save (already implemented)
- [ ] Add keyboard hint tooltips
- [ ] Test: Verify all shortcuts work

### Day 10: Polish & Demo Prep
**Polish**:
- [ ] Add loading spinner during vault scan
- [ ] Add error messages (toast notifications)
- [ ] Add empty states:
  - [ ] No vault open
  - [ ] No notes in vault
  - [ ] No search results
  - [ ] No backlinks
- [ ] Fix any visual bugs
- [ ] Test on macOS, Windows, Linux (if possible)

**Demo Vault**:
- [ ] Create `demo-vault/` with 20-30 sample notes
- [ ] Ensure JD structure is clear (10-19, 20-29, 30-39)
- [ ] Add wikilinks between notes
- [ ] Add frontmatter to some notes

**Demo Recording**:
- [ ] Write demo script (5 minutes)
- [ ] Practice demo 2-3 times
- [ ] Record screen with audio
- [ ] Edit video (trim, add titles if needed)
- [ ] Upload to YouTube/Vimeo (unlisted)

---

## Testing Checklist

### Functional Tests
- [ ] Open vault with 100+ notes (performance)
- [ ] Open vault with 0 notes (empty state)
- [ ] Open note with no wikilinks (empty backlinks)
- [ ] Open note with 10+ backlinks (scrolling)
- [ ] Edit note, don't save, close (dirty state warning)
- [ ] Edit note, save, verify on disk
- [ ] Create note with JD ID
- [ ] Create note without JD ID (fallback)
- [ ] Search with no results
- [ ] Search with 50+ results
- [ ] Navigate via wikilink
- [ ] Navigate via graph
- [ ] Use all keyboard shortcuts

### Edge Cases
- [ ] Filename with special characters
- [ ] Wikilink to non-existent note
- [ ] Circular wikilinks (A → B → A)
- [ ] Very long note (10,000+ lines)
- [ ] Binary file in vault (should ignore)
- [ ] Nested folders (should flatten or show hierarchy)
- [ ] File permission errors
- [ ] Disk full error

### Browser Compatibility
- [ ] Test on Chrome/Chromium
- [ ] Test on Safari (macOS)
- [ ] Test on Firefox

---

## Pre-Demo Checklist

### Code Quality
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] No Rust warnings
- [ ] Code formatted (Prettier, rustfmt)
- [ ] Remove debug logs

### Documentation
- [ ] README.md with setup instructions
- [ ] Demo script written
- [ ] Known issues documented

### Demo Environment
- [ ] Demo vault ready
- [ ] App builds successfully
- [ ] App runs without crashes
- [ ] Screen recording software ready
- [ ] Backup demo vault (in case of corruption)

---

## Post-Demo Checklist

### Immediate
- [ ] Gather feedback (form or notes)
- [ ] Document bugs found during demo
- [ ] Prioritize feedback items

### Follow-up
- [ ] Share demo video with stakeholders
- [ ] Schedule feedback review meeting
- [ ] Plan next iteration based on feedback

---

## Quick Reference

### Build Commands
```bash
# Development
pnpm tauri dev

# Build for production
pnpm tauri build

# Run tests (when added)
pnpm test
```

### Tauri Commands (Rust → JS)
```typescript
import { invoke } from '@tauri-apps/api/tauri'

// Open vault
const notes = await invoke('open_vault', { path: '/path/to/vault' })

// Read note
const content = await invoke('read_note', { path: '/path/to/note.md' })

// Write note
await invoke('write_note', { path: '/path/to/note.md', content: '...' })

// Search
const results = await invoke('search_notes', { query: 'search term' })

// Suggest JD ID
const nextId = await invoke('suggest_next_jd_id', { category: 15 })
```

### File Paths
- **Frontend**: `src/`
- **Backend**: `src-tauri/src/`
- **Demo Vault**: `demo-vault/`
- **Docs**: `docs/`

---

**Last Updated**: 2026-05-25  
**Status**: Ready to Execute  
**Estimated Completion**: 2 weeks from start
