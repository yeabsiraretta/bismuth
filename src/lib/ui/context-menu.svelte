<script lang="ts">
  /** Positioned right-click context menu with Escape-to-close. @component */
  import type { Snippet } from 'svelte';

  interface Props {
    x: number;
    y: number;
    show: boolean;
    onclose: () => void;
    children: Snippet;
  }

  let { x, y, show, onclose, children }: Props = $props();

  function handleClick() {
    if (show) onclose();
  }

  function handleKey(e: KeyboardEvent) {
    if (show && e.key === 'Escape') onclose();
  }
</script>

<svelte:window onclick={handleClick} onkeydown={handleKey} />

{#if show}
  <div
    class="ctx-menu"
    style="left:{x}px;top:{y}px"
    role="menu"
    aria-label="Context menu"
    tabindex="-1"
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.stopPropagation()}
  >
    {@render children()}
  </div>
{/if}

<style>
  .ctx-menu {
    position: fixed;
    z-index: var(--z-context-menu);
    min-width: 140px;
    padding: 4px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-m);
    box-shadow: var(--shadow-m);
  }
  .ctx-menu :global(.ctx-item) {
    display: block;
    width: 100%;
    padding: 5px 10px;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 0.7rem;
    color: var(--color-text);
    text-align: left;
    font-family: inherit;
    border-radius: var(--radius-s);
  }
  .ctx-menu :global(.ctx-item:hover) {
    background: var(--color-surface-hover);
  }
  .ctx-menu :global(.ctx-danger) {
    color: var(--color-error);
  }
  .ctx-menu :global(.ctx-sep) {
    height: 1px;
    margin: 3px 4px;
    background: var(--color-border);
  }
</style>
