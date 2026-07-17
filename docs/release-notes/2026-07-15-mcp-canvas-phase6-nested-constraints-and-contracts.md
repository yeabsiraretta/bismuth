# 2026-07-15 — MCP Canvas Phase 6: nested constraints + advanced contracts

## Summary

Phase 6 deepens Figma-style parity in three areas: component-property UX semantics, nested constraint solver metadata, and richer code-connect/handoff contracts.

## Added

- New MCP tool:
  - `validate_canvas_code_connect_contract`
- Code-connect contract fields on mapping upsert:
  - `states`, `slots`, `events`, `accessibility`, `examples`, `required_props`
- Snapshot metadata:
  - `effectiveProperties` (property value source: override/default/unset)
  - expanded `resizeResolution` with parent-chain and nested auto-layout influence

## Changed

- `create_canvas_instance` + `set_canvas_instance_overrides` now enforce richer property contract semantics and produce more explicit render metadata.
- `export_canvas_handoff` now includes:
  - code-connect validation report
  - computed instance snapshots
  - component property contracts

## Validation

- Added/updated Rust tests in `src-tauri/src/infrastructure/mcp_server.rs` covering:
  - nested auto-layout effect on effective resize modes
  - effective property source metadata in instance snapshots
  - contract validator detection of missing required prop mappings
