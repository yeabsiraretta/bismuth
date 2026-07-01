# Sandbox-Blocked Issues — Action Plan

**Date**: 2026-06-24  
**Context**: Claude Code sandbox applies macOS ACLs that block read/write access to certain directories in the Bismuth project. These are accessible from the user's own terminal session.

---

## Part 1 — Blocked Directories (macOS ACL restriction)

These directories return `Operation not permitted` when accessed from the sandbox process:

| Directory | Contents | Impact |
|-----------|----------|--------|
| `src/lib/stores/vault/` | Vault state store — note list, active note, vault open state | Cannot read/edit vault store files |
| `src/lib/services/vault/` | Tauri IPC wrappers for vault/note CRUD | Cannot read/edit vault service files |
| `src/lib/components/vault/` | File tree, welcome screen, toolbar | Cannot read/edit vault UI components |
| `src-tauri/src/commands/vault_commands/` | Rust Tauri command handlers for vault ops | Blocks `cargo build`/`cargo check` in sandbox |

**Root cause**: These directories have extended attributes (`@` flag in `ls -la`) that carry a "deny read" ACL for the sandbox process. Other directories with the same `drwxrwx---` permissions work fine.

### Fix (run from your terminal)

```bash
# Remove the restrictive ACL from each blocked directory
chmod -R -N ~/Desktop/bismuth/src/lib/stores/vault/
chmod -R -N ~/Desktop/bismuth/src/lib/services/vault/
chmod -R -N ~/Desktop/bismuth/src/lib/components/vault/
chmod -R -N ~/Desktop/bismuth/src-tauri/src/commands/vault_commands/
```

Or to fix all at once:

```bash
# Strip all ACLs from the entire project (safe — just removes macOS ACLs, keeps Unix permissions)
chmod -R -N ~/Desktop/bismuth/src/
```

After running this, the sandbox will be able to read vault files and `pnpm build` will succeed from within Claude Code.

---

## Part 2 — Environment-Dependent Tasks

These tasks cannot be run in the sandbox because they require local toolchain execution. The user must run them from their terminal.

### Build Verification

```bash
# From project root
pnpm install           # Install new packages (tone, @tanstack/virtual, chart.js)
pnpm build             # Verify Vite build succeeds
pnpm tauri dev         # Verify app opens (window should appear now — onMount fix applied)
```

### TypeScript Type Check

```bash
pnpm type-check        # svelte-check -- should pass after vault ACL fix
```

### Test Suite

```bash
pnpm test:ci           # Run all tests with coverage
```

Expected issues after running:
- Coverage thresholds at 80% may fail if some modules have low coverage — document the gap, don't lower the threshold
- Some test mocks may need updating after the spec 040 SearchServer agent endpoint additions

### Rust Compilation

```bash
cd src-tauri
cargo check            # Verify all Rust compiles
cargo test             # Run Rust unit tests
```

Known pending Rust test targets:
- `cargo test -p bismuth -- task_service` (spec 035 T008)
- `cargo test -p bismuth -- query_parser` (spec 035 T009)
- `cargo test -p bismuth -- query_eval` (spec 035 T010)
- `cargo test -p bismuth -- nas` (spec 050 T17/T18)

---

## Part 3 — Tasks Blocked on Vault Implementation

These tasks require reading/modifying vault store files which are ACL-blocked:

| Task | Spec | What's Needed |
|------|------|--------------|
| Add `canvas_dir()` etc. to `Vault` struct | 020 T1.4 | Read/edit `vault.rs` (sandboxed) |
| Update vault.rs tests | 020 T1.5 | Read/edit `vault.rs` (sandboxed) |
| `src/lib/services/__tests__/vault.test.ts` | 035 | Read `services/vault/` (sandboxed) |
| File tree multi-select (T020) | 035 | `components/vault/FileTree.svelte` (sandboxed) |
| NAS T22 path traversal in vault commands | 050 T18 | `commands/vault_commands/` (sandboxed) |

After running `chmod -R -N ~/Desktop/bismuth/src/`, these can be implemented in the next session.

---

## Part 4 — Manual Test / Runtime Verification

These tasks explicitly require the user to run the app and verify behavior. They cannot be automated:

| Task | Spec | What to Verify |
|------|------|---------------|
| T069 User stories walkthrough | 037 | Run `pnpm tauri:dev`, walk through 10 user stories |
| T070 Settings E2E test | 037 | Playwright: `pnpm e2e` (requires running Tauri window) |
| COOP/COEP verification | 047 | Run app, open VideoEditor, check browser console for SharedArrayBuffer |
| CSP console verification | 035 T002 | Open app, check DevTools console for CSP errors |
| Bundle chunk verification | 036 T005 | Run `pnpm build`, inspect `dist/assets/` for chunk names |
| Graph performance | 035 Phase 3 | Load 10k-node graph, measure main-thread jank |

---

## Part 5 — Spec-by-Spec Deferred Task Count

| Spec | Deferred Count | Primary Blocker |
|------|---------------|-----------------|
| 052-infrastructure | ~67 | `pnpm check/test/lint` environment |
| 035-mvp-completion | ~40 | `cargo test`, running app, vault ACL |
| 021-test-infra | ~80 | Build environment, non-existent source files |
| 025-publishing | ~45 | `cargo test` for new Rust modules |
| 022-sidebar | ~25 | RSS/Voice features, `pnpm test` |
| 020-directory-cleanup | ~8 | vault/ ACL, `cargo build` |
| 050-nas-access | ~15 | `cargo test`, component tests needing jsdom |
| 038-ocr | ~18 | Rust backend commands, Tesseract models |
| 040-llm | ~5 | `cargo test` SearchServer endpoints |

**Immediate action**: Fix the ACL issue with `chmod -R -N` to unblock ~30 deferred tasks that only blocked due to sandbox permissions.
