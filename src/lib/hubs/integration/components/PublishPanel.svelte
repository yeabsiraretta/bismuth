<script lang="ts">
  import { getNotes } from '@/hubs/core/stores/vault-store.svelte';
  import Panel from '@/ui/panel.svelte';
  import { publishNotes, type PublishResult, type ExportFormat } from '@/sal/publish-service';

  let publishTarget = $state<ExportFormat>('html');
  let selectedNotes = $state<string[]>([]);
  let isPublishing = $state(false);
  let result = $state<PublishResult | null>(null);

  let notes = $derived(getNotes());

  function toggleNote(path: string) {
    if (selectedNotes.includes(path)) {
      selectedNotes = selectedNotes.filter((p) => p !== path);
    } else {
      selectedNotes = [...selectedNotes, path];
    }
  }

  function selectAll() {
    selectedNotes = notes.map((n) => n.path);
  }

  function selectNone() {
    selectedNotes = [];
  }

  async function publish() {
    isPublishing = true;
    result = null;
    try {
      result = await publishNotes(publishTarget, selectedNotes);
    } catch (e) {
      result = { exported: 0, failed: selectedNotes.length, outputPath: '', errors: [String(e)] };
    } finally {
      isPublishing = false;
    }
  }
</script>

<Panel title="Publish">
  <div class="publish-panel">
    <div class="format-row">
      <label class="format-label" for="publish-format">Format</label>
      <select id="publish-format" class="format-select" bind:value={publishTarget}>
        <option value="html">HTML</option>
        <option value="markdown">Markdown</option>
        <option value="pdf">PDF</option>
      </select>
    </div>

    <div class="selection-controls">
      <span class="sel-count">{selectedNotes.length} selected</span>
      <button class="sel-btn" onclick={selectAll}>All</button>
      <button class="sel-btn" onclick={selectNone}>None</button>
    </div>

    <ul class="note-list">
      {#each notes.slice(0, 50) as note (note.path)}
        <li class="note-item">
          <label class="note-label">
            <input
              type="checkbox"
              checked={selectedNotes.includes(note.path)}
              onchange={() => toggleNote(note.path)}
            />
            <span class="note-name">{note.title}</span>
          </label>
        </li>
      {/each}
    </ul>

    <button
      class="publish-btn"
      onclick={publish}
      disabled={selectedNotes.length === 0 || isPublishing}
    >
      {isPublishing ? 'Publishing…' : `Publish ${selectedNotes.length} notes`}
    </button>

    {#if result}
      <div class="publish-result" class:has-errors={result.failed > 0}>
        <span class="result-text"
          >{result.exported} exported{result.failed > 0 ? `, ${result.failed} failed` : ''}</span
        >
        {#if result.outputPath}
          <span class="result-path">{result.outputPath}</span>
        {/if}
      </div>
    {/if}
  </div>
</Panel>

<style>
  .publish-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .format-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    border-bottom: 1px solid var(--color-border);
  }
  .format-label {
    font-size: 0.7rem;
    color: var(--color-text-muted);
    font-weight: 600;
  }
  .format-select {
    flex: 1;
    padding: 4px;
    font-size: 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-background);
    color: var(--color-text);
  }
  .selection-controls {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 8px;
    border-bottom: 1px solid var(--color-border);
  }
  .sel-count {
    font-size: 0.65rem;
    color: var(--color-text-muted);
    flex: 1;
  }
  .sel-btn {
    font-size: 0.6rem;
    padding: 2px 6px;
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text-muted);
    border-radius: var(--radius-s);
    cursor: pointer;
  }
  .sel-btn:hover {
    color: var(--color-text);
    border-color: var(--color-accent);
  }
  .note-list {
    list-style: none;
    margin: 0;
    padding: 0;
    flex: 1;
    overflow-y: auto;
  }
  .note-item {
    border-bottom: 1px solid var(--color-border);
  }
  .note-label {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    font-size: 0.7rem;
    color: var(--color-text);
    cursor: pointer;
  }
  .note-label:hover {
    background: var(--color-surface-hover);
  }
  .note-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .publish-btn {
    margin: 8px;
    padding: 6px 12px;
    font-size: 0.75rem;
    border: 1px solid var(--color-accent);
    background: transparent;
    color: var(--color-accent);
    border-radius: var(--radius-s);
    cursor: pointer;
  }
  .publish-btn:hover:not(:disabled) {
    background: var(--color-accent);
    color: var(--color-background);
  }
  .publish-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .publish-result {
    padding: 6px 8px;
    font-size: 0.7rem;
    border-radius: var(--radius-s);
    background: var(--color-surface);
  }
  .publish-result.has-errors {
    background: oklch(from var(--color-error) l c h / 0.1);
  }
  .result-text {
    display: block;
    font-weight: 500;
    color: var(--color-text);
  }
  .result-path {
    display: block;
    font-size: 0.6rem;
    color: var(--color-text-muted);
    word-break: break-all;
    margin-top: 2px;
  }
</style>
