<script lang="ts">
  import PanelHeader from '@/components/ui/layout/PanelHeader.svelte';
  import Icon from '@/components/icons/Icon.svelte';
  import { activeNote } from '@/stores/vault/vault';
  import { speedReaderStore, startSpeedReader, setWpm } from '../stores/speedReader';

  let wpmInput = 300;

  $: wpmInput = $speedReaderStore.wpm;

  function handleStart() {
    if (!$activeNote?.content) return;
    startSpeedReader($activeNote.content, wpmInput);
  }
</script>

<div class="speed-reader-panel" role="tabpanel" aria-label="Speed Reader">
  <PanelHeader icon="play" title="Speed Reader" />

  <div class="panel-body">
    {#if !$activeNote}
      <div class="empty-state">
        <Icon name="file-text" size={28} />
        <p>Open a note to speed read</p>
      </div>
    {:else}
      <div class="reader-config">
        <div class="config-section">
          <label class="config-label" for="wpm-slider">
            <Icon name="zap" size={14} />
            <span>Words per minute</span>
          </label>
          <div class="wpm-control">
            <input
              id="wpm-slider"
              type="range"
              min="100"
              max="1000"
              step="25"
              bind:value={wpmInput}
              on:change={() => setWpm(wpmInput)}
            />
            <span class="wpm-value">{wpmInput}</span>
          </div>
        </div>

        <div class="note-preview">
          <div class="preview-label">Active note</div>
          <div class="preview-title">{$activeNote.title || 'Untitled'}</div>
          <div class="preview-stats">
            {$activeNote.content?.split(/\s+/).filter(Boolean).length || 0} words · ~{Math.ceil(
              ($activeNote.content?.split(/\s+/).filter(Boolean).length || 0) / wpmInput
            )} min
          </div>
        </div>

        <button class="start-btn" on:click={handleStart} disabled={!$activeNote.content}>
          <Icon name="play" size={16} />
          <span>Start Reading</span>
        </button>
      </div>
    {/if}
  </div>
</div>

<style>
  .speed-reader-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .panel-body {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-3, 8px);
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-2, 4px);
    padding: var(--space-6, 24px);
    color: var(--text-muted);
    text-align: center;
  }

  .empty-state p {
    margin: 0;
    font-size: 0.875rem;
  }

  .reader-config {
    display: flex;
    flex-direction: column;
    gap: var(--space-4, 12px);
  }

  .config-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-2, 4px);
  }

  .config-label {
    display: flex;
    align-items: center;
    gap: var(--space-2, 4px);
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .wpm-control {
    display: flex;
    align-items: center;
    gap: var(--space-2, 4px);
  }

  .wpm-control input[type='range'] {
    flex: 1;
    height: 4px;
    accent-color: var(--interactive-accent);
  }

  .wpm-value {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-normal);
    min-width: 40px;
    text-align: right;
  }

  .note-preview {
    padding: var(--space-3, 8px);
    background: var(--background-secondary);
    border-radius: var(--radius-s);
    border: 1px solid var(--border-color);
  }

  .preview-label {
    font-size: 0.65rem;
    text-transform: uppercase;
    color: var(--text-faint);
    margin-bottom: 2px;
  }

  .preview-title {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-normal);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .preview-stats {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-top: 2px;
  }

  .start-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2, 4px);
    padding: var(--space-2, 4px) var(--space-4, 12px);
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    border: none;
    border-radius: var(--radius-s);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.15s;
  }

  .start-btn:hover {
    opacity: 0.9;
  }

  .start-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
