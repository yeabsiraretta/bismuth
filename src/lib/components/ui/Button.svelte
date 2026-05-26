<script lang="ts">
  import { log } from '@/utils/logger';

  export let variant: 'primary' | 'secondary' | 'danger' = 'secondary';
  export let disabled: boolean = false;
  export let type: 'button' | 'submit' | 'reset' = 'button';
  export let ariaLabel: string | undefined = undefined;
  export let size: 'small' | 'medium' | 'large' = 'medium';
  export let loading: boolean = false;
  export let fullWidth: boolean = false;

  function handleClick(event: MouseEvent) {
    log.debug('Button clicked', {
      variant,
      disabled,
      loading,
      ariaLabel,
      target: (event.target as HTMLElement)?.textContent?.trim(),
    });
  }
</script>

<button
  class="btn btn-{variant} btn-{size}"
  class:btn-full={fullWidth}
  class:btn-loading={loading}
  disabled={disabled || loading}
  {type}
  aria-label={ariaLabel}
  on:click={handleClick}
  on:click
>
  {#if loading}
    <span class="spinner" aria-hidden="true"></span>
  {/if}
  <slot />
</button>

<style>
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    border: none;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
    user-select: none;
    position: relative;
  }

  .btn:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  .btn:active:not(:disabled) {
    transform: translateY(1px);
  }

  .btn-small {
    min-height: 32px;
    min-width: 32px;
    padding: 6px 12px;
    font-size: 0.8125rem;
  }

  .btn-medium {
    min-height: 40px;
    min-width: 40px;
    padding: var(--space-3) var(--space-4);
    font-size: 0.875rem;
  }

  .btn-large {
    min-height: 48px;
    min-width: 48px;
    padding: 12px 24px;
    font-size: 1rem;
  }

  .btn-full {
    width: 100%;
  }

  .btn-loading {
    pointer-events: none;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-primary {
    background: var(--color-primary);
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--color-primary-hover);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
    color: white;
  }

  .btn-danger:hover:not(:disabled) {
    background: #c82333;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .spinner {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
