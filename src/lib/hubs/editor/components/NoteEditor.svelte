<script lang="ts">
  import BIcon from '@/ui/b-icon.svelte';
  import Editor from '@/hubs/editor/components/Editor.svelte';
  import EditorToolbar from '@/hubs/editor/components/EditorToolbar.svelte';
  import { renderMarkdown } from '@/hubs/editor/services/markdown-renderer';
  import { getActiveTab, markTabDirty } from '@/hubs/editor/stores/editor-tabs.svelte';
  import type { EditorConfig } from '@/hubs/editor/types/editor-config';
  import {
    getAppearance,
    getEditor,
    getGeneral,
    getSettings,
    getTypewriter,
    getVim,
  } from '@/hubs/core/stores/settings-store.svelte';
  import { getActiveTheme } from '@/hubs/core/stores/theme-store.svelte';
  import { getCachedContent, updateCachedContent } from '@/hubs/editor/services/file-ops';
  import { readNote, writeNote } from '@/sal/note-service';
  import { setSaving } from '@/hubs/editor/stores/save-status.svelte';
  import { createVersion } from '@/sal/version-service';
  import { appendChangelog } from '@/hubs/editor/services/changelog-service';
  import { gitCommit, gitStageAll } from '@/sal/git-service';
  import { applyContextualTypography } from '@/hubs/editor/services/contextual-typography';
  import { postProcessMermaid } from '@/hubs/editor/services/mermaid-service';
  import { CURSOR_MARKER, resolveTemplateVars } from '@/hubs/editor/services/template-vars';
  import { getVault, getNotes } from '@/hubs/core/stores/vault-store.svelte';
  import {
    DEFAULT_ENHANCED_COPY_CONFIG,
    enhancedCopyTransform,
  } from '@/hubs/editor/services/enhanced-copy';
  import { log } from '@/utils/log/logger';
  import { onMount, tick, untrack } from 'svelte';
  import { awardEditXp } from '@/hubs/core/stores/gamification-store.svelte';
  import { syncSceneWordCount } from '@/hubs/creative/stores/writing-store.svelte';

  let editorRef = $state<Editor>();
  let proseRef = $state<HTMLDivElement>();
  let content = $state('');
  let lastSavedContent = '';
  let saveTimeout: ReturnType<typeof setTimeout> | null = null;
  let loadGen = 0;
  let activeTab = $derived(getActiveTab());
  let activeTabPath = $derived(activeTab?.path ?? null);
  let isPenFile = $derived(activeTabPath?.endsWith('.pen') ?? false);

  let editorSettings = $derived(getEditor());
  let generalSettings = $derived(getGeneral());
  let appearanceSettings = $derived(getAppearance());

  let viewMode: 'source' | 'live' | 'reading' = $state(
    getEditor().livePreview ? getEditor().livePreviewMode : 'source'
  );
  let renderedSource = $derived(
    editorSettings.frontmatterMode === 'source'
      ? content
      : content.replace(/^---\n[\s\S]*?\n---\n?/, '')
  );
  let renderedHtml = $derived(renderMarkdown(renderedSource, editorSettings.hardLineBreaks));

  let activeTheme = $derived(getActiveTheme());

  let editorConfig: EditorConfig = $derived({
    ...editorSettings,
    livePreview: !isPenFile && editorSettings.livePreview && viewMode === 'live',
    fontFamily: appearanceSettings.fontText,
    typewriter: getTypewriter(),
    vim: getVim(),
    darkMode: activeTheme === 'dark',
  });

  onMount(() => {
    function handleOpenSearch() {
      editorRef?.openSearch();
    }
    function handleScrollToLine(e: Event) {
      const line = (e as CustomEvent<{ line: number }>).detail?.line;
      if (typeof line === 'number') editorRef?.scrollToLine(line);
    }
    function handleInsertTemplate(e: Event) {
      const detail = (e as CustomEvent<{ content: string; name: string }>).detail;
      if (!detail?.content || !editorRef) return;
      const vault = getVault();
      const noteContent = activeTab ? getCachedContent(activeTab.path) : undefined;
      const general = getGeneral();
      const resolved = resolveTemplateVars(detail.content, {
        noteTitle: activeTab?.title ?? 'Untitled',
        notePath: activeTab?.path ?? '',
        date: new Date(),
        noteContent,
        vaultName: vault?.name,
        noteCount: getNotes().length,
        dateFormat: general.dateFormat,
        timeFormat: general.timeFormat,
        language: general.language,
      });
      const hasCursor = resolved.includes(CURSOR_MARKER);
      const final = resolved.replace(CURSOR_MARKER, '');
      editorRef.insertAtCursor(final, '');
      if (hasCursor) {
        const cursorOffset = resolved.indexOf(CURSOR_MARKER);
        log.debug('Template cursor offset', { cursorOffset });
      }
    }
    function handleExternalContentUpdate(e: Event) {
      const detail = (e as CustomEvent<{ path: string }>).detail;
      if (!detail?.path || !activeTab || detail.path !== activeTab.path) return;
      const updated = getCachedContent(detail.path);
      if (updated !== undefined && updated !== content) {
        content = updated;
        lastSavedContent = updated;
        log.debug('Editor content reloaded from external update', { path: detail.path });
      }
    }
    function handleForceSave() {
      saveNote();
    }
    function handleEnhancedCopy() {
      const selection = editorRef?.getSelectedText();
      if (!selection) return;
      const settings = getSettings();
      const config = {
        ...DEFAULT_ENHANCED_COPY_CONFIG,
        tabToSpaces: settings.editor.insertSpaces,
        tabSize: settings.editor.tabSize,
      };
      const transformed = enhancedCopyTransform(selection, config);
      navigator.clipboard.writeText(transformed).catch((err) => {
        log.warn('Enhanced copy failed', { error: String(err) });
      });
    }
    window.addEventListener('editor:open-search', handleOpenSearch);
    window.addEventListener('editor-scroll-to-line', handleScrollToLine);
    window.addEventListener('insert-template', handleInsertTemplate);
    window.addEventListener('editor:save', handleForceSave);
    window.addEventListener('editor:enhanced-copy', handleEnhancedCopy);
    window.addEventListener('content-externally-updated', handleExternalContentUpdate);
    return () => {
      if (saveTimeout) clearTimeout(saveTimeout);
      window.removeEventListener('editor:open-search', handleOpenSearch);
      window.removeEventListener('editor-scroll-to-line', handleScrollToLine);
      window.removeEventListener('insert-template', handleInsertTemplate);
      window.removeEventListener('editor:save', handleForceSave);
      window.removeEventListener('editor:enhanced-copy', handleEnhancedCopy);
      window.removeEventListener('content-externally-updated', handleExternalContentUpdate);
    };
  });

  $effect(() => {
    if (viewMode === 'reading' && proseRef) {
      tick()
        .then(async () => {
          if (proseRef) {
            applyContextualTypography(proseRef);
            await postProcessMermaid(proseRef);
          }
        })
        .catch(() => {});
    }
  });

  $effect(() => {
    if (isPenFile && viewMode !== 'source') {
      viewMode = 'source';
    }
  });

  $effect(() => {
    const path = activeTabPath;
    if (path) {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
        saveTimeout = null;
      }
      untrack(() => loadNoteContent(path));
    }
  });

  async function loadNoteContent(path: string) {
    const gen = ++loadGen;

    const cached = getCachedContent(path);
    if (cached !== undefined) {
      content = cached;
      lastSavedContent = cached;
      return;
    }

    try {
      const note = await readNote(path);
      if (gen !== loadGen) return;
      content = note.content;
      lastSavedContent = note.content;
      updateCachedContent(path, note.content);
    } catch {
      if (gen !== loadGen) return;
      content = isPenFile ? '' : `# ${activeTab?.title ?? 'Untitled'}\n\nStart writing here...`;
      lastSavedContent = content;
      updateCachedContent(path, content);
      log.debug('Could not load note from backend, using default content', { path });
    }
  }

  function handleContentChange(newContent: string) {
    content = newContent;
    if (activeTab) {
      markTabDirty(activeTab.id, true);
      updateCachedContent(activeTab.path, newContent);
    }
    scheduleAutoSave();
  }

  function scheduleAutoSave() {
    if (!generalSettings.autoSave) {
      log.debug('Autosave disabled in settings');
      return;
    }
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      saveNote();
    }, generalSettings.autoSaveDelay);
  }

  async function saveNote() {
    if (!activeTab) return;
    if (content === lastSavedContent) {
      markTabDirty(activeTab.id, false);
      return;
    }
    setSaving(true);
    try {
      const toSave = editorSettings.trimTrailingWhitespace
        ? content
            .split('\n')
            .map((l) => l.trimEnd())
            .join('\n')
        : content;
      await writeNote(activeTab.path, toSave);
      lastSavedContent = content;
      markTabDirty(activeTab.id, false);
      log.debug('Note saved', { path: activeTab.path });
      awardEditXp();
      if (getSettings().versioning.versioningEnabled) {
        createVersion(activeTab.path).catch(() => {});
      }
      appendChangelog(activeTab.path).catch(() => {});
      syncSceneWordCount(activeTab.path, toSave);
      const vaultCfg = getSettings().vault;
      if (vaultCfg.enableGit && vaultCfg.autoCommit) {
        const msg = vaultCfg.commitMessageTemplate.replace('[filename]', activeTab.title ?? 'note');
        gitStageAll()
          .then(() => gitCommit(msg))
          .catch(() => {});
      }
    } catch (err) {
      log.warn('Failed to save note', { path: activeTab.path, error: String(err) });
    } finally {
      setSaving(false);
    }
  }

  function handleFormat(type: string) {
    if (!editorRef) return;
    const headingMatch = type.match(/^h(\d)$/);
    if (headingMatch) {
      const level = parseInt(headingMatch[1], 10);
      const prefix = '#'.repeat(level) + ' ';
      editorRef.toggleLinePrefix(prefix);
      return;
    }
    if (type.startsWith('highlight:')) {
      const parts = type.split(':');
      const color = parts[2];
      editorRef.insertAtCursor(`<mark style="background: ${color}">`, '</mark>');
      return;
    }
    if (type === 'unhighlight') {
      editorRef.replaceSelection((text) => text.replace(/<\/?mark[^>]*>/g, ''));
      return;
    }
    const formats: Record<string, [string, string]> = {
      bold: ['**', '**'],
      italic: ['*', '*'],
      underline: ['<u>', '</u>'],
      code: ['`', '`'],
      strikethrough: ['~~', '~~'],
      highlight: ['==', '=='],
      wikilink: ['[[', ']]'],
    };
    const [prefix, suffix] = formats[type] ?? [type, ''];
    editorRef.insertAtCursor(prefix, suffix);
  }

  function handleInsertBlock(type: string) {
    if (!editorRef) return;
    const blocks: Record<string, string> = {
      bullet: '- ',
      numbered: '1. ',
      checklist: '- [ ] ',
      blockquote: '> ',
      hr: '\n---\n',
      codeblock: '\n```\n\n```\n',
      link: '[text](url)',
      image: '![alt](url)',
      table: '\n| Header | Header |\n| ------ | ------ |\n| Cell   | Cell   |\n',
    };
    const text = blocks[type] ?? '';
    editorRef.insertAtCursor(text, '');
  }
</script>

{#if activeTab}
  <div class="flex flex-col h-full">
    {#if isPenFile}
      <div class="px-3 py-1 text-xs border-b border-border text-text-muted bg-surface-hover/60">
        <span class="inline-flex items-center gap-1.5">
          <BIcon name="highlightPen" size={12} class="text-warning" />
          Pen file mode ({activeTab.path}) — plain text workflow, stored under <code>design/</code>
        </span>
      </div>
    {/if}
    {#if editorSettings.floatingToolbar}
      <EditorToolbar
        onFormat={handleFormat}
        onInsertBlock={handleInsertBlock}
        {viewMode}
        onViewModeChange={(mode) => (viewMode = mode)}
        disabled={viewMode === 'reading'}
        livePreviewEnabled={!isPenFile && editorSettings.livePreview}
        plainTextMode={isPenFile}
      />
    {/if}

    <div class="flex-1 overflow-hidden">
      {#if viewMode === 'reading'}
        <div class="prose-view" bind:this={proseRef}>
          {@html renderedHtml}
        </div>
      {:else}
        <Editor
          bind:this={editorRef}
          {content}
          config={editorConfig}
          tabId={activeTab?.id ?? ''}
          onContentChange={handleContentChange}
        />
      {/if}
    </div>
  </div>
{:else}
  <div class="flex flex-col items-center justify-center h-full gap-3 text-text-muted">
    <BIcon name="documentBlank" size={48} class="w-12 h-12 text-text-subtle" />
    <h2 class="text-l font-semibold text-text">No Note Selected</h2>
    <p class="text-s">Select a note from the sidebar to start editing</p>
  </div>
{/if}

<style>
  .prose-view {
    height: 100%;
    overflow: auto;
    background: var(--color-background);
    padding: 16px 24px;
    font-family: var(--font-text, var(--font-sans));
    font-size: 0.9rem;
    line-height: 1.7;
    color: var(--color-text);
  }
  .prose-view :global(h1) {
    font-size: 1.6rem;
    font-weight: 700;
    margin: 1.2em 0 0.4em;
  }
  .prose-view :global(h2) {
    font-size: 1.3rem;
    font-weight: 600;
    margin: 1em 0 0.3em;
  }
  .prose-view :global(h3) {
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0.8em 0 0.25em;
  }
  .prose-view :global(p) {
    margin: 0.5em 0;
  }
  .prose-view :global(ul),
  .prose-view :global(ol) {
    padding-left: 1.5em;
    margin: 0.5em 0;
  }
  .prose-view :global(li) {
    margin: 0.15em 0;
  }
  .prose-view :global(blockquote) {
    border-left: 3px solid var(--color-accent);
    padding-left: 12px;
    margin: 0.5em 0;
    color: var(--color-text-muted);
  }
  .prose-view :global(code) {
    font-family: var(--font-mono);
    font-size: 0.85em;
    padding: 1px 4px;
    background: var(--color-surface);
    border-radius: var(--radius-s);
  }
  .prose-view :global(pre) {
    background: var(--color-surface);
    padding: 12px;
    border-radius: var(--radius-m);
    overflow-x: auto;
    margin: 0.5em 0;
  }
  .prose-view :global(pre code) {
    padding: 0;
    background: none;
  }
  .prose-view :global(a) {
    color: var(--color-accent);
    text-decoration: underline;
  }
  .prose-view :global(a.wikilink) {
    text-decoration-style: dotted;
    cursor: pointer;
  }
  .prose-view :global(a.wikilink:hover) {
    text-decoration-style: solid;
  }
  .prose-view :global(hr) {
    border: none;
    border-top: 1px solid var(--color-border);
    margin: 1em 0;
  }
  .prose-view :global(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 0.5em 0;
    font-size: 0.85rem;
  }
  .prose-view :global(th),
  .prose-view :global(td) {
    border: 1px solid var(--color-border);
    padding: 6px 10px;
    text-align: left;
  }
  .prose-view :global(th) {
    background: var(--color-surface);
    font-weight: 600;
  }
  .prose-view :global(img) {
    max-width: 100%;
    border-radius: var(--radius-m);
  }
  .prose-view :global(tr:hover) {
    background: var(--color-surface-hover);
  }
  .prose-view :global(del) {
    color: var(--color-text-subtle);
    text-decoration: line-through;
  }
  .prose-view :global(mark) {
    background: oklch(from var(--color-warning) l c h / 0.25);
    color: var(--color-text);
    padding: 0 2px;
    border-radius: var(--radius-s);
  }
  .prose-view :global(input[type='checkbox']) {
    accent-color: var(--color-accent);
    margin-right: 6px;
    vertical-align: middle;
    cursor: default;
    pointer-events: none;
  }
  .prose-view :global(li:has(> input[type='checkbox'])) {
    list-style: none;
    margin-left: -1.2em;
  }
  .prose-view :global(.callout) {
    border-left: 3px solid var(--color-text-muted);
    background: color-mix(in srgb, var(--color-text-muted) 6%, transparent);
    padding: 8px 12px;
    margin: 0.5em 0;
    border-radius: 0 var(--radius-s) var(--radius-s) 0;
  }
  .prose-view :global(.callout-title) {
    font-weight: 600;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .prose-view :global(.callout-icon) {
    font-size: 1.1em;
    flex-shrink: 0;
  }
  .prose-view :global(.callout-note) {
    border-color: var(--color-primary);
    background: color-mix(in srgb, var(--color-primary) 8%, transparent);
  }
  .prose-view :global(.callout-tip) {
    border-color: var(--color-success);
    background: color-mix(in srgb, var(--color-success) 8%, transparent);
  }
  .prose-view :global(.callout-info) {
    border-color: var(--color-info);
    background: color-mix(in srgb, var(--color-info) 8%, transparent);
  }
  .prose-view :global(.callout-warning) {
    border-color: var(--color-warning);
    background: color-mix(in srgb, var(--color-warning) 8%, transparent);
  }
  .prose-view :global(.callout-danger) {
    border-color: var(--color-error);
    background: color-mix(in srgb, var(--color-error) 8%, transparent);
  }
  .prose-view :global(.callout-bug) {
    border-color: var(--color-error);
    background: color-mix(in srgb, var(--color-error) 6%, transparent);
  }
  .prose-view :global(.callout-example) {
    border-color: var(--color-purple);
    background: color-mix(in srgb, var(--color-purple) 8%, transparent);
  }
  .prose-view :global(.callout-success) {
    border-color: var(--color-success);
    background: color-mix(in srgb, var(--color-success) 8%, transparent);
  }
  .prose-view :global(.callout-question) {
    border-color: var(--color-warning);
    background: color-mix(in srgb, var(--color-warning) 6%, transparent);
  }
  .prose-view :global(.callout-failure) {
    border-color: var(--color-error);
    background: color-mix(in srgb, var(--color-error) 8%, transparent);
  }
  .prose-view :global(.callout-quote),
  .prose-view :global(.callout-abstract) {
    border-color: var(--color-text-muted);
    background: color-mix(in srgb, var(--color-text-muted) 6%, transparent);
  }
  .prose-view :global(.callout-quote) {
    display: flex;
    gap: 8px;
    padding: 12px 16px;
  }
  .prose-view :global(.callout-quote-mark) {
    font-size: 2.5rem;
    line-height: 1;
    color: var(--color-text-muted);
    opacity: 0.5;
    font-family: Georgia, 'Times New Roman', serif;
    flex-shrink: 0;
  }
  .prose-view :global(.callout-quote-content) {
    flex: 1;
    min-width: 0;
  }
  .prose-view :global(.callout-quote-text) {
    font-style: italic;
    margin: 0;
    padding: 0;
    border: none;
    background: none;
    font-size: 0.95em;
    line-height: 1.6;
    color: var(--color-text);
  }
  .prose-view :global(.callout-quote-attribution) {
    display: block;
    margin-top: 6px;
    font-size: 0.8em;
    font-style: normal;
    color: var(--color-text-muted);
  }
  .prose-view :global(.callout-quote-attribution::before) {
    content: '\2014\00a0';
  }
  .prose-view :global(.callout-todo) {
    border-color: var(--color-accent);
    background: color-mix(in srgb, var(--color-accent) 8%, transparent);
  }

  /* Contextual typography — Gutenberg-inspired block spacing */
  .prose-view :global(div[data-tag-name='h1'] + div > h2) {
    margin-top: 1.8rem;
  }
  .prose-view :global(div[data-tag-name='h2'] + div > h3) {
    margin-top: 1.4rem;
  }
  .prose-view :global(div[data-tag-name='p'] + div > h2) {
    margin-top: 2rem;
  }
  .prose-view :global(div[data-tag-name='p'] + div > h3) {
    margin-top: 1.6rem;
  }
  .prose-view :global(div[data-tag-name='ul'] + div > p),
  .prose-view :global(div[data-tag-name='ol'] + div > p) {
    margin-top: 0.8em;
  }
  .prose-view :global(div[data-tag-name='blockquote'] + div > p) {
    margin-top: 0.8em;
  }
  .prose-view :global(div[data-tag-name='pre'] + div > p) {
    margin-top: 0.8em;
  }
</style>
