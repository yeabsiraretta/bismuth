<script lang="ts">
  import { filterTopics } from './help/helpIndex';
  import HelpSearchResults from './help/HelpSearchResults.svelte';
  import { HELP_BASE_URL, assertHelpUrl } from '@/utils/settings/helpUrls';
  import { openExternalUrl } from '@/services/system/shell';
  import { log } from '@/utils/logger';

  let query = '';

  $: results = filterTopics(query);

  async function openWiki() {
    try {
      assertHelpUrl(HELP_BASE_URL);
      await openExternalUrl(HELP_BASE_URL);
    } catch (error) {
      log.error('Failed to open wiki', error as Error);
    }
  }
</script>

<div class="settings-section">
  <h3>Help & Documentation</h3>

  <div class="setting-group">
    <div class="search-bar">
      <input
        type="search"
        bind:value={query}
        placeholder="Search help topics..."
        aria-label="Search help topics"
        class="help-search"
      />
    </div>
    <HelpSearchResults topics={results} />
  </div>

  <div class="setting-group wiki-fallback">
    <p class="hint">Can't find what you're looking for?</p>
    <button class="wiki-btn" on:click={openWiki} aria-label="Open full wiki in browser">
      Open Full Wiki &rarr;
    </button>
  </div>
</div>

<style>
  .help-search {
    width: 100%;
    padding: var(--spacing-s) var(--spacing-m);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    background: var(--background-primary);
    color: var(--text-normal);
    font-size: var(--font-ui-small);
    margin-bottom: var(--spacing-s);
  }

  .help-search:focus {
    outline: 2px solid var(--interactive-accent);
    outline-offset: -1px;
  }

  .wiki-fallback {
    display: flex;
    align-items: center;
    gap: var(--spacing-m);
    margin-top: var(--spacing-m);
  }

  .hint {
    font-size: var(--font-ui-small);
    color: var(--text-muted);
    margin: 0;
  }

  .wiki-btn {
    font-size: var(--font-ui-small);
    color: var(--interactive-accent);
    background: none;
    border: 1px solid var(--interactive-accent);
    border-radius: var(--radius-s);
    padding: var(--spacing-xs) var(--spacing-m);
    cursor: pointer;
    min-height: 32px;
  }

  .wiki-btn:hover {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
  }

  .wiki-btn:focus-visible {
    outline: 2px solid var(--interactive-accent);
    outline-offset: 2px;
  }
</style>
