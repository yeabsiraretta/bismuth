<!-- Global confirm dialog provider. Mount once in App.svelte.
     Uses the confirmDialog store to receive programmatic open requests. -->
<script lang="ts">
  import ConfirmDialog from '@/components/ui/layout/ConfirmDialog.svelte';
  import { confirmDialog, closeConfirm } from '@/stores/confirm';

  async function handleConfirm() {
    if ($confirmDialog?.onConfirm) {
      await $confirmDialog.onConfirm();
    }
    closeConfirm();
  }

  function handleCancel() {
    $confirmDialog?.onCancel?.();
    closeConfirm();
  }
</script>

{#if $confirmDialog}
  <ConfirmDialog
    isOpen={true}
    title={$confirmDialog.title}
    message={$confirmDialog.message}
    confirmLabel={$confirmDialog.confirmLabel ?? 'Confirm'}
    cancelLabel={$confirmDialog.cancelLabel ?? 'Cancel'}
    variant={$confirmDialog.variant ?? 'primary'}
    onConfirm={handleConfirm}
    onClose={handleCancel}
  />
{/if}
