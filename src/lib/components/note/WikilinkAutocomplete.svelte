<script lang="ts">
  import { invoke } from '@tauri-apps/api/core';
  import { onMount } from 'svelte';
  import type { Note } from '@/types/vault';
  
  export let query: string = '';
  export let x: number = 0;
  export let y: number = 0;
  export let onSelect: (title: string) => void;
  export let onClose: () => void;
  
  let suggestions: Note[] = [];
  let selectedIndex = 0;
  
  $: if (query) {
    loadSuggestions(query);
  }
  
  async function loadSuggestions(searchQuery: string) {
    try {
      const allNotes = await invoke<Note[]>('list_notes', {
        vaultPath: '', // Will use current vault
        folderPath: null,
      });
      
      // Filter notes by title matching query
      suggestions = allNotes
        .filter(note => 
          note.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 10); // Limit to 10 suggestions
        
      selectedIndex = 0;
    } catch (error) {
      console.error('Failed to load suggestions:', error);
      suggestions = [];
    }
  }
  
  function handleKeydown(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, suggestions.length - 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        break;
      case 'Enter':
        event.preventDefault();
        if (suggestions[selectedIndex]) {
          onSelect(suggestions[selectedIndex].title);
        }
        break;
      case 'Escape':
        event.preventDefault();
        onClose();
        break;
    }
  }
  
  function handleSelect(note: Note) {
    onSelect(note.title);
  }
  
  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  });
</script>

<div class="autocomplete" style="left: {x}px; top: {y}px;">
  {#if suggestions.length > 0}
    <div class="suggestions">
      {#each suggestions as note, index}
        <button
          class="suggestion-item"
          class:selected={index === selectedIndex}
          on:click={() => handleSelect(note)}
          type="button"
        >
          <span class="suggestion-title">{note.title}</span>
          {#if note.frontmatter?.tags}
            <span class="suggestion-tags">
              {note.frontmatter.tags.slice(0, 3).join(', ')}
            </span>
          {/if}
        </button>
      {/each}
    </div>
  {:else}
    <div class="no-results">
      <p>No notes found</p>
    </div>
  {/if}
</div>

<style>
  .autocomplete {
    position: fixed;
    z-index: 10000;
    background-color: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-m);
    box-shadow: var(--shadow-xl);
    min-width: 300px;
    max-width: 500px;
    max-height: 400px;
    overflow-y: auto;
  }
  
  .suggestions {
    padding: var(--spacing-xs);
  }
  
  .suggestion-item {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-xs);
    padding: var(--spacing-s) var(--spacing-m);
    background: none;
    border: none;
    border-radius: var(--radius-s);
    cursor: pointer;
    text-align: left;
    transition: background-color var(--transition-fast);
  }
  
  .suggestion-item:hover,
  .suggestion-item.selected {
    background-color: var(--background-modifier-hover);
  }
  
  .suggestion-title {
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--text-primary);
  }
  
  .suggestion-tags {
    font-size: var(--font-size-xs);
    color: var(--text-muted);
  }
  
  .no-results {
    padding: var(--spacing-m);
    text-align: center;
  }
  
  .no-results p {
    color: var(--text-muted);
    font-size: var(--font-size-sm);
  }
</style>
