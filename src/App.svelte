<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import '@/styles/tokens.css';
  import '@/styles/typography.css';
  import '@/styles/responsive.css';
  import '@/styles/grid-system.css';
  import WelcomeScreen from '@/components/vault/WelcomeScreen.svelte';
  import FileTree from '@/components/vault/FileTree.svelte';
  import NoteEditor from '@/components/note/NoteEditor.svelte';
  import Toolbar from '@/components/vault/Toolbar.svelte';
  import ResizablePanel from '@/components/layout/ResizablePanel.svelte';
  import VerticalTabBar from '@/components/sidebar/VerticalTabBar.svelte';
  import TabbedPanel from '@/components/sidebar/TabbedPanel.svelte';
  import TagPanel from '@/components/sidebar/TagPanel.svelte';
  import EntityBrowser from '@/components/sidebar/EntityBrowser.svelte';
  import CanvasApp from '@/components/canvas/CanvasApp.svelte';
  import GraphView from '@/components/graph/GraphView.svelte';
  import CaptureDashboard from '@/components/capture/CaptureDashboard.svelte';
  import StatusBar from '@/components/layout/StatusBar.svelte';
  import ToastContainer from '@/components/layout/ToastContainer.svelte';
  import Icon from '@/components/icons/Icon.svelte';
  import {
    initializeVault,
    isVaultOpen,
    isLoadingVault,
    refreshNotes,
    setActiveNote,
  } from '@/stores/vault/vault';
  import {
    layoutStore,
    setLeftSidebarWidth,
    setRightSidebarWidth,
    toggleLeftSidebar,
    toggleRightSidebar,
    loadLayout,
    enableAutoSave,
  } from '@/stores/layout/layout';
  import { log } from '@/utils/logger';
  import { theme } from '@/stores/theme/theme';
  import CommandPalette from '@/components/modals/CommandPalette.svelte';
  import { registerDefaultCommands } from '@/stores/commands';
  import { quickCapture } from '@/stores/capture/capture';
  import { getNote } from '@/services/vault/vault';

  let currentView: 'notes' | 'canvas' = 'notes';
  let leftTab = 'files';
  let commandPaletteOpen = false;

  onMount(async () => {
    log.info('App component mounted');
    loadLayout();
    enableAutoSave();
    await initializeVault();
    log.info('Vault initialization complete');

    // Register commands
    registerDefaultCommands({
      openSearch: () => {
        commandPaletteOpen = true;
      },
      openCommandPalette: () => {
        commandPaletteOpen = true;
      },
      toggleLeftSidebar,
      toggleRightSidebar,
      quickCapture: () => quickCapture(),
      openGraph: () => {
        leftTab = 'graph';
      },
      openCaptureDashboard: () => {
        leftTab = 'inbox';
      },
    });

    // Global keyboard shortcut for Cmd+P
    window.addEventListener('keydown', handleGlobalKeydown);
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', handleGlobalKeydown);
    }
  });

  function handleGlobalKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
      e.preventDefault();
      commandPaletteOpen = true;
    }
    // Cmd+Shift+N for quick capture
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'N') {
      e.preventDefault();
      quickCapture();
    }
  }

  async function handleOpenNote(path: string) {
    try {
      const note = await getNote(path);
      setActiveNote(note);
    } catch (error) {
      console.error('Failed to open note:', error);
    }
  }

  $: if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', $theme);
  }

  async function handleRefresh() {
    await refreshNotes();
  }

  function handleLeftResize(detail: { width: number }) {
    setLeftSidebarWidth(detail.width);
  }

  function handleRightResize(detail: { width: number }) {
    setRightSidebarWidth(detail.width);
  }

  function handleLeftCollapse() {
    toggleLeftSidebar();
  }

  function handleRightCollapse() {
    toggleRightSidebar();
  }

  function handleLeftTabChange(detail: { tabId: string }) {
    leftTab = detail.tabId;
  }
</script>

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
      <!-- Left vertical tab bar -->
      <VerticalTabBar position="left" activeTab={leftTab} onTabChange={handleLeftTabChange} />

      <!-- Left sidebar content panel -->
      <ResizablePanel
        position="left"
        title={leftTab === 'files'
          ? 'Files'
          : leftTab === 'search'
            ? 'Search'
            : leftTab === 'inbox'
              ? 'Capture Inbox'
              : leftTab === 'graph'
                ? 'Graph'
                : leftTab === 'tags'
                  ? 'Tags'
                  : leftTab === 'entities'
                    ? 'Entities'
                    : 'Files'}
        width={$layoutStore.leftSidebarWidth}
        collapsed={!$layoutStore.leftSidebarVisible}
        onResize={handleLeftResize}
        onCollapse={handleLeftCollapse}
      >
        {#if leftTab === 'files'}
          <FileTree />
        {:else if leftTab === 'search'}
          <div
            class="sidebar-placeholder"
            role="button"
            tabindex="0"
            on:click={() => (commandPaletteOpen = true)}
            on:keydown={(e) => {
              if (e.key === 'Enter') commandPaletteOpen = true;
            }}
          >
            <Icon name="search" size={32} color="var(--text-muted)" />
            <p>Search</p>
            <span class="hint">Click here or use Cmd+P to search notes</span>
          </div>
        {:else if leftTab === 'inbox'}
          <CaptureDashboard />
        {:else if leftTab === 'graph'}
          <GraphView />
        {:else if leftTab === 'tags'}
          <TagPanel />
        {:else if leftTab === 'entities'}
          <EntityBrowser onOpenNote={handleOpenNote} />
        {/if}
      </ResizablePanel>

      <!-- Center editor pane -->
      <main class="editor-pane panel">
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

      <!-- Right sidebar with tabbed panel -->
      <ResizablePanel
        position="right"
        title="Inspector"
        width={$layoutStore.rightSidebarWidth}
        collapsed={!$layoutStore.rightSidebarVisible}
        onResize={handleRightResize}
        onCollapse={handleRightCollapse}
      >
        <TabbedPanel />
      </ResizablePanel>
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

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: var(--font-text);
    background-color: var(--background-primary);
    color: var(--text-normal);
    overflow: hidden;
  }

  :global(*) {
    box-sizing: border-box;
  }

  :global(:root) {
    /* Spacing Scale (8px base) — supplemental to tokens.css */
    --space-1: 0.25rem;
    --space-2: 0.5rem;
    --space-3: 0.75rem;
    --space-4: 1rem;
    --space-6: 1.5rem;
    --space-8: 2rem;

    /* Semantic (Minimal) */
    --color-danger: #dc3545;
  }

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
