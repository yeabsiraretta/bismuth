# Manual Release Command Pack (Run Yourself)

I will not run these for you. Copy/paste them on your machine.

## 1) Install

```bash
pnpm install
```

## 2) Validate Build Health

```bash
pnpm lint
pnpm test -- --run
pnpm build
```

## 3) Dev Smoke

### Linux/macOS

```bash
pnpm dev:web
pnpm tauri:dev
```

### Windows (PowerShell)

```powershell
pnpm dev:web
pnpm tauri:dev
```

## 4) Manual Vault Smoke

Run app, then test:

1. Open existing vault from Welcome page
2. Create blank vault from Welcome page
3. Reopen a recent vault
4. Confirm app lands in main route only after vault loads

## 5) Adversarial Deep-Dive Commands

Create a focused diff file for review:

```bash
git --no-pager diff -- \
  package.json \
  scripts/tauri-dev.sh \
  scripts/tauri-cli.sh \
  scripts/run-vite-web.mjs \
  scripts/tauri-dev.mjs \
  scripts/tauri-cli.mjs \
  src/routes/'(app)'/projects/+page.svelte \
  src/lib/hubs/navigator/components/CapturePanel.svelte \
  src/lib/sal/vault-service.ts \
  src/routes/'(onboarding)'/welcome/+page.svelte \
  src-tauri/tauri.conf.json \
  docs/development-guide.md \
  docs/release-notes/2026-07-16-next-release-cross-platform-runbook.md \
  > .chunk/release_story_diff.txt
```

Then run your review workflows/agents against:

```text
.chunk/release_story_diff.txt
```

## 6) Optional Platform Build Checks

### macOS

```bash
pnpm tauri:build
```

### Windows (PowerShell)

```powershell
pnpm tauri:build
```
