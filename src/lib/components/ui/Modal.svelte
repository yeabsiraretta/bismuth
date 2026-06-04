<script lang="ts">
  export let isOpen: boolean = false;
  export let title: string;
  export let ariaLabel: string | undefined = undefined;
  export let onClose: (() => void) | undefined = undefined;

  function handleOverlayClick() {
    onClose?.();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      onClose?.();
    }
  }
</script>

{#if isOpen}
  <div
    class="modal-overlay"
    on:click={handleOverlayClick}
    on:keydown={handleKeydown}
    role="presentation"
  >
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
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--background-modifier-cover, rgba(0, 0, 0, 0.5));
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal {
    background: var(--background-primary, var(--color-bg));
    border: 1px solid var(--background-modifier-border, var(--color-border));
    border-radius: 4px;
    padding: var(--space-6);
    min-width: 400px;
    max-width: 600px;
    box-shadow: var(--shadow-m, 0 2px 8px rgba(0, 0, 0, 0.1));
  }

  h3 {
    margin: 0 0 var(--space-4) 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text);
  }
</style>
