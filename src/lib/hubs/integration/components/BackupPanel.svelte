<script lang="ts">
  import { onMount } from 'svelte';
  import Panel from '@/ui/panel.svelte';
  import { createBackup, listBackups, deleteBackup, type BackupInfo } from '@/sal/backup-service';
  import {
    createNasBackup,
    listNasBackups,
    deleteNasBackup,
    restoreNasBackup,
    type NasBackupMeta,
  } from '@/sal/nas-backup-service';
  import { getIntegration } from '@/hubs/core/stores/settings-store.svelte';
  import { rescanVault } from '@/hubs/core/stores/vault-store.svelte';

  let backups = $state<BackupInfo[]>([]);
  let nasBackups = $state<NasBackupMeta[]>([]);
  let isRunning = $state(false);
  let nasRunning = $state(false);
  let nasRestoring = $state(false);
  let error = $state('');
  let nasError = $state('');
  let nasSuccess = $state('');

  let integration = $derived(getIntegration());

  onMount(() => {
    refresh();
    refreshNas();
  });

  async function refresh() {
    try {
      const result = await listBackups();
      backups = result.backups;
    } catch {
      /* browser fallback */
    }
  }

  async function refreshNas() {
    if (!integration.nasEnabled || !integration.nasPath) return;
    try {
      nasBackups = await listNasBackups();
    } catch {
      /* ignore */
    }
  }

  async function runBackup() {
    isRunning = true;
    error = '';
    try {
      await createBackup();
      await refresh();
    } catch (e) {
      error = String(e);
    } finally {
      isRunning = false;
    }
  }

  async function runNasBackup() {
    nasRunning = true;
    nasError = '';
    nasSuccess = '';
    try {
      const result = await createNasBackup();
      if (result.success) {
        nasSuccess = `Backup created — ${result.meta?.noteCount ?? 0} notes`;
        await refreshNas();
      } else {
        nasError = result.error ?? 'Backup failed';
      }
    } catch (e) {
      nasError = String(e);
    } finally {
      nasRunning = false;
    }
  }

  async function handleNasRestore(snapshotPath: string) {
    if (!confirm('Restore will overwrite your current vault contents. Continue?')) return;
    nasRestoring = true;
    nasError = '';
    nasSuccess = '';
    try {
      const result = await restoreNasBackup(snapshotPath);
      if (result.success) {
        nasSuccess = `Restored ${result.noteCount ?? 0} notes. Rescanning vault…`;
        await rescanVault();
      } else {
        nasError = result.error ?? 'Restore failed';
      }
    } catch (e) {
      nasError = String(e);
    } finally {
      nasRestoring = false;
    }
  }

  async function removeNas(snapshotPath: string) {
    try {
      await deleteNasBackup(snapshotPath);
      await refreshNas();
    } catch (e) {
      nasError = String(e);
    }
  }

  async function remove(path: string) {
    try {
      await deleteBackup(path);
      await refresh();
    } catch (e) {
      error = String(e);
    }
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  function formatDate(ts: number): string {
    return new Date(ts).toLocaleString();
  }
</script>

<Panel title="Backup">
  <div class="backup-panel">
    <h3 class="backup-section-title">Local Backup</h3>

    {#if error}
      <div class="backup-error">{error}</div>
    {/if}

    <button class="backup-btn" onclick={runBackup} disabled={isRunning}>
      {isRunning ? 'Backing up…' : 'Backup Now'}
    </button>

    {#if backups.length > 0}
      <ul class="backup-list">
        {#each backups as b (b.path)}
          <li class="backup-item">
            <div class="backup-info">
              <span class="backup-date">{formatDate(b.createdAt)}</span>
              <span class="backup-meta">{b.noteCount} notes · {formatSize(b.sizeBytes)}</span>
            </div>
            <button class="backup-delete" onclick={() => remove(b.path)} title="Delete backup"
              >×</button
            >
          </li>
        {/each}
      </ul>
    {:else}
      <div class="panel-empty">
        No local backups yet
        <div class="panel-empty-hint">Click Backup Now to create one</div>
      </div>
    {/if}

    {#if integration.nasEnabled}
      <div class="backup-divider"></div>
      <h3 class="backup-section-title">NAS Backup</h3>

      {#if !integration.nasPath}
        <div class="backup-warning">Configure NAS path in Settings → Integration</div>
      {:else}
        <div class="nas-path-display">{integration.nasPath}</div>

        {#if nasError}
          <div class="backup-error">{nasError}</div>
        {/if}
        {#if nasSuccess}
          <div class="backup-success">{nasSuccess}</div>
        {/if}

        <div class="nas-actions">
          <button class="backup-btn" onclick={runNasBackup} disabled={nasRunning || nasRestoring}>
            {nasRunning ? 'Backing up…' : 'Backup to NAS'}
          </button>
        </div>

        {#if nasBackups.length > 0}
          <ul class="backup-list">
            {#each nasBackups as nb (nb.id)}
              <li class="backup-item">
                <div class="backup-info">
                  <span class="backup-date">{formatDate(nb.createdAt)}</span>
                  <span class="backup-meta">{nb.noteCount} notes · {formatSize(nb.sizeBytes)}</span>
                </div>
                <div class="backup-item-actions">
                  <button
                    class="backup-restore"
                    onclick={() => handleNasRestore(nb.snapshotPath)}
                    disabled={nasRestoring}
                    title="Restore from this backup">Restore</button
                  >
                  <button
                    class="backup-delete"
                    onclick={() => removeNas(nb.snapshotPath)}
                    title="Delete backup">×</button
                  >
                </div>
              </li>
            {/each}
          </ul>
        {:else}
          <div class="panel-empty">
            No NAS backups yet
            <div class="panel-empty-hint">Click Backup to NAS to create one</div>
          </div>
        {/if}
      {/if}
    {/if}
  </div>
</Panel>

<style>
  .backup-panel {
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .backup-section-title {
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-text-subtle);
    margin: 0;
  }
  .backup-error {
    font-size: 0.7rem;
    color: var(--color-error);
    padding: 4px 8px;
    background: oklch(from var(--color-error) l c h / 0.1);
    border-radius: var(--radius-s);
  }
  .backup-success {
    font-size: 0.7rem;
    color: var(--color-success);
    padding: 4px 8px;
    background: oklch(from var(--color-success) l c h / 0.1);
    border-radius: var(--radius-s);
  }
  .backup-warning {
    font-size: 0.7rem;
    color: var(--color-warning);
    padding: 4px 8px;
    background: oklch(from var(--color-warning) l c h / 0.1);
    border-radius: var(--radius-s);
  }
  .backup-btn {
    padding: 6px 12px;
    font-size: 0.75rem;
    border: 1px solid var(--color-accent);
    background: transparent;
    color: var(--color-accent);
    border-radius: var(--radius-s);
    cursor: pointer;
    transition: all var(--transition-base);
    font-family: inherit;
  }
  .backup-btn:hover:not(:disabled) {
    background: var(--color-accent);
    color: var(--color-background);
  }
  .backup-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .backup-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .backup-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 4px;
    border-bottom: 1px solid var(--color-border);
  }
  .backup-info {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
    flex: 1;
  }
  .backup-date {
    font-size: 0.7rem;
    color: var(--color-text);
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .backup-meta {
    font-size: 0.6rem;
    color: var(--color-text-muted);
  }
  .backup-item-actions {
    display: flex;
    gap: 4px;
    align-items: center;
    flex-shrink: 0;
  }
  .backup-restore {
    font-size: 0.6rem;
    padding: 2px 6px;
    border: 1px solid var(--color-success);
    background: transparent;
    color: var(--color-success);
    border-radius: var(--radius-s);
    cursor: pointer;
    font-family: inherit;
  }
  .backup-restore:hover:not(:disabled) {
    background: var(--color-success);
    color: var(--color-background);
  }
  .backup-restore:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .backup-delete {
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    font-size: 1rem;
    padding: 2px 6px;
  }
  .backup-delete:hover {
    color: var(--color-error);
  }
  .backup-divider {
    height: 1px;
    background: var(--color-border);
    margin: 4px 0;
  }
  .nas-path-display {
    font-size: 0.65rem;
    color: var(--color-text-muted);
    font-family: var(--font-mono);
    padding: 4px 6px;
    background: var(--color-background);
    border-radius: var(--radius-s);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .nas-actions {
    display: flex;
    gap: 6px;
  }
</style>
