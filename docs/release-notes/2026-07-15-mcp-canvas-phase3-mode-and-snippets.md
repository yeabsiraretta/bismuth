# 2026-07-15 — MCP Canvas Phase 3: token modes + strict snippets

## Summary

Phase 3 extends canvas design-to-dev parity by introducing mode-aware token render resolution for instances and stricter framework-specific code-connect snippets.

## Added

- `set_canvas_token_mode`
  - Sets active token mode on canvas (`designSystem.activeTokenMode`).
  - Optionally refreshes all instance `resolvedRender` snapshots.
- `resolve_canvas_instance_render`
  - Resolves and persists token-aware render output for a specific instance.
- Deterministic framework snippet templates in `generate_code_connect_snippets`:
  - React (TSX component example scaffold)
  - Svelte (`<script lang="ts">` + component usage)
  - Vue (`<script setup lang="ts">` + `<template>`)

## Changed

- `set_canvas_instance_variant` now updates `resolvedRender` snapshot after variant resolution.
- Token references without explicit mode suffix now resolve by active mode first, then fallback to `default`.
- Snippet prop output is sorted for stable handoff diffs.

## Validation

- Added/updated Rust tests in `src-tauri/src/infrastructure/mcp_server.rs` covering:
  - mode-aware instance snapshot refresh
  - variant selection producing render snapshot
  - framework snippet payload shape and language metadata
