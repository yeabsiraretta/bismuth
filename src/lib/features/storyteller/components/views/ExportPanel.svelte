<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { activeStory } from '../../stores/storyStore';
  import { allEntities } from '../../stores/entityStore';
  import { activeStoryId } from '../../stores/storyStore';
  import { exportProject } from '../../services/exportService';
  import type { ExportOptions, ExportFormat, ExportScope } from '../../types/project';
  import { DEFAULT_EXPORT_OPTIONS } from '../../types/project';

  let options: ExportOptions = { ...DEFAULT_EXPORT_OPTIONS };
  let result: { content: string; filename: string } | null = null;
  let copied = false;

  const FORMATS: { value: ExportFormat; label: string; icon: string }[] = [
    { value: 'markdown', label: 'Markdown', icon: 'file-text' },
    { value: 'json', label: 'JSON', icon: 'code' },
    { value: 'csv', label: 'CSV', icon: 'grid' },
    { value: 'html', label: 'HTML', icon: 'globe' },
  ];

  function handleExport() {
    if (!$activeStory) return;
    const storyEntities = $allEntities.filter((e) => e.storyId === $activeStoryId);
    const r = exportProject($activeStory, storyEntities, options);
    result = r;
    copied = false;
  }

  function copyToClipboard() {
    if (!result) return;
    navigator.clipboard.writeText(result.content);
    copied = true;
    setTimeout(() => {
      copied = false;
    }, 2000);
  }
</script>

<div class="ex-panel">
  <div class="ex-header"><h3>Export</h3></div>

  <div class="ex-content">
    <div class="ex-section">
      <label class="ex-label">Format</label>
      <div class="ex-format-grid">
        {#each FORMATS as fmt}
          <button
            class="ex-format-btn"
            class:active={options.format === fmt.value}
            on:click={() => {
              options = { ...options, format: fmt.value };
              result = null;
            }}
          >
            <Icon name={fmt.icon} size={16} />
            <span>{fmt.label}</span>
          </button>
        {/each}
      </div>
    </div>

    <div class="ex-section">
      <label class="ex-label">Scope</label>
      <div class="ex-scope-btns">
        <button
          class:active={options.scope === 'manuscript'}
          on:click={() => {
            options = { ...options, scope: 'manuscript' };
          }}>Full Manuscript</button
        >
        <button
          class:active={options.scope === 'outline'}
          on:click={() => {
            options = { ...options, scope: 'outline' };
          }}>Outline Only</button
        >
      </div>
    </div>

    <div class="ex-section">
      <label class="ex-label">Options</label>
      <label class="ex-check"
        ><input type="checkbox" bind:checked={options.includeMetadata} /> Include metadata</label
      >
      <label class="ex-check"
        ><input type="checkbox" bind:checked={options.includeStats} /> Include statistics</label
      >
    </div>

    {#if options.format === 'html'}
      <div class="ex-section">
        <label class="ex-label">HTML Settings</label>
        <div class="ex-row">
          <label
            >Font <select bind:value={options.fontFamily} class="ex-select">
              <option value="serif">Serif</option>
              <option value="sans-serif">Sans-serif</option>
              <option value="monospace">Monospace</option>
            </select></label
          >
          <label
            >Size <input
              type="number"
              class="ex-num"
              bind:value={options.fontSize}
              min={8}
              max={24}
            /></label
          >
        </div>
      </div>
    {/if}

    <button class="ex-export-btn" on:click={handleExport} disabled={!$activeStory}>
      <Icon name="download" size={14} /> Export {options.format.toUpperCase()}
    </button>
  </div>

  {#if result}
    <div class="ex-result">
      <div class="ex-result-header">
        <span class="ex-filename">{result.filename}</span>
        <button class="ex-copy-btn" on:click={copyToClipboard}>
          <Icon name={copied ? 'check' : 'clipboard'} size={13} />
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <textarea class="ex-output" readonly value={result.content}></textarea>
    </div>
  {/if}
</div>

<style>
  .ex-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .ex-header {
    padding: 10px 14px;
    border-bottom: 1px solid var(--background-modifier-border, #333);
  }
  .ex-header h3 {
    margin: 0;
    font-size: 14px;
  }
  .ex-content {
    flex: 1;
    overflow-y: auto;
    padding: 12px 14px;
  }
  .ex-section {
    margin-bottom: 16px;
  }
  .ex-label {
    display: block;
    font-size: 11px;
    font-weight: 600;
    opacity: 0.7;
    margin-bottom: 6px;
  }
  .ex-format-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
  }
  .ex-format-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 12px;
    border: 1px solid var(--background-modifier-border, #444);
    border-radius: 6px;
    background: none;
    color: var(--text-normal);
    cursor: pointer;
    font-size: 12px;
  }
  .ex-format-btn:hover {
    background: var(--background-modifier-hover, #2a2a2a);
  }
  .ex-format-btn.active {
    border-color: var(--interactive-accent, #7c3aed);
    background: rgba(124, 58, 237, 0.1);
  }
  .ex-scope-btns {
    display: flex;
    gap: 6px;
  }
  .ex-scope-btns button {
    flex: 1;
    padding: 6px;
    border: 1px solid var(--background-modifier-border, #444);
    border-radius: 4px;
    background: none;
    color: var(--text-normal);
    cursor: pointer;
    font-size: 12px;
  }
  .ex-scope-btns button.active {
    border-color: var(--interactive-accent, #7c3aed);
    background: rgba(124, 58, 237, 0.1);
  }
  .ex-check {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    cursor: pointer;
    margin-bottom: 4px;
  }
  .ex-row {
    display: flex;
    gap: 12px;
  }
  .ex-row label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
  }
  .ex-select {
    padding: 3px 6px;
    border: 1px solid var(--background-modifier-border, #444);
    border-radius: 3px;
    background: var(--background-primary);
    color: var(--text-normal);
    font-size: 11px;
  }
  .ex-num {
    width: 45px;
    padding: 3px 6px;
    border: 1px solid var(--background-modifier-border, #444);
    border-radius: 3px;
    background: var(--background-primary);
    color: var(--text-normal);
    font-size: 11px;
  }
  .ex-export-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px;
    border: none;
    border-radius: 4px;
    background: var(--interactive-accent, #7c3aed);
    color: #fff;
    cursor: pointer;
    font-size: 13px;
  }
  .ex-export-btn:hover {
    opacity: 0.9;
  }
  .ex-export-btn:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .ex-result {
    padding: 12px 14px;
    border-top: 1px solid var(--background-modifier-border, #333);
  }
  .ex-result-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  .ex-filename {
    font-size: 12px;
    font-weight: 500;
  }
  .ex-copy-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border: 1px solid var(--background-modifier-border, #444);
    border-radius: 4px;
    background: none;
    color: var(--text-normal);
    cursor: pointer;
    font-size: 11px;
  }
  .ex-output {
    width: 100%;
    height: 180px;
    padding: 8px;
    border: 1px solid var(--background-modifier-border, #444);
    border-radius: 4px;
    background: var(--background-primary);
    color: var(--text-normal);
    font-family: monospace;
    font-size: 11px;
    resize: vertical;
  }
</style>
