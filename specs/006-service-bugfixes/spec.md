# Feature Specification: Service Layer Bugfixes

**ID**: 006  
**Status**: Draft  
**Priority**: High  
**Date**: 2026-06-05

## Problem Statement

A comprehensive code review of all Rust backend and TypeScript frontend services identified 17 bugs (10 medium, 7 low severity) spanning data corruption risks, performance bottlenecks, race conditions, and logic errors. These are pre-existing issues that threaten data integrity and user experience in production.

## Requirements

### R1: Data Integrity (Critical)

- **BUG-001**: `canvas_service.rs` `save_canvas` must wrap all SQL operations in a transaction to prevent data loss on crash
- **BUG-002**: `vault_service.rs` `duplicate_note` must handle filename collision instead of silently overwriting
- **BUG-003**: `vault_service.rs` `merge_notes` must use canonicalized path comparison to avoid deleting the target
- **BUG-004**: `frontmatter/index.ts` `updateFrontmatterFields` must be atomic (single read-modify-write)
- **BUG-005**: `entity/entity.ts` `setLifecycleState` should use an atomic backend command

### R2: Performance (High)

- **BUG-006**: `index_service.rs` `index_all` must batch commits instead of per-note commits
- **BUG-007**: `wikilink_service.rs` `is_inside_wikilink` must use a pre-compiled regex (called in hot loop)
- **BUG-008**: `concept_service.rs` same regex recompilation issue as BUG-007

### R3: Correctness (Medium)

- **BUG-009**: `search_server.rs` `urldecode` must handle multi-byte UTF-8 percent-encoding correctly
- **BUG-010**: `theme/theme.ts` localStorage key mismatch between `saveToLocalStorage` and `loadFromLocalStorage`
- **BUG-011**: `vault_service.rs` `list_notes_in_folder` must validate folder_path against traversal before `read_dir`
- **BUG-012**: `embedding_service.rs` `vec_path` must use extension-only replacement (not global `.md` replace)
- **BUG-013**: `vault_service.rs` `merge_notes` should not prepend separator header to target's own content

### R4: Robustness (Low)

- **BUG-014**: `watcher_service.rs` `next_event` holds Mutex during 300ms sleep (blocks all concurrent callers)
- **BUG-015**: `frontmatter_service.rs` `serialize` should use stable key ordering (BTreeMap/IndexMap)
- **BUG-016**: `canvas_service.rs` `.ok()` on UPDATE swallows legitimate errors alongside expected migration ones
- **BUG-017**: `embedding_service.rs` `read_vec_file` should validate file size matches expected dimensions

## Success Criteria

- All 10 medium-severity bugs fixed with regression tests
- All 7 low-severity bugs fixed or explicitly deferred with justification
- `cargo test` passes (including new tests for fixed bugs)
- `pnpm test` passes for frontend fixes
- No new warnings from `cargo clippy`

## Out of Scope

- New features or API additions
- Refactoring beyond the minimum fix (covered by spec 005)
- UI changes
- Performance optimization beyond the identified hot-path regex issues
