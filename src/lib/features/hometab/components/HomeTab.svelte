<script lang="ts">
  import { onMount } from 'svelte';
  import Icon from '@/components/icons/Icon.svelte';
  import { notes } from '@/stores/vault/vault';
  import { openNote } from '@/appNavigation';
  import { setViewportMode } from '@/stores/layout/presets';
  import { homeSettings } from '../stores/homeStore';
  import { searchFiles, detectFilter, getFileIcon } from '../services/homeSearch';
  import type { FileTypeFilter } from '../types';
  import { FILE_TYPE_FILTERS } from '../types';
  import type { HomeSearchResult } from '../services/homeSearch';
  import HomeFileGrid from './HomeFileGrid.svelte';

  let query = '';
  let activeFilter: FileTypeFilter | null = null;
  let results: HomeSearchResult[] = [];
  let showResults = false;
  let inputEl: HTMLInputElement;
  let selectedIdx = -1;

  $: {
    const { filter, cleanQuery } = detectFilter(query);
    if (filter) activeFilter = filter;
    if (query.trim() || activeFilter) {
      results = searchFiles($notes, activeFilter ? detectFilter(query).cleanQuery : query, activeFilter);
      showResults = true;
    } else {
      results = [];
      showResults = false;
    }
  }

  function handleOpen(path: string) {
    openNote(path);
    setViewportMode('note');
    query = '';
    showResults = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Tab' && query.trim() && !activeFilter) {
      const lower = query.toLowerCase().trim();
      const match = FILE_TYPE_FILTERS.find(f => f.key.startsWith(lower));
      if (match) { e.preventDefault(); activeFilter = match; query = ''; return; }
    }
    if (e.key === 'Backspace' && query === '' && activeFilter) { e.preventDefault(); activeFilter = null; return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); selectedIdx = Math.min(selectedIdx + 1, results.length - 1); }
    if (e.key === 'ArrowUp') { e.preventDefault(); selectedIdx = Math.max(selectedIdx - 1, -1); }
    if (e.key === 'Enter' && selectedIdx >= 0 && results[selectedIdx]) { e.preventDefault(); handleOpen(results[selectedIdx].path); }
    if (e.key === 'Escape') { query = ''; activeFilter = null; showResults = false; selectedIdx = -1; }
  }

  onMount(() => { inputEl?.focus(); });
</script>

<div class="home-tab">
  <div class="home-container">
    <div class="home-branding">
      <Icon name="home" size={36} />
      <h1 class="home-title">Bismuth</h1>
    </div>

    {#if $homeSettings.showSearchBar}
      <div class="search-wrapper">
        <div class="search-bar">
          {#if activeFilter}
            <span class="filter-chip">
              {activeFilter.label}
              <button class="chip-remove" on:click={() => { activeFilter = null; }}><Icon name="x" size={10} /></button>
            </span>
          {/if}
          <Icon name="search" size={16} />
          <input
            bind:this={inputEl} bind:value={query} on:keydown={handleKeydown}
            on:focus={() => { if (query || activeFilter) showResults = true; }}
            type="text" class="search-input"
            placeholder={activeFilter ? `Search ${activeFilter.label} files...` : 'Search files... (type filter name + Tab)'}
            aria-label="Search vault files"
          />
        </div>
        {#if showResults && results.length > 0}
          <ul class="search-results" role="listbox">
            {#each results as result, i (result.path)}
              <li class="result-item" class:selected={i === selectedIdx} role="option" aria-selected={i === selectedIdx}
                on:click={() => handleOpen(result.path)} on:keydown={(e) => e.key === 'Enter' && handleOpen(result.path)} tabindex="-1">
                <Icon name={getFileIcon(result.extension)} size={14} />
                <span class="result-title">{result.title}</span>
                <span class="result-ext">.{result.extension}</span>
              </li>
            {/each}
          </ul>
        {/if}
        {#if !activeFilter}
          <div class="filter-hints">
            {#each FILE_TYPE_FILTERS as filter (filter.key)}
              <button class="filter-hint-btn" on:click={() => { activeFilter = filter; inputEl?.focus(); }}>{filter.label}</button>
            {/each}
          </div>
        {/if}
      </div>
    {/if}

    <HomeFileGrid onOpen={handleOpen} />

    <div class="quick-actions">
      <button class="quick-btn" on:click={() => setViewportMode('graph')} title="Open Graph">
        <Icon name="git-branch" size={16} /> Graph
      </button>
      <button class="quick-btn" on:click={() => setViewportMode('calendar')} title="Open Calendar">
        <Icon name="calendar" size={16} /> Calendar
      </button>
      <button class="quick-btn" on:click={() => setViewportMode('canvas')} title="Open Canvas">
        <Icon name="layout" size={16} /> Canvas
      </button>
      <button class="quick-btn" on:click={() => {
        const all = $notes.filter(n => n.path.endsWith('.md'));
        if (all.length > 0) handleOpen(all[Math.floor(Math.random() * all.length)].path);
      }} title="Open Random Note">
        <Icon name="shuffle" size={16} /> Random Note
      </button>
    </div>
  </div>
</div>

<style>
  .home-tab { display: flex; align-items: flex-start; justify-content: center; width: 100%; height: 100%; overflow-y: auto; padding: var(--spacing-xl) var(--spacing-m); background: var(--background-primary); }
  .home-container { display: flex; flex-direction: column; align-items: center; gap: var(--spacing-l); max-width: 640px; width: 100%; padding-top: 8vh; }
  .home-branding { display: flex; flex-direction: column; align-items: center; gap: var(--spacing-sm, 6px); color: var(--text-primary); opacity: 0.8; }
  .home-title { font-size: 1.6rem; font-weight: 600; letter-spacing: -0.01em; margin: 0; color: var(--text-primary); }

  .search-wrapper { width: 100%; position: relative; }
  .search-bar { display: flex; align-items: center; gap: var(--spacing-sm, 6px); padding: 10px 14px; background: var(--background-secondary); border: 1px solid var(--background-modifier-border); border-radius: var(--radius-l, 12px); transition: border-color 0.15s, box-shadow 0.15s; }
  .search-bar:focus-within { border-color: var(--interactive-accent); box-shadow: 0 0 0 2px color-mix(in srgb, var(--interactive-accent) 20%, transparent); }
  .search-input { flex: 1; border: none; background: none; outline: none; font-size: var(--font-size-md, 15px); color: var(--text-primary); min-width: 0; }
  .search-input::placeholder { color: var(--text-muted); }

  .filter-chip { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; background: var(--interactive-accent); color: var(--text-on-accent); border-radius: var(--radius-s, 4px); font-size: var(--font-size-xs, 11px); font-weight: 500; white-space: nowrap; }
  .chip-remove { display: flex; background: none; border: none; padding: 0; color: inherit; cursor: pointer; opacity: 0.7; }
  .chip-remove:hover { opacity: 1; }

  .filter-hints { display: flex; gap: 4px; margin-top: 6px; flex-wrap: wrap; justify-content: center; }
  .filter-hint-btn { padding: 2px 8px; background: var(--background-secondary); border: 1px solid var(--background-modifier-border); border-radius: var(--radius-s, 4px); font-size: var(--font-size-xs, 11px); color: var(--text-muted); cursor: pointer; transition: background 0.12s, color 0.12s; }
  .filter-hint-btn:hover { background: var(--background-modifier-hover); color: var(--text-primary); }

  .search-results { position: absolute; top: 100%; left: 0; right: 0; max-height: 280px; overflow-y: auto; margin: 4px 0 0; padding: 4px; background: var(--background-secondary); border: 1px solid var(--background-modifier-border); border-radius: var(--radius-m, 8px); box-shadow: var(--shadow-l, 0 8px 24px rgba(0,0,0,0.15)); z-index: 10; list-style: none; }
  .result-item { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: var(--radius-s, 4px); cursor: pointer; color: var(--text-primary); font-size: var(--font-size-sm, 13px); }
  .result-item:hover, .result-item.selected { background: var(--background-modifier-hover); }
  .result-title { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .result-ext { color: var(--text-muted); font-size: var(--font-size-xs, 11px); }

  .quick-actions { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; padding-top: var(--spacing-sm, 6px); }
  .quick-btn { display: flex; align-items: center; gap: 6px; padding: 6px 12px; background: var(--background-secondary); border: 1px solid var(--background-modifier-border); border-radius: var(--radius-m, 8px); color: var(--text-muted); font-size: var(--font-size-sm, 13px); cursor: pointer; transition: background 0.12s, color 0.12s; }
  .quick-btn:hover { background: var(--background-modifier-hover); color: var(--text-primary); }
</style>
