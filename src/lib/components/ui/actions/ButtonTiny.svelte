<script lang="ts">
  import { onMount } from 'svelte';
  import { log } from '@/utils/logger';

  export let variant: 'primary' | 'secondary' | 'tertiary' = 'secondary';
  export let iconOnly: boolean = false;
  export let ariaLabel: string | undefined = undefined;
  export let disabled: boolean = false;
  export let type: 'button' | 'submit' | 'reset' = 'button';

  onMount(() => {
    if (iconOnly && !ariaLabel) {
      log.warn('ButtonTiny: iconOnly=true requires ariaLabel for accessibility');
    }
  });
</script>

<button
  class="btn-tiny btn-tiny-{variant}"
  class:btn-tiny-icon-only={iconOnly}
  {disabled}
  {type}
  aria-label={ariaLabel}
  on:click
>
  <slot />
</button>

<style>
  .btn-tiny {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-xs, 4px);
    height: var(--size-4-6, 24px);
    min-height: var(--size-4-6, 24px);
    padding: 0 var(--spacing-s, 8px);
    border-radius: var(--radius-s);
    font-size: var(--font-ui-smaller);
    font-weight: var(--font-medium);
    cursor: pointer;
    white-space: nowrap;
    transition:
      background var(--transition-fast, 150ms ease),
      color var(--transition-fast, 150ms ease);
    border: none;
  }

  .btn-tiny:focus-visible {
    outline: 2px solid var(--interactive-accent);
    outline-offset: 2px;
  }

  .btn-tiny:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .btn-tiny:active:not(:disabled) {
    transform: translateY(1px);
  }

  .btn-tiny-icon-only {
    padding: 0;
    width: var(--size-4-6, 24px);
    aspect-ratio: 1;
    border-radius: var(--radius-full);
  }

  .btn-tiny-primary {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
  }
  .btn-tiny-primary:hover:not(:disabled) {
    background: var(--interactive-accent-hover);
  }

  .btn-tiny-secondary {
    background: var(--background-primary);
    color: var(--text-normal);
    border: 1px solid var(--border-color);
  }
  .btn-tiny-secondary:hover:not(:disabled) {
    background: var(--background-modifier-hover);
  }

  .btn-tiny-tertiary {
    background: transparent;
    color: var(--text-muted);
    border: none;
  }
  .btn-tiny-tertiary:hover:not(:disabled) {
    background: var(--background-modifier-hover);
    color: var(--text-normal);
  }
</style>
