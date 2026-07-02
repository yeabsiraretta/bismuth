# Feature Modules

Feature-scoped modules that consolidate stores, services, components, and types for a single domain.

## Convention

Each feature module follows this structure:

```
features/<name>/
  index.ts          # Public API barrel (only exported symbols are public)
  stores/           # Feature-scoped reactive state
  services/         # IPC wrappers, data fetching
  components/       # Svelte UI components
  types/            # Feature-specific interfaces
  __tests__/        # Co-located tests
```

## Feature Tiers

All features are declared in the **FeatureRegistry** (`src/lib/stores/settings/featureRegistry.ts`).

- **Core** — Always enabled, no user toggle. Essential PKM functionality
  (file tree, search, outline, properties, recent files).
- **Optional** — Off by default, user can toggle in Settings > Features.
  Everything else (graph, canvas, git, music, etc.).

The registry is the **single source of truth** for:

- Feature flag defaults and persistence
- Sidebar tab definitions (icons, labels, tooltips)
- Feature toggle UI (Settings > Features)
- Lazy-load / preload mapping

## Rules

- Cross-feature imports MUST use the public barrel: `import { x } from '@/features/<name>'`
- Internal paths (`@/features/<name>/stores/...`) are PROHIBITED from outside the module
- Layer separation is maintained within each module (stores don't import components, etc.)
- Max 8 files per sub-directory (standard density rule)
- Core infrastructure (vault, layout, settings, theme, editor, canvas) stays in top-level layer directories
- New features MUST be registered in the FeatureRegistry before use
- Feature flag keys MUST match sidebar tab IDs (no separate mapping)

## See Also

- `src/lib/stores/settings/featureRegistry.ts` — Feature Registry
- `.specify/memory/architecture_constitution.md` §Feature Modules
- `specs/026-feature-module-consolidation/plan.md`
