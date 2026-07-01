<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { getFileIcon } from '../services/homeSearch';
  import {
    bookmarks,
    recentNotes,
    homeSettings,
    addBookmark,
    removeBookmark,
  } from '../stores/homeStore';

  export let onOpen: (path: string) => void;

  $: visibleRecent = $recentNotes.slice(0, $homeSettings.maxRecentFiles);

  function toggleBookmark(path: string, title: string) {
    const existing = $bookmarks.find(b => b.path === path);
    if (existing) removeBookmark(path);
    else addBookmark(path, title);
  }
</script>

{#if $homeSettings.showBookmarks && $bookmarks.length > 0}
  <section class="home-section">
    <h2 class="section-title"><Icon name="star" size={14} /> Bookmarks</h2>
    <div class="file-grid">
      {#each $bookmarks as bm (bm.path)}
        <div class="file-card" on:click={() => onOpen(bm.path)} on:keydown={(e) => e.key === 'Enter' && onOpen(bm.path)} role="listitem" tabindex="0" title={bm.path}>
          <div class="card-icon">
            <Icon name={bm.icon || 'file-text'} size={20} />
          </div>
          <span class="card-title">{bm.title}</span>
          <button
            class="card-action"
            title="Remove bookmark"
            on:click|stopPropagation={() => removeBookmark(bm.path)}
          >
            <Icon name="x" size={10} />
          </button>
        </div>
      {/each}
    </div>
  </section>
{/if}

{#if $homeSettings.showRecentFiles && visibleRecent.length > 0}
  <section class="home-section">
    <h2 class="section-title"><Icon name="clock" size={14} /> Recent Files</h2>
    <div class="file-grid">
      {#each visibleRecent as note (note.path)}
        <div class="file-card" role="button" tabindex="0" on:click={() => onOpen(note.path)} on:keydown={(e) => e.key === 'Enter' && onOpen(note.path)} title={note.path}>
          <div class="card-icon">
            <Icon name={getFileIcon(note.path.split('.').pop() || 'md')} size={20} />
          </div>
          <span class="card-title">{note.title}</span>
          <button
            class="card-action"
            title={$bookmarks.some(b => b.path === note.path) ? 'Remove bookmark' : 'Add bookmark'}
            on:click|stopPropagation={() => toggleBookmark(note.path, note.title)}
          >
            <Icon name={$bookmarks.some(b => b.path === note.path) ? 'star' : 'bookmark'} size={10} />
          </button>
        </div>
      {/each}
    </div>
  </section>
{/if}

<style>
  .home-section {
    width: 100%;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: var(--font-size-sm, 13px);
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin: 0 0 var(--spacing-sm, 6px);
  }

  .file-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 8px;
  }

  .file-card {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 14px 8px 10px;
    background: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-m, 8px);
    cursor: pointer;
    transition: background 0.12s, border-color 0.12s, transform 0.12s;
    text-align: center;
  }

  .file-card:hover {
    background: var(--background-modifier-hover);
    border-color: var(--interactive-accent);
    transform: translateY(-1px);
  }

  .card-icon { color: var(--text-muted); }
  .file-card:hover .card-icon { color: var(--interactive-accent); }

  .card-title {
    font-size: var(--font-size-xs, 11px);
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 100%;
  }

  .card-action {
    position: absolute;
    top: 4px;
    right: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border: none;
    background: none;
    border-radius: var(--radius-s, 4px);
    color: var(--text-muted);
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.12s;
  }

  .file-card:hover .card-action { opacity: 1; }
  .card-action:hover { color: var(--text-error, #dc2626); background: color-mix(in srgb, var(--text-error, #dc2626) 10%, transparent); }
</style>
