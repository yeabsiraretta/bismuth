<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import PanelHeader from '@/components/ui/layout/PanelHeader.svelte';
  import ActionButton from '@/components/ui/actions/ActionButton.svelte';
  import EmptyState from '@/components/ui/feedback/EmptyState.svelte';
  import { recentFiles, type RecentFileEntry } from '@/stores/vault/recentFiles';

  export let onOpenNote: ((path: string) => void) | undefined = undefined;

  function getFileIcon(path: string): string {
    if (path.endsWith('.canvas')) return 'layout';
    if (path.endsWith('.pdf')) return 'file-text';
    return 'file';
  }

  function getRelativeTime(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  }

  function handleClick(entry: RecentFileEntry): void {
    onOpenNote?.(entry.path);
  }

  function handleRemove(e: Event, path: string): void {
    e.stopPropagation();
    recentFiles.removeRecent(path);
  }

  function handleClear(): void {
    recentFiles.clearRecent();
  }

  function handleContextMenu(e: MouseEvent, entry: RecentFileEntry): void {
    e.preventDefault();
    // Context menu could be extended later
    handleRemove(e, entry.path);
  }
</script>

<div class="recent-panel" role="tabpanel" aria-label="Recent Files">
  <PanelHeader count={$recentFiles.length || undefined}>
    <svelte:fragment slot="actions">
      {#if $recentFiles.length > 0}
        <ActionButton icon="trash-2" title="Clear all" on:click={handleClear} />
      {/if}
    </svelte:fragment>
  </PanelHeader>

  {#if $recentFiles.length === 0}
    <EmptyState
      icon="clock"
      title="No recent files"
      description="Files you open will appear here"
    />
  {:else}
    <ul class="recent-list" role="list">
      {#each $recentFiles as entry (entry.path)}
        <li class="recent-item">
          <button
            class="recent-button"
            on:click={() => handleClick(entry)}
            on:contextmenu={(e) => handleContextMenu(e, entry)}
            title={entry.path}
          >
            <Icon name={getFileIcon(entry.path)} size={14} />
            <span class="recent-title">{entry.title}</span>
            <span class="recent-time">{getRelativeTime(entry.timestamp)}</span>
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .recent-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .recent-list {
    list-style: none;
    margin: 0;
    padding: 0;
    overflow-y: auto;
    flex: 1;
  }

  .recent-item {
    margin: 0;
  }

  .recent-button {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    width: 100%;
    min-height: 22px;
    padding: 0 var(--sidebar-item-padding-x);
    border: none;
    background: none;
    cursor: pointer;
    text-align: left;
    font-family: var(--font-interface);
    font-size: var(--sidebar-item-font);
    color: var(--text-normal);
    transition: background-color 0.1s ease;
  }

  .recent-button:hover {
    background-color: var(--background-modifier-hover);
  }

  .recent-title {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .recent-time {
    font-size: var(--sidebar-item-font-secondary);
    color: var(--text-muted);
    flex-shrink: 0;
  }
</style>
