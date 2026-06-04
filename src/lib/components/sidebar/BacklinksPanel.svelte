<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  
  interface Backlink {
    path: string;
    title: string;
    context: string;
  }
  
  // Mock data - will be replaced with actual backlinks from store
  let backlinks: Backlink[] = [];
  
  function openNote(path: string) {
    console.log('Opening note:', path);
    // TODO: Implement note navigation
  }
</script>

<div class="backlinks-panel">
  <div class="panel-header">
    <Icon name="link-2" size={16} />
    <h3>Backlinks</h3>
    <span class="count">{backlinks.length}</span>
  </div>
  
  {#if backlinks.length === 0}
    <div class="empty-state">
      <Icon name="link-2" size={32} />
      <p>No backlinks found</p>
      <span class="hint">Other notes linking to this one will appear here</span>
    </div>
  {:else}
    <div class="backlinks-list">
      {#each backlinks as backlink}
        <button 
          class="backlink-item"
          on:click={() => openNote(backlink.path)}
        >
          <div class="backlink-header">
            <Icon name="file-text" size={14} />
            <span class="backlink-title">{backlink.title}</span>
          </div>
          <div class="backlink-context">{backlink.context}</div>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .backlinks-panel {
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
  
  .count {
    background-color: var(--background-modifier-border);
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 11px;
    color: var(--text-muted);
  }
  
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
  
  .empty-state p {
    font-size: 14px;
    font-weight: 500;
    margin: 0;
  }
  
  .hint {
    font-size: 12px;
    color: var(--text-faint);
  }
  
  .backlinks-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .backlink-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px;
    background: none;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: left;
  }
  
  .backlink-item:hover {
    background-color: var(--interactive-hover);
    border-color: var(--interactive-accent);
  }
  
  .backlink-header {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  .backlink-title {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-normal);
  }
  
  .backlink-context {
    font-size: 12px;
    color: var(--text-muted);
    line-height: 1.4;
    padding-left: 20px;
  }
</style>
