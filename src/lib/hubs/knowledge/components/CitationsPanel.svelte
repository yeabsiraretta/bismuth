<script lang="ts">
  import { getNotes } from '@/hubs/core/stores/vault-store.svelte';
  import ContextMenu from '@/ui/context-menu.svelte';
  import { openNote } from '@/ui/panel-actions';
  import Panel from '@/ui/panel.svelte';
  import { getCachedContent } from '@/hubs/editor/services/file-ops';

  interface Citation {
    key: string;
    title: string;
    authors: string;
    year: string;
    source: string;
    notePath: string;
  }

  let filter = $state('');
  let citations = $state<Citation[]>([]);

  const CITE_REGEX = /\[@([^\]]+)\]/g;
  const BIBLIO_REGEX = /^-\s+\*\*(\w+)\*\*:\s*(.+)/gm;

  $effect(() => {
    const notes = getNotes();
    const found: Citation[] = [];

    for (const note of notes) {
      const content = getCachedContent(note.path) ?? '';
      const matches = content.matchAll(CITE_REGEX);
      for (const m of matches) {
        const key = m[1].trim();
        if (!found.some((c) => c.key === key)) {
          found.push({
            key,
            title: key,
            authors: '',
            year: '',
            source: note.title,
            notePath: note.path,
          });
        }
      }

      const bibMatches = content.matchAll(BIBLIO_REGEX);
      for (const bm of bibMatches) {
        const key = bm[1];
        const existing = found.find((c) => c.key === key);
        if (existing) {
          existing.title = bm[2].split('.')[0] ?? key;
        }
      }
    }

    citations = found;
  });

  let filtered = $derived(
    filter
      ? citations.filter(
          (c) =>
            c.key.toLowerCase().includes(filter.toLowerCase()) ||
            c.title.toLowerCase().includes(filter.toLowerCase())
        )
      : citations
  );

  function openCitation(notePath: string) {
    openNote(notePath);
  }

  let ctxCite: Citation | null = $state(null);
  let ctxX = $state(0);
  let ctxY = $state(0);

  function handleContext(e: MouseEvent, cite: Citation) {
    e.preventDefault();
    ctxCite = cite;
    ctxX = e.clientX;
    ctxY = e.clientY;
  }

  function closeCtx() {
    ctxCite = null;
  }
</script>

<Panel title="Citations">
  {#snippet badge()}<span class="panel-badge">{citations.length}</span>{/snippet}
  <div class="citations-panel">
    <div class="search-row">
      <input type="text" class="filter-input" placeholder="Filter citations…" bind:value={filter} />
    </div>

    {#if filtered.length === 0}
      <div class="panel-empty">
        No citations found
        <div class="panel-empty-hint">Use [@key] syntax in your notes</div>
      </div>
    {:else}
      <ul class="citation-list">
        {#each filtered as cite (cite.key)}
          <li class="citation-item">
            <button
              class="citation-btn"
              onclick={() => openCitation(cite.notePath)}
              oncontextmenu={(e) => handleContext(e, cite)}
            >
              <span class="cite-key">@{cite.key}</span>
              {#if cite.title !== cite.key}
                <span class="cite-title">{cite.title}</span>
              {/if}
              <span class="cite-source">{cite.source}</span>
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</Panel>

<ContextMenu x={ctxX} y={ctxY} show={!!ctxCite} onclose={closeCtx}>
  <button
    class="ctx-item"
    onclick={() => {
      if (ctxCite) openCitation(ctxCite.notePath);
      closeCtx();
    }}
    role="menuitem">Open Source</button
  >
  <button
    class="ctx-item"
    onclick={() => {
      if (ctxCite) navigator.clipboard.writeText(`[@${ctxCite.key}]`);
      closeCtx();
    }}
    role="menuitem">Copy Citation</button
  >
  <button
    class="ctx-item"
    onclick={() => {
      if (ctxCite) navigator.clipboard.writeText(ctxCite.notePath);
      closeCtx();
    }}
    role="menuitem">Copy Path</button
  >
</ContextMenu>

<style>
  .citations-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .search-row {
    padding: 8px;
    border-bottom: 1px solid var(--color-border);
  }
  .filter-input {
    width: 100%;
    padding: 4px 8px;
    font-size: 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-background);
    color: var(--color-text);
  }
  .citation-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .citation-item {
    border-bottom: 1px solid var(--color-border);
  }
  .citation-btn {
    display: flex;
    flex-direction: column;
    gap: 2px;
    width: 100%;
    padding: 8px 12px;
    border: none;
    background: transparent;
    cursor: pointer;
    text-align: left;
    min-width: 0;
  }
  .citation-btn:hover {
    background: var(--color-surface-hover);
  }
  .cite-key {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-accent);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .cite-title {
    font-size: 0.7rem;
    color: var(--color-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .cite-source {
    font-size: 0.65rem;
    color: var(--color-text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
