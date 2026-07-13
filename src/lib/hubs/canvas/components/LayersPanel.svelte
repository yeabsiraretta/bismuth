<script lang="ts">
  import { untrack } from 'svelte';
  import BIcon from '@/ui/b-icon.svelte';
  import { CANVAS_LAYERS_KEY } from '@/constants/storage-keys';
  import Panel from '@/ui/panel.svelte';
  import {
    getElements,
    getElementsByLayer,
    getActiveLayerId,
    setActiveLayerId,
    updateElement,
  } from '@/hubs/canvas/stores/canvas-store.svelte';
  import type { CanvasElement } from '@/hubs/canvas/types/canvas-types';

  interface CanvasLayer {
    id: string;
    name: string;
    visible: boolean;
    locked: boolean;
  }

  const DEFAULT_LAYER: CanvasLayer = {
    id: 'default',
    name: 'Default',
    visible: true,
    locked: false,
  };

  function loadLayers(): CanvasLayer[] {
    try {
      const raw = localStorage.getItem(CANVAS_LAYERS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CanvasLayer[];
        if (!parsed.some((l) => l.id === 'default')) {
          parsed.unshift({ ...DEFAULT_LAYER });
        }
        return parsed;
      }
    } catch {
      /* noop */
    }
    return [{ ...DEFAULT_LAYER }];
  }

  function saveLayers() {
    localStorage.setItem(CANVAS_LAYERS_KEY, JSON.stringify(layers));
  }

  let layers = $state<CanvasLayer[]>(loadLayers());
  let activeId = $derived(getActiveLayerId());

  function layerCount(layerId: string): number {
    return getElementsByLayer(layerId).length;
  }

  $effect(() => {
    const els = getElements();
    const current = untrack(() => layers);
    void els;
    layers = [...current];
  });

  function toggleVisibility(id: string) {
    layers = layers.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l));
    saveLayers();
    const layer = layers.find((l) => l.id === id);
    if (layer) {
      getElementsByLayer(id).forEach((el) => {
        updateElement(el.id, { locked: !layer.visible || layer.locked } as Partial<CanvasElement>);
      });
    }
  }

  function toggleLock(id: string) {
    layers = layers.map((l) => (l.id === id ? { ...l, locked: !l.locked } : l));
    saveLayers();
    const layer = layers.find((l) => l.id === id);
    if (layer) {
      getElementsByLayer(id).forEach((el) => {
        updateElement(el.id, { locked: layer.locked } as Partial<CanvasElement>);
      });
    }
  }

  function selectLayer(id: string) {
    setActiveLayerId(id);
  }

  function addLayer() {
    const name = `Layer ${layers.length + 1}`;
    layers = [...layers, { id: crypto.randomUUID(), name, visible: true, locked: false }];
    saveLayers();
  }

  function getLayerVisibility(): Map<string, boolean> {
    return new Map(layers.map((l) => [l.id, l.visible]));
  }
  void getLayerVisibility;
</script>

<Panel title="Layers">
  {#snippet actions()}
    <button class="panel-action" onclick={addLayer} title="Add layer">
      <BIcon name="plus" size={14} />
    </button>
  {/snippet}

  <ul class="layer-list">
    {#each layers as layer (layer.id)}
      <li
        class="layer-item"
        class:hidden-layer={!layer.visible}
        class:active-layer={layer.id === activeId}
      >
        <button
          class="vis-btn"
          onclick={() => toggleVisibility(layer.id)}
          title={layer.visible ? 'Hide' : 'Show'}
        >
          <BIcon name={layer.visible ? 'eye' : 'eyeOff'} size={14} class="layer-icon" />
        </button>
        <button class="layer-name-btn" onclick={() => selectLayer(layer.id)}>
          <span class="layer-name">{layer.name}</span>
        </button>
        <span class="layer-count">{layerCount(layer.id)}</span>
        <button
          class="lock-btn"
          onclick={() => toggleLock(layer.id)}
          title={layer.locked ? 'Unlock' : 'Lock'}
        >
          <BIcon name={layer.locked ? 'lock' : 'lockOpen'} size={14} class="layer-icon" />
        </button>
      </li>
    {/each}
  </ul>
</Panel>

<style>
  .layer-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .layer-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 8px;
    border-bottom: 1px solid var(--color-border);
    font-size: 0.75rem;
  }
  .layer-item:hover {
    background: var(--color-surface-hover);
  }
  .layer-item.hidden-layer {
    opacity: 0.5;
  }
  .vis-btn,
  .lock-btn {
    border: none;
    background: transparent;
    cursor: pointer;
    padding: 2px;
    line-height: 1;
    color: var(--color-text-muted);
  }
  .vis-btn :global(.layer-icon),
  .lock-btn :global(.layer-icon) {
    width: 14px;
    height: 14px;
  }
  .layer-name-btn {
    border: none;
    background: none;
    cursor: pointer;
    flex: 1;
    text-align: left;
    padding: 0;
  }
  .layer-name {
    flex: 1;
    color: var(--color-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .layer-count {
    font-size: 0.6rem;
    color: var(--color-text-muted);
  }
  .active-layer {
    background: var(--color-surface-hover);
    border-left: 2px solid var(--color-accent);
  }
  .panel-action :global(svg) {
    width: 14px;
    height: 14px;
  }
</style>
