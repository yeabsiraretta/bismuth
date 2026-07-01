import { describe, it, expect } from 'vitest';
import { parseBibtex } from '../bibtexParser';

const SAMPLE_BIB = `
@article{smith2020,
  author = {John Smith and Jane Doe},
  title = {A {Great} Paper on Testing},
  journal = {Journal of Unit Tests},
  year = {2020},
  volume = {42},
  number = {3},
  pages = {100--115},
  doi = {10.1234/test.2020},
  abstract = {This paper is about testing.},
  keywords = {testing, software},
}

@book{knuth1997,
  author = {Donald E. Knuth},
  title = {The Art of Computer Programming},
  publisher = {Addison-Wesley},
  year = {1997},
  edition = {3},
  isbn = {978-0-201-89683-1},
  address = {Reading, MA},
}

@inproceedings{chen2019,
  author = {Wei Chen and Li Zhang},
  title = {Deep Learning for NLP},
  booktitle = {Proceedings of ACL 2019},
  year = {2019},
  pages = {55--62},
  url = {https://aclweb.org/papers/chen2019},
}

@phdthesis{garcia2021,
  author = {Maria Garcia},
  title = {Machine Learning in Healthcare},
  school = {MIT},
  year = {2021},
}
`;

describe('parseBibtex', () => {
  const entries = parseBibtex(SAMPLE_BIB);

  it('parses all entries', () => {
    expect(entries).toHaveLength(4);
  });

  it('parses article entry with correct fields', () => {
    const article = entries.find((e) => e.id === 'smith2020');
    expect(article).toBeDefined();
    expect(article!.type).toBe('article-journal');
    expect(article!.title).toBe('A Great Paper on Testing');
    expect(article!['container-title']).toBe('Journal of Unit Tests');
    expect(article!.volume).toBe('42');
    expect(article!.issue).toBe('3');
    expect(article!.page).toBe('100--115');
    expect(article!.DOI).toBe('10.1234/test.2020');
    expect(article!.abstract).toBe('This paper is about testing.');
    expect(article!.keyword).toBe('testing, software');
  });

  it('parses authors correctly', () => {
    const article = entries.find((e) => e.id === 'smith2020')!;
    expect(article.author).toHaveLength(2);
    expect(article.author![0].family).toBe('Smith');
    expect(article.author![0].given).toBe('John');
    expect(article.author![1].family).toBe('Doe');
    expect(article.author![1].given).toBe('Jane');
  });

  it('parses issued date', () => {
    const article = entries.find((e) => e.id === 'smith2020')!;
    expect(article.issued).toBeDefined();
    expect(article.issued!['date-parts']![0][0]).toBe(2020);
  });

  it('parses book entry', () => {
    const book = entries.find((e) => e.id === 'knuth1997');
    expect(book).toBeDefined();
    expect(book!.type).toBe('book');
    expect(book!.publisher).toBe('Addison-Wesley');
    expect(book!.ISBN).toBe('978-0-201-89683-1');
    expect(book!['publisher-place']).toBe('Reading, MA');
    expect(book!.edition).toBe('3');
  });

  it('parses inproceedings as paper-conference', () => {
    const conf = entries.find((e) => e.id === 'chen2019');
    expect(conf).toBeDefined();
    expect(conf!.type).toBe('paper-conference');
    expect(conf!['container-title']).toBe('Proceedings of ACL 2019');
    expect(conf!.URL).toBe('https://aclweb.org/papers/chen2019');
  });

  it('parses thesis entry', () => {
    const thesis = entries.find((e) => e.id === 'garcia2021');
    expect(thesis).toBeDefined();
    expect(thesis!.type).toBe('thesis');
    expect(thesis!.author).toHaveLength(1);
    expect(thesis!.author![0].family).toBe('Garcia');
  });

  it('cleans LaTeX braces from titles', () => {
    const article = entries.find((e) => e.id === 'smith2020')!;
    expect(article.title).not.toContain('{');
    expect(article.title).not.toContain('}');
  });

  it('handles empty input', () => {
    expect(parseBibtex('')).toEqual([]);
  });

  it('skips @comment and @preamble entries', () => {
    const bib = `
@comment{this is a comment}
@preamble{"some preamble"}
@article{real2020, title = {Real Entry}, year = {2020}}
    `;
    const result = parseBibtex(bib);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('real2020');
  });

  it('handles LaTeX accent commands', () => {
    const bib = `@article{test, author = {M\\"uller, Hans}, title = {Caf\\'{e} Culture}, year = {2020}}`;
    const result = parseBibtex(bib);
    expect(result).toHaveLength(1);
    expect(result[0].author![0].family).toContain('ller');
    expect(result[0].title).toContain('Caf');
  });

  it('parses Zotero file attachments', () => {
    const bib = `@article{test, title = {Test}, year = {2020}, file = {paper.pdf:/path/to/paper.pdf:application/pdf;notes.txt:/path/to/notes.txt:text/plain}}`;
    const result = parseBibtex(bib);
    expect(result[0].attachments).toBeDefined();
    expect(result[0].attachments!.length).toBeGreaterThan(0);
  });

  it('handles "Last, First" author format', () => {
    const bib = `@article{test, author = {Doe, John}, title = {T}, year = {2020}}`;
    const result = parseBibtex(bib);
    expect(result[0].author![0].family).toBe('Doe');
    expect(result[0].author![0].given).toBe('John');
  });
});
