/**
 * Journal Review — "On This Day" note anniversary review.
 * Reviews all vault notes by creation date, showing entries from
 * configurable time spans (1 month, 6 months, 1 year recurring, etc.).
 */

// Types
export type {
  ReviewUnit,
  ReviewTimeSpan,
  ReviewEntry,
  ReviewGroup,
  ReviewDisplayOptions,
  ReviewConfig,
} from './types/review';
export { DEFAULT_TIME_SPANS, DEFAULT_REVIEW_CONFIG } from './types/review';

// Services — Frontmatter
export {
  parseFrontmatter,
  extractBody,
  extractCreatedDate,
  parseFlexibleDate,
  extractPreview,
  extractTags,
  extractTitle,
  generateCreatedFrontmatter,
  ensureCreatedField,
  getFileType,
} from './services/reviewFrontmatter';

// Services — Matcher
export type { VaultNote } from './services/reviewMatcher';
export {
  subtractSpan,
  getTargetDates,
  datesMatchWithMargin,
  sameMonthDay,
  formatTimeSpanLabel,
  humanizeTimeAgo,
  timeAgoFromDate,
  buildReviewEntry,
  matchNotesToTimeSpans,
  shouldExcludeFile,
  pickRandomNote,
} from './services/reviewMatcher';

// Stores
export type { ReviewState } from './stores/reviewStore';
export {
  reviewConfig,
  updateReviewConfig,
  reviewState,
  reviewGroups,
  reviewRandomNote,
  reviewLoading,
  reviewTotalEntries,
  runReview,
  refreshRandomNote,
  clearReview,
  scheduleMidnightRefresh,
  clearMidnightRefresh,
} from './stores/reviewStore';

// Components
export { default as ReviewPanel } from './components/ReviewPanel.svelte';
