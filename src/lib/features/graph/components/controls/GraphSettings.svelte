<script lang="ts">
  import type { GraphSettings } from '../../types';

  export let settings: GraphSettings;

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
      centerForce: 0.1,
      repelForce: 300,
      linkForce: 0.3,
      linkDistance: 120,
      animate: false,
      damping: 0.85,
      collisionRadius: 20,
    };
  }
</script>

<div class="graph-settings">
  <div class="settings-panel">
    <div class="settings-header">
      <button class="reset-btn" on:click={resetDefaults} title="Reset all settings to defaults"
        >Restore defaults</button
      >
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
        <input type="range" min="50" max="1000" step="25" bind:value={settings.repelForce} />
        <span class="value">{settings.repelForce}</span>
      </label>
      <label>
        <span>Link force</span>
        <input type="range" min="0" max="1" step="0.05" bind:value={settings.linkForce} />
        <span class="value">{settings.linkForce.toFixed(2)}</span>
      </label>
      <label>
        <span>Link distance</span>
        <input type="range" min="30" max="300" step="10" bind:value={settings.linkDistance} />
        <span class="value">{settings.linkDistance}</span>
      </label>
      <label>
        <span>Damping</span>
        <input type="range" min="0.5" max="0.98" step="0.01" bind:value={settings.damping} />
        <span class="value">{settings.damping.toFixed(2)}</span>
      </label>
      <label>
        <span>Collision radius</span>
        <input type="range" min="0" max="60" step="2" bind:value={settings.collisionRadius} />
        <span class="value">{settings.collisionRadius}</span>
      </label>
    </div>
  </div>
</div>

<style>
  .graph-settings {
    display: flex;
    flex-direction: column;
  }

  .settings-panel {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .settings-header {
    display: flex;
    justify-content: flex-end;
    padding: 8px 12px;
    border-bottom: 1px solid var(--graph-border, var(--border-color));
  }

  .reset-btn {
    padding: 4px 8px;
    background: none;
    border: 1px solid var(--graph-border, var(--border-color));
    border-radius: var(--radius-s, 4px);
    cursor: pointer;
    font-size: 0.75rem;
    color: var(--graph-text, var(--text-muted));
    transition: all 0.15s ease;
  }

  .reset-btn:hover {
    background: var(--graph-surface-hover, var(--interactive-hover));
    color: var(--graph-text-active, var(--text-normal));
  }

  .settings-section {
    padding: 10px 12px;
    border-bottom: 1px solid var(--graph-border, var(--border-color));
  }

  .settings-section:last-child {
    border-bottom: none;
  }

  .settings-section h4 {
    margin: 0 0 8px 0;
    font-size: var(--font-ui-small, 0.8125rem);
    font-weight: 600;
    color: var(--graph-text-active, var(--text-normal));
  }

  label {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
    font-size: var(--font-ui-smaller, 0.75rem);
    color: var(--graph-text, var(--text-muted));
    cursor: pointer;
  }

  label span:first-of-type {
    flex: 1;
  }

  input[type='checkbox'] {
    width: 14px;
    height: 14px;
    cursor: pointer;
  }

  input[type='range'] {
    flex: 1;
    max-width: 100px;
    cursor: pointer;
  }

  .value {
    min-width: 36px;
    text-align: right;
    font-variant-numeric: tabular-nums;
    color: var(--graph-text, var(--text-faint));
    font-size: var(--font-ui-smaller, 0.75rem);
  }
</style>
