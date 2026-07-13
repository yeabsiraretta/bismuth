<script lang="ts">
  import { onMount } from 'svelte';
  import ContextMenu from '@/ui/context-menu.svelte';
  import Panel from '@/ui/panel.svelte';
  import { invokeCommand } from '@/ipc/invoke';
  import { isTauriAvailable } from '@/utils/platform';

  async function fetchText(url: string): Promise<string> {
    if (isTauriAvailable()) {
      try {
        return await invokeCommand<string>('fetch_url', { url });
      } catch (e) {
        throw new Error(`Tauri fetch failed: ${e}`);
      }
    }
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      throw new Error(`Fetch failed (CORS may block browser requests — use Tauri): ${e}`);
    }
  }

  interface FeedItem {
    title: string;
    link: string;
    pubDate: string;
    description: string;
  }

  interface Feed {
    url: string;
    title: string;
    items: FeedItem[];
    error?: string;
  }

  const RSS_KEY = 'bismuth:rss-feeds';

  function loadFeedUrls(): string[] {
    try {
      const raw = localStorage.getItem(RSS_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  }

  function saveFeedUrls(urls: string[]) {
    localStorage.setItem(RSS_KEY, JSON.stringify(urls));
  }

  let feedUrls = $state<string[]>(loadFeedUrls());
  let feeds = $state<Feed[]>([]);
  let newUrl = $state('');
  let loading = $state(false);

  function addFeed() {
    const url = newUrl.trim();
    if (!url || feedUrls.includes(url)) return;
    feedUrls = [...feedUrls, url];
    saveFeedUrls(feedUrls);
    newUrl = '';
    fetchFeed(url);
  }

  function removeFeed(url: string) {
    feedUrls = feedUrls.filter((u) => u !== url);
    feeds = feeds.filter((f) => f.url !== url);
    saveFeedUrls(feedUrls);
  }

  async function fetchFeed(url: string) {
    try {
      const text = await fetchText(url);
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/xml');

      const isAtom = !!doc.querySelector('feed');
      const title = isAtom
        ? (doc.querySelector('feed > title')?.textContent ?? url)
        : (doc.querySelector('channel > title')?.textContent ?? url);

      const entries = isAtom ? doc.querySelectorAll('entry') : doc.querySelectorAll('item');

      const items: FeedItem[] = Array.from(entries)
        .slice(0, 20)
        .map((el) => ({
          title: el.querySelector('title')?.textContent ?? '',
          link: isAtom
            ? (el.querySelector('link')?.getAttribute('href') ?? '')
            : (el.querySelector('link')?.textContent ?? ''),
          pubDate: el.querySelector(isAtom ? 'updated' : 'pubDate')?.textContent ?? '',
          description: (
            el.querySelector(isAtom ? 'summary' : 'description')?.textContent ?? ''
          ).slice(0, 200),
        }));

      feeds = [...feeds.filter((f) => f.url !== url), { url, title, items }];
    } catch (e) {
      feeds = [
        ...feeds.filter((f) => f.url !== url),
        { url, title: url, items: [], error: String(e) },
      ];
    }
  }

  async function refreshAll() {
    loading = true;
    await Promise.allSettled(feedUrls.map(fetchFeed));
    loading = false;
  }

  function formatDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  }

  onMount(() => {
    if (feedUrls.length > 0) refreshAll();
  });

  let ctxItem: FeedItem | null = $state(null);
  let ctxFeedUrl: string | null = $state(null);
  let ctxX = $state(0);
  let ctxY = $state(0);

  function handleItemContext(e: MouseEvent, item: FeedItem) {
    e.preventDefault();
    ctxItem = item;
    ctxFeedUrl = null;
    ctxX = e.clientX;
    ctxY = e.clientY;
  }

  function handleFeedContext(e: MouseEvent, url: string) {
    e.preventDefault();
    ctxFeedUrl = url;
    ctxItem = null;
    ctxX = e.clientX;
    ctxY = e.clientY;
  }

  function closeCtx() {
    ctxItem = null;
    ctxFeedUrl = null;
  }
</script>

<Panel title="RSS Feeds">
  {#snippet actions()}
    <button
      class="panel-action"
      onclick={refreshAll}
      aria-label="Refresh"
      title="Refresh feeds"
      disabled={loading}
    >
      ↻
    </button>
  {/snippet}

  <div class="rss-panel">
    <div class="rss-add">
      <input
        type="url"
        class="rss-input"
        placeholder="Feed URL..."
        bind:value={newUrl}
        onkeydown={(e) => e.key === 'Enter' && addFeed()}
      />
      <button class="rss-add-btn" onclick={addFeed} disabled={!newUrl.trim()}>+</button>
    </div>

    {#if feeds.length === 0 && feedUrls.length === 0}
      <div class="panel-empty">
        <p>No feeds added</p>
        <p class="panel-empty-hint">Add RSS or Atom feed URLs above</p>
      </div>
    {:else}
      {#each feeds as feed (feed.url)}
        <div class="rss-feed">
          <div
            class="rss-feed-header"
            role="group"
            oncontextmenu={(e) => handleFeedContext(e, feed.url)}
          >
            <span class="rss-feed-title">{feed.title}</span>
            <button class="rss-remove" onclick={() => removeFeed(feed.url)} title="Remove feed"
              >×</button
            >
          </div>
          {#if feed.error}
            <p class="rss-error">{feed.error}</p>
          {:else}
            <ul class="rss-items">
              {#each feed.items.slice(0, 10) as item (item.link)}
                <li>
                  <a
                    class="rss-item-link"
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    oncontextmenu={(e) => handleItemContext(e, item)}
                  >
                    <span class="rss-item-title">{item.title}</span>
                    <span class="rss-item-date">{formatDate(item.pubDate)}</span>
                  </a>
                </li>
              {/each}
            </ul>
          {/if}
        </div>
      {/each}
    {/if}
  </div>
</Panel>

<ContextMenu x={ctxX} y={ctxY} show={!!ctxItem} onclose={closeCtx}>
  <button
    class="ctx-item"
    onclick={() => {
      if (ctxItem?.link) window.open(ctxItem.link, '_blank');
      closeCtx();
    }}
    role="menuitem">Open Link</button
  >
  <button
    class="ctx-item"
    onclick={() => {
      if (ctxItem?.link) navigator.clipboard.writeText(ctxItem.link);
      closeCtx();
    }}
    role="menuitem">Copy Link</button
  >
  <button
    class="ctx-item"
    onclick={() => {
      if (ctxItem?.title) navigator.clipboard.writeText(ctxItem.title);
      closeCtx();
    }}
    role="menuitem">Copy Title</button
  >
</ContextMenu>

<ContextMenu x={ctxX} y={ctxY} show={!!ctxFeedUrl} onclose={closeCtx}>
  <button
    class="ctx-item"
    onclick={() => {
      if (ctxFeedUrl) navigator.clipboard.writeText(ctxFeedUrl);
      closeCtx();
    }}
    role="menuitem">Copy Feed URL</button
  >
  <div class="ctx-sep"></div>
  <button
    class="ctx-item ctx-danger"
    onclick={() => {
      if (ctxFeedUrl) removeFeed(ctxFeedUrl);
      closeCtx();
    }}
    role="menuitem">Remove Feed</button
  >
</ContextMenu>

<style>
  .rss-panel {
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .rss-add {
    display: flex;
    gap: 4px;
  }
  .rss-input {
    flex: 1;
    padding: 4px 8px;
    font-size: 0.7rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-surface);
    color: var(--color-text);
    outline: none;
  }
  .rss-input:focus {
    border-color: var(--color-accent);
  }
  .rss-add-btn {
    padding: 4px 8px;
    font-size: 0.75rem;
    border: 1px solid var(--color-accent);
    background: transparent;
    color: var(--color-accent);
    border-radius: var(--radius-s);
    cursor: pointer;
  }
  .rss-feed {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    overflow: hidden;
  }
  .rss-feed-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 8px;
    background: var(--color-surface);
    font-size: 0.7rem;
    font-weight: 600;
    min-width: 0;
  }
  .rss-feed-title {
    color: var(--color-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .rss-remove {
    background: none;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    font-size: 0.8rem;
  }
  .rss-error {
    padding: 6px 8px;
    font-size: 0.65rem;
    color: var(--color-error);
    margin: 0;
  }
  .rss-items {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .rss-item-link {
    display: flex;
    justify-content: space-between;
    gap: 6px;
    padding: 4px 8px;
    font-size: 0.65rem;
    text-decoration: none;
    color: var(--color-text);
  }
  .rss-item-link:hover {
    background: var(--color-surface-hover);
  }
  .rss-item-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .rss-item-date {
    flex-shrink: 0;
    color: var(--color-text-muted);
    font-size: 0.6rem;
  }
</style>
