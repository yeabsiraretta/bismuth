# Bismuth - Development Guide

**Date:** 2026-07-14

## Prerequisites

- Node.js 22.13+ (required by pnpm 11 in this environment)
- pnpm 11.11.0
- Rust toolchain (stable)
- On Linux for Tauri: GTK/WebKit/libxdo development dependencies

## Install

```bash
pnpm install
```

## Local Development

### Web-Only

```bash
pnpm dev:web
```

Notes:

- `pnpm dev:web` now runs via a Node wrapper that sets `VITE_RUNTIME_MODE=web` in a Windows-safe way (no inline POSIX env assignment required).

### NAS / LAN Web Runtime

```bash
pnpm nas:bootstrap
pnpm build:nas
pnpm serve:nas
pnpm nas:healthcheck
```

Environment variables:

- `BISMUTH_HOST` (default `0.0.0.0`)
- `BISMUTH_PORT` (default `4173`)
- `BISMUTH_STRICT_PORT` (default `1`)
- `BISMUTH_SKIP_BUILD` (default `0`)
- `VITE_APP_ENV` (optional environment name used for feature flag targeting)
- `VITE_FEATURE_FLAGS` (optional JSON object for OpenFeature flag config)
- `VITE_RUNTIME_MODE` (`web` to force website mode; default auto-detects Tauri vs browser)
- `VITE_API_BASE_URL` (optional HTTP API base for website deployments; defaults to same-origin in web mode)

OpenFeature env-gated flags use default-release semantics:

- If a flag key is not present, it evaluates to `true` (released).
- If a flag has per-environment values, `default` can be used as fallback.

Example:

```bash
VITE_APP_ENV=staging
VITE_FEATURE_FLAGS='{"mobile_editing":{"development":true,"staging":false,"production":true,"default":true}}'
```

### Desktop (Tauri)

```bash
pnpm tauri:dev
```

Notes:

- Vite dev server is expected on port `5173`.
- If port `5173` is already in use, `tauri dev` startup fails.
- `pnpm tauri:dev` and `pnpm tauri dev` now use cross-platform Node entrypoints:
  - Linux: routes through the hardened launcher (`scripts/tauri-dev.sh`) with `xvfb-run` fallback + software-rendering defaults for headless/restricted sessions.
  - macOS/Windows: bypasses Linux-only checks/dependencies and invokes `tauri dev` directly.

## Build

### Web Build

```bash
pnpm build:web
```

Notes:

- `pnpm build:web` now uses the same Windows-safe runtime-mode wrapper approach as `pnpm dev:web`.

### Desktop Build

```bash
pnpm tauri:build
```

## Test

```bash
pnpm test
```

Additional:

```bash
pnpm test:ci
pnpm test:coverage
pnpm test:rust
pnpm e2e:smoke
pnpm e2e:regression
```

## Quality Checks

```bash
pnpm lint
pnpm format:check
pnpm check
```

## Development Conventions

- Use `@/` imports (alias to `src/lib`).
- Keep strict TS/lint settings intact; do not relax type/lint rules.
- Keep Tauri plugin versions aligned across JS and Rust package manifests.

## Common Tasks

- Add a new frontend feature: implement in `src/lib/hubs/<hub>/` and wire route/panel usage in `src/routes/(app)`.
- Add a new native capability: implement service/command in `src-tauri/src/hubs/core/` and expose through command registration in `app.rs`.
- Add tests near changed logic in `*.test.ts` and run `pnpm test`.

---

_Generated using BMAD Method `document-project` workflow_
