<script lang="ts">
  /**
   * StemSplitterPanel — UI for Demucs stem splitting.
   *
   * Uses demucs.ts service only. MUST NOT call invoke() directly.
   * When Demucs is not installed the Rust stub returns an error that is
   * displayed as a friendly instruction message.
   */
  import { pickImportFile } from '@/services/system/dialog';
  import { addTrack } from '../stores/musicStore';
  import { splitStems } from '../services/demucs';
  import { log } from '@/utils/logger';
  import type { StemPaths } from '../services/demucs';

  // ─── State ────────────────────────────────────────────────────────────────

  let audioFilePath: string | null = null;
  let splitting = false;
  let errorMessage: string | null = null;
  let stems: StemPaths | null = null;

  function getVaultRoot(): string {
    try {
      return localStorage.getItem('bismuth-vault-root') ?? '';
    } catch {
      return '';
    }
  }

  // ─── File picker ──────────────────────────────────────────────────────────

  async function pickFile() {
    errorMessage = null;
    stems = null;
    const selected = await pickImportFile({
      multiple: false,
      filters: [{ name: 'Audio', extensions: ['mp3', 'wav', 'flac', 'm4a', 'aac', 'ogg'] }],
    });
    if (selected) {
      audioFilePath = String(selected);
      log.info('[StemSplitterPanel] audio file selected', { audioFilePath });
    }
  }

  // ─── Split ────────────────────────────────────────────────────────────────

  async function handleSplit() {
    if (!audioFilePath) return;
    const vaultRoot = getVaultRoot();
    if (!vaultRoot) {
      errorMessage = 'No vault open.';
      return;
    }
    splitting = true;
    errorMessage = null;
    stems = null;
    try {
      stems = await splitStems(audioFilePath, vaultRoot);
      log.info('[StemSplitterPanel] stems ready', stems as unknown as Record<string, unknown>);
    } catch (err) {
      const msg = String(err);
      if (msg.includes('demucs_not_installed')) {
        errorMessage =
          'Demucs is not installed. See docs/guides/music-demucs-setup.md for installation instructions.';
      } else {
        errorMessage = `Stem splitting failed: ${msg}`;
      }
      log.error('[StemSplitterPanel] splitStems failed', err as Error);
    } finally {
      splitting = false;
    }
  }

  // ─── Import stems as tracks ───────────────────────────────────────────────

  function importStemsAsTracks() {
    if (!stems) return;
    const stemKeys: Array<keyof StemPaths> = ['vocals', 'drums', 'bass', 'other'];
    for (const key of stemKeys) {
      const path = stems[key];
      if (path) {
        const track = addTrack('audio');
        log.info('[StemSplitterPanel] importing stem track', { key, path, trackId: track.id });
      }
    }
  }

  const STEM_LABELS: Record<keyof StemPaths, string> = {
    vocals: 'Vocals',
    drums: 'Drums',
    bass: 'Bass',
    other: 'Other',
  };
</script>

<div class="stem-panel">
  <h3 class="panel-title">Stem Splitter</h3>
  <p class="panel-hint">Separate audio into vocals, drums, bass, and other stems using Demucs.</p>

  <!-- File picker row -->
  <div class="row">
    <button class="btn btn--secondary" on:click={pickFile} aria-label="Select audio file">
      Select Audio File
    </button>
    {#if audioFilePath}
      <span class="file-name" title={audioFilePath}>
        {audioFilePath.split('/').pop() ?? audioFilePath}
      </span>
    {/if}
  </div>

  <!-- Split button -->
  <button
    class="btn btn--primary"
    on:click={handleSplit}
    disabled={!audioFilePath || splitting}
    aria-busy={splitting}
  >
    {#if splitting}
      <span class="spinner" aria-hidden="true"></span>
      Splitting…
    {:else}
      Split Stems
    {/if}
  </button>

  <!-- Error message -->
  {#if errorMessage}
    <div class="alert alert--error" role="alert">{errorMessage}</div>
  {/if}

  <!-- Results -->
  {#if stems}
    <div class="stems-result">
      <h4 class="result-title">Output Stems</h4>
      <ul class="stem-list">
        {#each Object.entries(stems) as [key, path]}
          {#if path}
            <li class="stem-item">
              <span class="stem-label">{STEM_LABELS[key as keyof StemPaths] ?? key}</span>
              <span class="stem-path" title={path}>{path.split('/').pop() ?? path}</span>
            </li>
          {/if}
        {/each}
      </ul>
      <button class="btn btn--accent" on:click={importStemsAsTracks}>
        Import Stems as Tracks
      </button>
    </div>
  {/if}
</div>

<style>
  .stem-panel {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-m, 12px);
    padding: var(--spacing-m, 12px);
  }

  .panel-title {
    font-size: var(--font-ui-medium, 14px);
    font-weight: 600;
    color: var(--text-normal, #cdd6f4);
    margin: 0;
  }

  .panel-hint {
    font-size: var(--font-ui-small, 11px);
    color: var(--text-muted, #a6adc8);
    margin: 0;
  }

  .row {
    display: flex;
    align-items: center;
    gap: var(--spacing-s, 8px);
    flex-wrap: wrap;
  }

  .file-name {
    font-size: var(--font-ui-small, 11px);
    color: var(--text-normal, #cdd6f4);
    font-family: var(--font-mono);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 180px;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xs, 4px);
    border: none;
    border-radius: var(--radius-s, 4px);
    cursor: pointer;
    font-size: var(--font-ui-small, 11px);
    font-weight: 600;
    padding: 5px 12px;
    transition: filter 0.1s;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .btn:not(:disabled):hover {
    filter: brightness(1.1);
  }

  .btn--primary {
    background: var(--interactive-accent, #6366f1);
    color: #fff;
    align-self: flex-start;
  }

  .btn--secondary {
    background: var(--background-modifier-hover, #313244);
    border: 1px solid var(--background-modifier-border, #45475a);
    color: var(--text-normal, #cdd6f4);
  }

  .btn--accent {
    background: var(--color-green, #a6e3a1);
    color: #1e1e2e;
    align-self: flex-start;
  }

  .spinner {
    display: inline-block;
    width: 10px;
    height: 10px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .alert {
    font-size: var(--font-ui-small, 11px);
    padding: 6px 10px;
    border-radius: var(--radius-s, 4px);
  }

  .alert--error {
    background: var(--background-modifier-error, #45182a);
    color: var(--text-error, #f38ba8);
    border: 1px solid var(--border-error, #f38ba8);
  }

  .stems-result {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-s, 8px);
  }

  .result-title {
    font-size: var(--font-ui-small, 11px);
    font-weight: 600;
    color: var(--text-muted, #a6adc8);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin: 0;
  }

  .stem-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .stem-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-s, 8px);
    font-size: var(--font-ui-small, 11px);
    padding: 3px 0;
  }

  .stem-label {
    color: var(--text-muted, #a6adc8);
    width: 50px;
    flex-shrink: 0;
    font-weight: 600;
  }

  .stem-path {
    color: var(--text-normal, #cdd6f4);
    font-family: var(--font-mono);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
