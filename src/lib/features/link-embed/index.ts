/**
 * Link Embed — rich URL previews in fenced code blocks.
 */

// Types
export type {
  LinkEmbedData, LinkEmbedParser, LinkEmbedSettings,
} from './types';
export {
  DEFAULT_LINK_EMBED_SETTINGS, parseLinkEmbedBlock, serializeLinkEmbedData,
} from './types';

// Services
export {
  fetchLinkMetadata, buildEmbedCodeBlock, buildMarkdownLinkFromEmbed,
  clearLinkEmbedCache,
} from './services/linkEmbedService';

// Extensions
export { LinkEmbedWidget } from './extensions/linkEmbedWidget';
