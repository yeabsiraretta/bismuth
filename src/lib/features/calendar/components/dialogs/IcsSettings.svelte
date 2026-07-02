<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import {
    icsFeeds,
    addIcsFeed,
    removeIcsFeed,
    updateIcsFeed,
    fetchIcsFeed,
  } from '../../services/icsFeed';
  import type { IcsFeedConfig } from '../../types';

  export let onClose: (() => void) | undefined = undefined;

  let newName = '';
  let newUrl = '';
  let newColor = '#2563eb';
  let newProvider: IcsFeedConfig['provider'] = 'other';
  let adding = false;

  function detectProvider(url: string): IcsFeedConfig['provider'] {
    if (url.includes('google.com') || url.includes('googleapis.com')) return 'google';
    if (url.includes('icloud.com') || url.includes('apple.com')) return 'icloud';
    if (url.includes('outlook') || url.includes('office365') || url.includes('live.com'))
      return 'outlook';
    return 'other';
  }

  function handleUrlInput() {
    newProvider = detectProvider(newUrl);
    if (!newName && newProvider && newProvider !== 'other') {
      newName = newProvider.charAt(0).toUpperCase() + newProvider.slice(1) + ' Calendar';
    }
  }

  function handleAdd() {
    if (!newUrl.trim()) return;
    const name = newName.trim() || 'Calendar';
    addIcsFeed({
      name,
      url: newUrl.trim(),
      color: newColor,
      enabled: true,
      provider: newProvider,
      syncIntervalMinutes: 15,
    });
    newName = '';
    newUrl = '';
    newColor = '#2563eb';
    newProvider = 'other';
    adding = false;
  }

  function handleRemove(id: string) {
    removeIcsFeed(id);
  }

  function handleToggle(feed: IcsFeedConfig) {
    updateIcsFeed(feed.id, { enabled: !feed.enabled });
  }

  async function handleSync(id: string) {
    await fetchIcsFeed(id);
  }

  function providerLabel(provider?: string): string {
    switch (provider) {
      case 'google':
        return 'Google';
      case 'icloud':
        return 'iCloud';
      case 'outlook':
        return 'Outlook';
      default:
        return 'ICS';
    }
  }
</script>

<div class="ics-settings" role="dialog" aria-label="Calendar feed settings">
  <header class="settings-header">
    <h3>Internet Calendars</h3>
    <button class="btn-close" on:click={() => onClose?.()} aria-label="Close">
      <Icon name="x" size={16} />
    </button>
  </header>

  <div class="feed-list">
    {#each $icsFeeds as feed (feed.id)}
      <div class="feed-item" class:disabled={!feed.enabled}>
        <div class="feed-color" style="background: {feed.color}"></div>
        <div class="feed-info">
          <span class="feed-name">{feed.name}</span>
          <span class="feed-provider">{providerLabel(feed.provider)}</span>
          {#if feed.error}
            <span class="feed-error" title={feed.error}>Sync error</span>
          {/if}
          {#if feed.lastFetched}
            <span class="feed-synced"
              >Last synced: {new Date(feed.lastFetched).toLocaleTimeString()}</span
            >
          {/if}
        </div>
        <div class="feed-actions">
          <button
            class="btn-icon"
            on:click={() => handleToggle(feed)}
            title={feed.enabled ? 'Disable' : 'Enable'}
            aria-label={feed.enabled ? 'Disable feed' : 'Enable feed'}
          >
            <Icon name="toggle-left" size={14} />
          </button>
          <button
            class="btn-icon"
            on:click={() => handleSync(feed.id)}
            title="Sync now"
            aria-label="Sync feed"
          >
            <Icon name="refresh-cw" size={14} />
          </button>
          <button
            class="btn-icon danger"
            on:click={() => handleRemove(feed.id)}
            title="Remove"
            aria-label="Remove feed"
          >
            <Icon name="trash" size={14} />
          </button>
        </div>
      </div>
    {:else}
      <p class="empty-state">No calendar feeds configured.</p>
    {/each}
  </div>

  {#if adding}
    <div class="add-form">
      <div class="form-row">
        <label for="ics-url">URL</label>
        <input
          id="ics-url"
          type="url"
          bind:value={newUrl}
          on:input={handleUrlInput}
          placeholder="https://..."
        />
      </div>
      <div class="form-row">
        <label for="ics-name">Name</label>
        <input id="ics-name" type="text" bind:value={newName} placeholder="Calendar name" />
      </div>
      <div class="form-row">
        <label for="ics-color">Color</label>
        <input id="ics-color" type="color" bind:value={newColor} />
      </div>
      <div class="form-buttons">
        <button class="btn-secondary" on:click={() => (adding = false)}>Cancel</button>
        <button class="btn-primary" on:click={handleAdd} disabled={!newUrl.trim()}>Add Feed</button>
      </div>
    </div>
  {:else}
    <button class="btn-add-feed" on:click={() => (adding = true)}>
      <Icon name="plus" size={14} />
      Add Calendar Feed
    </button>
  {/if}
</div>

<style>
  .ics-settings {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    max-width: 480px;
  }

  .settings-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .settings-header h3 {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-normal);
  }
  .btn-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-muted);
    cursor: pointer;
  }
  .btn-close:hover {
    background: var(--background-modifier-hover);
  }
  .feed-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .feed-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    border-radius: var(--radius-s);
    background: var(--background-secondary);
  }
  .feed-item.disabled {
    opacity: 0.5;
  }
  .feed-color {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .feed-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }
  .feed-name {
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--text-normal);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .feed-provider {
    font-size: 0.65rem;
    color: var(--text-faint);
  }
  .feed-error {
    font-size: 0.65rem;
    color: var(--color-error, #ef4444);
  }
  .feed-synced {
    font-size: 0.6rem;
    color: var(--text-faint);
  }
  .feed-actions {
    display: flex;
    gap: 2px;
    flex-shrink: 0;
  }
  .btn-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border: none;
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-muted);
    cursor: pointer;
  }
  .btn-icon:hover {
    background: var(--background-modifier-hover);
    color: var(--text-normal);
  }
  .btn-icon.danger:hover {
    color: var(--color-error, #ef4444);
  }
  .empty-state {
    font-size: 0.8rem;
    color: var(--text-faint);
    text-align: center;
    padding: 16px;
    margin: 0;
  }
  .add-form {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .form-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .form-row label {
    width: 48px;
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--text-muted);
    flex-shrink: 0;
  }
  .form-row input[type='url'],
  .form-row input[type='text'] {
    flex: 1;
    padding: 6px 8px;
    font-size: 0.8rem;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    background: var(--background-primary);
    color: var(--text-normal);
  }
  .form-row input[type='color'] {
    width: 32px;
    height: 28px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    cursor: pointer;
    padding: 2px;
  }
  .form-buttons {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }
  .btn-secondary,
  .btn-primary {
    padding: 6px 14px;
    font-size: 0.75rem;
    font-weight: 500;
    border-radius: var(--radius-s);
    cursor: pointer;
    border: 1px solid var(--border-color);
  }
  .btn-secondary {
    background: var(--background-primary);
    color: var(--text-normal);
  }
  .btn-primary {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    border-color: var(--interactive-accent);
  }
  .btn-primary:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .btn-add-feed {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    font-size: 0.8rem;
    font-weight: 500;
    border: 1px dashed var(--border-color);
    border-radius: var(--radius-s);
    background: none;
    color: var(--text-muted);
    cursor: pointer;
  }
  .btn-add-feed:hover {
    border-color: var(--interactive-accent);
    color: var(--interactive-accent);
    background: var(--background-modifier-hover);
  }
</style>
