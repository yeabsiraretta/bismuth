# Feature Specification: Codebase Restructure & Modular Infrastructure

**ID**: 005  
**Status**: Draft  
**Priority**: High  
**Date**: 2026-06-05

## Problem Statement

The Bismuth codebase has grown organically across multiple feature sprints resulting in:
1. **Oversized files** exceeding the 300-line constitution limit (30+ files over 300 lines)
2. **Inconsistent folder structure** — utilities, services, and components lack standardized organization
3. **Monolithic `main.rs`** — all state initialization and 100+ command registrations in a single 226-line function
4. **Incomplete Tailwind integration** — canvas components use scoped CSS with `var()` but aren't leveraging the project's Tailwind CSS v4 system uniformly
5. **Loose wiring** — welcome screen, settings, logging, and theme systems are not cleanly connected
6. **Section-comment files** — large type files (e.g., `canvas.ts` at 629 lines) use `// ─── Section` comments instead of proper module splitting

## Requirements

### R1: File Splitting (Constitution Compliance)
- Split all files exceeding 300 lines into focused modules
- Use the `// ─── Section` comments as natural split boundaries
- Create barrel (`index.ts`) re-exports to preserve public API

### R2: Folder Structure Standardization
- Standardize frontend service/store/component organization
- Group related features into domain folders consistently
- Remove orphaned or duplicate files

### R3: Backend `main.rs` Modularization
- Split command registration into domain-specific handler groups
- Extract state initialization into a dedicated module
- Create a registry pattern for cleaner invoke_handler construction

### R4: Tailwind CSS Integration Across Canvas
- Ensure canvas components use Tailwind utilities or properly reference the shared token system
- Eliminate orphaned `var()` references that don't connect to `tokens.css`
- Verify dark mode support in all canvas UI

### R5: System Integration & Wiring
- Verify welcome screen displays correctly and routes to vault selection
- Ensure settings/style updates propagate via reactive stores
- Consolidate logging (frontend `logger` + backend `tracing`) for consistent observability
- Verify all component imports resolve without errors

## Success Criteria

- Zero files over 300 lines (excluding generated code)
- All `// ─── Section` separator comments replaced by actual module boundaries
- `main.rs` under 100 lines with state/commands delegated to modules
- Canvas Svelte components reference Tailwind/token CSS variables consistently
- `pnpm check` and `cargo clippy` pass without new warnings
- Welcome screen, settings modal, and theme switching functional end-to-end

## Out of Scope

- New features or UI redesigns
- Database schema changes
- New Tauri commands or frontend services
- Performance optimization (separate spec)
