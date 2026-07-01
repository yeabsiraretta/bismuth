# How to Add a Feature Module

## Purpose

This guide explains how to create a new feature module under `src/lib/features/`. Feature modules isolate state, services, components, and types for a single product area. External consumers import only from the barrel — never from internal paths.

See also: `.specify/memory/architecture_constitution.md` section "Feature Modules" for the governance rules this guide implements.

## Files touched

- `src/lib/features/{name}/` — new directory tree (see scaffold below)
- `src/lib/features/{name}/index.ts` — public barrel (the only external import path)
- `src/lib/stores/layout/layout.ts` — add to `DEFAULT_LEFT_TABS` if you want a sidebar entry
- `src/lib/components/sidebar/LeftSidebarContent.svelte` — add the async panel loader

---

## Directory scaffold

```
src/lib/features/my-feature/
  index.ts              # Public API barrel — the ONLY external import path
  types/
    index.ts            # Feature-specific interfaces and enums
  stores/
    myFeatureStore.ts   # Svelte writable/derived stores
  services/
    myFeature.ts        # IPC wrappers (no raw invoke in components)
  components/
    MyFeaturePanel.svelte
  __tests__/
    myFeatureStore.test.ts
    myFeature.test.ts
```

Never exceed 8 files in any single directory (Constitution Principle VI). If a directory grows beyond 8 files, split into named sub-directories.

---

## Step-by-step walkthrough

### 1. Create the directory tree

```bash
mkdir -p src/lib/features/my-feature/{types,stores,services,components,__tests__}
```

### 2. Define your types

```typescript
// src/lib/features/my-feature/types/index.ts
export interface MyItem {
  id: string;
  label: string;
  createdAt: number;
}

export type MyFilter = 'all' | 'active' | 'archived';
```

### 3. Create the store

```typescript
// src/lib/features/my-feature/stores/myFeatureStore.ts
import { writable, derived } from 'svelte/store';
import type { MyItem, MyFilter } from '../types';

export const allItems = writable<MyItem[]>([]);
export const activeFilter = writable<MyFilter>('all');

export const filteredItems = derived(
  [allItems, activeFilter],
  ([$items, $filter]) => {
    if ($filter === 'all') return $items;
    // apply filter logic
    return $items;
  }
);
```

### 4. Create the service (IPC wrapper)

```typescript
// src/lib/features/my-feature/services/myFeature.ts
import { invoke } from '@tauri-apps/api/core';
import { log } from '@/utils/logger';
import type { MyItem } from '../types';

export async function loadItems(vaultPath: string): Promise<MyItem[]> {
  try {
    const items = await invoke<MyItem[]>('load_my_items', { vaultPath });
    log.debug('myFeature.loadItems', { count: items.length });
    return items;
  } catch (err) {
    log.error('myFeature.loadItems failed', err);
    throw err;
  }
}
```

If no new Tauri command is needed, call existing services from `@/services/` instead.

### 5. Implement the barrel (`index.ts`)

```typescript
// src/lib/features/my-feature/index.ts
export type { MyItem, MyFilter } from './types';
export { allItems, activeFilter, filteredItems } from './stores/myFeatureStore';
export { loadItems } from './services/myFeature';
export { default as MyFeaturePanel } from './components/MyFeaturePanel.svelte';
```

External consumers always import from this file:

```typescript
// correct
import { MyFeaturePanel, loadItems } from '@/features/my-feature';

// PROHIBITED — never import internal paths externally
import { loadItems } from '@/features/my-feature/services/myFeature';
```

### 6. Register a sidebar tab (optional)

If your feature needs a left sidebar panel, open `src/lib/stores/layout/layout.ts` and add to `DEFAULT_LEFT_TABS`:

```typescript
export const DEFAULT_LEFT_TABS: SidebarTab[] = [
  // ... existing tabs ...
  { id: 'my-feature', icon: 'puzzle', label: 'My Feature', order: 60 },
];
```

Then open `src/lib/components/sidebar/LeftSidebarContent.svelte` and add an async loader:

```svelte
{#if activeTab === 'my-feature'}
  {#await import('@/features/my-feature') then { MyFeaturePanel }}
    <MyFeaturePanel />
  {/await}
{/if}
```

The async import pattern keeps the initial bundle small.

---

## Checklist

- [ ] Directory tree created with all six subdirectories
- [ ] `index.ts` barrel exports all public types, stores, services, and components
- [ ] No internal path imports from outside the feature directory
- [ ] All new files under 300 lines
- [ ] No `console.log` — use `log.info` / `log.debug` / `log.error` from `@/utils/logger`
- [ ] No raw `invoke()` in Svelte components — all IPC goes through `services/`
- [ ] `__tests__/` contains at minimum one store test and one service test
- [ ] Target 90%+ test coverage for the new feature before marking complete
