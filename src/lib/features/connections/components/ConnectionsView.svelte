<script lang="ts">
  import { onDestroy } from 'svelte';
  import Icon from '@/components/icons/Icon.svelte';
  import PanelHeader from '@/components/ui/layout/PanelHeader.svelte';
  import ConnectionItem from './ConnectionItem.svelte';
  import EmptyState from '@/components/ui/feedback/EmptyState.svelte';
  import { activeNote, notes } from '@/stores/vault/vault';
  import { openNote as navOpenNote } from '@/appNavigation';
  import {
    type Connection,
    type ViewTab,
    fetchSimilarNotes,
    lookupByText,
    togglePin,
    copyAsWikilinks as doCopyWikilinks,
    pickRandomConnection,
    buildDragData,
    computeLinkSuggestions,
  } from '../services/connectionsLogic';
  import LinkSuggestions from './LinkSuggestions.svelte';
  import type { Note } from '@/types/data/vault';

  export let onOpenNote: ((path: string) => void) | undefined = undefined;

  let connections: Connection[] = [];
  let pinnedConnections: Connection[] = [];
  let isLoading = false;
  let isPaused = false;
  let activeTab: ViewTab = 'connections';
  let connectionError: string | null = null;

  let lookupQuery = '';
  let lookupResults: Connection[] = [];
  let isSearching = false;

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let lastNotePath: string | null = null;

  /** Notes suggested as candidates for wikilink insertion. */
  let linkSuggestions: Note[] = [];

  $: if ($activeNote && !isPaused && activeTab === 'connections') {
    const currentPath = $activeNote.path;
    if (currentPath !== lastNotePath) {
      lastNotePath = currentPath;
      debouncedFetchConnections(currentPath);
    }
  }

  $: if ($activeNote) {
    linkSuggestions = computeLinkSuggestions($activeNote, $notes);
  }

  function debouncedFetchConnections(path: string) {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => fetchConnections(path), 300);
  }

  async function fetchConnections(path: string) {
    isLoading = true;
    connectionError = null;
    const result = await fetchSimilarNotes(path, pinnedConnections);
    connections = result.connections;
    connectionError = result.error ?? null;
    isLoading = false;
  }

  async function handleLookup() {
    isSearching = true;
    lookupResults = await lookupByText(lookupQuery);
    isSearching = false;
  }

  function openNote(path: string) {
    onOpenNote ? onOpenNote(path) : navOpenNote(path);
  }

  function togglePause() {
    isPaused = !isPaused;
    if (!isPaused && $activeNote) fetchConnections($activeNote.path);
  }

  function refreshConnections() {
    if ($activeNote) fetchConnections($activeNote.path);
  }

  function pinConnection(connection: Connection) {
    const result = togglePin(connection, pinnedConnections, connections);
    pinnedConnections = result.pinned;
    connections = result.connections;
  }

  function copyAsWikilinks() {
    doCopyWikilinks(pinnedConnections, connections);
  }

  function openRandomConnection() {
    const path = pickRandomConnection(connections, pinnedConnections);
    if (path) openNote(path);
  }

  function handleDragStart(e: DragEvent, connection: Connection) {
    const data = buildDragData(connection);
    e.dataTransfer?.setData('text/plain', data.text);
    e.dataTransfer?.setData('application/bismuth-wikilink', data.wikilinkPath);
  }

  function handleLookupKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') handleLookup();
  }

  onDestroy(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
  });
</script>

<div class="connections-view">
  <PanelHeader icon="share-2" title="Connections" count={connections.length || undefined}>
    <svelte:fragment slot="actions">
      <button
        class="icon-btn"
        on:click={openRandomConnection}
        title="Random connection"
        aria-label="Random connection"
      >
        <Icon name="shuffle" size={14} />
      </button>
      <button
        class="icon-btn"
        on:click={copyAsWikilinks}
        title="Copy as wikilinks"
        aria-label="Copy as wikilinks"
      >
        <Icon name="copy" size={14} />
      </button>
      <button
        class="icon-btn"
        class:active={isPaused}
        on:click={togglePause}
        title={isPaused ? 'Resume' : 'Pause'}
        aria-label={isPaused ? 'Resume connections' : 'Pause connections'}
      >
        <Icon name={isPaused ? 'play' : 'pause'} size={14} />
      </button>
      <button
        class="icon-btn"
        on:click={refreshConnections}
        title="Refresh"
        aria-label="Refresh connections"
      >
        <Icon name="refresh-cw" size={14} />
      </button>
    </svelte:fragment>
  </PanelHeader>

  <!-- Tab switcher -->
  <div class="tab-bar" role="tablist">
    <button
      class="tab-btn"
      class:active={activeTab === 'connections'}
      on:click={() => (activeTab = 'connections')}
      title="View semantic connections"
      role="tab"
      aria-selected={activeTab === 'connections'}
    >
      Connections
    </button>
    <button
      class="tab-btn"
      class:active={activeTab === 'lookup'}
      on:click={() => (activeTab = 'lookup')}
      title="Natural language lookup"
      role="tab"
      aria-selected={activeTab === 'lookup'}
    >
      Lookup
    </button>
  </div>

  {#if activeTab === 'connections'}
    {#if isLoading}
      <div class="loading-state">
        <Icon name="loader" size={24} />
        <p>Finding connections...</p>
      </div>
    {:else if connectionError}
      <EmptyState
        icon="cpu"
        title="Embeddings not initialized"
        description="Enable embeddings in Settings to see similar notes."
      />
    {:else if connections.length === 0 && pinnedConnections.length === 0}
      <EmptyState
        icon="share-2"
        title="No connections found"
        description="Semantically related notes will appear here"
      />
    {:else}
      <div class="connections-list">
        {#if pinnedConnections.length > 0}
          <div class="section-label">Pinned</div>
          {#each pinnedConnections as connection (connection.path)}
            <ConnectionItem
              title={connection.title}
              score={connection.score}
              pinned={true}
              on:click={() => openNote(connection.path)}
              on:pin={() => pinConnection(connection)}
              on:dragstart={(e) => handleDragStart(e.detail, connection)}
            />
          {/each}
        {/if}

        {#if connections.filter((c) => !c.pinned).length > 0}
          {#if pinnedConnections.length > 0}
            <div class="section-label">Similar</div>
          {/if}
          {#each connections.filter((c) => !c.pinned) as connection (connection.path)}
            <ConnectionItem
              title={connection.title}
              score={connection.score}
              on:click={() => openNote(connection.path)}
              on:pin={() => pinConnection(connection)}
              on:dragstart={(e) => handleDragStart(e.detail, connection)}
            />
          {/each}
        {/if}
      </div>
    {/if}

    <LinkSuggestions suggestions={linkSuggestions} onOpenNote={openNote} />
  {:else}
    <!-- Lookup Tab -->
    <div class="lookup-container">
      <div class="lookup-input">
        <Icon name="search" size={14} />
        <input
          type="text"
          placeholder="Natural language query..."
          bind:value={lookupQuery}
          on:keydown={handleLookupKeydown}
          aria-label="Natural language search query"
        />
        <button
          class="lookup-btn"
          on:click={handleLookup}
          disabled={isSearching}
          title="Search"
          aria-label="Search"
        >
          <Icon name="arrow-right" size={14} />
        </button>
      </div>

      {#if isSearching}
        <div class="loading-state">
          <Icon name="loader" size={24} />
          <p>Searching...</p>
        </div>
      {:else if lookupResults.length === 0 && lookupQuery}
        <EmptyState icon="search" title="No results" description="Try a different query" />
      {:else if lookupResults.length > 0}
        <div class="connections-list">
          {#each lookupResults as result (result.path)}
            <ConnectionItem
              title={result.title}
              score={result.score}
              showPin={false}
              on:click={() => openNote(result.path)}
              on:dragstart={(e) => handleDragStart(e.detail, result)}
            />
          {/each}
        </div>
      {:else}
        <EmptyState
          icon="search"
          title="Lookup"
          description="Enter a natural language query to find related notes"
        />
      {/if}
    </div>
  {/if}
</div>

<style>
  .connections-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }
  .icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: none;
    border: none;
    border-radius: var(--radius-s);
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .icon-btn:hover {
    background-color: var(--interactive-hover);
    color: var(--text-normal);
  }
  .icon-btn.active {
    background-color: var(--interactive-accent);
    color: var(--text-on-accent);
  }
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    gap: var(--spacing-s);
    color: var(--text-muted);
    text-align: center;
    padding: var(--spacing-xl) var(--spacing-m);
  }
  .loading-state p {
    font-size: var(--font-ui-small);
    font-weight: var(--font-medium);
    margin: 0;
  }
  .connections-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-s);
    flex: 1;
    overflow-y: auto;
  }
  .section-label {
    font-size: var(--font-smallest);
    font-weight: var(--font-semibold);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-faint);
    padding: 4px 0;
  }
  .tab-bar {
    display: flex;
    gap: 0;
    margin-bottom: var(--spacing-m);
    border-bottom: 1px solid var(--border-color);
  }
  .tab-btn {
    flex: 1;
    padding: var(--spacing-xs) var(--spacing-s);
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--text-muted);
    font-size: var(--font-smallest);
    font-weight: var(--font-medium);
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .tab-btn:hover {
    color: var(--text-normal);
  }
  .tab-btn.active {
    color: var(--interactive-accent);
    border-bottom-color: var(--interactive-accent);
  }
  .lookup-container {
    display: flex;
    flex-direction: column;
    flex: 1;
    gap: var(--spacing-m);
  }
  .lookup-input {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
    padding: var(--spacing-xs) var(--spacing-s);
    background-color: var(--background-modifier-form-field);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
  }
  .lookup-input input {
    flex: 1;
    background: none;
    border: none;
    color: var(--text-normal);
    font-size: var(--font-ui-small);
    outline: none;
  }
  .lookup-input input::placeholder {
    color: var(--text-faint);
  }
  .lookup-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: none;
    border: none;
    border-radius: var(--radius-s);
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .lookup-btn:hover {
    background-color: var(--interactive-hover);
    color: var(--interactive-accent);
  }
  .lookup-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
