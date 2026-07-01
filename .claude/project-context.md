# Bismuth Project Context

> **Canonical root config**: See `CLAUDE.md` at repo root for the complete skill integration map.

## Project Overview

**Name**: Bismuth  
**Type**: Personal Knowledge Management (PKM) Editor  
**Tech Stack**: Tauri (Rust) + Svelte + TypeScript  
**Status**: Active development (20+ specs delivered)

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

## Recent Completed Specs

- Spec 019: Tasks Query Engine (Obsidian Tasks-compatible DSL)
- Spec 020: .bismuth directory cleanup and self-design canvas
- Canvas system, graph visualization, backlinks, entity extraction
- Design tokens, style system, theme management

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

**Constitution**: `.specify/memory/constitution.md` v1.4.0
**Architecture**: `.specify/memory/architecture_constitution.md` v1.1.0
**Security**: `.specify/memory/security_constitution.md` v1.0.0

**Key Principles**:
- **Principle VI**: No file >300 lines; max 8 files/directory before mandatory subfolder split
- **Principle I**: Maintainable, cohesive, consistent code
- **Principle II**: 90%+ test coverage
- **Principle III**: Consistent UX across platforms
- **Layer Separation**: services/, stores/, types/, constants/, components/, utils/ physically separate

**UX Standards**: `docs/standards/ux-principles.md`
- 168 research-backed principles across 6 parts
- Apply during design, code review, implementation
- See `.claude/ux-evaluator.md` for evaluation workflow

## Governed Workflow Pipeline

The governed workflow pipeline uses ALL skills together:

```
/speckit.architecture-guard.governed-plan    → plan.md (+ code-review, ux-review, pict, component-gen)
/speckit.architecture-guard.governed-tasks   → tasks.md (+ pict, code-review, component-gen, ux-review)
/speckit.architecture-guard.governed-implement → code (+ all skills at coding/review/test gates)
```

## Development Workflow

1. **Feature Spec**: Write in `specs/<NNN-feature>/spec.md`
2. **Governed Plan**: `/speckit.architecture-guard.governed-plan`
3. **Governed Tasks**: `/speckit.architecture-guard.governed-tasks`
4. **Governed Implement**: `/speckit.architecture-guard.governed-implement`
5. **Memory Capture**: Lessons captured via `/speckit.memory-md.capture`

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

**Last Updated**: 2026-06-13  
**Version**: 0.3.0
