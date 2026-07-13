<script lang="ts">
  import type { AnkiSyncResult } from '@/hubs/knowledge/services/anki-sync-service';

  let {
    ankiConnected,
    ankiDecks,
    ankiSyncing,
    ankiResult,
    ankiError,
    ankiConnectPort,
    ankiBackupFolder,
    onCheckConnection,
    onSync,
  }: {
    ankiConnected: boolean;
    ankiDecks: string[];
    ankiSyncing: boolean;
    ankiResult: AnkiSyncResult | null;
    ankiError: string | null;
    ankiConnectPort: number;
    ankiBackupFolder: string;
    onCheckConnection: () => void;
    onSync: () => void;
  } = $props();
</script>

<div class="anki-panel">
  <h2 class="anki-title">Anki Import</h2>
  <p class="anki-desc">
    Pull flashcards from Anki via AnkiConnect and back them up as markdown files in your vault.
  </p>

  <div class="anki-status">
    <span class="anki-dot" class:connected={ankiConnected}></span>
    <span
      >{ankiConnected
        ? `Connected — ${ankiDecks.length} deck${ankiDecks.length !== 1 ? 's' : ''} found`
        : 'Not connected'}</span
    >
    <button class="rescan-btn" onclick={onCheckConnection}>Refresh</button>
  </div>

  {#if ankiError}
    <div class="anki-error">{ankiError}</div>
  {/if}

  {#if ankiConnected}
    <div class="anki-decks">
      <h3 class="anki-subtitle">Available Decks</h3>
      <ul class="anki-deck-list">
        {#each ankiDecks as deck (deck)}
          <li class="anki-deck-item">{deck}</li>
        {/each}
      </ul>
    </div>

    <div class="anki-actions">
      <button class="study-btn" onclick={onSync} disabled={ankiSyncing}>
        {ankiSyncing ? 'Syncing...' : 'Sync All Decks to Vault'}
      </button>
      <span class="anki-hint">Saves to: <code>{ankiBackupFolder}/</code></span>
    </div>

    {#if ankiResult}
      <div class="anki-result">
        <p>
          ✓ Imported {ankiResult.cardsImported} cards from {ankiResult.decksImported} deck{ankiResult.decksImported !==
          1
            ? 's'
            : ''}
        </p>
        <p>
          {ankiResult.filesWritten} file{ankiResult.filesWritten !== 1 ? 's' : ''} written
        </p>
      </div>
    {/if}
  {:else}
    <div class="anki-help">
      <h3 class="anki-subtitle">Setup</h3>
      <ol class="anki-steps">
        <li>
          Install <a
            href="https://ankiweb.net/shared/info/2055492159"
            target="_blank"
            rel="noopener">AnkiConnect</a
          > add-on in Anki
        </li>
        <li>Restart Anki and ensure it's running</li>
        <li>Click "Refresh" above to connect</li>
      </ol>
      <p class="anki-hint">
        AnkiConnect port: {ankiConnectPort} (configurable in Settings → Integration)
      </p>
    </div>
  {/if}
</div>

<style>
  .anki-panel {
    max-width: 600px;
  }
  .anki-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--color-text);
    margin: 0 0 6px;
  }
  .anki-desc {
    font-size: 0.8rem;
    color: var(--color-text-muted);
    margin: 0 0 16px;
  }
  .anki-status {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    font-size: 0.8rem;
    color: var(--color-text);
  }
  .anki-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-error, #f38ba8);
    flex-shrink: 0;
  }
  .anki-dot.connected {
    background: var(--color-success, #a6e3a1);
  }
  .anki-error {
    padding: 10px 12px;
    font-size: 0.75rem;
    background: oklch(from var(--color-error, #f38ba8) l c h / 0.1);
    border: 1px solid oklch(from var(--color-error, #f38ba8) l c h / 0.3);
    border-radius: var(--radius-s);
    color: var(--color-error, #f38ba8);
    margin-bottom: 12px;
    white-space: pre-wrap;
  }
  .anki-subtitle {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--color-text);
    margin: 16px 0 8px;
  }
  .anki-deck-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .anki-deck-item {
    padding: 6px 10px;
    font-size: 0.78rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    margin-bottom: 4px;
    background: var(--color-surface);
    color: var(--color-text);
  }
  .anki-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 16px;
  }
  .study-btn {
    padding: 8px 24px;
    font-size: 0.85rem;
    background: var(--color-accent);
    color: var(--color-background);
    border: none;
    border-radius: var(--radius-s);
    cursor: pointer;
    font-family: inherit;
  }
  .study-btn:hover {
    opacity: 0.9;
  }
  .anki-hint {
    font-size: 0.7rem;
    color: var(--color-text-muted);
  }
  .anki-hint code {
    background: var(--color-surface-hover);
    padding: 1px 4px;
    border-radius: 2px;
  }
  .anki-result {
    padding: 12px;
    background: oklch(from var(--color-success, #a6e3a1) l c h / 0.08);
    border: 1px solid oklch(from var(--color-success, #a6e3a1) l c h / 0.3);
    border-radius: var(--radius-s);
    margin-top: 12px;
    font-size: 0.8rem;
    color: var(--color-success, #a6e3a1);
  }
  .anki-result p {
    margin: 2px 0;
  }
  .anki-help {
    margin-top: 12px;
  }
  .anki-steps {
    padding-left: 20px;
    font-size: 0.8rem;
    color: var(--color-text);
  }
  .anki-steps li {
    margin-bottom: 6px;
  }
  .anki-steps a {
    color: var(--color-accent);
    text-decoration: underline;
  }
  .rescan-btn {
    padding: 3px 10px;
    font-size: 0.7rem;
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text-muted);
    border-radius: var(--radius-s);
    cursor: pointer;
    font-family: inherit;
  }
  .rescan-btn:hover {
    color: var(--color-accent);
    border-color: var(--color-accent);
  }
</style>
