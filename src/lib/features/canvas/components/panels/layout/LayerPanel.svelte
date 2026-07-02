<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import PanelHeader from '@/components/ui/layout/PanelHeader.svelte';
  import ActionButton from '@/components/ui/actions/ActionButton.svelte';
  import { currentCanvas } from '@/features/canvas/stores';
  import { generateId } from '@/utils/id';
  import type { Layer } from '@/features/canvas/types';

  function toggleLayerVisibility(layerId: string) {
    currentCanvas.update((canvas) => {
      if (!canvas) return canvas;
      const layer = canvas.layers.find((l) => l.id === layerId);
      if (layer) {
        layer.visible = !layer.visible;
      }
      return canvas;
    });
  }

  function toggleLayerLock(layerId: string) {
    currentCanvas.update((canvas) => {
      if (!canvas) return canvas;
      const layer = canvas.layers.find((l) => l.id === layerId);
      if (layer) {
        layer.locked = !layer.locked;
      }
      return canvas;
    });
  }

  function addLayer() {
    currentCanvas.update((canvas) => {
      if (!canvas) return canvas;
      const newLayer: Layer = {
        id: generateId(),
        name: `Layer ${canvas.layers.length + 1}`,
        z_order: canvas.layers.length,
        visible: true,
        locked: false,
      };
      canvas.layers.push(newLayer);
      return canvas;
    });
  }

  function getElementCount(layerId: string): number {
    if (!$currentCanvas) return 0;
    return $currentCanvas.elements.filter((e) => e.layer_id === layerId).length;
  }
</script>

<div class="layer-panel">
  <PanelHeader icon="layers" title="Layers" count={$currentCanvas?.layers.length || undefined}>
    <svelte:fragment slot="actions">
      <ActionButton icon="plus" title="Add Layer" on:click={addLayer} />
    </svelte:fragment>
  </PanelHeader>

  {#if !$currentCanvas || $currentCanvas.layers.length === 0}
    <div class="empty-state">
      <Icon name="layers" size={32} color="var(--text-muted)" />
      <p>No layers</p>
      <span class="hint">Create a canvas to start adding layers</span>
    </div>
  {:else}
    <div class="layer-list">
      {#each [...$currentCanvas.layers].reverse() as layer (layer.id)}
        <div class="layer-item">
          <button
            class="layer-visibility"
            on:click={() => toggleLayerVisibility(layer.id)}
            title={layer.visible ? 'Hide layer' : 'Show layer'}
            aria-label={layer.visible ? 'Hide layer' : 'Show layer'}
          >
            <Icon
              name={layer.visible ? 'eye' : 'eye'}
              size={14}
              color={layer.visible ? 'var(--text-normal)' : 'var(--text-faint)'}
            />
          </button>
          <span class="layer-name" class:muted={!layer.visible}>{layer.name}</span>
          <span class="layer-count">{getElementCount(layer.id)}</span>
          <button
            class="layer-lock"
            on:click={() => toggleLayerLock(layer.id)}
            title={layer.locked ? 'Unlock layer' : 'Lock layer'}
            aria-label={layer.locked ? 'Unlock layer' : 'Lock layer'}
          >
            <Icon name={layer.locked ? 'check-square' : 'square'} size={14} />
          </button>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .layer-panel {
    display: flex;
    flex-direction: column;
    background: var(--background-secondary);
    border-top: 1px solid var(--border-color);
    max-height: 200px;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-s);
    padding: var(--spacing-l);
    color: var(--text-muted);
    text-align: center;
  }

  .empty-state p {
    margin: 0;
    font-size: var(--font-smaller);
    font-weight: var(--font-medium);
  }

  .hint {
    font-size: var(--font-smallest);
    color: var(--text-faint);
  }

  .layer-list {
    flex: 1;
    overflow-y: auto;
  }

  .layer-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
    padding: var(--spacing-xs) var(--spacing-m);
    border-bottom: 1px solid var(--border-color);
    transition: background var(--transition-fast);
  }

  .layer-item:hover {
    background: var(--background-modifier-hover);
  }

  .layer-visibility,
  .layer-lock {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2px;
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    border-radius: var(--radius-xs);
    transition: color var(--transition-fast);
  }

  .layer-visibility:hover,
  .layer-lock:hover {
    color: var(--text-normal);
    background: var(--background-modifier-hover);
  }

  .layer-name {
    flex: 1;
    font-size: var(--font-smallest);
    color: var(--text-normal);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .layer-name.muted {
    color: var(--text-faint);
  }

  .layer-count {
    font-size: var(--font-smallest);
    color: var(--text-faint);
    font-family: var(--font-monospace);
  }
</style>
