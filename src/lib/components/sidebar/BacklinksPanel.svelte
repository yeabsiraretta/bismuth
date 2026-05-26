<script lang="ts">
  import { invoke } from '@tauri-apps/api/core';
  import { listen } from '@tauri-apps/api/event';
  import { onMount, onDestroy } from 'svelte';
  import Icon from '@/components/icons/Icon.svelte';
  import type { Link } from '@/types/vault';

  export let activeNotePath: string | null = null;

  let backlinks: Link[] = [];
  let loading = false;
  let error: string | null = null;
  let unsubscribe: (() => void) | null = null;

  async function loadBacklinks() {
    if (!activeNotePath) {
      backlinks = [];
      return;
    }

    loading = true;
    error = null;

    try {
      backlinks = await invoke<Link[]>('get_backlinks', { path: activeNotePath });
    } catch (e) {
      error = e as string;
      console.error('Failed to load backlinks:', e);
      backlinks = [];
    } finally {
      loading = false;
    }
  }

  function handleBacklinkClick(link: Link) {
    window.dispatchEvent(new CustomEvent('open-note', { detail: { path: link.source_path } }));
  }

  onMount(async () => {
    await loadBacklinks();

    unsubscribe = await listen('vault://file-modified', () => {
      loadBacklinks();
    });
  });

  onDestroy(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });

  $: if (activeNotePath) {
    loadBacklinks();
  }
</script>

<div class="backlinks-panel">
  <div class="panel-header">
    <Icon name="link" size={16} />
    <span>Backlinks</span>
    {#if backlinks.length > 0}
      <span class="count">{backlinks.length}</span>
    {/if}
  </div>

  <div class="panel-body">
    {#if loading}
      <div class="loading">
        <Icon name="loader" size={16} />
        <span>Loading backlinks...</span>
      </div>
    {:else if error}
      <div class="error">
        <Icon name="alert-circle" size={16} />
        <span>{error}</span>
      </div>
    {:else if !activeNotePath}
      <div class="empty">
        <Icon name="file-text" size={24} />
        <p>No note selected</p>
      </div>
    {:else if backlinks.length === 0}
      <div class="empty">
        <Icon name="link-2-off" size={24} />
        <p>No backlinks found</p>
        <span class="hint">Notes linking to this page will appear here</span>
      </div>
    {:else}
      <div class="backlinks-list">
        {#each backlinks as link}
          <button class="backlink-item" on:click={() => handleBacklinkClick(link)}>
            <div class="backlink-header">
              <Icon name="file-text" size={14} />
              <span class="backlink-title">{link.source_path}</span>
            </div>
            {#if link.alias}
              <div class="backlink-alias">
                <Icon name="tag" size={12} />
                <span>Alias: {link.alias}</span>
              </div>
            {/if}
          </button>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .backlinks-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: var(--color-bg-secondary);
  }

  .panel-header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--color-border);
    font-weight: 500;
    font-size: 0.875rem;
  }

  .count {
    margin-left: auto;
    padding: 0.125rem 0.5rem;
    background-color: var(--color-primary);
    color: white;
    border-radius: 1rem;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .panel-body {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-3);
  }

  .loading,
  .error,
  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    padding: var(--space-6);
    text-align: center;
    color: var(--color-text-muted);
  }

  .error {
    color: var(--color-error);
  }

  .hint {
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }

  .backlinks-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .backlink-item {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    padding: var(--space-3);
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 0.375rem;
    text-align: left;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .backlink-item:hover {
    background-color: var(--color-surface-hover);
    border-color: var(--color-primary);
  }

  .backlink-header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .backlink-title {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text);
  }

  .backlink-alias {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    font-size: 0.75rem;
    color: var(--color-text-muted);
    padding-left: 1.75rem;
  }

  .animate-spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>
