import { describe, it, expect } from 'vitest';
import {
  buildCorpus,
  linkTopics,
  generateTopicIndex,
  generateTopicNote,
  extractWebLinks,
  generateWebLinkNote,
  getTopicFolderPath,
} from '../services/topicLinker';
import { DEFAULT_TOPIC_LINKING_CONFIG, DEFAULT_LDA_CONFIG } from '../types';
import type { TopicLinkingConfig } from '../types';

const defaultConfig: TopicLinkingConfig = {
  ...DEFAULT_TOPIC_LINKING_CONFIG,
  lda: { ...DEFAULT_LDA_CONFIG, numTopics: 2, iterations: 10 },
};

const notes = [
  { path: 'Generated/Data Analysis.md', content: 'Analysis of #data patterns including statistical methods and regression models' },
  { path: 'Generated/Data Visualization.md', content: 'Charts and graphs for #data visualization using tools and libraries' },
  { path: 'Other/Unrelated.md', content: 'Some unrelated content about cooking recipes' },
];

describe('buildCorpus', () => {
  it('builds corpus from all files', () => {
    const corpus = buildCorpus(notes, defaultConfig);
    expect(corpus).toHaveLength(3);
  });

  it('filters by file pattern', () => {
    const config = { ...defaultConfig, topicFilePattern: 'Generated/Data' };
    const corpus = buildCorpus(notes, config);
    expect(corpus).toHaveLength(2);
    expect(corpus.every(d => d.path.startsWith('Generated/Data'))).toBe(true);
  });

  it('filters by search pattern', () => {
    const config = { ...defaultConfig, topicSearchPattern: 'statistical' };
    const corpus = buildCorpus(notes, config);
    expect(corpus).toHaveLength(1);
  });

  it('filters by tag pattern', () => {
    const config = { ...defaultConfig, topicTagPattern: '#data' };
    const corpus = buildCorpus(notes, config);
    expect(corpus).toHaveLength(2);
  });

  it('skips empty documents', () => {
    const emptyNotes = [{ path: 'empty.md', content: '' }];
    const corpus = buildCorpus(emptyNotes, defaultConfig);
    expect(corpus).toHaveLength(0);
  });
});

describe('linkTopics', () => {
  it('produces topic linking result', () => {
    const result = linkTopics(notes, defaultConfig);
    expect(result.topics.length).toBeGreaterThan(0);
    expect(result.documentCount).toBe(3);
    expect(result.timestamp).toBeGreaterThan(0);
  });

  it('filters documents by threshold', () => {
    const config = { ...defaultConfig, topicThreshold: 0.99 };
    const result = linkTopics(notes, config);
    // With very high threshold, few docs should pass
    for (const topic of result.topics) {
      for (const doc of topic.documents) {
        expect(doc.probability).toBeGreaterThanOrEqual(0.99);
      }
    }
  });

  it('handles empty notes', () => {
    const result = linkTopics([], defaultConfig);
    expect(result.topics).toEqual([]);
    expect(result.documentCount).toBe(0);
  });
});

describe('generateTopicIndex', () => {
  it('generates valid markdown index', () => {
    const result = linkTopics(notes, defaultConfig);
    const index = generateTopicIndex(result, 'Topics');
    expect(index).toContain('# Topic Index');
    expect(index).toContain('## Topics');
    expect(index).toContain('documents');
  });

  it('includes document checklist', () => {
    const result = linkTopics(notes, { ...defaultConfig, topicThreshold: 0 });
    const index = generateTopicIndex(result, 'Topics');
    expect(index).toContain('## Document Checklist');
    expect(index).toContain('- [ ]');
  });
});

describe('generateTopicNote', () => {
  it('generates valid topic note', () => {
    const result = linkTopics(notes, defaultConfig);
    if (result.topics.length > 0) {
      const note = generateTopicNote(result.topics[0], 'Topics');
      expect(note).toContain('# Topic 1');
      expect(note).toContain('## Keywords');
      expect(note).toContain('## Related Documents');
      expect(note).toContain('← Back to Topic Index');
    }
  });
});

describe('extractWebLinks', () => {
  it('extracts links from notes', () => {
    const webNotes = [
      { path: 'Bookmarks/links.md', content: '- [Google](https://google.com)\n- [GitHub](https://github.com)' },
    ];
    const links = extractWebLinks(webNotes);
    expect(links).toHaveLength(2);
    expect(links[0].url).toBe('https://google.com');
    expect(links[0].sourcePath).toBe('Bookmarks/links.md');
  });

  it('returns empty for no links', () => {
    expect(extractWebLinks([{ path: 'a.md', content: 'no links' }])).toEqual([]);
  });
});

describe('generateWebLinkNote', () => {
  it('generates valid note', () => {
    const note = generateWebLinkNote({
      url: 'https://example.com/article',
      sourcePath: 'Bookmarks/links.md',
      displayText: 'Example Article',
    });
    expect(note).toContain('# Example Article');
    expect(note).toContain('https://example.com/article');
    expect(note).toContain('Bookmarks/links.md');
  });
});

describe('getTopicFolderPath', () => {
  it('returns base folder by default', () => {
    expect(getTopicFolderPath(defaultConfig)).toBe('Topics');
  });

  it('includes pattern slug', () => {
    const config = { ...defaultConfig, includePatternInFolder: true, topicFilePattern: 'Generated/Data' };
    expect(getTopicFolderPath(config)).toContain('Generated_Data');
  });

  it('includes timestamp', () => {
    const config = { ...defaultConfig, includeTimestampInFolder: true };
    const path = getTopicFolderPath(config);
    expect(path).toMatch(/Topics\/\d{4}-\d{2}-\d{2}/);
  });
});
