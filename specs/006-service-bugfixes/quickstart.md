# Quickstart: Service Layer Bugfixes Validation

**Date**: 2026-06-05 | **Spec**: 006

## Prerequisites

- Rust toolchain (stable 1.80+)
- Node.js 18+ with pnpm
- SQLite development libraries

## Validation Steps

### 1. Build and Test (Backend)

```bash
cd src-tauri
cargo clippy -- -D warnings
cargo test
```

**Expected**: All tests pass, no new clippy warnings.

### 2. Build and Test (Frontend)

```bash
pnpm install
pnpm test
```

**Expected**: All vitest tests pass.

### 3. Verify BUG-001 (Transaction Safety)

```bash
cargo test --lib test_save_canvas_transaction_rollback
```

**Expected**: New test verifies that partial saves don't persist on error.

### 4. Verify BUG-002 (Duplicate Collision)

```bash
cargo test --lib test_duplicate_note_collision
```

**Expected**: Duplicating a note when `"note copy.md"` exists creates `"note copy 2.md"`.

### 5. Verify BUG-006 (Batch Indexing)

```bash
cargo test --lib test_index_all_batch_commit
```

**Expected**: `index_all` with 100 notes calls commit exactly once (not 100 times).

### 6. Verify BUG-007/008 (Regex Performance)

```bash
cargo test --lib test_wikilink_regex_cached
```

**Expected**: Multiple calls reuse the same compiled regex instance.

### 7. Verify BUG-009 (UTF-8 URL Decoding)

```bash
cargo test --lib test_urldecode_multibyte
```

**Expected**: `%E4%B8%AD` decodes to "中" (CJK character).

### 8. Verify BUG-010 (Theme Store)

Check that `saveToLocalStorage` writes to key `'bismuth-theme-service'`.

### 9. Verify BUG-011 (Path Traversal)

```bash
cargo test --lib test_list_notes_folder_traversal_blocked
```

**Expected**: `list_notes_in_folder(vault, "../../../etc")` returns an error.

### 10. Verify BUG-012 (Embedding Path)

```bash
cargo test --lib test_vec_path_extension_only
```

**Expected**: `"readme.md.backup.md"` maps to `"readme.md.backup.vec"` (not `"readme.vec.backup.vec"`).

## Regression Gate

All existing tests must continue to pass unchanged:

```bash
cd src-tauri && cargo test 2>&1 | tail -5
# Expected: "test result: ok. N passed; 0 failed; ..."
```

## Quick Smoke Test (Manual)

1. Open Bismuth with a vault
2. Create a canvas, add elements, save, close, reopen → verify elements persist (BUG-001)
3. Duplicate a note twice → second duplicate should be `"note copy 2.md"` (BUG-002)
4. Search for a CJK term → should return correct results (BUG-009)
5. Toggle theme → verify it persists after reload (BUG-010)
