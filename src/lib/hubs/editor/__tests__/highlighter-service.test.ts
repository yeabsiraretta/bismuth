import { describe, expect, it } from 'vitest';

import {
  DEFAULT_HIGHLIGHTER_COLORS,
  findColorByClassName,
  findColorByName,
  generateHighlighterCSS,
  parseHighlights,
  toClassName,
  unwrapHighlight,
  wrapHighlight,
} from '@/hubs/editor/services/highlighter-service';

describe('DEFAULT_HIGHLIGHTER_COLORS', () => {
  it('has 8 default colors', () => {
    expect(DEFAULT_HIGHLIGHTER_COLORS).toHaveLength(8);
  });

  it('every entry has name and hex color', () => {
    for (const c of DEFAULT_HIGHLIGHTER_COLORS) {
      expect(c.name).toBeTruthy();
      expect(c.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});

describe('wrapHighlight', () => {
  const yellow = { name: 'Yellow', color: '#FDE68A' };

  it('wraps with inline style by default', () => {
    expect(wrapHighlight('hello', yellow)).toBe('<mark style="background: #FDE68A">hello</mark>');
  });

  it('wraps with inline style explicitly', () => {
    expect(wrapHighlight('world', yellow, 'inline')).toBe(
      '<mark style="background: #FDE68A">world</mark>'
    );
  });

  it('wraps with CSS class', () => {
    expect(wrapHighlight('test', yellow, 'css-class')).toBe(
      '<mark class="hltr-yellow">test</mark>'
    );
  });

  it('handles names with spaces', () => {
    const fancy = { name: 'Light Blue', color: '#BFDBFE' };
    expect(wrapHighlight('x', fancy, 'css-class')).toBe('<mark class="hltr-light-blue">x</mark>');
  });
});

describe('unwrapHighlight', () => {
  it('removes inline mark tags', () => {
    expect(unwrapHighlight('<mark style="background: #FDE68A">hello</mark>')).toBe('hello');
  });

  it('removes class mark tags', () => {
    expect(unwrapHighlight('<mark class="hltr-yellow">hello</mark>')).toBe('hello');
  });

  it('removes plain mark tags', () => {
    expect(unwrapHighlight('<mark>hello</mark>')).toBe('hello');
  });

  it('removes nested marks', () => {
    expect(unwrapHighlight('<mark style="background: red"><mark>inner</mark></mark>')).toBe(
      'inner'
    );
  });

  it('returns plain text unchanged', () => {
    expect(unwrapHighlight('no marks here')).toBe('no marks here');
  });
});

describe('parseHighlights', () => {
  it('parses inline style marks', () => {
    const result = parseHighlights('<mark style="background: #FDE68A">hello</mark>');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      text: 'hello',
      color: '#FDE68A',
      className: null,
      mode: 'inline',
    });
  });

  it('parses class marks', () => {
    const result = parseHighlights('<mark class="hltr-yellow">world</mark>');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      text: 'world',
      color: null,
      className: 'yellow',
      mode: 'css-class',
    });
  });

  it('parses plain marks', () => {
    const result = parseHighlights('<mark>plain</mark>');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      text: 'plain',
      color: null,
      className: null,
      mode: 'inline',
    });
  });

  it('parses multiple highlights in content', () => {
    const content = '<mark style="background: red">a</mark> text <mark class="hltr-blue">b</mark>';
    const result = parseHighlights(content);
    expect(result).toHaveLength(2);
    expect(result[0].text).toBe('a');
    expect(result[1].text).toBe('b');
  });

  it('returns empty for no highlights', () => {
    expect(parseHighlights('just normal text')).toHaveLength(0);
  });
});

describe('toClassName', () => {
  it('lowercases and kebab-cases', () => {
    expect(toClassName('Light Blue')).toBe('light-blue');
  });

  it('strips special characters', () => {
    expect(toClassName('Red!!!')).toBe('red');
  });

  it('handles simple names', () => {
    expect(toClassName('Yellow')).toBe('yellow');
  });
});

describe('generateHighlighterCSS', () => {
  it('generates CSS rules for all colors', () => {
    const css = generateHighlighterCSS([
      { name: 'Yellow', color: '#FDE68A' },
      { name: 'Green', color: '#BBF7D0' },
    ]);
    expect(css).toContain('.hltr-yellow { background: #FDE68A; }');
    expect(css).toContain('.hltr-green { background: #BBF7D0; }');
  });

  it('returns empty string for empty array', () => {
    expect(generateHighlighterCSS([])).toBe('');
  });
});

describe('findColorByName', () => {
  it('finds case-insensitively', () => {
    const c = findColorByName('yellow', DEFAULT_HIGHLIGHTER_COLORS);
    expect(c).toBeDefined();
    expect(c!.name).toBe('Yellow');
  });

  it('returns undefined for unknown', () => {
    expect(findColorByName('nope', DEFAULT_HIGHLIGHTER_COLORS)).toBeUndefined();
  });
});

describe('findColorByClassName', () => {
  it('finds by class name', () => {
    const c = findColorByClassName('yellow', DEFAULT_HIGHLIGHTER_COLORS);
    expect(c).toBeDefined();
    expect(c!.name).toBe('Yellow');
  });

  it('returns undefined for unknown', () => {
    expect(findColorByClassName('nope', DEFAULT_HIGHLIGHTER_COLORS)).toBeUndefined();
  });
});
