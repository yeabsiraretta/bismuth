# 2026-07-15 — MCP canvas phase 2 parity (tokens, variants, richer handoff)

## Added

- MCP token library and binding tools:
  - `upsert_canvas_token`
  - `list_canvas_tokens`
  - `bind_canvas_token`
- MCP shared style library tools:
  - `upsert_canvas_style`
  - `apply_canvas_style`
- MCP variant/property model tools:
  - `define_canvas_variant_set`
  - `upsert_canvas_variant`
  - `set_canvas_instance_variant`
- MCP snippet generation:
  - `generate_code_connect_snippets`

## Changed

- `export_canvas_handoff` now includes:
  - `codeSnippets` generated from `codeConnect` mappings
  - `variantSets`
  - `sharedStyles`
  - `designTokens`
- `mcp/tools.md` updated with full phase 2 tool inventory.
- `docs/api-contracts.md` updated with new MCP capability notes.

## Verification

- `pnpm test:rust`
- `pnpm lint`
- `pnpm test`
