<script lang="ts">
  import Modal from '@/components/ui/layout/Modal.svelte';
  import Button from '@/components/ui/actions/Button.svelte';
  import Spinner from '@/components/ui/feedback/Spinner.svelte';

  export let isOpen: boolean = false;
  export let title: string = 'Confirm';
  export let onClose: () => void;

  let isProcessing = false;
  let error = '';

  async function handleConfirm() {
    error = '';
    isProcessing = true;
    try {
      // TODO: implement action
      onClose();
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      isProcessing = false;
    }
  }
</script>

<Modal {title} {isOpen} {onClose}>
  <div class="modal-body">
    <!-- Replace with modal content -->
    <p>Are you sure you want to proceed?</p>

    {#if error}
      <p class="error-msg">{error}</p>
    {/if}
  </div>

  <div class="modal-footer">
    <Button variant="secondary" on:click={onClose} disabled={isProcessing}>Cancel</Button>
    <Button variant="primary" on:click={handleConfirm} loading={isProcessing} disabled={isProcessing}>
      Confirm
    </Button>
  </div>
</Modal>

<style>
  .modal-body {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-m);
    min-width: 380px;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-s);
    margin-top: var(--spacing-m);
  }

  .error-msg {
    font-size: var(--font-ui-small);
    color: var(--color-danger);
    margin: 0;
  }
</style>
