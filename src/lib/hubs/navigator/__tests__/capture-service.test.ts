import { describe, expect, it } from 'vitest';

import { formatDateCustom, formatISO, formatTime24 } from '@/hubs/editor/services/token-engine';
import {
  buildCaptureContent,
  buildDailyNotePath,
  buildDumpPath,
  buildInboxPath,
  type CaptureChoice,
  createChoiceId,
  DUMP_FRONTMATTER,
  expandCaptureTokens,
  insertDumpEntry,
  insertIntoContent,
  resolveCaptureChoice,
} from '@/hubs/navigator/services/capture-service';

// ── formatISO / formatTime ────────────────────────────────────────

describe('formatISO', () => {
  it('returns YYYY-MM-DD', () => {
    const d = new Date(2025, 5, 15); // June 15 2025
    expect(formatISO(d)).toBe('2025-06-15');
  });

  it('pads single-digit month and day', () => {
    const d = new Date(2025, 0, 3); // Jan 3
    expect(formatISO(d)).toBe('2025-01-03');
  });
});

describe('formatTime24', () => {
  it('returns HH:MM', () => {
    const d = new Date(2025, 0, 1, 14, 5);
    expect(formatTime24(d)).toBe('14:05');
  });

  it('pads midnight', () => {
    const d = new Date(2025, 0, 1, 0, 0);
    expect(formatTime24(d)).toBe('00:00');
  });
});

// ── formatDateCustom ──────────────────────────────────────────────

describe('formatDateCustom', () => {
  const d = new Date(2025, 5, 15, 9, 7, 3); // Sun June 15 2025 09:07:03

  it('replaces YYYY', () => {
    expect(formatDateCustom(d, 'YYYY')).toBe('2025');
  });

  it('replaces YY', () => {
    expect(formatDateCustom(d, 'YY')).toBe('25');
  });

  it('replaces MM with zero-padded month', () => {
    expect(formatDateCustom(d, 'MM')).toBe('06');
  });

  it('replaces MMM with short month name', () => {
    expect(formatDateCustom(d, 'MMM')).toBe('Jun');
  });

  it('replaces MMMM with full month name', () => {
    expect(formatDateCustom(d, 'MMMM')).toBe('June');
  });

  it('replaces DD with zero-padded day', () => {
    expect(formatDateCustom(d, 'DD')).toBe('15');
  });

  it('replaces ddd with short weekday', () => {
    expect(formatDateCustom(d, 'ddd')).toBe('Sun');
  });

  it('replaces dddd with full weekday', () => {
    expect(formatDateCustom(d, 'dddd')).toBe('Sunday');
  });

  it('replaces HH mm ss', () => {
    expect(formatDateCustom(d, 'HH:mm:ss')).toBe('09:07:03');
  });

  it('handles compound format', () => {
    expect(formatDateCustom(d, 'YYYY-MM-DD ddd')).toBe('2025-06-15 Sun');
  });
});

// ── expandCaptureTokens ───────────────────────────────────────────

describe('expandCaptureTokens', () => {
  const d = new Date(2025, 5, 15, 14, 30);

  it('replaces {{date}} with ISO date', () => {
    expect(expandCaptureTokens('{{date}}', { date: d })).toBe('2025-06-15');
  });

  it('replaces {{date.time24}} with HH:MM', () => {
    expect(expandCaptureTokens('{{date.time24}}', { date: d })).toBe('14:30');
  });

  it('replaces {{date:fmt}} with custom format', () => {
    expect(expandCaptureTokens('{{date:YYYY/MM/DD}}', { date: d })).toBe('2025/06/15');
  });

  it('replaces {{value}} with captured text', () => {
    expect(expandCaptureTokens('Captured: {{value}}', { value: 'hello' })).toBe('Captured: hello');
  });

  it('replaces {{title}} with title', () => {
    expect(expandCaptureTokens('# {{title}}', { title: 'My Note' })).toBe('# My Note');
  });

  it('replaces {{system.timestamp}} with Unix ms', () => {
    const before = Date.now();
    const result = Number(expandCaptureTokens('{{system.timestamp}}', { date: d }));
    const after = Date.now();
    expect(result).toBeGreaterThanOrEqual(before);
    expect(result).toBeLessThanOrEqual(after);
  });

  it('replaces {{uuid}} with a UUID-shaped string', () => {
    const result = expandCaptureTokens('{{uuid}}', {});
    expect(result).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it('replaces \\n with newline', () => {
    expect(expandCaptureTokens('line1\\nline2', {})).toBe('line1\nline2');
  });

  it('handles multiple tokens in one string', () => {
    const result = expandCaptureTokens('- {{date.time24}} {{value}}', { value: 'test', date: d });
    expect(result).toBe('- 14:30 test');
  });

  it('is case-insensitive for token names', () => {
    expect(expandCaptureTokens('{{Date}}', { date: d })).toBe('2025-06-15');
    expect(expandCaptureTokens('{{Date.Time24}}', { date: d })).toBe('14:30');
  });
});

// ── buildDailyNotePath ────────────────────────────────────────────

describe('buildDailyNotePath', () => {
  it('returns daily/<YYYY-MM-DD>.md', () => {
    const d = new Date(2025, 5, 15);
    expect(buildDailyNotePath(d)).toBe('daily/2025-06-15.md');
  });
});

// ── buildInboxPath ────────────────────────────────────────────────

describe('buildInboxPath', () => {
  it('uses given title as filename', () => {
    expect(buildInboxPath('My Idea')).toBe('inbox/My Idea.md');
  });

  it('generates timestamped name when title is empty', () => {
    const d = new Date(2025, 5, 15, 14, 30);
    const path = buildInboxPath('', d);
    expect(path).toBe('inbox/Capture 2025-06-15 1430.md');
  });
});

// ── buildCaptureContent ───────────────────────────────────────────

describe('buildCaptureContent', () => {
  it('returns plain text by default', () => {
    expect(buildCaptureContent('hello world', {})).toBe('hello world');
  });

  it('wraps as task when asTask is true', () => {
    expect(buildCaptureContent('buy milk', { asTask: true })).toBe('- [ ] buy milk');
  });

  it('applies format template when provided', () => {
    const d = new Date(2025, 5, 15, 14, 30);
    const result = buildCaptureContent('log entry', {
      format: '- {{date.time24}} {{value}}',
      date: d,
    });
    expect(result).toBe('- 14:30 log entry');
  });

  it('format takes precedence over asTask', () => {
    const result = buildCaptureContent('do thing', { format: '> {{value}}', asTask: true });
    expect(result).toBe('> do thing');
  });
});

// ── insertIntoContent ─────────────────────────────────────────────

describe('insertIntoContent', () => {
  const existing = '# Journal\n\n## Tasks\n\n- task 1\n\n## Notes\n\nSome notes.';

  it('appends to end when no insertAfter', () => {
    const result = insertIntoContent(existing, 'new line', '', 'append');
    expect(result.endsWith('new line\n')).toBe(true);
  });

  it('prepends after frontmatter when no insertAfter and prepend mode', () => {
    const withFm = '---\ntitle: Test\n---\n\nBody text.';
    const result = insertIntoContent(withFm, 'prepended', '', 'prepend');
    expect(result).toBe('---\ntitle: Test\n---\nprepended\n\nBody text.');
  });

  it('prepends before content when no frontmatter', () => {
    const result = insertIntoContent('Body text.', 'prepended', '', 'prepend');
    expect(result).toBe('prepended\nBody text.');
  });

  it('inserts after a heading marker', () => {
    const result = insertIntoContent(existing, '- new task', '## Tasks', 'append');
    const lines = result.split('\n');
    const tasksIdx = lines.findIndex((l) => l.trim() === '## Tasks');
    expect(lines[tasksIdx + 1]).toBe('- new task');
  });

  it('falls back to end when marker not found', () => {
    const result = insertIntoContent(existing, 'fallback', '## Missing', 'append');
    expect(result.endsWith('fallback\n')).toBe(true);
  });

  it('handles empty existing content', () => {
    const result = insertIntoContent('', 'first line', '', 'append');
    expect(result).toBe('\nfirst line\n');
  });
});

// ── resolveCaptureChoice ──────────────────────────────────────────

describe('resolveCaptureChoice', () => {
  const d = new Date(2025, 5, 15, 14, 30);

  const newChoice: CaptureChoice = {
    id: 'c1',
    name: 'Quick Note',
    mode: 'new',
    targetPath: '',
    format: '',
    insertAfter: '',
    asTask: false,
    enabled: true,
  };

  const dailyChoice: CaptureChoice = {
    id: 'c2',
    name: 'Daily Log',
    mode: 'daily',
    targetPath: '',
    format: '- {{date.time24}} {{value}}',
    insertAfter: '',
    asTask: false,
    enabled: true,
  };

  const appendChoice: CaptureChoice = {
    id: 'c3',
    name: 'Append to Ideas',
    mode: 'append',
    targetPath: 'notes/ideas.md',
    format: '',
    insertAfter: '## Ideas',
    asTask: false,
    enabled: true,
  };

  it('resolves new mode with inbox path', () => {
    const result = resolveCaptureChoice(newChoice, 'My thought', d);
    expect(result.mode).toBe('new');
    expect(result.targetPath).toMatch(/^inbox\//);
    expect(result.content).toBe('My thought');
  });

  it('resolves daily mode with daily path and formatted content', () => {
    const result = resolveCaptureChoice(dailyChoice, 'standup done', d);
    expect(result.mode).toBe('daily');
    expect(result.targetPath).toBe('daily/2025-06-15.md');
    expect(result.content).toBe('- 14:30 standup done');
  });

  it('resolves append mode with target path and insertAfter', () => {
    const result = resolveCaptureChoice(appendChoice, 'new idea', d);
    expect(result.mode).toBe('append');
    expect(result.targetPath).toBe('notes/ideas.md');
    expect(result.insertAfter).toBe('## Ideas');
    expect(result.content).toBe('new idea');
  });

  it('resolves task capture', () => {
    const taskChoice: CaptureChoice = { ...newChoice, asTask: true };
    const result = resolveCaptureChoice(taskChoice, 'buy groceries', d);
    expect(result.content).toBe('- [ ] buy groceries');
  });
});

// ── buildDumpPath ─────────────────────────────────────────────────

describe('buildDumpPath', () => {
  it('builds path in folder', () => {
    expect(buildDumpPath('projects/ml')).toBe('projects/ml/_dump.md');
  });

  it('builds path at root', () => {
    expect(buildDumpPath('')).toBe('_dump.md');
  });

  it('trims trailing slashes', () => {
    expect(buildDumpPath('folder/')).toBe('folder/_dump.md');
  });
});

// ── insertDumpEntry ───────────────────────────────────────────────

describe('insertDumpEntry', () => {
  const d = new Date(2025, 0, 15, 14, 30);

  it('bootstraps empty content with frontmatter and entry', () => {
    const result = insertDumpEntry('', 'first thought', d);
    expect(result).toContain('tags: [dump]');
    expect(result).toContain('## 2025-01-15');
    expect(result).toContain('- 14:30 first thought');
  });

  it('inserts under existing date heading', () => {
    const existing = `${DUMP_FRONTMATTER}\n## 2025-01-15\n- 14:00 earlier thought`;
    const result = insertDumpEntry(existing, 'new thought', d);
    const lines = result.split('\n');
    const headingIdx = lines.findIndex((l) => l.trim() === '## 2025-01-15');
    expect(lines[headingIdx + 1]).toBe('- 14:30 new thought');
    expect(lines[headingIdx + 2]).toBe('- 14:00 earlier thought');
  });

  it('creates new date heading before older entries', () => {
    const existing = `${DUMP_FRONTMATTER}\n## 2025-01-10\n- 10:00 old thought`;
    const result = insertDumpEntry(existing, 'today thought', d);
    expect(result.indexOf('## 2025-01-15')).toBeLessThan(result.indexOf('## 2025-01-10'));
  });
});

// ── resolveCaptureChoice dump mode ────────────────────────────────

describe('resolveCaptureChoice dump mode', () => {
  const d = new Date(2025, 0, 15, 14, 30);

  it('resolves dump mode target path', () => {
    const choice: CaptureChoice = {
      id: 'dump',
      name: 'Brain Dump',
      mode: 'dump',
      targetPath: 'projects/ml',
      format: '',
      insertAfter: '',
      asTask: false,
      enabled: true,
    };
    const result = resolveCaptureChoice(choice, 'some thought', d);
    expect(result.mode).toBe('dump');
    expect(result.targetPath).toBe('projects/ml/_dump.md');
  });

  it('resolves dump mode with empty target to root', () => {
    const choice: CaptureChoice = {
      id: 'dump',
      name: 'Brain Dump',
      mode: 'dump',
      targetPath: '',
      format: '',
      insertAfter: '',
      asTask: false,
      enabled: true,
    };
    const result = resolveCaptureChoice(choice, 'root dump', d);
    expect(result.targetPath).toBe('_dump.md');
  });
});

// ── createChoiceId ────────────────────────────────────────────────

describe('createChoiceId', () => {
  it('returns a string starting with "choice-"', () => {
    expect(createChoiceId()).toMatch(/^choice-\d+-[a-z0-9]{4}$/);
  });

  it('generates unique ids', () => {
    const ids = new Set(Array.from({ length: 20 }, () => createChoiceId()));
    expect(ids.size).toBe(20);
  });
});
