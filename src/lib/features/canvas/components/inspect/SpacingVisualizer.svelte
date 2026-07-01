<script lang="ts">
  import { spacing, measureFrom, measureTo } from '@/features/canvas/stores/design/inspectMode';

  export let scale: number = 1;
</script>

<div class="spacing-visualizer">
  {#if $spacing && $measureFrom && $measureTo}
    <!-- Horizontal measurement -->
    {#if $spacing.horizontal > 0}
      <div
        class="measurement horizontal"
        style="
          left: {($spacing.fromBounds.x + $spacing.fromBounds.width) * scale}px;
          top: {($spacing.fromBounds.y + $spacing.fromBounds.height / 2) * scale}px;
          width: {$spacing.horizontal * scale}px;
        "
      >
        <div class="line"></div>
        <span class="label">{Math.round($spacing.horizontal)}px</span>
      </div>
    {/if}

    <!-- Vertical measurement -->
    {#if $spacing.vertical > 0}
      <div
        class="measurement vertical"
        style="
          left: {($spacing.fromBounds.x + $spacing.fromBounds.width / 2) * scale}px;
          top: {($spacing.fromBounds.y + $spacing.fromBounds.height) * scale}px;
          height: {$spacing.vertical * scale}px;
        "
      >
        <div class="line"></div>
        <span class="label">{Math.round($spacing.vertical)}px</span>
      </div>
    {/if}
  {/if}
</div>

<style>
  .spacing-visualizer { position: absolute; inset: 0; pointer-events: none; z-index: 50; }
  .measurement { position: absolute; display: flex; align-items: center; justify-content: center; }
  .measurement.horizontal { height: 1px; }
  .measurement.vertical { width: 1px; flex-direction: column; }
  .line { position: absolute; background: var(--inspect-measure); }
  .horizontal .line { width: 100%; height: 1px; }
  .vertical .line { height: 100%; width: 1px; }
  .label { position: relative; background: var(--inspect-measure); color: white; padding: 1px 4px; border-radius: 2px; font-size: 10px; font-weight: 600; white-space: nowrap; z-index: 1; }
</style>
