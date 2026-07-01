<script lang="ts">
  export let isOpen: boolean = false;
  export let title: string;
  export let ariaLabel: string | undefined = undefined;
  export let onClose: (() => void) | undefined = undefined;

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') onClose?.();
  }
</script>

{#if isOpen}
  <div class="modal-overlay" on:click={onClose} on:keydown={handleKeydown} role="presentation">
    <div
      class="modal"
      on:click|stopPropagation
      on:keydown|stopPropagation
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-label={ariaLabel}
      tabindex="-1"
    >
      <h3 id="modal-title">{title}</h3>
      <slot />
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: var(--background-modifier-cover);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: var(--layer-modal, 1000);
  }

  .modal {
    background: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s);
    padding: var(--spacing-xl);
    min-width: 400px;
    max-width: 600px;
    box-shadow: var(--shadow-m);
  }

  h3 {
    margin: 0 0 var(--spacing-m) 0;
    font-size: var(--font-ui-large);
    font-weight: var(--font-semibold);
    color: var(--color-text);
  }
</style>
