# Data Model: Production Readiness Audit

**Feature**: Bismuth PKM Editor — Production Readiness  
**Date**: 2026-06-04  
**Status**: Active

## Overview

This document captures the data model relevant to the production readiness audit. Rather than defining new entities, it maps the **existing** models and their relationships, highlighting quality issues that need remediation.

---

## Existing Models (Rust Backend)

### Note (`src-tauri/src/models/note.rs` — 246 lines)

| Field | Type | Description |
|-------|------|-------------|
| `path` | `PathBuf` | Absolute filesystem path |
| `title` | `String` | Extracted from filename or frontmatter |
| `content` | `String` | Full markdown content |
| `frontmatter` | `serde_json::Value` | Parsed YAML frontmatter as JSON |
| `created_at` | `DateTime<Utc>` | File creation timestamp |
| `modified_at` | `DateTime<Utc>` | Last modification timestamp |

**Quality issues**: Frontmatter is an untyped `serde_json::Value` — no compile-time validation of expected fields (tags, type, organized, archived).

### Vault (`src-tauri/src/models/vault.rs` — 213 lines)

| Field | Type | Description |
|-------|------|-------------|
| `root_path` | `PathBuf` | Vault root directory |
| `name` | `String` | Derived from directory name |
| `note_count` | `usize` | Cached count of notes |

**Quality issues**: No validation that `root_path` exists on disk after construction. No staleness check.

### Link (`src-tauri/src/models/link.rs` — 230 lines)

| Field | Type | Description |
|-------|------|-------------|
| `source` | `String` | Source note path |
| `target` | `String` | Target note path or title |
| `link_type` | `LinkType` | `Wikilink`, `Markdown`, `Embed` |
| `line_number` | `usize` | Line where link appears |
| `resolved` | `bool` | Whether target exists |

### Canvas (`src-tauri/src/models/canvas.rs` — 432 lines ⚠️ over 300)

| Field | Type | Description |
|-------|------|-------------|
| `id` | `String` | Unique canvas ID |
| `nodes` | `Vec<CanvasNode>` | All nodes on canvas |
| `edges` | `Vec<CanvasEdge>` | All edges connecting nodes |
| `groups` | `Vec<CanvasGroup>` | Node groups |
| `viewport` | `Viewport` | Current view position/zoom |

**Quality issues**: File is 432 lines (over 300 limit). Contains many inline structs that should be extracted.

---

## Database Schema (SQLite — `src-tauri/src/db.rs` — 551 lines ⚠️)

### Tables

```sql
-- Notes index (created in db.rs)
CREATE TABLE IF NOT EXISTS notes (
    path TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    frontmatter_json TEXT,
    created_at INTEGER NOT NULL,
    modified_at INTEGER NOT NULL
);

-- Tags index
CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
);

-- Note-tag relationships
CREATE TABLE IF NOT EXISTS note_tags (
    note_path TEXT NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (note_path, tag_id),
    FOREIGN KEY (note_path) REFERENCES notes(path),
    FOREIGN KEY (tag_id) REFERENCES tags(id)
);
```

**Quality issues**:
- `db.rs` is 551 lines — needs splitting into `db/schema.rs`, `db/queries.rs`, `db/migrations.rs`
- 8 `lock().unwrap()` calls on the DB connection mutex — crash risk
- No migration system for schema changes
- `frontmatter_json` stored as unstructured TEXT — no indexed fields for common queries

---

## Frontend State Model (Svelte Stores)

### Vault Store (`src/lib/stores/vault/vault.ts` — 248 lines)

| Store | Type | Description |
|-------|------|-------------|
| `currentVault` | `Writable<Vault \| null>` | Active vault |
| `notes` | `Writable<Note[]>` | All notes |
| `activeNote` | `Writable<Note \| null>` | Currently open note |
| `isLoadingVault` | `Writable<boolean>` | Loading state |
| `isLoadingNotes` | `Writable<boolean>` | Loading state |
| `showArchived` | `Writable<boolean>` | Archive filter |
| `isVaultOpen` | `Derived<boolean>` | Computed from currentVault |
| `notesByPath` | `Derived<Map<string, Note>>` | O(1) path lookup |
| `visibleNotes` | `Derived<Note[]>` | Filtered by archive status |

### Canvas Store (`src/lib/stores/canvas/` — 4 files)

| File | Lines | Purpose |
|------|-------|---------|
| `canvasStore.ts` | 222 | Canvas state, selection, viewport |
| `canvasArrangement.ts` | 304 ⚠️ | Auto-layout algorithms |
| `historyStore.ts` | 255 | Undo/redo stack |

### Other Stores

| Store | File | Purpose |
|-------|------|---------|
| `commands.ts` | 232 | Command palette registry |
| `hotkeys.ts` | 116 | Keyboard shortcuts (⚠️ stub actions) |
| `toast.ts` | 167 | Toast notification queue |
| `layout/` | 2 files | Panel visibility, sidebar state |
| `tag/tag.ts` | ~200 | Tag aggregation and filtering |
| `navigator/` | 1 file | File tree navigation state |
| `entity/` | 1 file | Entity type state |
| `capture/` | 1 file | Capture dashboard state |
| `theme/` | 1 file | Active theme state |

---

## IPC Contract Inventory

### Consistent Error Pattern (vault commands)

```
Rust: Result<T> where E = BismuthError (implements Serialize)
TS:   invoke<T>('command', args) → Promise<T>  (rejects with string error)
```

### Inconsistent Error Pattern (other commands)

```
Rust: Result<T, String>  ← loses error type information
TS:   same invoke pattern, but error is opaque string
```

**Affected command modules**: `embedding_commands.rs`, `tag_commands.rs`, `graph_commands.rs`, `wikilink_commands.rs`

---

## Validation Rules (from audit)

| Entity | Rule | Current Status |
|--------|------|---------------|
| Note path | Must be within vault root | ✅ `validate_path()` in `vault_operations.rs` |
| Note content | Warn if > MAX_FILE_SIZE_BYTES | ✅ Warning logged |
| Frontmatter | Must be valid YAML | ✅ Parsed with error handling |
| Vault path | Must exist and be directory | ✅ Checked in `open()` |
| Directory depth | Warn if > MAX_DIRECTORY_DEPTH | ✅ Warning logged |
| Wikilink target | May not exist (unresolved) | ✅ Tracked as `resolved: false` |
| Tag names | No validation on format | ❌ Should validate (no special chars, max length) |
| Canvas node IDs | Must be unique per canvas | ❌ Not enforced at model level |

---

## State Transitions

### Note Lifecycle

```
captured → organized → archived
    ↓           ↓          ↓
  (inbox)   (active)   (hidden from views, still searchable)
```

**Quality issue**: Lifecycle states are stored as raw frontmatter fields (`organized: bool`, `archived: bool`) rather than a single `lifecycle: enum` field. This allows invalid states (e.g., `organized: true, archived: true` simultaneously).
