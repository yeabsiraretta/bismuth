<script lang="ts">
  import Modal from '@/components/ui/layout/Modal.svelte';
  import Button from '@/components/ui/actions/Button.svelte';

  /** Whether the dialog is open */
  export let isOpen: boolean = false;
  /** Dialog title */
  export let title: string = 'Confirm';
  /** Message body */
  export let message: string = '';
  /** Confirm button label */
  export let confirmLabel: string = 'Confirm';
  /** Visual variant for the confirm button */
  export let variant: 'danger' | 'primary' = 'primary';
  /** Confirm callback */
  export let onConfirm: (() => void) | undefined = undefined;
  /** Close/cancel callback */
  export let onClose: (() => void) | undefined = undefined;

  function handleConfirm() {
    onConfirm?.();
  }

  function handleClose() {
    onClose?.();
  }
</script>

<Modal {isOpen} {title} ariaLabel={title} onClose={handleClose}>
  <div class="confirm-content">
    <p class="confirm-message">{message}</p>
    <div class="confirm-actions">
      <Button variant="secondary" on:click={handleClose} ariaLabel="Cancel">Cancel</Button>
      <Button variant={variant} on:click={handleConfirm} ariaLabel={confirmLabel}>{confirmLabel}</Button>
    </div>
  </div>
</Modal>

<style>
  .confirm-content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-m, 16px);
  }

  .confirm-message {
    margin: 0;
    color: var(--text-normal);
    font-size: var(--font-ui-small);
    line-height: 1.5;
  }

  .confirm-actions {
    display: flex;
    gap: var(--spacing-s, 8px);
    justify-content: flex-end;
  }
</style>
