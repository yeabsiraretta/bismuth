<script lang="ts">
  import SettingRow from '@/ui/settings-controls.svelte';
  import type { CanvasSettings } from '@/hubs/core/types/settings';

  let {
    canvas = $bindable(),
  }: {
    canvas: CanvasSettings;
  } = $props();
</script>

<div class="space-y-6">
  <section>
    <h3 class="text-s font-semibold text-text mb-3">Grid</h3>

    <SettingRow label="Show grid" hint="Display grid lines on the canvas" id="canvas-grid">
      <input id="canvas-grid" type="checkbox" bind:checked={canvas.gridEnabled} />
    </SettingRow>

    {#if canvas.gridEnabled}
      <SettingRow
        label="Grid size"
        hint="Spacing between grid lines in pixels"
        id="canvas-grid-size"
      >
        <div class="flex">
          <input
            id="canvas-grid-size"
            type="range"
            bind:value={canvas.gridSize}
            min="10"
            max="100"
            step="5"
          />
          <span>{canvas.gridSize}px</span>
        </div>
      </SettingRow>
    {/if}

    <SettingRow label="Snap to grid" hint="Snap elements to grid when moving" id="canvas-snap">
      <input id="canvas-snap" type="checkbox" bind:checked={canvas.snapToGrid} />
    </SettingRow>
  </section>

  <section>
    <h3 class="text-s font-semibold text-text mb-3">View</h3>

    <SettingRow label="Default zoom" hint="Initial zoom level when opening canvas" id="canvas-zoom">
      <div class="flex">
        <input
          id="canvas-zoom"
          type="range"
          bind:value={canvas.defaultZoom}
          min="0.25"
          max="3"
          step="0.25"
        />
        <span>{Math.round(canvas.defaultZoom * 100)}%</span>
      </div>
    </SettingRow>

    <SettingRow
      label="Show minimap"
      hint="Display a minimap overview of the canvas"
      id="canvas-minimap"
    >
      <input id="canvas-minimap" type="checkbox" bind:checked={canvas.showMinimap} />
    </SettingRow>
  </section>
</div>
