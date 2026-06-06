# Implementation Plan: Service Layer Bugfixes

**Branch**: `001-bismuth-pkm-editor-mvp` | **Date**: 2026-06-05 | **Spec**: `specs/006-service-bugfixes/spec.md`

**Input**: Code review findings from comprehensive service-by-service audit

## Summary

Fix 17 identified bugs across 11 service files (7 Rust backend, 4 TypeScript frontend). Prioritized by data integrity risk, then performance impact, then correctness. Each fix is minimal and surgical — no refactoring beyond the immediate bug boundary.

## Technical Context

**Language/Version**: Rust stable (Tauri 2.x), TypeScript 5.x (Svelte 4)

**Primary Dependencies**: rusqlite (SQLite), tantivy (search), notify (fs watcher), regex, serde, svelte/store

**Testing**: cargo test (backend), vitest (frontend)

**Target Platform**: macOS, Windows, Linux (Tauri desktop)

**Constraints**:
- Fixes must be minimal — single-line where possible
- No API changes (all fixes are internal)
- No new dependencies
- Must maintain backward compatibility with existing `.vec` files and SQLite databases

## Constitution Check

- **Research-first simplicity**: ✅ Bugs identified via systematic code review. Fixes are minimal and targeted.
- **Code quality and reuse**: ✅ Fixes use existing patterns (transactions, `once_cell`, `BTreeMap`).
- **Testing standard**: ✅ Each medium-severity fix gets a regression test.
- **UX consistency**: ✅ No user-facing changes — only correctness improvements.
- **Performance and portability**: ✅ Performance fixes (BUG-006/007/008) improve all platforms equally.

## Execution Phases

### Phase 1: Data Integrity Fixes (Critical Path)

**Goal**: Eliminate data loss and corruption risks.

| Bug | File | Fix |
|-----|------|-----|
| BUG-001 | `canvas_service.rs` | Wrap `save_canvas` body in `conn.execute_batch("BEGIN")` / `COMMIT` (or rusqlite `Transaction`) |
| BUG-002 | `vault_service.rs` | Add existence check + suffix incrementing in `duplicate_note` |
| BUG-003 | `vault_service.rs` | Use `canonicalize()` comparison in `merge_notes` delete loop |
| BUG-004 | `frontmatter/index.ts` | Replace loop with single `invoke('update_frontmatter_fields_batch', { path, fields })` or sequential-safe variant |
| BUG-005 | `entity/entity.ts` | Create backend `set_lifecycle_state` command for atomic transition |

**Risk**: BUG-005 requires a new Tauri command — evaluate if sequential approach with error recovery is acceptable instead.

### Phase 2: Performance Fixes

**Goal**: Eliminate hot-path bottlenecks.

| Bug | File | Fix |
|-----|------|-----|
| BUG-006 | `index_service.rs` | Add `index_all_batch` that commits once; keep per-note commit for incremental updates |
| BUG-007 | `wikilink_service.rs` | Use `once_cell::sync::Lazy<Regex>` for the wikilink pattern |
| BUG-008 | `concept_service.rs` | Same `Lazy<Regex>` pattern |

**Risk**: None — straightforward performance wins with no behavioral change.

### Phase 3: Correctness Fixes

**Goal**: Fix logic errors that produce wrong results.

| Bug | File | Fix |
|-----|------|-----|
| BUG-009 | `search_server.rs` | Collect `%XX` bytes into a `Vec<u8>`, decode as UTF-8 string |
| BUG-010 | `theme/theme.ts` | Change `saveToLocalStorage` to write to `'bismuth-theme-service'` (matching the read key) |
| BUG-011 | `vault_service.rs` | Add `validate_path` call on the joined folder path before `read_dir` |
| BUG-012 | `embedding_service.rs` | Replace `.replace(".md", ".vec")` with extension-only substitution using `Path::with_extension` |
| BUG-013 | `vault_service.rs` | Skip the target path when building merged content (don't prepend its own header) |

**Risk**: BUG-009 changes URL decoding behavior — must verify search test coverage.

### Phase 4: Robustness Fixes (Low Priority)

**Goal**: Improve resilience and determinism.

| Bug | File | Fix |
|-----|------|-----|
| BUG-014 | `watcher_service.rs` | Move sleep outside Mutex lock scope; receive-then-drop-lock-then-sleep pattern |
| BUG-015 | `frontmatter_service.rs` | Change `HashMap<String, Value>` to `BTreeMap<String, Value>` in return type |
| BUG-016 | `canvas_service.rs` | Check error message for "no such column" before ignoring; log others as warnings |
| BUG-017 | `embedding_service.rs` | Validate `data.len() == EMBEDDING_DIM * 4` before parsing |

**Risk**: BUG-015 changes the `FrontmatterService::parse` return type — this propagates to all callers. Evaluate `IndexMap` (preserves insertion order) as less-breaking alternative.

**Deferred**: BUG-015 is explicitly deferred. Changing `HashMap<String, Value>` → `BTreeMap<String, Value>` or `IndexMap<String, Value>` cascades across 8+ callers including `LifecycleService`, `EntityService`, `FrontmatterService::parse`, and all test assertions. The risk/reward ratio does not justify inclusion in this bugfix pass. A dedicated spec with proper type alias migration is recommended.

## Dependency Analysis

```
BUG-005 depends on: new Tauri command (evaluate if needed)
BUG-004 depends on: BUG-005 decision (if batch command exists, frontend can use it)
BUG-015 depends on: impact analysis of HashMap → BTreeMap across codebase

All others: independent, can be fixed in any order within their phase.
```

## Complexity Tracking

| Aspect | Status | Notes |
|--------|--------|-------|
| New dependencies | None | `once_cell` already in Cargo.toml via transitive deps |
| API breaking changes | 1 potential | BUG-015 changes return type (mitigate with type alias) |
| New Tauri commands | 1 potential | BUG-005 atomic lifecycle (can defer) |
| Test coverage | +10 tests | One per medium-severity bug |
| File changes | ~11 files | 7 Rust + 4 TypeScript |

## Artifacts

| Artifact | Path | Status |
|----------|------|--------|
| Spec | `specs/006-service-bugfixes/spec.md` | ✅ Complete |
| Plan | `specs/006-service-bugfixes/plan.md` | ✅ This file |
| Research | `specs/006-service-bugfixes/research.md` | ✅ Complete |
| Data Model | `specs/006-service-bugfixes/data-model.md` | ✅ Complete |
| Quickstart | `specs/006-service-bugfixes/quickstart.md` | ✅ Complete |
