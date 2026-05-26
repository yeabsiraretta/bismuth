<script lang="ts">
  import { open } from '@tauri-apps/plugin-dialog';
  import { invoke } from '@tauri-apps/api/core';
  import { currentVault, refreshNotes } from '@/stores/vault/vault';
  import type { Vault } from '@/types/vault';
  import Icon from '@/components/icons/Icon.svelte';
  import Button from '@/components/ui/Button.svelte';

  let isCreating = false;
  let error: string | null = null;

  async function handleOpenVault() {
    try {
      error = null;
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Open Vault',
      });

      if (selected && typeof selected === 'string') {
        const vault = await invoke<Vault>('open_vault', { path: selected });
        currentVault.set(vault);
        await refreshNotes();
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to open vault';
      console.error('Error opening vault:', err);
    }
  }

  async function handleCreateVault() {
    try {
      error = null;
      isCreating = true;

      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Folder for New Vault',
      });

      if (selected && typeof selected === 'string') {
        const vault = await invoke<Vault>('create_vault', { path: selected });
        currentVault.set(vault);
        await refreshNotes();
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to create vault';
      console.error('Error creating vault:', err);
    } finally {
      isCreating = false;
    }
  }
</script>

<div class="vault-picker">
  <div class="picker-content">
    <div class="header">
      <Icon name="folder" size={48} strokeWidth={1.5} />
      <h1>Welcome to Bismuth</h1>
      <p class="subtitle">Local-first knowledge management</p>
    </div>

    {#if error}
      <div class="error-message" role="alert">
        <Icon name="alert-circle" size={20} color="var(--color-danger)" ariaLabel="Error" />
        <span>{error}</span>
      </div>
    {/if}

    <div class="actions">
      <Button variant="primary" on:click={handleOpenVault} ariaLabel="Open existing vault">
        <Icon name="folder-open" size={20} ariaLabel="Folder icon" />
        <span>Open Existing Vault</span>
      </Button>

      <Button
        variant="secondary"
        on:click={handleCreateVault}
        disabled={isCreating}
        ariaLabel="Create new vault"
      >
        <Icon name="plus" size={20} ariaLabel="Plus icon" />
        <span>{isCreating ? 'Creating...' : 'Create New Vault'}</span>
      </Button>
    </div>

    <div class="info">
      <p class="info-text">A vault is a folder on your computer where all your notes are stored.</p>
    </div>
  </div>
</div>

<style>
  .vault-picker {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background: var(--color-surface);
  }

  .picker-content {
    background: var(--color-bg);
    border-radius: 4px;
    padding: var(--space-8);
    max-width: 480px;
    border: 1px solid var(--color-border);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    text-align: center;
  }

  .header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-4);
    margin-bottom: var(--space-6);
  }

  h1 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-text);
  }

  .subtitle {
    margin: 0;
    color: var(--color-text-muted);
    font-size: 0.875rem;
  }

  .error-message {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-4);
    margin-bottom: var(--space-6);
    background: #fee;
    border: 1px solid #fcc;
    border-radius: 4px;
    color: var(--color-danger);
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    margin-bottom: var(--space-6);
  }

  .info {
    padding-top: var(--space-6);
    border-top: 1px solid var(--color-border);
  }

  .info-text {
    margin: 0;
    font-size: 0.875rem;
    color: var(--color-text-muted);
    line-height: 1.5;
  }
</style>
