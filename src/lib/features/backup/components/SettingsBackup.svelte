<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import Spinner from '@/components/ui/feedback/Spinner.svelte';
  import {
    backupConfig,
    backupList,
    isBackingUp,
    lastBackup,
    backupCount,
    triggerBackup,
    updateConfig,
    loadBackupState,
  } from '../stores/backupStore';
  import { deleteBackup } from '../services/backupService';
  import { showToast } from '@/stores/toast/toast';
  import { onMount } from 'svelte';
  import type { BackupConfig } from '../types';

  let localConfig: BackupConfig = { ...$backupConfig };
  let customBackupName = '';
  let dirty = false;

  $: (localConfig, (dirty = JSON.stringify(localConfig) !== JSON.stringify($backupConfig)));

  onMount(() => {
    loadBackupState().then(() => {
      localConfig = { ...$backupConfig };
    });
  });

  async function handleSave() {
    await updateConfig(localConfig);
    dirty = false;
    showToast('Backup settings saved', 'success');
  }

  async function handleBackupNow() {
    const name = customBackupName.trim() || undefined;
    await triggerBackup(name);
    customBackupName = '';
  }

  async function handleDelete(filePath: string, fileName: string) {
    try {
      await deleteBackup(filePath);
      backupList.update((list) => list.filter((b) => b.file_path !== filePath));
      showToast(`Deleted ${fileName}`, 'info');
    } catch {
      showToast('Failed to delete backup', 'error');
    }
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  }
</script>

<div class="settings-section stack stack-md">
  <div class="section-header">
    <h3>Backup</h3>
    <p class="setting-hint">Automatically back up your vault as zip archives.</p>
  </div>

  <div class="setting-group">
    <h4>General</h4>
    <div class="setting-item">
      <label><input type="checkbox" bind:checked={localConfig.enabled} /> Enable backups</label>
      <span class="setting-hint">Master switch for all backup features</span>
    </div>
    {#if localConfig.enabled}
      <div class="setting-item">
        <label
          ><input type="checkbox" bind:checked={localConfig.backup_on_startup} /> Backup on startup</label
        >
      </div>
      <div class="setting-item">
        <label
          ><input type="checkbox" bind:checked={localConfig.backup_on_quit} /> Backup on quit</label
        >
      </div>
      <div class="setting-item">
        <label for="backup-interval">Interval (minutes, 0 = off)</label>
        <input
          id="backup-interval"
          type="number"
          min="0"
          max="1440"
          bind:value={localConfig.interval_minutes}
        />
        <span class="setting-hint">Recommended: 10 min or more to avoid performance impact</span>
      </div>
      <div class="setting-item">
        <label for="backup-max">Max backups to keep (0 = unlimited)</label>
        <input
          id="backup-max"
          type="number"
          min="0"
          max="999"
          bind:value={localConfig.max_backups}
        />
      </div>
    {/if}
  </div>

  {#if localConfig.enabled}
    <div class="setting-group">
      <h4>Output</h4>
      <div class="setting-item">
        <label for="backup-path">Output path (empty = vault/.backups)</label>
        <input
          id="backup-path"
          type="text"
          bind:value={localConfig.output_path}
          placeholder=".backups"
        />
      </div>
      <div class="setting-item">
        <label for="backup-template">File name template</label>
        <input
          id="backup-template"
          type="text"
          bind:value={localConfig.file_name_template}
          placeholder="Backup-%Y_%m_%d-%H_%M_%S"
        />
        <span class="setting-hint">Uses strftime tokens: %Y, %m, %d, %H, %M, %S</span>
      </div>
    </div>

    <div class="setting-group">
      <h4>Filters</h4>
      <div class="setting-item">
        <label for="backup-include">Included directories/files (comma-separated)</label>
        <input
          id="backup-include"
          type="text"
          bind:value={localConfig.included_patterns}
          placeholder="Empty = entire vault"
        />
        <span class="setting-hint">e.g. .obsidian, Templates, *.canvas</span>
      </div>
      <div class="setting-item">
        <label for="backup-exclude">Excluded directories/files (comma-separated)</label>
        <input
          id="backup-exclude"
          type="text"
          bind:value={localConfig.excluded_patterns}
          placeholder=".git, .trash, node_modules"
        />
        <span class="setting-hint">e.g. .git, .trash, node_modules, *.mp4</span>
      </div>
    </div>

    <div class="setting-group">
      <h4>Reliability</h4>
      <div class="setting-item">
        <label for="backup-retry">Retry attempts</label>
        <input
          id="backup-retry"
          type="number"
          min="1"
          max="5"
          bind:value={localConfig.retry_count}
        />
      </div>
      <div class="setting-item">
        <label for="backup-delay">Retry delay (ms)</label>
        <input
          id="backup-delay"
          type="number"
          min="500"
          max="30000"
          step="500"
          bind:value={localConfig.retry_delay_ms}
        />
      </div>
    </div>
  {/if}

  <div class="setting-group button-row">
    <button class="btn btn-primary" on:click={handleSave} disabled={!dirty}> Save Settings </button>
  </div>

  <div class="setting-group">
    <h4>Manual Backup</h4>
    <div class="setting-item inline-row">
      <input
        type="text"
        bind:value={customBackupName}
        placeholder="Custom name (optional)"
        class="backup-name-input"
      />
      <button class="btn btn-secondary" on:click={handleBackupNow} disabled={$isBackingUp}>
        {#if $isBackingUp}<Spinner size="sm" />{:else}<Icon name="archive" size={14} />{/if}
        Backup Now
      </button>
    </div>
    {#if $lastBackup}
      <span class="setting-hint"
        >Last: {$lastBackup.file_name} ({formatSize($lastBackup.size_bytes)})</span
      >
    {/if}
  </div>

  {#if $backupList.length > 0}
    <div class="setting-group">
      <h4>Existing Backups ({$backupCount})</h4>
      <div class="backup-list">
        {#each $backupList as backup (backup.file_path)}
          <div class="backup-item">
            <div class="backup-meta">
              <span class="backup-name">{backup.file_name}</span>
              <span class="backup-detail"
                >{formatSize(backup.size_bytes)} &middot; {formatDate(backup.created_at)}</span
              >
            </div>
            <button
              class="btn-icon-sm"
              title="Delete"
              on:click={() => handleDelete(backup.file_path, backup.file_name)}
            >
              <Icon name="trash-2" size={14} />
            </button>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .button-row {
    display: flex;
    gap: var(--spacing-sm);
  }

  .inline-row {
    display: flex;
    gap: var(--spacing-sm);
    align-items: center;
  }

  .backup-name-input {
    flex: 1;
    min-width: 0;
  }

  .backup-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    max-height: 200px;
    overflow-y: auto;
  }

  .backup-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px var(--spacing-sm);
    border-radius: var(--radius-sm);
  }

  .backup-item:hover {
    background-color: var(--background-modifier-hover);
  }

  .backup-meta {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .backup-name {
    font-size: var(--font-size-sm);
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .backup-detail {
    font-size: var(--font-size-xs);
    color: var(--text-muted);
  }

  .btn-icon-sm {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    background: none;
    border: none;
    border-radius: var(--radius-sm);
    color: var(--text-muted);
    cursor: pointer;
    flex-shrink: 0;
  }

  .btn-icon-sm:hover {
    color: var(--text-error, #dc2626);
    background-color: color-mix(in srgb, var(--text-error, #dc2626) 10%, transparent);
  }
</style>
