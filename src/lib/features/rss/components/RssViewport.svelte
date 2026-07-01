<script lang="ts">
  import { onMount } from 'svelte';
  import DOMPurify from 'dompurify';
  import Icon from '@/components/icons/Icon.svelte';
  import {
    rssArticles,
    activeArticle,
    rssLoading,
    showUnreadOnly,
    loadArticles,
    openArticle,
    starArticle,
  } from '../stores/rss';
  import { saveArticleToVault } from '../services/rss';
  import { setViewportMode } from '@/stores/layout/presets';
  import type { RssArticle } from '../services/rss';
  import { log } from '@/utils/logger';

  onMount(() => { loadArticles(); });

  let savedConfirmId: string | null = null;

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  function handleBack() {
    setViewportMode('note');
  }

  function handleSelectArticle(article: RssArticle) {
    openArticle(article);
  }

  function toggleUnread() {
    $showUnreadOnly = !$showUnreadOnly;
    loadArticles();
  }

  async function handleSaveToVault(article: RssArticle) {
    try {
      await saveArticleToVault(article);
      savedConfirmId = article.id;
      setTimeout(() => { savedConfirmId = null; }, 2000);
    } catch (error) {
      log.error('RssViewport: save to vault failed', error as Error);
    }
  }
</script>

<div class="rss-viewport">
  <div class="rss-toolbar">
    <button class="back-btn" on:click={handleBack} title="Back to editor">
      <Icon name="arrow-left" size={14} />
      Editor
    </button>
    <div class="toolbar-spacer"></div>
    <button class="filter-btn" class:active={$showUnreadOnly} on:click={toggleUnread}>
      {$showUnreadOnly ? 'Unread' : 'All'}
    </button>
  </div>

  <div class="rss-content">
    <div class="article-list" class:collapsed={$activeArticle !== null}>
      {#if $rssLoading && $rssArticles.length === 0}
        <div class="loading"><Icon name="loader" size={20} /></div>
      {:else if $rssArticles.length === 0}
        <div class="empty">
          <Icon name="rss" size={32} />
          <p>No articles</p>
        </div>
      {:else}
        {#each $rssArticles as article}
          <button
            class="article-item"
            class:unread={!article.read}
            class:active={$activeArticle?.id === article.id}
            on:click={() => handleSelectArticle(article)}
          >
            <div class="article-header">
              <span class="article-title">{article.title}</span>
              {#if article.starred}
                <Icon name="star" size={12} />
              {/if}
            </div>
            {#if article.summary}
              <p class="article-summary">{article.summary.slice(0, 120)}</p>
            {/if}
            <div class="article-meta">
              {#if article.author}<span>{article.author}</span>{/if}
              <span>{formatDate(article.publishedAt)}</span>
            </div>
          </button>
        {/each}
      {/if}
    </div>

    {#if $activeArticle}
      <div class="reading-pane">
        <div class="reading-header">
          <h2>{$activeArticle.title}</h2>
          <div class="reading-meta">
            {#if $activeArticle.author}<span>By {$activeArticle.author}</span>{/if}
            <span>{formatDate($activeArticle.publishedAt)}</span>
          </div>
          <div class="reading-actions">
            <button
              class="action-btn"
              class:starred={$activeArticle.starred}
              on:click={() => starArticle($activeArticle?.id ?? '')}
              title={$activeArticle.starred ? 'Unstar' : 'Star'}
            >
              <Icon name="star" size={14} />
            </button>
            <button
              class="action-btn"
              class:saved={savedConfirmId === $activeArticle.id}
              on:click={() => handleSaveToVault($activeArticle)}
              title="Save to vault"
            >
              <Icon name="download" size={14} />
              {savedConfirmId === $activeArticle.id ? 'Saved' : 'Save to Vault'}
            </button>
            {#if $activeArticle.url}
              <a class="action-btn" href={$activeArticle.url} target="_blank" rel="noopener noreferrer" title="Open in browser">
                <Icon name="external-link" size={14} />
              </a>
            {/if}
          </div>
        </div>
        <div class="reading-body">
          {#if $activeArticle.content}
            <!-- eslint-disable-next-line svelte/no-at-html-tags -- Content sanitized by DOMPurify -->
            {@html DOMPurify.sanitize($activeArticle.content, { FORBID_TAGS: ['style'], FORBID_ATTR: ['onerror', 'onload', 'onclick'] })}
          {:else if $activeArticle.summary}
            <p>{$activeArticle.summary}</p>
          {:else}
            <p class="no-content">No content available. <a href={$activeArticle.url} target="_blank" rel="noopener noreferrer">Open in browser</a></p>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .rss-viewport { display: flex; flex-direction: column; height: 100%; background: var(--panel-bg); }
  .rss-toolbar {
    display: flex; align-items: center; gap: 8px; padding: 8px 12px;
    border-bottom: 1px solid var(--border-color);
  }
  .back-btn {
    display: flex; align-items: center; gap: 6px; background: none; border: none;
    color: var(--text-muted); cursor: pointer; font-size: 12px; padding: 4px 8px; border-radius: 4px;
  }
  .back-btn:hover { background: var(--hover-bg); color: var(--text-primary); }
  .toolbar-spacer { flex: 1; }
  .filter-btn {
    padding: 4px 10px; border: 1px solid var(--border-color); border-radius: 4px;
    background: none; color: var(--text-primary); font-size: 11px; cursor: pointer;
  }
  .filter-btn.active { background: var(--accent-bg); border-color: var(--accent-color); }
  .rss-content { display: flex; flex: 1; overflow: hidden; }
  .article-list {
    width: 320px; min-width: 240px; border-right: 1px solid var(--border-color);
    overflow-y: auto; display: flex; flex-direction: column;
  }
  .article-list.collapsed { width: 0; min-width: 0; overflow: hidden; }
  .article-item {
    display: flex; flex-direction: column; gap: 4px; padding: 10px 12px;
    border-bottom: 1px solid var(--border-color); background: none; border-left: none;
    border-right: none; border-top: none; text-align: left; cursor: pointer; width: 100%;
  }
  .article-item:hover { background: var(--hover-bg); }
  .article-item.active { background: var(--accent-bg); }
  .article-item.unread .article-title { font-weight: 600; }
  .article-header { display: flex; align-items: flex-start; gap: 6px; }
  .article-title { font-size: 12px; flex: 1; line-height: 1.3; }
  .article-summary { font-size: 11px; color: var(--text-muted); line-height: 1.4; margin: 0; }
  .article-meta { display: flex; gap: 8px; font-size: 10px; color: var(--text-muted); }
  .reading-pane { flex: 1; overflow-y: auto; padding: 24px; }
  .reading-header { margin-bottom: 16px; }
  .reading-header h2 { font-size: 20px; margin: 0 0 8px; line-height: 1.3; }
  .reading-meta { font-size: 12px; color: var(--text-muted); display: flex; gap: 12px; }
  .reading-actions { display: flex; gap: 8px; margin-top: 12px; }
  .action-btn {
    display: flex; align-items: center; gap: 4px; padding: 4px 8px;
    border: 1px solid var(--border-color); border-radius: 4px;
    background: none; color: var(--text-primary); cursor: pointer; text-decoration: none;
  }
  .action-btn:hover { background: var(--hover-bg); }
  .action-btn.starred { color: #eab308; border-color: #eab308; }
  .action-btn.saved { background: var(--accent-bg); color: var(--accent-color); border-color: var(--accent-color); }
  .reading-body { font-size: 14px; line-height: 1.7; }
  .reading-body :global(img) { max-width: 100%; border-radius: 4px; }
  .loading, .empty { padding: 32px; text-align: center; color: var(--text-muted); }
  .no-content { color: var(--text-muted); }
</style>
