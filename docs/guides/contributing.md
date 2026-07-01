# Contributing to Bismuth

> Guide for developers who want to extend or contribute to the Bismuth codebase.

---

## Prerequisites

- **Node.js** ≥ 20 (with pnpm ≥ 8)
- **Rust** ≥ 1.95 (with cargo)
- **Tauri CLI** (`pnpm add -g @tauri-apps/cli`)

---

## Setup

```bash
git clone https://github.com/yeabsiraretta/bismuth.git
cd bismuth
pnpm install
pnpm tauri dev
```

---

## Project Structure

```
bismuth/
├── src/                    # Frontend (Svelte + TypeScript)
│   ├── App.svelte          # Root component
│   ├── main.ts             # Entry point
│   └── lib/                # Shared library
│       ├── components/     # UI components (Svelte)
│       ├── stores/         # Reactive state (Svelte stores)
│       ├── services/       # IPC service wrappers
│       ├── types/          # TypeScript type definitions
│       ├── utils/          # Pure helper functions
│       └── styles/         # Design tokens, CSS
│
├── src-tauri/              # Backend (Rust)
│   └── src/
│       ├── main.rs         # Tauri app entry
│       ├── commands/       # IPC command handlers
│       ├── services/       # Business logic
│       ├── models/         # Data structures
│       └── utils/          # Shared utilities
│
└── docs/                   # Documentation
```

---

## Architecture Principles

1. **Layer separation** — Components never call IPC directly; they go through stores → services
2. **Local-first** — No network dependencies; all data on disk
3. **Folder density** — Max 8 implementation files per directory (see Architecture Constitution)
4. **File size** — No file exceeds 300 lines (350 tolerance, 400 blocks commit)
5. **Feature co-location** — Feature-scoped logic lives with its feature, not in global utils

---

## Adding a New Feature

### Frontend

1. **Types** — Add interfaces to `src/lib/types/`
2. **Service** — Create IPC wrapper in `src/lib/services/<domain>/`
3. **Store** — Add reactive state in `src/lib/stores/<domain>/`
4. **Components** — Build UI in `src/lib/components/<domain>/`
5. **Barrel exports** — Add `index.ts` for clean imports

### Backend

1. **Models** — Define data types in `src-tauri/src/models/`
2. **Service** — Implement logic in `src-tauri/src/services/`
3. **Command** — Create `#[tauri::command]` in `src-tauri/src/commands/<domain>/`
4. **Register** — Add to `src-tauri/src/app/handlers.rs` → `generate_handler![]`

### Documentation

1. Update `docs/reference/api-spec.md` with new commands
2. Add architecture notes to `docs/architecture/` if significant

---

## Data Flow Pattern

```
User Action → Component → Store Action → Service (invoke IPC) → Rust Command
                                                                      ↓
UI Re-renders ← Store Updates ← Service Returns ← Result/Error ←────┘
```

---

## Code Style

- **Imports** — Use `@/` alias (maps to `src/lib/`)
- **Components** — One component per `.svelte` file
- **CSS** — Use design tokens (`var(--token-name)`) from `styles/tokens.css`
- **Naming** — camelCase for files/variables, PascalCase for components/types
- **Tests** — Co-located `.test.ts` files or `__tests__/` directories

---

## Testing

```bash
# Frontend unit tests
pnpm test

# Backend tests
cd src-tauri && cargo test

# Type checking
pnpm exec tsc --noEmit

# Build verification
pnpm exec vite build
```

---

## Branching

- `main` — Stable, deployable
- `feature/<name>` — Feature development
- `fix/<name>` — Bug fixes

Commit format: `<type>: <description>` (e.g., `feat: add tag merge`, `fix: vault path validation`)

---

## Key Files

| Purpose | Location |
|---------|----------|
| Command registration | `src-tauri/src/app/handlers.rs` |
| API spec | `docs/reference/api-spec.md` |
| Architecture constitution | `.specify/memory/architecture_constitution.md` |
| Design tokens | `src/lib/styles/tokens.css` |
| Typography | `src/lib/styles/typography.css` |
| Path validation | `src-tauri/src/utils/path.rs` |
| Error types | `src-tauri/src/error.rs` |

---

## AI-Assisted Development (Governed Pipeline)

Bismuth uses a governed workflow pipeline for feature development:

```bash
/speckit.specify                              # Write the spec
/speckit.architecture-guard.governed-plan      # Plan with governance
/speckit.architecture-guard.governed-tasks     # Generate quality tasks
/speckit.architecture-guard.governed-implement # Implement with review gates
```

The governed pipeline automatically applies:
- Memory synthesis (constitution + durable decisions)
- Security review (trust boundaries, authorization)
- Architecture validation (drift detection)
- Quality skills (code-review, ux-review, component-gen, pict-test-designer)

See `docs/development/extension-integration.md` for full details.

## Extension System

Bismuth uses 7 Spec Kit extensions. See `docs/development/extension-integration.md` for the full list and configuration.

---

*Last Updated: 2026-06-13*
