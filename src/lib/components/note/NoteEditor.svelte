<script lang="ts">
  import { activeNote, updateNoteInStore, currentVault } from '@/stores/vault/vault';
  import type { Note } from '@/types/data/vault';
  import { writeNote, renameNote } from '@/services/vault/vault';
  import { onMount, onDestroy } from 'svelte';
  import Icon from '@/components/icons/Icon.svelte';
  import PanelHeader from '@/components/ui/layout/PanelHeader.svelte';
  import NoteEditorToolbar from '@/components/note/NoteEditorToolbar.svelte';
  import ConceptSuggestionPopover from '@/components/note/ConceptSuggestionPopover.svelte';
  import Editor from '@/components/editor/Editor.svelte';
  import MarkdownPreview from '@/components/note/MarkdownPreview.svelte';
  import { registerStatusItem, removeStatusItem } from '@/stores/status/status';
  import { settings } from '@/features/settings';
  import { log } from '@/utils/logger';
  import {
    parseFrontmatter,
    computeStats,
    getFormatStrings,
    navigateToWikilink,
  } from './noteEditorLogic';
  import FloatingToolbar from '@/components/editor/FloatingToolbar.svelte';
  import {
    formatPainterActive,
    toggleFormatPainter,
    applyFormatPainter,
    cancelFormatPainter,
  } from '@/components/editor/formatPainter';
  import { zoomRange, zoomReset } from '@/features/zoom';
  import { ZoomBreadcrumbs } from '@/features/zoom';
  import { shouldUseCodeEditor } from '@/features/code-editor';
  import {
    codeBlockModalOpen,
    activeCodeBlock,
    closeCodeBlockModal,
    saveCodeBlock,
  } from '@/features/code-editor';
  import { graphBannerEnabled } from '@/features/graph-banner';

  let content = '';
  let isSaving = false;
  let saveTimeout: ReturnType<typeof setTimeout> | null = null;
  let livePreview = $settings.livePreview;
  let readingMode = $settings.livePreviewMode === 'reading';
  let editorRef: Editor;
  let showFrontmatter = false;
  let isRenaming = false;
  let renameValue = '';

  let frontmatter = '';
  let body = '';
  let editorContainerEl: HTMLDivElement;

  let lastNoteRef: Note | null = null;
  $: if ($activeNote && $activeNote !== lastNoteRef) {
    lastNoteRef = $activeNote;
    content = $activeNote.content;
    const parsed = parseFrontmatter(content);
    frontmatter = parsed.fm;
    body = parsed.body;
    // Reset zoom when switching notes
    zoomReset();
    // Auto-scan for flashcards when note changes (if enabled)
    if ($settings.flashcardsEnabled && $settings.flashcardsAutoScan) {
      import('@/features/flashcards')
        .then((m) => m.scanActiveNote($activeNote.path, $activeNote.content))
        .catch(() => {});
    }
  }

  // Sync zoom range to the CodeMirror editor
  $: if (editorRef && $zoomRange) {
    editorRef.applyZoomRange($zoomRange);
  } else if (editorRef && !$zoomRange) {
    editorRef.applyZoomRange(null);
  }

  $: isCodeFile = $activeNote ? shouldUseCodeEditor($activeNote.path) : false;
  $: editorContent = showFrontmatter ? content : body;

  $: stats = computeStats(content);
  $: wordCount = stats.wordCount;
  $: charCount = stats.charCount;
  $: lineCount = stats.lineCount;

  // Push editor stats to status bar
  $: if ($activeNote) {
    registerStatusItem({
      id: 'editor-words',
      position: 'right',
      icon: 'type',
      label: `${wordCount} words`,
      priority: 10,
    });
    registerStatusItem({
      id: 'editor-lines',
      position: 'right',
      label: `${lineCount} lines`,
      priority: 20,
    });
    registerStatusItem({
      id: 'editor-chars',
      position: 'right',
      label: `${charCount} chars`,
      priority: 30,
    });
  }
  $: registerStatusItem({
    id: 'editor-save',
    position: 'right',
    icon: isSaving ? undefined : 'check',
    label: isSaving ? 'Saving...' : 'Saved',
    priority: 5,
    visible: !!$activeNote,
  });

  // Auto-save with debouncing
  async function handleInput() {
    if (!$activeNote || !$currentVault) return;
    if (!$settings.autoSave) return;

    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    saveTimeout = setTimeout(async () => {
      await saveNote();
    }, $settings.autoSaveDelay);
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
      log.error('Failed to save note', error);
    } finally {
      isSaving = false;
    }
  }

  function handleContentChange(newContent: string) {
    if (showFrontmatter) {
      content = newContent;
      const parsed = parseFrontmatter(content);
      frontmatter = parsed.fm;
      body = parsed.body;
    } else {
      body = newContent;
      content = frontmatter ? `${frontmatter}\n${newContent}` : newContent;
    }
    handleInput();
  }

  async function handleWikilinkClick(title: string) {
    if (!$currentVault) return;
    await navigateToWikilink(title, $currentVault.root_path);
  }

  function handleFormat(type: string) {
    if (!editorRef) return;

    // If format painter is active and user selects text, apply the captured format
    if ($formatPainterActive && type === '__apply_painter__') {
      const fmt = applyFormatPainter();
      if (fmt) {
        editorRef.insertAtCursor(fmt.prefix, fmt.suffix);
      }
      return;
    }

    const { prefix, suffix } = getFormatStrings(type);
    editorRef.insertAtCursor(prefix, suffix);
  }

  function handleFormatPainterToggle() {
    if (!editorRef) return;
    const doc = editorRef.getContent();
    // We need cursor position — use selection start/end from the content
    // For simplicity, toggle with the full doc and 0,0 range
    // The format painter detects format around current selection in the editor
    toggleFormatPainter(doc, 0, 0);
  }

  function handleEditorClick() {
    // If format painter is active and user clicks after selecting, apply it
    if ($formatPainterActive && editorRef) {
      const fmt = applyFormatPainter();
      if (fmt) {
        editorRef.insertAtCursor(fmt.prefix, fmt.suffix);
      }
    }
  }

  function handleContextMenu() {
    // Right-click cancels format painter
    if ($formatPainterActive) {
      cancelFormatPainter();
    }
  }

  // Handle concept link: wrap matched text in [[...]] syntax
  function handleConceptLink(offset: number, length: number, title: string) {
    const before = content.slice(0, offset);
    const after = content.slice(offset + length);
    content = `${before}[[${title}]]${after}`;
    handleInput();
  }

  function startRename() {
    if (!$activeNote) return;
    renameValue = $activeNote.title;
    isRenaming = true;
  }

  async function commitRename() {
    if (!$activeNote || !renameValue.trim()) {
      isRenaming = false;
      return;
    }
    const newTitle = renameValue.trim();
    if (newTitle === $activeNote.title) {
      isRenaming = false;
      return;
    }
    const oldPath = $activeNote.path;
    const dir = oldPath.substring(0, oldPath.lastIndexOf('/') + 1);
    const newPath = `${dir}${newTitle}.md`;
    try {
      await renameNote(oldPath, newPath);
      updateNoteInStore({ ...$activeNote, title: newTitle, path: newPath });
    } catch (err) {
      log.error('Rename failed', err);
    }
    isRenaming = false;
  }

  function handleRenameKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitRename();
    }
    if (e.key === 'Escape') {
      isRenaming = false;
    }
  }

  function handleEditorInsertText(e: Event) {
    const detail = (e as CustomEvent<{ text: string }>).detail;
    if (!editorRef || !detail?.text) return;
    editorRef.insertAtCursor(detail.text);
  }

  onMount(() => {
    if (editorRef) {
      editorRef.focus();
    }
    window.addEventListener('editor-insert-text', handleEditorInsertText);
  });

  onDestroy(() => {
    window.removeEventListener('editor-insert-text', handleEditorInsertText);
    removeStatusItem('editor-words');
    removeStatusItem('editor-lines');
    removeStatusItem('editor-chars');
    removeStatusItem('editor-save');
  });
</script>

<div class="note-editor">
  {#if $activeNote}
    <PanelHeader icon="file-text">
      <svelte:fragment slot="title">
        {#if isRenaming}
          <!-- svelte-ignore a11y_autofocus -->
          <input
            class="note-title-input"
            type="text"
            bind:value={renameValue}
            on:blur={commitRename}
            on:keydown={handleRenameKeydown}
            autofocus
          />
        {:else}
          <h3 class="panel-header-title note-title" on:dblclick={startRename}>
            {$activeNote.title}
          </h3>
        {/if}
      </svelte:fragment>
      <svelte:fragment slot="actions">
        <NoteEditorToolbar
          {livePreview}
          {readingMode}
          {showFrontmatter}
          hasFrontmatter={!!frontmatter}
          onFormat={handleFormat}
          onViewModeChange={(mode) => {
            if (mode === 'source') {
              livePreview = false;
              readingMode = false;
              settings.update((s) => ({ ...s, livePreview: false, livePreviewMode: 'source' }));
            } else if (mode === 'live') {
              livePreview = true;
              readingMode = false;
              settings.update((s) => ({ ...s, livePreview: true, livePreviewMode: 'live' }));
            } else {
              livePreview = true;
              readingMode = true;
              settings.update((s) => ({ ...s, livePreview: true, livePreviewMode: 'reading' }));
            }
          }}
          onToggleFrontmatter={() => (showFrontmatter = !showFrontmatter)}
        />
      </svelte:fragment>
    </PanelHeader>

    {#if $graphBannerEnabled}
      {#await import('@/features/graph-banner').then((m) => m.GraphBanner) then GraphBanner}
        <svelte:component this={GraphBanner} />
      {/await}
    {/if}

    <ZoomBreadcrumbs />

    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="editor-content"
      class:painter-active={$formatPainterActive}
      bind:this={editorContainerEl}
      on:click={handleEditorClick}
      on:contextmenu={handleContextMenu}
    >
      {#key $activeNote?.path}
        {#if isCodeFile}
          {#await import('@/features/code-editor/components/CodeEditor.svelte') then mod}
            <svelte:component
              this={mod.default}
              content={editorContent}
              filePath={$activeNote?.path ?? ''}
              onContentChange={handleContentChange}
              on:save={saveNote}
            />
          {/await}
        {:else if readingMode}
          <MarkdownPreview content={editorContent} onWikilinkClick={handleWikilinkClick} />
        {:else}
          <Editor
            bind:this={editorRef}
            content={editorContent}
            {livePreview}
            readonly={false}
            onContentChange={handleContentChange}
            onWikilinkClick={handleWikilinkClick}
          />
          <FloatingToolbar
            editorElement={editorContainerEl}
            onFormat={handleFormat}
            formatPainterActive={$formatPainterActive}
            onFormatPainterToggle={handleFormatPainterToggle}
          />
        {/if}
      {/key}
      <ConceptSuggestionPopover {content} notePath={$activeNote.path} onLink={handleConceptLink} />
      {#if $settings.flashcardsEnabled}
        {#await import('@/features/flashcards') then m}
          <div class="flashcard-viewport-bar">
            <svelte:component this={m.FlashcardIndicator} />
          </div>
        {/await}
      {/if}
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

{#if $codeBlockModalOpen && $activeCodeBlock}
  {#await import('@/features/code-editor/components/CodeBlockModal.svelte') then mod}
    <svelte:component
      this={mod.default}
      isOpen={$codeBlockModalOpen}
      code={$activeCodeBlock.code}
      language={$activeCodeBlock.language}
      on:save={(e) => saveCodeBlock(e.detail)}
      on:close={closeCodeBlockModal}
    />
  {/await}
{/if}

<style>
  .note-editor {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--background-primary);
  }
  .flashcard-viewport-bar {
    display: flex;
    align-items: center;
    padding: 2px var(--spacing-m);
    border-top: 1px solid var(--border-color);
    background: var(--background-secondary);
    min-height: 24px;
  }
  .note-title {
    cursor: default;
    margin: 0;
    font-size: var(--font-ui-menu);
    font-weight: var(--font-semibold);
    color: var(--text-normal);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
  }
  .note-title-input {
    font-size: var(--font-ui-menu);
    font-weight: var(--font-semibold);
    color: var(--text-normal);
    background: var(--background-primary);
    border: 1px solid var(--interactive-accent);
    border-radius: var(--radius-s);
    padding: var(--spacing-xxs) var(--spacing-xs);
    outline: none;
    min-width: 0;
    max-width: 180px;
  }
  .editor-content {
    flex: 1;
    overflow: hidden;
    position: relative;
  }
  .editor-content.painter-active {
    cursor: crosshair;
  }
  .editor-content.painter-active :global(.cm-content) {
    cursor: crosshair;
  }
  .empty-editor {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    background: var(--background-primary-alt);
  }
  .empty-content {
    text-align: center;
    color: var(--text-muted);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-s);
  }
  .empty-content h2 {
    margin: 0;
    font-size: var(--font-ui-large);
    font-weight: var(--font-semibold);
    color: var(--text-normal);
  }
  .empty-content p {
    margin: 0;
    font-size: var(--font-ui-small);
    color: var(--text-muted);
  }
</style>
