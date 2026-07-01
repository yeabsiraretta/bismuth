# How to Add a Settings Tab

## Purpose

This guide walks you through adding a new tab to the Bismuth Settings modal. Follow each step in order; deviating from this sequence produces type errors or missing UI.

## Files touched

- `src/lib/stores/settings/settings.ts` — extend `BismuthSettings` and `DEFAULT_SETTINGS`
- `src/lib/stores/settings/settingsState.ts` — register the new tab ID
- `src/lib/components/settings/` (or `settings/system/`) — create the Svelte component
- `src/lib/components/settings/SettingsSidebar.svelte` — add sidebar entry
- `src/lib/components/settings/SettingsModal.svelte` — wire the new panel

---

## Step-by-step walkthrough

### 1. Extend `BismuthSettings`

Open `src/lib/stores/settings/settings.ts`. Add your new field to the `BismuthSettings` interface and to `DEFAULT_SETTINGS`.

```typescript
// BismuthSettings interface — add your field
export interface BismuthSettings {
  // ... existing fields ...
  myFeatureEnabled: boolean;
  myFeatureThreshold: number;
}

// DEFAULT_SETTINGS — add matching defaults
export const DEFAULT_SETTINGS: BismuthSettings = {
  // ... existing defaults ...
  myFeatureEnabled: false,
  myFeatureThreshold: 50,
};
```

The `{ ...DEFAULT_SETTINGS, ...saved }` merge in the settings loader means existing saved settings that lack your new fields are automatically populated with the defaults — no migration needed.

### 2. Add the tab ID to `settingsState.ts`

Open `src/lib/stores/settings/settingsState.ts`. Find the `SettingsTab` union type and add your new tab ID.

```typescript
export type SettingsTab =
  | 'general'
  | 'editor'
  | 'appearance'
  | 'vault'
  | 'shortcuts'
  | 'updates'
  | 'my-feature'; // add this
```

If `settingsState.ts` exposes a default tab constant, leave it unchanged — your new tab does not need to be the default.

### 3. Create the Settings component

If your tab is a **system-level** feature (e.g. updates, diagnostics), create the component in:

```
src/lib/components/settings/system/SettingsMyFeature.svelte
```

If it is a **general** user preference, create it in:

```
src/lib/components/settings/SettingsMyFeature.svelte
```

Minimal component scaffold:

```svelte
<script lang="ts">
  import { settings, saveSettings } from '@/stores/settings/settingsState';
  import { log } from '@/utils/logger';

  function handleChange() {
    saveSettings($settings).catch((err) => {
      log.error('SettingsMyFeature: save failed', err);
    });
  }
</script>

<section class="settings-section">
  <h3 class="settings-section-title">My Feature</h3>

  <div class="settings-row">
    <label for="my-feature-enabled" class="settings-label">
      Enable My Feature
    </label>
    <input
      id="my-feature-enabled"
      type="checkbox"
      bind:checked={$settings.myFeatureEnabled}
      on:change={handleChange}
    />
  </div>

  <div class="settings-row">
    <label for="my-feature-threshold" class="settings-label">
      Threshold
    </label>
    <input
      id="my-feature-threshold"
      type="range"
      min="0"
      max="100"
      bind:value={$settings.myFeatureThreshold}
      on:change={handleChange}
    />
    <span class="settings-value">{$settings.myFeatureThreshold}</span>
  </div>
</section>
```

Keep the component under 300 lines (Constitution Principle VI). If it grows large, extract sub-sections into child components in the same directory.

### 4. Add the sidebar entry in `SettingsSidebar.svelte`

Open `src/lib/components/settings/SettingsSidebar.svelte`. Find the array of sidebar items and add your entry:

```svelte
<script lang="ts">
  // existing imports ...
  export let activeTab: SettingsTab;
  export let onTabChange: (tab: SettingsTab) => void;

  const tabs = [
    // ... existing tabs ...
    { id: 'my-feature' as SettingsTab, label: 'My Feature', icon: 'settings' },
  ];
</script>

{#each tabs as tab}
  <button
    class="sidebar-item {activeTab === tab.id ? 'active' : ''}"
    on:click={() => onTabChange(tab.id)}
  >
    {tab.label}
  </button>
{/each}
```

Use an icon key that already exists in `src/lib/utils/icons.ts`. Do not add new SVG strings directly in this file.

### 5. Wire the panel in `SettingsModal.svelte`

Open `src/lib/components/settings/SettingsModal.svelte`. Import your component and add a branch in the content area:

```svelte
<script lang="ts">
  import SettingsMyFeature from '@/components/settings/SettingsMyFeature.svelte';
  // or for system features:
  // import SettingsMyFeature from '@/components/settings/system/SettingsMyFeature.svelte';
</script>

{#if activeTab === 'general'}
  <SettingsGeneral />
{:else if activeTab === 'my-feature'}
  <SettingsMyFeature />
{/if}
```

---

## Checklist

- [ ] `BismuthSettings` interface extended with new field(s)
- [ ] `DEFAULT_SETTINGS` updated with matching default value(s)
- [ ] `SettingsTab` union type includes the new tab ID
- [ ] New `Settings*.svelte` component created (under 300 lines)
- [ ] No `console.log` in the component — use `log.info` / `log.error` from `@/utils/logger`
- [ ] Sidebar entry added to `SettingsSidebar.svelte`
- [ ] Panel branch added to `SettingsModal.svelte`
- [ ] Settings persist correctly after save (test by reloading)
