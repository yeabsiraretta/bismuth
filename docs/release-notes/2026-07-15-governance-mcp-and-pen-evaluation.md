# 2026-07-15 — Governance, MCP Config Layout, and `.pen` Evaluation

## Added

- `AGENTS.md` at repository root with engineering conventions for contributors/agents.
- `docs/release-notes/` folder with release-note conventions.
- `docs/adr/` framework with numeric ADR policy (`0000-9999`).
- `mcp/` folder with canonical and client-oriented MCP config templates.

## `.pen` File Evaluation

### Current behavior in Bismuth

- Vault scanning currently indexes only `.md` and `.canvas` files:
  - `src-tauri/src/hubs/core/vault_service.rs` (`collect_notes`, extension match)
- New notes are created as `.md`:
  - `src-tauri/src/hubs/core/vault_service.rs` (`create_note`)
- Canvas discovery is `.canvas`-specific:
  - `src-tauri/src/infrastructure/mcp_server.rs` (`list_canvases`)

### Can `.pen` be used today?

Partially:

- You can manually read/write arbitrary paths through lower-level note operations.
- But `.pen` files are not first-class vault artifacts, not indexed by scans, and not represented in canvas-specific flows.

### Would `.pen` be helpful?

Potentially yes, if intended as stylus/ink/pen-drawing data or prompt notebooks. It can be useful for:

- Separating non-Markdown artifact types from notes
- Capturing binary/structured pen strokes
- Future tablet/mobile workflows

### Recommendation

Adopt only with an explicit format contract. Suggested phased path:

1. Define `.pen` schema (JSON or binary + metadata).
2. Add extension support in vault scanning/indexing and API/MCP tool descriptions.
3. Add dedicated SAL service + editor/canvas integration.
4. Add migration and search behavior rules.

Without schema and UX integration, adding `.pen` now would increase complexity without immediate user value.
