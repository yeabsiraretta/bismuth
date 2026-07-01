<script lang="ts">
  /**
   * SettingsVaultNas — NAS/WebDAV toggle and lazy-loaded config panel.
   * Mounted inside SettingsVault to keep that file under 300 lines.
   */
  import Icon from '@/components/icons/Icon.svelte';
  import { settings } from '@/features/settings';
  import { derived } from 'svelte/store';
  import { log } from '@/utils/logger';

  export let vaultPath: string;

  const nasEnabled = derived(settings, ($s) => $s.nasEnabled);
  let nasExpanded = false;
  let NasPanelComponent: typeof import('@/features/nas/components/NasPanel.svelte').default | null = null;

  $: if ($nasEnabled && nasExpanded && !NasPanelComponent) {
    import('@/features/nas/components/NasPanel.svelte')
      .then((m) => { NasPanelComponent = m.default; })
      .catch((err) => log.error('SettingsVaultNas: failed to load NasPanel', err as Error));
  }

  function handleNasToggle(e: Event) {
    const checked = (e.target as HTMLInputElement).checked;
    settings.update((s) => ({ ...s, nasEnabled: checked }));
    if (!checked) nasExpanded = false;
    log.info('SettingsVaultNas: nasEnabled toggled', { nasEnabled: checked });
  }

  function toggleExpanded() {
    nasExpanded = !nasExpanded;
  }
</script>

<div class="setting-group">
  <div class="nas-header">
    <h4>Network Storage (NAS)</h4>
    <button
      class="nas-expand-btn"
      aria-expanded={nasExpanded}
      on:click={toggleExpanded}
      aria-label="Toggle NAS configuration"
    >
      <Icon name={nasExpanded ? 'chevron-up' : 'chevron-down'} size={14} />
    </button>
  </div>

  <div class="setting-item">
    <label>
      <input type="checkbox" checked={$nasEnabled} on:change={handleNasToggle} />
      Enable network storage
    </label>
    <span class="setting-hint">Sync vault files with a WebDAV-compatible NAS device</span>
  </div>

  {#if nasExpanded}
    <div class="nas-panel-container">
      {#if $nasEnabled}
        {#if NasPanelComponent}
          <svelte:component this={NasPanelComponent} {vaultPath} nasEnabled={$nasEnabled} />
        {:else}
          <p class="setting-hint">Loading NAS panel...</p>
        {/if}
      {:else}
        <p class="setting-hint">Enable network storage above to configure WebDAV sync.</p>
      {/if}
    </div>
  {/if}
</div>

<style>
  .nas-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .nas-expand-btn {
    background: none;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    color: var(--text-muted);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    padding: 2px 4px;
    transition: background var(--transition-fast);
  }

  .nas-expand-btn:hover {
    background: var(--interactive-hover);
  }

  .nas-panel-container {
    margin-top: var(--spacing-s);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    overflow: hidden;
  }
</style>
