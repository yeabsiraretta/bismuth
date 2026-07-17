# 2026-07-15 — MCP Canvas Phase 4: hardening + Bismuth design artifacts

## Summary

This slice advances Figma-like parity by adding layer-stack reordering, tightening mutation error contracts, and fixing Vue code-connect snippet semantics. It also seeds reusable Bismuth-native design artifacts under `design/`.

## Added

- `reorder_canvas_elements`
  - Supports `bring_forward`, `send_backward`, `bring_to_front`, and `send_to_back`.
  - Recomputes stable `zIndex` ordering after each operation.
- New Bismuth design artifacts:
  - `design/bismuth-ui-foundations.canvas`
  - `design/bismuth-ui-foundations.pen`

## Changed

- `style_canvas_elements`, `apply_canvas_style`, and `bind_canvas_token` now return explicit errors when no selected node IDs match.
- `bind_canvas_token` now validates token existence before writing `tokenRef`.
- `generate_code_connect_snippets` now emits Vue-native bind syntax (`:prop="expr"`) with Vue-safe expression normalization.

## Validation

- Added/updated Rust tests in `src-tauri/src/infrastructure/mcp_server.rs` covering:
  - layer reorder z-index updates
  - strict error behavior for unmatched node IDs and missing tokens
  - Vue snippet bind syntax output
