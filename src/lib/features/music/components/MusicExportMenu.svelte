<script lang="ts">
  /**
   * MusicExportMenu — WAV and MIDI export buttons for the active music document.
   *
   * Calls audioContext.exportWav and midiExport.exportMidi via the parent panel,
   * triggering browser downloads. Shown only when a document is active.
   */
  import { activeMusicDoc } from '../stores/musicStore';
  import { exportWav } from '../services/audioContext';
  import { exportMidi } from '../services/midiExport';
  import { log } from '@/utils/logger';

  export let onExportStarted: ((detail: { type: 'wav' | 'midi' }) => void) | undefined = undefined;
  export let onExportDone: ((detail: { type: 'wav' | 'midi' }) => void) | undefined = undefined;
  export let onExportError:
    ((detail: { type: 'wav' | 'midi'; message: string }) => void) | undefined = undefined;

  $: doc = $activeMusicDoc;

  let exporting: 'wav' | 'midi' | null = null;

  function triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleExportWav(): Promise<void> {
    if (!doc) return;
    exporting = 'wav';
    onExportStarted?.({ type: 'wav' });
    try {
      const durationSec = (doc.totalBars / doc.bpm) * 60 * (doc.timeSignatureNumerator ?? 4);
      const blob = await exportWav(durationSec, doc.bpm, doc.tracks);
      triggerDownload(blob, `${doc.name}.wav`);
      onExportDone?.({ type: 'wav' });
      log.info('[MusicExportMenu] WAV export complete', { docId: doc.id });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      onExportError?.({ type: 'wav', message });
      log.error('[MusicExportMenu] WAV export failed', err);
    } finally {
      exporting = null;
    }
  }

  function handleExportMidi(): void {
    if (!doc) return;
    exporting = 'midi';
    onExportStarted?.({ type: 'midi' });
    try {
      const blob = exportMidi(doc);
      triggerDownload(blob, `${doc.name}.mid`);
      onExportDone?.({ type: 'midi' });
      log.info('[MusicExportMenu] MIDI export complete', { docId: doc.id });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      onExportError?.({ type: 'midi', message });
      log.error('[MusicExportMenu] MIDI export failed', err);
    } finally {
      exporting = null;
    }
  }
</script>

{#if doc}
  <div class="export-menu" role="group" aria-label="Export options">
    <button
      class="export-btn"
      on:click={handleExportWav}
      disabled={exporting !== null}
      aria-busy={exporting === 'wav'}
      title="Export arrangement as WAV"
    >
      {#if exporting === 'wav'}
        <span class="spinner" aria-hidden="true"></span>
        Rendering...
      {:else}
        Export WAV
      {/if}
    </button>
    <button
      class="export-btn"
      on:click={handleExportMidi}
      disabled={exporting !== null}
      aria-busy={exporting === 'midi'}
      title="Export MIDI tracks as .mid"
    >
      {#if exporting === 'midi'}
        <span class="spinner" aria-hidden="true"></span>
        Exporting...
      {:else}
        Export MIDI
      {/if}
    </button>
  </div>
{/if}

<style>
  .export-menu {
    display: flex;
    gap: var(--spacing-xs, 4px);
    align-items: center;
  }

  .export-btn {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs, 4px);
    padding: 4px 10px;
    background: var(--background-modifier-hover, #313244);
    border: 1px solid var(--background-modifier-border, #45475a);
    border-radius: var(--radius-s, 4px);
    color: var(--text-normal, #cdd6f4);
    font-size: var(--font-ui-small, 11px);
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.1s;
  }

  .export-btn:hover:not(:disabled) {
    background: var(--background-modifier-active-hover, #45475a);
  }

  .export-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .spinner {
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 2px solid var(--text-muted, #a6adc8);
    border-top-color: var(--interactive-accent, #dc2626);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
