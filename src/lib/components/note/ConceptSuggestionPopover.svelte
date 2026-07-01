<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Icon from '@/components/icons/Icon.svelte';
  import { currentVault } from '@/stores/vault/vault';
  import { getConceptSuggestions, type ConceptSuggestion } from '@/features/graph';
  import { subscribeConceptSuggestions } from '@/features/wikilink';
  import { log } from '@/utils/logger';

  export let content: string = '';
  export let notePath: string = '';
  export let onLink: (offset: number, length: number, title: string) => void = () => {};

  let suggestions: ConceptSuggestion[] = [];
  let visible = false;
  let selectedIndex = 0;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let unsubscribe: (() => Promise<void>) | null = null;

  $: if (content && notePath) {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => fetchSuggestions(), 800);
  }

  async function fetchSuggestions() {
    if (!notePath || !content || !$currentVault) {
      suggestions = [];
      return;
    }
    try {
      suggestions = await getConceptSuggestions(notePath, content);
      visible = suggestions.length > 0;
      selectedIndex = 0;
    } catch (error) {
      log.debug('Concept suggestions unavailable', { error: String(error) });
      suggestions = [];
      visible = false;
    }
  }

  function handleLink(suggestion: ConceptSuggestion) {
    onLink(suggestion.offset, suggestion.length, suggestion.title);
    suggestions = suggestions.filter((s) => s !== suggestion);
    if (suggestions.length === 0) visible = false;
  }

  function handleDismiss(suggestion: ConceptSuggestion) {
    suggestions = suggestions.filter((s) => s !== suggestion);
    if (suggestions.length === 0) visible = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!visible) return;
    if (e.key === 'Escape') {
      visible = false;
      e.preventDefault();
    }
  }

  onMount(() => {
    unsubscribe = subscribeConceptSuggestions((payload) => {
      if (payload.length > 0) {
        suggestions = payload;
        visible = true;
        selectedIndex = 0;
      }
    });
  });

  onDestroy(() => {
    unsubscribe?.();
    if (debounceTimer) clearTimeout(debounceTimer);
  });
</script>

<svelte:window on:keydown={handleKeydown} />

{#if visible && suggestions.length > 0}
  <div class="concept-popover" role="dialog" aria-label="Concept link suggestions">
    <div class="popover-header">
      <Icon name="lightbulb" size={14} />
      <span>Link suggestions ({suggestions.length})</span>
      <button
        class="close-btn"
        on:click={() => (visible = false)}
        title="Close suggestions"
        aria-label="Close suggestions"
      >
        <Icon name="x" size={12} />
      </button>
    </div>
    <ul class="suggestion-list">
      {#each suggestions as suggestion, idx}
        <li class="suggestion-item" class:selected={idx === selectedIndex}>
          <span class="suggestion-text">
            "<strong>{suggestion.matched_text}</strong>" → [[{suggestion.title}]]
          </span>
          <div class="suggestion-actions">
            <button
              class="action-btn link-btn"
              on:click={() => handleLink(suggestion)}
              title="Wrap in [[...]] wikilink"
            >
              Link
            </button>
            <button
              class="action-btn dismiss-btn"
              on:click={() => handleDismiss(suggestion)}
              title="Dismiss this suggestion"
            >
              Dismiss
            </button>
          </div>
        </li>
      {/each}
    </ul>
  </div>
{/if}

<style>
  .concept-popover {
    position: absolute;
    bottom: var(--concept-popover-bottom, 4rem);
    right: var(--spacing-m);
    width: var(--concept-popover-width, 320px);
    max-height: var(--concept-popover-max-height, 240px);
    background: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-m);
    box-shadow: var(--shadow-l);
    z-index: var(--layer-popover, 100);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .popover-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-s) var(--spacing-m);
    border-bottom: 1px solid var(--background-modifier-border);
    font-size: var(--font-ui-small);
    color: var(--text-muted);
  }

  .close-btn {
    margin-left: auto;
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: var(--spacing-xxs, 2px);
    border-radius: var(--radius-s);
  }

  .close-btn:hover {
    background: var(--background-modifier-hover);
  }

  .suggestion-list {
    list-style: none;
    padding: 0;
    margin: 0;
    overflow-y: auto;
    flex: 1;
  }

  .suggestion-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-xs) var(--spacing-m);
    font-size: var(--font-ui-small);
    border-bottom: 1px solid var(--background-modifier-border);
  }

  .suggestion-item.selected {
    background: var(--background-modifier-hover);
  }

  .suggestion-text {
    flex: 1;
    color: var(--text-normal);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .suggestion-text strong {
    color: var(--interactive-accent);
  }

  .suggestion-actions {
    display: flex;
    gap: var(--spacing-xs);
    margin-left: var(--spacing-s);
  }

  .action-btn {
    padding: var(--spacing-xxs, 2px) var(--spacing-s);
    border-radius: var(--radius-s);
    border: none;
    font-size: var(--font-smallest);
    cursor: pointer;
  }

  .link-btn {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
  }

  .link-btn:hover {
    opacity: 0.9;
  }

  .dismiss-btn {
    background: var(--background-modifier-hover);
    color: var(--text-muted);
  }

  .dismiss-btn:hover {
    background: var(--interactive-hover);
  }
</style>
