<script lang="ts">
  import { onDestroy } from 'svelte';
  import Icon from '@/components/icons/Icon.svelte';
  import ConnectionItem from './ConnectionItem.svelte';
  import { activeNote } from '@/stores/vault/vault';
  import {
    type Connection,
    type ViewTab,
    fetchSimilarNotes,
    lookupByText,
    togglePin,
    copyAsWikilinks as doCopyWikilinks,
    pickRandomConnection,
    buildDragData,
  } from './connectionsLogic';

  export let onOpenNote: ((path: string) => void) | undefined = undefined;

  let connections: Connection[] = [];
  let pinnedConnections: Connection[] = [];
  let isLoading = false;
  let isPaused = false;
  let activeTab: ViewTab = 'connections';

  let lookupQuery = '';
  let lookupResults: Connection[] = [];
  let isSearching = false;

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let lastNotePath: string | null = null;

  $: if ($activeNote && !isPaused && activeTab === 'connections') {
    const currentPath = $activeNote.path;
    if (currentPath !== lastNotePath) {
      lastNotePath = currentPath;
      debouncedFetchConnections(currentPath);
    }
  }

  function debouncedFetchConnections(path: string) {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => fetchConnections(path), 300);
  }

  async function fetchConnections(path: string) {
    isLoading = true;
    connections = await fetchSimilarNotes(path, pinnedConnections);
    isLoading = false;
  }

  async function handleLookup() {
    isSearching = true;
    lookupResults = await lookupByText(lookupQuery);
    isSearching = false;
  }

  function openNote(path: string) { onOpenNote?.(path); }

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

  function copyAsWikilinks() { doCopyWikilinks(pinnedConnections, connections); }

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

  onDestroy(() => { if (debounceTimer) clearTimeout(debounceTimer); });
</script>

<div class="connections-view">
  <div class="inspector-section-header">
    <Icon name="share-2" size={14} />
    <h3 class="inspector-section-title">Connections</h3>
    <div class="header-actions">
      <button class="icon-btn" on:click={openRandomConnection} title="Random connection" aria-label="Random connection">
        <Icon name="shuffle" size={14} />
      </button>
      <button class="icon-btn" on:click={copyAsWikilinks} title="Copy as wikilinks" aria-label="Copy as wikilinks">
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
      <button class="icon-btn" on:click={refreshConnections} title="Refresh" aria-label="Refresh connections">
        <Icon name="refresh-cw" size={14} />
      </button>
    </div>
  </div>

  <!-- Tab switcher -->
  <div class="tab-bar">
    <button
      class="tab-btn"
      class:active={activeTab === 'connections'}
      on:click={() => (activeTab = 'connections')}
    >
      Connections
    </button>
    <button
      class="tab-btn"
      class:active={activeTab === 'lookup'}
      on:click={() => (activeTab = 'lookup')}
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
    {:else if connections.length === 0 && pinnedConnections.length === 0}
      <div class="inspector-empty">
        <div class="inspector-empty-icon"><Icon name="share-2" size={32} /></div>
        <p class="inspector-empty-title">No connections found</p>
        <p class="inspector-empty-description">Semantically related notes will appear here</p>
      </div>
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
        />
        <button class="lookup-btn" on:click={handleLookup} disabled={isSearching}>
          <Icon name="arrow-right" size={14} />
        </button>
      </div>

      {#if isSearching}
        <div class="loading-state">
          <Icon name="loader" size={24} />
          <p>Searching...</p>
        </div>
      {:else if lookupResults.length === 0 && lookupQuery}
        <div class="inspector-empty">
          <div class="inspector-empty-icon"><Icon name="search" size={32} /></div>
          <p class="inspector-empty-title">No results</p>
          <p class="inspector-empty-description">Try a different query</p>
        </div>
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
        <div class="inspector-empty">
          <div class="inspector-empty-icon"><Icon name="search" size={32} /></div>
          <p class="inspector-empty-title">Lookup</p>
          <p class="inspector-empty-description">Enter a natural language query to find related notes</p>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .connections-view { display: flex; flex-direction: column; height: 100%; padding: var(--spacing-s); }
  .header-actions { display: flex; gap: 4px; }

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

  .icon-btn:hover { background-color: var(--interactive-hover); color: var(--text-normal); }
  .icon-btn.active { background-color: var(--interactive-accent); color: var(--text-on-accent); }

  .loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; gap: var(--spacing-s); color: var(--text-muted); text-align: center; padding: var(--spacing-xl) var(--spacing-m); }
  .loading-state p { font-size: var(--font-ui-small); font-weight: 500; margin: 0; }
  .connections-list { display: flex; flex-direction: column; gap: var(--spacing-s); }

  .section-label { font-size: var(--font-smallest); font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-faint); padding: 4px 0; }
  .tab-bar { display: flex; gap: 0; margin-bottom: var(--spacing-m); border-bottom: 1px solid var(--border-color); }

  .tab-btn {
    flex: 1;
    padding: var(--spacing-xs) var(--spacing-s);
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--text-muted);
    font-size: var(--font-smallest);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .tab-btn:hover { color: var(--text-normal); }
  .tab-btn.active { color: var(--interactive-accent); border-bottom-color: var(--interactive-accent); }

  .lookup-container { display: flex; flex-direction: column; flex: 1; gap: var(--spacing-m); }
  .lookup-input { display: flex; align-items: center; gap: var(--spacing-s); padding: var(--spacing-xs) var(--spacing-s); background-color: var(--background-modifier-form-field); border: 1px solid var(--border-color); border-radius: var(--radius-s); }
  .lookup-input input { flex: 1; background: none; border: none; color: var(--text-normal); font-size: var(--font-ui-small); outline: none; }
  .lookup-input input::placeholder { color: var(--text-faint); }
  .lookup-btn { display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; background: none; border: none; border-radius: var(--radius-s); color: var(--text-muted); cursor: pointer; transition: all 0.15s ease; }
  .lookup-btn:hover { background-color: var(--interactive-hover); color: var(--interactive-accent); }
  .lookup-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
