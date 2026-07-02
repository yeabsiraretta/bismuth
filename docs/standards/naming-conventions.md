# Bismuth Naming Conventions

**Type**: Standards  
**Created**: 2026-05-26  
**Status**: Active  
**Related**: Documentation Template

---

## Overview

This document defines consistent naming conventions for all files in the Bismuth project.

---

## File Naming Standards

### Markdown Files

**Rule**: Use `kebab-case` for all markdown files

**Format**: `{category}-{description}.md`

**Examples**:

- ✅ `phase-2.1-complete.md`
- ✅ `bismuth-canvas-system.md`
- ✅ `canvas-mcp-protocol.md`
- ✅ `naming-conventions.md`
- ❌ `PHASE_1_COMPLETE.md`
- ❌ `Bismuth_Canvas_System.md`
- ❌ `CanvasMCPProtocol.md`

**Special Cases**:

- `README.md` - Always uppercase (standard convention)
- `CHANGELOG.md` - Always uppercase (standard convention)
- `LICENSE.md` - Always uppercase (standard convention)

### TypeScript/JavaScript Files

**Rule**: Use `camelCase` for files, `PascalCase` for components

**Format**:

- Components: `{ComponentName}.svelte`, `{ComponentName}.tsx`
- Utilities: `{utilityName}.ts`
- Tests: `{fileName}.test.ts`, `{fileName}.spec.ts`

**Examples**:

- ✅ `CanvasView.svelte`
- ✅ `Toolbar.svelte`
- ✅ `wikilinkParser.ts`
- ✅ `wikilink.test.ts`
- ❌ `canvas-view.svelte`
- ❌ `wikilink_parser.ts`

### Rust Files

**Rule**: Use `snake_case` for all Rust files

**Format**: `{module_name}.rs`

**Examples**:

- ✅ `note.rs`
- ✅ `vault.rs`
- ✅ `canvas_service.rs`
- ✅ `mcp_server.rs`
- ❌ `canvasService.rs`
- ❌ `MCPServer.rs`

### Configuration Files

**Rule**: Use project-specific conventions

**Examples**:

- ✅ `package.json` (lowercase, npm standard)
- ✅ `Cargo.toml` (PascalCase, Rust standard)
- ✅ `tsconfig.json` (lowercase, TypeScript standard)
- ✅ `.eslintrc.json` (lowercase with dot prefix)

### Directory Names

**Rule**: Use `kebab-case` for directories

**Examples**:

- ✅ `src-tauri/`
- ✅ `demo-vault/`
- ✅ `docs/architecture/`
- ✅ `docs/milestones/`
- ❌ `src_tauri/`
- ❌ `DemoVault/`

---

## Documentation Structure

### Directory Organization

```
docs/
├── architecture/          # System design documents
│   ├── bismuth-canvas-system.md
│   └── canvas-mcp-protocol.md
├── implementation/        # Implementation guides
│   └── mvp-checklist.md
├── milestones/           # Completion reports
│   ├── phase-1-complete.md
│   ├── phase-2.1-complete.md
│   └── functional-ui-complete.md
├── standards/            # Project standards
│   ├── naming-conventions.md
│   └── documentation-template.md
└── README.md             # Documentation index
```

### File Prefixes

Use prefixes to indicate document type:

- **No prefix**: General documentation
- **`phase-{n}-`**: Phase completion reports
- **`{feature}-`**: Feature-specific docs

---

## Naming Patterns by Type

### Architecture Documents

**Pattern**: `{system-name}-{aspect}.md`

**Examples**:

- `bismuth-canvas-system.md`
- `canvas-mcp-protocol.md`
- `graph-rag-integration.md`
- `johnny-decimal-implementation.md`

### Milestone Documents

**Pattern**: `phase-{number}-complete.md` or `{milestone-name}-complete.md`

**Examples**:

- `phase-1-complete.md`
- `phase-2.1-complete.md`
- `functional-ui-complete.md`
- `mvp-launch-complete.md`

### Implementation Documents

**Pattern**: `{feature-name}-{type}.md`

**Examples**:

- `mvp-checklist.md`
- `testing-strategy.md`
- `deployment-guide.md`
- `api-reference.md`

### Standards Documents

**Pattern**: `{standard-name}.md`

**Examples**:

- `naming-conventions.md`
- `documentation-template.md`
- `code-style-guide.md`
- `commit-message-format.md`

---

## Case Conventions Summary

| File Type                  | Convention         | Example                      |
| -------------------------- | ------------------ | ---------------------------- |
| Markdown (docs)            | kebab-case         | `phase-1-complete.md`        |
| Markdown (root)            | UPPERCASE          | `README.md`, `LICENSE.md`    |
| TypeScript/JS (components) | PascalCase         | `CanvasView.svelte`          |
| TypeScript/JS (utilities)  | camelCase          | `wikilinkParser.ts`          |
| TypeScript/JS (tests)      | camelCase + suffix | `wikilink.test.ts`           |
| Rust                       | snake_case         | `canvas_service.rs`          |
| Directories                | kebab-case         | `docs/architecture/`         |
| Config files               | Project standard   | `package.json`, `Cargo.toml` |

---

## Migration Checklist

When renaming existing files:

- [ ] Update all imports/references
- [ ] Update documentation links
- [ ] Update Git history (if needed)
- [ ] Update build scripts
- [ ] Update CI/CD pipelines
- [ ] Test that everything still works

---

## Enforcement

### Pre-commit Hooks

Add linting for file names:

```bash
# .husky/pre-commit
# Check markdown file naming
find docs -name "*.md" ! -name "README.md" ! -name "CHANGELOG.md" | \
  grep -E '[A-Z_]' && echo "Error: Use kebab-case for markdown files" && exit 1
```

### CI Checks

Add to GitHub Actions:

```yaml
- name: Check file naming conventions
  run: |
    npm run lint:filenames
```

---

## Rationale

### Why kebab-case for Markdown?

1. **URL-friendly**: Works well in web contexts
2. **Readable**: Easy to scan and understand
3. **Standard**: Common in documentation projects
4. **Git-friendly**: No issues with case-sensitive filesystems

### Why PascalCase for Components?

1. **React/Svelte standard**: Matches component naming
2. **Clear distinction**: Easy to identify components
3. **Import clarity**: Matches how they're imported

### Why snake_case for Rust?

1. **Rust standard**: Follows official style guide
2. **Consistency**: Matches Rust module naming
3. **Tooling support**: Rust tools expect this format

---

## Examples of Correct Naming

### Good Documentation Structure

```
docs/
├── architecture/
│   ├── bismuth-canvas-system.md
│   ├── canvas-mcp-protocol.md
│   └── data-model-design.md
├── implementation/
│   ├── mvp-checklist.md
│   ├── testing-strategy.md
│   └── deployment-guide.md
├── milestones/
│   ├── phase-1-complete.md
│   ├── phase-2-complete.md
│   └── mvp-launch-complete.md
└── standards/
    ├── naming-conventions.md
    ├── documentation-template.md
    └── code-style-guide.md
```

### Good Source Structure

```
src/
├── lib/
│   ├── components/
│   │   ├── CanvasView.svelte
│   │   ├── Toolbar.svelte
│   │   └── PropertiesPanel.svelte
│   ├── utils/
│   │   ├── wikilinkParser.ts
│   │   ├── dateFormatter.ts
│   │   └── pathResolver.ts
│   └── stores/
│       ├── canvasStore.ts
│       └── vaultStore.ts
└── __tests__/
    ├── wikilink.test.ts
    └── dateFormatter.test.ts
```

### Good Rust Structure

```
src-tauri/src/
├── models/
│   ├── note.rs
│   ├── vault.rs
│   ├── link.rs
│   └── canvas.rs
├── services/
│   ├── vault_service.rs
│   ├── canvas_service.rs
│   └── mcp_server.rs
└── utils/
    ├── path_utils.rs
    └── file_watcher.rs
```

---

## References

- Rust Style Guide: https://doc.rust-lang.org/1.0.0/style/style/naming/README.html
- TypeScript Style Guide: https://google.github.io/styleguide/tsguide.html
- Markdown Best Practices: https://www.markdownguide.org/basic-syntax/

---

**Last Updated**: 2026-05-26
