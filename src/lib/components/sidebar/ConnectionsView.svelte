<script lang="ts">
  /* eslint-disable max-lines */
  import { onDestroy } from 'svelte';
  import { invoke } from '@tauri-apps/api/core';
  import Icon from '@/components/icons/Icon.svelte';
  import { activeNote } from '@/stores/vault/vault';

  interface Connection {
    path: string;
    title: string;
    score: number;
    pinned?: boolean;
  }

  type ViewTab = 'connections' | 'lookup';

  export let onOpenNote: ((path: string) => void) | undefined = undefined;

  let connections: Connection[] = [];
  let pinnedConnections: Connection[] = [];
  let isLoading = false;
  let isPaused = false;
  let activeTab: ViewTab = 'connections';

  // Lookup state
  let lookupQuery = '';
  let lookupResults: Connection[] = [];
  let isSearching = false;

  // Debounce timer for auto-update
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let lastNotePath: string | null = null;

  // React to active note changes (debounced 300ms)
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
    try {
      const results = await invoke<Array<{ path: string; score: number }>>('get_similar_notes', {
        path,
        topK: 8,
      });
      connections = results.map((r) => ({
        path: r.path,
        title: getFileName(r.path),
        score: r.score,
        pinned: pinnedConnections.some((p) => p.path === r.path),
      }));
    } catch (error) {
      console.error('Failed to fetch connections:', error);
      connections = [];
    }
    isLoading = false;
  }

  async function handleLookup() {
    if (!lookupQuery.trim()) return;
    isSearching = true;
    try {
      const results = await invoke<Array<{ path: string; score: number }>>('lookup_by_text', {
        query: lookupQuery,
        topK: 10,
      });
      lookupResults = results.map((r) => ({
        path: r.path,
        title: getFileName(r.path),
        score: r.score,
      }));
    } catch (error) {
      console.error('Failed to lookup:', error);
      lookupResults = [];
    }
    isSearching = false;
  }

  function openNote(path: string) {
    onOpenNote?.(path);
  }

  function togglePause() {
    isPaused = !isPaused;
    if (!isPaused && $activeNote) {
      fetchConnections($activeNote.path);
    }
  }

  function refreshConnections() {
    if ($activeNote) {
      fetchConnections($activeNote.path);
    }
  }

  function pinConnection(connection: Connection) {
    if (pinnedConnections.some((p) => p.path === connection.path)) {
      pinnedConnections = pinnedConnections.filter((p) => p.path !== connection.path);
    } else {
      pinnedConnections = [...pinnedConnections, { ...connection, pinned: true }];
    }
    // Update pin status in connections list
    connections = connections.map((c) => ({
      ...c,
      pinned: pinnedConnections.some((p) => p.path === c.path),
    }));
  }

  function copyAsWikilinks() {
    const allConnections = [...pinnedConnections, ...connections.filter((c) => !c.pinned)];
    const wikilinks = allConnections.map((c) => `[[${c.title.replace('.md', '')}]]`).join('\n');
    navigator.clipboard.writeText(wikilinks).catch(console.error);
  }

  function openRandomConnection() {
    const pool = connections.length > 0 ? connections : pinnedConnections;
    if (pool.length === 0) return;
    const idx = Math.floor(Math.random() * pool.length);
    openNote(pool[idx].path);
  }

  function handleDragStart(e: DragEvent, connection: Connection) {
    const wikilink = `[[${connection.title.replace('.md', '')}]]`;
    e.dataTransfer?.setData('text/plain', wikilink);
    e.dataTransfer?.setData('application/bismuth-wikilink', connection.path);
  }

  function getFileName(path: string): string {
    const parts = path.split('/');
    return parts[parts.length - 1] || path;
  }

  function handleLookupKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') handleLookup();
  }

  onDestroy(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
  });
</script>

<div class="connections-view">
  <div class="panel-header">
    <Icon name="share-2" size={16} />
    <h3>Connections</h3>
    <div class="header-actions">
      <button class="icon-btn" on:click={openRandomConnection} title="Random connection">
        <Icon name="shuffle" size={14} />
      </button>
      <button class="icon-btn" on:click={copyAsWikilinks} title="Copy as wikilinks">
        <Icon name="copy" size={14} />
      </button>
      <button
        class="icon-btn"
        class:active={isPaused}
        on:click={togglePause}
        title={isPaused ? 'Resume' : 'Pause'}
      >
        <Icon name={isPaused ? 'play' : 'pause'} size={14} />
      </button>
      <button class="icon-btn" on:click={refreshConnections} title="Refresh">
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
      <div class="empty-state">
        <Icon name="share-2" size={32} />
        <p>No connections found</p>
        <span class="hint">Semantically related notes will appear here</span>
      </div>
    {:else}
      <div class="connections-list">
        {#if pinnedConnections.length > 0}
          <div class="section-label">Pinned</div>
          {#each pinnedConnections as connection (connection.path)}
            <div
              class="connection-item pinned"
              role="button"
              tabindex="0"
              draggable="true"
              on:click={() => openNote(connection.path)}
              on:keydown={(e) => e.key === 'Enter' && openNote(connection.path)}
              on:dragstart={(e) => handleDragStart(e, connection)}
            >
              <div class="connection-header">
                <Icon name="pin" size={12} />
                <span class="connection-title">{connection.title}</span>
                <button
                  class="pin-btn"
                  on:click|stopPropagation={() => pinConnection(connection)}
                  title="Unpin"
                >
                  <Icon name="x" size={10} />
                </button>
              </div>
              <div class="connection-score">
                <div class="score-bar" style:width="{connection.score * 100}%"></div>
                <span class="score-text">{Math.round(connection.score * 100)}%</span>
              </div>
            </div>
          {/each}
        {/if}

        {#if connections.filter((c) => !c.pinned).length > 0}
          {#if pinnedConnections.length > 0}
            <div class="section-label">Similar</div>
          {/if}
          {#each connections.filter((c) => !c.pinned) as connection (connection.path)}
            <div
              class="connection-item"
              role="button"
              tabindex="0"
              draggable="true"
              on:click={() => openNote(connection.path)}
              on:keydown={(e) => e.key === 'Enter' && openNote(connection.path)}
              on:dragstart={(e) => handleDragStart(e, connection)}
            >
              <div class="connection-header">
                <Icon name="file-text" size={14} />
                <span class="connection-title">{connection.title}</span>
                <button
                  class="pin-btn"
                  on:click|stopPropagation={() => pinConnection(connection)}
                  title="Pin"
                >
                  <Icon name="pin" size={10} />
                </button>
              </div>
              <div class="connection-score">
                <div class="score-bar" style:width="{connection.score * 100}%"></div>
                <span class="score-text">{Math.round(connection.score * 100)}%</span>
              </div>
            </div>
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
        <div class="empty-state">
          <Icon name="search" size={32} />
          <p>No results</p>
          <span class="hint">Try a different query</span>
        </div>
      {:else if lookupResults.length > 0}
        <div class="connections-list">
          {#each lookupResults as result (result.path)}
            <button
              class="connection-item"
              draggable="true"
              on:click={() => openNote(result.path)}
              on:dragstart={(e) => handleDragStart(e, result)}
            >
              <div class="connection-header">
                <Icon name="file-text" size={14} />
                <span class="connection-title">{result.title}</span>
              </div>
              <div class="connection-score">
                <div class="score-bar" style:width="{result.score * 100}%"></div>
                <span class="score-text">{Math.round(result.score * 100)}%</span>
              </div>
            </button>
          {/each}
        </div>
      {:else}
        <div class="empty-state">
          <Icon name="search" size={32} />
          <p>Lookup</p>
          <span class="hint">Enter a natural language query to find related notes</span>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .connections-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 12px;
  }

  .panel-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
  }

  .panel-header h3 {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-normal);
    margin: 0;
    flex: 1;
  }

  .header-actions {
    display: flex;
    gap: 4px;
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

  .loading-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    gap: 12px;
    color: var(--text-muted);
    text-align: center;
    padding: 32px 16px;
  }

  .loading-state p,
  .empty-state p {
    font-size: 14px;
    font-weight: 500;
    margin: 0;
  }

  .hint {
    font-size: 12px;
    color: var(--text-faint);
  }

  .connections-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .connection-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px;
    background: none;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: left;
  }

  .connection-item:hover {
    background-color: var(--interactive-hover);
    border-color: var(--interactive-accent);
  }

  .connection-header {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .connection-title {
    flex: 1;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-normal);
  }

  .connection-score {
    position: relative;
    height: 4px;
    background-color: var(--background-secondary);
    border-radius: 2px;
    overflow: hidden;
  }

  .score-bar {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background-color: var(--interactive-accent);
    transition: width 0.3s ease;
  }

  .score-text {
    position: absolute;
    top: -18px;
    right: 0;
    font-size: 10px;
    color: var(--text-faint);
  }

  .connection-item.pinned {
    border-color: var(--interactive-accent);
    background-color: var(--background-secondary-alt, var(--background-secondary));
  }

  .connection-item[draggable='true'] {
    cursor: grab;
  }

  .connection-item[draggable='true']:active {
    cursor: grabbing;
  }

  .pin-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    background: none;
    border: none;
    border-radius: var(--radius-s);
    color: var(--text-muted);
    cursor: pointer;
    opacity: 0;
    transition: all 0.15s ease;
    margin-left: auto;
  }

  .connection-item:hover .pin-btn {
    opacity: 1;
  }

  .pin-btn:hover {
    color: var(--interactive-accent);
    background-color: var(--interactive-hover);
  }

  .section-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-faint);
    padding: 4px 0;
  }

  .tab-bar {
    display: flex;
    gap: 0;
    margin-bottom: 12px;
    border-bottom: 1px solid var(--border-color);
  }

  .tab-btn {
    flex: 1;
    padding: 8px 12px;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--text-muted);
    font-size: 12px;
    font-weight: 500;
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
    gap: 12px;
  }

  .lookup-input {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    background-color: var(--background-modifier-form-field);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
  }

  .lookup-input input {
    flex: 1;
    background: none;
    border: none;
    color: var(--text-normal);
    font-size: 13px;
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
