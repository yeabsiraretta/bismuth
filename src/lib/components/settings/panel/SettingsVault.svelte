<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import ConfirmDialog from '@/components/ui/layout/ConfirmDialog.svelte';
  import SettingsVaultNas from './SettingsVaultNas.svelte';
  import { SettingsBackup } from '@/features/backup';
  import { renameVaultDisplayName, removeFromRecentVaults } from '@/services/vault/vaultManagement';
  import { currentVault, notes } from '@/stores/vault/vault';
  import { log } from '@/utils/logger';

  $: noteCount = $notes.length;
  $: totalWords = $notes.reduce((sum, n) => sum + (n.content?.split(/\s+/).length || 0), 0);
  $: totalLinks = $notes.reduce((sum, n) => sum + ((n.content?.match(/\[\[/g) || []).length), 0);

  export let vaultName: string;
  export let vaultPath: string;
  export let enableGit: boolean;
  export let autoCommit: boolean;
  export let syncOnStartup: boolean;
  export let commitMessageTemplate: string;
  export let onOpenFolder: () => void;
  export let onClose: (() => void) | undefined = undefined;

  let renameInput = vaultName;
  let showRemoveConfirm = false;
  let showCloseConfirm = false;

  function handleRename() {
    const trimmed = renameInput.trim();
    if (!trimmed || trimmed === vaultName) return;
    renameVaultDisplayName(vaultPath, trimmed);
    vaultName = trimmed;
    log.info('Vault renamed', { newName: trimmed });
  }

  function handleCloseVault() {
    showCloseConfirm = true;
  }

  function confirmClose() {
    showCloseConfirm = false;
    currentVault.set(null);
    onClose?.();
    log.info('Vault closed');
  }

  function handleRemoveFromRecents() {
    showRemoveConfirm = true;
  }

  function confirmRemove() {
    showRemoveConfirm = false;
    removeFromRecentVaults(vaultPath);
    currentVault.set(null);
    onClose?.();
    log.info('Vault removed from recents');
  }
</script>

<div class="settings-section">
  <h3>Vault Settings</h3>

  <div class="setting-group">
    <h4>Current Vault</h4>

    <div class="setting-item">
      <label for="vault-name-edit">Vault Name</label>
      <div class="path-display">
        <input id="vault-name-edit" type="text" bind:value={renameInput} />
        <button class="btn-secondary" on:click={handleRename} disabled={renameInput.trim() === vaultName}>
          Rename
        </button>
      </div>
      <span class="setting-hint">Display name for this vault</span>
    </div>

    <div class="setting-item">
      <label for="vault-path-display">Vault Path</label>
      <div class="path-display">
        <input id="vault-path-display" type="text" value={vaultPath} disabled />
        <button class="btn-secondary" on:click={onOpenFolder}>
          <Icon name="folder-open" size={16} />
          Open Folder
        </button>
      </div>
      <span class="setting-hint">Location of vault on your file system</span>
    </div>

    <div class="setting-item">
      <label for="vault-stats">Vault Statistics</label>
      <div class="vault-stats">
        <div class="stat-item">
          <span class="stat-label">Total Notes:</span>
          <span class="stat-value">{noteCount}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Total Words:</span>
          <span class="stat-value">{totalWords.toLocaleString()}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Wikilinks:</span>
          <span class="stat-value">{totalLinks}</span>
        </div>
      </div>
    </div>
  </div>

  <div class="setting-group">
    <h4>Version Control</h4>

    <div class="setting-item">
      <label>
        <input type="checkbox" bind:checked={enableGit} />
        Enable Git integration
      </label>
      <span class="setting-hint">Track changes with Git version control</span>
    </div>

    {#if enableGit}
      <div class="setting-item">
        <label>
          <input type="checkbox" bind:checked={autoCommit} />
          Auto-commit changes
        </label>
        <span class="setting-hint">Automatically commit after saving notes</span>
      </div>

      <div class="setting-item">
        <label>
          <input type="checkbox" bind:checked={syncOnStartup} />
          Sync on startup
        </label>
        <span class="setting-hint">Pull latest changes when opening vault</span>
      </div>

      <div class="setting-item">
        <label for="commit-message-template">Commit Message Template</label>
        <input id="commit-message-template" type="text" bind:value={commitMessageTemplate} placeholder="Update [filename]" />
        <span class="setting-hint">Template for auto-commit messages. Use [filename] as placeholder for note name.</span>
      </div>
    {/if}
  </div>

  <SettingsBackup />

  <div class="setting-group">
    <h4>Sync</h4>
    <div class="setting-item">
      <label>
        <input type="checkbox" value={false} disabled />
        Cloud sync
      </label>
      <span class="setting-hint">Sync vault across devices (requires plugin)</span>
    </div>
  </div>

  <!-- NAS section (T24) — extracted to SettingsVaultNas for 300-line compliance -->
  <SettingsVaultNas {vaultPath} />

  <div class="setting-group">
    <h4>Danger Zone</h4>

    <div class="setting-item">
      <button class="btn-danger" on:click={handleCloseVault}>
        <Icon name="x-circle" size={16} />
        Close Vault
      </button>
      <span class="setting-hint">Close the current vault and return to welcome screen</span>
    </div>

    <div class="setting-item">
      <button class="btn-danger" on:click={handleRemoveFromRecents}>
        <Icon name="trash" size={16} />
        Remove from Recents
      </button>
      <span class="setting-hint">Remove this vault from recent list. Files on disk are NOT deleted.</span>
    </div>
  </div>
</div>

{#if showCloseConfirm}
  <ConfirmDialog
    title="Close Vault"
    message="Are you sure you want to close this vault? You can reopen it later."
    confirmLabel="Close"
    onConfirm={confirmClose}
    onClose={() => (showCloseConfirm = false)}
  />
{/if}

{#if showRemoveConfirm}
  <ConfirmDialog
    title="Remove from Recents"
    message="Remove this vault from the recent list? Your files on disk will NOT be deleted."
    confirmLabel="Remove"
    variant="danger"
    onConfirm={confirmRemove}
    onClose={() => (showRemoveConfirm = false)}
  />
{/if}

<style>
  .path-display {
    display: flex;
    gap: var(--spacing-s);
    align-items: center;
  }

  .path-display input {
    flex: 1;
  }

  .btn-secondary {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-s);
    padding: var(--spacing-s) var(--spacing-s);
    background: var(--background-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    color: var(--text-normal);
    font-size: var(--font-ui-small);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .btn-secondary:hover {
    background: var(--interactive-hover);
  }

  .vault-stats {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-s);
    padding: var(--spacing-s);
    background: var(--background-secondary);
    border-radius: var(--radius-s);
    margin-top: var(--spacing-s);
  }

  .stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .stat-label {
    font-size: var(--font-ui-small);
    color: var(--text-muted);
  }

  .stat-value {
    font-size: var(--font-ui-small);
    font-weight: var(--font-medium);
    color: var(--text-normal);
  }

  .btn-danger {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-s);
    padding: var(--spacing-s) var(--spacing-m);
    background: var(--color-error, #ef4444);
    border: none;
    border-radius: var(--radius-s);
    color: white;
    font-size: var(--font-ui-small);
    font-weight: var(--font-medium);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .btn-danger:hover:not(:disabled) {
    opacity: 0.9;
  }

  .btn-danger:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
