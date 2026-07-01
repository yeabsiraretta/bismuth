<script lang="ts">
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let label: string = 'Loading';
  export let overlay: boolean = false;
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
    border-radius: var(--radius-full, 50%);
    border-style: solid;
    border-color: var(--background-modifier-border);
    border-top-color: var(--color-primary);
    animation: spin 0.6s linear infinite;
    flex-shrink: 0;
  }

  .spinner-sm { width: var(--size-spinner-sm, 14px); height: var(--size-spinner-sm, 14px); border-width: 2px; }
  .spinner-md { width: var(--size-spinner-md, 24px); height: var(--size-spinner-md, 24px); border-width: 3px; }
  .spinner-lg { width: var(--size-spinner-lg, 40px); height: var(--size-spinner-lg, 40px); border-width: 4px; }

  .spinner-overlay {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--background-modifier-cover, rgba(0, 0, 0, 0.3));
    z-index: var(--layer-modal, 200);
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
