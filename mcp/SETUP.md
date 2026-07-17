# MCP Setup Checklist

Use this checklist when connecting external MCP clients to Bismuth.

## 1) Start Bismuth runtime

- Desktop app running (Tauri)
- Local API/MCP endpoint reachable at `http://127.0.0.1:21721/mcp`

## 2) Pick a config profile

- Base profile: `mcp/config.base.json`
- Dynamic profile: `mcp/config.dynamic.json` (generated via `pnpm mcp:config:render`)
- Client examples:
  - `mcp/config.claude-desktop.json`
  - `mcp/config.cursor.json`
  - `mcp/config.vscode-copilot.json`

### Dynamic endpoint configuration

`pnpm mcp:config:render` resolves endpoint values from:

1. `BISMUTH_MCP_URL`
2. `BISMUTH_MCP_PROTOCOL` + `BISMUTH_MCP_HOST` + `BISMUTH_MCP_PORT` + `BISMUTH_MCP_PATH`
3. policy defaults in `mcp/app-config-policy.json`

Example:

```bash
BISMUTH_MCP_HOST=192.168.1.30 BISMUTH_MCP_PORT=21721 pnpm mcp:config:render
```

## 3) Validate tool discovery

- Call MCP `tools/list`
- Confirm core tools appear (notes, canvas, git, backups, similarity)

## 4) Smoke-test a tool

- `list_notes`
- `read_note` on a known vault path

## 5) Troubleshooting

- If tool list is empty: verify Bismuth app is running and vault is open.
- If connection fails: verify local port `21721` is free and bound.
