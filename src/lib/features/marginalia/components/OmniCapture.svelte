<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { marginaliaSettings, setLastCaptureDestination } from '../stores/marginStore';
  import { wrapWithMarginNote } from '../services/marginParser';

  export let open = false;
  export let onClose: () => void = () => {};

  let noteText = '';
  let destination = $marginaliaSettings.lastCaptureDestination || '';
  let direction: 'right' | 'left' = $marginaliaSettings.defaultDirection;
  let saving = false;
  let suggestions: string[] = [];

  $: if (destination.length > 1) loadSuggestions(destination);
  $: syntax = noteText ? wrapWithMarginNote(noteText, direction) : '';

  async function loadSuggestions(query: string) {
    try {
      const { scanVaultMeta } = await import('@/services/vault/vault');
      const meta = await scanVaultMeta();
      const q = query.toLowerCase();
      suggestions = meta
        .filter((n) => n.path.toLowerCase().includes(q))
        .slice(0, 6)
        .map((n) => n.path);
    } catch {
      suggestions = [];
    }
  }

  async function handleSave() {
    if (!noteText.trim() || !destination.trim()) return;
    saving = true;
    try {
      const { getNote } = await import('@/services/vault/vault');
      const { writeNote } = await import('@/services/vault/vault');
      const note = await getNote(destination);
      const updated = note.content + '\n' + syntax;
      await writeNote(destination, updated);
      setLastCaptureDestination(destination);
      noteText = '';
      onClose();
    } catch (error) {
      try {
        const { createNote } = await import('@/services/vault/vault');
        await createNote(destination, syntax + '\n');
        setLastCaptureDestination(destination);
        noteText = '';
        onClose();
      } catch {
        /* could not create */
      }
    } finally {
      saving = false;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose();
      return;
    }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
  }

  function selectSuggestion(path: string) {
    destination = path;
    suggestions = [];
  }
</script>

{#if open}
  <div
    class="capture-overlay"
    on:click|self={onClose}
    on:keydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <div class="capture-modal">
      <div class="capture-header">
        <Icon name="quote" size={16} />
        <h3 class="capture-title">Quick Capture</h3>
        <button class="close-btn" on:click={onClose}><Icon name="x" size={14} /></button>
      </div>

      <div class="capture-body">
        <div class="field-group">
          <label class="field-label" for="capture-dest">Destination</label>
          <div class="dest-wrapper">
            <input
              id="capture-dest"
              class="field-input"
              type="text"
              placeholder="path/to/note.md"
              bind:value={destination}
              on:focus={() => loadSuggestions(destination)}
            />
            {#if suggestions.length > 0}
              <ul class="suggestions">
                {#each suggestions as s}
                  <li>
                    <button class="suggestion-btn" on:click={() => selectSuggestion(s)}>{s}</button>
                  </li>
                {/each}
              </ul>
            {/if}
          </div>
        </div>

        <div class="field-group">
          <label class="field-label" for="capture-text">Margin Note</label>
          <textarea
            id="capture-text"
            class="field-textarea"
            rows="3"
            placeholder="Your margin note..."
            bind:value={noteText}
          ></textarea>
        </div>

        <div class="field-row">
          <label class="field-label" for="dir-toggle-right">Direction</label>
          <div class="dir-toggle">
            <button
              class="dir-btn"
              class:active={direction === 'right'}
              on:click={() => (direction = 'right')}
            >
              Right %%&gt; %%
            </button>
            <button
              class="dir-btn"
              class:active={direction === 'left'}
              on:click={() => (direction = 'left')}
            >
              Left %%&lt; %%
            </button>
          </div>
        </div>

        {#if syntax}
          <div class="preview">
            <span class="preview-label">Preview:</span>
            <code class="preview-code">{syntax}</code>
          </div>
        {/if}
      </div>

      <div class="capture-footer">
        <span class="shortcut-hint">Ctrl+Enter to save</span>
        <button
          class="save-btn"
          on:click={handleSave}
          disabled={saving || !noteText.trim() || !destination.trim()}
        >
          {saving ? 'Saving...' : 'Save to Margin'}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .capture-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 15vh;
    z-index: 1000;
  }
  .capture-modal {
    width: 460px;
    max-width: 90vw;
    background: var(--background-primary);
    border-radius: var(--radius-m);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
    overflow: hidden;
  }
  .capture-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-m);
    border-bottom: 1px solid var(--border-color);
  }
  .capture-title {
    font-size: var(--font-ui-small);
    font-weight: 600;
    margin: 0;
    flex: 1;
  }
  .close-btn {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 4px;
    border-radius: var(--radius-s);
  }
  .close-btn:hover {
    color: var(--text-normal);
  }
  .capture-body {
    padding: var(--spacing-m);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-m);
  }
  .field-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .field-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .field-input {
    padding: var(--spacing-xs) var(--spacing-s);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    background: var(--background-primary);
    color: var(--text-normal);
    font-size: var(--font-ui-small);
  }
  .field-input:focus {
    border-color: var(--interactive-accent);
    outline: none;
  }
  .field-textarea {
    padding: var(--spacing-s);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    background: var(--background-primary);
    color: var(--text-normal);
    font-size: var(--font-ui-small);
    resize: vertical;
    font-family: inherit;
  }
  .field-textarea:focus {
    border-color: var(--interactive-accent);
    outline: none;
  }
  .dest-wrapper {
    position: relative;
  }
  .suggestions {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--background-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    margin: 2px 0 0;
    padding: 0;
    list-style: none;
    max-height: 150px;
    overflow-y: auto;
    z-index: 10;
  }
  .suggestion-btn {
    width: 100%;
    padding: 4px 8px;
    border: none;
    background: none;
    text-align: left;
    color: var(--text-normal);
    font-size: 11px;
    cursor: pointer;
  }
  .suggestion-btn:hover {
    background: var(--background-modifier-hover);
  }
  .field-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .dir-toggle {
    display: flex;
    gap: 2px;
  }
  .dir-btn {
    padding: 3px 10px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-muted);
    font-size: 10px;
    cursor: pointer;
  }
  .dir-btn.active {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    border-color: var(--interactive-accent);
  }
  .preview {
    background: var(--background-secondary);
    padding: var(--spacing-xs) var(--spacing-s);
    border-radius: var(--radius-s);
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }
  .preview-label {
    font-size: 10px;
    color: var(--text-muted);
    flex-shrink: 0;
  }
  .preview-code {
    font-size: 11px;
    color: var(--text-normal);
    font-family: var(--font-monospace);
    word-break: break-all;
  }
  .capture-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-m);
    border-top: 1px solid var(--border-color);
  }
  .shortcut-hint {
    font-size: 10px;
    color: var(--text-faint);
  }
  .save-btn {
    padding: var(--spacing-xs) var(--spacing-m);
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    border: none;
    border-radius: var(--radius-s);
    font-size: var(--font-ui-small);
    font-weight: 600;
    cursor: pointer;
  }
  .save-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
