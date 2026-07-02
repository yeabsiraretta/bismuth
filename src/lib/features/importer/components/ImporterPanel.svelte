<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { IMPORT_SOURCES } from '../types/importer';
  import type { ImportSource } from '../types/importer';
  import {
    importOptions,
    isImporting,
    importProgress,
    lastImportResult,
    progressLabel,
    importHistory,
    selectSource,
    updateOption,
    executeImport,
    resetImporter,
  } from '../stores/importer';

  let step: 'source' | 'options' | 'progress' | 'result' = 'source';

  function handleSelectSource(source: ImportSource) {
    selectSource(source);
    step = 'options';
  }

  function goBack() {
    if (step === 'options') {
      step = 'source';
      resetImporter();
    } else if (step === 'result') {
      step = 'source';
      resetImporter();
    }
  }

  async function handleStartImport() {
    step = 'progress';
    const result = await executeImport();
    if (result) step = 'result';
    else step = 'options';
  }
</script>

<div class="importer-panel">
  <div class="importer-header">
    {#if step !== 'source'}
      <button class="back-btn" on:click={goBack} title="Back">
        <Icon name="arrow-left" size={16} />
      </button>
    {/if}
    <h3 class="importer-title">
      <Icon name="download" size={18} />
      Import Notes
    </h3>
  </div>

  {#if step === 'source'}
    <!-- Source selection grid -->
    <p class="importer-hint">Select the source format to import from:</p>
    <div class="source-grid">
      {#each IMPORT_SOURCES as source}
        <button class="source-card" on:click={() => handleSelectSource(source.id)}>
          <Icon name={source.icon} size={24} />
          <span class="source-label">{source.label}</span>
          <span class="source-desc">{source.description}</span>
        </button>
      {/each}
    </div>

    {#if $importHistory.length > 0}
      <div class="history-section">
        <h4 class="section-title">Recent Imports</h4>
        {#each $importHistory as entry}
          <div class="history-item">
            <Icon name="check" size={14} />
            <span>{entry.imported} notes from {entry.source}</span>
            <span class="history-time">{new Date(entry.timestamp).toLocaleTimeString()}</span>
          </div>
        {/each}
      </div>
    {/if}
  {:else if step === 'options'}
    <!-- Import options -->
    <div class="options-form">
      <div class="option-group">
        <span class="option-label">Source</span>
        <span class="option-value">
          {IMPORT_SOURCES.find((s) => s.id === $importOptions.source)?.label ??
            $importOptions.source}
        </span>
      </div>

      <div class="option-group">
        <label class="option-label" for="dest-folder">Destination folder</label>
        <input
          id="dest-folder"
          type="text"
          class="option-input"
          placeholder="(vault root)"
          value={$importOptions.destinationFolder}
          on:input={(e) => updateOption('destinationFolder', e.currentTarget.value)}
        />
      </div>

      <div class="option-group option-row">
        <label class="option-label" for="create-subfolder">Create subfolder</label>
        <input
          id="create-subfolder"
          type="checkbox"
          class="option-checkbox"
          checked={$importOptions.createSubfolder}
          on:change={(e) => updateOption('createSubfolder', e.currentTarget.checked)}
        />
      </div>

      <div class="option-group option-row">
        <label class="option-label" for="add-frontmatter">Add import metadata</label>
        <input
          id="add-frontmatter"
          type="checkbox"
          class="option-checkbox"
          checked={$importOptions.addFrontmatter}
          on:change={(e) => updateOption('addFrontmatter', e.currentTarget.checked)}
        />
      </div>

      <div class="option-group">
        <label class="option-label" for="import-tag">Import tag</label>
        <input
          id="import-tag"
          type="text"
          class="option-input"
          placeholder="imported"
          value={$importOptions.importTag ?? ''}
          on:input={(e) => updateOption('importTag', e.currentTarget.value || undefined)}
        />
      </div>

      {#if $importOptions.source === 'csv'}
        <div class="option-group">
          <label class="option-label" for="csv-title">Title column</label>
          <input
            id="csv-title"
            type="text"
            class="option-input"
            placeholder="(first column)"
            value={$importOptions.csvTitleColumn ?? ''}
            on:input={(e) => updateOption('csvTitleColumn', e.currentTarget.value || undefined)}
          />
        </div>
        <div class="option-group">
          <label class="option-label" for="csv-body">Body column</label>
          <input
            id="csv-body"
            type="text"
            class="option-input"
            placeholder="(second column)"
            value={$importOptions.csvBodyColumn ?? ''}
            on:input={(e) => updateOption('csvBodyColumn', e.currentTarget.value || undefined)}
          />
        </div>
      {/if}

      <button class="import-btn" on:click={handleStartImport} disabled={$isImporting}>
        <Icon name="download" size={16} />
        Select Files & Import
      </button>
    </div>
  {:else if step === 'progress'}
    <!-- Progress -->
    <div class="progress-section">
      <div class="progress-spinner">
        <Icon name="loader" size={32} />
      </div>
      <p class="progress-label">{$progressLabel || 'Starting import…'}</p>
      {#if $importProgress}
        <div class="progress-bar-container">
          <div
            class="progress-bar-fill"
            style="width: {($importProgress.current / Math.max($importProgress.total, 1)) * 100}%"
          ></div>
        </div>
        <span class="progress-count">{$importProgress.current} / {$importProgress.total}</span>
      {/if}
    </div>
  {:else if step === 'result'}
    <!-- Result -->
    <div class="result-section">
      {#if $lastImportResult}
        <div
          class="result-icon"
          class:success={$lastImportResult.failed === 0}
          class:error={$lastImportResult.imported === 0 && $lastImportResult.failed > 0}
        >
          <Icon name={$lastImportResult.failed === 0 ? 'check' : 'alert-circle'} size={32} />
        </div>

        <h4 class="result-title">
          {#if $lastImportResult.imported > 0}
            Import Complete
          {:else}
            Import Failed
          {/if}
        </h4>

        <div class="result-stats">
          <div class="stat">
            <span class="stat-value">{$lastImportResult.imported}</span>
            <span class="stat-label">imported</span>
          </div>
          {#if $lastImportResult.failed > 0}
            <div class="stat stat-error">
              <span class="stat-value">{$lastImportResult.failed}</span>
              <span class="stat-label">failed</span>
            </div>
          {/if}
          {#if $lastImportResult.skipped > 0}
            <div class="stat">
              <span class="stat-value">{$lastImportResult.skipped}</span>
              <span class="stat-label">skipped</span>
            </div>
          {/if}
        </div>

        <span class="result-duration"
          >Completed in {($lastImportResult.durationMs / 1000).toFixed(1)}s</span
        >

        {#if $lastImportResult.errors.length > 0}
          <details class="error-details">
            <summary>Errors ({$lastImportResult.errors.length})</summary>
            <ul class="error-list">
              {#each $lastImportResult.errors as err}
                <li><strong>{err.title}:</strong> {err.error}</li>
              {/each}
            </ul>
          </details>
        {/if}
      {/if}

      <button class="import-btn" on:click={goBack}>
        <Icon name="arrow-left" size={16} /> Import More
      </button>
    </div>
  {/if}
</div>

<style>
  @import './ImporterPanel.css';
</style>
