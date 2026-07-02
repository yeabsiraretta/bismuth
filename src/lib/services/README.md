# Service Layer Patterns

## Overview

Services encapsulate all IPC (Tauri `invoke`) calls behind typed async functions. **Stores must never import `invoke` directly** — they delegate to services.

## Standard IPC Function Pattern

```typescript
import { invoke } from '@tauri-apps/api/core';

export async function getWidgets(): Promise<Widget[]> {
  return invoke<Widget[]>('get_widgets');
}

export async function createWidget(data: CreateWidgetInput): Promise<Widget> {
  return invoke<Widget>('create_widget', { data });
}
```

For complex error handling, use the shared `ipcCall` wrapper:

```typescript
import { ipcCall } from '@/utils/ipc';

export async function getWidgets(): Promise<Widget[]> {
  return ipcCall<Widget[]>('get_widgets');
}
```

## When to Use `ipcCall` vs Direct `invoke`

- **Prefer `ipcCall`**: Standardized error logging and labeling with zero boilerplate.
- **Direct `invoke`**: Only when you need custom error recovery logic that `ipcCall` doesn't support.

## Error Handling

- Services throw on failure — stores or components catch and handle UI state.
- `ipcCall` auto-logs errors with command name context.
- Never silently swallow errors in services; let them propagate.

## Logging Levels

| Action                              | Level                       |
| ----------------------------------- | --------------------------- |
| Mutations (create, update, delete)  | `log.info`                  |
| Reads / queries                     | `log.debug`                 |
| Expected fallbacks (file not found) | `log.debug`                 |
| Unexpected failures                 | `log.error` (via `ipcCall`) |

## Feature Service Location

```text
src/lib/features/<feature>/services/<feature>.ts
```

Core (non-feature) services:

```text
src/lib/services/<domain>/<service>.ts
```

## Migration Guide

To convert an existing store that calls `invoke` directly:

1. Create `services/<feature>.ts` next to the store
2. Move each `invoke(...)` call into a named export function
3. Import the function in the store and replace the `invoke` call
4. Remove `import { invoke } from '@tauri-apps/api/core'` from the store
5. Run `pnpm test:arch` to confirm the layer violation is resolved
