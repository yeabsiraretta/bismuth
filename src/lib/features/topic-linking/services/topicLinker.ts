/**
 * Topic Linker — orchestrates corpus building, LDA, and topic note generation.
 *
 * Scans vault files matching a pattern, builds a token corpus,
 * runs LDA topic modeling, and generates linked topic notes.
 */

import type {
  TopicLinkingConfig,
  TopicLinkingResult,
  CorpusDocument,
  ExtractedWebLink,
} from '../types';
import { buildDocument, matchesPattern, matchesTags, extractUrls } from './textProcessor';
import { runLda } from './ldaService';

// ─── Corpus building ───────────────────────────────────────────────────────────

interface NoteInput {
  path: string;
  content: string;
}

/** Build a filtered corpus from vault notes. */
export function buildCorpus(notes: NoteInput[], config: TopicLinkingConfig): CorpusDocument[] {
  const docs: CorpusDocument[] = [];

  for (const note of notes) {
    // Pattern filter
    if (!matchesPattern(note.path, config.topicFilePattern)) continue;

    // Search filter
    if (
      config.topicSearchPattern &&
      !note.content.toLowerCase().includes(config.topicSearchPattern.toLowerCase())
    )
      continue;

    const doc = buildDocument(note.path, note.content, config.sampling);

    // Tag filter
    if (config.topicTagPattern && !matchesTags(doc.tags, config.topicTagPattern)) continue;

    // Skip empty documents
    if (doc.tokens.length === 0) continue;

    docs.push(doc);
  }

  return docs;
}

// ─── Topic linking runner ──────────────────────────────────────────────────────

/** Run the full topic linking pipeline. */
export function linkTopics(notes: NoteInput[], config: TopicLinkingConfig): TopicLinkingResult {
  const corpus = buildCorpus(notes, config);
  const topics = runLda(corpus, config.lda);

  // Filter documents by threshold
  const filteredTopics = topics.map((topic) => ({
    ...topic,
    documents: topic.documents.filter((d) => d.probability >= config.topicThreshold),
  }));

  return {
    topics: filteredTopics,
    documentCount: corpus.length,
    timestamp: Date.now(),
    config,
  };
}

// ─── Note generation ───────────────────────────────────────────────────────────

/** Generate the topic index note markdown. */
export function generateTopicIndex(result: TopicLinkingResult, topicFolderPath: string): string {
  const lines: string[] = [
    '---',
    `created: ${new Date(result.timestamp).toISOString().slice(0, 10)}`,
    `documents: ${result.documentCount}`,
    `topics: ${result.topics.length}`,
    '---',
    '',
    '# Topic Index',
    '',
    `Generated from **${result.documentCount}** documents on ${new Date(result.timestamp).toLocaleString()}.`,
    '',
    '## Topics',
    '',
  ];

  for (const topic of result.topics) {
    const topicPath = `${topicFolderPath}/Topic ${topic.id + 1}`;
    lines.push(`### [[${topicPath}|Topic ${topic.id + 1}: ${topic.label}]]`);
    lines.push('');
    lines.push(
      `Keywords: ${topic.keywords
        .slice(0, 5)
        .map((k) => `*${k.word}*`)
        .join(', ')}`
    );
    lines.push(`Documents: ${topic.documents.length}`);
    lines.push('');
  }

  // Document checklist
  const allDocs = new Set<string>();
  for (const topic of result.topics) {
    for (const doc of topic.documents) allDocs.add(doc.path);
  }

  if (allDocs.size > 0) {
    lines.push('## Document Checklist');
    lines.push('');
    for (const path of [...allDocs].sort()) {
      const title = path.split('/').pop()?.replace('.md', '') || path;
      lines.push(`- [ ] [[${path}|${title}]]`);
    }
  }

  return lines.join('\n');
}

/** Generate a single topic note markdown. */
export function generateTopicNote(
  topic: TopicLinkingResult['topics'][number],
  topicFolderPath: string
): string {
  const lines: string[] = [
    '---',
    `topic_id: ${topic.id + 1}`,
    `keywords: [${topic.keywords
      .slice(0, 5)
      .map((k) => `"${k.word}"`)
      .join(', ')}]`,
    '---',
    '',
    `# Topic ${topic.id + 1}: ${topic.label}`,
    '',
    `[[${topicFolderPath}/Topic Index|← Back to Topic Index]]`,
    '',
    '## Keywords',
    '',
  ];

  for (const kw of topic.keywords) {
    lines.push(`- **${kw.word}** (${(kw.weight * 100).toFixed(1)}%)`);
  }

  lines.push('');
  lines.push('## Related Documents');
  lines.push('');

  if (topic.documents.length === 0) {
    lines.push('*No documents meet the relevance threshold.*');
  } else {
    for (const doc of topic.documents) {
      lines.push(
        `- [[${doc.path}|${doc.title}]] — ${(doc.probability * 100).toFixed(1)}% relevance`
      );
    }
  }

  return lines.join('\n');
}

// ─── Web link extraction ───────────────────────────────────────────────────────

/** Extract all web links from a set of bookmark/note files. */
export function extractWebLinks(notes: NoteInput[]): ExtractedWebLink[] {
  const links: ExtractedWebLink[] = [];

  for (const note of notes) {
    const urls = extractUrls(note.content);
    for (const u of urls) {
      links.push({
        url: u.url,
        sourcePath: note.path,
        displayText: u.displayText,
      });
    }
  }

  return links;
}

/** Generate a markdown file from extracted web link metadata. */
export function generateWebLinkNote(link: ExtractedWebLink): string {
  const title = link.displayText || new URL(link.url).hostname;
  return [
    '---',
    `source: "${link.url}"`,
    `source_file: "${link.sourcePath}"`,
    '---',
    '',
    `# ${title}`,
    '',
    `Source: [${link.url}](${link.url})`,
    '',
    `Extracted from: [[${link.sourcePath}]]`,
    '',
  ].join('\n');
}

/** Compute the topic output folder path. */
export function getTopicFolderPath(config: TopicLinkingConfig): string {
  let folder = config.topicFolder;
  if (config.includePatternInFolder && config.topicFilePattern) {
    const patternSlug = config.topicFilePattern.replace(/[^a-zA-Z0-9]/g, '_');
    folder = `${folder}/${patternSlug}`;
  }
  if (config.includeTimestampInFolder) {
    const ts = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
    folder = `${folder}/${ts}`;
  }
  return folder;
}
