<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { breadcrumbContext } from '../breadcrumbStore';

  export let onNavigate: ((path: string) => void) | undefined = undefined;

  $: ctx = $breadcrumbContext;
  $: trail = ctx.trail;
  $: hasPrev = !!ctx.prev;
  $: hasNext = !!ctx.next;

  function handleSegmentClick(segment: (typeof trail)[0]) {
    if (segment.isActive) return;
    onNavigate?.(segment.path);
  }

  function handlePrev() {
    if (ctx.prev) onNavigate?.(ctx.prev);
  }

  function handleNext() {
    if (ctx.next) onNavigate?.(ctx.next);
  }
</script>

{#if trail.length > 0}
  <nav class="bc-trail" aria-label="Breadcrumb navigation">
    {#if hasPrev}
      <button
        class="bc-nav"
        on:click={handlePrev}
        title="Previous: {ctx.prev}"
        aria-label="Go to previous note"
      >
        <Icon name="chevron-left" size={12} />
      </button>
    {/if}

    <div class="bc-segments">
      {#each trail as segment, i}
        {#if i > 0}
          <span class="bc-sep" aria-hidden="true">/</span>
        {/if}
        {#if segment.isActive}
          <span class="bc-item bc-current" title={segment.path} aria-current="page">
            {segment.label}
          </span>
        {:else}
          <button
            class="bc-item bc-link"
            on:click={() => handleSegmentClick(segment)}
            title={segment.type === 'folder' ? `Open folder: ${segment.label}` : segment.path}
          >
            {segment.label}
          </button>
        {/if}
      {/each}
    </div>

    {#if ctx.parent}
      <span class="bc-parent" title="Parent: {ctx.parent}">
        <Icon name="corner-up-left" size={10} />
      </span>
    {/if}

    {#if hasNext}
      <button
        class="bc-nav"
        on:click={handleNext}
        title="Next: {ctx.next}"
        aria-label="Go to next note"
      >
        <Icon name="chevron-right" size={12} />
      </button>
    {/if}
  </nav>
{:else}
  <div class="bc-spacer"></div>
{/if}

<style>
  .bc-trail {
    display: flex;
    align-items: center;
    gap: 2px;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    padding: 0 var(--spacing-xs, 4px);
  }

  .bc-spacer {
    flex: 1;
  }

  .bc-segments {
    display: flex;
    align-items: center;
    gap: 2px;
    min-width: 0;
    overflow-x: auto;
    scrollbar-width: none;
    mask-image: linear-gradient(
      to right,
      transparent 0,
      black 4px,
      black calc(100% - 12px),
      transparent 100%
    );
    -webkit-mask-image: linear-gradient(
      to right,
      transparent 0,
      black 4px,
      black calc(100% - 12px),
      transparent 100%
    );
    padding: 0 4px;
  }

  .bc-segments::-webkit-scrollbar {
    display: none;
  }

  .bc-sep {
    color: var(--text-faint);
    font-size: 10px;
    flex-shrink: 0;
    user-select: none;
    line-height: 1;
  }

  .bc-item {
    font-size: var(--font-ui-smaller, 11px);
    white-space: nowrap;
    line-height: 1;
    padding: 2px 3px;
    border-radius: var(--radius-xs, 2px);
    max-width: 140px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .bc-link {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    transition:
      color 0.12s ease,
      background 0.12s ease;
  }

  .bc-link:hover {
    color: var(--text-normal);
    background: var(--interactive-hover);
  }

  .bc-current {
    color: var(--text-normal);
    font-weight: var(--font-medium, 500);
  }

  .bc-nav {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    padding: 0;
    background: none;
    border: none;
    border-radius: var(--radius-xs, 2px);
    color: var(--text-muted);
    cursor: pointer;
    flex-shrink: 0;
    transition:
      color 0.12s ease,
      background 0.12s ease;
  }

  .bc-nav:hover {
    color: var(--text-normal);
    background: var(--interactive-hover);
  }

  .bc-parent {
    display: inline-flex;
    align-items: center;
    color: var(--text-faint);
    flex-shrink: 0;
    margin-left: 2px;
  }
</style>
