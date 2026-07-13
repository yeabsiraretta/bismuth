import { describe, expect, it } from 'vitest';

import {
  buildExclusionZones,
  buildTitleMap,
  detectUnlinkedMentions,
  linkAllMentions,
  linkMention,
} from '@/hubs/knowledge/services/topic-linking-service';

// ── buildTitleMap ────────────────────────────────────────────────────────────

describe('buildTitleMap', () => {
  it('extracts titles from paths', () => {
    const map = buildTitleMap(['notes/Hello World.md', 'archive/Daily Log.md']);
    expect(map.get('hello world')).toBe('Hello World');
    expect(map.get('daily log')).toBe('Daily Log');
  });

  it('skips single-char filenames', () => {
    const map = buildTitleMap(['a.md', 'bb.md']);
    expect(map.has('a')).toBe(false);
    expect(map.has('bb')).toBe(true);
  });

  it('handles nested paths', () => {
    const map = buildTitleMap(['a/b/c/Deep Note.md']);
    expect(map.get('deep note')).toBe('Deep Note');
  });
});

// ── buildExclusionZones ──────────────────────────────────────────────────────

describe('buildExclusionZones', () => {
  it('excludes frontmatter', () => {
    const content = '---\ntitle: Test\n---\nHello';
    const zones = buildExclusionZones(content);
    expect(zones.some((z) => z.start === 0 && z.end > 0)).toBe(true);
  });

  it('excludes wikilinks', () => {
    const content = 'See [[My Note]] here';
    const zones = buildExclusionZones(content);
    const wlZone = zones.find((z) => content.slice(z.start, z.end) === '[[My Note]]');
    expect(wlZone).toBeDefined();
  });

  it('excludes embed wikilinks', () => {
    const content = 'See ![[My Note]] here';
    const zones = buildExclusionZones(content);
    const wlZone = zones.find((z) => content.slice(z.start, z.end) === '![[My Note]]');
    expect(wlZone).toBeDefined();
  });

  it('excludes inline code', () => {
    const content = 'Use `My Note` here';
    const zones = buildExclusionZones(content);
    const codeZone = zones.find((z) => content.slice(z.start, z.end) === '`My Note`');
    expect(codeZone).toBeDefined();
  });

  it('excludes markdown links', () => {
    const content = 'See [My Note](url) here';
    const zones = buildExclusionZones(content);
    const linkZone = zones.find((z) => content.slice(z.start, z.end) === '[My Note](url)');
    expect(linkZone).toBeDefined();
  });
});

// ── detectUnlinkedMentions ───────────────────────────────────────────────────

describe('detectUnlinkedMentions', () => {
  const titles = new Map([
    ['project alpha', 'Project Alpha'],
    ['meeting notes', 'Meeting Notes'],
    ['daily log', 'Daily Log'],
  ]);

  it('detects a simple mention', () => {
    const content = 'I discussed this in Project Alpha yesterday.';
    const result = detectUnlinkedMentions(content, 'notes/Other.md', titles);
    expect(result.mentions).toHaveLength(1);
    expect(result.mentions[0].targetTitle).toBe('Project Alpha');
    expect(result.mentions[0].line).toBe(0);
    expect(result.mentions[0].column).toBe(20);
    expect(result.mentions[0].length).toBe(13);
  });

  it('detects case-insensitive mentions', () => {
    const content = 'Check the project alpha document.';
    const result = detectUnlinkedMentions(content, 'notes/Other.md', titles);
    expect(result.mentions).toHaveLength(1);
    expect(result.mentions[0].targetTitle).toBe('Project Alpha');
  });

  it('detects multiple mentions on different lines', () => {
    const content = 'Project Alpha is great.\nSee Meeting Notes too.';
    const result = detectUnlinkedMentions(content, 'notes/Other.md', titles);
    expect(result.mentions).toHaveLength(2);
    expect(result.mentions[0].targetTitle).toBe('Project Alpha');
    expect(result.mentions[1].targetTitle).toBe('Meeting Notes');
  });

  it('skips mentions inside wikilinks', () => {
    const content = 'See [[Project Alpha]] for details.';
    const result = detectUnlinkedMentions(content, 'notes/Other.md', titles);
    expect(result.mentions).toHaveLength(0);
  });

  it('skips mentions inside inline code', () => {
    const content = 'Use `Project Alpha` as reference.';
    const result = detectUnlinkedMentions(content, 'notes/Other.md', titles);
    expect(result.mentions).toHaveLength(0);
  });

  it('skips mentions inside markdown links', () => {
    const content = 'See [Project Alpha](http://example.com) here.';
    const result = detectUnlinkedMentions(content, 'notes/Other.md', titles);
    expect(result.mentions).toHaveLength(0);
  });

  it('skips self-references (source note title)', () => {
    const content = 'This is Project Alpha and it is great.';
    const result = detectUnlinkedMentions(content, 'notes/Project Alpha.md', titles);
    expect(result.mentions).toHaveLength(0);
  });

  it('respects ignore set', () => {
    const content = 'Project Alpha and Meeting Notes here.';
    const ignore = new Set(['project alpha']);
    const result = detectUnlinkedMentions(content, 'notes/Other.md', titles, ignore);
    expect(result.mentions).toHaveLength(1);
    expect(result.mentions[0].targetTitle).toBe('Meeting Notes');
  });

  it('does not match partial words', () => {
    const content = 'The ProjectAlpha repo is here.';
    const result = detectUnlinkedMentions(content, 'notes/Other.md', titles);
    expect(result.mentions).toHaveLength(0);
  });

  it('matches at start of content', () => {
    const content = 'Project Alpha is the topic.';
    const result = detectUnlinkedMentions(content, 'notes/Other.md', titles);
    expect(result.mentions).toHaveLength(1);
    expect(result.mentions[0].column).toBe(0);
  });

  it('matches at end of content', () => {
    const content = 'See Project Alpha';
    const result = detectUnlinkedMentions(content, 'notes/Other.md', titles);
    expect(result.mentions).toHaveLength(1);
  });

  it('returns context line', () => {
    const content = 'Line one.\nRefer to Project Alpha here.\nLine three.';
    const result = detectUnlinkedMentions(content, 'notes/Other.md', titles);
    expect(result.mentions[0].context).toBe('Refer to Project Alpha here.');
  });

  it('handles empty content', () => {
    const result = detectUnlinkedMentions('', 'notes/Other.md', titles);
    expect(result.mentions).toHaveLength(0);
  });

  it('handles empty title map', () => {
    const result = detectUnlinkedMentions('Hello world', 'notes/Other.md', new Map());
    expect(result.mentions).toHaveLength(0);
  });

  it('deduplicates same position', () => {
    const content = 'Project Alpha here.';
    const result = detectUnlinkedMentions(content, 'notes/Other.md', titles);
    expect(result.mentions).toHaveLength(1);
  });

  it('finds multiple occurrences of the same title', () => {
    const content = 'Project Alpha is nice. I love Project Alpha.';
    const result = detectUnlinkedMentions(content, 'notes/Other.md', titles);
    expect(result.mentions).toHaveLength(2);
  });
});

// ── linkMention ──────────────────────────────────────────────────────────────

describe('linkMention', () => {
  it('wraps a mention in wikilink syntax', () => {
    const content = 'See Project Alpha here.';
    const mention = {
      targetTitle: 'Project Alpha',
      line: 0,
      column: 4,
      length: 13,
      context: content,
    };
    const result = linkMention(content, mention);
    expect(result).toBe('See [[Project Alpha]] here.');
  });

  it('uses alias syntax when case differs', () => {
    const content = 'See project alpha here.';
    const mention = {
      targetTitle: 'Project Alpha',
      line: 0,
      column: 4,
      length: 13,
      context: content,
    };
    const result = linkMention(content, mention);
    expect(result).toBe('See [[Project Alpha|project alpha]] here.');
  });

  it('handles multiline content', () => {
    const content = 'Line one.\nSee Project Alpha here.\nLine three.';
    const mention = {
      targetTitle: 'Project Alpha',
      line: 1,
      column: 4,
      length: 13,
      context: 'See Project Alpha here.',
    };
    const result = linkMention(content, mention);
    expect(result).toBe('Line one.\nSee [[Project Alpha]] here.\nLine three.');
  });
});

// ── linkAllMentions ──────────────────────────────────────────────────────────

describe('linkAllMentions', () => {
  it('links multiple mentions preserving offsets', () => {
    const content = 'Project Alpha and Meeting Notes here.';
    const mentions = [
      { targetTitle: 'Project Alpha', line: 0, column: 0, length: 13, context: content },
      { targetTitle: 'Meeting Notes', line: 0, column: 18, length: 13, context: content },
    ];
    const result = linkAllMentions(content, mentions);
    expect(result).toBe('[[Project Alpha]] and [[Meeting Notes]] here.');
  });

  it('handles mentions across lines', () => {
    const content = 'Project Alpha is great.\nCheck Meeting Notes.';
    const mentions = [
      {
        targetTitle: 'Project Alpha',
        line: 0,
        column: 0,
        length: 13,
        context: 'Project Alpha is great.',
      },
      {
        targetTitle: 'Meeting Notes',
        line: 1,
        column: 6,
        length: 13,
        context: 'Check Meeting Notes.',
      },
    ];
    const result = linkAllMentions(content, mentions);
    expect(result).toBe('[[Project Alpha]] is great.\nCheck [[Meeting Notes]].');
  });

  it('handles empty mentions array', () => {
    const content = 'No mentions here.';
    const result = linkAllMentions(content, []);
    expect(result).toBe('No mentions here.');
  });
});

// ── Stale position re-detection ──────────────────────────────────────────────

describe('stale position re-detection', () => {
  it('re-detects mention after content shifts', () => {
    const original = 'Check Project Alpha here.';
    const titleMap = new Map<string, string>([['project alpha', 'Project Alpha']]);
    const result1 = detectUnlinkedMentions(original, 'source.md', titleMap);
    expect(result1.mentions).toHaveLength(1);
    expect(result1.mentions[0].column).toBe(6);

    // Content shifted: user added text at the beginning
    const shifted = 'EXTRA TEXT Check Project Alpha here.';
    const result2 = detectUnlinkedMentions(shifted, 'source.md', titleMap);
    expect(result2.mentions).toHaveLength(1);
    expect(result2.mentions[0].column).toBe(17);
  });

  it('returns no mentions after title is already linked', () => {
    const content = 'Check [[Project Alpha]] here.';
    const titleMap = new Map<string, string>([['project alpha', 'Project Alpha']]);
    const result = detectUnlinkedMentions(content, 'source.md', titleMap);
    expect(result.mentions).toHaveLength(0);
  });

  it('linkMention then re-detect finds no remaining unlinked mentions for same title', () => {
    const content = 'Project Alpha is great. See Project Alpha again.';
    const titleMap = new Map<string, string>([['project alpha', 'Project Alpha']]);
    const result = detectUnlinkedMentions(content, 'source.md', titleMap);
    expect(result.mentions.length).toBeGreaterThanOrEqual(2);

    const linked = linkAllMentions(content, result.mentions);
    const result2 = detectUnlinkedMentions(linked, 'source.md', titleMap);
    expect(result2.mentions).toHaveLength(0);
  });
});
