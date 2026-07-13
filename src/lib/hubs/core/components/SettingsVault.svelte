<script lang="ts">
  import { getNotes, getVault } from '@/hubs/core/stores/vault-store.svelte';
  import type {
    ChangelogSettings,
    VaultSettings,
    VersioningSettings,
  } from '@/hubs/core/types/settings';
  import SettingRow from '@/ui/settings-controls.svelte';

  let {
    vault: vaultSettings = $bindable(),
    versioning = $bindable(),
    changelog = $bindable(),
  }: {
    vault: VaultSettings;
    versioning: VersioningSettings;
    changelog: ChangelogSettings;
  } = $props();

  let vaultInfo = $derived(getVault());
  let allNotes = $derived(getNotes());
  let noteCount = $derived(allNotes.length);
  let totalSize = $derived(allNotes.reduce((s, n) => s + n.size, 0));
  let totalSizeLabel = $derived(
    totalSize < 1024
      ? `${totalSize} B`
      : totalSize < 1048576
        ? `${(totalSize / 1024).toFixed(1)} KB`
        : `${(totalSize / 1048576).toFixed(1)} MB`
  );
</script>

<div class="vault-settings">
  <section>
    <h3 class="section-title">Current Vault</h3>
    {#if vaultInfo}
      <div class="vault-info">
        <div class="info-row">
          <span class="info-label">Name</span>
          <span class="info-value">{vaultInfo.name}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Path</span>
          <span class="info-value info-path">{vaultInfo.rootPath}</span>
        </div>
      </div>

      <div class="vault-stats">
        <div class="stat-item">
          <span class="stat-label">Total Notes</span>
          <span class="stat-value">{noteCount}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Vault Size</span>
          <span class="stat-value">{totalSizeLabel}</span>
        </div>
      </div>
    {:else}
      <p class="vault-empty">No vault open. Use File → Open Vault to get started.</p>
    {/if}
  </section>

  <section>
    <h3 class="section-title">Version Control</h3>
    <SettingRow label="Enable Git integration" hint="Track changes with Git" id="sv-enable-git">
      <input id="sv-enable-git" type="checkbox" bind:checked={vaultSettings.enableGit} />
    </SettingRow>

    {#if vaultSettings.enableGit}
      <SettingRow
        label="Auto-commit changes"
        hint="Automatically commit after saving"
        id="sv-auto-commit"
      >
        <input id="sv-auto-commit" type="checkbox" bind:checked={vaultSettings.autoCommit} />
      </SettingRow>

      <SettingRow
        label="Sync on startup"
        hint="Pull latest changes when opening vault"
        id="sv-sync-startup"
      >
        <input id="sv-sync-startup" type="checkbox" bind:checked={vaultSettings.syncOnStartup} />
      </SettingRow>

      <SettingRow
        label="Commit message template"
        hint="Use [filename] as placeholder"
        id="sv-commit-tpl"
      >
        <input
          id="sv-commit-tpl"
          type="text"
          style="width:200px"
          bind:value={vaultSettings.commitMessageTemplate}
          placeholder="Update [filename]"
        />
      </SettingRow>
    {/if}
  </section>

  <section>
    <h3 class="section-title">Backups</h3>
    <SettingRow
      label="Enable automatic backups"
      hint="Periodically back up vault data"
      id="sv-backups"
    >
      <input id="sv-backups" type="checkbox" bind:checked={vaultSettings.enableBackups} />
    </SettingRow>
  </section>

  <section>
    <h3 class="section-title">Versioning</h3>
    <SettingRow
      label="Enable note versioning"
      hint="Keep historical snapshots of notes"
      id="sv-versioning"
    >
      <input id="sv-versioning" type="checkbox" bind:checked={versioning.versioningEnabled} />
    </SettingRow>

    {#if versioning.versioningEnabled}
      <SettingRow label="Retention count" hint="Max versions kept per note" id="sv-retention">
        <input
          id="sv-retention"
          type="number"
          min="5"
          max="500"
          bind:value={versioning.versionRetentionCount}
        />
      </SettingRow>

      <SettingRow
        label="LLM classify changes"
        hint="Use AI to label version diffs"
        id="sv-llm-classify"
      >
        <input
          id="sv-llm-classify"
          type="checkbox"
          bind:checked={versioning.versioningLlmClassify}
        />
      </SettingRow>
    {/if}
  </section>

  <section>
    <h3 class="section-title">Changelog</h3>
    <SettingRow
      label="Auto-update changelog"
      hint="Log edits to a changelog file"
      id="sv-changelog"
    >
      <input id="sv-changelog" type="checkbox" bind:checked={changelog.changelogAutoUpdate} />
    </SettingRow>

    {#if changelog.changelogAutoUpdate}
      <SettingRow label="Changelog path" hint="Relative path inside vault" id="sv-clog-path">
        <input
          id="sv-clog-path"
          type="text"
          style="width:200px"
          bind:value={changelog.changelogPath}
          placeholder="Changelog.md"
        />
      </SettingRow>

      <SettingRow label="Use wikilinks" hint="Link note names as [[wikilinks]]" id="sv-clog-wiki">
        <input id="sv-clog-wiki" type="checkbox" bind:checked={changelog.changelogUseWikilinks} />
      </SettingRow>

      <SettingRow label="Max recent files" hint="Entries shown in changelog" id="sv-clog-max">
        <input
          id="sv-clog-max"
          type="number"
          min="5"
          max="100"
          bind:value={changelog.changelogMaxFiles}
        />
      </SettingRow>
    {/if}
  </section>
</div>

<style>
  .vault-settings {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .section-title {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--color-text);
    margin: 0;
  }
  .vault-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    background: var(--color-surface);
    border-radius: var(--radius-m);
    border: 1px solid var(--color-border);
  }
  .info-row {
    display: flex;
    align-items: baseline;
    gap: 12px;
  }
  .info-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--color-text-muted);
    min-width: 50px;
  }
  .info-value {
    font-size: 0.8rem;
    color: var(--color-text);
  }
  .info-path {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    word-break: break-all;
  }
  .vault-stats {
    display: flex;
    gap: 12px;
    padding: 10px 12px;
    background: var(--color-surface);
    border-radius: var(--radius-m);
    border: 1px solid var(--color-border);
  }
  .stat-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .stat-label {
    font-size: 0.65rem;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .stat-value {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--color-text);
  }
  .vault-empty {
    font-size: 0.8rem;
    color: var(--color-text-muted);
  }
</style>
