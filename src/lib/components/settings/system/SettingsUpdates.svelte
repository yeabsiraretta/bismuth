<script lang="ts">
  import { checkAppVersion } from '@/services/system/updates';
  import { settings } from '@/features/settings';
  import { log } from '@/utils/logger';

  let checking = false;
  let currentVersion = '';
  let lastChecked = '';
  let error = '';

  $: channel = $settings.updateChannel ?? 'release';
  $: isUnstableChannel = channel === 'alpha' || channel === 'beta';

  function handleChannelChange(e: Event) {
    const value = (e.target as HTMLSelectElement).value as 'alpha' | 'beta' | 'release';
    settings.update((s) => ({ ...s, updateChannel: value }));
    log.info('Update channel changed', { channel: value });
  }

  async function handleCheckForUpdates() {
    checking = true;
    error = '';
    try {
      const info = await checkAppVersion();
      currentVersion = info.currentVersion;
      lastChecked = new Date(info.checkedAt * 1000).toLocaleString();
      settings.update((s) => ({ ...s, lastUpdateCheck: info.checkedAt }));
    } catch (e) {
      error = 'Could not check version. Try again later.';
      log.error('Update check failed', e as Error);
    } finally {
      checking = false;
    }
  }
</script>

<div class="update-section">
  <div class="channel-row">
    <label class="channel-label" for="update-channel-select">Update Channel</label>
    <select
      id="update-channel-select"
      class="channel-select"
      value={channel}
      on:change={handleChannelChange}
    >
      <option value="release">Release (stable)</option>
      <option value="beta">Beta (release candidate)</option>
      <option value="alpha">Alpha (unstable)</option>
    </select>
  </div>

  {#if isUnstableChannel}
    <div class="channel-warning" role="alert" aria-live="polite">
      {#if channel === 'alpha'}
        Alpha builds are unstable and may contain serious bugs. Not recommended for daily use.
      {:else}
        Beta builds are release candidates and may contain known issues.
      {/if}
    </div>
  {/if}

  <div class="version-row">
    {#if currentVersion}
      <span class="version-badge">v{currentVersion}</span>
    {/if}
    <button
      class="check-btn"
      on:click={handleCheckForUpdates}
      disabled={checking}
      aria-label="Check for updates"
    >
      {checking ? 'Checking...' : 'Check for Updates'}
    </button>
  </div>

  {#if lastChecked}
    <p class="last-checked">Last checked: {lastChecked}</p>
  {/if}

  {#if error}
    <p class="error-msg" role="alert">{error}</p>
  {/if}

  <p class="update-hint">
    No network calls occur until you click the button above.
    Future releases will include an auto-update option.
  </p>
</div>

<style>
  .update-section { display: flex; flex-direction: column; gap: var(--spacing-s); }

  .channel-row {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
  }

  .channel-label {
    font-size: var(--font-ui-small);
    color: var(--text-muted);
    min-width: 120px;
  }

  .channel-select {
    padding: 4px 8px;
    border-radius: var(--radius-s);
    border: 1px solid var(--border-color);
    background: var(--background-secondary);
    color: var(--text-primary);
    font-size: var(--font-ui-small);
    cursor: pointer;
  }

  .channel-warning {
    background: var(--background-modifier-error);
    color: var(--text-error, #dc2626);
    border: 1px solid var(--color-danger, #dc2626);
    border-radius: var(--radius-s);
    padding: var(--spacing-xs) var(--spacing-m);
    font-size: var(--font-ui-small);
    font-weight: var(--font-medium);
  }

  .version-row { display: flex; align-items: center; gap: var(--spacing-s); }

  .version-badge {
    font-size: var(--font-ui-small);
    font-family: var(--font-monospace);
    color: var(--text-muted);
    background: var(--background-secondary);
    padding: 2px 8px;
    border-radius: var(--radius-s);
  }

  .check-btn {
    padding: var(--spacing-xs) var(--spacing-m);
    border-radius: var(--radius-s);
    border: 1px solid var(--interactive-accent);
    background: none;
    color: var(--interactive-accent);
    font-size: var(--font-ui-small);
    cursor: pointer;
    min-height: 32px;
  }

  .check-btn:hover { background: var(--interactive-accent); color: var(--text-on-accent); }
  .check-btn:disabled { opacity: 0.5; cursor: default; }

  .last-checked, .update-hint {
    font-size: var(--font-smallest);
    color: var(--text-muted);
    margin: 0;
  }

  .error-msg { color: var(--color-danger, #dc2626); font-size: var(--font-ui-small); margin: 0; }
</style>
