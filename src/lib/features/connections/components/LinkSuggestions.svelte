<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { log } from '@/utils/logger';
  import type { Note } from '@/types/data/vault';

  export let suggestions: Note[] = [];
  export let onOpenNote: ((path: string) => void) | undefined = undefined;

  function insertWikilink(note: Note) {
    const wikilink = `[[${note.title}]]`;
    window.dispatchEvent(new CustomEvent('editor-insert-text', { detail: { text: wikilink } }));
    log.info('Wikilink inserted from suggestion', { title: note.title });
  }

  function openNote(path: string) {
    onOpenNote?.(path);
  }
</script>

{#if suggestions.length > 0}
  <div class="suggestions-section" aria-label="Suggested links">
    <div class="section-label">Suggested Links</div>
    <ul class="suggestions-list" role="list">
      {#each suggestions as suggestion (suggestion.path)}
        <li class="suggestion-item" role="listitem">
          <button
            class="suggestion-title"
            on:click={() => openNote(suggestion.path)}
            title="Open {suggestion.title}"
            aria-label="Open note {suggestion.title}"
          >
            <Icon name="file-text" size={12} />
            <span>{suggestion.title}</span>
          </button>
          <button
            class="suggestion-link-btn"
            on:click={() => insertWikilink(suggestion)}
            title="Insert [[{suggestion.title}]] at cursor"
            aria-label="Insert wikilink for {suggestion.title}"
          >
            <Icon name="link" size={12} />
            Link
          </button>
        </li>
      {/each}
    </ul>
  </div>
{/if}

<style>
  .suggestions-section {
    border-top: 1px solid var(--border-color);
    padding: var(--spacing-xs) 0;
  }
  .section-label {
    font-size: var(--font-smallest);
    font-weight: var(--font-semibold);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-faint);
    padding: 4px var(--spacing-s) 2px;
  }
  .suggestions-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
  }
  .suggestion-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 3px var(--spacing-s);
  }
  .suggestion-title {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    flex: 1;
    min-width: 0;
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: var(--font-ui-small);
    cursor: pointer;
    text-align: left;
    padding: 0;
    overflow: hidden;
  }
  .suggestion-title span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .suggestion-title:hover {
    color: var(--text-normal);
  }
  .suggestion-link-btn {
    display: flex;
    align-items: center;
    gap: var(--spacing-xxs);
    padding: var(--spacing-xxs) var(--spacing-xs);
    border: none;
    border-radius: var(--radius-s);
    background: var(--background-modifier-hover);
    color: var(--text-muted);
    font-size: var(--font-ui-xs);
    cursor: pointer;
    flex-shrink: 0;
    transition: all 0.15s ease;
  }
  .suggestion-link-btn:hover {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
  }
</style>
