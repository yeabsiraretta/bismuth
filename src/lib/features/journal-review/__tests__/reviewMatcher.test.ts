import { describe, it, expect } from 'vitest';
import {
  subtractSpan,
  getTargetDates,
  datesMatchWithMargin,
  sameMonthDay,
  formatTimeSpanLabel,
  humanizeTimeAgo,
  timeAgoFromDate,
  matchNotesToTimeSpans,
  shouldExcludeFile,
  pickRandomNote,
  buildReviewEntry,
} from '../services/reviewMatcher';
import { DEFAULT_REVIEW_CONFIG } from '../types/review';
import type { ReviewConfig } from '../types/review';
import type { VaultNote } from '../services/reviewMatcher';

describe('subtractSpan', () => {
  const ref = new Date('2024-06-15');

  it('subtracts days', () => {
    expect(subtractSpan(ref, { number: 7, unit: 'day', recurring: false })).toBe('2024-06-08');
  });

  it('subtracts weeks', () => {
    expect(subtractSpan(ref, { number: 2, unit: 'week', recurring: false })).toBe('2024-06-01');
  });

  it('subtracts months', () => {
    expect(subtractSpan(ref, { number: 1, unit: 'month', recurring: false })).toBe('2024-05-15');
  });

  it('subtracts years', () => {
    expect(subtractSpan(ref, { number: 1, unit: 'year', recurring: false })).toBe('2023-06-15');
  });

  it('applies multiplier', () => {
    expect(subtractSpan(ref, { number: 1, unit: 'year', recurring: true }, 3)).toBe('2021-06-15');
  });
});

describe('getTargetDates', () => {
  const ref = new Date('2024-06-15');

  it('returns single date for non-recurring', () => {
    const dates = getTargetDates(ref, { number: 6, unit: 'month', recurring: false });
    expect(dates).toHaveLength(1);
    expect(dates[0]).toBe('2023-12-15');
  });

  it('returns multiple dates for recurring', () => {
    const dates = getTargetDates(ref, { number: 1, unit: 'year', recurring: true });
    expect(dates.length).toBeGreaterThan(1);
    expect(dates[0]).toBe('2023-06-15');
    expect(dates[1]).toBe('2022-06-15');
  });
});

describe('sameMonthDay', () => {
  it('matches same month and day', () => {
    expect(sameMonthDay('2023-06-15', '2024-06-15')).toBe(true);
  });

  it('rejects different day', () => {
    expect(sameMonthDay('2023-06-14', '2024-06-15')).toBe(false);
  });

  it('rejects different month', () => {
    expect(sameMonthDay('2023-07-15', '2024-06-15')).toBe(false);
  });
});

describe('datesMatchWithMargin', () => {
  it('matches exact date with margin 0', () => {
    expect(datesMatchWithMargin('2023-06-15', '2024-06-15', 0)).toBe(true);
  });

  it('matches within margin', () => {
    expect(datesMatchWithMargin('2023-06-14', '2023-06-15', 1)).toBe(true);
    expect(datesMatchWithMargin('2023-06-16', '2023-06-15', 1)).toBe(true);
  });

  it('rejects outside margin', () => {
    expect(datesMatchWithMargin('2023-06-13', '2023-06-15', 1)).toBe(false);
  });
});

describe('formatTimeSpanLabel', () => {
  it('formats with humanize', () => {
    expect(formatTimeSpanLabel({ number: 1, unit: 'year', recurring: true }, 1, true)).toBe(
      'A year ago'
    );
    expect(formatTimeSpanLabel({ number: 1, unit: 'month', recurring: false }, 1, true)).toBe(
      'A month ago'
    );
    expect(formatTimeSpanLabel({ number: 6, unit: 'month', recurring: false }, 1, true)).toBe(
      '6 months ago'
    );
  });

  it('formats without humanize', () => {
    expect(formatTimeSpanLabel({ number: 1, unit: 'year', recurring: true }, 1, false)).toBe(
      '1 year ago'
    );
    expect(formatTimeSpanLabel({ number: 2, unit: 'month', recurring: false }, 1, false)).toBe(
      '2 months ago'
    );
  });

  it('applies multiplier', () => {
    expect(formatTimeSpanLabel({ number: 1, unit: 'year', recurring: true }, 3, true)).toBe(
      '3 years ago'
    );
  });
});

describe('humanizeTimeAgo', () => {
  it('handles special cases', () => {
    expect(humanizeTimeAgo(1, 'day')).toBe('Yesterday');
    expect(humanizeTimeAgo(7, 'day')).toBe('A week ago');
    expect(humanizeTimeAgo(1, 'week')).toBe('A week ago');
    expect(humanizeTimeAgo(1, 'year')).toBe('A year ago');
    expect(humanizeTimeAgo(12, 'month')).toBe('A year ago');
  });
});

describe('timeAgoFromDate', () => {
  const today = new Date('2024-06-15');

  it('returns Today for same day', () => {
    expect(timeAgoFromDate('2024-06-15', today)).toBe('Today');
  });

  it('returns Yesterday', () => {
    expect(timeAgoFromDate('2024-06-14', today)).toBe('Yesterday');
  });

  it('returns weeks ago', () => {
    expect(timeAgoFromDate('2024-06-01', today)).toBe('2 weeks ago');
  });

  it('returns months ago', () => {
    expect(timeAgoFromDate('2024-03-15', today)).toBe('3 months ago');
  });

  it('returns years ago', () => {
    expect(timeAgoFromDate('2022-06-15', today)).toBe('2 years ago');
  });
});

describe('shouldExcludeFile', () => {
  const config = DEFAULT_REVIEW_CONFIG;

  it('excludes configured folders', () => {
    expect(shouldExcludeFile('.obsidian/plugins/foo.md', config)).toBe(true);
    expect(shouldExcludeFile('.trash/old.md', config)).toBe(true);
  });

  it('includes matching extensions', () => {
    expect(shouldExcludeFile('notes/hello.md', config)).toBe(false);
  });

  it('excludes non-matching extensions', () => {
    expect(shouldExcludeFile('notes/image.png', config)).toBe(true);
  });
});

describe('matchNotesToTimeSpans', () => {
  const notes: VaultNote[] = [
    {
      path: 'daily/2023-06-15.md',
      content: '---\ncreated: 2023-06-15\ntags: journal\n---\n# June 15',
    },
    { path: 'daily/2024-01-15.md', content: '---\ncreated: 2024-01-15\n---\n# Jan 15' },
    { path: 'notes/random.md', content: '---\ncreated: 2024-06-14\n---\nSome note' },
  ];

  it('matches notes to time spans', () => {
    const config: ReviewConfig = {
      ...DEFAULT_REVIEW_CONFIG,
      timeSpans: [{ number: 1, unit: 'year', recurring: true }],
    };
    const ref = new Date('2024-06-15');
    const groups = matchNotesToTimeSpans(notes, config, ref);
    expect(groups.length).toBeGreaterThanOrEqual(1);
    expect(groups[0].entries[0].path).toBe('daily/2023-06-15.md');
  });

  it('respects lookup margin', () => {
    const config: ReviewConfig = {
      ...DEFAULT_REVIEW_CONFIG,
      timeSpans: [{ number: 1, unit: 'year', recurring: true }],
      lookupMargin: 1,
    };
    const ref = new Date('2024-06-15');
    const groups = matchNotesToTimeSpans(notes, config, ref);
    // Should match 2023-06-15 (exact) and possibly 2023-06-14
    expect(groups.length).toBeGreaterThanOrEqual(1);
  });

  it('returns empty for no matches', () => {
    const config: ReviewConfig = {
      ...DEFAULT_REVIEW_CONFIG,
      timeSpans: [{ number: 3, unit: 'month', recurring: false }],
    };
    const ref = new Date('2024-06-15');
    const groups = matchNotesToTimeSpans(notes, config, ref);
    // 3 months ago = March 15 — no notes on that date
    expect(groups).toHaveLength(0);
  });
});

describe('buildReviewEntry', () => {
  it('builds a review entry from a vault note', () => {
    const note: VaultNote = {
      path: 'notes/test.md',
      content:
        '---\ncreated: 2023-01-15\ntags: [work, project]\ntitle: "My Note"\n---\n# Hello\nSome content here',
    };
    const entry = buildReviewEntry(note, '2023-01-15', DEFAULT_REVIEW_CONFIG);
    expect(entry.path).toBe('notes/test.md');
    expect(entry.title).toBe('My Note');
    expect(entry.createdDate).toBe('2023-01-15');
    expect(entry.preview).toContain('Hello');
    expect(entry.tags).toContain('work');
    expect(entry.fileType).toBe('md');
  });
});

describe('pickRandomNote', () => {
  it('picks a random note', () => {
    const notes: VaultNote[] = [
      { path: 'a.md', content: '---\ncreated: 2023-01-01\n---\nContent A' },
      { path: 'b.md', content: '---\ncreated: 2023-02-01\n---\nContent B' },
    ];
    const result = pickRandomNote(notes, DEFAULT_REVIEW_CONFIG);
    expect(result).not.toBeNull();
    expect(['a.md', 'b.md']).toContain(result!.path);
  });

  it('returns null for empty vault', () => {
    expect(pickRandomNote([], DEFAULT_REVIEW_CONFIG)).toBeNull();
  });

  it('skips notes without created date', () => {
    const notes: VaultNote[] = [{ path: 'no-date.md', content: '# No date' }];
    expect(pickRandomNote(notes, DEFAULT_REVIEW_CONFIG)).toBeNull();
  });
});
