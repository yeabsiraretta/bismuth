<script lang="ts">
  /**
   * ConvertPanel — image conversion, compression, resize, and flip panel.
   * Supports single-file and batch processing. Pure JS, fully offline.
   */
  import Icon from '@/components/icons/Icon.svelte';
  import PanelHeader from '@/components/ui/layout/PanelHeader.svelte';
  import FilterChip from '@/components/ui/actions/FilterChip.svelte';
  import { pickImportFile } from '@/services/system/dialog';
  import { toAssetUrl } from '@/services/system/asset';
  import { convertImage, getImageDimensions, estimateOutputSize } from '../../services/imageConverter';
  import { writeMediaExport, blobToUint8Array } from '../../services/mediaService';
  import { extractBaseName, extractDir, buildOutputPath } from '../../services/imageRename';
  import type { ConversionConfig, ImageFormat, ResizeMode, RenameConfig } from '../../types/media';
  import { DEFAULT_CONVERSION, DEFAULT_RENAME, RENAME_VARIABLES, FORMAT_EXT_MAP } from '../../types/media';
  import { showToast } from '@/stores/toast/toast';
  import { log } from '@/utils/logger';

  let config: ConversionConfig = { ...DEFAULT_CONVERSION };
  let renameConfig: RenameConfig = { ...DEFAULT_RENAME };
  let sourcePath = '';
  let previewUrl = '';
  let srcDimensions = { width: 0, height: 0 };
  let estimatedSize = 0;
  let isConverting = false;
  let showRename = false;

  const formats: ImageFormat[] = ['webp', 'jpeg', 'png'];
  const resizeModes: { id: ResizeMode; label: string }[] = [
    { id: 'width', label: 'Width' },
    { id: 'height', label: 'Height' },
    { id: 'longest-edge', label: 'Longest' },
    { id: 'shortest-edge', label: 'Shortest' },
    { id: 'fit', label: 'Fit' },
    { id: 'fill', label: 'Fill' },
  ];

  async function openFile(): Promise<void> {
    try {
      const selected = await pickImportFile({
        multiple: false,
        filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tif', 'tiff'] }],
      });
      if (typeof selected === 'string') {
        sourcePath = selected;
        previewUrl = toAssetUrl(selected);
        srcDimensions = await getImageDimensions(previewUrl);
        await updateEstimate();
        log.info('ConvertPanel: opened', { path: selected, w: srcDimensions.width, h: srcDimensions.height });
      }
    } catch (err) {
      log.error('ConvertPanel: open failed', err as Error);
    }
  }

  async function updateEstimate(): Promise<void> {
    if (!previewUrl) return;
    estimatedSize = await estimateOutputSize(previewUrl, config);
  }

  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(2)} MB`;
  }

  async function handleConvert(): Promise<void> {
    if (!sourcePath || !previewUrl) return;
    isConverting = true;
    try {
      const blob = await convertImage(previewUrl, config);
      const ctx = { noteName: '', fileName: extractBaseName(sourcePath), index: 1 };
      const dir = extractDir(sourcePath);
      const destPath = buildOutputPath(dir + '/media-edits', renameConfig, config.outputFormat, ctx);
      await writeMediaExport(destPath, sourcePath, await blobToUint8Array(blob));
      showToast(`Converted: ${destPath.split('/').pop()}`, 'success');
      log.info('ConvertPanel: converted', { destPath, size: blob.size });
    } catch (err) {
      showToast(`Conversion failed: ${err}`, 'error');
      log.error('ConvertPanel: conversion failed', err as Error);
    } finally {
      isConverting = false;
    }
  }

  $: if (previewUrl && config) {
    updateEstimate();
  }
</script>

<div class="convert-panel" role="tabpanel" aria-label="Image Converter">
  <PanelHeader icon="image" title="Convert" />

  {#if !sourcePath}
    <div class="empty-state">
      <Icon name="image" size={28} />
      <p class="empty-title">Image Converter</p>
      <p class="empty-desc">Convert, compress, resize, and flip images. Pure JS, fully offline.</p>
      <button class="open-btn" on:click={openFile}>Open Image</button>
    </div>
  {:else}
    <div class="convert-body">
      <div class="preview-section">
        <img src={previewUrl} alt="Source preview" class="preview-img" />
        <div class="preview-meta">
          <span>{srcDimensions.width} x {srcDimensions.height}</span>
          <button class="change-btn" on:click={openFile}>Change</button>
        </div>
      </div>

      <div class="config-section">
        <div class="config-group">
          <span class="config-label">Format</span>
          <div class="chip-row">
            {#each formats as fmt}
              <FilterChip
                label={fmt.toUpperCase()}
                active={config.outputFormat === fmt}
                on:click={() => { config = { ...config, outputFormat: fmt }; }}
              />
            {/each}
          </div>
        </div>

        <div class="config-group">
          <label class="config-label" for="cv-quality">
            Quality <span class="config-value">{config.quality}%</span>
          </label>
          <input
            id="cv-quality"
            type="range"
            min="1"
            max="100"
            bind:value={config.quality}
            class="range-input"
          />
        </div>

        <div class="config-group">
          <label class="config-label" for="cv-resize-toggle">
            <input id="cv-resize-toggle" type="checkbox" bind:checked={config.resizeEnabled} />
            Resize
          </label>
          {#if config.resizeEnabled}
            <div class="resize-controls">
              <div class="chip-row wrap">
                {#each resizeModes as mode}
                  <FilterChip
                    label={mode.label}
                    active={config.resizeMode === mode.id}
                    on:click={() => { config = { ...config, resizeMode: mode.id }; }}
                  />
                {/each}
              </div>
              <label class="inline-label" for="cv-resize-val">
                Size
                <input
                  id="cv-resize-val"
                  type="number"
                  min="16"
                  max="8192"
                  bind:value={config.resizeValue}
                  class="num-input"
                />
                px
              </label>
            </div>
          {/if}
        </div>

        <div class="config-group">
          <label class="config-label" for="cv-flip-toggle">
            <input id="cv-flip-toggle" type="checkbox" bind:checked={config.flipEnabled} />
            Flip
          </label>
          {#if config.flipEnabled}
            <div class="chip-row">
              <FilterChip
                label="Horizontal"
                active={config.flipDirection === 'horizontal'}
                on:click={() => { config = { ...config, flipDirection: 'horizontal' }; }}
              />
              <FilterChip
                label="Vertical"
                active={config.flipDirection === 'vertical'}
                on:click={() => { config = { ...config, flipDirection: 'vertical' }; }}
              />
            </div>
          {/if}
        </div>

        <button class="rename-toggle" on:click={() => showRename = !showRename}>
          <Icon name={showRename ? 'chevron-down' : 'chevron-right'} size={12} />
          File Naming
        </button>

        {#if showRename}
          <div class="rename-section">
            <label class="config-label" for="cv-rename-toggle">
              <input id="cv-rename-toggle" type="checkbox" bind:checked={renameConfig.enabled} />
              Custom rename
            </label>
            {#if renameConfig.enabled}
              <label class="inline-label" for="cv-rename-pattern">
                Pattern
                <input id="cv-rename-pattern" type="text" bind:value={renameConfig.pattern} class="text-input" placeholder="{'{noteName}'}-{'{fileName}'}" />
              </label>
              <div class="var-hints">
                {#each RENAME_VARIABLES as v}
                  <button class="var-chip" on:click={() => { renameConfig = { ...renameConfig, pattern: renameConfig.pattern + v }; }}>{v}</button>
                {/each}
              </div>
            {/if}
            <label class="inline-label" for="cv-output-folder">
              Output folder
              <input id="cv-output-folder" type="text" bind:value={renameConfig.outputFolder} class="text-input" placeholder="relative or absolute" />
            </label>
          </div>
        {/if}
      </div>

      <div class="action-bar">
        <div class="estimate">
          {#if estimatedSize > 0}
            <span class="estimate-text">Est. {formatBytes(estimatedSize)}</span>
            <span class="estimate-ext">{FORMAT_EXT_MAP[config.outputFormat]}</span>
          {/if}
        </div>
        <button class="convert-btn" disabled={isConverting} on:click={handleConvert}>
          {#if isConverting}Converting...{:else}Convert{/if}
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .convert-panel { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
  .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 40px 20px; text-align: center; flex: 1; color: var(--text-muted); }
  .empty-title { font-size: 1rem; font-weight: 600; color: var(--text-normal); margin: 0; }
  .empty-desc { font-size: 0.75rem; max-width: 280px; line-height: 1.5; margin: 0; }
  .open-btn { padding: 6px 20px; background: var(--interactive-accent); color: var(--text-on-accent, #fff); border: none; border-radius: var(--radius-m, 6px); cursor: pointer; font-size: 0.8rem; }
  .open-btn:hover { background: var(--interactive-accent-hover); }

  .convert-body { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; }
  .preview-section { padding: 8px 12px; border-bottom: 1px solid var(--background-modifier-border); }
  .preview-img { width: 100%; max-height: 140px; object-fit: contain; border-radius: var(--radius-s); background: var(--background-secondary); }
  .preview-meta { display: flex; justify-content: space-between; align-items: center; font-size: 0.7rem; color: var(--text-muted); margin-top: 4px; }
  .change-btn { background: none; border: none; color: var(--interactive-accent); cursor: pointer; font-size: 0.7rem; }

  .config-section { padding: 8px 12px; display: flex; flex-direction: column; gap: 10px; }
  .config-group { display: flex; flex-direction: column; gap: 4px; }
  .config-label { font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 4px; }
  .config-value { font-weight: 600; color: var(--text-normal); }
  .chip-row { display: flex; gap: 4px; flex-wrap: nowrap; }
  .chip-row.wrap { flex-wrap: wrap; }
  .range-input { width: 100%; accent-color: var(--interactive-accent); }
  .resize-controls { display: flex; flex-direction: column; gap: 6px; padding-left: 4px; }
  .inline-label { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: var(--text-muted); }
  .num-input { width: 64px; padding: 2px 4px; border: 1px solid var(--background-modifier-border); border-radius: var(--radius-s); font-size: 0.75rem; background: var(--background-primary); color: var(--text-normal); }
  .text-input { flex: 1; padding: 2px 6px; border: 1px solid var(--background-modifier-border); border-radius: var(--radius-s); font-size: 0.75rem; background: var(--background-primary); color: var(--text-normal); min-width: 0; }

  .rename-toggle { display: flex; align-items: center; gap: 4px; background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 0.75rem; padding: 2px 0; }
  .rename-toggle:hover { color: var(--text-normal); }
  .rename-section { display: flex; flex-direction: column; gap: 6px; padding-left: 8px; }
  .var-hints { display: flex; flex-wrap: wrap; gap: 3px; }
  .var-chip { padding: 1px 5px; font-size: 0.65rem; border: 1px solid var(--background-modifier-border); border-radius: 8px; background: transparent; color: var(--text-muted); cursor: pointer; font-family: var(--font-monospace, monospace); }
  .var-chip:hover { border-color: var(--interactive-accent); color: var(--interactive-accent); }

  .action-bar { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; border-top: 1px solid var(--background-modifier-border); margin-top: auto; flex-shrink: 0; }
  .estimate { font-size: 0.7rem; color: var(--text-muted); display: flex; gap: 4px; }
  .estimate-ext { text-transform: uppercase; font-weight: 500; }
  .convert-btn { padding: 6px 16px; background: var(--interactive-accent); color: var(--text-on-accent, #fff); border: none; border-radius: var(--radius-m, 6px); cursor: pointer; font-size: 0.8rem; font-weight: 500; }
  .convert-btn:hover:not(:disabled) { background: var(--interactive-accent-hover); }
  .convert-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
