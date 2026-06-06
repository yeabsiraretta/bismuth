# IPC Command Contracts: Audit & Remediation

**Date**: 2026-06-04

## Overview

Bismuth uses Tauri IPC commands for frontend-backend communication. This document audits all command modules for consistency, error handling, and contract quality.

---

## Command Modules Inventory

### Vault Commands (`vault_commands.rs`) — ✅ Correct Pattern

| Command | Signature | Error Type |
|---------|-----------|------------|
| `open_vault` | `(path: String) → Result<Vault>` | `BismuthError` |
| `create_vault` | `(path: String) → Result<Vault>` | `BismuthError` |
| `create_vault_from_template` | `(path, template: String) → Result<Vault>` | `BismuthError` |
| `get_current_vault` | `() → Result<Option<Vault>>` | `BismuthError` |
| `scan_vault` | `() → Result<Vec<Note>>` | `BismuthError` |
| `read_note` | `(path: String) → Result<Note>` | `BismuthError` |
| `write_note` | `(path, content: String) → Result<()>` | `BismuthError` |
| `delete_note` | `(path: String) → Result<()>` | `BismuthError` |
| `rename_note` | `(old_path, new_path: String) → Result<()>` | `BismuthError` |
| `list_folders` | `(vault_path: String) → Result<Vec<String>>` | `BismuthError` |
| `list_notes` | `(vault_path, folder_path: String) → Result<Vec<Note>>` | `BismuthError` |
| `duplicate_note` | `(path: String) → Result<Note>` | `BismuthError` |
| `move_note` | `(old_path, new_folder: String) → Result<Note>` | `BismuthError` |
| `merge_notes` | `(paths: Vec<String>, target_path: String) → Result<Note>` | `BismuthError` |

**Issue**: All 25 commands use `state.vault_service.lock().unwrap()` — should use safe lock helper.

### Embedding Commands (`embedding_commands.rs`) — ❌ String Errors

| Command | Signature | Error Type |
|---------|-----------|------------|
| `initialize_embeddings` | `(vault_root: String) → Result<usize, String>` | **String** |
| `embed_note` | `(path: String) → Result<(), String>` | **String** |
| `index_all_embeddings` | `() → Result<usize, String>` | **String** |
| `get_similar_notes` | `(path: String, top_k: Option<usize>) → Result<Vec<SimilarNote>, String>` | **String** |
| `lookup_by_text` | `(query: String, top_k: Option<usize>) → Result<Vec<SimilarNote>, String>` | **String** |
| `get_embedding_config` | `() → Result<EmbeddingConfig, String>` | **String** |
| `set_embedding_config` | `(config: EmbeddingConfig) → Result<(), String>` | **String** |
| `get_embedding_stats` | `() → Result<EmbeddingStats, String>` | **String** |

**Fix**: Migrate all to `Result<T>` using `BismuthError`. Add `EmbeddingError` variant to `BismuthError` enum.

### Tag Commands (`tag_commands.rs`) — ❌ String Errors

| Command | Signature | Error Type |
|---------|-----------|------------|
| `get_all_tags` | `() → Result<Vec<TagInfo>, String>` | **String** |
| `get_notes_for_tag` | `(tag: String) → Result<Vec<String>, String>` | **String** |
| `get_tag_stats` | `(tag: String) → Result<TagStats, String>` | **String** |
| `search_tags` | `(query: String) → Result<Vec<TagInfo>, String>` | **String** |
| `rename_tag` | `(old, new: String) → Result<RenameResult, String>` | **String** |
| `merge_tags` | `(sources: Vec<String>, target: String) → Result<RenameResult, String>` | **String** |
| `export_tags` | `() → Result<String, String>` | **String** |

**Fix**: Migrate to `BismuthError`.

### Graph Commands (`graph_commands.rs`) — ❌ String Errors

| Command | Signature | Error Type |
|---------|-----------|------------|
| `get_graph_data` | `() → Result<GraphData, String>` | **String** |
| `get_outgoing_links` | `(note_path: String) → Result<Vec<Link>, String>` | **String** |

**Fix**: Migrate to `BismuthError`.

### Other Command Modules

| Module | Commands | Error Pattern | Status |
|--------|----------|--------------|--------|
| `search_commands.rs` | 2 | `BismuthError` | ✅ |
| `backlinks_commands.rs` | 4 | Mixed | ⚠️ Audit needed |
| `canvas_commands.rs` | 2 | `BismuthError` | ✅ |
| `entity_commands.rs` | 2 | `BismuthError` | ✅ |
| `lifecycle_commands.rs` | 3 | `BismuthError` | ✅ |
| `plugin_commands.rs` | 3 | Mixed | ⚠️ Audit needed |
| `property_commands.rs` | 4 | Mixed | ⚠️ Audit needed |
| `theme_commands.rs` | 4 | `BismuthError` | ✅ |
| `wikilink_commands.rs` | 2 | `String` | ❌ Fix |

---

## Frontend Service Layer Audit

### Services That Wrap IPC Correctly

| Service | File | Commands Wrapped |
|---------|------|-----------------|
| `vault/vault.ts` | `src/lib/services/vault/vault.ts` | open, create, scan, read, write |
| `theme.ts` | `src/lib/services/theme.ts` | theme CRUD |
| `search/` | `src/lib/services/search/` | search queries |

### Direct `invoke()` Calls in Components (bypassing services)

| Component | Command Called | Fix |
|-----------|--------------|-----|
| `TagPanel.svelte:95` | `create_note` | Route through vault service |
| `autoLinkerLogic.ts:134` | `write_note` | Route through vault service |
| `SettingsModal.svelte:161` | `open_in_file_manager` | Create utility service |
| `Toolbar.svelte:36,58` | `write_note`, `delete_note` | Route through vault service |
| `OutgoingLinks.svelte:63` | `create_link_from_unlinked_mention` | Route through wikilink service |
| `Backlinks.svelte:39,93` | `get_backlinks`, `create_link_from_mention` | Route through backlinks service |

---

## Target Contract Pattern

All IPC commands should follow this pattern:

**Rust side**:
```rust
#[tauri::command]
pub async fn command_name(
    args...,
    state: State<'_, AppState>,
) -> Result<ReturnType> {  // Result = crate::error::Result
    let service = state.vault_service.lock()
        .map_err(|_| BismuthError::Generic("Service lock failed".into()))?;
    service.method(args)
}
```

**TypeScript side**:
```typescript
// In src/lib/services/<domain>/<service>.ts
export async function commandName(args...): Promise<ReturnType> {
    return invoke<ReturnType>('command_name', { ...args });
}
```

**Component side**:
```typescript
// Never call invoke() directly — always use service layer
import { commandName } from '@/services/<domain>/<service>';
```
