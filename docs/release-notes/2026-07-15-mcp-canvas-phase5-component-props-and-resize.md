# 2026-07-15 — MCP Canvas Phase 5: component props + resize semantics + curated artifacts

## Summary

Phase 5 extends canvas parity with component property contracts, validated instance overrides, explicit constraint presets, and deterministic resize metadata in instance render snapshots. It also adds curated Bismuth design artifacts for shell/nav/editor primitives.

## Added

- Component property contract tools:
  - `upsert_canvas_component_property`
  - `list_canvas_component_properties`
- Instance override validation tool:
  - `set_canvas_instance_overrides`
- Constraint preset tool:
  - `set_canvas_constraint_preset`
- Curated design artifacts:
  - `design/bismuth-app-shell-primitives.canvas`
  - `design/bismuth-navigation-primitives.canvas`
  - `design/bismuth-editor-primitives.canvas`
  - `design/bismuth-token-component-map.pen`

## Changed

- `create_canvas_instance` now accepts optional `overrides` and validates them against declared component properties.
- `set_canvas_auto_layout` now accepts optional `constraint_preset`.
- Instance render snapshots now include `resizeResolution` metadata (`preset`, axis constraints, size modes, source).

## Validation

- Added/updated Rust tests in `src-tauri/src/infrastructure/mcp_server.rs` covering:
  - component property upsert/list round-trip
  - invalid override rejection
  - constraint preset propagation into snapshot resize metadata
