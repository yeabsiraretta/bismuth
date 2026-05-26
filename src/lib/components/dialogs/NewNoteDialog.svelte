<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Modal from '@/components/ui/Modal.svelte';
  import Button from '@/components/ui/Button.svelte';

  export let isOpen: boolean = false;
  export let noteName: string = '';

  const dispatch = createEventDispatcher();

  function handleCreate() {
    if (noteName.trim()) {
      dispatch('create', { name: noteName });
    }
  }

  function handleClose() {
    dispatch('close');
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && noteName.trim()) {
      handleCreate();
    }
  }
</script>

<Modal {isOpen} title="Create New Note" ariaLabel="Create new note dialog" on:close={handleClose}>
  <div class="dialog-content">
    <input
      type="text"
      bind:value={noteName}
      on:keydown={handleKeydown}
      placeholder="Note name..."
      class="note-input"
      aria-label="Note name"
    />
    <div class="actions">
      <Button variant="secondary" on:click={handleClose} ariaLabel="Cancel creating note">
        Cancel
      </Button>
      <Button
        variant="primary"
        on:click={handleCreate}
        disabled={!noteName.trim()}
        ariaLabel="Create note"
      >
        Create
      </Button>
    </div>
  </div>
</Modal>

<style>
  .dialog-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .note-input {
    width: 100%;
    padding: var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    font-size: 0.875rem;
    color: var(--color-text);
  }

  .note-input:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  .actions {
    display: flex;
    gap: var(--space-3);
    justify-content: flex-end;
  }
</style>
