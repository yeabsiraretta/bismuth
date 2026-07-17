# 2026-07-15 — MCP dynamic config policy and generator

## Added

- `mcp/app-config-policy.json` as a source-of-truth policy for MCP endpoint resolution:
  - env variable names
  - default host/port/path values
  - explicit read precedence
- `scripts/render-mcp-config.mjs` to generate MCP client config from policy + environment.
- npm script `pnpm mcp:config:render`.

## Changed

- MCP docs updated:
  - `mcp/README.md` now documents dynamic config and policy file.
  - `mcp/SETUP.md` now includes env-driven endpoint generation workflow.

## Usage

Generate a dynamic MCP profile:

```bash
pnpm mcp:config:render
```

Override endpoint values:

```bash
BISMUTH_MCP_HOST=192.168.1.30 BISMUTH_MCP_PORT=21721 pnpm mcp:config:render
```

## Verification

- `pnpm mcp:config:render`
- `pnpm lint`
- `pnpm test`
- `pnpm build`
