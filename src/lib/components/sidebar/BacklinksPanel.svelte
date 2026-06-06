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

<div class="inspector-panel">
  <div class="inspector-panel-header">
    <h3 class="inspector-panel-title">
      <Icon name="link-2" size={14} />
      Backlinks
    </h3>
    <span class="inspector-count">{backlinks.length}</span>
  </div>

  <div class="inspector-content">
  
  {#if backlinks.length === 0}
    <div class="inspector-empty">
      <Icon name="link-2" size={28} />
      <p class="inspector-empty-title">No backlinks found</p>
      <p class="inspector-empty-description">Other notes linking to this one will appear here</p>
    </div>
  {:else}
    <div class="inspector-list">
      {#each backlinks as backlink}
        <button 
          class="inspector-list-item"
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
</div>

<style>
  .backlink-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }

  .backlink-title {
    font-size: var(--font-ui-small);
    font-weight: 500;
    color: var(--text-normal);
  }

  .backlink-context {
    font-size: var(--font-smallest);
    color: var(--text-muted);
    line-height: 1.4;
    padding-left: 22px;
  }
</style>
