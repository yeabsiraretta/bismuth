# Architecture

Last reviewed: 2026-06-08

## System Overview

Bismuth is a modular monolith desktop application. The frontend (Svelte 4 + TypeScript) communicates with a Rust backend (Tauri 2) via IPC commands. State is managed through Svelte writable/derived stores. Persistence is filesystem-based (JSON and Markdown files in user vault directories).

## Major Components

- **Editor** (`src/lib/components/editor/`): CodeMirror 6 wrapper with extensions for live preview, wikilinks, and syntax highlighting
- **Canvas** (`src/lib/components/canvas/`): Infinite spatial workspace with element manipulation, component system, and flow prototyping
- **Sidebar** (`src/lib/components/sidebar/`): Navigation panels (file tree, search, graph, properties)
- **Vault** (`src/lib/stores/vault/`): Note CRUD, active note state, vault initialization
- **Tauri Backend** (`src-tauri/`): Filesystem access, component persistence, system integration

## Boundaries

### Layer Model

```text
Entry (UI Components) → Application (Stores) → Domain (Utils/Types) → Data (Services/IPC) → External (OS/FS)
```

### Domain Separation

- **vault domain**: Notes, file tree, search — MUST NOT import canvas internals
- **canvas domain**: Elements, tools, components, flows — MUST NOT import vault state
- **layout domain**: Sidebar visibility, tabs, widths — domain-agnostic

## Styling

- Single token source: `src/lib/styles/tokens.css`
- Tailwind v4 CSS-based config (not JS config)
- Dark mode: `data-theme="dark"` attribute
- Components use scoped CSS with `var()` references

## Integrations

- Tauri IPC (filesystem, component CRUD, system dialogs)
- CodeMirror 6 (editor engine with custom extensions)
- No external network calls (fully offline)

## Risks / Complexity Hotspots

- Svelte reactive statement cycles between stores and components
- CodeMirror decoration ordering constraints (RangeSetBuilder)
- Canvas element resolution for 1000+ component instances
- Cross-domain store imports violating boundary model

## Keep Here

- Stable system boundaries
- Ownership lines between modules or services
- Integration constraints that affect many features

## Never Store Here

- Step-by-step implementation plans
- One-off feature details
- Stale diagrams without current boundaries

Update the review date when boundaries, ownership, or integrations materially change.

---

### 2026-06-21 - Validate user-controlled IDs before using as filesystem path segments

**Status**: Active

**Why this is durable**: Any Tauri IPC command that constructs a filepath by embedding a user-supplied ID or name shares this risk. Applies to future note, canvas, template, plugin, component, and theme commands.

**Constraint**: Rust commands that join a user-provided `id: String` into a path via `dir.join(format!("{}.ext", id))` MUST validate the ID before path construction. A malicious `id` containing `../` sequences can escape the vault boundary.

**Required pattern**:

```rust
fn validate_id(id: &str) -> Result<(), String> {
    if id.is_empty() || id.len() > 128 { return Err("ID must be 1–128 chars".into()); }
    if id.chars().any(|c| !c.is_alphanumeric() && c != '-' && c != '_') {
        return Err(format!("ID contains invalid characters: {}", id));
    }
    Ok(())
}
```

Also: use `Mutex::map_err(|_| "lock poisoned")` instead of `Mutex::unwrap()` at command boundaries to prevent panic-on-poisoned-lock (SEC-004).

**Evidence**: SEC-001 (High) and SEC-004 (Low) from spec 004 security review; fixed in `src-tauri/src/commands/canvas/component.rs`.

**Where to look next**: `src-tauri/src/commands/canvas/component.rs:79-89`, security constitution §3 (vault isolation), §5 (IPC security)

---

### 2026-06-21 - Feature components must not call ipcCall() directly — use a service wrapper

**Status**: Active

**Why this is durable**: Applies to every Svelte component in any feature module. The P0 violation (component calling IPC) recurred in LlmVaultConfig.svelte during spec 040 before being caught at architecture review. UI components wiring settings forms directly to IPC is a recurring first-draft pattern.

**Constraint**: Components MUST NOT import `ipcCall` or `@tauri-apps/api/core`. All IPC calls MUST go through a named service function in the feature's `services/` layer. If no service exists for the operation, create one before writing the component.

**Required pattern**:

```typescript
// services/llmConfig.ts
export async function writeVaultLlmConfig(
  vaultRoot: string,
  config: VaultLlmConfig
): Promise<void> {
  return ipcCall<void>('write_vault_llm_config', { vaultRoot, config });
}

// components/LlmVaultConfig.svelte — correct
import { writeVaultLlmConfig } from '../services/llmConfig';
```

**Evidence**: Spec 040 implementation — LlmVaultConfig.svelte initially imported ipcCall directly; caught and refactored to services layer before commit.

**Where to look next**: Architecture constitution §Layer Boundaries P0 violations; `src/lib/features/llm/services/` (reference pattern)
