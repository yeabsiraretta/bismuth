<script lang="ts">
  import type { AutoLayout, LayoutChild } from '@/features/canvas/types/settings';
  import SpacingHandle from './SpacingHandle.svelte';
  import SizingToggle from './SizingToggle.svelte';

  export let layout: AutoLayout;
  export let children: Array<{ id: string; x: number; y: number; width: number; height: number; layoutChild?: LayoutChild }> = [];
  export let selected: boolean = false;
  export let scale: number = 1;
  export let onSpacingChange: ((value: number) => void) | undefined = undefined;
  export let onSizingChange: ((value: LayoutChild['sizing']) => void) | undefined = undefined;

  $: isHorizontal = layout.direction === 'horizontal';
  $: gap = layout.gap ?? 0;
</script>

{#if selected && layout}
  <div class="auto-layout-overlay" role="presentation">
    <!-- Spacing handles between children -->
    {#each children as child, i}
      {#if i < children.length - 1}
        <SpacingHandle
          value={gap}
          direction={isHorizontal ? 'horizontal' : 'vertical'}
          position={{ x: (isHorizontal ? child.x + child.width : child.x) * scale, y: (isHorizontal ? child.y : child.y + child.height) * scale }}
          onChange={onSpacingChange}
        />
      {/if}

      <!-- Sizing toggle per child -->
      {#if child.layoutChild}
        <div
          class="sizing-handle"
          style="left: {(child.x + child.width / 2) * scale}px; top: {(child.y - 16) * scale}px;"
        >
          <SizingToggle
            sizing={child.layoutChild.sizing}
            minWidth={child.layoutChild.minWidth}
            maxWidth={child.layoutChild.maxWidth}
            onChange={onSizingChange}
          />
        </div>
      {/if}
    {/each}

    <!-- Wrap indicator -->
    {#if layout.wrap}
      <div class="wrap-indicator">↩ Wrap</div>
    {/if}

    <!-- Padding visualization -->
    <div class="padding-viz" style="
      border-top: {(layout.padding?.top ?? 0) * scale}px solid rgba(74, 144, 226, 0.1);
      border-right: {(layout.padding?.right ?? 0) * scale}px solid rgba(74, 144, 226, 0.1);
      border-bottom: {(layout.padding?.bottom ?? 0) * scale}px solid rgba(74, 144, 226, 0.1);
      border-left: {(layout.padding?.left ?? 0) * scale}px solid rgba(74, 144, 226, 0.1);
    "></div>
  </div>
{/if}

<style>
  .auto-layout-overlay { position: absolute; inset: 0; pointer-events: none; z-index: 30; }
  .sizing-handle { position: absolute; pointer-events: all; transform: translateX(-50%); }
  .wrap-indicator { position: absolute; top: -20px; right: 0; font-size: 10px; background: var(--accent); color: white; padding: 1px 4px; border-radius: 2px; }
  .padding-viz { position: absolute; inset: 0; pointer-events: none; }
</style>
