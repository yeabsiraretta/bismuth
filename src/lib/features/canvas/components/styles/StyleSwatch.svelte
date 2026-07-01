<script lang="ts">
  import type { SharedStyle } from '@/features/canvas/stores/design/styleLibrary';

  export let style: SharedStyle;
  export let size: 'sm' | 'md' = 'md';
</script>

<div class="style-swatch {size}" title={style.name}>
  {#if style.type === 'fill'}
    <div class="swatch-color" style="background: {style.properties.color ?? '#ccc'}"></div>
  {:else if style.type === 'stroke'}
    <div class="swatch-stroke">
      <div class="stroke-line" style="border-color: {style.properties.color ?? '#333'}; border-width: {style.properties.width ?? 1}px"></div>
    </div>
  {:else if style.type === 'text'}
    <div class="swatch-text">Aa</div>
  {:else}
    <div class="swatch-effect">fx</div>
  {/if}
</div>

<style>
  .style-swatch { display: flex; align-items: center; justify-content: center; border-radius: var(--radius-sm); overflow: hidden; border: 1px solid var(--border); }
  .style-swatch.sm { width: 20px; height: 20px; }
  .style-swatch.md { width: 32px; height: 32px; }
  .swatch-color { width: 100%; height: 100%; }
  .swatch-stroke { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; }
  .stroke-line { width: 70%; border-bottom-style: solid; }
  .swatch-text { font-size: 0.7em; font-weight: 600; color: var(--text-primary); }
  .swatch-effect { font-size: 0.6em; font-style: italic; color: var(--text-muted); }
</style>
