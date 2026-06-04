<script lang="ts">
  import { activeNote, updateNoteInStore, currentVault } from '@/stores/vault/vault';
  import { writeNote } from '@/services/vault/vault';
  import { onMount } from 'svelte';
  import Icon from '@/components/icons/Icon.svelte';
  import ConceptSuggestionPopover from './ConceptSuggestionPopover.svelte';
  import Editor from '@/components/editor/Editor.svelte';

  let content = '';
  let isSaving = false;
  let saveTimeout: ReturnType<typeof setTimeout> | null = null;
  let mode: 'edit' | 'preview' = 'edit';
  let editorRef: Editor;

  $: if ($activeNote) {
    content = $activeNote.content;
  }

  $: wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  $: charCount = content.length;
  $: lineCount = content.split('\n').length;

  // Auto-save with debouncing
  async function handleInput() {
    if (!$activeNote || !$currentVault) return;

    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    saveTimeout = setTimeout(async () => {
      await saveNote();
    }, 500); // 500ms debounce
  }

  async function saveNote() {
    if (!$activeNote || !$currentVault) return;

    isSaving = true;
    try {
      await writeNote($activeNote.path, content);

      // Update the note in the store
      updateNoteInStore({
        ...$activeNote,
        content,
        modified_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to save note:', error);
    } finally {
      isSaving = false;
    }
  }

  function handleContentChange(newContent: string) {
    content = newContent;
    handleInput();
  }

  function handleWikilinkClick(title: string) {
    // TODO: Navigate to the linked note
    console.log('Navigate to wikilink:', title);
  }

  // Handle concept link: wrap matched text in [[...]] syntax
  function handleConceptLink(offset: number, length: number, title: string) {
    const before = content.slice(0, offset);
    const after = content.slice(offset + length);
    content = `${before}[[${title}]]${after}`;
    handleInput();
  }

  onMount(() => {
    if (editorRef && mode === 'edit') {
      editorRef.focus();
    }
  });
</script>

<div class="note-editor">
  {#if $activeNote}
    <div class="editor-header">
      <h1 class="note-title">{$activeNote.title}</h1>
      <div class="editor-actions">
        <div class="mode-toggle">
          <button
            class="mode-btn"
            class:active={mode === 'edit'}
            on:click={() => (mode = 'edit')}
            title="Edit"
            aria-label="Edit mode"
          >
            <Icon name="edit-3" size={14} />
          </button>
          <button
            class="mode-btn"
            class:active={mode === 'preview'}
            on:click={() => (mode = 'preview')}
            title="Preview"
            aria-label="Preview mode"
          >
            <Icon name="eye" size={14} />
          </button>
        </div>
        {#if isSaving}
          <span class="status saving">Saving...</span>
        {:else}
          <span class="status saved">
            <Icon name="check" size={12} />
            Saved
          </span>
        {/if}
      </div>
    </div>

    <div class="editor-content">
      {#if mode === 'edit'}
        <Editor
          bind:this={editorRef}
          {content}
          onContentChange={handleContentChange}
          onWikilinkClick={handleWikilinkClick}
        />
        <ConceptSuggestionPopover
          {content}
          notePath={$activeNote.path}
          onLink={handleConceptLink}
        />
      {:else}
        <div class="preview-content">
          {#each content.split('\n') as line}
            {#if line.startsWith('# ')}
              <h1>{line.slice(2)}</h1>
            {:else if line.startsWith('## ')}
              <h2>{line.slice(3)}</h2>
            {:else if line.startsWith('### ')}
              <h3>{line.slice(4)}</h3>
            {:else if line.startsWith('- ')}
              <li>{line.slice(2)}</li>
            {:else if line.startsWith('> ')}
              <blockquote>{line.slice(2)}</blockquote>
            {:else if line.trim() === ''}
              <br />
            {:else}
              <p>{line}</p>
            {/if}
          {/each}
        </div>
      {/if}
    </div>

    <div class="editor-footer">
      <span class="stat">{wordCount} words</span>
      <span class="stat-sep">&middot;</span>
      <span class="stat">{charCount} chars</span>
      <span class="stat-sep">&middot;</span>
      <span class="stat">{lineCount} lines</span>
    </div>
  {:else}
    <div class="empty-editor">
      <div class="empty-content">
        <Icon name="file-text" size={48} color="var(--text-faint)" />
        <h2>No Note Selected</h2>
        <p>Select a note from the sidebar to start editing</p>
      </div>
    </div>
  {/if}
</div>

<style>
  .note-editor {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--background-primary, #ffffff);
  }

  .editor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1.5rem;
    border-bottom: 1px solid var(--border-color, #e5e7eb);
    background: var(--background-primary, #ffffff);
    min-height: 48px;
  }

  .note-title {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-normal, #1f2937);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    min-width: 0;
  }

  .editor-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-shrink: 0;
  }

  .mode-toggle {
    display: flex;
    border: 1px solid var(--border-color, #e5e7eb);
    border-radius: 6px;
    overflow: hidden;
  }

  .mode-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 26px;
    padding: 0;
    background: var(--background-primary, #ffffff);
    border: none;
    color: var(--text-muted, #9ca3af);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .mode-btn:first-child {
    border-right: 1px solid var(--border-color, #e5e7eb);
  }

  .mode-btn.active {
    background: var(--interactive-accent, #6366f1);
    color: var(--text-on-accent, #ffffff);
  }

  .mode-btn:hover:not(.active) {
    background: var(--background-modifier-hover, #f3f4f6);
  }

  .status {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-weight: 500;
  }

  .status.saving {
    color: var(--text-accent, #6366f1);
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  .status.saved {
    color: var(--text-muted, #6b7280);
  }

  .editor-content {
    flex: 1;
    overflow: hidden;
    position: relative;
  }

  .preview-content {
    font-size: 1rem;
    line-height: 1.7;
    color: var(--text-normal, #1f2937);
    max-width: 65ch;
  }

  .preview-content h1 {
    font-size: 1.75rem;
    font-weight: 700;
    margin: 1.5rem 0 0.75rem;
    color: var(--text-normal, #111827);
    border-bottom: 1px solid var(--border-color, #e5e7eb);
    padding-bottom: 0.5rem;
  }

  .preview-content h2 {
    font-size: 1.375rem;
    font-weight: 600;
    margin: 1.25rem 0 0.5rem;
    color: var(--text-normal, #1f2937);
  }

  .preview-content h3 {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 1rem 0 0.375rem;
    color: var(--text-normal, #374151);
  }

  .preview-content p {
    margin: 0.5rem 0;
  }

  .preview-content li {
    margin-left: 1.5rem;
    padding: 0.125rem 0;
  }

  .preview-content blockquote {
    margin: 0.75rem 0;
    padding: 0.5rem 1rem;
    border-left: 3px solid var(--interactive-accent, #6366f1);
    background: var(--background-secondary, #f9fafb);
    border-radius: 0 4px 4px 0;
    color: var(--text-muted, #6b7280);
    font-style: italic;
  }

  .editor-footer {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 1.5rem;
    border-top: 1px solid var(--border-color, #e5e7eb);
    background: var(--background-secondary, #f9fafb);
    min-height: 28px;
  }

  .stat {
    font-size: 0.6875rem;
    color: var(--text-faint, #9ca3af);
  }

  .stat-sep {
    color: var(--text-faint, #d1d5db);
    font-size: 0.6875rem;
  }

  .empty-editor {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    background: var(--background-primary-alt, #f9fafb);
  }

  .empty-content {
    text-align: center;
    color: var(--text-muted, #6b7280);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }

  .empty-content h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-normal, #374151);
  }

  .empty-content p {
    margin: 0;
    font-size: 0.875rem;
    color: var(--text-muted, #9ca3af);
  }
</style>
