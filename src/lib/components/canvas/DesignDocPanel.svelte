<script lang="ts">
  import { onMount } from 'svelte';
  import type { DesignDocumentMeta, DocumentType } from '@/types/design-documents';
  import { listDocuments } from '@/services/design-docs';

  let documents: DesignDocumentMeta[] = [];
  let loading = true;
  let filterType: DocumentType | undefined = undefined;

  const typeIcons: Record<DocumentType, string> = {
    token: '🎨',
    component: '🧩',
    layout: '📐',
    flow: '🔀',
    theme: '🌓',
    page: '📄',
  };

  onMount(async () => {
    await refresh();
  });

  async function refresh() {
    loading = true;
    documents = await listDocuments(filterType);
    loading = false;
  }

  function setFilter(type: DocumentType | undefined) {
    filterType = type;
    refresh();
  }
</script>

<div class="design-doc-panel">
  <div class="panel-header">
    <span class="panel-title">Design Documents</span>
    <button class="refresh-btn" on:click={refresh} title="Refresh">↻</button>
  </div>

  <div class="filter-bar">
    <button class="filter-chip" class:active={!filterType} on:click={() => setFilter(undefined)}>All</button>
    <button class="filter-chip" class:active={filterType === 'token'} on:click={() => setFilter('token')}>Tokens</button>
    <button class="filter-chip" class:active={filterType === 'component'} on:click={() => setFilter('component')}>Components</button>
    <button class="filter-chip" class:active={filterType === 'layout'} on:click={() => setFilter('layout')}>Layouts</button>
  </div>

  {#if loading}
    <div class="doc-loading">Loading...</div>
  {:else if documents.length === 0}
    <div class="doc-empty">No design documents yet.</div>
  {:else}
    <ul class="doc-list">
      {#each documents as doc}
        <li class="doc-item">
          <span class="doc-icon">{typeIcons[doc.document_type]}</span>
          <div class="doc-info">
            <span class="doc-name">{doc.name}</span>
            <span class="doc-meta">v{doc.version} · {doc.document_type}</span>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .design-doc-panel { display: flex; flex-direction: column; border-top: 1px solid var(--border-color); max-height: 400px; overflow: hidden; }
  .panel-header { display: flex; align-items: center; justify-content: space-between; padding: var(--spacing-s) var(--spacing-m); background: var(--background-secondary); border-bottom: 1px solid var(--border-color); }
  .panel-title { font-size: var(--font-smaller); font-weight: var(--font-semibold); text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); }
  .refresh-btn { background: none; border: none; cursor: pointer; color: var(--text-muted); font-size: 14px; padding: 2px 4px; border-radius: 3px; }
  .refresh-btn:hover { background: var(--background-hover); color: var(--text-primary); }
  .filter-bar { display: flex; gap: 4px; padding: var(--spacing-xs) var(--spacing-m); overflow-x: auto; }
  .filter-chip { font-size: 11px; padding: 2px 8px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--background-primary); color: var(--text-muted); cursor: pointer; white-space: nowrap; }
  .filter-chip.active { background: var(--color-primary); color: var(--text-on-primary); border-color: var(--color-primary); }
  .doc-loading, .doc-empty { padding: var(--spacing-m); text-align: center; color: var(--text-muted); font-size: 12px; }
  .doc-list { list-style: none; margin: 0; padding: 0; overflow-y: auto; }
  .doc-item { display: flex; align-items: center; gap: var(--spacing-s); padding: var(--spacing-xs) var(--spacing-m); border-bottom: 1px solid var(--border-subtle); cursor: pointer; }
  .doc-item:hover { background: var(--background-hover); }
  .doc-icon { font-size: 14px; }
  .doc-info { display: flex; flex-direction: column; min-width: 0; }
  .doc-name { font-size: 12px; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .doc-meta { font-size: 10px; color: var(--text-muted); }
</style>
