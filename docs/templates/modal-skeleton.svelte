<!--
  Modal Skeleton Template
  Usage: Copy this file as a starting point for new modal/dialog components.
  Location: src/lib/components/overlays/<Feature>Modal.svelte
-->
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { createFocusTrap } from '@/utils/accessibility/focusTrap';
  import { Z_INDEX } from '@/config/constants';
  import Icon from '@/components/icons/Icon.svelte';

  /** Whether the modal is open */
  export let open = false;
  /** Modal title */
  export let title = 'Modal Title';
  /** Whether clicking backdrop closes the modal */
  export let dismissible = true;

  const dispatch = createEventDispatcher<{ close: void; confirm: void }>();
  let modalEl: HTMLElement;

  function handleClose() {
    if (dismissible) dispatch('close');
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') handleClose();
  }

  onMount(() => {
    if (modalEl) {
      const trap = createFocusTrap(modalEl);
      return () => trap.destroy();
    }
  });
</script>

{#if open}
  <div
    class="modal-backdrop"
    on:click={handleClose}
    on:keydown={handleKeydown}
    role="presentation"
    style:z-index={Z_INDEX.MODAL_BACKDROP}
  >
    <div
      class="modal"
      bind:this={modalEl}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      on:click|stopPropagation
      on:keydown={handleKeydown}
      style:z-index={Z_INDEX.MODAL}
    >
      <header class="modal-header">
        <h2 id="modal-title">{title}</h2>
        {#if dismissible}
          <button class="modal-close" on:click={handleClose} aria-label="Close">
            <Icon name="x" size={18} />
          </button>
        {/if}
      </header>

      <div class="modal-body">
        <slot />
      </div>

      <footer class="modal-footer">
        <slot name="footer">
          <button class="btn-secondary" on:click={handleClose}>Cancel</button>
          <button class="btn-primary" on:click={() => dispatch('confirm')}>Confirm</button>
        </slot>
      </footer>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: var(--color-overlay);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-xl);
  }

  .modal {
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-l);
    box-shadow: var(--shadow-lg);
    width: 100%;
    max-width: 480px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-m) var(--spacing-l);
    border-bottom: 1px solid var(--color-border);
  }

  .modal-header h2 {
    margin: 0;
    font-size: var(--font-size-lg);
    font-weight: 600;
  }

  .modal-close {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--color-text-secondary);
    padding: var(--spacing-xs);
    border-radius: var(--radius-s);
  }

  .modal-close:hover {
    background: var(--color-bg-hover);
  }

  .modal-body {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-l);
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-s);
    padding: var(--spacing-m) var(--spacing-l);
    border-top: 1px solid var(--color-border);
  }

  .btn-primary,
  .btn-secondary {
    padding: var(--spacing-xs) var(--spacing-m);
    border-radius: var(--radius-s);
    font-size: var(--font-size-sm);
    cursor: pointer;
    border: 1px solid var(--color-border);
  }

  .btn-primary {
    background: var(--color-accent);
    color: white;
    border-color: var(--color-accent);
  }

  .btn-secondary {
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
  }
</style>
