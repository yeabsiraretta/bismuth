/**
 * Topic Linking types — LDA topic modeling, document corpus,
 * PDF extraction, web link extraction, and configuration.
 *
 * Inspired by the Obsidian Topic Linking Plugin.
 */

// ─── LDA configuration ────────────────────────────────────────────────────────

export interface LdaConfig {
  /** Number of topics to generate */
  numTopics: number;
  /** Number of keyword words per topic */
  numWords: number;
  /** Number of Gibbs sampling iterations */
  iterations: number;
  /** Burn-in iterations to discard */
  burnIn: number;
  /** Thinning interval */
  thin: number;
  /** Document-topic Dirichlet prior */
  alpha: number;
  /** Topic-word Dirichlet prior */
  beta: number;
}

export const DEFAULT_LDA_CONFIG: LdaConfig = {
  numTopics: 10,
  numWords: 10,
  iterations: 200,
  burnIn: 50,
  thin: 5,
  alpha: 0.1,
  beta: 0.01,
};

// ─── Text sampling ────────────────────────────────────────────────────────────

export interface SamplingConfig {
  /** Fixed number of words to sample from each document (0 = all) */
  fixedWordCount: number;
  /** Percentage of text to sample (0 = all; overridden by fixedWordCount) */
  percentageOfText: number;
  /** Whether to randomise which words are sampled */
  randomise: boolean;
  /** Whether to apply stemming to tokens */
  stemming: boolean;
}

export const DEFAULT_SAMPLING_CONFIG: SamplingConfig = {
  fixedWordCount: 0,
  percentageOfText: 0,
  randomise: false,
  stemming: false,
};

// ─── Document corpus ───────────────────────────────────────────────────────────

/** A document in the corpus for topic modeling. */
export interface CorpusDocument {
  /** File path relative to vault root */
  path: string;
  /** Display title */
  title: string;
  /** Raw text content */
  content: string;
  /** Tokenized words after processing */
  tokens: string[];
  /** Tags extracted from the document */
  tags: string[];
}

// ─── Topic results ─────────────────────────────────────────────────────────────

/** A single discovered topic. */
export interface Topic {
  /** Topic index */
  id: number;
  /** Auto-generated label from top keywords */
  label: string;
  /** Top keywords with their weights */
  keywords: TopicKeyword[];
  /** Documents relevant to this topic, with probability scores */
  documents: TopicDocument[];
}

/** A keyword associated with a topic. */
export interface TopicKeyword {
  word: string;
  weight: number;
}

/** A document associated with a topic. */
export interface TopicDocument {
  path: string;
  title: string;
  probability: number;
}

/** Full result from a topic linking run. */
export interface TopicLinkingResult {
  topics: Topic[];
  /** Total documents processed */
  documentCount: number;
  /** Timestamp of the analysis */
  timestamp: number;
  /** Config used for this run */
  config: TopicLinkingConfig;
}

// ─── Web link extraction ───────────────────────────────────────────────────────

export interface ExtractedWebLink {
  url: string;
  /** Source file where the link was found */
  sourcePath: string;
  /** Display text or title */
  displayText?: string;
}

// ─── Plugin config ─────────────────────────────────────────────────────────────

export interface TopicLinkingConfig {
  /** Folder for generated markdown from PDFs/web */
  generatedFolder: string;
  /** Folder containing PDF source files */
  pdfFolder: string;
  /** Folder containing bookmark files */
  bookmarkFolder: string;
  /** Output folder for topic notes */
  topicFolder: string;
  /** Glob-style pattern for files to include in topic model */
  topicFilePattern: string;
  /** Additional string filter for file contents */
  topicSearchPattern: string;
  /** Tag filter (space-separated) */
  topicTagPattern: string;
  /** Minimum probability for a document to be relevant to a topic */
  topicThreshold: number;
  /** Whether to include file pattern in topic folder name */
  includePatternInFolder: boolean;
  /** Whether to include timestamp in topic folder name */
  includeTimestampInFolder: boolean;
  /** Overwrite existing generated content */
  overwriteGenerated: boolean;
  /** Max PDF files to process (0 = unlimited) */
  limitFileNumber: number;
  /** Max file size in KB (0 = unlimited) */
  limitFileSize: number;
  /** Chunk large files */
  chunkLargeFiles: boolean;
  /** LDA model parameters */
  lda: LdaConfig;
  /** Text sampling parameters */
  sampling: SamplingConfig;
}

export const DEFAULT_TOPIC_LINKING_CONFIG: TopicLinkingConfig = {
  generatedFolder: 'Generated',
  pdfFolder: 'PDFs',
  bookmarkFolder: 'Bookmarks',
  topicFolder: 'Topics',
  topicFilePattern: '',
  topicSearchPattern: '',
  topicTagPattern: '',
  topicThreshold: 0.1,
  includePatternInFolder: false,
  includeTimestampInFolder: false,
  overwriteGenerated: false,
  limitFileNumber: 0,
  limitFileSize: 0,
  chunkLargeFiles: false,
  lda: { ...DEFAULT_LDA_CONFIG },
  sampling: { ...DEFAULT_SAMPLING_CONFIG },
};
