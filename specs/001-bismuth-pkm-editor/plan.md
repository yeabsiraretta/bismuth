# Implementation Plan: Production Readiness Audit

**Branch**: `001-bismuth-pkm-editor-mvp` | **Date**: 2026-06-04 | **Spec**: `specs/001-bismuth-pkm-editor/spec.md`

**Input**: Deep code analysis of the existing Bismuth codebase for production readiness.

## Summary

A comprehensive audit of the Bismuth codebase (~24k LoC frontend, ~10.5k LoC backend) identified **7 critical areas** requiring remediation before production release: crash-prone `unwrap()` calls in Rust (301 instances), near-zero frontend test coverage (1 test file), 59 raw `console.log` calls bypassing the structured logger, duplicate code patterns, stub implementations masquerading as features, inconsistent error handling across IPC boundaries, and file size violations against the constitution's 300-line limit. This plan defines the concrete changes needed to bring the codebase to production quality.

## Technical Context

**Language/Version**: Rust (Tauri 2.x backend) + TypeScript 5.x / Svelte 4 (frontend)

**Primary Dependencies**: Tauri, CodeMirror 6, rusqlite, serde, notify-rs, chrono, thiserror

**Storage**: SQLite (via rusqlite) + filesystem (markdown notes, `.bismuth/` metadata)

**Testing**: Vitest (frontend, 1 test file), `cargo test` (backend, 19 test modules), Playwright (e2e, configured but sparse)

**Target Platform**: macOS, Windows, Linux (Tauri desktop)

**Project Type**: Desktop application (Tauri: Rust backend + Svelte frontend)

**Performance Goals**: <100ms note open, <200ms search, <3s graph render for 10k notes, 60fps UI

**Constraints**: Offline-only, <200MB memory, local-first, no cloud dependencies

**Scale/Scope**: ~24k LoC frontend (82 components, 15 services, 16 stores), ~10.5k LoC backend (14 command modules, 16 services, 5 models)

---

## Constitution Check

### Pre-Design Gate (current state assessment)

- **Research-first simplicity**: ✅ PASS — Existing research.md documents all technology choices with rationale. This audit identifies concrete code paths affected.
- **Code quality and reuse**: ⚠️ VIOLATION — Duplicate patterns identified (vault open/create in 2 components, tag extraction duplicated in embedding commands, "no vault open" guard repeated 15+ times). Raw `console.log` (59 instances) bypasses existing logger utility.
- **Testing standard**: ❌ VIOLATION — Frontend has 1 test file. Backend has 19 test modules but no integration tests. 90% coverage threshold not met. No e2e test coverage.
- **UX consistency**: ⚠️ VIOLATION — Hotkey actions are stubs (`console.log` placeholders). Navigation uses untyped `window.dispatchEvent(CustomEvent)` instead of typed store/service patterns.
- **Performance and portability**: ⚠️ VIOLATION — Logger persists to `localStorage` on every log entry (performance risk). 301 `unwrap()` calls in Rust production code can crash the app. No cross-platform CI verification.

### Post-Design Re-check

Will be performed after tasks are generated and design artifacts updated.

---

## Audit Findings

### Category 1: Crash Safety (Rust Backend) — CRITICAL

**301 `unwrap()` calls in non-test code**, including **30+ `lock().unwrap()` on Mutex** — any poisoned mutex causes an unrecoverable panic, crashing the entire app.

| Pattern                       | Count | Risk                        | Fix                                                             |
| ----------------------------- | ----- | --------------------------- | --------------------------------------------------------------- |
| `lock().unwrap()` in commands | 30+   | Poisoned mutex → app crash  | Replace with `lock().map_err()` or custom `PoisonError` handler |
| `lock().unwrap()` in db.rs    | 8     | DB mutex poison → data loss | Centralize DB access behind safe wrapper                        |
| `.unwrap()` in services       | ~260  | Various panics              | Replace with `?` operator or `.ok_or_else()`                    |

**Key files**: `commands/vault_commands.rs` (25 instances), `commands/embedding_commands.rs` (9 instances), `db.rs` (8 instances), `services/vault_service.rs` (scattered)

### Category 2: Frontend Test Coverage — CRITICAL

**1 test file** (`src/lib/utils/wikilink/__tests__/wikilink.test.ts`) for 24k LoC frontend. Constitution requires 90% coverage.

| Area                                  | Current Tests | Needed                                        |
| ------------------------------------- | ------------- | --------------------------------------------- |
| Stores (vault, canvas, tags, etc.)    | 0             | Unit tests for all reactive logic             |
| Services (vault, theme, search, etc.) | 0             | Unit tests with Tauri mocks                   |
| Components (82 total)                 | 0             | Component tests for critical flows            |
| E2E (Playwright configured)           | 0             | Smoke tests for vault open/create/edit/search |

### Category 3: Logging Hygiene — HIGH

**59 raw `console.log/warn/error` calls** outside `logger.ts`, despite having a structured logger.

| Location               | Count | Issue                                      |
| ---------------------- | ----- | ------------------------------------------ |
| Components (`.svelte`) | ~35   | `console.error` in catch blocks            |
| Stores (`.ts`)         | ~12   | `console.log` placeholder actions          |
| Hotkeys (`hotkeys.ts`) | 6     | All hotkey actions are `console.log` stubs |
| Services (`.ts`)       | ~6    | Mixed `console.error` and `log.error`      |

### Category 4: Dead Code & Stubs — HIGH

| Item                          | File                       | Issue                                      |
| ----------------------------- | -------------------------- | ------------------------------------------ |
| Hotkey actions                | `stores/hotkeys.ts:69-112` | 6 hotkeys with `console.log` stub actions  |
| Wikilink navigation           | `NoteEditor.svelte:62`     | `TODO: Navigate to the linked note`        |
| Git commit                    | `GitPanel.svelte:37`       | `TODO: Implement Git commit`               |
| Backlinks navigation          | `BacklinksPanel.svelte:15` | `TODO: Implement note navigation`          |
| Navigator persistence         | `navigator.ts:198,211`     | `TODO: Implement state persistence`        |
| Sort by modified/created      | `Backlinks.svelte:67-71`   | Falls through to name sort (dead branches) |
| `#[allow(dead_code)]` on `db` | `vault_service.rs:33`      | Suppressed warning on unused field         |

### Category 5: Code Duplication — HIGH

| Pattern                         | Locations                                                        | Deduplication                                       |
| ------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------- |
| "No vault open" guard           | 15+ methods in `vault_service.rs`                                | Extract `require_vault()` helper                    |
| Tag extraction from frontmatter | `embedding_commands.rs:50-59` and `109-118`                      | Extract shared `extract_tags()` fn                  |
| Vault open/create flow          | `VaultPicker.svelte` + `WelcomeScreen.svelte`                    | `VaultPicker` appears unused; remove or consolidate |
| Error format in commands        | `map_err(\|e\| format!(...))` repeated in all embedding commands | Use `BismuthError` consistently                     |
| `invoke()` calls in components  | 7 direct `invoke()` calls in components bypassing service layer  | Route through `src/lib/services/`                   |

### Category 6: Inconsistent Error Handling — MEDIUM

| Layer                 | Pattern                                           | Issue                                      |
| --------------------- | ------------------------------------------------- | ------------------------------------------ |
| Vault commands        | `Result<T>` (uses `BismuthError`)                 | ✅ Correct                                 |
| Embedding commands    | `Result<T, String>`                               | ❌ Loses error context, no error types     |
| Tag commands          | `Result<T, String>`                               | ❌ Same                                    |
| Graph commands        | `Result<T, String>`                               | ❌ Same                                    |
| Frontend catch blocks | `err instanceof Error ? err.message : 'fallback'` | Inconsistent; some swallow errors silently |

### Category 7: File Size Violations — MEDIUM

Constitution mandates 300 lines max. ESLint raised to 500 (violation). Current offenders:

| File                                | Lines | Status                   |
| ----------------------------------- | ----- | ------------------------ |
| `CanvasWorkspaceInteractive.svelte` | 666   | `eslint-disable` applied |
| `GraphView.svelte`                  | 643   | `eslint-disable` applied |
| `ConnectionsView.svelte`            | 599   | `eslint-disable` applied |
| `TagPanel.svelte`                   | 479   | Over 300                 |
| `AutoLinker.svelte`                 | 460   | Over 300                 |
| `presets.ts`                        | 440   | Over 300 (data file)     |
| `SettingsModal.svelte`              | 440   | Over 300                 |
| `App.svelte`                        | 440   | Over 300                 |
| `vault_service.rs`                  | 554   | Over 300                 |
| `db.rs`                             | 551   | Over 300                 |
| `embedding_service.rs`              | 500   | Over 300                 |
| `canvas.rs` (model)                 | 432   | Over 300                 |

### Additional Findings

- **Type safety**: 3 remaining `any` types (`canvas.ts:122`, `constants.ts:172`, `tag.ts:176`)
- **Untyped navigation**: `window.dispatchEvent(new CustomEvent('open-note', ...))` in 7 locations — no type safety, no error handling
- **Logger perf**: `persistLogs()` writes to `localStorage` on every single log call — should debounce or batch
- **`serde_yaml` deprecation**: `theme_service.rs` uses deprecated `serde_yaml` crate (noted in research.md)
- **`VaultPicker` duplication**: Both `VaultPicker.svelte` and `WelcomeScreen.svelte` implement vault open/create — `VaultPicker` appears to be an older/simpler version

---

## Project Structure

### Documentation

```text
specs/001-bismuth-pkm-editor/
├── plan.md              # This file
├── research.md          # Phase 0 (existing, complete)
├── data-model.md        # Phase 1 (existing or to update)
├── quickstart.md        # Phase 1 (existing or to update)
├── contracts/           # Phase 1 (existing or to update)
└── tasks.md             # Phase 2 (to be generated via /speckit.tasks)
```

### Source Code (current layout)

```text
src/                           # Svelte frontend (~24k LoC)
├── App.svelte                 # Root component (440 lines — needs split)
├── main.ts                    # Entry point
├── lib/
│   ├── components/            # 82 Svelte components in 14 feature dirs
│   ├── services/              # 15 service modules (IPC wrappers)
│   ├── stores/                # 16 store modules (reactive state)
│   ├── types/                 # 6 type definition files
│   ├── utils/                 # 15 utility modules
│   ├── config/                # 2 config files (constants, presets)
│   └── styles/                # 5 CSS files
└── types/                     # Global TS declarations

src-tauri/src/                 # Rust backend (~10.5k LoC)
├── main.rs                    # Tauri app setup
├── lib.rs                     # Module exports
├── db.rs                      # SQLite database (551 lines — needs split)
├── error.rs                   # BismuthError enum
├── logger.rs                  # Rust-side logging
├── commands/                  # 14 IPC command modules
│   └── mod.rs
├── services/                  # 16 service modules + vault sub-modules
│   ├── vault_service/         # 5 sub-modules (operations, scanner, etc.)
│   └── mod.rs
├── models/                    # 5 data model files
├── config/                    # 3 config files (settings, constants)
└── utils/                     # 2 utility modules
```

**Structure Decision**: The existing structure is well-organized with clear separation of concerns. No restructuring needed — the audit focuses on quality improvements within the existing layout.

---

## Complexity Tracking

| Violation                             | Why Needed                                             | Simpler Alternative Rejected Because                                                                                        |
| ------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| ESLint max-lines raised to 500        | Svelte SFCs combine script+template+styles in one file | Lowering back to 300 requires extracting styles to co-located CSS files for 12+ components; planned as incremental task     |
| `eslint-disable max-lines` in 3 files | Files >500 lines are core workspace components         | Splitting these requires extracting sub-components (tracked as separate tasks)                                              |
| Backend files >300 lines (6 files)    | Service modules have grown with features               | Splitting `vault_service.rs` already started (sub-modules exist); `db.rs` and `embedding_service.rs` need similar treatment |
