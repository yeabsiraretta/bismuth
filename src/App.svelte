<script lang="ts">
  import { onMount } from 'svelte';
  import '@/styles/tokens.css';
  import '@/styles/typography.css';
  import '@/styles/responsive.css';
  import '@/styles/grid-system.css';
  import WelcomeScreen from '@/components/vault/WelcomeScreen.svelte';
  import FileTree from '@/components/vault/FileTree.svelte';
  import NoteEditor from '@/components/note/NoteEditor.svelte';
  import Toolbar from '@/components/vault/Toolbar.svelte';
  import ResizablePanel from '@/components/layout/ResizablePanel.svelte';
  import { initializeVault, isVaultOpen, isLoadingVault, refreshNotes } from '@/stores/vault/vault';
  import {
    layoutStore,
    setLeftSidebarWidth,
    setRightSidebarWidth,
    toggleLeftSidebar,
    toggleRightSidebar,
  } from '@/stores/layout/layout';
  import { log } from '@/utils/logger';

  onMount(async () => {
    log.info('App component mounted');
    await initializeVault();
    log.info('Vault initialization complete');
  });

  $: {
    log.debug('Vault loading state changed', { isLoading: $isLoadingVault });
    log.debug('App.svelte reactive: isLoadingVault', { value: $isLoadingVault });
  }
  $: {
    log.debug('Vault open state changed', { isOpen: $isVaultOpen });
    log.debug('App.svelte reactive: isVaultOpen', { value: $isVaultOpen });
  }

  async function handleRefresh() {
    await refreshNotes();
  }

  function handleLeftResize(event: CustomEvent) {
    setLeftSidebarWidth(event.detail.width);
  }

  function handleRightResize(event: CustomEvent) {
    setRightSidebarWidth(event.detail.width);
  }

  function handleLeftCollapse(event: CustomEvent) {
    if (event.detail.collapsed) {
      toggleLeftSidebar();
    } else {
      toggleLeftSidebar();
    }
  }

  function handleRightCollapse(event: CustomEvent) {
    if (event.detail.collapsed) {
      toggleRightSidebar();
    } else {
      toggleRightSidebar();
    }
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
  {:else}
    <!-- Three-column layout with resizable panels -->
    <ResizablePanel
      position="left"
      title="Files"
      width={$layoutStore.leftSidebarWidth}
      collapsed={!$layoutStore.leftSidebarVisible}
      on:resize={handleLeftResize}
      on:collapse={handleLeftCollapse}
    >
      <FileTree />
    </ResizablePanel>

    <main class="editor-pane panel">
      <div class="panel-header">
        <Toolbar onRefresh={handleRefresh} />
      </div>
      <div class="panel-body">
        <NoteEditor />
      </div>
    </main>

    <ResizablePanel
      position="right"
      title="Sidebar"
      width={$layoutStore.rightSidebarWidth}
      collapsed={!$layoutStore.rightSidebarVisible}
      on:resize={handleRightResize}
      on:collapse={handleRightCollapse}
    >
      <div class="grid gap-md">
        <div class="panel panel-flat">
          <div class="panel-header">
            <h3 class="panel-title">Backlinks</h3>
          </div>
          <div class="panel-body">
            <p class="text-muted">No backlinks found</p>
          </div>
        </div>
        <div class="panel panel-flat">
          <div class="panel-header">
            <h3 class="panel-title">Outgoing Links</h3>
          </div>
          <div class="panel-body">
            <p class="text-muted">No outgoing links</p>
          </div>
        </div>
      </div>
    </ResizablePanel>

    <!-- Command palette overlay -->
    <div class="command-palette-overlay" style="display: none;">
      <!-- Command palette will go here -->
    </div>
  {/if}
</main>

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
    /* Neutral Base (Gray Scale) */
    --color-bg: #ffffff;
    --color-surface: #f8f9fa;
    --color-border: #dee2e6;
    --color-text: #212529;
    --color-text-muted: #6c757d;

    /* Accent (Blue) */
    --color-primary: #0d6efd;
    --color-primary-hover: #0b5ed7;

    /* Semantic (Minimal) */
    --color-danger: #dc3545;

    /* Spacing Scale (8px base) */
    --space-1: 0.25rem;
    --space-2: 0.5rem;
    --space-3: 0.75rem;
    --space-4: 1rem;
    --space-6: 1.5rem;
    --space-8: 2rem;
  }

  .app {
    display: flex;
    width: 100vw;
    height: 100vh;
    min-width: 320px;
    min-height: 480px;
    overflow: hidden;
    background-color: var(--background-primary);
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
    background: var(--panel-bg, #ffffff);
    overflow: hidden;
  }

  .editor-pane .panel-header {
    border-bottom: 1px solid var(--panel-border, #e5e7eb);
    padding: 0;
  }

  .editor-pane .panel-body {
    flex: 1;
    overflow: hidden;
    padding: 0;
  }

  .text-muted {
    color: var(--color-text-muted, #6c757d);
    font-size: 0.875rem;
  }

  .command-palette-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--background-modifier-cover);
    z-index: var(--layer-modal);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 20vh;
  }
</style>
