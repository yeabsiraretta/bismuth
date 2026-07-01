import { describe, it, expect } from 'vitest';
import { renderBibtexBlock, BIBTEX_STYLES } from '../bibtexRenderer';

const ARTICLE_BIB = `@article{smith2020,
  author = {John Smith and Jane Doe},
  title = {A Great Paper on Testing},
  journal = {Journal of Unit Tests},
  year = {2020},
  volume = {42},
  number = {3},
  pages = {100--115},
  doi = {10.1234/test.2020},
  abstract = {This paper is about testing.},
  keywords = {testing, software},
}`;

const BOOK_BIB = `@book{knuth1997,
  author = {Donald E. Knuth},
  title = {The Art of Computer Programming},
  publisher = {Addison-Wesley},
  year = {1997},
  edition = {3},
  isbn = {978-0-201-89683-1},
  address = {Reading, MA},
}`;

describe('renderBibtexBlock', () => {
  it('returns null for empty input', () => {
    expect(renderBibtexBlock('')).toBeNull();
  });

  it('returns null for non-bibtex text', () => {
    expect(renderBibtexBlock('just some random text')).toBeNull();
  });

  it('renders article entry with all fields', () => {
    const html = renderBibtexBlock(ARTICLE_BIB);
    expect(html).not.toBeNull();
    expect(html).toContain('bib-container');
    expect(html).toContain('bib-entry');
    expect(html).toContain('Article');
    expect(html).toContain('@smith2020');
    expect(html).toContain('A Great Paper on Testing');
    expect(html).toContain('John Smith');
    expect(html).toContain('Jane Doe');
    expect(html).toContain('2020');
    expect(html).toContain('Journal of Unit Tests');
    expect(html).toContain('42(3)');
  });

  it('renders DOI as a clickable link', () => {
    const html = renderBibtexBlock(ARTICLE_BIB)!;
    expect(html).toContain('href="https://doi.org/10.1234/test.2020"');
    expect(html).toContain('bib-link');
  });

  it('renders pages with en-dash', () => {
    const html = renderBibtexBlock(ARTICLE_BIB)!;
    expect(html).toContain('\u2013');
    expect(html).not.toContain('100--115');
  });

  it('renders keywords as chips', () => {
    const html = renderBibtexBlock(ARTICLE_BIB)!;
    expect(html).toContain('bib-keyword');
    expect(html).toContain('testing');
    expect(html).toContain('software');
  });

  it('renders abstract (truncated if long)', () => {
    const html = renderBibtexBlock(ARTICLE_BIB)!;
    expect(html).toContain('bib-abstract');
    expect(html).toContain('This paper is about testing.');
  });

  it('renders book entry', () => {
    const html = renderBibtexBlock(BOOK_BIB);
    expect(html).not.toBeNull();
    expect(html).toContain('Book');
    expect(html).toContain('@knuth1997');
    expect(html).toContain('The Art of Computer Programming');
    expect(html).toContain('Addison-Wesley');
    expect(html).toContain('978-0-201-89683-1');
    expect(html).toContain('Reading, MA');
  });

  it('renders multiple entries', () => {
    const html = renderBibtexBlock(ARTICLE_BIB + '\n' + BOOK_BIB);
    expect(html).not.toBeNull();
    const entryCount = (html!.match(/bib-entry/g) || []).length;
    expect(entryCount).toBeGreaterThanOrEqual(2);
  });

  it('escapes HTML in field values', () => {
    const bib = `@article{test, title = {A <script>alert(1)</script> Title}, year = {2020}}`;
    const html = renderBibtexBlock(bib)!;
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});

describe('BIBTEX_STYLES', () => {
  it('exports non-empty CSS string', () => {
    expect(BIBTEX_STYLES).toBeTruthy();
    expect(BIBTEX_STYLES).toContain('.bib-container');
    expect(BIBTEX_STYLES).toContain('.bib-entry');
    expect(BIBTEX_STYLES).toContain('.bib-header');
  });
});
