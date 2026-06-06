<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import BacklinksPanel from './BacklinksPanel.svelte';
  import EntityPanel from './EntityPanel.svelte';
  import ConnectionsView from './ConnectionsView.svelte';
  import GitPanel from './GitPanel.svelte';

  type PanelTab = 'backlinks' | 'entity' | 'connections' | 'git';
  let activeTab: PanelTab = 'backlinks';

  const tabOrder: PanelTab[] = ['backlinks', 'entity', 'connections', 'git'];

  function handleTabKeydown(e: KeyboardEvent) {
    const idx = tabOrder.indexOf(activeTab);
    let nextIdx = idx;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIdx = (idx + 1) % tabOrder.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIdx = (idx - 1 + tabOrder.length) % tabOrder.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIdx = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIdx = tabOrder.length - 1;
    } else {
      return;
    }

    activeTab = tabOrder[nextIdx];
    const buttons = (e.currentTarget as HTMLElement)?.closest('.inspector-tabs')?.querySelectorAll('.inspector-tab');
    if (buttons?.[nextIdx]) (buttons[nextIdx] as HTMLElement).focus();
  }
</script>

<div class="inspector-panel">
  <div class="inspector-tabs">
    <button 
      class="inspector-tab" 
      class:active={activeTab === 'backlinks'}
      on:click={() => activeTab = 'backlinks'}
      on:keydown={handleTabKeydown}
      title="Backlinks"
      aria-label="Backlinks"
      aria-selected={activeTab === 'backlinks'}
      role="tab"
      tabindex={activeTab === 'backlinks' ? 0 : -1}
    >
      <Icon name="link-2" size={16} />
      <span class="tab-label">Backlinks</span>
    </button>
    <button 
      class="inspector-tab" 
      class:active={activeTab === 'entity'}
      on:click={() => activeTab = 'entity'}
      on:keydown={handleTabKeydown}
      title="Entity Info"
      aria-label="Entity Info"
      aria-selected={activeTab === 'entity'}
      role="tab"
      tabindex={activeTab === 'entity' ? 0 : -1}
    >
      <Icon name="box" size={16} />
      <span class="tab-label">Entity</span>
    </button>
    <button 
      class="inspector-tab" 
      class:active={activeTab === 'connections'}
      on:click={() => activeTab = 'connections'}
      on:keydown={handleTabKeydown}
      title="Semantic Connections"
      aria-label="Semantic Connections"
      aria-selected={activeTab === 'connections'}
      role="tab"
      tabindex={activeTab === 'connections' ? 0 : -1}
    >
      <Icon name="share-2" size={16} />
      <span class="tab-label">Links</span>
    </button>
    <button 
      class="inspector-tab" 
      class:active={activeTab === 'git'}
      on:click={() => activeTab = 'git'}
      on:keydown={handleTabKeydown}
      title="Git Changes"
      aria-label="Git Changes"
      aria-selected={activeTab === 'git'}
      role="tab"
      tabindex={activeTab === 'git' ? 0 : -1}
    >
      <Icon name="git-branch" size={16} />
      <span class="tab-label">Git</span>
    </button>
  </div>
  
  <div class="inspector-content" role="tabpanel">
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
  .tab-label {
    font-size: var(--font-smallest);
    margin-left: 4px;
  }

  @media (max-width: 300px) {
    .tab-label {
      display: none;
    }
  }
</style>
