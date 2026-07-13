<script lang="ts">
  import { getActiveNotePath } from '@/hubs/core/stores/vault-store.svelte';
  import { buildTrail, type BreadcrumbSegment } from '@/hubs/editor/services/breadcrumb-service';

  let trail = $derived<BreadcrumbSegment[]>(buildTrail(getActiveNotePath() ?? ''));

  function handleClick(segment: BreadcrumbSegment) {
    if (segment.type === 'note') return;
    window.dispatchEvent(new CustomEvent('navigate-folder', { detail: { path: segment.path } }));
  }
</script>

{#if trail.length > 0}
  <nav class="breadcrumbs" aria-label="Note path">
    {#each trail as segment, i (segment.path)}
      {#if i > 0}<span class="bc-sep">/</span>{/if}
      {#if segment.isActive}
        <span class="bc-segment bc-active">{segment.label}</span>
      {:else}
        <button class="bc-segment bc-folder" onclick={() => handleClick(segment)}>
          {segment.label}
        </button>
      {/if}
    {/each}
  </nav>
{/if}

<style>
  .breadcrumbs {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 4px 12px;
    font-size: 0.65rem;
    color: var(--color-text-muted);
    overflow: hidden;
    white-space: nowrap;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-surface);
    min-height: 24px;
    flex-shrink: 0;
  }
  .bc-sep {
    color: var(--color-text-subtle);
    font-size: 0.6rem;
  }
  .bc-segment {
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .bc-folder {
    border: none;
    background: none;
    color: var(--color-text-muted);
    cursor: pointer;
    padding: 1px 3px;
    border-radius: var(--radius-s);
    font-family: inherit;
    font-size: inherit;
  }
  .bc-folder:hover {
    background: var(--color-surface-hover);
    color: var(--color-accent);
  }
  .bc-active {
    color: var(--color-text);
    font-weight: 500;
  }
</style>
