import { describe, it, expect } from 'vitest';
import { parseCslJson } from '../cslJsonParser';

const SAMPLE_JSON = JSON.stringify([
  {
    id: 'smith2020',
    type: 'article-journal',
    title: 'A Great Paper',
    author: [
      { family: 'Smith', given: 'John' },
      { family: 'Doe', given: 'Jane' },
    ],
    issued: { 'date-parts': [[2020, 3]] },
    'container-title': 'Journal of Tests',
    volume: '42',
    page: '100-115',
    DOI: '10.1234/test',
    abstract: 'Testing abstract.',
  },
  {
    id: 'knuth1997',
    type: 'book',
    title: 'The Art of Computer Programming',
    author: [{ family: 'Knuth', given: 'Donald E.' }],
    issued: { 'date-parts': [[1997]] },
    publisher: 'Addison-Wesley',
    ISBN: '978-0-201-89683-1',
  },
]);

describe('parseCslJson', () => {
  it('parses valid CSL-JSON array', () => {
    const entries = parseCslJson(SAMPLE_JSON);
    expect(entries).toHaveLength(2);
  });

  it('preserves entry ids', () => {
    const entries = parseCslJson(SAMPLE_JSON);
    expect(entries[0].id).toBe('smith2020');
    expect(entries[1].id).toBe('knuth1997');
  });

  it('preserves structured fields', () => {
    const entries = parseCslJson(SAMPLE_JSON);
    const article = entries[0];
    expect(article.author).toHaveLength(2);
    expect(article.author![0].family).toBe('Smith');
    expect(article.issued!['date-parts']![0][0]).toBe(2020);
    expect(article['container-title']).toBe('Journal of Tests');
    expect(article.DOI).toBe('10.1234/test');
  });

  it('throws on invalid JSON', () => {
    expect(() => parseCslJson('not json')).toThrow('Invalid JSON');
  });

  it('throws on non-array JSON', () => {
    expect(() => parseCslJson('{"id": "test"}')).toThrow('must contain a JSON array');
  });

  it('skips entries without id', () => {
    const json = JSON.stringify([
      { type: 'book', title: 'No ID' },
      { id: 'valid', type: 'book' },
    ]);
    const entries = parseCslJson(json);
    expect(entries).toHaveLength(1);
    expect(entries[0].id).toBe('valid');
  });

  it('handles empty array', () => {
    expect(parseCslJson('[]')).toEqual([]);
  });

  it('uses citation-key as fallback id', () => {
    const json = JSON.stringify([{ 'citation-key': 'fallback2020', type: 'article' }]);
    const entries = parseCslJson(json);
    expect(entries).toHaveLength(1);
    expect(entries[0].id).toBe('fallback2020');
  });
});
