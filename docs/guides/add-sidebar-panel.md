# How to Add a Sidebar Panel

## Purpose

This guide explains how to add a new panel to the Bismuth left or right sidebar. Panels appear as icon-tab entries in the `VerticalTabBar` and render their content in the sidebar content area.

## Files touched

- `src/lib/stores/layout/layout.ts` — add a `SidebarTab` entry to `DEFAULT_LEFT_TABS` or `DEFAULT_RIGHT_TABS`
- `src/lib/components/sidebar/LeftSidebarContent.svelte` (or `RightSidebarContent.svelte`) — add the panel component branch
- `src/lib/utils/icons.ts` — verify your icon key exists (add it if not)
- Your panel component — create it in the relevant feature directory

---

## Step-by-step walkthrough

### 1. Create the panel component

Create a Svelte component for the panel content. If the panel belongs to an existing feature module, place it inside that feature's `components/` directory:

```
src/lib/features/my-feature/components/MyFeatureSidebarPanel.svelte
```

For standalone panels not tied to a feature module, place it under:

```
src/lib/components/sidebar/panels/MyPanel.svelte
```

Minimal scaffold:

```svelte
<script lang="ts">
  import { log } from '@/utils/logger';

  // Panel-specific reactive state
  let loading = false;

  log.debug('MyPanel mounted');
</script>

<div class="my-panel">
  <div class="panel-header">
    <h3 class="panel-title">My Panel</h3>
  </div>
  <div class="panel-body">
    <!-- panel content here -->
  </div>
</div>

<style>
  .my-panel { display: flex; flex-direction: column; height: 100%; }
  .panel-header { padding: var(--spacing-s) var(--spacing-m); border-bottom: 1px solid var(--border-color); }
  .panel-title { margin: 0; font-size: var(--font-ui-small); font-weight: 600; }
  .panel-body { flex: 1; overflow: auto; padding: var(--spacing-m); }
</style>
```

### 2. Verify your icon key exists

Open `src/lib/utils/icons.ts` and search for the icon name you want to use. If it is missing, add an SVG string for it following the existing pattern:

```typescript
export const icons = {
  // ... existing icons ...
  puzzle: `<svg viewBox="0 0 16 16" ...>...</svg>`,
};
```

Keep SVG paths minimal (single path preferred). Do not add external icon library dependencies.

### 3. Register the tab in `layout.ts`

Open `src/lib/stores/layout/layout.ts`. Add an entry to `DEFAULT_LEFT_TABS` (or `DEFAULT_RIGHT_TABS` for a right-panel):

```typescript
import type { SidebarTab } from '@/types/layout';

export const DEFAULT_LEFT_TABS: SidebarTab[] = [
  { id: 'files',      icon: 'folder',  label: 'Files',      order: 10 },
  { id: 'search',     icon: 'search',  label: 'Search',     order: 20 },
  { id: 'graph',      icon: 'graph',   label: 'Graph',      order: 30 },
  { id: 'my-panel',   icon: 'puzzle',  label: 'My Panel',   order: 40 }, // add this
];
```

The `order` field controls the visual position of the tab in the bar. Use a round number that fits between existing entries, or append at the end.

### 4. Wire the panel in `LeftSidebarContent.svelte`

Open `src/lib/components/sidebar/LeftSidebarContent.svelte`. Find the tab-content switch and add your panel:

```svelte
<script lang="ts">
  // Use an async import to avoid loading the panel until it is first opened
  import { activeLeftTab } from '@/stores/layout/layoutStore';
</script>

{#if $activeLeftTab === 'files'}
  <FileTree />
{:else if $activeLeftTab === 'search'}
  <SearchPanel />
{:else if $activeLeftTab === 'my-panel'}
  {#await import('@/features/my-feature') then { MyFeatureSidebarPanel }}
    <MyFeatureSidebarPanel />
  {/await}
{/if}
```

The async import pattern (`{#await import(...)}`  ) keeps the sidebar JS bundle lean — the panel module is only fetched when the user first opens that tab.

---

## Checklist

- [ ] Panel component created (under 300 lines, no `console.log`)
- [ ] Icon key verified in `icons.ts` (add if missing)
- [ ] `SidebarTab` entry added to `DEFAULT_LEFT_TABS` or `DEFAULT_RIGHT_TABS` in `layout.ts`
- [ ] Panel branch added to `LeftSidebarContent.svelte` (or right equivalent) using async import
- [ ] Panel renders correctly when tab is clicked
- [ ] Panel handles resize via the existing split-pane flex layout (do not hardcode heights)
