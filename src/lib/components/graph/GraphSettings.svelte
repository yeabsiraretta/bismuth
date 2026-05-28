<script lang="ts">
  import type { GraphSettings } from '$lib/types/graph';
  import Icon from '@/components/icons/Icon.svelte';

  export let settings: GraphSettings;
  export let isOpen = false;

  function toggleSettings() {
    isOpen = !isOpen;
  }

  function resetDefaults() {
    settings = {
      showTags: true,
      showAttachments: true,
      showOrphans: true,
      showArrows: false,
      showLabels: true,
      textFadeThreshold: 0.3,
      nodeSize: 1.0,
      linkThickness: 0.5,
      centerForce: 0.3,
      repelForce: 100,
      linkForce: 0.5,
      linkDistance: 100,
      animate: false,
    };
  }
</script>

<div class="graph-settings">
  <button class="settings-toggle" on:click={toggleSettings} aria-label="Toggle graph settings">
    <Icon name="settings" size={20} ariaLabel="Settings icon" />
  </button>

  {#if isOpen}
    <div class="settings-panel">
      <div class="settings-header">
        <h3>Graph Settings</h3>
        <button class="reset-btn" on:click={resetDefaults}>Restore defaults</button>
      </div>

      <div class="settings-section">
        <h4>Filters</h4>
        <label>
          <input type="checkbox" bind:checked={settings.showTags} />
          <span>Tags</span>
        </label>
        <label>
          <input type="checkbox" bind:checked={settings.showAttachments} />
          <span>Attachments</span>
        </label>
        <label>
          <input type="checkbox" bind:checked={settings.showOrphans} />
          <span>Orphans</span>
        </label>
      </div>

      <div class="settings-section">
        <h4>Display</h4>
        <label>
          <input type="checkbox" bind:checked={settings.showLabels} />
          <span>Labels</span>
        </label>
        <label>
          <input type="checkbox" bind:checked={settings.showArrows} />
          <span>Arrows</span>
        </label>
        <label>
          <span>Text fade threshold</span>
          <input type="range" min="0" max="1" step="0.1" bind:value={settings.textFadeThreshold} />
          <span class="value">{settings.textFadeThreshold.toFixed(1)}</span>
        </label>
        <label>
          <span>Node size</span>
          <input type="range" min="0.5" max="2" step="0.1" bind:value={settings.nodeSize} />
          <span class="value">{settings.nodeSize.toFixed(1)}</span>
        </label>
        <label>
          <span>Link thickness</span>
          <input type="range" min="0.5" max="3" step="0.1" bind:value={settings.linkThickness} />
          <span class="value">{settings.linkThickness.toFixed(1)}</span>
        </label>
      </div>

      <div class="settings-section">
        <h4>Forces</h4>
        <label>
          <span>Center force</span>
          <input type="range" min="0" max="1" step="0.05" bind:value={settings.centerForce} />
          <span class="value">{settings.centerForce.toFixed(2)}</span>
        </label>
        <label>
          <span>Repel force</span>
          <input type="range" min="50" max="200" step="10" bind:value={settings.repelForce} />
          <span class="value">{settings.repelForce}</span>
        </label>
        <label>
          <span>Link force</span>
          <input type="range" min="0" max="1" step="0.05" bind:value={settings.linkForce} />
          <span class="value">{settings.linkForce.toFixed(2)}</span>
        </label>
        <label>
          <span>Link distance</span>
          <input type="range" min="50" max="200" step="10" bind:value={settings.linkDistance} />
          <span class="value">{settings.linkDistance}</span>
        </label>
      </div>
    </div>
  {/if}
</div>

<style>
  .graph-settings {
    position: relative;
  }

  .settings-toggle {
    padding: var(--space-2);
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }

  .settings-toggle:hover {
    background: var(--color-surface);
    border-color: var(--color-primary);
  }

  .settings-panel {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: var(--space-2);
    width: 320px;
    max-height: 600px;
    overflow-y: auto;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 100;
  }

  .settings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-4);
    border-bottom: 1px solid var(--color-border);
  }

  .settings-header h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text);
  }

  .reset-btn {
    padding: var(--space-1) var(--space-3);
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.75rem;
    color: var(--color-text);
  }

  .reset-btn:hover {
    background: var(--color-surface);
    border-color: var(--color-primary);
  }

  .settings-section {
    padding: var(--space-4);
    border-bottom: 1px solid var(--color-border);
  }

  .settings-section:last-child {
    border-bottom: none;
  }

  .settings-section h4 {
    margin: 0 0 var(--space-3) 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text);
  }

  label {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-2);
    font-size: 0.875rem;
    color: var(--color-text);
  }

  label span:first-of-type {
    flex: 1;
  }

  input[type='checkbox'] {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }

  input[type='range'] {
    flex: 1;
    cursor: pointer;
  }

  .value {
    min-width: 40px;
    text-align: right;
    font-variant-numeric: tabular-nums;
    color: var(--color-text-muted);
  }
</style>
