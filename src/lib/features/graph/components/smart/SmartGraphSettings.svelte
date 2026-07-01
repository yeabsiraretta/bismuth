<script lang="ts">
  import type { SmartGraphSettings, ConnectionMode } from '../../types';
  import { DEFAULT_SMART_SETTINGS } from '../../services/smartConnections';

  export let settings: SmartGraphSettings;

  function resetDefaults() {
    settings = { ...DEFAULT_SMART_SETTINGS };
  }

  function setMode(mode: ConnectionMode) {
    settings = { ...settings, connectionMode: mode };
  }
</script>

<div class="sg-settings">
  <div class="sg-header">
    <button class="sg-reset" on:click={resetDefaults}>Restore defaults</button>
  </div>

  <div class="sg-section">
    <h4>Connection</h4>
    <label>
      <span>Min relevance</span>
      <input type="range" min="0" max="0.9" step="0.05" bind:value={settings.minRelevance} />
      <span class="sg-val">{(settings.minRelevance * 100).toFixed(0)}%</span>
    </label>
    <label>
      <span>Connection type</span>
      <div class="sg-toggle">
        <button class:active={settings.connectionMode === 'note'} on:click={() => setMode('note')}>Note</button>
        <button class:active={settings.connectionMode === 'block'} on:click={() => setMode('block')}>Block</button>
      </div>
    </label>
  </div>

  <div class="sg-section">
    <h4>Display</h4>
    <label>
      <span>Node label size</span>
      <input type="range" min="8" max="18" step="1" bind:value={settings.nodeLabelSize} />
      <span class="sg-val">{settings.nodeLabelSize}px</span>
    </label>
    <label>
      <span>Max label chars</span>
      <input type="range" min="10" max="60" step="5" bind:value={settings.maxLabelChars} />
      <span class="sg-val">{settings.maxLabelChars}</span>
    </label>
    <label>
      <span>Center node scale</span>
      <input type="range" min="1" max="4" step="0.25" bind:value={settings.centerNodeScale} />
      <span class="sg-val">{settings.centerNodeScale.toFixed(1)}x</span>
    </label>
    <label>
      <input type="checkbox" bind:checked={settings.showPreviewOnHover} />
      <span>Preview on hover (Cmd/Ctrl)</span>
    </label>
  </div>

  <div class="sg-section">
    <h4>Links</h4>
    <label>
      <span>Min link thickness</span>
      <input type="range" min="0.5" max="4" step="0.5" bind:value={settings.minLinkThickness} />
      <span class="sg-val">{settings.minLinkThickness.toFixed(1)}</span>
    </label>
    <label>
      <span>Max link thickness</span>
      <input type="range" min="2" max="12" step="0.5" bind:value={settings.maxLinkThickness} />
      <span class="sg-val">{settings.maxLinkThickness.toFixed(1)}</span>
    </label>
    <label>
      <input type="checkbox" bind:checked={settings.showLinkLabels} />
      <span>Show relevance scores</span>
    </label>
    <label>
      <span>Link label size</span>
      <input type="range" min="7" max="14" step="1" bind:value={settings.linkLabelSize} />
      <span class="sg-val">{settings.linkLabelSize}px</span>
    </label>
  </div>
</div>

<style>
  .sg-settings { display: flex; flex-direction: column; }
  .sg-header { display: flex; justify-content: flex-end; padding: 8px 12px; border-bottom: 1px solid var(--graph-border, var(--border-color)); }
  .sg-reset { padding: 4px 8px; background: none; border: 1px solid var(--graph-border, var(--border-color)); border-radius: var(--radius-s, 4px); cursor: pointer; font-size: 0.75rem; color: var(--graph-text, var(--text-muted)); }
  .sg-reset:hover { background: var(--graph-surface-hover, var(--interactive-hover)); color: var(--graph-text-active, var(--text-normal)); }
  .sg-section { padding: 10px 12px; border-bottom: 1px solid var(--graph-border, var(--border-color)); }
  .sg-section:last-child { border-bottom: none; }
  .sg-section h4 { margin: 0 0 8px; font-size: 0.8125rem; font-weight: 600; color: var(--graph-text-active, var(--text-normal)); }
  label { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; font-size: 0.75rem; color: var(--graph-text, var(--text-muted)); cursor: pointer; }
  label span:first-of-type { flex: 1; }
  input[type='range'] { flex: 1; max-width: 100px; cursor: pointer; }
  input[type='checkbox'] { width: 14px; height: 14px; cursor: pointer; }
  .sg-val { min-width: 36px; text-align: right; font-variant-numeric: tabular-nums; color: var(--graph-text, var(--text-faint)); font-size: 0.75rem; }
  .sg-toggle { display: flex; gap: 2px; }
  .sg-toggle button { padding: 3px 8px; font-size: 0.7rem; border: 1px solid var(--graph-border, var(--border-color)); border-radius: var(--radius-s, 4px); background: none; color: var(--graph-text, var(--text-muted)); cursor: pointer; }
  .sg-toggle button.active { background: var(--interactive-accent); color: #fff; border-color: var(--interactive-accent); }
</style>
