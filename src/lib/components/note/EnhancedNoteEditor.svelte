<script lang="ts">
  import { activeNote, updateNoteInStore, currentVault, setActiveNote } from '@/stores/vault/vault';
  import { invoke } from '@tauri-apps/api/core';
  import { onMount } from 'svelte';
  import Icon from '@/components/icons/Icon.svelte';
  import EditableMarkdownPreview from '@/components/note/EditableMarkdownPreview.svelte';
  import WikilinkAutocomplete from '@/components/note/WikilinkAutocomplete.svelte';
  import type { Note } from '@/types/vault';

  type ViewMode = 'edit' | 'preview' | 'split';

  let content = '';
  let isSaving = false;
  let saveTimeout: ReturnType<typeof setTimeout> | null = null;
  let textareaElement: HTMLTextAreaElement;
  let viewMode: ViewMode = 'edit';

  // Wikilink autocomplete state
  let showAutocomplete = false;
  let autocompleteQuery = '';
  let autocompleteX = 0;
  let autocompleteY = 0;
  let cursorPosition = 0;
  let wikilinkStartPos = 0;

  $: if ($activeNote) {
    content = $activeNote.content;
  }

  // Auto-save with debouncing
  async function handleInput(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    content = textarea.value;
    cursorPosition = textarea.selectionStart;

    // Check for [[ to trigger autocomplete
    checkForWikilinkTrigger(textarea);

    if (!$activeNote || !$currentVault) return;

    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    saveTimeout = setTimeout(async () => {
      await saveNote();
    }, 500);
  }

  function checkForWikilinkTrigger(textarea: HTMLTextAreaElement) {
    const textBeforeCursor = content.substring(0, cursorPosition);
    const lastTwoChars = textBeforeCursor.slice(-2);

    if (lastTwoChars === '[[') {
      // Show autocomplete
      wikilinkStartPos = cursorPosition;
      showAutocomplete = true;
      autocompleteQuery = '';

      // Calculate position
      const rect = textarea.getBoundingClientRect();
      const lineHeight = 20; // Approximate
      autocompleteX = rect.left + 20;
      autocompleteY = rect.top + lineHeight;
    } else if (showAutocomplete) {
      // Update query or close autocomplete
      const textSinceStart = content.substring(wikilinkStartPos, cursorPosition);

      if (textSinceStart.includes(']]') || textSinceStart.includes('\n')) {
        showAutocomplete = false;
      } else {
        autocompleteQuery = textSinceStart;
      }
    }
  }

  function handleAutocompleteSelect(title: string) {
    // Insert the selected title
    const before = content.substring(0, wikilinkStartPos);
    const after = content.substring(cursorPosition);
    content = `${before}${title}]]${after}`;

    showAutocomplete = false;

    // Update cursor position
    setTimeout(() => {
      if (textareaElement) {
        const newPos = wikilinkStartPos + title.length + 2;
        textareaElement.selectionStart = newPos;
        textareaElement.selectionEnd = newPos;
        textareaElement.focus();
      }
    }, 0);

    // Trigger save
    saveNote();
  }

  async function saveNote() {
    if (!$activeNote || !$currentVault) return;

    isSaving = true;
    try {
      await invoke('write_note', {
        path: $activeNote.path,
        content,
      });

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

  async function handleWikilinkClick(target: string) {
    try {
      // Find note by title
      const notes = await invoke<Note[]>('list_notes', {
        vaultPath: $currentVault?.root_path || '',
        folderPath: null,
      });

      const targetNote = notes.find((n) => n.title === target);

      if (targetNote) {
        // Read full note and set as active
        const fullNote = await invoke<Note>('read_note', { path: targetNote.path });
        setActiveNote(fullNote);
      } else {
        // Create new note with this title
        if (confirm(`Note "${target}" doesn't exist. Create it?`)) {
          const newPath = `${$currentVault?.root_path}/${target}.md`;
          await invoke('create_note', {
            path: newPath,
            content: `# ${target}\n\n`,
          });

          const newNote = await invoke<Note>('read_note', { path: newPath });
          setActiveNote(newNote);
        }
      }
    } catch (error) {
      console.error('Failed to navigate to wikilink:', error);
    }
  }

  function toggleViewMode(mode: ViewMode) {
    viewMode = mode;
  }

  onMount(() => {
    if (textareaElement) {
      textareaElement.focus();
    }
  });
</script>

{#if $activeNote}
  <div class="enhanced-editor">
    <!-- Toolbar -->
    <div class="editor-toolbar">
      <div class="toolbar-left">
        <h2 class="note-title">{$activeNote.title}</h2>
        {#if isSaving}
          <span class="saving-indicator">Saving...</span>
        {/if}
      </div>

      <div class="toolbar-right">
        <div class="view-mode-toggle" role="group" aria-label="View mode">
          <button
            class="mode-btn"
            class:active={viewMode === 'edit'}
            on:click={() => toggleViewMode('edit')}
            title="Edit mode"
            aria-label="Edit mode"
            aria-pressed={viewMode === 'edit'}
          >
            <Icon name="edit" size={16} />
            <span>Edit</span>
          </button>

          <button
            class="mode-btn"
            class:active={viewMode === 'split'}
            on:click={() => toggleViewMode('split')}
            title="Split mode"
            aria-label="Split mode"
            aria-pressed={viewMode === 'split'}
          >
            <Icon name="columns" size={16} />
            <span>Split</span>
          </button>

          <button
            class="mode-btn"
            class:active={viewMode === 'preview'}
            on:click={() => toggleViewMode('preview')}
            title="Preview mode"
            aria-label="Preview mode"
            aria-pressed={viewMode === 'preview'}
          >
            <Icon name="eye" size={16} />
            <span>Preview</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Editor Content -->
    <div class="editor-content" class:split={viewMode === 'split'}>
      {#if viewMode === 'edit' || viewMode === 'split'}
        <div class="editor-pane">
          <textarea
            bind:this={textareaElement}
            bind:value={content}
            on:input={handleInput}
            class="markdown-editor"
            placeholder="Start writing..."
            spellcheck="true"
            aria-label="Markdown editor"
          />
        </div>
      {/if}

      {#if viewMode === 'preview' || viewMode === 'split'}
        <div class="preview-pane">
          <EditableMarkdownPreview
            {content}
            onContentChange={(newContent) => {
              content = newContent;
              saveNote();
            }}
            onWikilinkClick={handleWikilinkClick}
          />
        </div>
      {/if}
    </div>

    <!-- Wikilink Autocomplete -->
    {#if showAutocomplete}
      <WikilinkAutocomplete
        query={autocompleteQuery}
        x={autocompleteX}
        y={autocompleteY}
        onSelect={handleAutocompleteSelect}
        onClose={() => (showAutocomplete = false)}
      />
    {/if}
  </div>
{:else}
  <div class="no-note">
    <Icon name="file-text" size={48} />
    <p>No note selected</p>
    <p class="hint">Select a note from the sidebar or create a new one</p>
  </div>
{/if}

<style>
  .enhanced-editor {
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: var(--background-primary);
  }

  .editor-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-m) var(--spacing-l);
    border-bottom: 1px solid var(--background-modifier-border);
    background-color: var(--background-secondary);
  }

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: var(--spacing-m);
  }

  .note-title {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }

  .saving-indicator {
    font-size: var(--font-size-xs);
    color: var(--text-muted);
    font-style: italic;
  }

  .toolbar-right {
    display: flex;
    gap: var(--spacing-m);
  }

  .view-mode-toggle {
    display: flex;
    gap: var(--spacing-xs);
    background-color: var(--background-primary);
    border-radius: var(--radius-m);
    padding: var(--spacing-xs);
  }

  .mode-btn {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-s) var(--spacing-m);
    background: none;
    border: none;
    border-radius: var(--radius-s);
    cursor: pointer;
    font-size: var(--font-size-sm);
    color: var(--text-muted);
    transition: all var(--transition-fast);
  }

  .mode-btn:hover {
    background-color: var(--background-modifier-hover);
    color: var(--text-primary);
  }

  .mode-btn.active {
    background-color: var(--accent-primary);
    color: white;
  }

  .editor-content {
    flex: 1;
    display: flex;
    overflow: hidden;
  }

  .editor-content.split {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .editor-pane,
  .preview-pane {
    height: 100%;
    overflow-y: auto;
  }

  .editor-pane {
    border-right: 1px solid var(--background-modifier-border);
  }

  .markdown-editor {
    width: 100%;
    height: 100%;
    padding: var(--spacing-l);
    border: none;
    outline: none;
    resize: none;
    font-family: 'Fira Code', monospace;
    font-size: var(--font-size-sm);
    line-height: 1.6;
    color: var(--text-primary);
    background-color: var(--background-primary);
  }

  .markdown-editor::placeholder {
    color: var(--text-muted);
  }

  .no-note {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-m);
    color: var(--text-muted);
  }

  .no-note p {
    margin: 0;
    font-size: var(--font-size-sm);
  }

  .no-note .hint {
    font-size: var(--font-size-xs);
    color: var(--text-faint);
  }
</style>
