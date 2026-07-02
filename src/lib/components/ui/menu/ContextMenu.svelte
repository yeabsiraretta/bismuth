<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  /** X position in viewport pixels */
  export let x: number = 0;
  /** Y position in viewport pixels */
  export let y: number = 0;
  /** Whether the menu is visible */
  export let show: boolean = false;
  export let onClose: (() => void) | undefined = undefined;

  function close() {
    show = false;
    onClose?.();
  }

  function handleBackdropClick() {
    close();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') close();
  }

  onMount(() => {
    document.addEventListener('keydown', handleKeydown);
  });

  onDestroy(() => {
    document.removeEventListener('keydown', handleKeydown);
  });
</script>

{#if show}
  <div class="context-backdrop" on:click={handleBackdropClick} role="presentation"></div>
  <div
    class="context-menu"
    style="left: {x}px; top: {y}px;"
    role="menu"
    tabindex="-1"
    on:click|stopPropagation
    on:keydown|stopPropagation
  >
    <slot />
  </div>
{/if}

<style>
  .context-backdrop {
    position: fixed;
    inset: 0;
    z-index: var(--layer-popover, 200);
  }

  .context-menu {
    position: fixed;
    z-index: calc(var(--layer-popover, 200) + 1);
    min-width: 180px;
    background: var(--background-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-m);
    box-shadow: var(--shadow-l, 0 4px 16px rgba(0, 0, 0, 0.15));
    padding: 4px;
  }
</style>
