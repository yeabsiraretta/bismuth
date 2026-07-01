<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { clippedItems, clipperStats, isClipping, clipFromClipboard, clipBatchFromClipboard, insertAtCursor, clearHistory } from '../stores/clipperStore';
  import { openNote } from '@/appNavigation';
  import type { ContentType } from '../types';

  function getTypeIcon(type: ContentType): string {
    switch (type) {
      case 'youtube': case 'youtube-channel': return 'play';
      case 'twitter': case 'bluesky': case 'mastodon': return 'message-circle';
      case 'stackexchange': return 'help-circle';
      case 'pinterest': return 'image';
      case 'vimeo': case 'bilibili': case 'tiktok': return 'film';
      case 'website': return 'globe';
      case 'text-snippet': return 'file-text';
      default: return 'clipboard';
    }
  }

  function getTypeLabel(type: ContentType): string {
    switch (type) {
      case 'youtube': return 'YouTube';
      case 'youtube-channel': return 'YT Channel';
      case 'twitter': return 'Twitter/X';
      case 'bluesky': return 'Bluesky';
      case 'stackexchange': return 'StackExchange';
      case 'pinterest': return 'Pinterest';
      case 'mastodon': return 'Mastodon';
      case 'vimeo': return 'Vimeo';
      case 'bilibili': return 'Bilibili';
      case 'tiktok': return 'TikTok';
      case 'website': return 'Article';
      case 'text-snippet': return 'Snippet';
      default: return type;
    }
  }

  function getStatusClass(status: string): string {
    switch (status) {
      case 'saved': return 'status-saved';
      case 'error': return 'status-error';
      default: return 'status-pending';
    }
  }

  function formatTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }
</script>

<div class="clipper-panel">
  <div class="clipper-header">
    <div class="header-title">
      <Icon name="clipboard" size={14} />
      <span>Web Clipper</span>
    </div>
    <div class="header-stats">
      <span class="stat" title="Total clips">{$clipperStats.total}</span>
    </div>
  </div>

  <div class="clipper-actions">
    <button class="action-btn primary" on:click={clipFromClipboard} disabled={$isClipping} title="Clip from clipboard (single URL)">
      <Icon name="clipboard" size={14} />
      <span>Clip URL</span>
    </button>
    <button class="action-btn" on:click={clipBatchFromClipboard} disabled={$isClipping} title="Batch clip URLs from clipboard">
      <Icon name="layers" size={14} />
      <span>Batch</span>
    </button>
    <button class="action-btn" on:click={insertAtCursor} disabled={$isClipping} title="Insert at cursor position">
      <Icon name="edit" size={14} />
      <span>Insert</span>
    </button>
  </div>

  <div class="clipper-body">
    {#if $clippedItems.length === 0}
      <div class="empty-state">
        <Icon name="clipboard" size={32} />
        <p>No clips yet</p>
        <p class="hint">Copy a URL and click "Clip URL" or use the command palette</p>
      </div>
    {:else}
      {#each $clippedItems as item (item.id)}
        <div class="clip-item {getStatusClass(item.status)}">
          <div class="clip-icon">
            <Icon name={getTypeIcon(item.contentType)} size={14} />
          </div>
          <div class="clip-info">
            {#if item.notePath}
              <button class="clip-title" on:click={() => openNote(item.notePath || '')} title="Open note">
                {item.title}
              </button>
            {:else}
              <span class="clip-title no-link">{item.title}</span>
            {/if}
            <div class="clip-meta">
              <span class="clip-type">{getTypeLabel(item.contentType)}</span>
              <span class="clip-time">{formatTime(item.createdAt)}</span>
            </div>
          </div>
          <div class="clip-status">
            {#if item.status === 'saved'}
              <Icon name="check" size={12} />
            {:else if item.status === 'error'}
              <span title={item.error}><Icon name="alert-circle" size={12} /></span>
            {:else}
              <Icon name="clock" size={12} />
            {/if}
          </div>
        </div>
      {/each}
      <button class="clear-btn" on:click={clearHistory}>Clear History</button>
    {/if}
  </div>
</div>

<style>
  .clipper-panel { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
  .clipper-header { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; border-bottom: 1px solid var(--background-modifier-border, rgba(0,0,0,0.1)); }
  .header-title { display: flex; align-items: center; gap: 6px; font-size: 0.85rem; font-weight: 600; color: var(--text-normal); }
  .header-stats { font-size: 0.7rem; color: var(--text-muted); }
  .stat { background: var(--background-modifier-border, rgba(0,0,0,0.08)); padding: 1px 6px; border-radius: 8px; }
  .clipper-actions { display: flex; gap: 4px; padding: 8px 12px; border-bottom: 1px solid var(--background-modifier-border, rgba(0,0,0,0.06)); }
  .action-btn { display: flex; align-items: center; gap: 4px; padding: 4px 8px; font-size: 0.75rem; border: 1px solid var(--background-modifier-border, rgba(0,0,0,0.15)); border-radius: var(--radius-s, 4px); background: var(--background-primary, #fff); color: var(--text-normal); cursor: pointer; flex: 1; justify-content: center; }
  .action-btn:hover { background: var(--background-modifier-hover); }
  .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .action-btn.primary { background: var(--interactive-accent, #3b82f6); color: #fff; border-color: var(--interactive-accent, #3b82f6); }
  .action-btn.primary:hover { opacity: 0.9; }
  .clipper-body { flex: 1; overflow-y: auto; padding: 4px 0; }
  .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 32px 16px; color: var(--text-muted, #6b7280); font-size: 0.8rem; gap: 6px; text-align: center; }
  .hint { font-size: 0.7rem; color: var(--text-faint, #9ca3af); margin: 0; }
  .clip-item { display: flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: var(--radius-s, 4px); margin: 0 4px; }
  .clip-item:hover { background: var(--background-modifier-hover, #f3f4f6); }
  .clip-icon { display: flex; align-items: center; color: var(--text-muted); flex-shrink: 0; }
  .clip-info { flex: 1; min-width: 0; }
  .clip-title { font-size: 0.8rem; color: var(--text-normal); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; background: none; border: none; cursor: pointer; padding: 0; text-align: left; }
  .clip-title:hover { color: var(--interactive-accent, #3b82f6); }
  .clip-title.no-link { cursor: default; }
  .clip-title.no-link:hover { color: var(--text-normal); }
  .clip-meta { display: flex; gap: 6px; font-size: 0.65rem; color: var(--text-muted); }
  .clip-type { background: color-mix(in srgb, var(--text-muted) 12%, transparent); padding: 0 4px; border-radius: 4px; }
  .clip-status { display: flex; align-items: center; flex-shrink: 0; }
  .status-saved .clip-status { color: var(--interactive-accent, #10b981); }
  .status-error .clip-status { color: var(--text-error, #ef4444); }
  .status-pending .clip-status { color: var(--text-muted); }
  .clear-btn { display: block; margin: 8px auto; padding: 4px 12px; font-size: 0.7rem; border: 1px solid var(--background-modifier-border); border-radius: var(--radius-s, 4px); background: transparent; color: var(--text-muted); cursor: pointer; }
  .clear-btn:hover { color: var(--text-error, #ef4444); border-color: var(--text-error); }
</style>
