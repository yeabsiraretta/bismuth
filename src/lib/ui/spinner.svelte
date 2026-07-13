<script lang="ts">
  /** Animated loading spinner with optional full-screen overlay. @component */
  let {
    size = 'md',
    label = 'Loading',
    overlay = false,
  }: {
    size?: 'sm' | 'md' | 'lg';
    label?: string;
    overlay?: boolean;
  } = $props();
</script>

{#if overlay}
  <div class="spinner-overlay" aria-live="polite">
    <div class="spinner spinner-{size}" role="status" aria-label={label}></div>
  </div>
{:else}
  <div class="spinner spinner-{size}" role="status" aria-label={label}></div>
{/if}

<style>
  .spinner {
    border-radius: 50%;
    border-style: solid;
    border-color: var(--color-border);
    border-top-color: var(--color-accent);
    animation: spin 0.6s linear infinite;
    flex-shrink: 0;
  }
  .spinner-sm {
    width: 14px;
    height: 14px;
    border-width: 2px;
  }
  .spinner-md {
    width: 24px;
    height: 24px;
    border-width: 3px;
  }
  .spinner-lg {
    width: 40px;
    height: 40px;
    border-width: 4px;
  }
  .spinner-overlay {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: oklch(0 0 0 / 0.3);
    z-index: var(--z-modal);
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
