<script lang="ts">
  import Button from '@/components/ui/actions/Button.svelte';

  export let vaultName: string;
  export let selectedParentPath: string;
  export let onConfirm: () => void;
  export let onCancel: () => void;
</script>

<div
  class="dialog-overlay"
  on:click={onCancel}
  on:keydown={(e) => {
    if (e.key === 'Escape') onCancel();
  }}
  role="presentation"
>
  <div
    class="dialog"
    on:click|stopPropagation
    on:keydown|stopPropagation
    role="dialog"
    aria-labelledby="dialog-title"
    tabindex="-1"
  >
    <h2 id="dialog-title" class="dialog-title">Name Your Vault</h2>
    <p class="dialog-description">Choose a name for your new vault folder</p>

    <div class="dialog-input-group">
      <label for="vault-name-input" class="dialog-label">Vault Name</label>
      <!-- svelte-ignore a11y_autofocus -->
      <input
        id="vault-name-input"
        type="text"
        class="dialog-input"
        bind:value={vaultName}
        placeholder="My Vault"
        autofocus
        on:keydown={(e) => e.key === 'Enter' && onConfirm()}
      />
      <p class="dialog-hint">Location: {selectedParentPath}/{vaultName.trim() || 'vault-name'}</p>
    </div>

    <div class="dialog-actions">
      <Button variant="secondary" on:click={onCancel}>Cancel</Button>
      <Button variant="primary" on:click={onConfirm} disabled={!vaultName.trim()}>
        Create Vault
      </Button>
    </div>
  </div>
</div>

<style>
  .dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--background-modifier-cover, rgba(0, 0, 0, 0.5));
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
  }

  .dialog {
    background-color: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-l);
    padding: var(--spacing-xl);
    max-width: 500px;
    width: 90%;
    box-shadow: var(--shadow-xl);
  }

  .dialog-title {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    margin: 0 0 var(--spacing-s) 0;
  }

  .dialog-description {
    font-size: var(--font-size-sm);
    color: var(--text-muted);
    margin: 0 0 var(--spacing-l) 0;
  }

  .dialog-input-group {
    margin-bottom: var(--spacing-l);
  }

  .dialog-label {
    display: block;
    font-size: var(--font-size-sm);
    font-weight: var(--font-medium);
    color: var(--text-primary);
    margin-bottom: var(--spacing-xs);
  }

  .dialog-input {
    width: 100%;
    padding: var(--spacing-m);
    font-size: var(--font-size-md);
    background-color: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-m);
    color: var(--text-primary);
    outline: none;
    transition: border-color 0.15s ease;
  }

  .dialog-input:focus {
    border-color: var(--interactive-accent);
  }

  .dialog-hint {
    font-size: var(--font-size-xs);
    color: var(--text-muted);
    margin-top: var(--spacing-xs);
    font-family: var(--font-mono);
  }

  .dialog-actions {
    display: flex;
    gap: var(--spacing-m);
    justify-content: flex-end;
  }
</style>
