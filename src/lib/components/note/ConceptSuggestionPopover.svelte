<script lang="ts">
  import { invoke } from '@tauri-apps/api/core';
  import { listen } from '@tauri-apps/api/event';
  import { activeNote } from '@/stores/vault/vault';
  import { onMount, onDestroy } from 'svelte';
  import Icon from '@/components/icons/Icon.svelte';

  export let content: string = '';
  export let notePath: string = '';
  export let onLink: (offset: number, length: number, title: string) => void = () => {};

  interface ConceptSuggestion {
    title: string;
    path: string;
    matched_text: string;
    offset: number;
    length: number;
  }

  let suggestions: ConceptSuggestion[] = [];
  let visible = false;
  let selectedIndex = 0;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let unlisten: (() => void) | null = null;

  // Debounced concept suggestion fetch (800ms per T079 spec)
  $: if (content && notePath) {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => fetchSuggestions(), 800);
  }

  async function fetchSuggestions() {
    if (!notePath || !content) {
      suggestions = [];
      return;
    }

    try {
      suggestions = await invoke<ConceptSuggestion[]>('get_concept_suggestions', {
        notePath,
        content,
      });
      visible = suggestions.length > 0;
      selectedIndex = 0;
    } catch (error) {
      console.error('Concept suggestions failed:', error);
      suggestions = [];
      visible = false;
    }
  }

  function handleLink(suggestion: ConceptSuggestion) {
    onLink(suggestion.offset, suggestion.length, suggestion.title);
    // Remove the linked suggestion from the list
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

  onMount(async () => {
    // Listen for editor concept suggestion events
    unlisten = await listen('editor://concept-suggestions', (event) => {
      const payload = event.payload as ConceptSuggestion[];
      if (payload && payload.length > 0) {
        suggestions = payload;
        visible = true;
        selectedIndex = 0;
      }
    });
  });

  onDestroy(() => {
    if (unlisten) unlisten();
    if (debounceTimer) clearTimeout(debounceTimer);
  });
</script>

<svelte:window on:keydown={handleKeydown} />

{#if visible && suggestions.length > 0}
  <div class="concept-popover" role="dialog" aria-label="Concept link suggestions">
    <div class="popover-header">
      <Icon name="lightbulb" size={14} />
      <span>Link suggestions ({suggestions.length})</span>
      <button class="close-btn" on:click={() => (visible = false)} aria-label="Close suggestions">
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
    bottom: 4rem;
    right: 1rem;
    width: 320px;
    max-height: 240px;
    background: var(--bg-secondary, #1e1e2e);
    border: 1px solid var(--border-color, #45475a);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 100;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .popover-header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--border-color, #45475a);
    font-size: 0.75rem;
    color: var(--text-muted, #a6adc8);
  }

  .close-btn {
    margin-left: auto;
    background: none;
    border: none;
    color: var(--text-muted, #a6adc8);
    cursor: pointer;
    padding: 2px;
    border-radius: 4px;
  }

  .close-btn:hover {
    background: var(--bg-hover, #313244);
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
    padding: 6px 12px;
    font-size: 0.8rem;
    border-bottom: 1px solid var(--border-subtle, #313244);
  }

  .suggestion-item.selected {
    background: var(--bg-hover, #313244);
  }

  .suggestion-text {
    flex: 1;
    color: var(--text-primary, #cdd6f4);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .suggestion-text strong {
    color: var(--accent-color, #89b4fa);
  }

  .suggestion-actions {
    display: flex;
    gap: 4px;
    margin-left: 8px;
  }

  .action-btn {
    padding: 2px 8px;
    border-radius: 4px;
    border: none;
    font-size: 0.7rem;
    cursor: pointer;
  }

  .link-btn {
    background: var(--accent-color, #89b4fa);
    color: var(--bg-primary, #1e1e2e);
  }

  .link-btn:hover {
    opacity: 0.9;
  }

  .dismiss-btn {
    background: var(--bg-tertiary, #45475a);
    color: var(--text-muted, #a6adc8);
  }

  .dismiss-btn:hover {
    background: var(--bg-hover, #585b70);
  }
</style>
