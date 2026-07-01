<script lang="ts">
  import Spinner from '@/components/ui/feedback/Spinner.svelte';
  import { log } from '@/utils/logger';

  export let variant: 'primary' | 'secondary' | 'danger' = 'secondary';
  export let disabled: boolean = false;
  export let type: 'button' | 'submit' | 'reset' = 'button';
  export let ariaLabel: string | undefined = undefined;
  export let size: 'xs' | 'small' | 'medium' | 'large' = 'medium';
  export let loading: boolean = false;
  export let fullWidth: boolean = false;
  export let iconOnly: boolean = false;
  export let title: string | undefined = undefined;

  function handleClick(event: MouseEvent) {
    log.debug('Button clicked', { variant, disabled, loading, ariaLabel, target: (event.target as HTMLElement)?.textContent?.trim() });
  }
</script>

<button
  class="btn btn-{variant} btn-{size}"
  class:btn-full={fullWidth}
  class:btn-loading={loading}
  class:btn-icon-only={iconOnly}
  disabled={disabled || loading}
  {type}
  {title}
  aria-label={ariaLabel}
  on:click={handleClick}
  on:click
>
  {#if loading}
    <Spinner size="sm" label="Loading" />
  {/if}
  <slot />
</button>

<style>
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-xs);
    border: none;
    border-radius: var(--radius-s);
    font-weight: var(--font-medium);
    cursor: pointer;
    transition: all 0.15s ease;
    user-select: none;
    position: relative;
  }

  .btn:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  .btn:active:not(:disabled) { transform: translateY(1px); }

  .btn-xs {
    min-height: 32px;
    min-width: 32px;
    padding: var(--spacing-xs) var(--spacing-s);
    font-size: var(--font-smallest);
  }

  .btn-small {
    min-height: 32px;
    min-width: 32px;
    padding: var(--spacing-s) var(--spacing-m);
    font-size: var(--font-ui-small);
  }

  .btn-medium {
    min-height: 40px;
    min-width: 40px;
    padding: var(--spacing-s) var(--spacing-m);
    font-size: var(--font-ui-small);
  }

  .btn-large {
    min-height: 48px;
    min-width: 48px;
    padding: var(--spacing-m) var(--spacing-xl);
    font-size: var(--font-ui-medium);
  }

  .btn-full { width: 100%; }
  .btn-loading { pointer-events: none; }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-primary {
    background: var(--color-primary);
    color: var(--text-on-accent);
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--color-primary-hover);
    box-shadow: var(--shadow-sm);
  }

  .btn-secondary {
    background: var(--color-surface);
    color: var(--color-text);
    border: 1px solid var(--color-border);
  }

  .btn-secondary:hover:not(:disabled) {
    background: var(--color-border);
    border-color: var(--color-text);
  }

  .btn-danger {
    background: var(--color-danger);
    color: var(--text-on-accent);
  }

  .btn-danger:hover:not(:disabled) {
    background: var(--color-danger-hover, var(--background-modifier-error-hover));
    box-shadow: var(--shadow-sm);
  }

  .btn-icon-only {
    padding: 0;
    border-radius: var(--radius-full);
    aspect-ratio: 1;
  }
</style>
