<script lang="ts">
  /** Hover-triggered tooltip with configurable position and delay. @component */
  import type { Snippet } from 'svelte';

  let {
    text = '',
    position = 'top',
    delay = 200,
    children,
  }: {
    text?: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
    delay?: number;
    children?: Snippet;
  } = $props();

  let visible = $state(false);
  let showTimer: number;
  const tooltipId = `tooltip-${Math.random().toString(36).slice(2, 9)}`;

  function show() {
    showTimer = window.setTimeout(() => {
      visible = true;
    }, delay);
  }

  function hide() {
    if (showTimer) clearTimeout(showTimer);
    visible = false;
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="tooltip-wrapper"
  onmouseenter={show}
  onmouseleave={hide}
  onfocusin={show}
  onfocusout={hide}
  aria-describedby={text ? tooltipId : undefined}
>
  {@render children?.()}
  {#if visible && text}
    <div class="tooltip tooltip-{position}" role="tooltip" id={tooltipId}>
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
    padding: 4px 8px;
    background-color: var(--color-surface);
    color: var(--color-text);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    box-shadow: var(--shadow-m);
    font-size: 0.7rem;
    white-space: nowrap;
    z-index: var(--z-toast);
    pointer-events: none;
    animation: tooltip-in 0.15s ease;
  }
  .tooltip-top {
    bottom: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
  }
  .tooltip-bottom {
    top: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
  }
  .tooltip-left {
    right: calc(100% + 6px);
    top: 50%;
    transform: translateY(-50%);
  }
  .tooltip-right {
    left: calc(100% + 6px);
    top: 50%;
    transform: translateY(-50%);
  }
  @keyframes tooltip-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
</style>
