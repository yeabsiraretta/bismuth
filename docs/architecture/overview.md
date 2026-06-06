# Architecture Overview

Bismuth is a desktop application built with **Tauri 2** (Rust) + **Svelte 4** (TypeScript).

---

## High-Level Architecture

The system has three layers connected by Tauri's IPC bridge:

1. **Svelte Frontend** — Components, stores, services (TypeScript)
2. **Tauri IPC Bridge** — Serialized command invocations
3. **Rust Backend** — File I/O, search, vault operations

---

## Frontend (src/lib/)

| Layer | Directory | Responsibility |
|-------|-----------|----------------|
| Components | `components/` | UI presentation (Svelte) |
| Stores | `stores/` | Reactive state management |
| Services | `services/` | Tauri IPC call wrappers |
| Utils | `utils/` | Pure utility functions |
| Types | `types/` | TypeScript type definitions |
| Styles | `styles/` | Design tokens, CSS |

### Key Conventions

- **State**: Svelte writable/derived stores, one domain per subdirectory
- **IPC**: All backend calls go through `services/` (never direct `invoke()` in components)
- **Styling**: CSS variables from `tokens.css`, scoped component styles
- **Imports**: `@/` alias maps to `src/lib/`

---

## Backend (src-tauri/src/)

| Layer | File/Dir | Responsibility |
|-------|----------|----------------|
| Entry | `main.rs` | Tauri app builder, command registration |
| Commands | `commands/` | IPC handler functions |

### Key Conventions

- Commands are `#[tauri::command]` functions
- Vault operations are file-system based (no database)
- Notes stored as Markdown files with YAML frontmatter
- Canvas documents stored as JSON files

---

## Data Flow

1. User interacts with a Svelte component
2. Component calls a store action
3. Store action calls a service function (which invokes Tauri IPC)
4. Rust command executes and returns a result
5. Service returns the result to the store
6. Store updates reactive state
7. UI re-renders

---

## Module Domains

| Domain | Store | Service | Components |
|--------|-------|---------|------------|
| Vault | `stores/vault/` | `services/vault/` | `components/vault/` |
| Canvas | `stores/canvas/` | `services/canvas/` | `components/canvas/` |
| Notes | `stores/entity/` | `services/entity/` | `components/note/` |
| Search | — | `services/search/` | `components/modals/` |
| Graph | — | `services/graph/` | `components/graph/` |
| Theme | `stores/theme/` | `services/theme/` | `components/settings/` |
| Navigation | `stores/navigator/` | — | `components/sidebar/` |

---

## Related

- [Canvas System](bismuth-canvas-system.md) — Deep dive into the canvas architecture
- [MCP Protocol](canvas-mcp-protocol.md) — Design-to-code protocol
- [Modular Design](modular-architecture.md) — Component modularity patterns
- [Folder Structure](../reference/folder-structure.md) — Complete directory layout
