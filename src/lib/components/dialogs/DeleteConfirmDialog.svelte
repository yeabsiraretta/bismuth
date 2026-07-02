<script lang="ts">
  import ConfirmDialog from '@/components/ui/layout/ConfirmDialog.svelte';

  export let isOpen: boolean = false;
  export let noteTitle: string = '';
  export let onConfirm: (() => void) | undefined = undefined;
  export let onClose: (() => void) | undefined = undefined;
</script>

<ConfirmDialog
  {isOpen}
  title="Delete Note?"
  message={`Are you sure you want to delete "${noteTitle}"? This action cannot be undone.`}
  confirmLabel="Delete"
  variant="danger"
  {onConfirm}
  {onClose}
/>
