<script lang="ts">
  import type { TokenType, TokenValue } from '@/features/canvas/types/design';

  export let type: TokenType;
  export let value: TokenValue | null;
  export let size: 'sm' | 'md' = 'sm';
</script>

<div class="token-swatch {size}">
  {#if type === 'color' && typeof value === 'string'}
    <span class="swatch-color" style="background: {value}"></span>
  {:else if type === 'spacing' && typeof value === 'number'}
    <span class="swatch-spacing">
      <span class="swatch-bar" style="width: {Math.min(value, 32)}px"></span>
    </span>
  {:else if type === 'radius' && typeof value === 'number'}
    <span class="swatch-radius" style="border-radius: {value}px"></span>
  {:else if type === 'opacity' && typeof value === 'number'}
    <span class="swatch-opacity" style="opacity: {value}"></span>
  {:else if type === 'typography'}
    <span class="swatch-text">Aa</span>
  {:else if type === 'shadow'}
    <span class="swatch-shadow"></span>
  {:else}
    <span class="swatch-empty"></span>
  {/if}
</div>

<style>
  .token-swatch {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .token-swatch.sm {
    width: 16px;
    height: 16px;
  }
  .token-swatch.md {
    width: 24px;
    height: 24px;
  }
  .swatch-color {
    width: 100%;
    height: 100%;
    border-radius: 3px;
    border: 1px solid var(--color-border);
  }
  .swatch-spacing {
    display: flex;
    align-items: center;
    height: 100%;
  }
  .swatch-bar {
    height: 4px;
    background: var(--color-accent);
    border-radius: 2px;
    min-width: 4px;
  }
  .swatch-radius {
    width: 100%;
    height: 100%;
    border: 2px solid var(--color-accent);
  }
  .swatch-opacity {
    width: 100%;
    height: 100%;
    background: var(--color-text);
    border-radius: 3px;
  }
  .swatch-text {
    font-size: 10px;
    font-weight: 600;
    color: var(--color-text-secondary);
  }
  .swatch-shadow {
    width: 80%;
    height: 80%;
    background: var(--color-bg-elevated);
    border-radius: 3px;
    box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  }
  .swatch-empty {
    width: 100%;
    height: 100%;
    border: 1px dashed var(--color-border);
    border-radius: 3px;
  }
</style>
