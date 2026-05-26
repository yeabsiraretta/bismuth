<script lang="ts">
  import { activeNote, updateNoteInStore, currentVault } from '@/stores/vault/vault';
  import { writeNote } from '@/services/vault/vault';
  import { onMount } from 'svelte';

  let content = '';
  let isSaving = false;
  let saveTimeout: ReturnType<typeof setTimeout> | null = null;
  let textareaElement: HTMLTextAreaElement;

  $: if ($activeNote) {
    content = $activeNote.content;
  }

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

  onMount(() => {
    // Focus the textarea when component mounts
    if (textareaElement) {
      textareaElement.focus();
    }
  });
</script>

<div class="note-editor">
  {#if $activeNote}
    <div class="editor-header">
      <h1 class="note-title">{$activeNote.title}</h1>
      <div class="editor-actions">
        {#if isSaving}
          <span class="status saving">
            <span class="status-icon">⏳</span>
            Saving...
          </span>
        {:else}
          <span class="status saved">
            <span class="status-icon">✓</span>
            Saved
          </span>
        {/if}
      </div>
    </div>

    <div class="editor-content">
      <textarea
        bind:this={textareaElement}
        bind:value={content}
        on:input={handleInput}
        placeholder="Start writing..."
        spellcheck="true"
      />
    </div>
  {:else}
    <div class="empty-editor">
      <div class="empty-content">
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
    background: var(--bg-primary, #ffffff);
  }

  .editor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem 2rem;
    border-bottom: 1px solid var(--border-color, #ddd);
  }

  .note-title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-primary, #333);
  }

  .editor-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .status {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.875rem;
    padding: 0.375rem 0.75rem;
    border-radius: 4px;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .status-icon {
    font-size: 1rem;
    line-height: 1;
  }

  .status.saving {
    background: var(--warning-bg, #fff3cd);
    color: var(--warning-text, #856404);
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }

  .status.saved {
    background: var(--success-bg, #d4edda);
    color: var(--success-text, #155724);
  }

  .editor-content {
    flex: 1;
    padding: 2rem;
    overflow-y: auto;
  }

  textarea {
    width: 100%;
    height: 100%;
    min-height: 500px;
    padding: 0;
    border: none;
    outline: none;
    font-family:
      'Inter',
      -apple-system,
      BlinkMacSystemFont,
      'Segoe UI',
      sans-serif;
    font-size: 1rem;
    line-height: 1.6;
    resize: none;
    background: transparent;
    color: var(--text-primary, #333);
  }

  textarea::placeholder {
    color: var(--text-muted, #999);
  }

  .empty-editor {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    background: var(--bg-secondary, #f9f9f9);
  }

  .empty-content {
    text-align: center;
    color: var(--text-muted, #666);
  }

  .empty-content h2 {
    margin: 0 0 0.5rem 0;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .empty-content p {
    margin: 0;
    font-size: 1rem;
  }
</style>
