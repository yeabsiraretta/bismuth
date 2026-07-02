import { invoke } from '@tauri-apps/api/core';
import { log } from '@/utils/logger';

export interface RssFeed {
  id: string;
  title: string;
  url: string;
  siteUrl: string | null;
  folder: string | null;
  lastFetched: string | null;
  unreadCount: number;
}

export interface RssArticle {
  id: string;
  feedId: string;
  title: string;
  url: string;
  author: string | null;
  publishedAt: string;
  summary: string | null;
  content: string | null;
  read: boolean;
  starred: boolean;
}

export interface OpmlFeed {
  title: string;
  xmlUrl: string;
  htmlUrl: string | null;
  folder: string | null;
}

/** Add a new RSS/Atom feed by URL */
export async function addFeed(url: string, folder?: string): Promise<RssFeed> {
  log.info('RSS: adding feed', { url });
  try {
    return await invoke<RssFeed>('rss_add_feed', { url, folder: folder ?? null });
  } catch (error) {
    log.error('RSS: failed to add feed', error as Error, { url });
    throw new Error(`Failed to add feed: ${error}`);
  }
}

/** Remove a feed and all its cached articles */
export async function removeFeed(feedId: string): Promise<void> {
  log.info('RSS: removing feed', { feedId });
  try {
    await invoke('rss_remove_feed', { feedId });
  } catch (error) {
    log.error('RSS: failed to remove feed', error as Error);
    throw new Error(`Failed to remove feed: ${error}`);
  }
}

/** Fetch new articles for all feeds */
export async function refreshAllFeeds(): Promise<RssFeed[]> {
  log.info('RSS: refreshing all feeds');
  try {
    return await invoke<RssFeed[]>('rss_refresh_all');
  } catch (error) {
    log.error('RSS: refresh failed', error as Error);
    throw new Error(`Failed to refresh feeds: ${error}`);
  }
}

/** Fetch new articles for a single feed */
export async function refreshFeed(feedId: string): Promise<RssFeed> {
  try {
    return await invoke<RssFeed>('rss_refresh_feed', { feedId });
  } catch (error) {
    log.error('RSS: feed refresh failed', error as Error, { feedId });
    throw new Error(`Failed to refresh feed: ${error}`);
  }
}

/** Get all subscribed feeds */
export async function getFeeds(): Promise<RssFeed[]> {
  try {
    return await invoke<RssFeed[]>('rss_get_feeds');
  } catch (error) {
    log.error('RSS: failed to get feeds', error as Error);
    throw new Error(`Failed to get feeds: ${error}`);
  }
}

/** Get articles for a feed (paginated) */
export async function getArticles(
  feedId: string | null,
  unreadOnly: boolean,
  limit: number,
  offset: number
): Promise<RssArticle[]> {
  try {
    return await invoke<RssArticle[]>('rss_get_articles', {
      feedId,
      unreadOnly,
      limit,
      offset,
    });
  } catch (error) {
    log.error('RSS: failed to get articles', error as Error);
    throw new Error(`Failed to get articles: ${error}`);
  }
}

/** Mark an article as read/unread */
export async function markArticleRead(articleId: string, read: boolean): Promise<void> {
  try {
    await invoke('rss_mark_read', { articleId, read });
  } catch (error) {
    log.error('RSS: failed to mark read', error as Error);
    throw new Error(`Failed to mark article: ${error}`);
  }
}

/** Star/unstar an article */
export async function toggleArticleStar(articleId: string, starred: boolean): Promise<void> {
  try {
    await invoke('rss_toggle_star', { articleId, starred });
  } catch (error) {
    log.error('RSS: failed to toggle star', error as Error);
    throw new Error(`Failed to star article: ${error}`);
  }
}

/** Import feeds from OPML file content */
export async function importOpml(opmlContent: string): Promise<RssFeed[]> {
  log.info('RSS: importing OPML');
  try {
    return await invoke<RssFeed[]>('rss_import_opml', { opmlContent });
  } catch (error) {
    log.error('RSS: OPML import failed', error as Error);
    throw new Error(`Failed to import OPML: ${error}`);
  }
}

/** Export subscriptions as OPML */
export async function exportOpml(): Promise<string> {
  try {
    return await invoke<string>('rss_export_opml');
  } catch (error) {
    log.error('RSS: OPML export failed', error as Error);
    throw new Error(`Failed to export OPML: ${error}`);
  }
}

/** Save an RSS article as a vault note with frontmatter */
export async function saveArticleToVault(article: RssArticle): Promise<void> {
  const slug = article.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const date = new Date().toISOString().split('T')[0];
  const path = `rss/${article.feedId}/${slug}.md`;
  const content = `---\ntitle: "${article.title}"\nsource: "${article.url}"\ndate: "${date}"\ntags: [rss]\n---\n\n${article.content ?? article.summary ?? ''}`;

  log.info('RSS: saving article to vault');
  try {
    await invoke('create_note', { path, content });
  } catch (error) {
    log.error('RSS: failed to save article to vault', error as Error);
    throw new Error('Failed to save article to vault');
  }
}
