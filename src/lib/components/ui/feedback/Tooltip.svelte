<script lang="ts">
  import { fade } from 'svelte/transition';

  export let text: string = '';
  export let position: 'top' | 'bottom' | 'left' | 'right' = 'top';
  export let delay: number = 200;

  let visible = false;
  let showTimer: number;

  function handleMouseEnter() {
    showTimer = window.setTimeout(() => {
      visible = true;
    }, delay);
  }

  function handleMouseLeave() {
    if (showTimer) clearTimeout(showTimer);
    visible = false;
  }
</script>

<div
  class="tooltip-wrapper"
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
  role="group"
>
  <slot />
  {#if visible && text}
    <div
      class="tooltip"
      class:tooltip-top={position === 'top'}
      class:tooltip-bottom={position === 'bottom'}
      class:tooltip-left={position === 'left'}
      class:tooltip-right={position === 'right'}
      transition:fade={{ duration: 150 }}
    >
      {text}
    </div>
  {/if}
</div>

<style>
  .tooltip-wrapper {
    position: relative;
    display: inline-block;
  }

  .tooltip {
    position: absolute;
    padding: var(--spacing-xs) var(--spacing-s);
    background-color: var(--background-primary);
    color: var(--text-normal);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s);
    box-shadow: var(--shadow-m);
    font-family: var(--font-text);
    font-size: var(--font-smaller);
    white-space: nowrap;
    z-index: var(--layer-popover);
    pointer-events: none;
  }

  .tooltip-top {
    bottom: calc(100% + var(--spacing-xs));
    left: 50%;
    transform: translateX(-50%);
  }

  .tooltip-bottom {
    top: calc(100% + var(--spacing-xs));
    left: 50%;
    transform: translateX(-50%);
  }

  .tooltip-left {
    right: calc(100% + var(--spacing-xs));
    top: 50%;
    transform: translateY(-50%);
  }

  .tooltip-right {
    left: calc(100% + var(--spacing-xs));
    top: 50%;
    transform: translateY(-50%);
  }
</style>
