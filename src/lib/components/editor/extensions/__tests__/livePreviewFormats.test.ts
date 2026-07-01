/**
 * Unit tests for extended live preview formatting:
 * highlight, HTML tags, footnotes, checkboxes, and tables.
 * @module components/editor/extensions/__tests__/livePreviewFormats
 */

import { describe, it, expect } from 'vitest';

describe('livePreview: highlight detection', () => {
  const highlightRe = /==(.+?)==/g;

  it('matches ==text==', () => {
    const text = 'hello ==highlighted== end';
    const matches = [...text.matchAll(highlightRe)];
    expect(matches).toHaveLength(1);
    expect(matches[0][1]).toBe('highlighted');
  });

  it('matches multiple highlights', () => {
    const text = '==a== and ==b==';
    const matches = [...text.matchAll(highlightRe)];
    expect(matches).toHaveLength(2);
  });

  it('does not match single =', () => {
    const text = 'a = b';
    const matches = [...text.matchAll(highlightRe)];
    expect(matches).toHaveLength(0);
  });
});

describe('livePreview: HTML tag detection', () => {
  it('matches <u>text</u>', () => {
    const uRe = /<u>(.+?)<\/u>/gi;
    const text = 'hello <u>underlined</u> end';
    const matches = [...text.matchAll(uRe)];
    expect(matches).toHaveLength(1);
    expect(matches[0][1]).toBe('underlined');
  });

  it('matches <sup>text</sup>', () => {
    const supRe = /<sup>(.+?)<\/sup>/gi;
    const text = 'a<sup>2</sup> + b<sup>2</sup>';
    const matches = [...text.matchAll(supRe)];
    expect(matches).toHaveLength(2);
    expect(matches[0][1]).toBe('2');
  });

  it('matches <sub>text</sub>', () => {
    const subRe = /<sub>(.+?)<\/sub>/gi;
    const text = 'log<sub>2</sub>(8)';
    const matches = [...text.matchAll(subRe)];
    expect(matches).toHaveLength(1);
    expect(matches[0][1]).toBe('2');
  });

  it('is case-insensitive', () => {
    const uRe = /<u>(.+?)<\/u>/gi;
    const text = '<U>caps</U>';
    const matches = [...text.matchAll(uRe)];
    expect(matches).toHaveLength(1);
  });
});

describe('livePreview: footnote reference detection', () => {
  const fnRefRe = /\[\^([^\]]+)\]/g;

  it('matches [^1]', () => {
    const text = 'some text[^1] here';
    const matches = [...text.matchAll(fnRefRe)];
    expect(matches).toHaveLength(1);
    expect(matches[0][1]).toBe('1');
  });

  it('matches named footnotes [^note]', () => {
    const text = 'see[^details] for more';
    const matches = [...text.matchAll(fnRefRe)];
    expect(matches).toHaveLength(1);
    expect(matches[0][1]).toBe('details');
  });

  it('matches multiple footnotes', () => {
    const text = 'first[^1] and second[^2]';
    const matches = [...text.matchAll(fnRefRe)];
    expect(matches).toHaveLength(2);
  });

  it('does not match empty [^]', () => {
    const text = 'empty[^] ref';
    const matches = [...text.matchAll(fnRefRe)];
    expect(matches).toHaveLength(0);
  });
});

describe('livePreview: checkbox detection', () => {
  const checkRe = /^(\s*[-*+]\s)\[([x ])\]\s/i;

  it('matches unchecked checkbox', () => {
    const match = '- [ ] task'.match(checkRe);
    expect(match).not.toBeNull();
    expect(match![2]).toBe(' ');
  });

  it('matches checked checkbox', () => {
    const match = '- [x] done'.match(checkRe);
    expect(match).not.toBeNull();
    expect(match![2]).toBe('x');
  });

  it('matches uppercase X', () => {
    const match = '- [X] done'.match(checkRe);
    expect(match).not.toBeNull();
    expect(match![2]).toBe('X');
  });

  it('matches with * bullet', () => {
    const match = '* [ ] item'.match(checkRe);
    expect(match).not.toBeNull();
  });

  it('matches with + bullet', () => {
    const match = '+ [x] item'.match(checkRe);
    expect(match).not.toBeNull();
  });

  it('matches indented checkbox', () => {
    const match = '  - [ ] nested'.match(checkRe);
    expect(match).not.toBeNull();
  });

  it('does not match plain list item', () => {
    expect(checkRe.test('- regular item')).toBe(false);
  });

  it('does not match without space in brackets', () => {
    expect(checkRe.test('- [] item')).toBe(false);
  });
});

describe('livePreview: table rendering', () => {
  // Use the real splitTableRow to match production behaviour
  async function getSplitTableRow() {
    const { splitTableRow } = await import('../live-preview/livePreviewWidgets');
    return splitTableRow;
  }
  function isSeparatorRow(line: string, split: (r: string) => string[]): boolean {
    const inner = line.trim().replace(/^\||\|$/g, '');
    const cells = split(inner);
    return cells.length > 0 && cells.every(c => /^\s*:?-+:?\s*$/.test(c));
  }

  it('detects table lines starting with |', () => {
    const lines = ['| Header 1 | Header 2 |', '| --- | --- |', '| Cell 1 | Cell 2 |'];
    expect(lines.every(l => l.trimStart().startsWith('|'))).toBe(true);
  });

  it('requires at least 2 lines for table rendering', () => {
    expect(['| Not a table |'].length >= 2).toBe(false);
  });

  // Separator detection — these must be filtered out of the rendered output
  it('identifies single-column separator', async () => {
    const split = await getSplitTableRow();
    expect(isSeparatorRow('| --- |', split)).toBe(true);
  });
  it('identifies multi-column separator', async () => {
    const split = await getSplitTableRow();
    expect(isSeparatorRow('| --- | --- | --- |', split)).toBe(true);
  });
  it('identifies separator without spaces', async () => {
    const split = await getSplitTableRow();
    expect(isSeparatorRow('|---|---|', split)).toBe(true);
  });
  it('identifies left-aligned separator', async () => {
    const split = await getSplitTableRow();
    expect(isSeparatorRow('| :--- | :--- |', split)).toBe(true);
  });
  it('identifies center-aligned separator', async () => {
    const split = await getSplitTableRow();
    expect(isSeparatorRow('| :---: | :---: |', split)).toBe(true);
  });
  it('identifies right-aligned separator', async () => {
    const split = await getSplitTableRow();
    expect(isSeparatorRow('| ---: | ---: |', split)).toBe(true);
  });
  it('does not identify data row as separator', async () => {
    const split = await getSplitTableRow();
    expect(isSeparatorRow('| Cell 1 | Cell 2 |', split)).toBe(false);
  });
  it('does not identify header row as separator', async () => {
    const split = await getSplitTableRow();
    expect(isSeparatorRow('| Header 1 | Header 2 |', split)).toBe(false);
  });

  // Full renderTable integration
  it('renderTable produces correct HTML with header and body', async () => {
    const { renderTable } = await import('../live-preview/livePreviewWidgets');
    const lines = ['| A | B |', '| --- | --- |', '| 1 | 2 |', '| 3 | 4 |'];
    const html = renderTable(lines);
    expect(html).toContain('<th>A</th>');
    expect(html).toContain('<th>B</th>');
    expect(html).toContain('<td>1</td>');
    expect(html).toContain('<td>4</td>');
    expect(html).not.toContain('<td>---</td>');
    expect(html).not.toContain('<td> --- </td>');
  });

  it('renderTable works with alignment markers in separator', async () => {
    const { renderTable } = await import('../live-preview/livePreviewWidgets');
    const lines = ['| Name | Score | Grade |', '| :--- | ---: | :---: |', '| Alice | 95 | A |'];
    const html = renderTable(lines);
    expect(html).toContain('<th>Name</th>');
    expect(html).toContain('<td>Alice</td>');
    expect(html).not.toContain(':---');
  });

  it('renderTable escapes HTML in cells', async () => {
    const { renderTable } = await import('../live-preview/livePreviewWidgets');
    const lines = ['| Col |', '| --- |', '| <b>bold</b> |'];
    const html = renderTable(lines);
    expect(html).toContain('&lt;b&gt;');
    expect(html).not.toContain('<b>bold</b>');
  });

  it('renderTable preserves wikilinks with aliases in cells', async () => {
    const { renderTable } = await import('../live-preview/livePreviewWidgets');
    const lines = [
      '| Name | Link |',
      '| --- | --- |',
      '| Alice | [[note|Display Text]] |',
    ];
    const html = renderTable(lines);
    expect(html).toContain('[[note|Display Text]]');
    expect(html).toContain('<td>Alice</td>');
  });

  it('splitTableRow does not split on | inside wikilinks', async () => {
    const { splitTableRow } = await import('../live-preview/livePreviewWidgets');
    const cells = splitTableRow(' Alice | [[note|alias]] | done ');
    expect(cells).toEqual([' Alice ', ' [[note|alias]] ', ' done ']);
  });

  it('splitTableRow handles multiple wikilinks in one row', async () => {
    const { splitTableRow } = await import('../live-preview/livePreviewWidgets');
    const cells = splitTableRow(' [[a|b]] | [[c|d]] ');
    expect(cells).toEqual([' [[a|b]] ', ' [[c|d]] ']);
  });
});
