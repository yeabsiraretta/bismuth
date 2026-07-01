<script lang="ts">
  import { onMount } from 'svelte';
  import PanelHeader from '@/components/ui/layout/PanelHeader.svelte';
  import ActionButton from '@/components/ui/actions/ActionButton.svelte';
  import Icon from '@/components/icons/Icon.svelte';
  import DeploySettings from './DeploySettings.svelte';
  import {
    publishableNotes,
    publishLoading,
    publishHistory,
    publishStats,
    siteSettings,
    refreshPublishableNotes,
    updateSiteSettings,
    publishAll,
    unpublishAll,
  } from '../stores/publishing';

  type DashView = 'notes' | 'settings' | 'history' | 'deploy';

  let activeView: DashView = 'notes';

  onMount(() => {
    refreshPublishableNotes();
  });
</script>

<div class="pub-dashboard" role="tabpanel" aria-label="Publication Center">
  <PanelHeader icon="globe" title="Publishing" count={$publishStats.total || undefined}>
    <svelte:fragment slot="actions">
      <ActionButton icon="refresh-cw" title="Refresh" on:click={refreshPublishableNotes} />
      <ActionButton icon="upload" title="Publish all" on:click={publishAll} />
      <ActionButton icon="x-circle" title="Unpublish all" on:click={unpublishAll} />
    </svelte:fragment>
  </PanelHeader>

  <div class="panel-body">
    <div class="view-tabs">
      <button
        class="tab"
        class:active={activeView === 'notes'}
        on:click={() => {
          activeView = 'notes';
        }}
      >
        Notes
      </button>
      <button
        class="tab"
        class:active={activeView === 'settings'}
        on:click={() => {
          activeView = 'settings';
        }}
      >
        Settings
      </button>
      <button
        class="tab"
        class:active={activeView === 'history'}
        on:click={() => {
          activeView = 'history';
        }}
      >
        History
      </button>
      <button
        class="tab"
        class:active={activeView === 'deploy'}
        on:click={() => {
          activeView = 'deploy';
        }}
      >
        Deploy
      </button>
    </div>

    {#if activeView === 'notes'}
      <div class="stats-bar">
        <span class="stat">{$publishStats.total} total</span>
        <span class="stat">{$publishStats.published} published</span>
        <span class="stat">{$publishStats.draft} drafts</span>
      </div>

      {#if $publishLoading}
        <div class="loading"><Icon name="loader" size={20} /></div>
      {:else if $publishableNotes.length === 0}
        <div class="empty-state">
          <Icon name="globe" size={28} />
          <p>No publishable notes</p>
          <p class="hint">Add <code>publish: true</code> to note frontmatter</p>
        </div>
      {:else}
        <div class="note-list">
          {#each $publishableNotes as note}
            <div class="note-item">
              <Icon name="file" size={12} />
              <span class="note-path">{note.path}</span>
            </div>
          {/each}
        </div>
      {/if}
    {:else if activeView === 'settings'}
      <div class="settings-form">
        <label class="field">
          <span class="field-label">Site Title</span>
          <input
            class="field-input"
            value={$siteSettings.title}
            on:change={(e) => updateSiteSettings({ title: e.currentTarget.value })}
          />
        </label>
        <label class="field">
          <span class="field-label">Description</span>
          <input
            class="field-input"
            value={$siteSettings.description}
            on:change={(e) => updateSiteSettings({ description: e.currentTarget.value })}
          />
        </label>
        <label class="field">
          <span class="field-label">Output Format</span>
          <select
            class="field-input"
            value={$siteSettings.outputFormat}
            on:change={(e) =>
              updateSiteSettings({
                outputFormat: e.currentTarget.value as 'html' | 'markdown' | 'json',
              })}
          >
            <option value="html">HTML</option>
            <option value="markdown">Markdown</option>
            <option value="json">JSON</option>
          </select>
        </label>
      </div>
    {:else if activeView === 'history'}
      {#if $publishHistory.length === 0}
        <div class="empty-state"><p>No publish history yet</p></div>
      {:else}
        <div class="history-list">
          {#each $publishHistory.slice(0, 20) as entry}
            <div class="history-item" class:error={entry.status === 'error'}>
              <Icon name={entry.status === 'success' ? 'check-circle' : 'alert-circle'} size={12} />
              <div class="history-content">
                <span class="history-msg">{entry.message}</span>
                <span class="history-time">{new Date(entry.timestamp).toLocaleString()}</span>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    {:else if activeView === 'deploy'}
      <DeploySettings />
    {/if}
  </div>
</div>

<style>
  .pub-dashboard {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .panel-body {
    padding: 8px;
    overflow-y: auto;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .view-tabs {
    display: flex;
    gap: 2px;
    background: var(--panel-bg-alt);
    border-radius: 6px;
    padding: 2px;
  }
  .tab {
    flex: 1;
    padding: 6px;
    border: none;
    border-radius: 4px;
    background: none;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 11px;
  }
  .tab:hover {
    color: var(--text-primary);
  }
  .tab.active {
    background: var(--accent-color, #6366f1);
    color: white;
  }
  .stats-bar {
    display: flex;
    gap: 12px;
    padding: 8px 0;
  }
  .stat {
    font-size: 11px;
    color: var(--text-muted);
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
  .note-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .note-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 10px;
    border-radius: 4px;
    font-size: 12px;
  }
  .note-item:hover {
    background: var(--hover-bg);
  }
  .note-path {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .settings-form {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 8px 0;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .field-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
  }
  .field-input {
    padding: 6px 8px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background: var(--input-bg);
    color: var(--text-primary);
    font-size: 12px;
  }
  .history-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .history-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 8px;
    border-radius: 4px;
    border: 1px solid var(--border-color);
  }
  .history-item.error {
    border-color: var(--error-color, #f87171);
  }
  .history-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .history-msg {
    font-size: 12px;
  }
  .history-time {
    font-size: 10px;
    color: var(--text-muted);
  }
</style>
