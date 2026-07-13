<script lang="ts">
  /** Multi-variant button with loading state and icon-only mode. @component */
  import type { Snippet } from 'svelte';

  let {
    variant = 'secondary',
    disabled = false,
    type = 'button',
    ariaLabel = undefined,
    size = 'medium',
    loading = false,
    fullWidth = false,
    iconOnly = false,
    title = undefined,
    onclick = undefined,
    children,
  }: {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    ariaLabel?: string;
    size?: 'xs' | 'small' | 'medium' | 'large';
    loading?: boolean;
    fullWidth?: boolean;
    iconOnly?: boolean;
    title?: string;
    onclick?: (event: MouseEvent) => void;
    children?: Snippet;
  } = $props();
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
  {onclick}
>
  {#if loading}
    <span class="btn-spinner" role="status" aria-label="Loading"></span>
  {/if}
  {@render children?.()}
</button>

<style>
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border: none;
    border-radius: var(--radius-s);
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-base);
    user-select: none;
    position: relative;
    font-family: inherit;
  }
  .btn:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
  .btn:active:not(:disabled) {
    transform: translateY(1px);
  }
  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-xs {
    min-height: 24px;
    padding: 2px 8px;
    font-size: 0.7rem;
  }
  .btn-small {
    min-height: 28px;
    padding: 4px 10px;
    font-size: 0.75rem;
  }
  .btn-medium {
    min-height: 32px;
    padding: 6px 14px;
    font-size: 0.8rem;
  }
  .btn-large {
    min-height: 40px;
    padding: 8px 20px;
    font-size: 0.875rem;
  }

  .btn-full {
    width: 100%;
  }
  .btn-loading {
    pointer-events: none;
  }

  .btn-primary {
    background: var(--color-accent);
    color: var(--color-background);
  }
  .btn-primary:hover:not(:disabled) {
    background: var(--color-accent-hover);
  }

  .btn-secondary {
    background: var(--color-surface);
    color: var(--color-text);
    border: 1px solid var(--color-border);
  }
  .btn-secondary:hover:not(:disabled) {
    background: var(--color-surface-hover);
  }

  .btn-danger {
    background: var(--color-error);
    color: var(--color-background);
  }
  .btn-danger:hover:not(:disabled) {
    filter: brightness(1.1);
  }

  .btn-ghost {
    background: transparent;
    color: var(--color-text-muted);
  }
  .btn-ghost:hover:not(:disabled) {
    background: var(--color-surface-hover);
    color: var(--color-text);
  }

  .btn-icon-only {
    padding: 0;
    border-radius: var(--radius-full);
    aspect-ratio: 1;
  }

  .btn-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid currentColor;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
