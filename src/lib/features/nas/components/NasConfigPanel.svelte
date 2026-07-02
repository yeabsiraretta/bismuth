<script lang="ts">
  /**
   * NasConfigPanel — NAS settings UI (Vault tab in Settings modal).
   *
   * SECURITY:
   * - Password uses type="password" — never displays stored password.
   * - Password lives only in a local `let password` variable — no $: reactive chain.
   * - Password is cleared immediately after connectNas() resolves (success or error).
   * - This component MUST NOT call invoke() — all actions via nasStore.
   */
  import {
    nasConfig,
    syncStatus,
    lastSyncAt,
    connectNas,
    disconnectNas,
    syncNow,
    updateConfig,
  } from '../stores/nasStore';
  import { log } from '@/utils/logger';

  export let vaultPath: string = '';
  export let nasEnabled: boolean = false;

  let url = '';
  let username = '';
  let password = ''; // Never in a $: reactive chain — security requirement
  let connecting = false;
  let syncing = false;
  let error: string | null = null;
  let success: string | null = null;

  $: urlValid = /^https?:\/\/.+/.test(url.trim());
  $: connectDisabled = !urlValid || connecting;
  $: showHttpWarning = url.trim().startsWith('http://') && url.trim().length > 7;
  $: config = $nasConfig;
  $: status = $syncStatus;
  $: lastSync = $lastSyncAt;
  $: statusLabel =
    (
      {
        disabled: 'Disabled',
        disconnected: 'Not connected',
        syncing: 'Syncing...',
        synced: 'Synced',
        pending: 'Pending (offline)',
        conflict: 'Conflicts detected',
      } as Record<string, string>
    )[status] ?? status;

  async function handleConnect(): Promise<void> {
    if (!urlValid) return;
    connecting = true;
    error = null;
    success = null;
    try {
      await connectNas(url.trim(), username.trim(), password);
      success = 'Connected successfully.';
      url = '';
      username = '';
    } catch (err) {
      error = `Connection failed: ${err}`;
      log.error('NasConfigPanel: connect failed', err as Error);
    } finally {
      password = ''; // Always clear password after attempt
      connecting = false;
    }
  }

  async function handleDisconnect(): Promise<void> {
    await disconnectNas();
    success = null;
    error = null;
  }

  async function handleSyncNow(): Promise<void> {
    syncing = true;
    error = null;
    success = null;
    try {
      await syncNow();
      success = 'Sync complete.';
    } catch (err) {
      error = `Sync failed: ${err}`;
    } finally {
      syncing = false;
    }
  }

  async function handleOfflineToggle(e: Event): Promise<void> {
    const val = (e.target as HTMLInputElement).checked;
    if (!vaultPath || !config) return;
    try {
      await updateConfig(vaultPath, { offlineModeEnabled: val });
    } catch (err) {
      log.error('NasConfigPanel: failed to update offline mode', err as Error);
    }
  }
</script>

<div class="nas-panel">
  {#if !nasEnabled}
    <div class="disabled-notice">
      <p>NAS access is disabled.</p>
      <p>
        Enable it in <strong>Settings &gt; Feature Flags</strong> to configure WebDAV vault sync.
      </p>
    </div>
  {:else}
    <h2 class="panel-title">NAS / WebDAV Sync</h2>

    {#if config}
      <div class="status-row">
        <span class="lbl">Status:</span><span class="val val--{status}">{statusLabel}</span>
      </div>
      <div class="status-row">
        <span class="lbl">Server:</span><span class="val">{config.url}</span>
      </div>
      <div class="status-row">
        <span class="lbl">User:</span><span class="val">{config.username}</span>
      </div>
      {#if lastSync}<div class="status-row">
          <span class="lbl">Last sync:</span><span class="val"
            >{new Date(lastSync).toLocaleString()}</span
          >
        </div>{/if}
      <label class="toggle-label">
        <input
          type="checkbox"
          checked={config.offlineModeEnabled}
          on:change={handleOfflineToggle}
        />
        Enable offline mode
      </label>
      <p class="field-hint">
        When enabled, sync failures queue changes locally instead of disconnecting.
      </p>
      <div class="action-row">
        <button class="btn btn--primary" disabled={syncing} on:click={handleSyncNow}
          >{syncing ? 'Syncing...' : 'Sync Now'}</button
        >
        <button class="btn btn--danger" on:click={handleDisconnect}>Disconnect</button>
      </div>
    {:else}
      <p class="form-intro">
        Connect your vault to a WebDAV-enabled NAS (Synology, QNAP, Nextcloud, etc.).
      </p>
      <label class="field-label" for="nas-url">WebDAV URL</label>
      <input
        id="nas-url"
        type="url"
        placeholder="https://192.168.1.100/dav"
        bind:value={url}
        class="field-input"
        autocomplete="off"
      />
      {#if showHttpWarning}<p class="field-warn">
          HTTP connection — credentials sent in plain text on this network.
        </p>{/if}
      <label class="field-label" for="nas-username">Username</label>
      <input
        id="nas-username"
        type="text"
        placeholder="admin"
        bind:value={username}
        class="field-input"
        autocomplete="username"
      />
      <label class="field-label" for="nas-password">Password</label>
      <!-- type="password" required — security: never change to text -->
      <input
        id="nas-password"
        type="password"
        placeholder="••••••••"
        bind:value={password}
        class="field-input"
        autocomplete="current-password"
      />
      <p class="field-hint">Password is stored in the OS keychain and never saved to disk.</p>
      <button class="btn btn--primary" disabled={connectDisabled} on:click={handleConnect}
        >{connecting ? 'Connecting...' : 'Connect'}</button
      >
    {/if}

    {#if error}<div class="alert alert--error" role="alert">{error}</div>{/if}
    {#if success}<div class="alert alert--success" role="status">{success}</div>{/if}
  {/if}
</div>

<style>
  .nas-panel {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-m, 12px);
    padding: var(--spacing-m, 12px);
    max-width: 480px;
  }
  .panel-title {
    font-size: var(--font-ui-medium, 15px);
    font-weight: 600;
    color: var(--text-normal, #111827);
    margin: 0;
  }
  .disabled-notice {
    padding: var(--spacing-m, 12px);
    background-color: var(--background-secondary, #f9fafb);
    border: 1px solid var(--border-color, #e5e7eb);
    border-radius: var(--radius-m, 6px);
    font-size: var(--font-ui-small, 13px);
    color: var(--text-muted, #6b7280);
  }
  .status-row {
    display: flex;
    align-items: center;
    gap: var(--spacing-s, 8px);
    font-size: var(--font-ui-small, 13px);
  }
  .lbl {
    color: var(--text-muted, #6b7280);
    width: 80px;
    flex-shrink: 0;
  }
  .val {
    color: var(--text-normal, #111827);
  }
  .val--synced {
    color: var(--text-success, #065f46);
  }
  .val--conflict {
    color: var(--text-warning, #92400e);
  }
  .val--disconnected {
    color: var(--text-error, #991b1b);
  }
  .toggle-label {
    display: flex;
    align-items: center;
    gap: var(--spacing-s, 8px);
    font-size: var(--font-ui-small, 13px);
    color: var(--text-normal, #111827);
    cursor: pointer;
  }
  .action-row {
    display: flex;
    gap: var(--spacing-s, 8px);
    flex-wrap: wrap;
  }
  .form-intro {
    font-size: var(--font-ui-small, 13px);
    color: var(--text-muted, #6b7280);
    margin: 0;
  }
  .field-label {
    display: block;
    font-size: var(--font-ui-smaller, 11px);
    font-weight: 600;
    color: var(--text-muted, #6b7280);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: var(--spacing-xs, 4px);
  }
  .field-input {
    display: block;
    width: 100%;
    padding: var(--spacing-s, 8px) var(--spacing-m, 12px);
    background-color: var(--background-modifier-form-field, #f9fafb);
    border: 1px solid var(--border-color, #d1d5db);
    border-radius: var(--radius-s, 4px);
    color: var(--text-normal, #111827);
    font-size: var(--font-ui-small, 13px);
    box-sizing: border-box;
  }
  .field-input:focus {
    outline: none;
    border-color: var(--interactive-accent, #3b82f6);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }
  .field-hint {
    font-size: var(--font-ui-smaller, 11px);
    color: var(--text-muted, #9ca3af);
    margin: 0;
  }
  .field-warn {
    font-size: var(--font-ui-smaller, 11px);
    color: var(--text-warning, #92400e);
    background-color: var(--background-modifier-warning, #fef3c7);
    border: 1px solid var(--border-warning, #f59e0b);
    border-radius: var(--radius-s, 4px);
    padding: var(--spacing-xs, 4px) var(--spacing-s, 8px);
    margin: 0;
  }
  .btn {
    padding: var(--spacing-s, 8px) var(--spacing-m, 12px);
    border: none;
    border-radius: var(--radius-s, 4px);
    font-size: var(--font-ui-small, 13px);
    font-weight: 500;
    cursor: pointer;
    transition:
      background-color 0.15s,
      opacity 0.15s;
  }
  .btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .btn--primary {
    background-color: var(--interactive-accent, #3b82f6);
    color: var(--text-on-accent, #fff);
  }
  .btn--primary:hover:not(:disabled) {
    background-color: var(--interactive-accent-hover, #2563eb);
  }
  .btn--danger {
    background-color: var(--background-modifier-error, #fee2e2);
    color: var(--text-error, #991b1b);
    border: 1px solid var(--border-error, #fca5a5);
  }
  .alert {
    padding: var(--spacing-s, 8px) var(--spacing-m, 12px);
    border-radius: var(--radius-s, 4px);
    font-size: var(--font-ui-small, 13px);
  }
  .alert--error {
    background-color: var(--background-modifier-error, #fee2e2);
    color: var(--text-error, #991b1b);
    border: 1px solid var(--border-error, #fca5a5);
  }
  .alert--success {
    background-color: var(--background-modifier-success, #d1fae5);
    color: var(--text-success, #065f46);
    border: 1px solid var(--border-success, #6ee7b7);
  }
</style>
