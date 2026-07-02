<script lang="ts">
  /**
   * PhotoEditor — canvas-based photo editor with toolbar, filter picker, and export.
   * Layout: MediaToolbar top, canvas preview center, FilterPicker + op-stack right panel.
   * Export writes a NEW file (never overwrites the original).
   */
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { toAssetUrl } from '@/services/system/asset';
  import { pickSaveDestination } from '@/services/system/dialog';
  import MediaToolbar from './MediaToolbar.svelte';
  import FilterPicker from './FilterPicker.svelte';
  import {
    editChain,
    previewDataUrl,
    isProcessing,
    addOperation,
    removeOperation,
    undoOperation,
    redoOperation,
    clearChain,
  } from '../stores/mediaStore';
  import { applyChainToDataUrl, exportToBlob } from '../services/photoOps';
  import { writeMediaExport, blobToUint8Array } from '../services/mediaService';
  import type { FilterPreset, PhotoOperation } from '../types/media';
  import { log } from '@/utils/logger';
  import { showToast } from '@/stores/toast/toast';

  export let sourcePath: string;

  let assetUrl = '';

  $: chain = $editChain;
  $: preview = $previewDataUrl;

  async function refreshPreview(): Promise<void> {
    const c = get(editChain);
    if (!c || !assetUrl) return;
    isProcessing.set(true);
    try {
      previewDataUrl.set(await applyChainToDataUrl(assetUrl, c));
    } catch (err) {
      log.error('PhotoEditor: preview refresh failed', err as Error);
    } finally {
      isProcessing.set(false);
    }
  }

  function handleRotateCw(): void {
    addOperation({ type: 'rotate', params: { angle: 90 } });
    refreshPreview();
  }
  function handleRotateCcw(): void {
    addOperation({ type: 'rotate', params: { angle: -90 } });
    refreshPreview();
  }
  function handleCrop(): void {
    addOperation({ type: 'crop', params: { x: 0, y: 0, w: 800, h: 600 } });
    refreshPreview();
  }
  function handleFlipH(): void {
    addOperation({ type: 'flip', params: { direction: 'horizontal' } });
    refreshPreview();
  }
  function handleFlipV(): void {
    addOperation({ type: 'flip', params: { direction: 'vertical' } });
    refreshPreview();
  }
  function handleBrightness(detail: { value: number }): void {
    addOperation({ type: 'brightness', params: { value: detail.value } });
    refreshPreview();
  }
  function handleContrast(detail: { value: number }): void {
    addOperation({ type: 'contrast', params: { value: detail.value } });
    refreshPreview();
  }
  function handleFilterSelect(preset: FilterPreset): void {
    addOperation({ type: 'filter', params: { name: preset.id } });
    refreshPreview();
  }
  function handleUndo(): void {
    undoOperation();
    refreshPreview();
  }
  function handleRedo(): void {
    redoOperation();
    refreshPreview();
  }
  function handleReset(): void {
    clearChain();
    previewDataUrl.set(null);
  }

  async function handleExport(): Promise<void> {
    const c = get(editChain);
    if (!c || !assetUrl) return;
    const ext = c.exportFormat === 'image/png' ? 'png' : 'jpg';
    const destPath = await pickSaveDestination({
      defaultPath: sourcePath.replace(/\.[^.]+$/, `-edited.${ext}`),
      filters: [{ name: 'Image', extensions: [ext] }],
    });
    if (!destPath) return;
    if (destPath === sourcePath) {
      showToast('Export path must differ from the original.', 'error');
      return;
    }
    isProcessing.set(true);
    try {
      const blob = await exportToBlob(assetUrl, c);
      await writeMediaExport(destPath, sourcePath, await blobToUint8Array(blob));
      showToast(`Saved to ${destPath}`, 'success');
      log.info('PhotoEditor: export complete', { destPath });
    } catch (err) {
      showToast(`Export failed: ${err}`, 'error');
      log.error('PhotoEditor: export failed', err as Error);
    } finally {
      isProcessing.set(false);
    }
  }

  function getActiveFilter(): string {
    const ops = chain?.operations ?? [];
    for (let i = ops.length - 1; i >= 0; i--) {
      const op = ops[i] as PhotoOperation;
      if (op.type === 'filter') return op.params?.name as string;
    }
    return 'none';
  }

  onMount(() => {
    assetUrl = toAssetUrl(sourcePath);
    refreshPreview();
  });
</script>

<div class="photo-editor">
  <MediaToolbar
    disabled={$isProcessing}
    onRotateCw={handleRotateCw}
    onRotateCcw={handleRotateCcw}
    onCrop={handleCrop}
    onFlipH={handleFlipH}
    onFlipV={handleFlipV}
    onBrightness={handleBrightness}
    onContrast={handleContrast}
    onUndo={handleUndo}
    onRedo={handleRedo}
    onReset={handleReset}
    onExport={handleExport}
  />
  <div class="editor-body">
    <div class="canvas-area">
      {#if $isProcessing}<div class="processing-overlay" aria-live="polite">Processing...</div>{/if}
      {#if preview}
        <img src={preview} alt="Edited photo preview" class="canvas-preview" />
      {:else}
        <div class="canvas-placeholder" role="img" aria-label="Photo editor preview — loading">
          <span>Loading preview...</span>
        </div>
      {/if}
    </div>
    <aside class="right-panel">
      <FilterPicker
        imageUrl={assetUrl}
        activeFilterId={getActiveFilter()}
        onSelect={handleFilterSelect}
      />
      <div class="op-stack">
        <h3 class="op-stack-title">Operations</h3>
        {#if chain && chain.operations.length > 0}
          <ul class="op-list">
            {#each chain.operations as op, i (i)}
              <li class="op-item">
                <span class="op-name">{op.type}</span>
                <button
                  class="op-remove-btn"
                  on:click={() => {
                    removeOperation(i);
                    refreshPreview();
                  }}
                  title="Remove"
                  aria-label="Remove {op.type}">&#10005;</button
                >
              </li>
            {/each}
          </ul>
        {:else}
          <p class="op-empty">No operations applied.</p>
        {/if}
      </div>
    </aside>
  </div>
</div>

<style>
  .photo-editor {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    background-color: var(--background-primary, #fff);
    position: relative;
  }
  .editor-body {
    display: flex;
    flex: 1;
    overflow: hidden;
  }
  .canvas-area {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: auto;
    background-color: var(--background-secondary, #f3f4f6);
    position: relative;
    padding: var(--spacing-m, 12px);
  }
  .canvas-preview {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    border-radius: var(--radius-s, 4px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
  .canvas-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted, #9ca3af);
    font-size: var(--font-ui-small, 13px);
  }
  .processing-overlay {
    position: absolute;
    top: var(--spacing-s, 8px);
    left: 50%;
    transform: translateX(-50%);
    background-color: var(--background-primary, #fff);
    border: 1px solid var(--border-color, #e5e7eb);
    border-radius: var(--radius-m, 6px);
    padding: var(--spacing-xs, 4px) var(--spacing-m, 12px);
    font-size: var(--font-ui-smaller, 11px);
    color: var(--text-muted, #6b7280);
    z-index: 10;
  }
  .right-panel {
    width: 200px;
    flex-shrink: 0;
    border-left: 1px solid var(--border-color, #e5e7eb);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }
  .op-stack {
    padding: var(--spacing-s, 8px);
    border-top: 1px solid var(--border-color, #e5e7eb);
  }
  .op-stack-title {
    font-size: var(--font-ui-smaller, 11px);
    font-weight: 600;
    color: var(--text-muted, #6b7280);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0 0 var(--spacing-xs, 4px);
  }
  .op-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs, 4px);
  }
  .op-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-xs, 4px) var(--spacing-s, 8px);
    background-color: var(--background-secondary, #f9fafb);
    border-radius: var(--radius-s, 4px);
    font-size: var(--font-ui-smaller, 11px);
  }
  .op-name {
    color: var(--text-normal, #111827);
    font-weight: 500;
    text-transform: capitalize;
  }
  .op-remove-btn {
    background: none;
    border: none;
    color: var(--text-muted, #9ca3af);
    cursor: pointer;
    font-size: 11px;
    padding: 0;
    line-height: 1;
  }
  .op-remove-btn:hover {
    color: var(--text-error, #ef4444);
  }
  .op-empty {
    font-size: var(--font-ui-smaller, 11px);
    color: var(--text-muted, #9ca3af);
    margin: 0;
  }
</style>
