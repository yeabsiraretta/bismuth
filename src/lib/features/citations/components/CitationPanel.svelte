<script lang="ts">
  import {
    citationConfig,
    citationLibrary,
    citationLoading,
    citationError,
    filteredEntries,
    entryCount,
    loadLibrary,
    updateConfig,
    setSearchQuery,
    openLiteratureNote,
    getMarkdownCitation,
    getLiteratureNoteLink,
    getEntryContent,
  } from '../stores/citationStore';
  import { extractVariables } from '../services/templateRenderer';
  import type { CslEntry, CitationConfig } from '../types/citation';

  let searchInput = '';
  let selectedEntry: CslEntry | null = null;
  let showSettings = false;
  let copyFeedback = '';

  // Config bind values
  let configPath = '';
  let configFormat: CitationConfig['format'] = 'bibtex';
  let configFolder = 'references';
  let configTitleTpl = '@{{citekey}}';
  let configCiteTpl = '[@{{citekey}}]';

  // Sync local vars from store
  $: {
    configPath = $citationConfig.exportPath;
    configFormat = $citationConfig.format;
    configFolder = $citationConfig.literatureNoteFolder;
    configTitleTpl = $citationConfig.titleTemplate;
    configCiteTpl = $citationConfig.markdownCitationTemplate;
  }

  function handleSearch() {
    setSearchQuery(searchInput);
  }

  function handleSearchKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') handleSearch();
    if (e.key === 'Escape') {
      searchInput = '';
      setSearchQuery('');
      selectedEntry = null;
    }
  }

  function selectEntry(entry: CslEntry) {
    selectedEntry = selectedEntry?.id === entry.id ? null : entry;
  }

  async function handleOpenNote(entry: CslEntry) {
    try {
      await openLiteratureNote(entry);
      copyFeedback = `Opened note for @${entry.id}`;
      setTimeout(() => (copyFeedback = ''), 2000);
    } catch (e) {
      copyFeedback = `Error: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  function handleCopyCitation(entry: CslEntry) {
    const cite = getMarkdownCitation(entry);
    navigator.clipboard.writeText(cite);
    copyFeedback = `Copied: ${cite}`;
    setTimeout(() => (copyFeedback = ''), 2000);
  }

  function handleCopyLink(entry: CslEntry) {
    const link = getLiteratureNoteLink(entry);
    navigator.clipboard.writeText(link);
    copyFeedback = `Copied: ${link}`;
    setTimeout(() => (copyFeedback = ''), 2000);
  }

  function handleCopyContent(entry: CslEntry) {
    const content = getEntryContent(entry);
    navigator.clipboard.writeText(content);
    copyFeedback = 'Content copied to clipboard';
    setTimeout(() => (copyFeedback = ''), 2000);
  }

  function handleSaveSettings() {
    updateConfig({
      exportPath: configPath,
      format: configFormat,
      literatureNoteFolder: configFolder,
      titleTemplate: configTitleTpl,
      markdownCitationTemplate: configCiteTpl,
    });
    showSettings = false;
  }

  function handleLoadLibrary() {
    loadLibrary();
  }

  function formatAuthors(entry: CslEntry): string {
    const vars = extractVariables(entry);
    return vars.authorString || 'Unknown author';
  }

  function formatYear(entry: CslEntry): string {
    const vars = extractVariables(entry);
    return vars.year || 'n.d.';
  }
</script>

<div class="cit-panel">
  <div class="cit-header">
    <span class="cit-title">Citations</span>
    <span class="cit-count">
      {#if $citationLibrary}
        {$entryCount} entries
      {:else}
        No library loaded
      {/if}
    </span>
    <button class="cit-btn cit-btn-icon" on:click={() => (showSettings = !showSettings)} title="Settings">
      ⚙
    </button>
  </div>

  {#if showSettings}
    <div class="cit-settings">
      <label class="cit-field">
        <span>Export file path</span>
        <input type="text" bind:value={configPath} placeholder="/path/to/library.bib" />
      </label>
      <label class="cit-field">
        <span>Format</span>
        <select bind:value={configFormat}>
          <option value="bibtex">BibTeX / BibLaTeX (.bib)</option>
          <option value="csl-json">CSL-JSON (.json)</option>
        </select>
      </label>
      <label class="cit-field">
        <span>Literature note folder</span>
        <input type="text" bind:value={configFolder} placeholder="references" />
      </label>
      <label class="cit-field">
        <span>Note title template</span>
        <input type="text" bind:value={configTitleTpl} placeholder={"@{{citekey}}"} />
      </label>
      <label class="cit-field">
        <span>Citation template</span>
        <input type="text" bind:value={configCiteTpl} placeholder={"[@{{citekey}}]"} />
      </label>
      <div class="cit-settings-actions">
        <button class="cit-btn" on:click={handleSaveSettings}>Save</button>
        <button class="cit-btn" on:click={() => (showSettings = false)}>Cancel</button>
      </div>
    </div>
  {/if}

  <div class="cit-toolbar">
    <input
      class="cit-search"
      type="text"
      bind:value={searchInput}
      on:input={handleSearch}
      on:keydown={handleSearchKeydown}
      placeholder="Search by title, author, citekey..."
    />
    <button class="cit-btn" on:click={handleLoadLibrary} disabled={$citationLoading}>
      {$citationLoading ? 'Loading...' : 'Reload'}
    </button>
  </div>

  {#if $citationError}
    <div class="cit-error">{$citationError}</div>
  {/if}

  {#if copyFeedback}
    <div class="cit-feedback">{copyFeedback}</div>
  {/if}

  <div class="cit-list">
    {#each $filteredEntries as entry (entry.id)}
      <button class="cit-entry" class:selected={selectedEntry?.id === entry.id} on:click={() => selectEntry(entry)}>
        <div class="cit-entry-key">@{entry.id}</div>
        <div class="cit-entry-title">{entry.title || 'Untitled'}</div>
        <div class="cit-entry-meta">
          <span>{formatAuthors(entry)}</span>
          <span class="cit-entry-year">{formatYear(entry)}</span>
          {#if entry['container-title']}
            <span class="cit-entry-journal">{entry['container-title']}</span>
          {/if}
        </div>
      </button>

      {#if selectedEntry?.id === entry.id}
        <div class="cit-entry-detail">
          {#if entry.abstract}
            <div class="cit-abstract">
              <strong>Abstract:</strong> {entry.abstract}
            </div>
          {/if}
          {#if entry.DOI}
            <div class="cit-doi"><strong>DOI:</strong> {entry.DOI}</div>
          {/if}
          {#if entry.URL}
            <div class="cit-url"><strong>URL:</strong> {entry.URL}</div>
          {/if}
          <div class="cit-entry-actions">
            <button class="cit-btn" on:click={() => handleOpenNote(entry)}>Open/Create Note</button>
            <button class="cit-btn" on:click={() => handleCopyCitation(entry)}>Copy Citation</button>
            <button class="cit-btn" on:click={() => handleCopyLink(entry)}>Copy Note Link</button>
            <button class="cit-btn" on:click={() => handleCopyContent(entry)}>Copy Content</button>
          </div>
        </div>
      {/if}
    {/each}

    {#if $citationLibrary && $filteredEntries.length === 0}
      <div class="cit-empty">No matching entries found.</div>
    {/if}
  </div>
</div>

<style>
  .cit-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    font-size: 13px;
    color: var(--text-normal, #ddd);
    background: var(--background-primary, #1e1e1e);
  }

  .cit-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--background-modifier-border, #333);
  }

  .cit-title { font-weight: 600; font-size: 14px; }
  .cit-count { flex: 1; text-align: right; font-size: 11px; opacity: 0.6; }

  .cit-btn {
    padding: 4px 10px;
    border: 1px solid var(--background-modifier-border, #444);
    border-radius: 4px;
    background: var(--background-secondary, #2a2a2a);
    color: var(--text-normal, #ddd);
    cursor: pointer;
    font-size: 12px;
  }

  .cit-btn:hover { background: var(--background-modifier-hover, #333); }
  .cit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .cit-btn-icon { border: none; background: none; font-size: 16px; padding: 2px 4px; }

  .cit-toolbar {
    display: flex;
    gap: 6px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--background-modifier-border, #333);
  }

  .cit-search {
    flex: 1;
    padding: 6px 10px;
    border: 1px solid var(--background-modifier-border, #444);
    border-radius: 4px;
    background: var(--background-primary, #1e1e1e);
    color: var(--text-normal, #ddd);
    font-size: 13px;
  }

  .cit-search:focus { outline: none; border-color: var(--interactive-accent, #7c3aed); }
  .cit-error { padding: 6px 12px; background: var(--background-modifier-error, #5c1a1a); color: var(--text-error, #f87171); font-size: 12px; }
  .cit-feedback { padding: 6px 12px; background: var(--background-modifier-success, #1a3a1a); color: var(--text-success, #4ade80); font-size: 12px; }

  .cit-settings {
    padding: 12px;
    border-bottom: 1px solid var(--background-modifier-border, #333);
    background: var(--background-secondary, #252525);
  }

  .cit-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 10px;
    font-size: 12px;
  }

  .cit-field span { opacity: 0.7; }

  .cit-field input,
  .cit-field select {
    padding: 5px 8px;
    border: 1px solid var(--background-modifier-border, #444);
    border-radius: 4px;
    background: var(--background-primary, #1e1e1e);
    color: var(--text-normal, #ddd);
    font-size: 12px;
  }

  .cit-settings-actions { display: flex; gap: 6px; justify-content: flex-end; }
  .cit-list { flex: 1; overflow-y: auto; padding: 4px 0; }

  .cit-entry {
    display: block;
    width: 100%;
    text-align: left;
    padding: 8px 12px;
    border: none;
    border-bottom: 1px solid var(--background-modifier-border, #2a2a2a);
    background: transparent;
    color: var(--text-normal, #ddd);
    cursor: pointer;
    font-size: 13px;
  }

  .cit-entry:hover { background: var(--background-modifier-hover, #2a2a2a); }
  .cit-entry.selected { background: var(--background-secondary-alt, #333); border-left: 3px solid var(--interactive-accent, #7c3aed); }

  .cit-entry-key {
    font-family: var(--font-monospace, monospace);
    font-size: 12px;
    color: var(--interactive-accent, #7c3aed);
    margin-bottom: 2px;
  }

  .cit-entry-title {
    font-weight: 500;
    margin-bottom: 2px;
    line-height: 1.3;
  }

  .cit-entry-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    font-size: 11px;
    opacity: 0.65;
  }

  .cit-entry-year { font-weight: 600; }
  .cit-entry-journal { font-style: italic; }

  .cit-entry-detail {
    padding: 8px 16px 12px;
    background: var(--background-secondary, #252525);
    border-bottom: 1px solid var(--background-modifier-border, #333);
    font-size: 12px;
  }

  .cit-abstract {
    margin-bottom: 6px;
    line-height: 1.4;
    max-height: 120px;
    overflow-y: auto;
  }

  .cit-doi,
  .cit-url {
    margin-bottom: 4px;
    word-break: break-all;
  }

  .cit-entry-actions { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
  .cit-empty { text-align: center; padding: 24px; opacity: 0.5; }
</style>
