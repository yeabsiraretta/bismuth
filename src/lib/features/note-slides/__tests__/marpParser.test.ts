import { describe, it, expect } from 'vitest';
import {
  parseFrontmatter, isMarpNote, extractDirectives,
  splitSlides, extractSlideDirectives, extractSpeakerNotes,
  resolveWikilinks, markdownToHtml, parseMarpPresentation,
} from '../services/marpParser';
import { DEFAULT_DIRECTIVES } from '../types/marp';

describe('parseFrontmatter', () => {
  it('extracts YAML frontmatter', () => {
    const md = '---\nmarp: true\ntheme: default\n---\n# Slide 1';
    const { frontmatter, body } = parseFrontmatter(md);
    expect(frontmatter['marp']).toBe(true);
    expect(frontmatter['theme']).toBe('default');
    expect(body).toBe('# Slide 1');
  });

  it('returns empty frontmatter if missing', () => {
    const { frontmatter, body } = parseFrontmatter('# No frontmatter');
    expect(Object.keys(frontmatter)).toHaveLength(0);
    expect(body).toBe('# No frontmatter');
  });

  it('parses boolean and number values', () => {
    const md = '---\npaginate: true\nsize: 42\n---\nbody';
    const { frontmatter } = parseFrontmatter(md);
    expect(frontmatter['paginate']).toBe(true);
    expect(frontmatter['size']).toBe(42);
  });
});

describe('isMarpNote', () => {
  it('returns true for marp: true', () => {
    expect(isMarpNote('---\nmarp: true\n---\n# Slide')).toBe(true);
  });

  it('returns false for regular notes', () => {
    expect(isMarpNote('# Regular note')).toBe(false);
    expect(isMarpNote('---\ntitle: hello\n---\n# Note')).toBe(false);
  });
});

describe('extractDirectives', () => {
  it('extracts known directives', () => {
    const fm = { marp: true, theme: 'gaia', paginate: true, footer: 'My Talk' };
    const d = extractDirectives(fm);
    expect(d.theme).toBe('gaia');
    expect(d.paginate).toBe(true);
    expect(d.footer).toBe('My Talk');
  });

  it('uses defaults for missing values', () => {
    const d = extractDirectives({ marp: true });
    expect(d.theme).toBe(DEFAULT_DIRECTIVES.theme);
    expect(d.paginate).toBe(false);
  });
});

describe('splitSlides', () => {
  it('splits on --- separator', () => {
    const body = '# Slide 1\n---\n# Slide 2\n---\n# Slide 3';
    const slides = splitSlides(body);
    expect(slides).toHaveLength(3);
    expect(slides[0]).toContain('Slide 1');
    expect(slides[2]).toContain('Slide 3');
  });

  it('returns single slide if no separator', () => {
    expect(splitSlides('# Only one slide')).toHaveLength(1);
  });

  it('ignores --- inside code blocks', () => {
    const body = '# Slide\n```\n---\n```\n---\n# Next';
    const slides = splitSlides(body);
    expect(slides).toHaveLength(2);
    expect(slides[0]).toContain('```');
  });

  it('handles empty slides', () => {
    const body = '# A\n---\n---\n# B';
    const slides = splitSlides(body);
    expect(slides.length).toBeGreaterThanOrEqual(2);
  });
});

describe('extractSlideDirectives', () => {
  it('extracts directives from comments', () => {
    const content = '<!-- backgroundColor: #fff -->\n# Title';
    const dir = extractSlideDirectives(content);
    expect(dir['backgroundcolor']).toBe('#fff');
  });

  it('ignores note/notes comments', () => {
    const content = '<!-- note: This is a note -->\n# Title';
    const dir = extractSlideDirectives(content);
    expect(Object.keys(dir)).toHaveLength(0);
  });

  it('extracts multiple directives', () => {
    const content = '<!-- color: red -->\n<!-- class: lead -->';
    const dir = extractSlideDirectives(content);
    expect(dir['color']).toBe('red');
    expect(dir['class']).toBe('lead');
  });
});

describe('extractSpeakerNotes', () => {
  it('extracts speaker notes', () => {
    const content = '# Title\n<!-- note\nSome speaker notes\nMore notes\n-->';
    const notes = extractSpeakerNotes(content);
    expect(notes).toContain('Some speaker notes');
    expect(notes).toContain('More notes');
  });

  it('returns empty string if no notes', () => {
    expect(extractSpeakerNotes('# No notes here')).toBe('');
  });
});

describe('resolveWikilinks', () => {
  it('converts ![[image.png]] to ![](image.png)', () => {
    const result = resolveWikilinks('![[path/to/image.png]]');
    expect(result).toBe('![](path/to/image.png)');
  });

  it('handles spaces in paths', () => {
    const result = resolveWikilinks('![[my image file.jpg]]');
    expect(result).toBe('![](my%20image%20file.jpg)');
  });

  it('leaves commonmark images unchanged', () => {
    const result = resolveWikilinks('![alt](image.png)');
    expect(result).toBe('![alt](image.png)');
  });
});

describe('markdownToHtml', () => {
  it('converts headings', () => {
    expect(markdownToHtml('# Title')).toContain('<h1>Title</h1>');
    expect(markdownToHtml('## Sub')).toContain('<h2>Sub</h2>');
    expect(markdownToHtml('### Sub2')).toContain('<h3>Sub2</h3>');
  });

  it('converts bold and italic', () => {
    expect(markdownToHtml('**bold**')).toContain('<strong>bold</strong>');
    expect(markdownToHtml('*italic*')).toContain('<em>italic</em>');
  });

  it('converts inline code', () => {
    expect(markdownToHtml('Use `const`')).toContain('<code>const</code>');
  });

  it('converts images', () => {
    expect(markdownToHtml('![alt](img.png)')).toContain('<img src="img.png" alt="alt" />');
  });

  it('converts links', () => {
    expect(markdownToHtml('[link](url)')).toContain('<a href="url">link</a>');
  });

  it('strips speaker notes comments', () => {
    const result = markdownToHtml('Text\n<!-- note\nmy notes\n-->');
    expect(result).not.toContain('my notes');
  });
});

describe('parseMarpPresentation', () => {
  it('parses a full presentation', () => {
    const md = `---
marp: true
theme: gaia
paginate: true
footer: My Talk
---
# Slide 1
Hello world
---
# Slide 2
- Item 1
- Item 2
---
# Slide 3
![alt](image.png)`;

    const pres = parseMarpPresentation(md, 'test.md');
    expect(pres).not.toBeNull();
    expect(pres!.slides).toHaveLength(3);
    expect(pres!.globalDirectives.theme).toBe('gaia');
    expect(pres!.globalDirectives.paginate).toBe(true);
    expect(pres!.globalDirectives.footer).toBe('My Talk');
    expect(pres!.notePath).toBe('test.md');
  });

  it('returns null for non-marp notes', () => {
    expect(parseMarpPresentation('# Regular note')).toBeNull();
    expect(parseMarpPresentation('---\ntitle: foo\n---\n# Note')).toBeNull();
  });

  it('extracts per-slide directives', () => {
    const md = '---\nmarp: true\n---\n<!-- backgroundColor: red -->\n# Red Slide';
    const pres = parseMarpPresentation(md);
    expect(pres!.slides[0].directives['backgroundcolor']).toBe('red');
  });

  it('extracts speaker notes', () => {
    const md = '---\nmarp: true\n---\n# Title\n<!-- note\nMy notes here\n-->';
    const pres = parseMarpPresentation(md);
    expect(pres!.slides[0].speakerNotes).toContain('My notes here');
  });

  it('resolves wikilink images', () => {
    const md = '---\nmarp: true\n---\n![[photo.png]]';
    const pres = parseMarpPresentation(md);
    expect(pres!.slides[0].html).toContain('photo.png');
  });

  it('uses global transition for slides', () => {
    const md = '---\nmarp: true\ntransition: fade\n---\n# S1\n---\n# S2';
    const pres = parseMarpPresentation(md);
    expect(pres!.slides[0].transition).toBe('fade');
    expect(pres!.slides[1].transition).toBe('fade');
  });
});
