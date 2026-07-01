import { describe, it, expect } from 'vitest';
import { renderTemplate, renderNoteTitle, extractVariables, buildSearchText } from '../templateRenderer';
import type { CslEntry } from '../../types/citation';

const ENTRY: CslEntry = {
  id: 'smith2020',
  type: 'article-journal',
  title: 'A Great Paper on Testing',
  'title-short': 'Great Paper',
  author: [
    { family: 'Smith', given: 'John' },
    { family: 'Doe', given: 'Jane' },
  ],
  issued: { 'date-parts': [[2020, 3]] },
  'container-title': 'Journal of Unit Tests',
  publisher: 'Academic Press',
  'publisher-place': 'New York',
  volume: '42',
  issue: '3',
  page: '100-115',
  DOI: '10.1234/test.2020',
  URL: 'https://example.com/paper',
  abstract: 'This paper is about testing.',
  keyword: 'testing, software',
};

describe('extractVariables', () => {
  const vars = extractVariables(ENTRY);

  it('extracts citekey', () => {
    expect(vars.citekey).toBe('smith2020');
  });

  it('extracts title', () => {
    expect(vars.title).toBe('A Great Paper on Testing');
  });

  it('extracts titleShort', () => {
    expect(vars.titleShort).toBe('Great Paper');
  });

  it('formats authorString', () => {
    expect(vars.authorString).toBe('John Smith and Jane Doe');
  });

  it('extracts year from date-parts', () => {
    expect(vars.year).toBe('2020');
  });

  it('extracts containerTitle', () => {
    expect(vars.containerTitle).toBe('Journal of Unit Tests');
  });

  it('extracts DOI and URL', () => {
    expect(vars.DOI).toBe('10.1234/test.2020');
    expect(vars.URL).toBe('https://example.com/paper');
  });

  it('extracts keywords', () => {
    expect(vars.keywords).toBe('testing, software');
  });
});

describe('renderTemplate', () => {
  it('substitutes single variable', () => {
    expect(renderTemplate('@{{citekey}}', ENTRY)).toBe('@smith2020');
  });

  it('substitutes multiple variables', () => {
    const tpl = '{{authorString}} ({{year}}). {{title}}.';
    const result = renderTemplate(tpl, ENTRY);
    expect(result).toBe('John Smith and Jane Doe (2020). A Great Paper on Testing.');
  });

  it('handles missing variables as empty strings', () => {
    const entry: CslEntry = { id: 'bare', type: 'article' };
    const result = renderTemplate('{{title}} by {{authorString}}', entry);
    expect(result).toBe(' by ');
  });

  it('renders full literature note template', () => {
    const tpl = [
      '---',
      'title: "{{title}}"',
      'authors: {{authorString}}',
      'year: {{year}}',
      '---',
      '',
      '# {{title}}',
      '',
      '{{abstract}}',
    ].join('\n');
    const result = renderTemplate(tpl, ENTRY);
    expect(result).toContain('title: "A Great Paper on Testing"');
    expect(result).toContain('authors: John Smith and Jane Doe');
    expect(result).toContain('year: 2020');
    expect(result).toContain('# A Great Paper on Testing');
    expect(result).toContain('This paper is about testing.');
  });
});

describe('renderNoteTitle', () => {
  it('renders title from template', () => {
    expect(renderNoteTitle('@{{citekey}}', ENTRY)).toBe('@smith2020');
  });

  it('strips invalid filename characters', () => {
    const entry: CslEntry = { id: 'test', type: 'article', title: 'What: A "Title"?' };
    const result = renderNoteTitle('{{title}}', entry);
    expect(result).not.toContain(':');
    expect(result).not.toContain('"');
    expect(result).not.toContain('?');
  });

  it('trims whitespace', () => {
    const result = renderNoteTitle('  @{{citekey}}  ', ENTRY);
    expect(result).toBe('@smith2020');
  });
});

describe('buildSearchText', () => {
  it('includes key fields in lowercase', () => {
    const text = buildSearchText(ENTRY);
    expect(text).toContain('smith2020');
    expect(text).toContain('a great paper on testing');
    expect(text).toContain('john smith and jane doe');
    expect(text).toContain('2020');
    expect(text).toContain('journal of unit tests');
  });

  it('handles minimal entry', () => {
    const entry: CslEntry = { id: 'bare', type: 'article' };
    const text = buildSearchText(entry);
    expect(text).toContain('bare');
  });
});

describe('author formatting edge cases', () => {
  it('single author', () => {
    const entry: CslEntry = {
      id: 'solo',
      type: 'article',
      author: [{ family: 'Solo', given: 'Han' }],
    };
    const vars = extractVariables(entry);
    expect(vars.authorString).toBe('Han Solo');
  });

  it('three+ authors with Oxford comma', () => {
    const entry: CslEntry = {
      id: 'multi',
      type: 'article',
      author: [
        { family: 'A', given: 'X' },
        { family: 'B', given: 'Y' },
        { family: 'C', given: 'Z' },
      ],
    };
    const vars = extractVariables(entry);
    expect(vars.authorString).toBe('X A, Y B, and Z C');
  });

  it('literal name', () => {
    const entry: CslEntry = {
      id: 'org',
      type: 'article',
      author: [{ literal: 'World Health Organization' }],
    };
    const vars = extractVariables(entry);
    expect(vars.authorString).toBe('World Health Organization');
  });

  it('no authors', () => {
    const entry: CslEntry = { id: 'anon', type: 'article' };
    const vars = extractVariables(entry);
    expect(vars.authorString).toBe('');
  });

  it('raw date fallback', () => {
    const entry: CslEntry = { id: 't', type: 'article', issued: { raw: 'circa 2020' } };
    const vars = extractVariables(entry);
    expect(vars.year).toBe('2020');
  });

  it('literal date fallback', () => {
    const entry: CslEntry = { id: 't', type: 'article', issued: { literal: 'n.d.' } };
    const vars = extractVariables(entry);
    expect(vars.year).toBe('n.d.');
  });
});
