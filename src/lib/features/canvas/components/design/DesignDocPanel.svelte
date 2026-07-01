<script lang="ts">
  import { onMount } from 'svelte';
  import Icon from '@/components/icons/Icon.svelte';
  import type { DesignDocumentMeta, DocumentType } from '@/types/design-documents';
  import type { DesignDocDiff } from '@/services/design-docs';
  import { listDocuments, listVersions, computeDocumentDiff, getVersion } from '@/services/design-docs';
  import type { VersionEntry } from '@/services/design-docs';
  import DocumentDiffView from '@/features/canvas/components/design/DocumentDiffView.svelte';

  let documents: DesignDocumentMeta[] = [];
  let loading = true;
  let loadError = '';
  let filterType: DocumentType | undefined = undefined;
  let expandedDocId: string | null = null;
  let versions: VersionEntry[] = [];
  let selectedVersion: number | null = null;
  let diff: DesignDocDiff | null = null;

  const TYPE_META: Record<DocumentType, { icon: string; label: string; color: string }> = {
    token:     { icon: 'droplet',    label: 'Tokens',     color: 'var(--color-info, #2563eb)' },
    component: { icon: 'box',        label: 'Components', color: 'var(--interactive-accent)' },
    layout:    { icon: 'layout',     label: 'Layouts',    color: 'var(--color-success, #16a34a)' },
    flow:      { icon: 'git-branch', label: 'Flows',      color: 'var(--color-warning, #d97706)' },
    theme:     { icon: 'palette',    label: 'Themes',     color: 'var(--text-muted)' },
    page:      { icon: 'file-text',  label: 'Pages',      color: 'var(--text-normal)' },
  };

  const TYPE_ORDER: DocumentType[] = ['token', 'component', 'layout', 'flow', 'theme', 'page'];

  onMount(async () => { await refresh(); });

  async function refresh() {
    loading = true; loadError = '';
    try {
      documents = await listDocuments(filterType);
    } catch {
      loadError = 'Failed to load documents';
    } finally {
      loading = false;
    }
  }

  function setFilter(type: DocumentType | undefined) {
    filterType = type; expandedDocId = null; diff = null;
    refresh();
  }

  async function toggleExpand(doc: DesignDocumentMeta) {
    if (expandedDocId === doc.document_id) {
      expandedDocId = null; versions = []; diff = null; return;
    }
    expandedDocId = doc.document_id; selectedVersion = null; diff = null;
    versions = await listVersions(doc.document_type, doc.document_id);
  }

  async function selectVersion(doc: DesignDocumentMeta, version: number) {
    selectedVersion = version;
    if (version < doc.version) {
      const oldPayload = await getVersion(doc.document_type, doc.document_id, version);
      const newPayload = await getVersion(doc.document_type, doc.document_id, doc.version);
      if (oldPayload && newPayload) diff = computeDocumentDiff(oldPayload, newPayload, version, doc.version);
    } else { diff = null; }
  }

  $: counts = TYPE_ORDER.reduce((acc, t) => {
    acc[t] = documents.filter((d) => d.document_type === t).length;
    return acc;
  }, {} as Record<DocumentType, number>);

  $: totalCount = documents.length;

  $: groupedDocTypes = TYPE_ORDER
    .map((type) => ({ type, meta: TYPE_META[type], docs: documents.filter((d) => d.document_type === type) }))
    .filter((g) => g.docs.length > 0);
</script>

<div class="ddp">
  <div class="ddp-head">
    <div class="ddp-title-row">
      <Icon name="file-text" size={13} />
      <span class="ddp-title">Design Docs</span>
      {#if totalCount > 0}<span class="ddp-total">{totalCount}</span>{/if}
      <button class="ddp-refresh" on:click={refresh} title="Refresh" aria-label="Refresh documents">
        <Icon name="refresh-cw" size={13} />
      </button>
    </div>
    {#if !loading && totalCount > 0}
      <div class="ddp-summary">
        {#each TYPE_ORDER as t}
          {#if counts[t] > 0}
            <button
              class="summary-chip"
              class:active={filterType === t}
              on:click={() => setFilter(filterType === t ? undefined : t)}
              title="Filter: {TYPE_META[t].label}"
              style="--chip-color: {TYPE_META[t].color}"
            >
              <Icon name={TYPE_META[t].icon} size={11} />
              <span>{counts[t]}</span>
            </button>
          {/if}
        {/each}
      </div>
    {/if}
  </div>

  {#if filterType}
    <div class="ddp-filter-active">
      <Icon name={TYPE_META[filterType].icon} size={12} />
      <span>{TYPE_META[filterType].label}</span>
      <button class="filter-clear" on:click={() => setFilter(undefined)} aria-label="Clear filter">
        <Icon name="x" size={11} />
      </button>
    </div>
  {/if}

  <div class="ddp-body">
    {#if loading}
      <div class="ddp-state"><Icon name="loader" size={18} /><span>Loading…</span></div>
    {:else if loadError}
      <div class="ddp-state ddp-error">
        <Icon name="alert-circle" size={18} />
        <span>{loadError}</span>
        <button class="retry-btn" on:click={refresh}>Retry</button>
      </div>
    {:else if documents.length === 0}
      <div class="ddp-state ddp-empty">
        <Icon name="file-text" size={28} />
        <p>No design documents yet.</p>
        <p class="ddp-hint">Save a canvas to generate documents, or sync using the controls above.</p>
      </div>
    {:else}
      {#each groupedDocTypes as group (group.type)}
        <div class="ddp-group">
          <div class="ddp-group-header" style="--grp-color: {group.meta.color}">
            <Icon name={group.meta.icon} size={13} />
            <span class="grp-label">{group.meta.label}</span>
            <span class="grp-count">{group.docs.length}</span>
          </div>
          <ul class="ddp-list">
            {#each group.docs as doc (doc.document_id)}
              <li class="ddp-item" class:expanded={expandedDocId === doc.document_id}>
                <button class="ddp-row" on:click={() => toggleExpand(doc)}>
                  <span class="doc-name" title={doc.name}>{doc.name}</span>
                  <span class="doc-ver">v{doc.version}</span>
                  <Icon name={expandedDocId === doc.document_id ? 'chevron-down' : 'chevron-right'} size={12} />
                </button>
                {#if expandedDocId === doc.document_id}
                  <div class="ddp-detail">
                    <div class="detail-meta">
                      <span class="meta-item"><Icon name="clock" size={11} />{new Date(doc.modified_at * 1000).toLocaleDateString()}</span>
                      <span class="meta-item"><Icon name="git-commit" size={11} />v{doc.version}</span>
                    </div>
                    {#if versions.length > 0}
                      <div class="version-row">
                        <label class="version-lbl" for="ver-{doc.document_id}">Compare with:</label>
                        <select id="ver-{doc.document_id}" class="version-sel"
                          on:change={(e) => selectVersion(doc, Number(e.currentTarget.value))}>
                          <option value="" disabled selected>Select version…</option>
                          {#each versions as v}
                            <option value={v.version} selected={selectedVersion === v.version}>
                              v{v.version} — {new Date(v.timestamp).toLocaleDateString()}
                            </option>
                          {/each}
                        </select>
                      </div>
                      {#if diff}<DocumentDiffView {diff} />{/if}
                    {:else}
                      <p class="no-history">No version history</p>
                    {/if}
                  </div>
                {/if}
              </li>
            {/each}
          </ul>
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
  .ddp { display: flex; flex-direction: column; flex: 1; overflow: hidden; font-size: 12px; }

  .ddp-head { padding: var(--spacing-s) var(--spacing-m); border-bottom: 1px solid var(--border-color); background: var(--background-secondary); flex-shrink: 0; }
  .ddp-title-row { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
  .ddp-title { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); flex: 1; }
  .ddp-total { font-size: 10px; color: var(--text-faint); background: var(--background-primary); padding: 1px 6px; border-radius: 8px; }
  .ddp-refresh { background: none; border: none; cursor: pointer; color: var(--text-faint); padding: 2px; border-radius: 3px; display: flex; align-items: center; }
  .ddp-refresh:hover { color: var(--text-normal); background: var(--background-modifier-hover); }

  .ddp-summary { display: flex; gap: 4px; flex-wrap: wrap; }
  .summary-chip { display: flex; align-items: center; gap: 3px; padding: 2px 7px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--background-primary); color: var(--text-muted); cursor: pointer; font-size: 10px; transition: all 0.12s; }
  .summary-chip:hover { border-color: var(--chip-color); color: var(--chip-color); }
  .summary-chip.active { background: var(--chip-color); color: #fff; border-color: var(--chip-color); }

  .ddp-filter-active { display: flex; align-items: center; gap: 5px; padding: 4px var(--spacing-m); background: var(--background-modifier-hover); border-bottom: 1px solid var(--border-color); font-size: 11px; color: var(--interactive-accent); flex-shrink: 0; }
  .ddp-filter-active span { flex: 1; font-weight: 500; }
  .filter-clear { background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 2px; border-radius: 3px; }
  .filter-clear:hover { color: var(--text-normal); }

  .ddp-body { flex: 1; overflow-y: auto; }

  .ddp-state { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 32px 16px; color: var(--text-muted); text-align: center; }
  .ddp-error { color: var(--color-danger, #dc2626); }
  .ddp-hint { font-size: 10px; color: var(--text-faint); max-width: 200px; line-height: 1.4; margin: 0; }
  .retry-btn { margin-top: 4px; padding: 4px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-s); background: none; cursor: pointer; font-size: 11px; color: var(--text-muted); }
  .retry-btn:hover { background: var(--background-modifier-hover); }

  .ddp-group { border-bottom: 1px solid var(--border-color); }
  .ddp-group-header { display: flex; align-items: center; gap: 6px; padding: 5px var(--spacing-m); background: var(--background-secondary); color: var(--grp-color); }
  .grp-label { flex: 1; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
  .grp-count { font-size: 10px; color: var(--text-faint); background: var(--background-primary); padding: 1px 5px; border-radius: 7px; }

  .ddp-list { list-style: none; margin: 0; padding: 0; }
  .ddp-item { display: flex; flex-direction: column; border-bottom: 1px solid var(--border-color); }
  .ddp-item.expanded { background: var(--background-secondary); }
  .ddp-row { display: flex; align-items: center; gap: 6px; padding: 7px var(--spacing-m); background: none; border: none; width: 100%; text-align: left; cursor: pointer; color: var(--text-normal); }
  .ddp-row:hover { background: var(--background-modifier-hover); }
  .doc-name { flex: 1; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .doc-ver { font-size: 10px; color: var(--text-faint); flex-shrink: 0; }

  .ddp-detail { padding: 8px var(--spacing-m) 10px; border-top: 1px solid var(--border-color); }
  .detail-meta { display: flex; gap: 12px; margin-bottom: 8px; }
  .meta-item { display: flex; align-items: center; gap: 3px; font-size: 10px; color: var(--text-faint); }
  .version-row { display: flex; flex-direction: column; gap: 4px; margin-bottom: 6px; }
  .version-lbl { font-size: 10px; color: var(--text-muted); }
  .version-sel { width: 100%; font-size: 11px; padding: 4px 6px; border: 1px solid var(--border-color); border-radius: var(--radius-s); background: var(--background-primary); color: var(--text-normal); }
  .no-history { font-size: 10px; color: var(--text-faint); margin: 4px 0 0 0; }
</style>

