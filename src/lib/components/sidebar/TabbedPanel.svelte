<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import BacklinksPanel from './BacklinksPanel.svelte';
  import EntityPanel from './EntityPanel.svelte';
  import ConnectionsView from './ConnectionsView.svelte';
  import GitPanel from './GitPanel.svelte';

  type PanelTab = 'backlinks' | 'entity' | 'connections' | 'git';
  let activeTab: PanelTab = 'backlinks';
</script>

<div class="tabbed-panel">
  <div class="panel-tabs">
    <button 
      class="panel-tab" 
      class:active={activeTab === 'backlinks'}
      on:click={() => activeTab = 'backlinks'}
      title="Backlinks"
      aria-label="Backlinks"
    >
      <Icon name="link-2" size={16} />
    </button>
    <button 
      class="panel-tab" 
      class:active={activeTab === 'entity'}
      on:click={() => activeTab = 'entity'}
      title="Entity Info"
      aria-label="Entity Info"
    >
      <Icon name="box" size={16} />
    </button>
    <button 
      class="panel-tab" 
      class:active={activeTab === 'connections'}
      on:click={() => activeTab = 'connections'}
      title="Semantic Connections"
      aria-label="Semantic Connections"
    >
      <Icon name="share-2" size={16} />
    </button>
    <button 
      class="panel-tab" 
      class:active={activeTab === 'git'}
      on:click={() => activeTab = 'git'}
      title="Git Changes"
      aria-label="Git Changes"
    >
      <Icon name="git-branch" size={16} />
    </button>
  </div>
  
  <div class="panel-content">
    {#if activeTab === 'backlinks'}
      <BacklinksPanel />
    {:else if activeTab === 'entity'}
      <EntityPanel />
    {:else if activeTab === 'connections'}
      <ConnectionsView />
    {:else if activeTab === 'git'}
      <GitPanel />
    {/if}
  </div>
</div>

<style>
  .tabbed-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  
  .panel-tabs {
    display: flex;
    border-bottom: 1px solid var(--border-color);
    background-color: var(--background-secondary);
  }
  
  .panel-tab {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.15s ease;
    border-bottom: 2px solid transparent;
  }
  
  .panel-tab:hover {
    background-color: var(--interactive-hover);
    color: var(--text-normal);
  }
  
  .panel-tab.active {
    color: var(--interactive-accent);
    border-bottom-color: var(--interactive-accent);
  }
  
  .panel-content {
    flex: 1;
    overflow-y: auto;
  }
</style>
