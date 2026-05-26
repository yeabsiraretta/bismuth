# Bismuth Project Context

## Project Overview

**Name**: Bismuth  
**Type**: Personal Knowledge Management (PKM) Editor  
**Tech Stack**: Tauri (Rust) + Svelte + TypeScript  
**Status**: Phase 3 implementation (Core Vault & Editor)

## Architecture

- **Frontend**: Svelte 4.2+ with TypeScript
- **Backend**: Rust with Tauri 1.5+
- **Editor**: CodeMirror 6
- **Database**: SQLite (local)
- **Search**: Tantivy (full-text)

## Key Features

1. **Vault Management**: PARA, Johnny.Decimal, Zettelkasten templates
2. **Markdown Editor**: CodeMirror 6 with wikilinks, auto-save
3. **Graph View**: Force-directed visualization of note connections
4. **Backlinks**: Bidirectional link tracking
5. **Search**: Full-text with Tantivy

## Current Phase: Phase 3 (US1 - Core Vault & Editor)

**Completed**:
- ✅ T035: Vault templates (4 types)
- ✅ T036: CodeMirror 6 integration
- ✅ T037: Wikilink extension
- ✅ T038: Auto-save (500ms debounce)

**In Progress**:
- T039: Crash recovery
- T040: Split-pane layout
- T041: Edit history
- T042: Size/depth warnings

## Code Organization

```
bismuth/
├── src/                      # Frontend (Svelte + TypeScript)
│   ├── lib/
│   │   ├── components/       # UI components
│   │   ├── services/         # API wrappers
│   │   ├── stores/           # Svelte stores
│   │   └── utils/            # Utilities
│   └── types/                # TypeScript types (modular)
├── src-tauri/                # Backend (Rust)
│   └── src/
│       ├── commands/         # IPC commands
│       ├── models/           # Data models
│       └── services/         # Business logic
├── docs/                     # Documentation
│   ├── architecture/
│   ├── development/
│   ├── implementation/
│   ├── standards/            # ⭐ UX principles here
│   └── status/
└── specs/                    # Feature specifications
```

## Constitution & Standards

**Constitution**: `.specify/memory/constitution.md` v1.1.0

**Key Principles**:
- **Principle VI**: No file >300 lines (enforced via ESLint, pre-commit hooks)
- **Principle I**: Maintainable, cohesive, consistent code
- **Principle II**: 90%+ test coverage
- **Principle III**: Consistent UX across platforms

**UX Standards**: `docs/standards/ux-principles.md`
- 168 research-backed principles across 6 parts
- Apply during design, code review, implementation
- See `.claude/ux-evaluator.md` for evaluation workflow

## File Size Compliance

**Current Violations** (5 files):
- `src/lib/components/graph/GraphView.svelte` (617 lines) - Critical
- `src-tauri/src/services/vault_service.rs` (608 lines) - Critical
- `src/lib/components/backlinks/Backlinks.svelte` (448 lines) - High
- `src-tauri/src/db.rs` (410 lines) - High
- `src/lib/components/backlinks/OutgoingLinks.svelte` (348 lines) - Medium

**Refactored**:
- ✅ `src/types/index.ts` (was 302, now 21 with 5 modules)

## Development Workflow

1. **Feature Spec**: Write in `specs/001-bismuth-pkm-editor/`
2. **Tasks**: Break down in `tasks.md`
3. **Implementation**: Follow TDD, respect file size limits
4. **UX Review**: Apply principles from `docs/standards/ux-principles.md`
5. **Code Review**: Check constitution compliance, UX checklist
6. **Testing**: Maintain 90%+ coverage

## Common Patterns

### IPC Commands (Tauri)
```rust
// Backend: src-tauri/src/commands/vault_commands.rs
#[tauri::command]
pub async fn command_name(param: Type) -> Result<ReturnType> {
    // Implementation
}

// Frontend: src/lib/services/vault.ts
export async function commandName(param: Type): Promise<ReturnType> {
    return await invoke<ReturnType>('command_name', { param });
}
```

### Svelte Components
```svelte
<script lang="ts">
  import type { Note } from '$lib/types';
  
  export let note: Note;
  export let onSave: (note: Note) => Promise<void>;
</script>

<div class="component">
  <!-- Template -->
</div>

<style>
  /* Scoped styles using CSS variables */
  .component {
    color: var(--text-normal);
    background: var(--background-primary);
  }
</style>
```

### Type Organization
```typescript
// Modular types in src/types/
export type { Note, Link } from './note';
export type { Vault, VaultConfig } from './vault';
export { VaultTemplate } from './vault';
```

## Quality Gates

**Pre-commit**:
- Rust formatting (cargo fmt)
- Clippy lints
- File size check (300-line limit)
- Lint-staged (ESLint, Prettier)

**CI/CD**:
- Multi-platform tests (Linux, macOS, Windows)
- Code coverage (90%+ required)
- File size validation
- Security scans (CodeQL, cargo audit)

## Useful Commands

```bash
# Development
pnpm dev                    # Start dev server
pnpm tauri:dev             # Start Tauri app

# Quality checks
pnpm check                 # Full quality check
pnpm check:file-sizes      # Verify 300-line limit
pnpm lint                  # ESLint
pnpm test                  # Run tests

# Build
pnpm build                 # Build frontend
pnpm tauri:build          # Build desktop app
```

## Key Files to Reference

- **Constitution**: `.specify/memory/constitution.md`
- **UX Principles**: `docs/standards/ux-principles.md`
- **Tasks**: `specs/001-bismuth-pkm-editor/tasks.md`
- **Design System**: `docs/standards/design-system.md`
- **Changelog**: `CHANGELOG.md`

## When Helping

1. **Check constitution** for governance constraints
2. **Apply UX principles** for UI work (use `.claude/ux-evaluator.md`)
3. **Respect file size limits** (300 lines max)
4. **Follow existing patterns** (IPC, components, types)
5. **Update changelog** for significant changes
6. **Maintain test coverage** (90%+)

---

**Last Updated**: 2026-05-26  
**Version**: 0.0.1 (pre-release)
