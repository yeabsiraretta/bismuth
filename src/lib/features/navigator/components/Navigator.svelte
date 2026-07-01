<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import NavigationPane from './NavigationPane.svelte';
  import ListPane from './ListPane.svelte';
  import NavSearchBar from './NavSearchBar.svelte';
  import NavShortcuts from './NavShortcuts.svelte';
  import { navigatorStore, togglePane, setFilterQuery } from '../stores/navigator';
  import {
    navigateBack, navigateForward, canGoBack, canGoForward,
    toggleSearch, searchOpen, resetEphemeralState,
  } from '../stores/navigatorActions';
  import { onMount } from 'svelte';
  import { loadNavigatorState } from '../stores/navigator';

  let splitRatio = 40;
  let resizing = false;
  let containerEl: HTMLElement;

  onMount(() => {
    resetEphemeralState();
    loadNavigatorState();
  });

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault();
      togglePane();
    }
    if (e.key === 'Escape') {
      setFilterQuery('');
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
      e.preventDefault();
      toggleSearch();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === '[') {
      e.preventDefault();
      navigateBack();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === ']') {
      e.preventDefault();
      navigateForward();
    }
  }

  function startResize(e: MouseEvent) {
    resizing = true;
    e.preventDefault();
  }

  function onMouseMove(e: MouseEvent) {
    if (!resizing || !containerEl) return;
    const rect = containerEl.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    splitRatio = Math.max(20, Math.min(70, pct));
  }

  function stopResize() {
    resizing = false;
  }
</script>

<svelte:window on:mousemove={onMouseMove} on:mouseup={stopResize} />

<div
  class="navigator"
  bind:this={containerEl}
  on:keydown={handleKeydown}
  role="navigation"
  aria-label="Notebook Navigator"
>
  <div class="navigator-header">
    <div class="header-left">
      <button
        class="icon-btn"
        on:click={navigateBack}
        disabled={!$canGoBack}
        title="Navigate back"
        aria-label="Navigate back"
      >
        <Icon name="arrow-left" size={13} />
      </button>
      <button
        class="icon-btn"
        on:click={navigateForward}
        disabled={!$canGoForward}
        title="Navigate forward"
        aria-label="Navigate forward"
      >
        <Icon name="arrow-right" size={13} />
      </button>
    </div>
    <div class="header-actions">
      <button
        class="icon-btn"
        class:active={$navigatorStore.activeTab === 'folders'}
        on:click={() => navigatorStore.update(s => ({ ...s, activeTab: 'folders' }))}
        title="Folders"
      >
        <Icon name="folder" size={14} />
      </button>
      <button
        class="icon-btn"
        class:active={$navigatorStore.activeTab === 'tags'}
        on:click={() => navigatorStore.update(s => ({ ...s, activeTab: 'tags' }))}
        title="Tags"
      >
        <Icon name="tag" size={14} />
      </button>
      <button
        class="icon-btn"
        class:active={$navigatorStore.activeTab === 'properties'}
        on:click={() => navigatorStore.update(s => ({ ...s, activeTab: 'properties' }))}
        title="Properties"
      >
        <Icon name="sliders" size={14} />
      </button>
      <button
        class="icon-btn"
        class:active={$searchOpen}
        on:click={toggleSearch}
        title="Search (Cmd+F)"
      >
        <Icon name="search" size={14} />
      </button>
    </div>
  </div>

  <NavSearchBar />
  <NavShortcuts />

  <div class="navigator-body">
    <div
      class="pane navigation-pane"
      class:focused={$navigatorStore.activePane === 'navigation'}
      style="width: {splitRatio}%"
    >
      <NavigationPane />
    </div>

    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
      class="resize-handle"
      on:mousedown={startResize}
      role="separator"
      aria-orientation="vertical"
      tabindex="-1"
    ></div>

    <div
      class="pane list-pane"
      class:focused={$navigatorStore.activePane === 'list'}
      style="width: {100 - splitRatio}%"
    >
      <ListPane />
    </div>
  </div>
</div>

<style>
  .navigator {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .navigator-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px 6px;
    flex-shrink: 0;
  }

  .header-left {
    display: flex;
    gap: 2px;
  }

  .header-actions {
    display: flex;
    gap: 2px;
  }

  .icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: none;
    border: none;
    border-radius: var(--radius-s);
    color: var(--text-muted);
    cursor: pointer;
  }

  .icon-btn:hover:not(:disabled) { background: var(--interactive-hover); color: var(--text-normal); }
  .icon-btn.active { color: var(--interactive-accent); }
  .icon-btn:disabled { opacity: 0.3; cursor: default; }

  .navigator-body {
    display: flex;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .pane {
    overflow-y: auto;
    overflow-x: hidden;
  }

  .pane.focused {
    border-bottom: 2px solid var(--interactive-accent);
  }

  .resize-handle {
    width: 4px;
    cursor: col-resize;
    background: var(--border-color);
    flex-shrink: 0;
    transition: background 0.15s;
  }

  .resize-handle:hover {
    background: var(--interactive-accent);
  }
</style>
