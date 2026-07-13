import { describe, expect, it } from 'vitest';

import {
  datesMatchWithMargin,
  DEFAULT_REVIEW_CONFIG,
  extractBody,
  extractCreatedDate,
  extractPreview,
  extractTitle,
  formatTimeSpanLabel,
  getTargetDates,
  humanizeTimeAgo,
  matchNotesToTimeSpans,
  parseFlexibleDate,
  parseFrontmatter,
  shouldExcludeFile,
  subtractSpan,
  timeAgoFromDate,
} from '@/hubs/planner/services/journal-review';

describe('parseFrontmatter', () => {
  it('extracts key-value pairs', () => {
    const fm = parseFrontmatter('---\ntitle: Hello\ncreated: 2025-01-01\n---\nBody');
    expect(fm['title']).toBe('Hello');
    expect(fm['created']).toBe('2025-01-01');
  });

  it('returns empty for no frontmatter', () => {
    expect(parseFrontmatter('plain text')).toEqual({});
  });
});

describe('extractBody', () => {
  it('strips frontmatter', () => {
    expect(extractBody('---\ntitle: T\n---\nBody text')).toBe('Body text');
  });

  it('returns full content if no frontmatter', () => {
    expect(extractBody('Just text')).toBe('Just text');
  });
});

describe('extractCreatedDate', () => {
  it('extracts date from frontmatter', () => {
    expect(extractCreatedDate('---\ncreated: 2025-06-15\n---\n', 'created')).toBe('2025-06-15');
  });

  it('returns null when field missing', () => {
    expect(extractCreatedDate('---\ntitle: T\n---\n', 'created')).toBeNull();
  });
});

describe('parseFlexibleDate', () => {
  it('parses ISO date', () => {
    expect(parseFlexibleDate('2025-06-15')).toBe('2025-06-15');
  });

  it('parses ISO datetime', () => {
    expect(parseFlexibleDate('2025-06-15T10:30:00')).toBe('2025-06-15');
  });

  it('parses slashed date', () => {
    expect(parseFlexibleDate('15/06/2025')).toBe('2025-06-15');
  });

  it('returns null for garbage', () => {
    expect(parseFlexibleDate('not-a-date')).toBeNull();
  });
});

describe('extractPreview', () => {
  it('strips markdown formatting', () => {
    const content = '---\ntitle: T\n---\n# Heading\n\n**Bold** and *italic* text.\n';
    const preview = extractPreview(content);
    expect(preview).toContain('Bold');
    expect(preview).not.toContain('**');
    expect(preview).not.toContain('#');
  });

  it('truncates long text', () => {
    const content = 'A'.repeat(300);
    expect(extractPreview(content, 100).length).toBeLessThanOrEqual(104);
  });
});

describe('extractTitle', () => {
  it('uses frontmatter title', () => {
    expect(extractTitle('---\ntitle: My Note\n---\nBody', 'notes/file.md')).toBe('My Note');
  });

  it('falls back to first heading', () => {
    expect(extractTitle('# Hello World\nContent', 'file.md')).toBe('Hello World');
  });

  it('falls back to filename', () => {
    expect(extractTitle('just content', 'folder/my-note.md')).toBe('my-note');
  });
});

describe('subtractSpan', () => {
  const ref = new Date(2026, 6, 6);

  it('subtracts days', () => {
    expect(subtractSpan(ref, { number: 7, unit: 'day', recurring: false })).toBe('2026-06-29');
  });

  it('subtracts months', () => {
    expect(subtractSpan(ref, { number: 1, unit: 'month', recurring: false })).toBe('2026-06-06');
  });

  it('subtracts years', () => {
    expect(subtractSpan(ref, { number: 1, unit: 'year', recurring: false })).toBe('2025-07-06');
  });
});

describe('getTargetDates', () => {
  it('returns single date for non-recurring', () => {
    const ref = new Date(2026, 6, 6);
    const dates = getTargetDates(ref, { number: 1, unit: 'month', recurring: false });
    expect(dates).toHaveLength(1);
  });

  it('returns multiple dates for recurring', () => {
    const ref = new Date(2026, 6, 6);
    const dates = getTargetDates(ref, { number: 1, unit: 'year', recurring: true });
    expect(dates.length).toBeGreaterThan(1);
    expect(dates[0]).toBe('2025-07-06');
  });
});

describe('datesMatchWithMargin', () => {
  it('matches same month-day with margin 0', () => {
    expect(datesMatchWithMargin('2020-07-06', '2026-07-06', 0)).toBe(true);
  });

  it('rejects different month-day with margin 0', () => {
    expect(datesMatchWithMargin('2020-07-05', '2026-07-06', 0)).toBe(false);
  });

  it('matches within margin', () => {
    expect(datesMatchWithMargin('2026-07-05', '2026-07-06', 1)).toBe(true);
  });
});

describe('humanizeTimeAgo', () => {
  it('returns Yesterday for 1 day', () => {
    expect(humanizeTimeAgo(1, 'day')).toBe('Yesterday');
  });

  it('returns A year ago for 1 year', () => {
    expect(humanizeTimeAgo(1, 'year')).toBe('A year ago');
  });

  it('returns plural years', () => {
    expect(humanizeTimeAgo(3, 'year')).toBe('3 years ago');
  });
});

describe('formatTimeSpanLabel', () => {
  it('humanizes by default', () => {
    expect(formatTimeSpanLabel({ number: 1, unit: 'month', recurring: false })).toBe('A month ago');
  });

  it('raw format when humanize=false', () => {
    expect(formatTimeSpanLabel({ number: 2, unit: 'week', recurring: false }, 1, false)).toBe(
      '2 weeks ago'
    );
  });
});

describe('timeAgoFromDate', () => {
  const today = new Date(2026, 6, 6);

  it('returns Today for same date', () => {
    expect(timeAgoFromDate('2026-07-06', today)).toBe('Today');
  });

  it('returns Yesterday', () => {
    expect(timeAgoFromDate('2026-07-05', today)).toBe('Yesterday');
  });

  it('returns weeks', () => {
    expect(timeAgoFromDate('2026-06-20', today)).toBe('2 weeks ago');
  });
});

describe('shouldExcludeFile', () => {
  it('excludes files in excluded folders', () => {
    expect(shouldExcludeFile('.trash/old.md', DEFAULT_REVIEW_CONFIG)).toBe(true);
  });

  it('includes normal md files', () => {
    expect(shouldExcludeFile('notes/hello.md', DEFAULT_REVIEW_CONFIG)).toBe(false);
  });

  it('excludes non-md extensions when configured', () => {
    expect(shouldExcludeFile('notes/file.canvas', DEFAULT_REVIEW_CONFIG)).toBe(true);
  });
});

describe('matchNotesToTimeSpans', () => {
  it('matches notes to time spans', () => {
    const ref = new Date(2026, 6, 6);
    const notes = [{ path: 'notes/old.md', content: '---\ncreated: 2025-07-06\n---\nOld note' }];
    const groups = matchNotesToTimeSpans(notes, DEFAULT_REVIEW_CONFIG, ref);
    expect(groups.length).toBeGreaterThan(0);
    expect(groups[0].entries[0].title).toBe('old');
  });

  it('returns empty for no matches', () => {
    const ref = new Date(2026, 6, 6);
    const notes = [{ path: 'notes/new.md', content: '---\ncreated: 2026-07-05\n---\nRecent' }];
    const groups = matchNotesToTimeSpans(notes, DEFAULT_REVIEW_CONFIG, ref);
    expect(groups).toEqual([]);
  });
});
