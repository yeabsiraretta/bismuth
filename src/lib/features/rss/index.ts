/**
 * RSS feed reader feature module.
 * Public API barrel.
 */

// Types (re-exported from service)
export type { RssFeed, RssArticle, OpmlFeed } from './services/rss';

// Stores
export {
  rssFeeds,
  rssArticles,
  selectedFeedId,
  activeArticle,
  rssLoading,
  totalUnread,
  showUnreadOnly,
  feedsByFolder,
  loadFeeds,
  refreshFeeds,
  subscribeFeed,
  unsubscribeFeed,
  selectFeed,
  loadArticles,
  openArticle,
  starArticle,
} from './stores/rss';

// Services
export {
  addFeed,
  removeFeed,
  refreshAllFeeds,
  refreshFeed,
  getFeeds,
  getArticles,
  markArticleRead,
  toggleArticleStar,
  importOpml,
  exportOpml,
  saveArticleToVault,
} from './services/rss';

// Components
export { default as RssFeedList } from './components/RssFeedList.svelte';
export { default as RssViewport } from './components/RssViewport.svelte';
