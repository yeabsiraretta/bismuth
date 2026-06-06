<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import WelcomeScreen from '@/components/vault/WelcomeScreen.svelte';
  import FileTree from '@/components/vault/FileTree.svelte';
  import NoteEditor from '@/components/note/NoteEditor.svelte';
  import Toolbar from '@/components/vault/Toolbar.svelte';
  import SidebarShell from '@/components/sidebar/SidebarShell.svelte';
  import TabbedPanel from '@/components/sidebar/TabbedPanel.svelte';
  import SearchPanel from '@/components/sidebar/SearchPanel.svelte';
  import SettingsModal from '@/components/overlays/settings/SettingsModal.svelte';
  import TagPanel from '@/components/sidebar/TagPanel.svelte';
  import EntityBrowser from '@/components/sidebar/EntityBrowser.svelte';
  import CanvasApp from '@/components/canvas/CanvasApp.svelte';
  import GraphView from '@/components/graph/GraphView.svelte';
  import CaptureDashboard from '@/components/capture/CaptureDashboard.svelte';
  import StatusBar from '@/components/layout/StatusBar.svelte';
  import ToastContainer from '@/components/layout/ToastContainer.svelte';
  import Icon from '@/components/icons/Icon.svelte';
  import CommandPalette from '@/components/overlays/command-palette/CommandPalette.svelte';
  import AutoLinker from '@/components/overlays/auto-linker/AutoLinker.svelte';
  import { initializeVault, isVaultOpen, isLoadingVault, currentVault, notes } from '@/stores/vault/vault';
  import { layoutStore, loadLayout, enableAutoSave } from '@/stores/layout/layout';
  import { log } from '@/utils/logger';
  import { theme } from '@/stores/theme/theme';
  import { registerStatusItem } from '@/stores/status';
  import {
    registerAppCommands,
    handleGlobalKeydown as onKeydown,
    openNote,
    doRefresh,
    changeTab,
  } from '@/appNavigation';

  let currentView: 'notes' | 'canvas' = 'notes';
  let commandPaletteOpen = false;
  let autoLinkerOpen = false;
  let settingsOpen = false;

  $: leftTab = $layoutStore.leftActiveTab;
  $: rightTab = $layoutStore.rightActiveTab;

  $: if ($currentVault) {
    registerStatusItem({ id: 'vault-name', position: 'left', icon: 'hard-drive', label: $currentVault.name, tooltip: 'Current vault', priority: 10 });
  }
  $: registerStatusItem({ id: 'note-count', position: 'left', icon: 'file-text', label: `${$notes.length} notes`, tooltip: 'Total notes in vault', priority: 20 });

  onMount(async () => {
    log.info('App component mounted');
    loadLayout();
    enableAutoSave();
    await initializeVault();
    log.info('Vault initialization complete');

    registerAppCommands({
      openCommandPalette: () => { commandPaletteOpen = true; },
      openAutoLinker: () => { autoLinkerOpen = true; },
      setLeftTab: (tab) => { leftTab = tab; },
    });

    window.addEventListener('keydown', handleGlobalKeydown);
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') window.removeEventListener('keydown', handleGlobalKeydown);
  });

  function handleGlobalKeydown(e: KeyboardEvent) {
    onKeydown(e, () => { commandPaletteOpen = true; });
  }

  async function handleOpenNote(path: string) { await openNote(path); }
  async function handleRefresh() { await doRefresh(); }
  function handleLeftTabChange(detail: { tabId: string }) { changeTab('left', detail.tabId); }
  function handleRightTabChange(detail: { tabId: string }) { changeTab('right', detail.tabId); }
  function handleOpenSettings() { settingsOpen = true; }

  $: if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', $theme);
  }
</script>

<a href="#editor-main" class="skip-to-content">Skip to content</a>

<main class="app">
  {#if $isLoadingVault}
    <div class="loading">
      <div class="spinner"></div>
      <p>Loading vault...</p>
    </div>
  {:else if !$isVaultOpen}
    <WelcomeScreen />
  {:else if currentView === 'canvas'}
    <!-- Canvas view - full screen -->
    <div class="canvas-container">
      <div class="canvas-nav">
        <button class="btn-nav" on:click={() => (currentView = 'notes')}>
          <Icon name="arrow-left" size={16} />
          Back to Notes
        </button>
      </div>
      <CanvasApp />
    </div>
  {:else}
    <!-- Main layout: 3-column content + bottom status bar -->
    <div class="app-columns">
      <!-- Left sidebar -->
      <SidebarShell
        position="left"
        tabs={$layoutStore.leftTabs}
        bottomTabs={$layoutStore.bottomTabs}
        activeTab={leftTab}
        width={$layoutStore.leftSidebarWidth}
        collapsed={!$layoutStore.leftSidebarVisible}
        onTabChange={handleLeftTabChange}
        onSettingsClick={handleOpenSettings}
      >
        {#if leftTab === 'files'}
          <FileTree />
        {:else if leftTab === 'search'}
          <SearchPanel />
        {:else if leftTab === 'inbox'}
          <CaptureDashboard />
        {:else if leftTab === 'graph'}
          <GraphView />
        {:else if leftTab === 'tags'}
          <TagPanel />
        {:else if leftTab === 'entities'}
          <EntityBrowser onOpenNote={handleOpenNote} />
        {/if}
      </SidebarShell>

      <!-- Center editor pane -->
      <main id="editor-main" class="editor-pane panel">
        <div class="panel-header">
          <Toolbar onRefresh={handleRefresh} />
          <button
            class="btn-canvas"
            on:click={() => (currentView = 'canvas')}
            title="Open Canvas"
            aria-label="Open canvas workspace"
          >
            <Icon name="layout" size={16} />
            <span class="label">Canvas</span>
          </button>
        </div>
        <div class="panel-body">
          <NoteEditor />
        </div>
      </main>

      <!-- Right sidebar -->
      <SidebarShell
        position="right"
        tabs={$layoutStore.rightTabs}
        bottomTabs={$layoutStore.bottomTabs}
        activeTab={rightTab}
        width={$layoutStore.rightSidebarWidth}
        collapsed={!$layoutStore.rightSidebarVisible}
        onTabChange={handleRightTabChange}
        onSettingsClick={handleOpenSettings}
      >
        <TabbedPanel />
      </SidebarShell>
    </div>

    <!-- Status bar -->
    <StatusBar />
  {/if}
</main>

<ToastContainer />

<CommandPalette
  isOpen={commandPaletteOpen}
  onClose={() => {
    commandPaletteOpen = false;
  }}
/>

<AutoLinker
  isOpen={autoLinkerOpen}
  onClose={() => {
    autoLinkerOpen = false;
  }}
/>

<SettingsModal
  isOpen={settingsOpen}
  onClose={() => {
    settingsOpen = false;
  }}
/>

<style>
  .app {
    display: flex;
    flex-direction: column;
    width: 100vw;
    height: 100vh;
    min-width: 320px;
    min-height: 480px;
    overflow: hidden;
    background-color: var(--background-primary);
  }

  :global(.skip-to-content) {
    position: absolute;
    left: -9999px;
    top: auto;
    width: 1px;
    height: 1px;
    overflow: hidden;
    z-index: 9999;
    padding: 8px 16px;
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    font-size: var(--font-ui-small);
    border-radius: var(--radius-s);
    text-decoration: none;
  }

  :global(.skip-to-content:focus) {
    position: fixed;
    top: 8px;
    left: 8px;
    width: auto;
    height: auto;
    overflow: visible;
  }

  .app-columns {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  @media (max-width: 640px) {
    .app {
      flex-direction: column;
    }
  }

  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    gap: 1rem;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid var(--color-surface);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .editor-pane {
    flex: 1;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--background-primary);
    overflow: hidden;
  }

  .editor-pane .panel-header {
    display: flex;
    align-items: center;
    gap: 0;
    padding: 0;
    background: var(--background-secondary);
  }

  .editor-pane .panel-body {
    flex: 1;
    overflow: hidden;
    padding: 0;
  }

  .sidebar-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 0.75rem;
    color: var(--text-muted);
    text-align: center;
    padding: 2rem 1rem;
  }

  .sidebar-placeholder p {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .sidebar-placeholder .hint {
    font-size: 0.75rem;
    color: var(--text-faint);
  }

  .canvas-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
  }

  .canvas-nav {
    padding: 1rem;
    background: var(--background-secondary);
    border-bottom: 1px solid var(--border-color);
  }

  .btn-nav {
    padding: 0.5rem 1rem;
    background: var(--background-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    color: var(--text-normal);
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn-nav:hover {
    background: var(--interactive-hover);
  }

  .btn-canvas {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 36px;
    padding: 0.5rem 1rem;
    background: var(--interactive-accent, #6366f1);
    color: var(--text-on-accent, #ffffff);
    border: none;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
    margin-right: var(--space-2, 0.5rem);
  }

  .btn-canvas:hover {
    opacity: 0.9;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .btn-canvas:active {
    transform: translateY(1px);
  }
</style>
