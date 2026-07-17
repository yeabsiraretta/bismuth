# Website Mode Runtime Hardening (Web + Tauri Coexistence)

Date: 2026-07-15

## What changed

- Added runtime mode resolution in `src/lib/utils/platform.ts`:
  - `VITE_RUNTIME_MODE=web` forces website mode.
  - Auto mode still uses Tauri when native internals are present.
- Added dedicated npm scripts for one-command website mode:
  - `pnpm dev:web`
  - `pnpm build:web`
- Removed hard static Tauri IPC import in `src/lib/ipc/invoke.ts`; Tauri API is now loaded lazily and guarded.
- Hardened event bridge for web runtime in `src/lib/ipc/events.ts`:
  - dynamic Tauri event imports
  - safe no-op fallback outside desktop runtime
- Updated app layout event wiring in `src/routes/(app)/+layout.svelte`:
  - Tauri menu/deep-link listeners now initialize lazily and only in desktop runtime.
- Updated API client base URL behavior in `src/lib/ipc/api-client.ts`:
  - supports `VITE_API_BASE_URL`
  - defaults to same-origin in website mode and `http://127.0.0.1:21721` in Tauri mode
- Updated native wrappers to use unified guarded IPC:
  - `src/lib/sal/stats-service.ts`
  - `src/lib/sal/embedding-service.ts`
- Added runtime mode unit coverage:
  - `src/lib/utils/__tests__/platform.test.ts`

## Why it changed

To allow Bismuth to run in website mode without breaking desktop/Tauri behavior, while keeping Rust-native features available whenever the app is running inside the Tauri shell.

## Verification

- Pending project verification loop (`pnpm lint`, `pnpm test -- --run`, `pnpm build`, Rust tests where relevant).
