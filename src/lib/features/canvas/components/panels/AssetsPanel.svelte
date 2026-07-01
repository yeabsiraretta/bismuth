<script lang="ts">
  import { addElement } from '@/features/canvas/stores';
  import { currentCanvas } from '@/features/canvas/stores';
  import { createFrame, createRectangle } from '@/features/canvas/utils';
  import { DEVICE_PRESETS, type DeviceType } from '@/features/canvas/types';
  import { get } from 'svelte/store';

  let search = '';
  type AssetCategory = 'devices' | 'shapes' | 'icons';
  let activeCategory: AssetCategory = 'devices';

  interface AssetItem {
    id: string;
    label: string;
    category: AssetCategory;
    meta?: Record<string, unknown>;
  }

  const DEVICE_ASSETS: AssetItem[] = Object.entries(DEVICE_PRESETS).map(([key, val]) => ({
    id: `device-${key}`,
    label: val.label,
    category: 'devices',
    meta: { deviceType: key, width: val.width, height: val.height },
  }));

  const SHAPE_ASSETS: AssetItem[] = [
    { id: 'shape-card', label: 'Card', category: 'shapes', meta: { w: 320, h: 200, radius: 12 } },
    { id: 'shape-button', label: 'Button', category: 'shapes', meta: { w: 120, h: 40, radius: 8 } },
    { id: 'shape-avatar', label: 'Avatar', category: 'shapes', meta: { w: 48, h: 48, radius: 24 } },
    {
      id: 'shape-sidebar',
      label: 'Sidebar',
      category: 'shapes',
      meta: { w: 260, h: 720, radius: 0 },
    },
    { id: 'shape-modal', label: 'Modal', category: 'shapes', meta: { w: 480, h: 360, radius: 16 } },
    {
      id: 'shape-input',
      label: 'Input Field',
      category: 'shapes',
      meta: { w: 240, h: 36, radius: 6 },
    },
    {
      id: 'shape-navbar',
      label: 'Navbar',
      category: 'shapes',
      meta: { w: 1280, h: 64, radius: 0 },
    },
    {
      id: 'shape-chip',
      label: 'Chip / Tag',
      category: 'shapes',
      meta: { w: 80, h: 28, radius: 14 },
    },
  ];

  const ICON_ASSETS: AssetItem[] = [
    { id: 'icon-search', label: 'Search', category: 'icons' },
    { id: 'icon-menu', label: 'Menu', category: 'icons' },
    { id: 'icon-close', label: 'Close', category: 'icons' },
    { id: 'icon-add', label: 'Add', category: 'icons' },
    { id: 'icon-edit', label: 'Edit', category: 'icons' },
    { id: 'icon-settings', label: 'Settings', category: 'icons' },
    { id: 'icon-user', label: 'User', category: 'icons' },
    { id: 'icon-home', label: 'Home', category: 'icons' },
  ];

  $: allAssets = [...DEVICE_ASSETS, ...SHAPE_ASSETS, ...ICON_ASSETS];
  $: filtered = allAssets
    .filter((a) => a.category === activeCategory)
    .filter((a) => !search || a.label.toLowerCase().includes(search.toLowerCase()));

  function getActiveLayerId(): string {
    const canvas = get(currentCanvas);
    return canvas?.layers[0]?.id ?? 'default';
  }

  function insertAsset(asset: AssetItem) {
    const cx = 100 + Math.random() * 200;
    const cy = 100 + Math.random() * 200;
    const layerId = getActiveLayerId();

    if (asset.category === 'devices') {
      const m = asset.meta!;
      const el = createFrame(cx, cy, m.width as number, m.height as number, layerId);
      el.properties.deviceType = m.deviceType as DeviceType;
      el.name = asset.label;
      addElement(el);
    } else if (asset.category === 'shapes') {
      const m = asset.meta!;
      const el = createRectangle(cx, cy, m.w as number, m.h as number, layerId);
      if (m.radius)
        el.properties.borderRadius = {
          topLeft: m.radius as number,
          topRight: m.radius as number,
          bottomRight: m.radius as number,
          bottomLeft: m.radius as number,
        };
      el.name = asset.label;
      addElement(el);
    } else {
      const el = createRectangle(cx, cy, 24, 24, layerId);
      el.properties.fill = 'transparent';
      el.properties.stroke = '#666666';
      el.name = asset.label;
      addElement(el);
    }
  }
</script>

<section class="assets">
  <header class="assets__head">
    <span>Assets</span>
  </header>

  <nav class="assets__tabs">
    {#each [['devices', 'Devices'], ['shapes', 'Shapes'], ['icons', 'Icons']] as [key, label]}
      <button
        class="assets__tab"
        class:assets__tab--on={activeCategory === key}
        on:click={() => (activeCategory = key as AssetCategory)}>{label}</button
      >
    {/each}
  </nav>

  <div class="assets__search">
    <input type="text" placeholder="Search assets..." bind:value={search} />
  </div>

  <div class="assets__grid">
    {#each filtered as asset (asset.id)}
      <button class="assets__item" on:click={() => insertAsset(asset)} title="Insert {asset.label}">
        <span class="assets__preview">
          {#if asset.category === 'devices'}&#9634;{:else if asset.category === 'icons'}&#9673;{:else}&#9645;{/if}
        </span>
        <span class="assets__label">{asset.label}</span>
        {#if asset.meta?.width}
          <span class="assets__size">{asset.meta.width}&times;{asset.meta.height}</span>
        {/if}
      </button>
    {/each}
    {#if filtered.length === 0}
      <p class="assets__empty">No matches</p>
    {/if}
  </div>
</section>

<style>
  .assets {
    display: flex;
    flex-direction: column;
    border-top: 1px solid var(--border-color);
  }
  .assets__head {
    padding: 6px 10px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-muted);
    background: var(--background-secondary);
    border-bottom: 1px solid var(--border-color);
  }
  .assets__tabs {
    display: flex;
    border-bottom: 1px solid var(--border-color);
  }
  .assets__tab {
    flex: 1;
    padding: 5px;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    font-size: 10px;
    color: var(--text-muted);
    cursor: pointer;
  }
  .assets__tab--on {
    color: var(--interactive-accent);
    border-bottom-color: var(--interactive-accent);
  }
  .assets__search {
    padding: 4px 8px;
    border-bottom: 1px solid var(--border-color);
  }
  .assets__search input {
    width: 100%;
    padding: 3px 6px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-size: 11px;
    background: var(--background-modifier-form-field);
    color: var(--text-normal);
  }
  .assets__search input:focus {
    outline: none;
    border-color: var(--interactive-accent);
  }
  .assets__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
    padding: 6px;
    overflow-y: auto;
    max-height: 240px;
  }
  .assets__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 8px 4px;
    background: var(--background-primary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.1s;
  }
  .assets__item:hover {
    border-color: var(--interactive-accent);
    background: var(--background-modifier-hover);
  }
  .assets__preview {
    font-size: 18px;
    color: var(--text-muted);
  }
  .assets__label {
    font-size: 10px;
    color: var(--text-normal);
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
  }
  .assets__size {
    font-size: 9px;
    color: var(--text-faint);
  }
  .assets__empty {
    grid-column: 1/-1;
    text-align: center;
    font-size: 11px;
    color: var(--text-faint);
    padding: 12px;
  }
</style>
