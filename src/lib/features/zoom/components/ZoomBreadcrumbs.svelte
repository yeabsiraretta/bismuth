<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import {
    isZoomed,
    zoomBreadcrumbs,
    zoomConfig,
    zoomReset,
    zoomToBreadcrumb,
  } from '../stores/zoomStore';
  import { activeNote } from '@/stores/vault/vault';

  function handleBreadcrumbClick(index: number) {
    const content = $activeNote?.content ?? '';
    zoomToBreadcrumb(content, index);
  }
</script>

{#if $isZoomed && $zoomConfig.showBreadcrumbs}
  <div class="zoom-breadcrumbs" role="navigation" aria-label="Zoom breadcrumbs">
    <button class="zoom-crumb zoom-crumb-root" on:click={zoomReset} title="Show full document">
      <Icon name="file-text" size={12} />
      <span>Document</span>
    </button>

    {#each $zoomBreadcrumbs as crumb, i}
      <span class="zoom-sep">/</span>
      {#if i === $zoomBreadcrumbs.length - 1}
        <span class="zoom-crumb zoom-crumb-active" title="Current zoom level">
          <Icon name={crumb.target.kind === 'heading' ? 'hash' : 'list'} size={11} />
          <span class="zoom-crumb-text">{crumb.target.text}</span>
        </span>
      {:else}
        <button
          class="zoom-crumb"
          on:click={() => handleBreadcrumbClick(i)}
          title="Zoom to this level"
        >
          <Icon name={crumb.target.kind === 'heading' ? 'hash' : 'list'} size={11} />
          <span class="zoom-crumb-text">{crumb.target.text}</span>
        </button>
      {/if}
    {/each}

    <button class="zoom-close" on:click={zoomReset} title="Exit zoom (Cmd+Shift+.)">
      <Icon name="x" size={12} />
    </button>
  </div>
{/if}

<style>
  .zoom-breadcrumbs {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 4px 12px;
    background: var(--background-secondary);
    border-bottom: 1px solid var(--border-color);
    font-size: 11px;
    overflow-x: auto;
    white-space: nowrap;
    min-height: 26px;
  }

  .zoom-crumb {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 2px 6px;
    border: none;
    border-radius: 3px;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 11px;
    line-height: 1;
  }

  .zoom-crumb:hover {
    background: var(--background-modifier-hover);
    color: var(--text-normal);
  }

  .zoom-crumb-active {
    color: var(--text-normal);
    font-weight: var(--font-semibold);
    cursor: default;
    background: var(--background-primary);
  }

  .zoom-crumb-root {
    flex-shrink: 0;
  }

  .zoom-crumb-text {
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .zoom-sep {
    color: var(--text-faint);
    flex-shrink: 0;
  }

  .zoom-close {
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border: none;
    border-radius: 3px;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    flex-shrink: 0;
  }

  .zoom-close:hover {
    background: var(--background-modifier-hover);
    color: var(--text-normal);
  }
</style>
