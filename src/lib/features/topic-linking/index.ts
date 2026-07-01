/**
 * Topic Linking feature module — public API barrel.
 * LDA-based topic modeling, PDF extraction, and web link processing.
 */

// Types
export type {
  LdaConfig,
  SamplingConfig,
  CorpusDocument,
  Topic,
  TopicKeyword,
  TopicDocument,
  TopicLinkingResult,
  ExtractedWebLink,
  TopicLinkingConfig,
} from './types';
export { DEFAULT_LDA_CONFIG, DEFAULT_SAMPLING_CONFIG, DEFAULT_TOPIC_LINKING_CONFIG } from './types';

// Services — text processing
export {
  stem,
  stripMarkdown,
  tokenize,
  sampleTokens,
  extractTags,
  extractUrls,
  buildDocument,
  matchesPattern,
  matchesTags,
} from './services/textProcessor';

// Services — LDA
export { buildVocabulary, runLda } from './services/ldaService';

// Services — topic linker
export {
  buildCorpus,
  linkTopics,
  generateTopicIndex,
  generateTopicNote,
  extractWebLinks,
  generateWebLinkNote,
  getTopicFolderPath,
} from './services/topicLinker';

// Stores
export {
  topicConfig,
  updateTopicConfig,
  resetTopicConfig,
  getTopicConfig,
  topicResult,
  topicRunning,
  runLinkTopics,
  runExtractWebLinks,
} from './stores/topicStore';
