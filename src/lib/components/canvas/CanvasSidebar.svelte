<script lang="ts">
  import PropertyPanel from './PropertyPanel.svelte';
  import LayerPanel from './LayerPanel.svelte';
  import PagesPanel from './PagesPanel.svelte';
  import ComponentsPanel from './ComponentsPanel.svelte';
</script>

<div class="canvas-sidebar">
  <PagesPanel />
  <ComponentsPanel />
  <PropertyPanel />
  <LayerPanel />
</div>

<style>
  .canvas-sidebar {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
  }
</style>
