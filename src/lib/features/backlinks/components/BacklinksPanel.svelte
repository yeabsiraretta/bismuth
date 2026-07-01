<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import PanelHeader from '@/components/ui/layout/PanelHeader.svelte';
  import { activeNote } from '@/stores/vault/vault';
  import { openNote as navOpenNote } from '@/appNavigation';
  import { getCachedBacklinks, cacheVersion, cacheStats } from '../stores/backlinkStore';
  import type { CachedBacklink } from '../types';

  let backlinks: CachedBacklink[] = [];

  $: if ($activeNote && $cacheVersion >= 0) {
    backlinks = getCachedBacklinks($activeNote.path);
  } else {
    backlinks = [];
  }

  $: linkedBacklinks = backlinks.filter((b) => b.source !== 'unlinked');
  $: canvasBacklinks = backlinks.filter((b) => b.source === 'canvas');
  $: frontmatterBacklinks = backlinks.filter((b) => b.source === 'frontmatter');

  function openNote(path: string) {
    navOpenNote(path);
  }

  function sourceIcon(source: string): string {
    switch (source) {
      case 'canvas':
        return 'layout';
      case 'frontmatter':
        return 'tag';
      case 'wikilink':
        return 'link';
      case 'markdown':
        return 'link-2';
      default:
        return 'file-text';
    }
  }
</script>

<div class="inspector-panel">
  <PanelHeader icon="link-2" title="Backlinks" count={backlinks.length} />

  <div class="inspector-content">
    {#if backlinks.length === 0}
      <div class="inspector-empty">
        <Icon name="link-2" size={28} />
        <p class="inspector-empty-title">No backlinks found</p>
        <p class="inspector-empty-description">Other notes linking to this one will appear here</p>
      </div>
    {:else}
      <div class="inspector-list">
        {#each backlinks as backlink}
          <button
            class="inspector-list-item"
            on:click={() => openNote(backlink.sourcePath)}
            title="Open {backlink.sourceTitle}"
          >
            <div class="backlink-header">
              <Icon name={sourceIcon(backlink.source)} size={14} />
              <span class="backlink-title">{backlink.sourceTitle}</span>
              {#if backlink.source === 'canvas'}
                <span class="backlink-badge">canvas</span>
              {:else if backlink.source === 'frontmatter'}
                <span class="backlink-badge">frontmatter</span>
              {/if}
            </div>
            <div class="backlink-context">{backlink.context}</div>
          </button>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .backlink-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }

  .backlink-title {
    font-size: var(--font-ui-small);
    font-weight: 500;
    color: var(--text-normal);
  }

  .backlink-context {
    font-size: var(--font-smallest);
    color: var(--text-muted);
    line-height: 1.4;
    padding-left: 22px;
  }

  .backlink-badge {
    font-size: 9px;
    padding: 0 4px;
    border-radius: 4px;
    background: var(--background-secondary);
    color: var(--text-faint);
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }
</style>
