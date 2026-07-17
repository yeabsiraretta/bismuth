# 2026-07-15 — First-class `.pen` note support (phase 1)

## Added

- `.pen` extension support in native vault scanning and indexing.
- Optional `extension` parameter for note creation (`md` or `pen`) in:
  - Tauri command layer
  - Local API endpoint
  - MCP `create_note` tool
- MCP tool `list_pen_notes`.

## Changed

- Editor/open-tab flow now treats `.pen` as a text note type.
- `.pen` note creation is normalized into the `design/` tree for consistent artifact foldering:
  - no folder provided → `design/<title>.pen`
  - non-design folder provided → `design/<folder>/<title>.pen`
  - `design/...` folder provided → preserved
- Title parsing strips `.pen` and `.md` consistently via shared helper utilities.
- MCP resource MIME type now reflects file type:
  - `.md` → `text/markdown`
  - `.pen` → `text/plain`
  - `.canvas` → `application/json`

## Fixed

- Note rename now preserves original file extension (no forced `.md` rewrite).

## Verification

- Rust unit tests extended in `src-tauri/src/hubs/core/vault_service.rs`:
  - create + scan `.pen`
  - rename extension preservation
  - unsupported extension rejection
- Phase 2 UX follow-up:
  - command palette supports `New Pen File`
  - home quick actions include `New Pen`
  - editor enforces source mode for `.pen` (no markdown live preview mode)
  - toolbar enters pen-specific plain-text mode using existing UI primitives and utility-class styling
