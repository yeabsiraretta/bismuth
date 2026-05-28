<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';

  export let activeTab: string = 'files';
  export let onTabChange: ((detail: { tabId: string }) => void) | undefined = undefined;
  export let position: 'left' | 'right' = 'left';

  interface Tab {
    id: string;
    icon: string;
    label: string;
    tooltip: string;
  }

  const leftTabs: Tab[] = [
    { id: 'files', icon: 'folder', label: 'Files', tooltip: 'File Explorer' },
    { id: 'search', icon: 'search', label: 'Search', tooltip: 'Search in vault' },
    { id: 'inbox', icon: 'inbox', label: 'Inbox', tooltip: 'Capture Dashboard' },
    { id: 'graph', icon: 'share-2', label: 'Graph', tooltip: 'Graph view' },
    { id: 'tags', icon: 'tag', label: 'Tags', tooltip: 'Tag management' },
    { id: 'entities', icon: 'layers', label: 'Entities', tooltip: 'Entity browser' },
  ];

  const rightTabs: Tab[] = [
    { id: 'backlinks', icon: 'link-2', label: 'Backlinks', tooltip: 'Backlinks' },
    { id: 'outline', icon: 'list', label: 'Outline', tooltip: 'Document outline' },
    { id: 'properties', icon: 'sliders', label: 'Properties', tooltip: 'Note properties' },
    { id: 'calendar', icon: 'calendar', label: 'Calendar', tooltip: 'Daily notes calendar' },
  ];

  const bottomTabs: Tab[] = [
    { id: 'settings', icon: 'settings', label: 'Settings', tooltip: 'Settings' },
    { id: 'help', icon: 'help-circle', label: 'Help', tooltip: 'Help & support' },
  ];

  $: tabs = position === 'left' ? leftTabs : rightTabs;

  function selectTab(tabId: string) {
    activeTab = tabId;
    onTabChange?.({ tabId });
  }
</script>

<div class="vertical-tab-bar" class:left={position === 'left'} class:right={position === 'right'}>
  <div class="tabs-top">
    {#each tabs as tab}
      <button
        class="tab-button"
        class:active={activeTab === tab.id}
        on:click={() => selectTab(tab.id)}
        title={tab.tooltip}
        aria-label={tab.label}
      >
        <Icon name={tab.icon} size={20} />
      </button>
    {/each}
  </div>

  <div class="tabs-bottom">
    {#each bottomTabs as tab}
      <button
        class="tab-button"
        class:active={activeTab === tab.id}
        on:click={() => selectTab(tab.id)}
        title={tab.tooltip}
        aria-label={tab.label}
      >
        <Icon name={tab.icon} size={20} />
      </button>
    {/each}
  </div>
</div>

<style>
  .vertical-tab-bar {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 48px;
    height: 100%;
    background-color: var(--background-secondary);
    border-right: 1px solid var(--border-color);
    z-index: 10;
  }

  .vertical-tab-bar.right {
    border-right: none;
    border-left: 1px solid var(--border-color);
  }

  .tabs-top,
  .tabs-bottom {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 8px 4px;
  }

  .tab-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: none;
    border: none;
    border-radius: var(--radius-s);
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.15s ease;
    position: relative;
  }

  .tab-button:hover {
    background-color: var(--interactive-hover);
    color: var(--text-normal);
  }

  .tab-button.active {
    background-color: var(--interactive-accent);
    color: var(--text-on-accent);
  }

  .tab-button.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 24px;
    background-color: var(--interactive-accent);
    border-radius: 0 2px 2px 0;
  }

  .vertical-tab-bar.right .tab-button.active::before {
    left: auto;
    right: 0;
    border-radius: 2px 0 0 2px;
  }
</style>
