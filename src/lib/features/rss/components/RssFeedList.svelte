<script lang="ts">
  import { onMount } from 'svelte';
  import PanelHeader from '@/components/ui/layout/PanelHeader.svelte';
  import ActionButton from '@/components/ui/actions/ActionButton.svelte';
  import Icon from '@/components/icons/Icon.svelte';
  import {
    rssFeeds,
    selectedFeedId,
    totalUnread,
    feedsByFolder,
    rssLoading,
    loadFeeds,
    refreshFeeds,
    subscribeFeed,
    unsubscribeFeed,
    selectFeed,
  } from '../stores/rss';
  import { setViewportMode } from '@/stores/layout/presets';

  let addFeedUrl = '';
  let showAddForm = false;

  onMount(() => {
    loadFeeds();
  });

  async function handleAddFeed() {
    if (!addFeedUrl.trim()) return;
    await subscribeFeed(addFeedUrl.trim());
    addFeedUrl = '';
    showAddForm = false;
  }

  function handleSelectFeed(feedId: string | null) {
    selectFeed(feedId);
    setViewportMode('rss');
  }
</script>

<div class="rss-panel" role="tabpanel" aria-label="RSS Feeds">
  <PanelHeader icon="rss" title="RSS" count={$totalUnread || undefined}>
    <svelte:fragment slot="actions">
      <ActionButton
        icon="plus"
        title="Add feed"
        on:click={() => {
          showAddForm = !showAddForm;
        }}
      />
      <ActionButton icon="refresh-cw" title="Refresh all" on:click={refreshFeeds} />
    </svelte:fragment>
  </PanelHeader>

  <div class="panel-body">
    {#if showAddForm}
      <div class="add-form">
        <input
          class="add-input"
          bind:value={addFeedUrl}
          placeholder="Feed URL..."
          on:keydown={(e) => e.key === 'Enter' && handleAddFeed()}
        />
        <button class="add-btn" on:click={handleAddFeed} disabled={!addFeedUrl.trim()}>
          Add
        </button>
      </div>
    {/if}

    {#if $rssLoading && $rssFeeds.length === 0}
      <div class="loading">
        <Icon name="loader" size={20} />
        <span>Loading feeds...</span>
      </div>
    {:else if $rssFeeds.length === 0}
      <div class="empty-state">
        <Icon name="rss" size={28} />
        <p>No feeds subscribed</p>
        <p class="hint">Click + to add an RSS or Atom feed</p>
      </div>
    {:else}
      <button
        class="feed-item all"
        class:active={$selectedFeedId === null}
        on:click={() => handleSelectFeed(null)}
      >
        <Icon name="inbox" size={14} />
        <span class="feed-title">All Articles</span>
        {#if $totalUnread > 0}
          <span class="unread-badge">{$totalUnread}</span>
        {/if}
      </button>

      {#each Object.entries($feedsByFolder) as [folder, feeds]}
        {#if folder}
          <div class="folder-header">
            <Icon name="folder" size={12} />
            <span>{folder}</span>
          </div>
        {/if}
        {#each feeds as feed}
          <div class="feed-row">
            <button
              class="feed-item"
              class:active={$selectedFeedId === feed.id}
              on:click={() => handleSelectFeed(feed.id)}
            >
              <Icon name="rss" size={12} />
              <span class="feed-title">{feed.title}</span>
              {#if feed.unreadCount > 0}
                <span class="unread-badge">{feed.unreadCount}</span>
              {/if}
            </button>
            <button
              class="remove-btn"
              title="Unsubscribe"
              on:click={() => unsubscribeFeed(feed.id)}
            >
              <Icon name="x" size={10} />
            </button>
          </div>
        {/each}
      {/each}
    {/if}
  </div>
</div>

<style>
  .rss-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .panel-body {
    padding: 8px;
    overflow-y: auto;
    flex: 1;
  }
  .add-form {
    display: flex;
    gap: 4px;
    padding: 4px 0 8px;
  }
  .add-input {
    flex: 1;
    padding: 6px 8px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background: var(--input-bg);
    color: var(--text-primary);
    font-size: 12px;
  }
  .add-btn {
    padding: 6px 12px;
    border: none;
    border-radius: 4px;
    background: var(--accent-color, #6366f1);
    color: white;
    font-size: 12px;
    cursor: pointer;
  }
  .add-btn:disabled {
    opacity: 0.5;
  }
  .loading,
  .empty-state {
    text-align: center;
    padding: 24px;
    color: var(--text-muted);
  }
  .empty-state p {
    margin: 4px 0;
    font-size: 12px;
  }
  .hint {
    font-size: 11px;
    opacity: 0.7;
  }
  .feed-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 7px 10px;
    background: none;
    border: none;
    border-radius: 4px;
    color: var(--text-primary);
    cursor: pointer;
    font-size: 12px;
    text-align: left;
  }
  .feed-item:hover {
    background: var(--hover-bg);
  }
  .feed-item.active {
    background: var(--accent-bg, rgba(99, 102, 241, 0.1));
  }
  .feed-title {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .unread-badge {
    font-size: 10px;
    padding: 1px 6px;
    border-radius: 10px;
    background: var(--accent-color, #6366f1);
    color: white;
    font-weight: 600;
  }
  .folder-header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 10px 4px;
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
  }
  .feed-row {
    display: flex;
    align-items: center;
  }
  .feed-row .feed-item {
    flex: 1;
  }
  .remove-btn {
    background: none;
    border: none;
    padding: 4px;
    border-radius: 4px;
    cursor: pointer;
    color: var(--text-muted);
    opacity: 0;
  }
  .feed-row:hover .remove-btn {
    opacity: 1;
  }
  .remove-btn:hover {
    color: var(--error-color, #f87171);
    background: var(--hover-bg);
  }
</style>
