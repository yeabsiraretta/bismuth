<script lang="ts">
  import { inspectEnabled, hoveredElement, measureFrom, measureTo } from '@/features/canvas/stores/design/inspectMode';
  import SpacingVisualizer from './SpacingVisualizer.svelte';

  export let scale: number = 1;
  export let offsetX: number = 0;
  export let offsetY: number = 0;

  interface ElementRect {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }

  export let elements: ElementRect[] = [];

  $: hoveredRect = elements.find(el => el.id === $hoveredElement);
  $: fromRect = elements.find(el => el.id === $measureFrom);
  $: toRect = elements.find(el => el.id === $measureTo);
</script>

{#if $inspectEnabled}
  <div class="inspect-overlay" role="presentation">
    <!-- Hovered element highlight -->
    {#if hoveredRect}
      <div
        class="element-highlight hovered"
        style="
          left: {hoveredRect.x * scale + offsetX}px;
          top: {hoveredRect.y * scale + offsetY}px;
          width: {hoveredRect.width * scale}px;
          height: {hoveredRect.height * scale}px;
        "
      ></div>
    {/if}

    <!-- Measurement from element -->
    {#if fromRect}
      <div
        class="element-highlight from"
        style="
          left: {fromRect.x * scale + offsetX}px;
          top: {fromRect.y * scale + offsetY}px;
          width: {fromRect.width * scale}px;
          height: {fromRect.height * scale}px;
        "
      ></div>
    {/if}

    <!-- Measurement to element -->
    {#if toRect}
      <div
        class="element-highlight to"
        style="
          left: {toRect.x * scale + offsetX}px;
          top: {toRect.y * scale + offsetY}px;
          width: {toRect.width * scale}px;
          height: {toRect.height * scale}px;
        "
      ></div>
    {/if}

    <!-- Spacing lines -->
    <SpacingVisualizer {scale} />
  </div>
{/if}

<style>
  .inspect-overlay { position: absolute; inset: 0; pointer-events: none; z-index: 40; }
  .element-highlight { position: absolute; border: 1px solid; pointer-events: none; }
  .element-highlight.hovered { border-color: var(--inspect-highlight); background: color-mix(in srgb, var(--inspect-highlight) 5%, transparent); }
  .element-highlight.from { border-color: var(--inspect-source); border-style: dashed; }
  .element-highlight.to { border-color: var(--inspect-target); border-style: dashed; }
</style>
