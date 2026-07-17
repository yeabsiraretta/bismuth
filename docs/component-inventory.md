# Bismuth - Component Inventory

**Date:** 2026-07-14

## Overview

Bismuth’s UI is organized around hubs and panels. Most reusable behavior lives in hub services/stores, while route-level composition lives under `src/routes/(app)`.

## Hub-Level UI Domains

### Navigator

- Files
- Open Editors
- Search
- Recent
- Bookmarks
- Templates
- Capture

### Knowledge

- Tags
- Vault Stats
- Citations
- Connections
- Portent
- Topic Links

### Planner

- Calendar
- Tasks
- Daily Journal
- Periodic Reviews
- Habits

### Creative

- Ideas
- Writing

### Media

- Media Browser
- Attachments
- Embeds

### Integration

- Git
- AI Assistant
- Backup
- Publish
- RSS Feeds

### Right-Side Context Hubs

- Graph (Local Graph, Graph Config)
- Editor (Outline, Properties, Backlinks, Outgoing, Versions, Stats, Footnotes, Symbols, Lint, Speed Reader)
- Canvas (Inspector, Layers, Elements)

## Backend Service Components (Rust)

- Vault service
- Version service
- Git service
- Import service
- Publish service
- Backup service
- Stats service
- Embedding/similarity service

## Shared/Foundation Components

- Sidebar/hub registry definitions (`src/lib/constants/hub-registry.ts`)
- SAL/IPC bridge modules for frontend ↔ native interactions
- App-level settings, state, and logging stores

## Reusability Patterns

- Feature-specific services and stores stay in hub directories.
- Cross-hub/shared UI utilities live under `src/lib/ui` and `src/lib/utils`.
- Native commands are consolidated through `src-tauri/src/hubs/core/commands.rs` rather than scattered modules.

---

_Generated using BMAD Method `document-project` workflow_
