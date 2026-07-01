import { describe, it, expect } from 'vitest';
import { HELP_TOPICS, filterTopics } from '../help/helpIndex';
import { HELP_BASE_URL } from '@/utils/settings/helpUrls';

describe('helpIndex (T026)', () => {
  it('returns all topics for empty query', () => {
    expect(filterTopics('')).toHaveLength(HELP_TOPICS.length);
    expect(filterTopics('  ')).toHaveLength(HELP_TOPICS.length);
  });

  it('matches by topic name (case-insensitive)', () => {
    const results = filterTopics('canvas');
    expect(results.some((t) => t.topic.toLowerCase().includes('canvas'))).toBe(true);
  });

  it('matches by keyword', () => {
    const results = filterTopics('wikilink');
    expect(results.some((t) => t.keywords.includes('wikilink'))).toBe(true);
  });

  it('returns empty array for no match', () => {
    expect(filterTopics('zzznomatch')).toHaveLength(0);
  });

  it('all topic URLs start with HELP_BASE_URL', () => {
    HELP_TOPICS.forEach((t) => {
      expect(t.url.startsWith(HELP_BASE_URL)).toBe(true);
    });
  });

  it('each topic has non-empty topic, url, and keywords array', () => {
    HELP_TOPICS.forEach((t) => {
      expect(t.topic.length).toBeGreaterThan(0);
      expect(t.url.length).toBeGreaterThan(0);
      expect(Array.isArray(t.keywords)).toBe(true);
    });
  });
});
