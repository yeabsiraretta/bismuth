<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import {
    annotatorView,
    activeAnnotationFile,
    closeAnnotator,
    toggleDarkMode,
    toggleSidebar,
  } from '../stores/annotatorStore';
  import PDFViewer from './PDFViewer.svelte';
  import AnnotationSidebar from './AnnotationSidebar.svelte';

  $: isOpen = $annotatorView.isOpen;
  $: file = $activeAnnotationFile;
  $: sidebarVisible = $annotatorView.sidebarVisible;
  $: darkMode = $annotatorView.darkMode;
</script>

{#if isOpen && file}
  <div class="annotator-panel">
    <div class="annotator-header">
      <div class="header-left">
        <Icon name="file-text" size={16} />
        <span class="doc-name" title={file.target}>
          {file.target.split('/').pop()}
        </span>
        <span class="doc-type">{file.targetType.toUpperCase()}</span>
      </div>
      <div class="header-actions">
        <button
          class="header-btn"
          class:active={darkMode}
          on:click={toggleDarkMode}
          title="Toggle dark mode"
        >
          <Icon name="moon" size={14} />
        </button>
        <button
          class="header-btn"
          class:active={sidebarVisible}
          on:click={toggleSidebar}
          title="Toggle annotation sidebar"
        >
          <Icon name="sidebar" size={14} />
        </button>
        <button class="header-btn" on:click={closeAnnotator} title="Close annotator">
          <Icon name="x" size={14} />
        </button>
      </div>
    </div>

    <div class="annotator-body">
      <div class="viewer-area">
        {#if file.targetType === 'pdf'}
          <PDFViewer source={file.target} />
        {:else}
          <div class="unsupported">
            <Icon name="book-open" size={32} />
            <p>EPUB support coming soon</p>
            <p class="hint">Target: {file.target}</p>
          </div>
        {/if}
      </div>

      {#if sidebarVisible}
        <AnnotationSidebar />
      {/if}
    </div>
  </div>
{/if}

<style>
  .annotator-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--bg-primary);
  }
  .annotator-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border-primary);
    gap: 8px;
  }
  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .doc-name {
    font-size: var(--font-size-sm);
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .doc-type {
    font-size: var(--font-size-xs);
    color: var(--text-muted);
    padding: 1px 6px;
    background: var(--bg-tertiary);
    border-radius: var(--radius-sm);
  }
  .header-actions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
  }
  .header-btn {
    padding: 4px 6px;
    border: none;
    background: none;
    color: var(--text-secondary);
    cursor: pointer;
    border-radius: var(--radius-sm);
    transition: background 0.15s, color 0.15s;
  }
  .header-btn:hover { background: var(--bg-hover); }
  .header-btn.active { color: var(--text-accent); }
  .annotator-body {
    display: flex;
    flex: 1;
    min-height: 0;
  }
  .viewer-area {
    flex: 1;
    min-width: 0;
  }
  .unsupported {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--text-secondary);
    gap: 8px;
  }
  .hint { font-size: var(--font-size-xs); color: var(--text-muted); }
</style>
