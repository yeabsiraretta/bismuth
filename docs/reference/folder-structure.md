---
summary: Standardized folder structure and file organization guidelines
read_when: Adding new files, refactoring code, or organizing components
---

# Folder Structure Standards

This document defines the standardized folder structure for Bismuth, ensuring consistent organization and easy navigation.

## Core Principles

1. **Nested Organization**: Files should be in folders when multiple related files exist
2. **Single File Exception**: A folder with only one file should have that file inside a subfolder (e.g., `folder/subfolder/file.ext`)
3. **Grouping by Feature**: Related files grouped by feature/domain, not by file type
4. **Index Files**: Use `index.ts` for clean imports
5. **Flat When Appropriate**: Don't over-nest; 2-3 levels is ideal

## Frontend Structure (`src/`)

```
src/
├── main.ts                          # Application entry point
├── App.svelte                       # Root component
├── vite-env.d.ts                   # Vite type definitions
│
├── lib/                            # Shared library code
│   ├── api/                        # API layer
│   │   └── vault/
│   │       ├── index.ts
│   │       ├── commands.ts
│   │       └── types.ts
│   │
│   ├── components/                 # UI components
│   │   ├── backlinks/
│   │   │   ├── index.ts
│   │   │   ├── Backlinks.svelte
│   │   │   └── OutgoingLinks.svelte
│   │   │
│   │   ├── dialogs/
│   │   │   ├── index.ts
│   │   │   ├── NewNoteDialog.svelte
│   │   │   └── DeleteConfirmDialog.svelte
│   │   │
│   │   ├── editor/
│   │   │   ├── index.ts
│   │   │   ├── Editor.svelte
│   │   │   ├── SplitPane.svelte
│   │   │   └── extensions/
│   │   │       ├── index.ts
│   │   │       └── wikilink.ts
│   │   │
│   │   ├── graph/
│   │   │   ├── index.ts
│   │   │   ├── GraphView.svelte
│   │   │   ├── GraphSettings.svelte
│   │   │   └── GraphContextMenu.svelte
│   │   │
│   │   ├── icons/
│   │   │   ├── index.ts
│   │   │   └── Icon.svelte
│   │   │
│   │   ├── layout/
│   │   │   ├── index.ts
│   │   │   └── ResizablePanel.svelte
│   │   │
│   │   ├── ui/
│   │   │   ├── index.ts
│   │   │   ├── Button.svelte
│   │   │   ├── Input.svelte
│   │   │   ├── Modal.svelte
│   │   │   ├── Dropdown.svelte
│   │   │   ├── Toast.svelte
│   │   │   ├── ToastManager.svelte
│   │   │   └── Tooltip.svelte
│   │   │
│   │   ├── vault/
│   │   │   ├── index.ts
│   │   │   ├── WelcomeScreen.svelte
│   │   │   ├── VaultPicker.svelte
│   │   │   ├── FileTree.svelte
│   │   │   ├── Toolbar.svelte
│   │   │   └── Sidebar.svelte
│   │   │
│   │   └── note/
│   │       ├── index.ts
│   │       └── NoteEditor.svelte
│   │
│   ├── config/
│   │   ├── index.ts
│   │   └── constants.ts
│   │
│   ├── services/
│   │   ├── index.ts
│   │   ├── vault/
│   │   │   ├── index.ts
│   │   │   └── vault.ts
│   │   └── search/
│   │       ├── index.ts
│   │       └── search.ts
│   │
│   ├── stores/
│   │   ├── index.ts
│   │   ├── vault/
│   │   │   ├── index.ts
│   │   │   └── vault.ts
│   │   └── layout/
│   │       ├── index.ts
│   │       └── layout.ts
│   │
│   ├── styles/
│   │   ├── tokens.css
│   │   ├── responsive.css
│   │   └── grid-system.css
│   │
│   ├── types/
│   │   ├── index.ts
│   │   ├── vault.ts
│   │   ├── note.ts
│   │   ├── search.ts
│   │   ├── graph.ts
│   │   └── state.ts
│   │
│   ├── utils/
│   │   ├── index.ts
│   │   ├── wikilink/
│   │   │   ├── index.ts
│   │   │   ├── wikilink.ts
│   │   │   └── __tests__/
│   │   │       └── wikilink.test.ts
│   │   └── graph/
│   │       ├── index.ts
│   │       └── graphExport.ts
│   │
│   └── assets/
│       ├── index.ts
│       └── icons.ts
│
└── types/                          # Root-level type definitions
    └── tauri-plugins.d.ts
```

## Backend Structure (`src-tauri/src/`)

```
src-tauri/src/
├── main.rs                         # Application entry point
├── lib.rs                          # Library exports
│
├── commands/                       # Tauri commands
│   ├── mod.rs
│   ├── vault/
│   │   ├── mod.rs
│   │   ├── create.rs
│   │   ├── open.rs
│   │   └── scan.rs
│   └── note/
│       ├── mod.rs
│       ├── read.rs
│       ├── write.rs
│       └── delete.rs
│
├── config/                         # Configuration
│   ├── mod.rs
│   ├── constants.rs
│   └── settings.rs
│
├── db/                            # Database layer
│   ├── mod.rs
│   ├── schema.rs
│   ├── migrations/
│   │   ├── mod.rs
│   │   └── v1_initial.rs
│   └── queries/
│       ├── mod.rs
│       ├── notes.rs
│       └── links.rs
│
├── error/                         # Error handling
│   ├── mod.rs
│   └── types.rs
│
├── models/                        # Data models
│   ├── mod.rs
│   ├── vault.rs
│   ├── note.rs
│   └── link.rs
│
├── services/                      # Business logic
│   ├── mod.rs
│   ├── vault_service/
│   │   ├── mod.rs
│   │   ├── vault_operations.rs
│   │   ├── vault_scanner.rs
│   │   ├── vault_templates.rs
│   │   ├── vault_recovery.rs
│   │   └── vault_history.rs
│   └── search_service/
│       ├── mod.rs
│       ├── indexer.rs
│       └── query.rs
│
└── utils/                         # Utilities
    ├── mod.rs
    ├── path/
    │   ├── mod.rs
    │   └── validation.rs
    └── fs/
        ├── mod.rs
        └── helpers.rs
```

## Reorganization Rules

### When to Create a Folder

**Create a folder when**:

- ✅ 2+ related files exist
- ✅ Files share a common domain/feature
- ✅ Logical grouping improves navigation

**Don't create a folder when**:

- ❌ Only 1 file exists (unless it's a placeholder for future growth)
- ❌ Files are unrelated
- ❌ It adds unnecessary nesting

### Nesting Guidelines

**Good Nesting** (2-3 levels):

```
components/
  vault/
    WelcomeScreen.svelte
    VaultPicker.svelte
```

**Over-Nesting** (avoid):

```
components/
  vault/
    welcome/
      screen/
        WelcomeScreen.svelte  # Too deep!
```

### Index Files

Every folder with multiple files should have an `index.ts`:

```typescript
// components/vault/index.ts
export { default as WelcomeScreen } from './WelcomeScreen.svelte';
export { default as VaultPicker } from './VaultPicker.svelte';
export { default as FileTree } from './FileTree.svelte';
```

**Benefits**:

- Clean imports: `import { WelcomeScreen } from '$lib/components/vault'`
- Encapsulation: Internal structure can change
- Discoverability: Single entry point

### File Naming

**Components**: PascalCase

- `WelcomeScreen.svelte`
- `ResizablePanel.svelte`
- `GraphView.svelte`

**Utilities/Services**: camelCase

- `wikilink.ts`
- `graphExport.ts`
- `vault.ts`

**Types**: camelCase (matching what they define)

- `vault.ts` (exports `Vault` type)
- `note.ts` (exports `Note` type)

**Constants**: camelCase

- `constants.ts`
- `settings.ts`

**Tests**: Match source file + `.test.ts`

- `wikilink.test.ts` (tests `wikilink.ts`)

## Migration Plan

### Phase 1: Create Missing Folders

1. Move vault-related components:

   ```
   components/WelcomeScreen.svelte → components/vault/WelcomeScreen.svelte
   components/VaultPicker.svelte → components/vault/VaultPicker.svelte
   components/FileTree.svelte → components/vault/FileTree.svelte
   components/Toolbar.svelte → components/vault/Toolbar.svelte
   components/Sidebar.svelte → components/vault/Sidebar.svelte
   ```

2. Move note-related components:

   ```
   components/NoteEditor.svelte → components/note/NoteEditor.svelte
   components/Editor.svelte → components/editor/Editor.svelte (already there)
   ```

3. Organize services:

   ```
   services/vault.ts → services/vault/vault.ts
   services/search.ts → services/search/search.ts
   ```

4. Organize stores:

   ```
   stores/vault.ts → stores/vault/vault.ts
   stores/layout.ts → stores/layout/layout.ts
   ```

5. Organize utils:
   ```
   utils/wikilink.ts → utils/wikilink/wikilink.ts
   utils/graphExport.ts → utils/graph/graphExport.ts
   ```

### Phase 2: Create Index Files

Create `index.ts` in each folder:

- `components/vault/index.ts`
- `components/note/index.ts`
- `services/vault/index.ts`
- `services/search/index.ts`
- `stores/vault/index.ts`
- `stores/layout/index.ts`
- `utils/wikilink/index.ts`
- `utils/graph/index.ts`

### Phase 3: Update Imports

Update all imports to use new paths:

```typescript
// Before
import WelcomeScreen from '$lib/components/WelcomeScreen.svelte';

// After
import { WelcomeScreen } from '$lib/components/vault';
```

### Phase 4: Remove Duplicates

Check for duplicate files (e.g., `Editor.svelte` in two places) and consolidate.

## Best Practices

### 1. Feature-Based Organization

Group by feature, not file type:

**Good**:

```
vault/
  WelcomeScreen.svelte
  VaultPicker.svelte
  vault.ts
  vault.test.ts
```

**Bad**:

```
components/
  WelcomeScreen.svelte
  VaultPicker.svelte
services/
  vault.ts
tests/
  vault.test.ts
```

### 2. Colocation

Keep related files close:

```
wikilink/
  wikilink.ts
  wikilink.test.ts
  index.ts
```

### 3. Barrel Exports

Use index files for clean exports:

```typescript
// utils/index.ts
export * from './wikilink';
export * from './graph';
```

### 4. Avoid Deep Nesting

Max 3 levels deep:

```
lib/
  components/      # Level 1
    vault/         # Level 2
      FileTree.svelte  # Level 3
```

### 5. Consistent Naming

- Folders: lowercase, hyphen-separated (`vault-service`)
- Files: Match content (PascalCase for components, camelCase for utilities)
- Index files: Always `index.ts`

## Tools

### Check Structure

```bash
# List all files by type
find src -name "*.svelte" | sort
find src -name "*.ts" | sort

# Find orphaned files (not in folders)
find src/lib/components -maxdepth 1 -name "*.svelte"
```

### Validate Organization

```bash
# Check for missing index files
find src/lib -type d -mindepth 2 ! -path "*/node_modules/*" -exec test ! -e {}/index.ts \; -print
```

## Related Documentation

- [Architecture Overview](../architecture/overview.md)
- [Component Guidelines](../standards/components.md)
- [Testing Guide](./testing.md)
