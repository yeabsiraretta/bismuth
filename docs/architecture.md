# Bismuth - Architecture

**Date:** 2026-07-14  
**Project Type:** desktop  
**Architecture Style:** Layered desktop application (SvelteKit UI + Tauri/Rust services)

## Executive Summary

Bismuth uses a two-layer desktop architecture:

1. **Frontend layer (SvelteKit/TypeScript)** for UI, interaction, and domain feature composition.
2. **Native layer (Tauri/Rust)** for filesystem, vault lifecycle, git, backup, publish, and local API responsibilities.

## Technology Stack

- **Frontend:** Svelte 5, SvelteKit 2, Vite 6, TypeScript 5
- **Desktop bridge:** Tauri v2
- **Backend/native services:** Rust (Tokio, Axum, tracing)
- **Testing:** Vitest + Playwright

## High-Level Components

### Frontend

- `src/routes/*`: route and app shell composition
- `src/lib/hubs/*`: domain hubs (navigator, knowledge, planner, editor, creative, media, integration)
- `src/lib/sal/*`: service abstraction layer and bridge helpers
- `src/lib/ipc/*`: event and command transport wrappers

### Native Backend (Tauri)

- `src-tauri/src/app.rs`: app builder, plugin registration, command registration, local API startup
- `src-tauri/src/hubs/core/commands.rs`: command endpoints exposed to frontend
- `src-tauri/src/hubs/core/*_service.rs`: core operational implementations
- `src-tauri/src/infrastructure/*`: shared state, events, deep-link, error handling

## Runtime Flow

1. Tauri runtime starts and initializes plugins + state.
2. Frontend invokes native commands through Tauri IPC wrappers.
3. Native services execute vault/git/import/backup/etc. logic.
4. Events and logs are emitted to frontend/webview as needed.

## Data and Storage

- Primary user content stored in local vault files.
- No mandatory external DB layer required for core workflow.
- Local metadata/state handled through app stores and plugin-backed persistence.

## API and IPC Surface

- Main command surface is Tauri commands registered in `app.rs`.
- Local HTTP/MCP route (`/mcp`) is served from the native runtime.
- IPC and command invocation patterns are centralized in SAL/IPC utility modules.

## Security and Operational Constraints

- Local-first architecture; sensitive operations remain on-device.
- Tauri command capability trimming enabled (`removeUnusedCommands`).
- CSP and runtime restrictions configured through SvelteKit/Tauri config files.

## Testing Strategy

- Unit/integration tests: Vitest (`src/**/*.test.ts`) in jsdom environment.
- End-to-end tests: Playwright (`e2e/`).
- Rust tests available via `pnpm test:rust`.

## Deployment/Distribution

- Web build output used as Tauri frontend dist (`build/`).
- Desktop packaging handled by `tauri build` with platform-specific bundle settings.

## Notes for AI-Assisted Changes

- Keep `@/` import alias usage consistent.
- Keep Tauri JS and Rust plugin versions aligned.
- Preserve strict TypeScript and lint constraints.
- Respect fixed dev server contract (`vite` on port 5173 for Tauri dev).

---

_Generated using BMAD Method `document-project` workflow_
