<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Modal from '@/components/ui/Modal.svelte';
  import Button from '@/components/ui/Button.svelte';

  export let isOpen: boolean = false;
  export let noteTitle: string = '';

  const dispatch = createEventDispatcher();

  function handleConfirm() {
    dispatch('confirm');
  }

  function handleClose() {
    dispatch('close');
  }
</script>

<Modal
  {isOpen}
  title="Delete Note?"
  ariaLabel="Delete note confirmation dialog"
  on:close={handleClose}
>
  <div class="dialog-content">
    <p class="message">Are you sure you want to delete "{noteTitle}"?</p>
    <p class="warning">This action cannot be undone.</p>
    <div class="actions">
      <Button variant="secondary" on:click={handleClose} ariaLabel="Cancel deletion">Cancel</Button>
      <Button variant="danger" on:click={handleConfirm} ariaLabel="Confirm deletion">Delete</Button>
    </div>
  </div>
</Modal>

<style>
  .dialog-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .message {
    margin: 0;
    color: var(--color-text);
    font-size: 0.875rem;
  }

  .warning {
    margin: 0;
    color: var(--color-danger);
    font-size: 0.875rem;
    font-weight: 500;
  }

  .actions {
    display: flex;
    gap: var(--space-3);
    justify-content: flex-end;
  }
</style>
