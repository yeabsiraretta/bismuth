# Data Model: Service Layer Bugfixes

**Date**: 2026-06-05 | **Spec**: 006

## Overview

This bugfix spec does not introduce new data models. All changes are internal to existing service implementations. This document captures the affected interfaces and their modification boundaries.

## Affected Interfaces

### 1. CanvasService (BUG-001)

**Change**: Internal transaction wrapping — no interface change.

```rust
// Before: multiple independent conn.execute() calls
// After: wrapped in conn.transaction()

pub fn save_canvas(&self, canvas: &CanvasDocument) -> Result<()>
// Signature unchanged
```

### 2. VaultService (BUG-002, BUG-003, BUG-011, BUG-013)

**Change**: Internal logic fixes — no interface changes.

```rust
pub fn duplicate_note(&self, path: &Path) -> Result<Note>  // unchanged
pub fn merge_notes(&self, paths: &[PathBuf], target_path: &Path) -> Result<Note>  // unchanged
pub fn list_notes_in_folder(&self, vault_path: &Path, folder_path: &str) -> Result<Vec<Note>>  // unchanged
```

### 3. IndexService (BUG-006)

**Change**: New internal method, existing method unchanged.

```rust
// Existing (unchanged — still commits per note for incremental):
pub fn index_note(&self, note: &Note) -> Result<()>

// New (batch commit for full reindex):
pub fn index_all(&self, notes: Vec<Note>) -> Result<()>
// Behavior change: single commit at end instead of per-note
```

### 4. WikilinkService + ConceptService (BUG-007, BUG-008)

**Change**: Internal regex caching — no interface changes.

```rust
// New module-level static:
static WIKILINK_RE: LazyLock<Regex> = ...;

// Method signatures unchanged:
fn is_inside_wikilink(&self, content: &str, pos: usize) -> bool
```

### 5. SearchServer urldecode (BUG-009)

**Change**: Internal function fix — no interface change.

```rust
fn urldecode(s: &str) -> String  // unchanged signature, fixed multi-byte behavior
```

### 6. FrontmatterService (BUG-015 — deferred)

**Potential change** (if implemented):

```rust
// Before:
pub fn parse(content: &str) -> Result<(HashMap<String, Value>, String)>

// After (if applied):
pub fn parse(content: &str) -> Result<(BTreeMap<String, Value>, String)>
// OR use type alias: type Frontmatter = BTreeMap<String, Value>;
```

**Decision**: Deferred to avoid cascading type changes across 8+ call sites.

### 7. EmbeddingService (BUG-012, BUG-017)

**Change**: Internal path handling and validation — no interface changes.

```rust
fn vec_path(&self, note_path: &str) -> PathBuf  // unchanged signature, fixed logic
fn read_vec_file(&self, path: &Path) -> Result<Vec<f32>>  // unchanged, added size validation
```

### 8. WatcherService (BUG-014)

**Change**: Internal mutex usage — no interface change.

```rust
pub fn next_event(&self) -> Option<Event>  // unchanged
pub fn poll_event(&self, timeout: Duration) -> Option<Event>  // unchanged
```

### 9. Theme Store (BUG-010)

**Change**: Fix localStorage key constant.

```typescript
// Before: localStorage.setItem('bismuth-theme', ...)
// After:  localStorage.setItem('bismuth-theme-service', ...)
```

### 10. Lifecycle/Entity Service (BUG-005)

**New Tauri command**:

```rust
#[tauri::command]
pub fn set_lifecycle_state(path: String, state: String) -> Result<(), String>
// Atomically sets organized/archived fields based on state value
```

```typescript
// Frontend call (replaces 2 sequential invokes):
await invoke('set_lifecycle_state', { path, state: 'organized' });
```

## State Transitions

No new state machines. BUG-005 formalizes the existing implicit transition:

```text
captured → organized: set organized=true, archived=false
captured → archived:  set archived=true
organized → archived: set archived=true
organized → captured: set organized=false, archived=false
archived → captured:  set organized=false, archived=false
```

## Migration Notes

- No database schema changes
- No file format changes
- Existing `.vec` embedding files remain compatible
- localStorage key fix (BUG-010) may cause one-time theme reset for users who used the broken `saveToLocalStorage` method (minimal impact since subscription auto-saves work correctly)
