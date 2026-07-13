<script lang="ts">
  import BIcon from '@/ui/b-icon.svelte';
  import { getRecentFiles } from '@/hubs/core/stores/vault-store.svelte';
  import { fileName, openNote } from '@/ui/panel-actions';
  import Panel from '@/ui/panel.svelte';

  let recentFiles = $derived(getRecentFiles());

  function handleOpen(path: string) {
    openNote(path);
  }
</script>

<Panel title="Recent">
  {#snippet badge()}<span class="panel-badge">{recentFiles.length}</span>{/snippet}
  {#if recentFiles.length === 0}
    <div class="panel-empty">
      <p>No recent files</p>
      <p class="panel-empty-hint">Files you open will appear here</p>
    </div>
  {:else}
    <ul class="recent-list">
      {#each recentFiles as path (path)}
        <li>
          <button class="recent-item" onclick={() => handleOpen(path)} title={path}>
            <BIcon name="document" size={14} class="recent-icon" />
            <span class="recent-name">{fileName(path, true)}</span>
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</Panel>

<style>
  .recent-list {
    list-style: none;
    padding: 4px;
    margin: 0;
  }
  .recent-item {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 4px 8px;
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: var(--radius-s);
    font-size: 0.75rem;
    color: var(--color-text);
    text-align: left;
    font-family: inherit;
    outline: none;
  }
  .recent-item:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
  .recent-item:hover {
    background: var(--color-surface-hover);
  }
  .recent-item :global(.recent-icon) {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    color: var(--color-text-muted);
  }
  .recent-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
