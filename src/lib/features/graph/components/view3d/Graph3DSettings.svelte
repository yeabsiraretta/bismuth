<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import type { Graph3DSettings, NodeShape3D, Graph3DColorGroup } from '../../types/graph3d';

  export let settings: Graph3DSettings;

  const SHAPES: NodeShape3D[] = ['sphere', 'cube', 'diamond', 'cylinder', 'cone', 'octahedron'];

  function addColorGroup() {
    settings = { ...settings, colorGroups: [...settings.colorGroups, { query: '', color: '#7c3aed' }] };
  }
  function removeColorGroup(idx: number) {
    settings = { ...settings, colorGroups: settings.colorGroups.filter((_, i) => i !== idx) };
  }
  function updateColorGroup(idx: number, field: 'query' | 'color', value: string) {
    const groups = [...settings.colorGroups];
    groups[idx] = { ...groups[idx], [field]: value };
    settings = { ...settings, colorGroups: groups };
  }
</script>

<div class="g3s-panel">
  <section class="g3s-section">
    <h4>Filters</h4>
    <label class="g3s-check"><input type="checkbox" bind:checked={settings.showTags} /> Show tags</label>
    <label class="g3s-check"><input type="checkbox" bind:checked={settings.showAttachments} /> Show attachments</label>
    <label class="g3s-check"><input type="checkbox" bind:checked={settings.showOrphans} /> Show orphans</label>
  </section>

  <section class="g3s-section">
    <h4>Notes</h4>
    <label class="g3s-row">Shape <select bind:value={settings.noteAppearance.shape}>
      {#each SHAPES as s}<option value={s}>{s}</option>{/each}
    </select></label>
    <label class="g3s-row">Size <input type="range" min="0.3" max="3" step="0.1" bind:value={settings.noteAppearance.size} /><span>{settings.noteAppearance.size}</span></label>
    <label class="g3s-row">Color <input type="color" bind:value={settings.noteAppearance.color} /></label>
  </section>

  <section class="g3s-section">
    <h4>Attachments</h4>
    <label class="g3s-row">Shape <select bind:value={settings.attachmentAppearance.shape}>
      {#each SHAPES as s}<option value={s}>{s}</option>{/each}
    </select></label>
    <label class="g3s-row">Size <input type="range" min="0.3" max="3" step="0.1" bind:value={settings.attachmentAppearance.size} /><span>{settings.attachmentAppearance.size}</span></label>
    <label class="g3s-row">Color <input type="color" bind:value={settings.attachmentAppearance.color} /></label>
  </section>

  <section class="g3s-section">
    <h4>Tags</h4>
    <label class="g3s-row">Shape <select bind:value={settings.tagAppearance.shape}>
      {#each SHAPES as s}<option value={s}>{s}</option>{/each}
    </select></label>
    <label class="g3s-row">Size <input type="range" min="0.3" max="3" step="0.1" bind:value={settings.tagAppearance.size} /><span>{settings.tagAppearance.size}</span></label>
    <label class="g3s-row">Color <input type="color" bind:value={settings.tagAppearance.color} /></label>
  </section>

  <section class="g3s-section">
    <h4>Links</h4>
    <label class="g3s-row">Thickness <input type="range" min="0.1" max="3" step="0.1" bind:value={settings.linkThickness} /><span>{settings.linkThickness}</span></label>
    <label class="g3s-row">Opacity <input type="range" min="0.05" max="1" step="0.05" bind:value={settings.linkOpacity} /><span>{settings.linkOpacity}</span></label>
    <label class="g3s-check"><input type="checkbox" bind:checked={settings.showArrows} /> Show arrows</label>
  </section>

  <section class="g3s-section">
    <h4>Labels</h4>
    <label class="g3s-check"><input type="checkbox" bind:checked={settings.showLabels} /> Show labels</label>
    <label class="g3s-row">Scale <input type="range" min="0.5" max="2" step="0.1" bind:value={settings.labelScale} /><span>{settings.labelScale}</span></label>
  </section>

  <section class="g3s-section">
    <h4>Forces</h4>
    <label class="g3s-row">Center <input type="range" min="0" max="0.5" step="0.01" bind:value={settings.centerForce} /><span>{settings.centerForce}</span></label>
    <label class="g3s-row">Repel <input type="range" min="10" max="800" step="10" bind:value={settings.repelForce} /><span>{settings.repelForce}</span></label>
    <label class="g3s-row">Link <input type="range" min="0.01" max="1" step="0.01" bind:value={settings.linkForce} /><span>{settings.linkForce}</span></label>
    <label class="g3s-row">Distance <input type="range" min="20" max="400" step="5" bind:value={settings.linkDistance} /><span>{settings.linkDistance}</span></label>
    <label class="g3s-row">Damping <input type="range" min="0.5" max="0.98" step="0.01" bind:value={settings.damping} /><span>{settings.damping}</span></label>
  </section>

  <section class="g3s-section">
    <div class="g3s-section-header">
      <h4>Color Groups</h4>
      <button class="g3s-add-btn" on:click={addColorGroup} title="Add color group"><Icon name="plus" size={12} /></button>
    </div>
    <p class="g3s-hint">Use path:, tag:, file: prefixes</p>
    {#each settings.colorGroups as group, i (i)}
      <div class="g3s-group-row">
        <input type="text" class="g3s-group-query" value={group.query} on:input={(e) => updateColorGroup(i, 'query', e.currentTarget.value)} placeholder="path:folder" />
        <input type="color" class="g3s-group-color" value={group.color} on:input={(e) => updateColorGroup(i, 'color', e.currentTarget.value)} />
        <button class="g3s-group-rm" on:click={() => removeColorGroup(i)} title="Remove"><Icon name="x" size={11} /></button>
      </div>
    {/each}
  </section>
</div>

<style>
  .g3s-panel { padding: 8px; overflow-y: auto; max-height: 100%; }
  .g3s-section { margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid var(--background-modifier-border, #333); }
  .g3s-section h4 { margin: 0 0 6px; font-size: 11px; text-transform: uppercase; opacity: 0.6; letter-spacing: 0.5px; }
  .g3s-section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
  .g3s-section-header h4 { margin: 0; }
  .g3s-check { display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer; margin-bottom: 4px; }
  .g3s-row { display: flex; align-items: center; gap: 6px; font-size: 11px; margin-bottom: 4px; }
  .g3s-row input[type="range"] { flex: 1; height: 4px; }
  .g3s-row span { min-width: 28px; text-align: right; font-size: 10px; opacity: 0.6; }
  .g3s-row select { padding: 2px 4px; border: 1px solid var(--background-modifier-border, #444); border-radius: 3px; background: var(--background-primary); color: var(--text-normal); font-size: 11px; }
  .g3s-row input[type="color"] { width: 24px; height: 20px; border: none; padding: 0; cursor: pointer; }
  .g3s-hint { margin: 0 0 6px; font-size: 10px; opacity: 0.4; }
  .g3s-add-btn { border: none; background: none; color: var(--text-muted); cursor: pointer; padding: 2px; }
  .g3s-group-row { display: flex; align-items: center; gap: 4px; margin-bottom: 4px; }
  .g3s-group-query { flex: 1; padding: 3px 6px; border: 1px solid var(--background-modifier-border, #444); border-radius: 3px; background: var(--background-primary); color: var(--text-normal); font-size: 11px; }
  .g3s-group-color { width: 24px; height: 20px; border: none; padding: 0; cursor: pointer; }
  .g3s-group-rm { border: none; background: none; color: var(--text-muted); cursor: pointer; padding: 2px; }
</style>
