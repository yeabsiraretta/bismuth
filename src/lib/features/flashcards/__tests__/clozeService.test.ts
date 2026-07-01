import { describe, it, expect } from 'vitest';
import {
  findClozes,
  wrapCloze,
  unwrapClozes,
  generateHint,
  noteHasTag,
  getClozeBlank,
} from '../services/clozeService';
import type { ClozeAutoConvert, ClozeHintConfig } from '../types/cloze';

const ALL_ON: ClozeAutoConvert = { highlights: true, bold: true, underline: true, curly: true };
const ONLY_HIGHLIGHTS: ClozeAutoConvert = { highlights: true, bold: false, underline: false, curly: false };

describe('findClozes', () => {
  it('finds ==highlighted== text', () => {
    const matches = findClozes('The ==answer== is here', ALL_ON);
    expect(matches).toHaveLength(1);
    expect(matches[0].text).toBe('answer');
    expect(matches[0].source).toBe('highlight');
  });

  it('finds {curly} text', () => {
    const matches = findClozes('The {answer} is here', ALL_ON);
    expect(matches).toHaveLength(1);
    expect(matches[0].text).toBe('answer');
    expect(matches[0].source).toBe('curly');
  });

  it('finds **bold** text', () => {
    const matches = findClozes('The **answer** is here', ALL_ON);
    expect(matches).toHaveLength(1);
    expect(matches[0].text).toBe('answer');
    expect(matches[0].source).toBe('bold');
  });

  it('finds <u>underlined</u> text', () => {
    const matches = findClozes('The <u>answer</u> is here', ALL_ON);
    expect(matches).toHaveLength(1);
    expect(matches[0].text).toBe('answer');
    expect(matches[0].source).toBe('underline');
  });

  it('finds custom cloze spans', () => {
    const matches = findClozes('The <span class="cloze-span">answer</span> is here', ALL_ON);
    expect(matches).toHaveLength(1);
    expect(matches[0].text).toBe('answer');
    expect(matches[0].source).toBe('custom-span');
  });

  it('finds spans with hints', () => {
    const matches = findClozes('<span class="cloze-span" data-cloze-hint="a...">answer</span>', ALL_ON);
    expect(matches).toHaveLength(1);
    expect(matches[0].hint).toBe('a...');
  });

  it('respects autoConvert settings', () => {
    const text = 'The ==highlighted== and **bold** text';
    const matches = findClozes(text, ONLY_HIGHLIGHTS);
    expect(matches).toHaveLength(1);
    expect(matches[0].source).toBe('highlight');
  });

  it('finds multiple clozes', () => {
    const matches = findClozes('A ==first== B ==second== C', ALL_ON);
    expect(matches).toHaveLength(2);
    expect(matches[0].text).toBe('first');
    expect(matches[1].text).toBe('second');
  });

  it('deduplicates overlapping ranges', () => {
    // ==text== is both a highlight and would overlap with itself
    const matches = findClozes('==text==', ALL_ON);
    expect(matches).toHaveLength(1);
  });

  it('records correct positions', () => {
    const matches = findClozes('abc ==def== ghi', ALL_ON);
    expect(matches[0].from).toBe(4);
    expect(matches[0].to).toBe(11);
  });

  it('returns empty for no clozes', () => {
    expect(findClozes('plain text', ALL_ON)).toEqual([]);
  });

  it('ignores {{double curly braces}}', () => {
    const matches = findClozes('The {{not a cloze}} here', ALL_ON);
    expect(matches).toHaveLength(0);
  });
});

describe('wrapCloze', () => {
  it('wraps text in cloze span', () => {
    expect(wrapCloze('answer')).toBe('<span class="cloze-span">answer</span>');
  });

  it('wraps text with hint', () => {
    expect(wrapCloze('answer', 'a...')).toBe('<span class="cloze-span" data-cloze-hint="a...">answer</span>');
  });
});

describe('unwrapClozes', () => {
  it('removes cloze spans', () => {
    expect(unwrapClozes('<span class="cloze-span">answer</span>')).toBe('answer');
  });

  it('removes multiple spans', () => {
    const input = 'A <span class="cloze-span">one</span> B <span class="cloze-span">two</span>';
    expect(unwrapClozes(input)).toBe('A one B two');
  });

  it('removes spans with hints', () => {
    expect(unwrapClozes('<span class="cloze-span" data-cloze-hint="h">answer</span>')).toBe('answer');
  });

  it('leaves non-cloze text unchanged', () => {
    expect(unwrapClozes('no cloze here')).toBe('no cloze here');
  });
});

describe('generateHint', () => {
  const text = 'Mitochondria';

  it('returns empty for mode=none', () => {
    expect(generateHint(text, { mode: 'none', firstLetterCount: 1, percentage: 20 })).toBe('');
  });

  it('returns first letters', () => {
    const config: ClozeHintConfig = { mode: 'first-letters', firstLetterCount: 3, percentage: 20 };
    expect(generateHint(text, config)).toBe('Mit…');
  });

  it('returns percentage of text', () => {
    const config: ClozeHintConfig = { mode: 'percentage', firstLetterCount: 1, percentage: 50 };
    // 12 chars * 50% = 6 chars
    expect(generateHint(text, config)).toBe('Mitoch…');
  });

  it('clamps percentage to at least 1 char', () => {
    const config: ClozeHintConfig = { mode: 'percentage', firstLetterCount: 1, percentage: 0 };
    expect(generateHint('ab', config)).toBe('a…');
  });
});

describe('noteHasTag', () => {
  it('returns true when no tag is required', () => {
    expect(noteHasTag('some content', '')).toBe(true);
  });

  it('finds tag in array-style frontmatter', () => {
    const content = '---\ntags: [review, study]\n---\ncontent';
    expect(noteHasTag(content, 'review')).toBe(true);
  });

  it('finds tag in list-style frontmatter', () => {
    const content = '---\ntags:\n  - review\n  - study\n---\ncontent';
    expect(noteHasTag(content, 'review')).toBe(true);
  });

  it('returns false when tag not found', () => {
    const content = '---\ntags: [study]\n---\ncontent';
    expect(noteHasTag(content, 'review')).toBe(false);
  });

  it('returns false for no frontmatter', () => {
    expect(noteHasTag('just content', 'review')).toBe(false);
  });
});

describe('getClozeBlank', () => {
  const noHintConfig: ClozeHintConfig = { mode: 'none', firstLetterCount: 1, percentage: 20 };
  const firstLetterConfig: ClozeHintConfig = { mode: 'first-letters', firstLetterCount: 2, percentage: 20 };

  it('uses explicit hint if provided', () => {
    expect(getClozeBlank('answer', 'hint!', noHintConfig)).toBe('hint!');
  });

  it('generates hint from config', () => {
    expect(getClozeBlank('answer', undefined, firstLetterConfig)).toBe('an…');
  });

  it('falls back to [...] when no hint', () => {
    expect(getClozeBlank('answer', undefined, noHintConfig)).toBe('[...]');
  });
});
