# Tasks: Service Layer Bugfixes

**Input**: Design documents from `/specs/006-service-bugfixes/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: Required — constitution mandates tests for every behavioral change. Each medium-severity bug fix includes a regression test.

**Organization**: Tasks grouped by requirement priority (R1 Data Integrity → R2 Performance → R3 Correctness → R4 Robustness) enabling independent implementation within each phase.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which requirement this task belongs to (R1, R2, R3, R4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Preparation)

**Purpose**: Verify clean baseline and confirm research patterns are available

- [x] T001 Run `cargo build` and `cargo test` in src-tauri/ to establish clean test baseline
- [x] T002 [P] Run `pnpm install && pnpm test` to establish clean frontend test baseline
- [x] T003 [P] Verify `std::sync::LazyLock` availability by checking Rust edition in src-tauri/Cargo.toml (requires Rust 1.80+)

---

## Phase 2: R1 — Data Integrity Fixes (Priority: Critical) 🎯 MVP

**Goal**: Eliminate all data loss and corruption risks in canvas save, note duplication, note merging, and lifecycle transitions.

**Independent Test**: Canvas round-trip persistence, duplicate note collision avoidance, merge target preservation, atomic lifecycle state changes.

### Tests for R1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T004 [P] [R1] Add test `test_save_canvas_transaction_rollback` in src-tauri/src/services/canvas_service.rs — verify partial save doesn't persist on simulated error
- [x] T005 [P] [R1] Add test `test_duplicate_note_collision` in src-tauri/src/services/vault_service.rs — verify `"note copy.md"` existing produces `"note copy 2.md"`
- [x] T006 [P] [R1] Add test `test_merge_notes_canonicalized_target_preserved` in src-tauri/src/services/vault_service.rs — verify target is never deleted regardless of path format
- [x] T007 [P] [R1] Add test `test_merge_notes_target_no_header` in src-tauri/src/services/vault_service.rs — verify target's own content isn't prepended with separator header
- [x] T008 [P] [R1] Add test `test_set_lifecycle_state_atomic` in src-tauri/src/services/lifecycle_service.rs — verify single command sets both organized and archived fields correctly

### Implementation for R1

- [x] T009 [R1] Wrap `save_canvas` in rusqlite `Transaction` with auto-rollback in src-tauri/src/services/canvas_service.rs (BUG-001)
- [x] T010 [R1] Add existence check + incrementing suffix loop in `duplicate_note` in src-tauri/src/services/vault_service.rs (BUG-002)
- [x] T011 [R1] Use `std::fs::canonicalize()` for path comparison in `merge_notes` delete loop in src-tauri/src/services/vault_service.rs (BUG-003)
- [x] T012 [R1] Skip target path when building merged content (no self-header) in src-tauri/src/services/vault_service.rs (BUG-013)
- [x] T013 [R1] Create `set_lifecycle_state` Tauri command in src-tauri/src/commands/ that atomically reads-modifies-writes organized+archived fields (BUG-005)
- [x] T014 [R1] Register `set_lifecycle_state` command in src-tauri/src/main.rs invoke_handler
- [x] T015 [R1] Update `setLifecycleState` in src/lib/services/entity/entity.ts to use single `invoke('set_lifecycle_state')` call (BUG-005)
- [x] T016 [R1] Replace sequential loop in `updateFrontmatterFields` with single batch invocation in src/lib/services/frontmatter/index.ts (BUG-004)

**Checkpoint**: All data integrity bugs fixed. Canvas saves are transactional, note duplication is collision-safe, merges preserve targets, lifecycle transitions are atomic.

---

## Phase 3: R2 — Performance Fixes (Priority: High)

**Goal**: Eliminate hot-path bottlenecks in search indexing and regex compilation.

**Independent Test**: Batch indexing commits once, regex is compiled once and reused across calls.

### Tests for R2

- [x] T017 [P] [R2] Add test `test_index_all_single_commit` in src-tauri/src/services/index_service.rs — verify `index_all` with multiple notes performs exactly one commit
- [x] T018 [P] [R2] Add test `test_wikilink_regex_is_static` in src-tauri/src/services/wikilink_service.rs — verify regex pointer is identical across multiple calls

### Implementation for R2

- [x] T019 [R2] Refactor `index_all` in src-tauri/src/services/index_service.rs to add all documents then commit once at end (BUG-006)
- [x] T020 [P] [R2] Add `static WIKILINK_RE: LazyLock<Regex>` and replace inline `Regex::new` in `is_inside_wikilink` in src-tauri/src/services/wikilink_service.rs (BUG-007)
- [x] T021 [P] [R2] Add `static WIKILINK_RE: LazyLock<Regex>` and replace inline `Regex::new` in `is_inside_wikilink` in src-tauri/src/services/concept_service.rs (BUG-008)

**Checkpoint**: Search indexing is O(1) commits for bulk operations. Regex hot paths eliminated.

---

## Phase 4: R3 — Correctness Fixes (Priority: Medium)

**Goal**: Fix logic errors producing wrong results in URL decoding, theme persistence, path validation, embedding paths, and merge content.

**Independent Test**: Multi-byte UTF-8 decodes correctly, theme persists across reload, path traversal is blocked, embedding paths use extension-only replacement.

### Tests for R3

- [x] T022 [P] [R3] Add test `test_urldecode_multibyte_utf8` in src-tauri/src/services/search_server.rs — verify `%E4%B8%AD` decodes to "中"
- [x] T023 [P] [R3] Add test `test_urldecode_mixed_ascii_utf8` in src-tauri/src/services/search_server.rs — verify mixed ASCII + multi-byte sequences
- [x] T024 [P] [R3] Add test `test_list_notes_folder_traversal_blocked` in src-tauri/src/services/vault_service.rs — verify `"../../../etc"` returns error
- [x] T025 [P] [R3] Add test `test_vec_path_extension_only` in src-tauri/src/services/embedding_service.rs — verify `"readme.md.backup.md"` → `"readme.md.backup.vec"`

### Implementation for R3

- [x] T026 [R3] Rewrite `urldecode` in src-tauri/src/services/search_server.rs to collect bytes and decode as UTF-8 per research.md R3 pattern (BUG-009)
- [x] T027 [R3] Fix `saveToLocalStorage` key from `'bismuth-theme'` to `'bismuth-theme-service'` in src/lib/services/theme/theme.ts (BUG-010)
- [x] T028 [R3] Add `validate_path` call on joined folder path before `read_dir` in `list_notes_in_folder` in src-tauri/src/services/vault_service.rs (BUG-011)
- [x] T029 [R3] Replace `.replace(".md", ".vec")` with `Path::new(note_path).with_extension("vec")` logic in `vec_path` in src-tauri/src/services/embedding_service.rs (BUG-012)

**Checkpoint**: URL decoding handles international characters, theme state persists correctly, path traversal blocked, embedding paths are robust.

---

## Phase 5: R4 — Robustness Fixes (Priority: Low)

**Goal**: Improve resilience, determinism, and error discrimination.

**Independent Test**: Watcher doesn't block during debounce, error types are discriminated, embedding files are validated.

### Implementation for R4

- [x] T030 [P] [R4] Restructure `next_event` in src-tauri/src/services/watcher_service.rs — drop lock before sleep, re-acquire for drain per research.md R7 pattern (BUG-014)
- [x] T031 [P] [R4] Replace `.ok()` with error-type check (ignore only "no such column") and log others as warnings in src-tauri/src/services/canvas_service.rs (BUG-016)
- [x] T032 [P] [R4] Add file size validation `data.len() == EMBEDDING_DIM * 4` in `read_vec_file` in src-tauri/src/services/embedding_service.rs (BUG-017)
- [x] T033 [R4] Document deferral of BUG-015 (HashMap → BTreeMap/IndexMap) with justification in specs/006-service-bugfixes/plan.md (cascading type change across 8+ callers)

**Checkpoint**: All robustness issues addressed or explicitly deferred with rationale.

---

## Phase 6: Validation & Verification

**Purpose**: Confirm all fixes, run full test suite, verify no regressions

- [x] T034 Run `cargo clippy -- -D warnings` in src-tauri/ — zero new warnings
- [x] T035 [P] Run `cargo test` in src-tauri/ — all tests pass including new regression tests
- [x] T036 [P] Run `pnpm test` — all frontend tests pass
- [x] T037 Execute quickstart.md smoke test scenarios (manual verification)
- [x] T038 Update specs/006-service-bugfixes/spec.md status from "Draft" to "Complete"

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **R1 Data Integrity (Phase 2)**: Depends on Setup. Tests first, then implementation.
- **R2 Performance (Phase 3)**: Depends on Setup only. Independent of R1.
- **R3 Correctness (Phase 4)**: Depends on Setup only. Independent of R1/R2.
- **R4 Robustness (Phase 5)**: Depends on Setup only. Independent of R1/R2/R3.
- **Validation (Phase 6)**: Depends on all previous phases.

### Inter-Task Dependencies

- T013 (backend lifecycle command) → T014 (register command) → T015 (frontend update)
- T016 (batch frontmatter) may depend on T013's backend command design
- All test tasks (T004-T008, T017-T018, T022-T025) should FAIL before their corresponding implementation tasks
- T033 explicitly documents BUG-015 deferral — no implementation needed

### Parallel Opportunities

- **Phase 2**: T004-T008 (all tests) can run in parallel. T009-T012 (different files) can run in parallel. T013→T014→T015 must be sequential.
- **Phase 3**: T017-T018 in parallel. T019-T021 in parallel (different files).
- **Phase 4**: T022-T025 (all tests) in parallel. T026-T029 in parallel (different files).
- **Phase 5**: T030-T032 all in parallel (different files).
- **Cross-phase**: Phases 2-5 can run in parallel since they affect different files.

---

## Parallel Example: R1 Data Integrity

```text
# Launch all R1 tests together (they target different test functions):
T004: test_save_canvas_transaction_rollback in canvas_service.rs
T005: test_duplicate_note_collision in vault_service.rs
T006: test_merge_notes_canonicalized_target_preserved in vault_service.rs
T007: test_merge_notes_target_no_header in vault_service.rs
T008: test_set_lifecycle_state_atomic in lifecycle_service.rs

# Then launch independent file fixes together:
T009: canvas_service.rs (transaction wrapping)
T010: vault_service.rs (duplicate collision)
T011: vault_service.rs (merge canonicalize) — sequential with T010 (same file)
T012: vault_service.rs (merge header) — sequential with T011 (same file)
```

---

## Implementation Strategy

### MVP First (R1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: R1 Data Integrity (most impactful)
3. **STOP and VALIDATE**: All data loss risks eliminated
4. Continue with Phases 3-5 incrementally

### Incremental Delivery

1. Setup → baseline confirmed
2. R1 Data Integrity → eliminates crash-related data loss (MVP!)
3. R2 Performance → fixes indexing bottleneck for large vaults
4. R3 Correctness → fixes user-visible bugs (theme, search, paths)
5. R4 Robustness → improves edge-case behavior
6. Validation → full regression pass

---

## Notes

- All fixes are minimal and surgical — no refactoring beyond bug boundary
- BUG-015 (HashMap ordering) is explicitly deferred per research.md R4
- BUG-005 requires a new Tauri command but no new dependencies
- No database schema changes — all fixes are code-level
- Existing tests must continue passing at every checkpoint
