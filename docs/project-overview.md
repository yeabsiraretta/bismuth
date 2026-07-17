# Bismuth - Project Overview

**Date:** 2026-07-14  
**Type:** Desktop (Tauri + SvelteKit)  
**Architecture:** Monolith with split runtime layers (Web UI + Rust core)

## Executive Summary

Bismuth is a local-first PKM desktop app built with SvelteKit (UI) and Tauri/Rust (native backend).
It provides note/vault management, graph and knowledge tooling, planner workflows, creative utilities,
media handling, and integration features (Git, AI, backup, publish).

## Project Classification

- **Repository Type:** Monolith
- **Project Type(s):** desktop
- **Primary Language(s):** TypeScript, Rust
- **Architecture Pattern:** Layered desktop app (UI shell + native command/service layer)

## Technology Stack Summary

| Category | Technology | Version |
|---|---|---|
| UI Framework | Svelte / SvelteKit | 5.x / 2.x |
| Build Tool | Vite | 6.x |
| Desktop Runtime | Tauri | 2.x |
| Native Language | Rust | edition 2021 |
| Package Manager | pnpm | 11.11.0 |
| Testing | Vitest / Playwright | 4.x / 1.49.x |

## Key Features

- Vault open/create/scan and Markdown note CRUD
- Graph data and tag extraction
- Version history and backups
- Local Git operations (status/stage/commit/push/pull)
- Import/publish flows
- Smart connections and similarity lookup
- Multi-hub UI (navigator, knowledge, planner, creative, media, integration)

## Architecture Highlights

- SvelteKit frontend with hub/panel feature partitioning under `src/lib/hubs/*`
- Tauri Rust command layer under `src-tauri/src/hubs/core/commands.rs`
- Shared app state and local API/MCP server startup in `src-tauri/src/app.rs`
- Strict lint/type conventions and alias-based imports (`@/`)

## Development Overview

### Prerequisites

- Node.js 22.13+ (pnpm 11 requirement in this environment)
- pnpm 11.11.0
- Rust toolchain (stable)
- Linux desktop dependencies for Tauri (GTK/WebKit/libxdo) when running locally on Linux

### Getting Started

Use `pnpm install`, then `pnpm dev` for web UI or `pnpm tauri:dev` for desktop mode.

### Key Commands

- **Install:** `pnpm install`
- **Dev (Web):** `pnpm dev`
- **Dev (Desktop):** `pnpm tauri:dev`
- **Build (Web):** `pnpm build`
- **Build (Desktop):** `pnpm tauri:build`
- **Test:** `pnpm test`

## Repository Structure

Frontend app code lives in `src/`, native runtime in `src-tauri/`, and generated BMAD docs/context in `_bmad*` directories.

## Documentation Map

- [index.md](./index.md) - Master documentation index
- [architecture.md](./architecture.md) - Detailed technical architecture
- [source-tree-analysis.md](./source-tree-analysis.md) - Directory structure
- [development-guide.md](./development-guide.md) - Development workflow

---

_Generated using BMAD Method `document-project` workflow_
