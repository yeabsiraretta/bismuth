<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { onMount } from 'svelte';
  import type { LinkSuggestion } from './autoLinkerLogic';
  import {
    scanForUnlinked,
    toggleExpand as doToggleExpand,
    toggleMatch as doToggleMatch,
    selectAllForNote as doSelectAll,
    deselectAllForNote as doDeselectAll,
    getSelectedCount,
    applySelectedLinks,
  } from './autoLinkerLogic';

  export let isOpen = false;
  export let onClose: () => void;

  let suggestions: LinkSuggestion[] = [];
  let isLoading = false;
  let caseSensitive = false;
  let selectedSuggestions: Map<string, Set<number>> = new Map();
  let expandedNotes: Set<string> = new Set();

  $: selectedCount = getSelectedCount(selectedSuggestions);

  $: if (isOpen) {
    doScan();
  }

  async function doScan() {
    isLoading = true;
    selectedSuggestions = new Map();
    try {
      const result = await scanForUnlinked(caseSensitive);
      suggestions = result.suggestions;
      expandedNotes = result.expandedNotes;
    } catch (error) {
      console.error('Failed to scan for unlinked references:', error);
      suggestions = [];
    } finally {
      isLoading = false;
    }
  }

  function handleToggleExpand(title: string) {
    expandedNotes = doToggleExpand(expandedNotes, title);
  }
  function handleToggleMatch(noteTitle: string, i: number) {
    selectedSuggestions = doToggleMatch(selectedSuggestions, noteTitle, i);
  }
  function handleSelectAll(noteTitle: string) {
    selectedSuggestions = doSelectAll(selectedSuggestions, suggestions, noteTitle);
  }
  function handleDeselectAll(noteTitle: string) {
    selectedSuggestions = doDeselectAll(selectedSuggestions, noteTitle);
  }
  function isMatchSelected(noteTitle: string, i: number): boolean {
    return selectedSuggestions.get(noteTitle)?.has(i) ?? false;
  }

  async function handleApply() {
    try {
      await applySelectedLinks(selectedSuggestions, suggestions);
      onClose();
    } catch (error) {
      console.error('Failed to apply links:', error);
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!isOpen) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  }

  onMount(() => {
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  });
</script>

{#if isOpen}
  <div
    class="auto-linker-overlay"
    on:click|self={onClose}
    on:keydown={(e) => e.key === 'Escape' && onClose()}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <div class="auto-linker-modal">
      <header class="modal-header">
        <h2>
          <Icon name="link" size={18} />
          Unlinked References
        </h2>
        <div class="header-controls">
          <label class="case-toggle">
            <input type="checkbox" bind:checked={caseSensitive} on:change={doScan} />
            Case sensitive
          </label>
          <button class="close-btn" on:click={onClose} aria-label="Close">
            <Icon name="x" size={16} />
          </button>
        </div>
      </header>

      <div class="modal-body">
        {#if isLoading}
          <div class="loading-state">
            <Icon name="loader" size={20} />
            <span>Scanning for unlinked references…</span>
          </div>
        {:else if suggestions.length === 0}
          <div class="empty-state">
            <Icon name="check-circle" size={24} />
            <p>No unlinked references found.</p>
            <p class="hint">All mentions of other note titles are already linked.</p>
          </div>
        {:else}
          <div class="suggestions-list">
            {#each suggestions as suggestion}
              <div class="suggestion-group">
                <div
                  class="group-header"
                  role="button"
                  tabindex="0"
                  on:click={() => handleToggleExpand(suggestion.note_title)}
                  on:keydown={(e) => e.key === 'Enter' && handleToggleExpand(suggestion.note_title)}
                >
                  <Icon
                    name={expandedNotes.has(suggestion.note_title)
                      ? 'chevron-down'
                      : 'chevron-right'}
                    size={14}
                  />
                  <span class="note-title">{suggestion.note_title}</span>
                  <span class="match-count"
                    >{suggestion.matches.length} match{suggestion.matches.length !== 1
                      ? 'es'
                      : ''}</span
                  >
                  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
                  <div class="group-actions" on:click|stopPropagation>
                    <button
                      class="action-btn"
                      on:click={() => handleSelectAll(suggestion.note_title)}
                      title="Select all">All</button
                    >
                    <button
                      class="action-btn"
                      on:click={() => handleDeselectAll(suggestion.note_title)}
                      title="Deselect all">None</button
                    >
                  </div>
                </div>

                {#if expandedNotes.has(suggestion.note_title)}
                  <div class="match-list">
                    {#each suggestion.matches as match, i}
                      <label
                        class="match-item"
                        class:selected={isMatchSelected(suggestion.note_title, i)}
                      >
                        <input
                          type="checkbox"
                          checked={isMatchSelected(suggestion.note_title, i)}
                          on:change={() => handleToggleMatch(suggestion.note_title, i)}
                        />
                        <span class="match-context">
                          …{match.context.slice(0, match.start > 50 ? 50 : match.start)}<mark
                            >{match.text}</mark
                          >{match.context.slice(
                            (match.start > 50 ? 50 : match.start) + match.text.length
                          )}…
                        </span>
                      </label>
                    {/each}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>

      {#if suggestions.length > 0}
        <footer class="modal-footer">
          <span class="selection-count">
            {selectedCount} reference{selectedCount !== 1 ? 's' : ''} selected
          </span>
          <div class="footer-actions">
            <button class="btn-secondary" on:click={onClose}>Cancel</button>
            <button class="btn-primary" disabled={selectedCount === 0} on:click={handleApply}>
              <Icon name="link" size={14} />
              Create {selectedCount} link{selectedCount !== 1 ? 's' : ''}
            </button>
          </div>
        </footer>
      {/if}
    </div>
  </div>
{/if}

<style>
  .auto-linker-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--background-modifier-cover, rgba(0, 0, 0, 0.5));
  }

  .auto-linker-modal {
    width: 640px;
    max-width: 90vw;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    background: var(--background-primary, #1e1e1e);
    border: 1px solid var(--background-modifier-border, #3a3a3a);
    border-radius: 8px;
    box-shadow: var(--shadow-xl, 0 8px 24px rgba(0, 0, 0, 0.4));
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--background-modifier-border, #3a3a3a);
  }

  .modal-header h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-normal, #e0e0e0);
  }

  .header-controls {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .case-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--text-muted, #a0a0a0);
    cursor: pointer;
  }

  .close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--text-muted, #a0a0a0);
    cursor: pointer;
  }

  .close-btn:hover {
    background: var(--interactive-hover, #2f2f2f);
    color: var(--text-normal, #e0e0e0);
  }

  .modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 12px 20px;
  }

  .loading-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 40px 20px;
    color: var(--text-muted, #a0a0a0);
  }

  .empty-state .hint {
    font-size: 12px;
    color: var(--text-faint, #707070);
  }

  .suggestions-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .suggestion-group {
    border: 1px solid var(--background-modifier-border, #3a3a3a);
    border-radius: 6px;
    overflow: hidden;
  }

  .group-header {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 10px 12px;
    border: none;
    background: var(--background-secondary, #252525);
    color: var(--text-normal, #e0e0e0);
    cursor: pointer;
    font-size: 13px;
    text-align: left;
  }

  .group-header:hover {
    background: var(--interactive-hover, #2f2f2f);
  }

  .note-title {
    font-weight: 500;
    flex: 1;
  }

  .match-count {
    font-size: 11px;
    color: var(--text-muted, #a0a0a0);
    padding: 2px 6px;
    background: var(--background-primary, #1e1e1e);
    border-radius: 10px;
  }

  .group-actions {
    display: flex;
    gap: 4px;
  }

  .action-btn {
    padding: 2px 8px;
    border: 1px solid var(--background-modifier-border, #3a3a3a);
    border-radius: 4px;
    background: transparent;
    color: var(--text-muted, #a0a0a0);
    font-size: 11px;
    cursor: pointer;
  }

  .action-btn:hover {
    background: var(--interactive-hover, #2f2f2f);
    color: var(--text-normal, #e0e0e0);
  }

  .match-list {
    display: flex;
    flex-direction: column;
  }

  .match-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 8px 12px 8px 32px;
    cursor: pointer;
    font-size: 12px;
    color: var(--text-normal, #e0e0e0);
    border-top: 1px solid var(--background-modifier-border, #3a3a3a);
  }

  .match-item:hover {
    background: var(--interactive-hover, #2f2f2f);
  }

  .match-item.selected {
    background: rgba(99, 102, 241, 0.08);
  }

  .match-item input[type='checkbox'] {
    margin-top: 2px;
    flex-shrink: 0;
  }

  .match-context {
    line-height: 1.5;
    word-break: break-word;
  }

  .match-context mark {
    background: rgba(99, 102, 241, 0.3);
    color: var(--text-normal, #e0e0e0);
    padding: 1px 2px;
    border-radius: 2px;
  }

  .modal-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
    border-top: 1px solid var(--background-modifier-border, #3a3a3a);
  }

  .selection-count {
    font-size: 12px;
    color: var(--text-muted, #a0a0a0);
  }

  .footer-actions {
    display: flex;
    gap: 8px;
  }

  .btn-secondary {
    padding: 6px 14px;
    border: 1px solid var(--background-modifier-border, #3a3a3a);
    border-radius: 4px;
    background: transparent;
    color: var(--text-normal, #e0e0e0);
    font-size: 13px;
    cursor: pointer;
  }

  .btn-secondary:hover {
    background: var(--interactive-hover, #2f2f2f);
  }

  .btn-primary {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border: none;
    border-radius: 4px;
    background: var(--interactive-accent, #6366f1);
    color: var(--text-on-accent, #ffffff);
    font-size: 13px;
    cursor: pointer;
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--interactive-accent-hover, #4f46e5);
  }

  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
