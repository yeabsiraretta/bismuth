<script lang="ts">
  import './+page.css';
  import { goto } from '$app/navigation';
  import { pageTitle, SITE_URL } from '@/constants/seo';
  import { importNotes, type ImportResult } from '@/sal/import-service';
  import { rescanVault } from '@/hubs/core/stores/vault-store.svelte';
  import { MetaTags } from 'svelte-meta-tags';
  import type { Snapshot } from './$types';

  let { data } = $props();

  type ImportSource = 'obsidian' | 'notion' | 'roam' | 'markdown' | 'evernote' | 'logseq';

  interface SourceDef {
    id: ImportSource;
    label: string;
    description: string;
    formats: string;
  }

  const SOURCES: SourceDef[] = [
    {
      id: 'obsidian',
      label: 'Obsidian',
      description: 'Import from an Obsidian vault with wikilinks and metadata',
      formats: '.md',
    },
    {
      id: 'notion',
      label: 'Notion',
      description: 'Import from a Notion export (HTML or Markdown)',
      formats: '.md, .html, .csv',
    },
    {
      id: 'roam',
      label: 'Roam Research',
      description: 'Import from Roam JSON export',
      formats: '.json',
    },
    {
      id: 'markdown',
      label: 'Markdown Files',
      description: 'Import a folder of plain Markdown files',
      formats: '.md, .txt',
    },
    {
      id: 'evernote',
      label: 'Evernote',
      description: 'Import from Evernote ENEX export',
      formats: '.enex',
    },
    {
      id: 'logseq',
      label: 'Logseq',
      description: 'Import from a Logseq graph directory',
      formats: '.md, .org',
    },
  ];

  let selectedSource: ImportSource | null = $state(null);
  let importPath = $state('');
  let isImporting = $state(false);
  let importResult = $state<ImportResult | null>(null);

  export const snapshot: Snapshot<{ selectedSource: ImportSource | null; importPath: string }> = {
    capture: () => ({ selectedSource, importPath }),
    restore: (snap) => {
      selectedSource = snap.selectedSource;
      importPath = snap.importPath;
    },
  };

  async function selectFolder() {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Import Source',
      });
      if (selected) {
        importPath = Array.isArray(selected) ? selected[0] : selected;
      }
    } catch {
      importPath = '/example/import/path';
    }
  }

  async function startImport() {
    if (!selectedSource || !importPath) return;
    isImporting = true;
    try {
      importResult = await importNotes(selectedSource, importPath);
      await rescanVault();
    } catch (e) {
      importResult = { success: 0, failed: 1, errors: [String(e)] };
    } finally {
      isImporting = false;
    }
  }

  function reset() {
    selectedSource = null;
    importPath = '';
    importResult = null;
  }
</script>

<MetaTags
  title={pageTitle(data.title ?? 'Import')}
  description={data.description ?? 'Import notes from other applications into Bismuth.'}
  canonical="{SITE_URL}/import"
  openGraph={{
    url: `${SITE_URL}/import`,
    title: pageTitle(data.title ?? 'Import'),
    description: data.description ?? '',
  }}
/>

<div class="import-page">
  <header class="import-header">
    <h1 class="page-title">Import</h1>
    <p class="page-subtitle">Bring your notes from other apps into Bismuth</p>
  </header>

  {#if importResult}
    <div class="result-card">
      <h2 class="result-title">Import Complete</h2>
      <div class="result-stats">
        <span class="stat success">{importResult.success} imported</span>
        {#if importResult.failed > 0}
          <span class="stat failed">{importResult.failed} failed</span>
        {/if}
      </div>
      {#if importResult.errors && importResult.errors.length > 0}
        <details class="error-details">
          <summary class="error-summary">{importResult.errors.length} error(s)</summary>
          <ul class="error-list">
            {#each importResult.errors as err, i (i)}
              <li class="error-item">{err}</li>
            {/each}
          </ul>
        </details>
      {/if}
      <div class="result-actions">
        <button class="action-btn" onclick={() => goto('/')}>Go to Vault</button>
        <button class="action-btn secondary" onclick={reset}>Import More</button>
      </div>
    </div>
  {:else if selectedSource}
    <div class="import-config">
      <button
        class="back-btn"
        onclick={() => (selectedSource = null)}
        aria-label="Back to source selection">← Back</button
      >
      <h2 class="config-title">
        Import from {SOURCES.find((s) => s.id === selectedSource)?.label}
      </h2>

      <div class="path-row">
        <input
          type="text"
          class="path-input"
          placeholder="Select source folder…"
          aria-label="Import source folder path"
          bind:value={importPath}
          readonly
        />
        <button class="browse-btn" onclick={selectFolder}>Browse</button>
      </div>

      <button class="import-btn" onclick={startImport} disabled={!importPath || isImporting}>
        {isImporting ? 'Importing…' : 'Start Import'}
      </button>
    </div>
  {:else}
    <div class="source-grid">
      {#each SOURCES as source (source.id)}
        <button class="source-card" onclick={() => (selectedSource = source.id)}>
          <h2 class="source-name">{source.label}</h2>
          <p class="source-desc">{source.description}</p>
          <span class="source-formats">{source.formats}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>
