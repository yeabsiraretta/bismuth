/**
 * Footnotes feature module — markdown footnote insertion, navigation,
 * autocomplete, and live preview integration.
 */

// Services
export {
  insertNumberedFootnote,
  insertNamedFootnote,
  jumpToReference,
  jumpToDetail,
  extractFootnotes,
  nextFootnoteIndex,
  getFootnoteIds,
  getFootnoteSectionHeading,
  setFootnoteSectionHeading,
} from './services/footnoteService';
export type { FootnoteInfo } from './services/footnoteService';

// Extensions
export { footnoteExtension, footnoteKeymap } from './extensions/footnoteExtension';
