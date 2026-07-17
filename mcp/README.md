# MCP Configuration

This folder contains MCP configuration profiles for Bismuth's local MCP server.

## Server Endpoint

- URL: `http://127.0.0.1:21721/mcp`
- Source implementation: `src-tauri/src/infrastructure/mcp_server.rs`

## Files

- `config.base.json` — canonical MCP server config for Bismuth
- `config.dynamic.json` — generated profile resolved from environment/policy defaults
- `config.claude-desktop.json` — profile example for Claude Desktop compatible layouts
- `config.cursor.json` — profile example for Cursor-compatible layouts
- `config.vscode-copilot.json` — profile example for VS Code/Copilot-compatible layouts
- `app-config-policy.json` — environment variable policy + default endpoint values
- `tools.md` — current tool categories and names exposed by Bismuth MCP

## Notes

1. Root `mcp-config.json` remains backward-compatible.
2. Keep these profiles aligned with any server URL/port changes.
3. Feature availability comes from the running Bismuth instance, not from config files.
4. Run `pnpm mcp:config:render` to regenerate `mcp/config.dynamic.json`.
