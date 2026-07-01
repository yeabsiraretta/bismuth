<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import AutoLinkerGroup from './AutoLinkerGroup.svelte';
  import { onMount, onDestroy } from 'svelte';
  import { createFocusTrap, type FocusTrapInstance } from '@/utils/accessibility/focusTrap';
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
  import { log } from '@/utils/logger';

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
      log.error('Failed to scan for unlinked references', error);
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
      log.error('Failed to apply links', error);
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!isOpen) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  }

  let modalEl: HTMLElement;
  let trap: FocusTrapInstance | null = null;

  $: if (isOpen && modalEl) {
    trap = createFocusTrap(modalEl, { onEscape: onClose, returnFocus: true });
    trap.activate();
  }

  $: if (!isOpen && trap) {
    trap.deactivate();
    trap = null;
  }

  onMount(() => {
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  });

  onDestroy(() => trap?.deactivate());
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
    <div class="auto-linker-modal" bind:this={modalEl}>
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
              <AutoLinkerGroup
                {suggestion}
                expanded={expandedNotes.has(suggestion.note_title)}
                {isMatchSelected}
                onToggleExpand={handleToggleExpand}
                onToggleMatch={handleToggleMatch}
                onSelectAll={handleSelectAll}
                onDeselectAll={handleDeselectAll}
              />
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
  .auto-linker-overlay { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; background: var(--background-modifier-cover, rgba(0, 0, 0, 0.5)); }
  .auto-linker-modal { width: 640px; max-width: calc(90vw / var(--ui-scale, 1)); max-height: calc(80vh / var(--ui-scale, 1)); display: flex; flex-direction: column; background: var(--background-primary, #1e1e1e); border: 1px solid var(--background-modifier-border, #3a3a3a); border-radius: 8px; box-shadow: var(--shadow-xl, 0 8px 24px rgba(0, 0, 0, 0.4)); }
  .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--background-modifier-border, #3a3a3a); }
  .modal-header h2 { display: flex; align-items: center; gap: 8px; margin: 0; font-size: 14px; font-weight: 600; color: var(--text-normal, #e0e0e0); }
  .header-controls { display: flex; align-items: center; gap: 12px; }
  .case-toggle { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-muted, #a0a0a0); cursor: pointer; }
  .close-btn { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border: none; border-radius: 4px; background: transparent; color: var(--text-muted, #a0a0a0); cursor: pointer; }
  .close-btn:hover { background: var(--interactive-hover, #2f2f2f); color: var(--text-normal, #e0e0e0); }
  .modal-body { flex: 1; overflow-y: auto; padding: 12px 20px; }
  .loading-state, .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 40px 20px; color: var(--text-muted, #a0a0a0); }
  .empty-state .hint { font-size: 12px; color: var(--text-faint, #707070); }
  .suggestions-list { display: flex; flex-direction: column; gap: 4px; }
  .modal-footer { display: flex; align-items: center; justify-content: space-between; padding: 12px 20px; border-top: 1px solid var(--background-modifier-border, #3a3a3a); }
  .selection-count { font-size: 12px; color: var(--text-muted, #a0a0a0); }
  .footer-actions { display: flex; gap: 8px; }
  .btn-secondary { padding: 6px 14px; border: 1px solid var(--background-modifier-border, #3a3a3a); border-radius: 4px; background: transparent; color: var(--text-normal, #e0e0e0); font-size: 13px; cursor: pointer; }
  .btn-secondary:hover { background: var(--interactive-hover, #2f2f2f); }
  .btn-primary { display: flex; align-items: center; gap: 6px; padding: 6px 14px; border: none; border-radius: 4px; background: var(--interactive-accent, #dc2626); color: var(--text-on-accent, #ffffff); font-size: 13px; cursor: pointer; }
  .btn-primary:hover:not(:disabled) { background: var(--interactive-accent-hover, #b91c1c); }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
