<script lang="ts">
  import { onMount } from 'svelte';
  import FolderTree from '@/components/sidebar/FolderTree.svelte';
  import FileList from '@/components/sidebar/FileList.svelte';
  import ShortcutBar from '@/components/sidebar/ShortcutBar.svelte';
  import TagTree from '@/components/sidebar/TagTree.svelte';
  import PropertyBrowser from '@/components/sidebar/PropertyBrowser.svelte';
  import {
    navigatorStore,
    setActiveTab,
    loadNavigatorState,
    saveNavigatorState,
  } from '@/stores/navigator/navigator';
  import Icon from '@/components/icons/Icon.svelte';

  let activeTab: 'folders' | 'tags' | 'properties' = 'folders';
  let selectedFolder: string | null = null;

  $: activeTab = $navigatorStore.activeTab;
  $: selectedFolder = $navigatorStore.selectedFolder;

  onMount(async () => {
    await loadNavigatorState();
  });

  function handleTabChange(tab: 'folders' | 'tags' | 'properties') {
    setActiveTab(tab);
  }

  // Save state on changes
  $: if ($navigatorStore) {
    saveNavigatorState();
  }
</script>

<div class="navigator">
  <ShortcutBar />

  <div class="navigator-content">
    <div class="navigator-left">
      <div class="tab-bar">
        <button
          class="tab-btn"
          class:active={activeTab === 'folders'}
          on:click={() => handleTabChange('folders')}
          aria-label="Folders"
        >
          <Icon name="folder" size={16} />
          <span>Folders</span>
        </button>
        <button
          class="tab-btn"
          class:active={activeTab === 'tags'}
          on:click={() => handleTabChange('tags')}
          aria-label="Tags"
        >
          <Icon name="tag" size={16} />
          <span>Tags</span>
        </button>
        <button
          class="tab-btn"
          class:active={activeTab === 'properties'}
          on:click={() => handleTabChange('properties')}
          aria-label="Properties"
        >
          <Icon name="list" size={16} />
          <span>Properties</span>
        </button>
      </div>

      <div class="tab-content">
        {#if activeTab === 'folders'}
          <FolderTree />
        {:else if activeTab === 'tags'}
          <TagTree />
        {:else if activeTab === 'properties'}
          <PropertyBrowser />
        {/if}
      </div>
    </div>

    <div class="navigator-divider"></div>

    <div class="navigator-right">
      <FileList folderPath={selectedFolder} />
    </div>
  </div>
</div>

<style>
  .navigator {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: var(--background-primary);
  }

  .navigator-content {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .navigator-left {
    display: flex;
    flex-direction: column;
    width: 16rem;
    border-right: 1px solid var(--background-modifier-border);
  }

  .tab-bar {
    display: flex;
    border-bottom: 1px solid var(--background-modifier-border);
    background-color: var(--background-secondary);
  }

  .tab-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 0.5rem;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    color: var(--text-muted);
    font-size: var(--font-size-sm);
    transition: all 0.15s ease;
  }

  .tab-btn:hover {
    background-color: var(--background-modifier-hover);
    color: var(--text-primary);
  }

  .tab-btn.active {
    color: var(--interactive-accent);
    border-bottom-color: var(--interactive-accent);
    background-color: var(--background-primary);
  }

  .tab-content {
    flex: 1;
    overflow: hidden;
  }

  .placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--text-muted);
    gap: 1rem;
  }

  .placeholder p {
    font-size: var(--font-size-sm);
  }

  .navigator-divider {
    width: 1px;
    background-color: var(--background-modifier-border);
  }

  .navigator-right {
    flex: 1;
    overflow: hidden;
  }

  @media (max-width: 768px) {
    .navigator-content {
      flex-direction: column;
    }

    .navigator-left {
      width: 100%;
      height: 12rem;
      border-right: none;
      border-bottom: 1px solid var(--background-modifier-border);
    }

    .navigator-divider {
      display: none;
    }
  }
</style>
