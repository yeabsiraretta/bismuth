<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import PanelHeader from '@/components/ui/layout/PanelHeader.svelte';
  import type { GraphSettings } from '../../types';

  export let settings: GraphSettings;
  export let onSettingsChange: ((settings: GraphSettings) => void) | undefined = undefined;

  let sections = { filters: true, display: false, forces: false };

  function toggle(section: keyof typeof sections) {
    sections[section] = !sections[section];
  }

  function emit() { onSettingsChange?.(settings); }
</script>

<div class="graph-controls-panel">
  <PanelHeader icon="sliders" title="Graph Controls" />

  <div class="panel-body">
    <!-- Filters -->
    <button class="section-toggle" on:click={() => toggle('filters')}>
      <Icon name={sections.filters ? 'chevron-down' : 'chevron-right'} size={14} />
      <span>Filters</span>
    </button>
    {#if sections.filters}
      <div class="section-content">
        <label><input type="checkbox" bind:checked={settings.showTags} on:change={emit} /> Tags</label>
        <label><input type="checkbox" bind:checked={settings.showAttachments} on:change={emit} /> Attachments</label>
        <label><input type="checkbox" bind:checked={settings.showOrphans} on:change={emit} /> Orphans</label>
        <label><input type="checkbox" bind:checked={settings.showArrows} on:change={emit} /> Arrows</label>
        <label><input type="checkbox" bind:checked={settings.showLabels} on:change={emit} /> Labels</label>
      </div>
    {/if}

    <!-- Display -->
    <button class="section-toggle" on:click={() => toggle('display')}>
      <Icon name={sections.display ? 'chevron-down' : 'chevron-right'} size={14} />
      <span>Display</span>
    </button>
    {#if sections.display}
      <div class="section-content">
        <div class="slider-row">
          <span>Node Size</span>
          <input type="range" min="0.5" max="3" step="0.1" bind:value={settings.nodeSize} on:input={emit} />
        </div>
        <div class="slider-row">
          <span>Link Thickness</span>
          <input type="range" min="0.1" max="3" step="0.1" bind:value={settings.linkThickness} on:input={emit} />
        </div>
        <div class="slider-row">
          <span>Text Fade</span>
          <input type="range" min="0" max="1" step="0.05" bind:value={settings.textFadeThreshold} on:input={emit} />
        </div>
      </div>
    {/if}

    <!-- Forces -->
    <button class="section-toggle" on:click={() => toggle('forces')}>
      <Icon name={sections.forces ? 'chevron-down' : 'chevron-right'} size={14} />
      <span>Forces</span>
    </button>
    {#if sections.forces}
      <div class="section-content">
        <div class="slider-row">
          <span>Center</span>
          <input type="range" min="0" max="1" step="0.05" bind:value={settings.centerForce} on:input={emit} />
          <span class="slider-value">{settings.centerForce.toFixed(2)}</span>
        </div>
        <div class="slider-row">
          <span>Repel</span>
          <input type="range" min="50" max="1000" step="25" bind:value={settings.repelForce} on:input={emit} />
          <span class="slider-value">{settings.repelForce}</span>
        </div>
        <div class="slider-row">
          <span>Link Force</span>
          <input type="range" min="0" max="1" step="0.05" bind:value={settings.linkForce} on:input={emit} />
          <span class="slider-value">{settings.linkForce.toFixed(2)}</span>
        </div>
        <div class="slider-row">
          <span>Distance</span>
          <input type="range" min="30" max="300" step="10" bind:value={settings.linkDistance} on:input={emit} />
          <span class="slider-value">{settings.linkDistance}</span>
        </div>
        <div class="slider-row">
          <span>Damping</span>
          <input type="range" min="0.5" max="0.98" step="0.01" bind:value={settings.damping} on:input={emit} />
          <span class="slider-value">{settings.damping.toFixed(2)}</span>
        </div>
        <div class="slider-row">
          <span>Collision</span>
          <input type="range" min="0" max="60" step="2" bind:value={settings.collisionRadius} on:input={emit} />
          <span class="slider-value">{settings.collisionRadius}</span>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .graph-controls-panel { display: flex; flex-direction: column; height: 100%; }
  .panel-body { flex: 1; overflow-y: auto; padding: var(--spacing-s); }

  .section-toggle {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    width: 100%;
    padding: var(--spacing-xs) var(--spacing-s);
    border: none;
    background: none;
    color: var(--text-normal);
    font-size: var(--font-ui-small);
    font-weight: 600;
    cursor: pointer;
    border-radius: var(--radius-s);
  }
  .section-toggle:hover { background: var(--interactive-hover); }

  .section-content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-m);
    margin-bottom: var(--spacing-s);
  }

  .section-content label {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: var(--font-ui-small);
    color: var(--text-muted);
    cursor: pointer;
  }

  .slider-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-s);
    font-size: var(--font-ui-smaller, 0.75rem);
    color: var(--text-muted);
  }
  .slider-row input[type="range"] { flex: 1; max-width: 100px; }
</style>
