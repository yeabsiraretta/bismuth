import { writable, derived, get } from 'svelte/store';
import {
  getFeeds,
  getArticles,
  refreshAllFeeds,
  addFeed,
  removeFeed,
  markArticleRead,
  toggleArticleStar,
  type RssFeed,
  type RssArticle,
} from '../services/rss';
import { log } from '@/utils/logger';

/** All subscribed feeds */
export const rssFeeds = writable<RssFeed[]>([]);

/** Articles for the currently viewed feed (or all) */
export const rssArticles = writable<RssArticle[]>([]);

/** Currently selected feed ID (null = all feeds) */
export const selectedFeedId = writable<string | null>(null);

/** Whether to show only unread articles */
export const showUnreadOnly = writable(false);

/** Loading state */
export const rssLoading = writable(false);

/** Currently reading article */
export const activeArticle = writable<RssArticle | null>(null);

/** Derived: total unread count across all feeds */
export const totalUnread = derived(rssFeeds, ($feeds) =>
  $feeds.reduce((sum, f) => sum + f.unreadCount, 0)
);

/** Derived: feeds organized by folder */
export const feedsByFolder = derived(rssFeeds, ($feeds) => {
  const grouped: Record<string, RssFeed[]> = { '': [] };
  for (const feed of $feeds) {
    const folder = feed.folder || '';
    if (!grouped[folder]) grouped[folder] = [];
    grouped[folder].push(feed);
  }
  return grouped;
});

/** Load all feeds from backend */
export async function loadFeeds(): Promise<void> {
  rssLoading.set(true);
  try {
    const feeds = await getFeeds();
    rssFeeds.set(feeds);
  } catch {
    rssFeeds.set([]);
  } finally {
    rssLoading.set(false);
  }
}

/** Load articles for current view (selected feed + filter) */
export async function loadArticles(offset = 0, limit = 50): Promise<void> {
  rssLoading.set(true);
  try {
    const feedId = get(selectedFeedId);
    const unreadOnly = get(showUnreadOnly);
    const articles = await getArticles(feedId, unreadOnly, limit, offset);
    if (offset === 0) {
      rssArticles.set(articles);
    } else {
      rssArticles.update(existing => [...existing, ...articles]);
    }
  } catch {
    if (offset === 0) rssArticles.set([]);
  } finally {
    rssLoading.set(false);
  }
}

/** Refresh all feeds and reload */
export async function refreshFeeds(): Promise<void> {
  rssLoading.set(true);
  try {
    const feeds = await refreshAllFeeds();
    rssFeeds.set(feeds);
    await loadArticles();
    log.info('RSS feeds refreshed', { count: feeds.length });
  } catch (error) {
    log.error('RSS refresh failed', error as Error);
  } finally {
    rssLoading.set(false);
  }
}

/** Subscribe to a new feed */
export async function subscribeFeed(url: string, folder?: string): Promise<void> {
  rssLoading.set(true);
  try {
    const feed = await addFeed(url, folder);
    rssFeeds.update(feeds => [...feeds, feed]);
    log.info('RSS feed added', { title: feed.title, url });
  } finally {
    rssLoading.set(false);
  }
}

/** Unsubscribe from a feed */
export async function unsubscribeFeed(feedId: string): Promise<void> {
  try {
    await removeFeed(feedId);
    rssFeeds.update(feeds => feeds.filter(f => f.id !== feedId));
    if (get(selectedFeedId) === feedId) {
      selectedFeedId.set(null);
    }
  } catch (error) {
    log.error('RSS unsubscribe failed', error as Error);
  }
}

/** Select a feed to view its articles */
export function selectFeed(feedId: string | null): void {
  selectedFeedId.set(feedId);
  loadArticles();
}

/** Open an article for reading */
export async function openArticle(article: RssArticle): Promise<void> {
  activeArticle.set(article);
  if (!article.read) {
    await markArticleRead(article.id, true);
    rssArticles.update(articles =>
      articles.map(a => a.id === article.id ? { ...a, read: true } : a)
    );
    rssFeeds.update(feeds =>
      feeds.map(f => f.id === article.feedId ? { ...f, unreadCount: Math.max(0, f.unreadCount - 1) } : f)
    );
  }
}

/** Toggle star on an article */
export async function starArticle(articleId: string): Promise<void> {
  const articles = get(rssArticles);
  const article = articles.find(a => a.id === articleId);
  if (!article) return;

  const newStarred = !article.starred;
  await toggleArticleStar(articleId, newStarred);
  rssArticles.update(all =>
    all.map(a => a.id === articleId ? { ...a, starred: newStarred } : a)
  );
}
