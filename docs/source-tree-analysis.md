# Bismuth - Source Tree Analysis

**Date:** 2026-07-14

## Overview

Bismuth is organized around a SvelteKit frontend (`src/`) and a Rust/Tauri backend (`src-tauri/`).
Feature code is primarily hub-oriented.

## Complete Directory Structure

```text
bismuth/
├── src/
│   ├── lib/
│   │   ├── hubs/               # Feature hubs (core, editor, planner, knowledge, etc.)
│   │   ├── ipc/                # Frontend IPC wrappers/events
│   │   ├── sal/                # Service abstraction layer
│   │   ├── ui/                 # Shared UI shell/components
│   │   ├── constants/          # Registry/contracts/constants
│   │   └── utils/              # Utility modules
│   ├── routes/
│   │   ├── (app)/              # Main app routes
│   │   └── (onboarding)/       # Onboarding flow
│   └── test/                   # Test setup + SvelteKit mocks
├── src-tauri/
│   ├── src/
│   │   ├── app.rs              # Tauri builder + plugin setup + local API startup
│   │   ├── lib.rs              # Runtime entry
│   │   ├── hubs/core/          # Native command/service implementation
│   │   ├── infrastructure/     # Shared infra (state/events/errors)
│   │   └── platform/           # Tray/menu/platform wiring
│   └── tauri.conf.json         # App/runtime/bundle config
├── docs/                       # Project documentation output
├── _bmad/                      # BMAD skill/module configs
├── .agents/                    # BMAD skills for agent runtime
└── .chunk/                     # Chunk validation config
```

## Critical Directories

### `src/lib/hubs`

Feature-oriented implementation modules, stores, services, and tests.

**Purpose:** Primary business/domain logic location  
**Contains:** Core/navigator/knowledge/planner/editor/etc. modules

### `src/routes/(app)`

User-facing route entrypoints for major app areas.

**Purpose:** Route-level composition of hubs and pages  
**Contains:** Per-feature pages such as `graph`, `calendar`, `editor`, `projects`

### `src-tauri/src/hubs/core`

Rust-side core command layer and service orchestration.

**Purpose:** Native operations exposed to frontend via Tauri commands  
**Contains:** Vault, git, backup, publish, import, graph, embeddings handlers

### `src-tauri/src/infrastructure`

Cross-cutting backend support layer.

**Purpose:** Shared state, eventing, and error boundaries  
**Contains:** State, deep link handling, event channels, API server wiring

## Entry Points

- **Web/App route shell:** `src/routes/(app)/+layout.svelte`
- **Tauri runtime entry:** `src-tauri/src/lib.rs` and `src-tauri/src/main.rs`
- **Native app bootstrap:** `src-tauri/src/app.rs`

## File Organization Patterns

- Hub-first organization under `src/lib/hubs/*`
- `.svelte.ts` store/service files used where Svelte reactivity integration is needed
- Tests co-located under `__tests__` or `*.test.ts`
- Rust backend organized by domain (`hubs/core`) and infrastructure/platform boundaries

## Key File Types

- **Svelte components** (`*.svelte`): UI composition and route rendering
- **TypeScript services/stores** (`*.ts`, `*.svelte.ts`): frontend logic and state
- **Rust modules** (`*.rs`): native commands and backend services
- **Config files** (`vite.config.ts`, `vitest.config.ts`, `tauri.conf.json`): build/test/runtime behavior

## Configuration Files

- `package.json`: scripts + JS dependencies
- `tsconfig.json`: strict TypeScript compiler rules
- `eslint.config.js`: lint policies and import restrictions
- `vitest.config.ts`: unit test runtime and aliases
- `vite.config.ts`: dev server/HMR/Tauri integration
- `src-tauri/Cargo.toml`: native dependency graph
- `src-tauri/tauri.conf.json`: desktop runtime config

## Notes for Development

Keep frontend/backend boundaries explicit: UI and orchestration in `src/`, native side effects and system access in `src-tauri/`.

---

_Generated using BMAD Method `document-project` workflow_
