<script lang="ts">
  import BIcon from '@/ui/b-icon.svelte';
  import Panel from '@/ui/panel.svelte';
  import ContextMenu from '@/ui/context-menu.svelte';
  import { getActiveNotePath } from '@/hubs/core/stores/vault-store.svelte';
  import { openNote } from '@/ui/panel-actions';
  import {
    findConnections,
    lookupConnections,
    getRandomConnection,
    type SmartConnection,
  } from '@/hubs/knowledge/services/smart-connections';

  let notePath = $derived(getActiveNotePath() ?? '');
  let searchMode = $state(false);
  let searchQuery = $state('');
  let connections = $state<SmartConnection[]>([]);
  let loading = $state(false);

  $effect(() => {
    let cancelled = false;
    loading = true;

    const run = async () => {
      let result: SmartConnection[] = [];
      if (searchMode && searchQuery.trim().length >= 2) {
        result = await lookupConnections(searchQuery.trim(), 20);
      } else if (notePath) {
        result = await findConnections(notePath, 20);
      }
      if (!cancelled) {
        connections = result;
        loading = false;
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  });

  function handleOpen(conn: SmartConnection) {
    openNote(conn.path);
  }

  function handleRandom() {
    const conn = getRandomConnection();
    if (conn) handleOpen(conn);
  }

  function toggleSearch() {
    searchMode = !searchMode;
    if (!searchMode) searchQuery = '';
  }

  function scoreColor(score: number): string {
    if (score >= 0.4) return 'var(--color-success)';
    if (score >= 0.2) return 'var(--color-warning)';
    return 'var(--color-text-muted)';
  }

  function scoreLabel(score: number): string {
    return `${Math.round(score * 100)}%`;
  }

  let ctxConn: SmartConnection | null = $state(null);
  let ctxX = $state(0);
  let ctxY = $state(0);

  function handleContext(e: MouseEvent, conn: SmartConnection) {
    e.preventDefault();
    ctxConn = conn;
    ctxX = e.clientX;
    ctxY = e.clientY;
  }

  function closeCtx() {
    ctxConn = null;
  }
</script>

<Panel title="Connections">
  {#snippet badge()}<span class="panel-badge">{connections.length}</span>{/snippet}
  {#snippet actions()}
    <button
      class="panel-action"
      class:active={searchMode}
      onclick={toggleSearch}
      title="Lookup"
      aria-label="Toggle semantic search"
    >
      <BIcon name="search" size={14} />
    </button>
    <button
      class="panel-action"
      onclick={handleRandom}
      title="Random note"
      aria-label="Open random note"
    >
      <BIcon name="shuffle" size={14} />
    </button>
  {/snippet}

  {#if searchMode}
    <div class="conn-search">
      <input
        type="text"
        class="conn-search-input"
        placeholder="Search by meaning…"
        bind:value={searchQuery}
      />
    </div>
  {/if}

  {#if loading}
    <div class="panel-empty">Finding connections…</div>
  {:else if !notePath && !searchMode}
    <div class="panel-empty">No note selected</div>
  {:else if connections.length === 0}
    <div class="panel-empty">{searchMode ? 'No matches' : 'No connections found'}</div>
  {:else}
    <ul class="conn-list">
      {#each connections as conn (conn.path)}
        <li>
          <button
            class="conn-item"
            onclick={() => handleOpen(conn)}
            oncontextmenu={(e) => handleContext(e, conn)}
            title={conn.path}
          >
            <div class="conn-header">
              <span class="conn-score" style:color={scoreColor(conn.score)}>
                {scoreLabel(conn.score)}
              </span>
              <span class="conn-title">{conn.title}</span>
            </div>
            {#if conn.snippet}
              <div class="conn-snippet">{conn.snippet}</div>
            {/if}
            {#if conn.folder}
              <div class="conn-folder">{conn.folder}</div>
            {/if}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</Panel>

<ContextMenu x={ctxX} y={ctxY} show={!!ctxConn} onclose={closeCtx}>
  <button
    class="ctx-item"
    onclick={() => {
      handleOpen(ctxConn!);
      closeCtx();
    }}
    role="menuitem">Open</button
  >
  <button
    class="ctx-item"
    onclick={() => {
      if (ctxConn) navigator.clipboard.writeText(ctxConn.path);
      closeCtx();
    }}
    role="menuitem">Copy Path</button
  >
  <button
    class="ctx-item"
    onclick={() => {
      if (ctxConn) navigator.clipboard.writeText(`[[${ctxConn.title}]]`);
      closeCtx();
    }}
    role="menuitem">Copy Wikilink</button
  >
</ContextMenu>

<style>
  .conn-search {
    padding: 4px 8px;
  }
  .conn-search-input {
    width: 100%;
    padding: 4px 8px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-surface);
    color: var(--color-text);
    font-size: 0.75rem;
    font-family: inherit;
    outline: none;
  }
  .conn-search-input:focus {
    border-color: var(--color-accent);
  }
  .conn-list {
    list-style: none;
    padding: 4px;
    margin: 0;
  }
  .conn-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
    width: 100%;
    padding: 6px 8px;
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: var(--radius-s);
    color: var(--color-text);
    text-align: left;
    font-family: inherit;
    outline: none;
  }
  .conn-item:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
  .conn-item:hover {
    background: var(--color-surface-hover);
  }
  .conn-header {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .conn-score {
    font-size: 0.65rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
    min-width: 28px;
  }
  .conn-title {
    font-size: 0.75rem;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .conn-snippet {
    font-size: 0.65rem;
    color: var(--color-text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding-left: 34px;
  }
  .conn-folder {
    font-size: 0.6rem;
    color: var(--color-text-faint);
    padding-left: 34px;
  }
  .panel-action.active {
    color: var(--color-accent);
  }
</style>
