# 2026-07-15 — MCP canvas Figma-parity foundation + code connect

## Added

- Extended MCP canvas tool surface in `src-tauri/src/infrastructure/mcp_server.rs`:
  - `list_canvas_elements`
  - `align_canvas_elements`
  - `distribute_canvas_elements`
  - `style_canvas_elements`
  - `set_canvas_auto_layout`
  - `create_canvas_component`
  - `create_canvas_instance`
  - `upsert_canvas_code_connect`
  - `list_canvas_code_connect`
  - `export_canvas_handoff`

## Changed

- `mcp/tools.md` now catalogs the expanded canvas + design-to-dev tooling.
- `docs/api-contracts.md` now documents the new MCP canvas and code-connect capabilities.

## Notes

- This phase focuses on practical parity primitives inspired by Figma workflows:
  - placement (alignment/distribution),
  - style mutation (patch semantics),
  - layout metadata (auto-layout + constraints payload updates),
  - component/instance workflow,
  - code-connect metadata and handoff export.

## Verification

- `pnpm test:rust`
- `pnpm lint`
- `pnpm test`
