# Bismuth - API / Command Contracts

**Date:** 2026-07-14

## Scope

Bismuth primarily exposes native capabilities through Tauri command handlers (Rust) and a local MCP HTTP route.

## Tauri Command Surface (Core)

Representative commands from `src-tauri/src/hubs/core/commands.rs`:

- Vault lifecycle: `open_vault`, `create_vault`, `scan_vault`
- Note CRUD: `read_note`, `write_note`, `create_note`, `delete_note`, `rename_note`
- Search/graph: `search_vault`, `build_graph_data`, `extract_vault_tags`, `batch_read_notes`
- Versioning: `list_versions`, `create_version`, `read_version`, `delete_version`
- Git ops: `git_status`, `git_stage_all`, `git_commit`, `git_push`, `git_pull`
- Import/publish/backup/stats: `import_notes`, `publish_notes`, `create_backup`, `list_backups`, `compute_vault_stats`
- Similarity: `find_similar_notes`, `find_similar_to_text`

## Local HTTP Endpoint

- MCP route initialized in native app bootstrap:
  - **POST** `/mcp`
  - Bound on local API server (`127.0.0.1:<API_PORT>`)

## Contract Notes (2026-07-15 update)

- `create_note` now supports optional extension selection (`md` | `pen`), defaulting to `md`.
- MCP toolset includes `list_pen_notes` for `.pen` artifact discovery.
- MCP resource read/list MIME typing now maps by extension (`.md`, `.pen`, `.canvas`).
- MCP canvas tooling now includes Figma-style placement/style and design-to-dev workflows:
  - align/distribute/style patch operations for selected nodes
  - auto-layout field updates on frame/component nodes
  - component promotion and instance creation
  - code-connect mapping upsert/list and handoff export bundle
- Phase 2 canvas parity adds MCP-driven design-system/handoff constructs:
  - token library CRUD/binding (`upsert_canvas_token`, `list_canvas_tokens`, `bind_canvas_token`)
  - shared styles library and application (`upsert_canvas_style`, `apply_canvas_style`)
  - variant/property model (`define_canvas_variant_set`, `upsert_canvas_variant`, `set_canvas_instance_variant`)
  - richer code-connect snippet generation (`generate_code_connect_snippets`) and inclusion in `export_canvas_handoff`
- Phase 3 canvas parity adds mode-aware render semantics and stricter framework snippets:
  - active token mode switching (`set_canvas_token_mode`) with instance snapshot refresh
  - explicit instance render snapshot resolution (`resolve_canvas_instance_render`)
  - framework-templated snippet output (React/TSX, Svelte, Vue SFC) with deterministic prop ordering
- Phase 4 parity hardening adds layer-order operations and stricter mutation contracts:
  - z-index reorder controls (`reorder_canvas_elements`) for front/back and stepwise layer movement
  - mutation tools now fail explicitly when target node IDs are unmatched (`style_canvas_elements`, `apply_canvas_style`, `bind_canvas_token`)
  - token binding now validates token existence before mutation
  - Vue code-connect snippets now emit Vue-native `v-bind` syntax
- Phase 5 parity expansion adds component-property controls and deterministic resize metadata:
  - component property definition/listing (`upsert_canvas_component_property`, `list_canvas_component_properties`)
  - validated instance overrides (`set_canvas_instance_overrides`, plus validated `create_canvas_instance` overrides)
  - explicit constraint preset application (`set_canvas_constraint_preset`, and `constraint_preset` in `set_canvas_auto_layout`)
  - instance render snapshots now include `resizeResolution` metadata for deterministic handoff semantics
- Phase 6 parity expansion deepens UX semantics and code/handoff contracts:
  - instance snapshots now expose `effectiveProperties` (override/default/unset source metadata)
  - nested resize semantics now surface parent-chain/auto-layout influence and effective width/height modes
  - code-connect contracts support states/slots/events/accessibility/examples/required props
  - contract auditing available via `validate_canvas_code_connect_contract`
  - handoff exports now include contract validation results, instance snapshots, and component property contracts
- Phase 7 parity expansion adds state/slot runtime semantics and shared library release workflows:
  - interaction state contracts and activation (`upsert_canvas_component_state`, `set_canvas_instance_state`)
  - slot composition contracts and strict required-slot validation (`upsert_canvas_component_slot`, `set_canvas_instance_slots`)
  - instance snapshots now include `interactionResolution` and `slotResolution` metadata for deterministic UI semantics
  - shared design library lifecycle tools (`publish_canvas_design_library`, `list_canvas_design_library_versions`, `restore_canvas_design_library_version`)
  - handoff exports now include component state contracts, slot contracts, and published design library releases

## Error Behavior

- Command handlers log invocation and surface typed application errors (`AppResult`).
- Failures are logged with command-level context.

## Security Notes

- Commands are local to app runtime; no external public API surface documented in this scan.
- Tauri capability trimming is enabled in config (`removeUnusedCommands`).

---

_Generated using BMAD Method `document-project` workflow_
