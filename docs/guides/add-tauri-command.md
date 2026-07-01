# How to Add a Tauri Command

## Purpose

This guide shows how to add a new IPC command that the frontend can call to perform a Rust-side operation. The key rule: **no raw `invoke()` calls are allowed in Svelte components**. All IPC must go through a TypeScript service function.

## Files touched

- `src-tauri/src/commands/{domain}/mod.rs` (or a new file in that directory)
- `src-tauri/src/app/handlers.rs` — register in `tauri::generate_handler![]`
- `src/lib/services/{domain}/` — create or extend the TypeScript service
- Any Svelte component that needs the feature — call the service function, not `invoke`

---

## Step-by-step walkthrough

### 1. Create the Rust command function

Navigate to `src-tauri/src/commands/`. If a domain directory for your feature already exists, add your function there. Otherwise create a new directory following the existing pattern (e.g. `src-tauri/src/commands/notes/`).

```rust
// src-tauri/src/commands/notes/mod.rs  (or a dedicated file in that dir)

use tauri::State;
use crate::app::state::AppState;

/// Returns the word count for a note at the given path.
#[tauri::command]
pub async fn get_word_count(
    path: String,
    state: State<'_, AppState>,
) -> Result<u64, String> {
    let vault = state.vault.lock().await;
    let content = vault.read_note(&path).map_err(|e| e.to_string())?;
    let count = content.split_whitespace().count() as u64;
    Ok(count)
}
```

Rules:
- Add a one-line `///` rustdoc comment to every `#[tauri::command]` function.
- Return `Result<T, String>` — the string error is serialized to JS.
- Acquire locks in alphabetical order if you need more than one to avoid deadlocks.
- Keep files under 300 lines; split into sub-modules if needed.

### 2. Re-export from the domain `mod.rs`

If you created a new file (e.g. `word_count.rs`), re-export the function in the domain `mod.rs`:

```rust
// src-tauri/src/commands/notes/mod.rs
mod word_count;
pub use word_count::get_word_count;
```

If `notes` is a new domain, add it to `src-tauri/src/commands/mod.rs`:

```rust
// src-tauri/src/commands/mod.rs
pub mod notes;
```

### 3. Register in `handlers.rs`

Open `src-tauri/src/app/handlers.rs`. Find the `tauri::generate_handler![]` macro call and add your command.

```rust
use crate::commands::notes::get_word_count;

pub fn build_handler() -> impl Fn(tauri::Invoke) + Send + Sync + 'static {
    tauri::generate_handler![
        // ... existing commands ...
        get_word_count,
    ]
}
```

The command name in JavaScript is the snake_case function name verbatim: `get_word_count`.

### 4. Create the TypeScript service wrapper

Create or extend a service file in `src/lib/services/{domain}/`. Use the `ipcCall` helper or wrap `invoke` directly with the unified logger.

```typescript
// src/lib/services/notes/wordCount.ts
import { invoke } from '@tauri-apps/api/core';
import { log } from '@/utils/logger';

export async function getWordCount(path: string): Promise<number> {
  try {
    const count = await invoke<number>('get_word_count', { path });
    log.debug('getWordCount', { path, count });
    return count;
  } catch (err) {
    log.error('getWordCount failed', { path, err });
    throw err;
  }
}
```

If your project has an `ipcCall` utility in `@/utils/ipc`, prefer it:

```typescript
import { ipcCall } from '@/utils/ipc';

export async function getWordCount(path: string): Promise<number> {
  return ipcCall<number>('get_word_count', { path });
}
```

### 5. Call the service from Svelte components

In any Svelte component that needs the result, import the service function — never `invoke` directly.

```svelte
<script lang="ts">
  import { getWordCount } from '@/services/notes/wordCount';
  import { log } from '@/utils/logger';

  let wordCount = 0;

  async function refresh(path: string) {
    try {
      wordCount = await getWordCount(path);
    } catch (err) {
      log.error('WordCountDisplay: refresh failed', err);
    }
  }
</script>

<span>{wordCount} words</span>
```

---

## Checklist

- [ ] Rust command has a `///` rustdoc comment
- [ ] Function registered in `tauri::generate_handler![]` in `handlers.rs`
- [ ] Domain `mod.rs` re-exports the function
- [ ] TypeScript service wrapper created with try/catch and unified logger
- [ ] No raw `invoke()` calls in any Svelte component — only service functions
- [ ] Return type is `Result<T, String>` in Rust
- [ ] All Rust files remain under 300 lines
