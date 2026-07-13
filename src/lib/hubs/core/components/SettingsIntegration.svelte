<script lang="ts">
  import SettingRow from '@/ui/settings-controls.svelte';
  import type { IntegrationSettings } from '@/hubs/core/types/settings';
  import { browseNasPath } from '@/sal/nas-backup-service';

  let {
    integration = $bindable(),
  }: {
    integration: IntegrationSettings;
  } = $props();

  async function pickNasPath() {
    const path = await browseNasPath();
    if (path) integration.nasPath = path;
  }

  function formatLastBackup(iso: string): string {
    if (!iso) return 'Never';
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  }
</script>

<div class="space-y-6">
  <section>
    <h3 class="text-s font-semibold text-text mb-3">Flashcards</h3>

    <SettingRow label="Enable flashcards" hint="Extract flashcards from notes" id="int-flashcards">
      <input id="int-flashcards" type="checkbox" bind:checked={integration.flashcardsEnabled} />
    </SettingRow>

    {#if integration.flashcardsEnabled}
      <SettingRow
        label="Auto-scan notes"
        hint="Automatically detect flashcard syntax"
        id="int-auto-scan"
      >
        <input id="int-auto-scan" type="checkbox" bind:checked={integration.flashcardsAutoScan} />
      </SettingRow>

      <SettingRow label="Anki Connect port" hint="Port for Anki Connect plugin" id="int-anki-port">
        <input id="int-anki-port" type="number" bind:value={integration.ankiConnectPort} />
      </SettingRow>

      <SettingRow label="Deck prefix" hint="Prefix for exported Anki decks" id="int-deck-prefix">
        <input
          id="int-deck-prefix"
          type="text"
          style="width:128px"
          bind:value={integration.ankiDeckPrefix}
        />
      </SettingRow>

      <SettingRow
        label="Scheduler algorithm"
        hint="SM-2 (classic) or FSRS (modern, better retention)"
        id="int-algorithm"
      >
        <select id="int-algorithm" bind:value={integration.schedulerAlgorithm}>
          <option value="sm2">SM-2 (Classic)</option>
          <option value="fsrs">FSRS-4.5 (Modern)</option>
        </select>
      </SettingRow>
    {/if}
  </section>

  <section>
    <h3 class="text-s font-semibold text-text mb-3">NAS Backup</h3>

    <SettingRow
      label="Enable NAS backup"
      hint="Back up entire vault to network-attached storage"
      id="int-nas"
    >
      <input id="int-nas" type="checkbox" bind:checked={integration.nasEnabled} />
    </SettingRow>

    {#if integration.nasEnabled}
      <SettingRow
        label="NAS path"
        hint="Network or local path for backup storage"
        id="int-nas-path"
      >
        <div class="nas-path-row">
          <input
            id="int-nas-path"
            type="text"
            placeholder="/mnt/nas/backups"
            bind:value={integration.nasPath}
            class="nas-path-input"
          />
          <button class="nas-browse-btn" onclick={pickNasPath} type="button">Browse</button>
        </div>
      </SettingRow>

      <SettingRow
        label="Backup frequency"
        hint="When to automatically create backups"
        id="int-nas-freq"
      >
        <select id="int-nas-freq" bind:value={integration.nasBackupFrequency}>
          <option value="manual">Manual only</option>
          <option value="on-open">Every time Bismuth opens</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </select>
      </SettingRow>

      <SettingRow
        label="Auto-backup on open"
        hint="Run backup when Bismuth opens (if frequency allows)"
        id="int-nas-open"
      >
        <input id="int-nas-open" type="checkbox" bind:checked={integration.nasBackupOnOpen} />
      </SettingRow>

      <SettingRow
        label="Max backups"
        hint="Number of snapshot backups to keep on NAS"
        id="int-nas-max"
      >
        <input
          id="int-nas-max"
          type="number"
          min="1"
          max="50"
          bind:value={integration.nasMaxBackups}
        />
      </SettingRow>

      <SettingRow label="Last backup" hint="Timestamp of most recent NAS backup" id="int-nas-last">
        <span class="nas-last-backup">{formatLastBackup(integration.nasLastBackup)}</span>
      </SettingRow>
    {/if}
  </section>
</div>

<style>
  .nas-path-row {
    display: flex;
    gap: 6px;
    align-items: center;
  }
  .nas-path-input {
    flex: 1;
    min-width: 180px;
  }
  .nas-browse-btn {
    padding: 4px 10px;
    font-size: 0.72rem;
    font-weight: 500;
    background: var(--color-surface);
    color: var(--color-text);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    cursor: pointer;
    font-family: inherit;
    white-space: nowrap;
  }
  .nas-browse-btn:hover {
    background: var(--color-surface-hover);
    border-color: var(--color-accent);
  }
  .nas-last-backup {
    font-size: 0.72rem;
    color: var(--color-text-muted);
  }
</style>
