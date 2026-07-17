# Next Release Cross-Platform Hardening Runbook (2026-07-16)

## Scope

- Cross-platform script compatibility (`pnpm dev:web`, `pnpm build:web`, `pnpm tauri*` entry points)
- Vault open/create consistency (onboarding now uses shared SAL finalize flow)
- Immutable state safety fixes for planner + navigator capture choice editing
- Tauri dev CSP update for Vite HMR websocket

## Preflight

1. Install dependencies:
   - `pnpm install`
2. Confirm toolchains:
   - Node.js 22.13+
   - pnpm 11.11.0
   - Rust stable

## Linux Commands

```bash
pnpm lint
pnpm test -- --run
pnpm build
pnpm dev:web
pnpm tauri:dev
```

## macOS Commands

```bash
pnpm lint
pnpm test -- --run
pnpm build
pnpm dev:web
pnpm tauri:dev
```

## Windows Commands (PowerShell)

```powershell
pnpm lint
pnpm test -- --run
pnpm build
pnpm dev:web
pnpm tauri:dev
```

## Validation Checklist

- `pnpm dev:web` starts without inline env-var assignment errors.
- `pnpm tauri:dev` starts and does not invoke Linux-only helpers on macOS/Windows.
- Onboarding vault create/open and recent vault open land on `/` only after centralized vault finalize flow completes.
- Planner Projects and Navigator Capture choice editing do not rely on in-place state mutation.
- Vite HMR websocket connects under Tauri dev CSP.

## Notes / Known Platform Gaps

- Linux host validation cannot fully execute macOS/Windows native Tauri runtime paths; those commands are documented for direct execution on their host OS.
