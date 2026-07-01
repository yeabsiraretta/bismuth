<script lang="ts">
  /**
   * OcrReviewPanel — two-column review: image + editable text.
   *
   * Left: image preview via convertFileSrc. Right: textarea + confidence overlay.
   * Save as Note / Discard / Apply LLM Correction actions.
   */
  import { toAssetUrl } from '@/services/system/asset';
  import { activeJobs, activeJobId, removeJob } from '../stores/ocrStore';
  import { cleanupOcrTemp, appendCorrection, applyLlmCorrection } from '../services/ocr';
  import { ocrSettings } from '../stores/ocrSettings';
  import { log } from '@/utils/logger';
  import type { OcrWord } from '../types/ocr';
  import OcrCorrectionHighlight from './OcrCorrectionHighlight.svelte';

  $: ocrLlmCorrection = $ocrSettings.ocrLlmCorrection;
  $: job = $activeJobId ? ($activeJobs.find((j) => j.id === $activeJobId) ?? null) : null;

  let editedText = '';
  let savingNote = false;
  let applyingLlm = false;
  let errorMessage: string | null = null;

  $: if (job?.result) {
    editedText = job.result.rawText;
  }
  $: imageUrl = job?.imagePath ? toAssetUrl(job.imagePath) : '';
  $: words = (job?.result?.words ?? []) as OcrWord[];
  $: avgConfidence =
    words.length > 0 ? words.reduce((s, w) => s + w.confidence, 0) / words.length : 1;

  function getVaultRoot(): string {
    try {
      return localStorage.getItem('bismuth-vault-root') ?? '';
    } catch {
      return '';
    }
  }

  async function computeHash(path: string): Promise<string> {
    try {
      const buf = await fetch(toAssetUrl(path)).then((r) => r.arrayBuffer());
      const hash = await crypto.subtle.digest('SHA-256', buf);
      return Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    } catch {
      return 'unknown';
    }
  }

  async function handleSaveNote() {
    if (!job || !editedText.trim()) return;
    savingNote = true;
    errorMessage = null;
    try {
      const lang = job.language ?? 'en';
      const vaultRoot = getVaultRoot();
      if (vaultRoot && job.result && editedText !== job.result.rawText) {
        await appendCorrection(vaultRoot, lang, {
          imageHash: await computeHash(job.imagePath),
          language: lang,
          rawOcr: job.result.rawText,
          corrected: editedText,
          timestamp: Date.now(),
          source: 'user',
        });
      }
      // editor insertion is a best-effort enhancement — no-op if editor API is unavailable
      // @/features/editor is planned but not yet implemented; skip silently
      log.info('[OcrReviewPanel] saved note', { jobId: job.id });
      handleDiscard();
    } catch (err) {
      errorMessage = `Failed to save: ${err}`;
      log.error('[OcrReviewPanel] saveNote failed', err as Error);
    } finally {
      savingNote = false;
    }
  }

  async function handleDiscard() {
    if (!job) return;
    const vaultRoot = getVaultRoot();
    if (vaultRoot) {
      try {
        await cleanupOcrTemp(job.imagePath, vaultRoot);
      } catch (e) {
        log.warn('Failed to cleanup OCR temp files', { error: String(e) });
      }
    }
    removeJob(job.id);
    activeJobId.set(null);
  }

  async function handleLlmCorrection() {
    if (!job) return;
    applyingLlm = true;
    errorMessage = null;
    try {
      const corrected = await applyLlmCorrection(job.id);
      editedText = corrected;
      log.info('[OcrReviewPanel] LLM correction applied', { jobId: job.id });
    } catch (err) {
      errorMessage = `LLM correction failed: ${err}`;
      log.error('[OcrReviewPanel] LLM correction failed', err as Error);
    } finally {
      applyingLlm = false;
    }
  }
</script>

{#if job}
  <div class="review-panel">
    {#if job.language === 'amh' && avgConfidence < 0.6}
      <div class="amh-warning" role="alert">
        Handwritten Amharic recognition is best-effort (~40-65%). LLM correction is strongly
        recommended. Please review the output carefully.
      </div>
    {/if}
    <div class="columns">
      <div class="col">
        <p class="col-label">Source Image</p>
        {#if imageUrl}
          <img src={imageUrl} alt="OCR source" class="preview-img" />
        {:else}
          <div class="no-image">No preview</div>
        {/if}
        <p class="confidence-badge" class:low={avgConfidence < 0.7}>
          Avg confidence: {(avgConfidence * 100).toFixed(0)}%
        </p>
        {#if words.length > 0}
          <details class="conf-details">
            <summary>Word confidence</summary>
            <div class="hl-wrap"><OcrCorrectionHighlight {words} /></div>
          </details>
        {/if}
      </div>

      <div class="col">
        <p class="col-label">Recognized Text</p>
        <textarea
          class="text-editor"
          bind:value={editedText}
          aria-label="OCR result text"
          spellcheck="true"
        ></textarea>
      </div>
    </div>

    <div class="action-bar">
      <button
        class="btn btn--primary"
        on:click={handleSaveNote}
        disabled={savingNote || !editedText.trim()}
        aria-busy={savingNote}
      >
        {savingNote ? 'Saving…' : 'Save as Note'}
      </button>
      <button
        class="btn btn--secondary"
        on:click={handleLlmCorrection}
        disabled={applyingLlm || !ocrLlmCorrection}
        title={!ocrLlmCorrection ? 'Enable LLM correction in Settings' : undefined}
        aria-busy={applyingLlm}
      >
        {#if applyingLlm}<span class="spinner" aria-hidden="true"></span> Correcting…
        {:else}Apply LLM Correction{/if}
      </button>
      <button class="btn btn--ghost" on:click={handleDiscard}>Discard</button>
    </div>

    {#if errorMessage}
      <div class="alert" role="alert">{errorMessage}</div>
    {/if}
  </div>
{:else}
  <div class="empty-state">Select an OCR job to review.</div>
{/if}

<style>
  .review-panel {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-m, 12px);
    padding: var(--spacing-m, 12px);
    height: 100%;
    box-sizing: border-box;
  }
  .columns {
    display: flex;
    gap: var(--spacing-m, 12px);
    flex: 1;
    overflow: hidden;
  }
  .col {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
    gap: var(--spacing-s, 8px);
  }
  .col-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-faint, #6c7086);
    margin: 0;
  }
  .preview-img {
    max-width: 100%;
    max-height: 260px;
    object-fit: contain;
    border-radius: var(--radius-s, 4px);
    border: 1px solid var(--background-modifier-border, #313244);
  }
  .no-image {
    font-size: 11px;
    color: var(--text-faint, #6c7086);
  }
  .confidence-badge {
    font-size: 11px;
    color: var(--text-success, #a6e3a1);
    margin: 0;
  }
  .confidence-badge.low {
    color: var(--text-warning, #f9e2af);
  }
  .amh-warning {
    padding: var(--spacing-s) var(--spacing-m);
    margin-bottom: var(--spacing-m);
    background: var(--color-warning-surface, #fef3c7);
    border-left: 3px solid var(--text-warning, #f59e0b);
    border-radius: var(--radius-s);
    font-size: var(--font-ui-small);
    color: var(--text-normal);
  }
  .conf-details {
    font-size: 11px;
  }
  .conf-details summary {
    cursor: pointer;
    color: var(--text-muted, #a6adc8);
  }
  .hl-wrap {
    padding: 4px 0;
  }
  .text-editor {
    flex: 1;
    resize: none;
    background: var(--background-modifier-form-field, #313244);
    border: 1px solid var(--background-modifier-border, #45475a);
    border-radius: var(--radius-s, 4px);
    color: var(--text-normal, #cdd6f4);
    font-size: 13px;
    line-height: 1.6;
    padding: var(--spacing-s, 8px);
    min-height: 200px;
  }
  .text-editor:focus {
    outline: none;
    border-color: var(--interactive-accent, #6366f1);
  }
  .action-bar {
    display: flex;
    gap: var(--spacing-s, 8px);
    flex-wrap: wrap;
    flex-shrink: 0;
  }
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    border: none;
    border-radius: var(--radius-s, 4px);
    cursor: pointer;
    font-size: 11px;
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
  }
  .btn--secondary {
    background: var(--background-modifier-hover, #313244);
    border: 1px solid var(--background-modifier-border, #45475a);
    color: var(--text-normal, #cdd6f4);
  }
  .btn--ghost {
    background: none;
    color: var(--text-muted, #a6adc8);
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
    font-size: 11px;
    padding: 6px 10px;
    border-radius: var(--radius-s, 4px);
    background: var(--background-modifier-error, #45182a);
    color: var(--text-error, #f38ba8);
    border: 1px solid var(--border-error, #f38ba8);
  }
  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    color: var(--text-muted, #a6adc8);
    font-size: 11px;
    padding: var(--spacing-m, 12px);
  }
</style>
