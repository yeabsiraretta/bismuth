<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';

  export let vaultName: string;
  export let vaultPath: string;
  export let enableGit: boolean;
  export let autoCommit: boolean;
  export let syncOnStartup: boolean;
  export let onOpenFolder: () => void;
</script>

<div class="settings-section">
  <h3>Vault Settings</h3>

  <div class="setting-group">
    <h4>Current Vault</h4>

    <div class="setting-item">
      <label for="vault-name-display">Vault Name</label>
      <input id="vault-name-display" type="text" value={vaultName} disabled />
      <span class="setting-hint">Name of the current vault</span>
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
          <span class="stat-value">--</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Total Size:</span>
          <span class="stat-value">--</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Created:</span>
          <span class="stat-value">--</span>
        </div>
      </div>
      <span class="setting-hint">Statistics coming soon</span>
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
        <input id="commit-message-template" type="text" value="Update note" disabled />
        <span class="setting-hint">Template for auto-commit messages (coming soon)</span>
      </div>
    {/if}
  </div>

  <div class="setting-group">
    <h4>Backup & Sync</h4>

    <div class="setting-item">
      <label>
        <input type="checkbox" value={false} disabled />
        Enable automatic backups
      </label>
      <span class="setting-hint">Create periodic backups of your vault (coming soon)</span>
    </div>

    <div class="setting-item">
      <label>
        <input type="checkbox" value={false} disabled />
        Cloud sync
      </label>
      <span class="setting-hint">Sync vault across devices (coming soon)</span>
    </div>
  </div>

  <div class="setting-group">
    <h4>Danger Zone</h4>

    <div class="setting-item">
      <button class="btn-danger" disabled>
        <Icon name="trash" size={16} />
        Close Vault
      </button>
      <span class="setting-hint">Close the current vault and return to welcome screen</span>
    </div>
  </div>
</div>

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
