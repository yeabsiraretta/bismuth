<script lang="ts">
  import PropertyPanel from './PropertyPanel.svelte';
  import LayerPanel from './LayerPanel.svelte';
  import LayerTreePanel from './LayerTreePanel.svelte';
  import PagesPanel from './PagesPanel.svelte';
  import ComponentsPanel from './ComponentsPanel.svelte';
  import AutoLayoutPanel from './AutoLayoutPanel.svelte';
  import InspectPanel from './InspectPanel.svelte';
  import ComponentBrowser from './ComponentBrowser.svelte';
  import AssetsPanel from './AssetsPanel.svelte';

  type SidebarTab = 'design' | 'inspect' | 'components' | 'assets';
  let activeTab: SidebarTab = 'design';
</script>

<div class="canvas-sidebar">
  <div class="sidebar-tabs">
    <button
      class="sidebar-tab"
      class:active={activeTab === 'design'}
      on:click={() => (activeTab = 'design')}
    >
      Design
    </button>
    <button
      class="sidebar-tab"
      class:active={activeTab === 'inspect'}
      on:click={() => (activeTab = 'inspect')}
    >
      Inspect
    </button>
    <button
      class="sidebar-tab"
      class:active={activeTab === 'components'}
      on:click={() => (activeTab = 'components')}
    >
      Components
    </button>
    <button
      class="sidebar-tab"
      class:active={activeTab === 'assets'}
      on:click={() => (activeTab = 'assets')}
    >
      Assets
    </button>
  </div>

  <div class="sidebar-content">
    {#if activeTab === 'design'}
      <PagesPanel />
      <PropertyPanel />
      <AutoLayoutPanel />
      <LayerTreePanel />
      <LayerPanel />
      <ComponentsPanel />
    {:else if activeTab === 'inspect'}
      <InspectPanel />
    {:else if activeTab === 'components'}
      <ComponentBrowser />
    {:else if activeTab === 'assets'}
      <AssetsPanel />
    {/if}
  </div>
</div>

<style>
  .canvas-sidebar {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    width: 280px;
    height: 100%;
    border-left: 1px solid var(--border-color);
    background: var(--background-primary);
    overflow: hidden;
  }

  .sidebar-tabs {
    display: flex;
    border-bottom: 1px solid var(--border-color);
    background: var(--background-secondary);
    flex-shrink: 0;
  }

  .sidebar-tab {
    flex: 1;
    padding: var(--spacing-s) var(--spacing-m);
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    font-size: var(--font-smaller);
    font-weight: var(--font-medium);
    color: var(--text-muted);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .sidebar-tab:hover {
    color: var(--text-normal);
  }

  .sidebar-tab.active {
    color: var(--interactive-accent);
    border-bottom-color: var(--interactive-accent);
  }

  .sidebar-content {
    flex: 1;
    overflow-y: auto;
  }
</style>
