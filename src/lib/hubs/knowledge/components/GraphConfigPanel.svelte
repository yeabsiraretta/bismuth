<script lang="ts">
  import type { GraphSettings } from '@/hubs/core/types/settings';
  import { getGraph, updateSection } from '@/hubs/core/stores/settings-store.svelte';
  import Panel from '@/ui/panel.svelte';

  let graphSettings = $derived(getGraph());

  function patch(delta: Partial<GraphSettings>) {
    updateSection('graph', delta);
  }
</script>

<Panel title="Graph Config">
  <div class="gc-form">
    <div class="gc-row gc-mode-row">
      <span class="gc-lbl">View Mode</span>
      <div class="gc-mode-toggle">
        <button
          class="gc-mode-btn"
          class:active={graphSettings.viewMode === '2d'}
          type="button"
          onclick={() => patch({ viewMode: '2d' })}>2D</button
        >
        <button
          class="gc-mode-btn"
          class:active={graphSettings.viewMode === '3d'}
          type="button"
          onclick={() => patch({ viewMode: '3d' })}>3D</button
        >
      </div>
    </div>

    <label class="gc-row">
      <span class="gc-lbl">Node Size</span>
      <input
        type="range"
        min="2"
        max="15"
        step="1"
        class="gc-range"
        value={graphSettings.nodeRadius}
        oninput={(e) => patch({ nodeRadius: +e.currentTarget.value })}
      />
      <span class="gc-val">{graphSettings.nodeRadius}</span>
    </label>

    <label class="gc-row">
      <span class="gc-lbl">Link Distance</span>
      <input
        type="range"
        min="20"
        max="200"
        step="5"
        class="gc-range"
        value={graphSettings.linkDistance}
        oninput={(e) => patch({ linkDistance: +e.currentTarget.value })}
      />
      <span class="gc-val">{graphSettings.linkDistance}</span>
    </label>

    <label class="gc-row">
      <span class="gc-lbl">Repulsion</span>
      <input
        type="range"
        min="100"
        max="2000"
        step="50"
        class="gc-range"
        value={graphSettings.repulsionForce}
        oninput={(e) => patch({ repulsionForce: +e.currentTarget.value })}
      />
      <span class="gc-val">{graphSettings.repulsionForce}</span>
    </label>

    <label class="gc-row">
      <span class="gc-lbl">Gravity</span>
      <input
        type="range"
        min="0.001"
        max="0.05"
        step="0.001"
        class="gc-range"
        value={graphSettings.centerGravity}
        oninput={(e) => patch({ centerGravity: +e.currentTarget.value })}
      />
      <span class="gc-val">{graphSettings.centerGravity}</span>
    </label>

    <label class="gc-row">
      <span class="gc-lbl">Damping</span>
      <input
        type="range"
        min="0.8"
        max="0.99"
        step="0.01"
        class="gc-range"
        value={graphSettings.damping}
        oninput={(e) => patch({ damping: +e.currentTarget.value })}
      />
      <span class="gc-val">{graphSettings.damping}</span>
    </label>

    <label class="gc-row">
      <span class="gc-lbl">Edge Opacity</span>
      <input
        type="range"
        min="0.05"
        max="1"
        step="0.05"
        class="gc-range"
        value={graphSettings.edgeOpacity}
        oninput={(e) => patch({ edgeOpacity: +e.currentTarget.value })}
      />
      <span class="gc-val">{graphSettings.edgeOpacity}</span>
    </label>

    <label class="gc-row gc-check">
      <span class="gc-lbl">Show Labels</span>
      <input
        type="checkbox"
        checked={graphSettings.showLabels}
        onchange={(e) => patch({ showLabels: e.currentTarget.checked })}
      />
    </label>

    <label class="gc-row">
      <span class="gc-lbl">Label Threshold</span>
      <input
        type="range"
        min="5"
        max="100"
        step="5"
        class="gc-range"
        value={graphSettings.labelThreshold}
        oninput={(e) => patch({ labelThreshold: +e.currentTarget.value })}
      />
      <span class="gc-val">{graphSettings.labelThreshold}</span>
    </label>

    <div class="gc-section">Colors</div>

    <label class="gc-row">
      <span class="gc-lbl">Node Color</span>
      <input
        type="color"
        class="gc-color"
        value={graphSettings.nodeColor || '#888888'}
        oninput={(e) => patch({ nodeColor: e.currentTarget.value })}
      />
      {#if graphSettings.nodeColor}
        <button class="gc-clear" type="button" onclick={() => patch({ nodeColor: '' })}>×</button>
      {/if}
    </label>

    <label class="gc-row">
      <span class="gc-lbl">Edge Color</span>
      <input
        type="color"
        class="gc-color"
        value={graphSettings.edgeColor || '#555555'}
        oninput={(e) => patch({ edgeColor: e.currentTarget.value })}
      />
      {#if graphSettings.edgeColor}
        <button class="gc-clear" type="button" onclick={() => patch({ edgeColor: '' })}>×</button>
      {/if}
    </label>

    <div class="gc-actions">
      <button
        class="gc-reset"
        type="button"
        onclick={() => {
          updateSection('graph', {
            viewMode: '2d',
            nodeRadius: 5,
            linkDistance: 80,
            repulsionForce: 500,
            centerGravity: 0.01,
            damping: 0.85,
            showLabels: false,
            labelThreshold: 20,
            nodeColor: '',
            edgeColor: '',
            edgeOpacity: 0.3,
          });
        }}>Reset Defaults</button
      >
    </div>
  </div>
</Panel>

<style>
  .gc-form {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .gc-row {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.7rem;
    color: var(--color-text-muted);
  }
  .gc-lbl {
    min-width: 80px;
    flex-shrink: 0;
  }
  .gc-range {
    flex: 1;
    min-width: 0;
    accent-color: var(--color-accent);
  }
  .gc-val {
    font-size: 0.6rem;
    color: var(--color-text-subtle);
    min-width: 28px;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  .gc-check {
    gap: 8px;
  }
  .gc-mode-row {
    padding-bottom: 6px;
    margin-bottom: 2px;
    border-bottom: 1px solid var(--color-border);
  }
  .gc-mode-toggle {
    display: flex;
    gap: 2px;
    background: var(--color-surface);
    border-radius: var(--radius-s);
    padding: 2px;
    margin-left: auto;
  }
  .gc-mode-btn {
    padding: 2px 10px;
    font-size: 0.65rem;
    font-weight: 500;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all var(--transition-base);
    font-family: inherit;
  }
  .gc-mode-btn:hover {
    color: var(--color-text);
  }
  .gc-mode-btn.active {
    background: var(--color-accent);
    color: var(--color-background);
  }
  .gc-section {
    font-size: 0.6rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-subtle);
    margin-top: 6px;
    padding-top: 6px;
    border-top: 1px solid var(--color-border);
  }
  .gc-color {
    width: 24px;
    height: 20px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    padding: 0;
    cursor: pointer;
    background: transparent;
  }
  .gc-clear {
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    font-size: 0.8rem;
    padding: 0 4px;
  }
  .gc-clear:hover {
    color: var(--color-error);
  }
  .gc-actions {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid var(--color-border);
  }
  .gc-reset {
    width: 100%;
    padding: 4px 8px;
    font-size: 0.65rem;
    font-weight: 500;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-surface);
    color: var(--color-text-muted);
    cursor: pointer;
    font-family: inherit;
  }
  .gc-reset:hover {
    color: var(--color-text);
    border-color: var(--color-accent);
  }
</style>
