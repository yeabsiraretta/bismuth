<script lang="ts">
  /**
   * NasPanel — top-level NAS sidebar panel with Config / Sync Status tabs.
   *
   * Config tab: NasConfigPanel
   * Sync tab: NasSyncStatus + NasConflictDialog (when conflicts exist)
   */
  import NasConfigPanel from './NasConfigPanel.svelte';
  import NasSyncStatus from './NasSyncStatus.svelte';
  import NasConflictDialog from './NasConflictDialog.svelte';
  import { conflicts, syncNow } from '../stores/nasStore';
  import { log } from '@/utils/logger';

  export let vaultPath: string = '';
  export let nasEnabled: boolean = false;

  type TabId = 'config' | 'sync';
  let activeTab: TabId = 'config';

  let showConflictDialog = false;

  $: conflictCount = $conflicts.length;

  function openConflicts() {
    showConflictDialog = true;
  }

  async function handleSyncNow() {
    try {
      await syncNow();
    } catch (err) {
      log.error('[NasPanel] syncNow failed', err as Error);
    }
  }
</script>

<div class="nas-panel-root">
  <!-- Tab bar -->
  <div class="tab-bar" role="tablist" aria-label="NAS panel tabs">
    <button
      class="tab-btn"
      class:active={activeTab === 'config'}
      role="tab"
      aria-selected={activeTab === 'config'}
      on:click={() => {
        activeTab = 'config';
      }}>Config</button
    >
    <button
      class="tab-btn"
      class:active={activeTab === 'sync'}
      role="tab"
      aria-selected={activeTab === 'sync'}
      on:click={() => {
        activeTab = 'sync';
      }}
    >
      Sync
      {#if conflictCount > 0}
        <span class="conflict-badge" aria-label="{conflictCount} conflicts">{conflictCount}</span>
      {/if}
    </button>
  </div>

  <!-- Tab content -->
  {#if activeTab === 'config'}
    <NasConfigPanel {vaultPath} {nasEnabled} />
  {:else}
    <div class="sync-tab">
      <NasSyncStatus onOpenConflicts={openConflicts} />

      <button class="btn btn--primary" on:click={handleSyncNow} aria-label="Sync Now">
        Sync Now
      </button>

      {#if conflictCount > 0}
        <button
          class="btn btn--secondary"
          on:click={() => {
            showConflictDialog = true;
          }}
        >
          Resolve {conflictCount} conflict{conflictCount !== 1 ? 's' : ''}
        </button>
      {/if}
    </div>
  {/if}
</div>

{#if showConflictDialog && conflictCount > 0}
  <NasConflictDialog
    onClose={() => {
      showConflictDialog = false;
    }}
  />
{/if}

<style>
  .nas-panel-root {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .tab-bar {
    display: flex;
    border-bottom: 1px solid var(--background-modifier-border, #313244);
    background: var(--background-secondary, #1e1e2e);
    flex-shrink: 0;
  }

  .tab-btn {
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--text-muted, #a6adc8);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: var(--font-ui-small, 11px);
    font-weight: 500;
    padding: 8px 14px;
    transition:
      color 0.1s,
      border-color 0.1s;
  }

  .tab-btn:hover {
    color: var(--text-normal, #cdd6f4);
  }

  .tab-btn.active {
    border-bottom-color: var(--interactive-accent, #6366f1);
    color: var(--text-normal, #cdd6f4);
    font-weight: 600;
  }

  .conflict-badge {
    background: var(--text-warning, #f9e2af);
    color: #1e1e2e;
    border-radius: 99px;
    font-size: 9px;
    font-weight: 700;
    min-width: 16px;
    padding: 1px 4px;
    text-align: center;
  }

  .sync-tab {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-m, 12px);
    padding: var(--spacing-m, 12px);
    flex: 1;
    overflow: auto;
  }

  .btn {
    border: none;
    border-radius: var(--radius-s, 4px);
    cursor: pointer;
    font-size: var(--font-ui-small, 11px);
    font-weight: 600;
    padding: 6px 14px;
    align-self: flex-start;
    transition: filter 0.1s;
  }

  .btn:hover {
    filter: brightness(1.1);
  }

  .btn--primary {
    background: var(--interactive-accent, #6366f1);
    color: #fff;
  }

  .btn--secondary {
    background: var(--background-modifier-hover, #313244);
    border: 1px solid var(--background-modifier-border, #45475a);
    color: var(--text-normal, #cdd6f4);
  }
</style>
