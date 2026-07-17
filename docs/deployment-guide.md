# Bismuth - Deployment Guide

**Date:** 2026-07-14

## Deployment Targets

Bismuth is primarily distributed as a Tauri desktop application bundle.

## Build Outputs

- Frontend static build output: `build/`
- Desktop artifacts: generated via `tauri build` under Tauri target directories

## Build Commands

```bash
pnpm build
pnpm tauri:build
pnpm tauri:build:linux
```

## Configuration Inputs

- `src-tauri/tauri.conf.json` controls bundle metadata, app windows, identifiers, icon paths, and platform behavior.
- `svelte.config.js` + `vite.config.ts` control frontend build/runtime behavior used by desktop packaging.

## CI/CD Notes

CI is configured in `.github/workflows/ci.yml` with separate lanes for:

1. Frontend quality (lint, build, coverage)
2. Rust tests
3. Playwright smoke suite
4. Linux Tauri bundle build

## Linux Desktop Runtime Notes

For local Linux packaging/dev, missing system libs (GTK/WebKit/libxdo family) can break link/run even when code compiles.

Ubuntu package baseline:

```bash
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file \
  libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev \
  libsoup-3.0-dev patchelf
```

## NAS Runtime Notes

For NAS use, Bismuth can run as a LAN web service:

```bash
pnpm nas:bootstrap
pnpm build:nas
pnpm serve:nas
pnpm nas:healthcheck
```

For persistent startup on NAS (user-level systemd):

```bash
pnpm nas:install-service
pnpm nas:status
pnpm nas:logs
pnpm nas:restart
```

To remove:

```bash
pnpm nas:uninstall-service
```

Service config file is created at `~/.config/bismuth/bismuth-web.env`.
Template files are in `.bismuth/systemd/`.

## Release Checklist

- Confirm version updates in package/Cargo/Tauri manifests
- Run `pnpm check`
- Run `pnpm tauri:build`
- Smoke test packaged app on target OS

---

_Generated using BMAD Method `document-project` workflow_
