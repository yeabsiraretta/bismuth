<script lang="ts">
  /**
   * NasSyncStatus — compact sidebar sync status indicator.
   *
   * Reads from nasStore.syncStatus and nasStore.pendingCount only.
   * Dispatches openConflicts event when the conflict indicator is clicked.
   * Renders nothing when syncStatus is 'disabled'.
   * MUST NOT exceed 80 lines (body).
   */
  import { syncStatus, pendingCount, lastSyncAt } from '../stores/nasStore';

  export let onOpenConflicts: (() => void) | undefined = undefined;

  $: status = $syncStatus;
  $: pending = $pendingCount;
  $: lastSync = $lastSyncAt
    ? new Date($lastSyncAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;
</script>

{#if status !== 'disabled'}
  <div class="nas-status nas-status--{status}" role="status" aria-label="NAS sync status: {status}">
    <span class="status-icon" aria-hidden="true">
      {#if status === 'synced'}&#10003;
      {:else if status === 'syncing'}<span class="spinner"></span>
      {:else if status === 'pending'}&#9202;
      {:else if status === 'conflict'}
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <span
          class="conflict-icon"
          on:click={() => onOpenConflicts?.()}
          role="button"
          tabindex="0"
          aria-label="View conflicts">&#9888;</span
        >
      {:else if status === 'disconnected'}&#9747;
      {/if}
    </span>

    <span class="status-label">
      {#if status === 'synced'}Synced{#if lastSync}
          &middot; {lastSync}{/if}
      {:else if status === 'syncing'}Syncing&hellip;
      {:else if status === 'pending'}{pending} change{pending !== 1 ? 's' : ''} pending
      {:else if status === 'conflict'}{pending} conflict{pending !== 1 ? 's' : ''}
      {:else if status === 'disconnected'}Not connected
      {/if}
    </span>
  </div>
{/if}

<style>
  .nas-status {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs, 4px);
    font-size: var(--font-ui-small, 11px);
    padding: 2px 6px;
  }

  .status-icon {
    font-size: 12px;
    flex-shrink: 0;
  }

  .nas-status--synced .status-label {
    color: var(--text-success, #a6e3a1);
  }
  .nas-status--syncing .status-label {
    color: var(--text-muted, #a6adc8);
  }
  .nas-status--pending .status-label {
    color: var(--text-warning, #f9e2af);
  }
  .nas-status--conflict .status-label {
    color: var(--text-warning, #f9e2af);
  }
  .nas-status--disconnected .status-label {
    color: var(--text-error, #f38ba8);
  }

  .conflict-icon {
    cursor: pointer;
  }
  .conflict-icon:hover {
    opacity: 0.8;
  }

  .spinner {
    display: inline-block;
    width: 10px;
    height: 10px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-top-color: var(--interactive-accent, #6366f1);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
