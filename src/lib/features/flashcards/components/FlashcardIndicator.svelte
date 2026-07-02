<script lang="ts">
  /**
   * Inline note viewport indicator — shows flashcard count in the editor.
   * Mounts inside NoteEditor via a slot or status bar registration.
   */
  import { cardCount, connectionStatus, isSyncing, syncToAnki } from '../stores/flashcardStore';

  export let compact = false;
</script>

{#if $cardCount > 0}
  <button
    class="fc-indicator"
    class:compact
    on:click={syncToAnki}
    disabled={$isSyncing || $connectionStatus !== 'connected'}
    title={$connectionStatus === 'connected'
      ? `${$cardCount} flashcard${$cardCount !== 1 ? 's' : ''} — click to sync to Anki`
      : 'Anki not running — open Anki with AnkiConnect to sync'}
    aria-label="{$cardCount} flashcards in this note"
  >
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      aria-hidden="true"
    >
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
    {#if !compact}
      <span class="count">{$cardCount}</span>
    {/if}
    {#if $isSyncing}
      <span class="spinner" aria-hidden="true"></span>
    {/if}
  </button>
{/if}

<style>
  .fc-indicator {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 2px 6px;
    font-size: 11px;
    color: var(--text-muted);
    background: none;
    border: 1px solid transparent;
    border-radius: var(--radius-s);
    cursor: pointer;
    transition: all 0.12s;
  }
  .fc-indicator:not(:disabled):hover {
    background: var(--background-modifier-hover);
    color: var(--interactive-accent);
    border-color: var(--border-color);
  }
  .fc-indicator:disabled {
    cursor: default;
    opacity: 0.5;
  }
  .count {
    font-weight: var(--font-medium);
  }
  .spinner {
    width: 8px;
    height: 8px;
    border: 1.5px solid var(--text-faint);
    border-top-color: var(--interactive-accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
