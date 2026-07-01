<script lang="ts">
  /**
   * OcrImportDialog — file picker, language selector, OCR trigger.
   *
   * Renders nothing when ocrEnabled is false.
   * Does NOT call invoke() directly — uses ocr.ts service and ocrStore.
   */
  import { pickImportFile } from '@/services/system/dialog';
  import { settings } from '@/features/settings';
  import { importImage } from '../services/ocr';
  import { addJob } from '../stores/ocrStore';
  import { log } from '@/utils/logger';

  // Cast settings to include OCR fields (added by Spec 038 Phase 1)
  $: ocrEnabled = ($settings as unknown as Record<string, unknown>).ocrEnabled as boolean ?? false;
  $: ocrDefaultLanguage = ($settings as unknown as Record<string, unknown>).ocrDefaultLanguage as string ?? 'en';
  $: ocrModelPath = ($settings as unknown as Record<string, unknown>).ocrModelPath as string ?? '';

  let showModelDownloadPrompt = false;
  let modelDownloadProgress = 0;
  let modelDownloading = false;

  const LANGUAGE_OPTIONS = [
    { value: 'en', label: 'English' },
    { value: 'am', label: 'Amharic' },
  ];

  let selectedLanguage = ocrDefaultLanguage;
  let loading = false;
  let stagedMessage: string | null = null;
  let errorMessage: string | null = null;

  // Vault root is expected from parent via prop or from vault store.
  // For now we read from localStorage as a fallback (vault store is session-scoped).
  function getVaultRoot(): string {
    try {
      const stored = localStorage.getItem('bismuth-vault-root');
      return stored ?? '';
    } catch {
      return '';
    }
  }

  async function handlePickFile() {
    if (!ocrEnabled) return;
    errorMessage = null;
    stagedMessage = null;

    try {
      const selected = await pickImportFile({
        multiple: false,
        filters: [
          {
            name: 'Images',
            extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'tiff', 'bmp', 'pdf'],
          },
        ],
      });

      if (!selected) return;

      const filePath = typeof selected === 'string' ? selected : selected;
      if (!filePath) return;

      const vaultRoot = getVaultRoot();
      if (!vaultRoot) {
        errorMessage = 'No vault open. Open a vault before importing images.';
        return;
      }

      loading = true;
      const result = await importImage(String(filePath), selectedLanguage, vaultRoot);

      // Create a job entry and enqueue it
      const now = Date.now();
      addJob({
        id: result.jobId,
        imagePath: result.stagedPath,
        language: result.language,
        modelPath: '',
        status: 'queued',
        createdAt: now,
      });

      stagedMessage = 'Image staged for OCR. Review will appear in the panel.';
      log.info('[OcrImportDialog] image staged', { jobId: result.jobId });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('model_not_found')) {
        showModelDownloadPrompt = true;
        log.warn('[OcrImportDialog] handwriting model not found — prompting download');
      } else {
        log.error('[OcrImportDialog] importImage failed', err);
        errorMessage = 'Failed to import image. Please try again.';
      }
    } finally {
      loading = false;
    }
  }

  async function handleDownloadModel() {
    modelDownloading = true;
    modelDownloadProgress = 0;
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const { listen } = await import('@tauri-apps/api/event');
      const unlisten = await listen<number>('ocr://model-download-progress', (e) => {
        modelDownloadProgress = e.payload;
      });
      await invoke('download_trocr_model');
      unlisten();
      showModelDownloadPrompt = false;
      log.info('[OcrImportDialog] model downloaded');
    } catch (err) {
      log.error('[OcrImportDialog] model download failed', err);
      errorMessage = 'Model download failed. Check your connection and try again.';
    } finally {
      modelDownloading = false;
    }
  }
</script>

{#if ocrEnabled}
  <div class="ocr-import-dialog" role="region" aria-label="OCR import">
    <div class="dialog-row">
      <!-- Language selector -->
      <label class="lang-label" for="ocr-lang-select">Language</label>
      <select
        id="ocr-lang-select"
        class="lang-select"
        bind:value={selectedLanguage}
        aria-label="OCR language"
      >
        {#each LANGUAGE_OPTIONS as opt}
          <option value={opt.value}>{opt.label}</option>
        {/each}
      </select>

      <!-- Import button -->
      <button
        class="run-ocr-btn"
        on:click={handlePickFile}
        disabled={loading}
        aria-busy={loading}
        aria-label="Run OCR on selected image"
      >
        {#if loading}
          <span class="spinner" aria-hidden="true"></span>
          Staging…
        {:else}
          Run OCR
        {/if}
      </button>
    </div>

    {#if stagedMessage}
      <p class="staged-msg" role="status">{stagedMessage}</p>
    {/if}

    {#if errorMessage}
      <p class="error-msg" role="alert">{errorMessage}</p>
    {/if}

    {#if ocrEnabled && !ocrModelPath && showModelDownloadPrompt}
      <div class="model-download-prompt" role="alert">
        <p>Handwriting model not installed. Download the TrOCR model (~400 MB) to enable Tier 2 recognition.</p>
        {#if modelDownloading}
          <progress value={modelDownloadProgress} max={100} aria-label="Model download progress">{modelDownloadProgress}%</progress>
          <span class="download-pct">{modelDownloadProgress}%</span>
        {:else}
          <button class="download-btn" on:click={handleDownloadModel}>
            Download Handwriting Model (~400 MB)
          </button>
        {/if}
      </div>
    {/if}
  </div>
{/if}

<style>
  .ocr-import-dialog {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs, 4px);
    padding: var(--spacing-s, 8px);
  }

  .dialog-row {
    display: flex;
    align-items: center;
    gap: var(--spacing-s, 8px);
    flex-wrap: wrap;
  }

  .lang-label {
    font-size: var(--font-ui-small, 11px);
    color: var(--text-muted, #a6adc8);
    white-space: nowrap;
  }

  .lang-select {
    background: var(--background-modifier-hover, #313244);
    border: 1px solid var(--background-modifier-border, #45475a);
    border-radius: var(--radius-s, 4px);
    color: var(--text-normal, #cdd6f4);
    font-size: var(--font-ui-small, 11px);
    padding: 2px 6px;
    height: 28px;
    cursor: pointer;
  }

  .run-ocr-btn {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs, 4px);
    background: var(--interactive-accent, #dc2626);
    color: #fff;
    border: none;
    border-radius: var(--radius-s, 4px);
    font-size: var(--font-ui-small, 11px);
    font-weight: 600;
    padding: 4px 12px;
    cursor: pointer;
    height: 28px;
    min-width: 80px;
    transition: filter 0.1s;
  }

  .run-ocr-btn:hover:not(:disabled) {
    filter: brightness(1.1);
  }

  .run-ocr-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .spinner {
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .staged-msg {
    font-size: var(--font-ui-small, 11px);
    color: var(--text-success, #a6e3a1);
    margin: 0;
  }

  .error-msg {
    font-size: var(--font-ui-small, 11px);
    color: var(--text-error, #f38ba8);
    margin: 0;
  }
</style>
