import { describe, expect, it } from 'vitest';

import type { TemplateContext } from '@/hubs/editor/services/template-vars';
import { CURSOR_MARKER, resolveTemplateVars } from '@/hubs/editor/services/template-vars';

// Fixed date: Monday July 6 2026, 14:30:00 local time
const CTX: TemplateContext = {
  noteTitle: 'My Note',
  notePath: 'projects/docs/my-note.md',
  date: new Date(2026, 6, 6, 14, 30, 0),
  noteContent:
    '---\ntitle: My Note\nauthor: Alice\ntags:\n  - test\n  - demo\ncount: 5\ndraft: true\n---\n\nBody text',
  vaultName: 'TestVault',
  noteCount: 42,
  dateFormat: 'yyyy-MM-dd',
  timeFormat: '24h',
  language: 'en',
};

const MINIMAL: TemplateContext = {
  noteTitle: 'Untitled',
  notePath: 'note.md',
  date: new Date(2026, 6, 6, 14, 30, 0),
};

describe('resolveTemplateVars', () => {
  describe('date module', () => {
    it('formats today as YYYY-MM-DD and aliases {{date}} to same', () => {
      expect(resolveTemplateVars('{{date.today}}', CTX)).toBe('2026-07-06');
      expect(resolveTemplateVars('{{date}}', CTX)).toBe('2026-07-06');
    });

    it('returns ISO 8601 string for {{date.now}}', () => {
      const result = resolveTemplateVars('{{date.now}}', CTX);
      expect(result).toBe(CTX.date.toISOString());
    });

    it('resolves individual date components with zero-padding', () => {
      const ctx = { ...CTX, date: new Date(2026, 0, 3, 9, 5, 2) }; // Jan 3
      expect(resolveTemplateVars('{{date.year}}', ctx)).toBe('2026');
      expect(resolveTemplateVars('{{date.month}}', ctx)).toBe('01');
      expect(resolveTemplateVars('{{date.day}}', ctx)).toBe('03');
      expect(resolveTemplateVars('{{date.hour}}', ctx)).toBe('09');
      expect(resolveTemplateVars('{{date.minute}}', ctx)).toBe('05');
      expect(resolveTemplateVars('{{date.second}}', ctx)).toBe('02');
    });

    it('resolves weekday names from the fixed Monday date', () => {
      expect(resolveTemplateVars('{{date.weekday}}', CTX)).toBe('Monday');
      expect(resolveTemplateVars('{{date.weekday_short}}', CTX)).toBe('Mon');
    });

    it('formats 24h time as HH:MM', () => {
      expect(resolveTemplateVars('{{date.time24}}', CTX)).toBe('14:30');
    });

    it('computes tomorrow and yesterday relative to the fixed date', () => {
      expect(resolveTemplateVars('{{date.tomorrow}}', CTX)).toBe('2026-07-07');
      expect(resolveTemplateVars('{{date.yesterday}}', CTX)).toBe('2026-07-05');
    });

    it('computes week number deterministically', () => {
      expect(resolveTemplateVars('{{date.week}}', CTX)).toBe('28');
    });

    it('computes quarter from month (July → Q3)', () => {
      expect(resolveTemplateVars('{{date.quarter}}', CTX)).toBe('Q3');
      const q1 = { ...CTX, date: new Date(2026, 1, 1) };
      expect(resolveTemplateVars('{{date.quarter}}', q1)).toBe('Q1');
    });

    it('computes unix timestamp from the fixed date', () => {
      const expected = String(Math.floor(CTX.date.getTime() / 1000));
      expect(resolveTemplateVars('{{date.unix}}', CTX)).toBe(expected);
    });
  });

  describe('date arithmetic', () => {
    it('adds days with {{date.today+N}}', () => {
      expect(resolveTemplateVars('{{date.today+7}}', CTX)).toBe('2026-07-13');
    });

    it('subtracts days with {{date.today-N}}', () => {
      expect(resolveTemplateVars('{{date.today-3}}', CTX)).toBe('2026-07-03');
    });

    it('crosses month boundary correctly', () => {
      expect(resolveTemplateVars('{{date.today+30}}', CTX)).toBe('2026-08-05');
    });

    it('crosses year boundary correctly', () => {
      const nye = { ...CTX, date: new Date(2026, 11, 30) }; // Dec 30
      expect(resolveTemplateVars('{{date.today+5}}', nye)).toBe('2027-01-04');
    });

    it('returns ISO string for {{date.now+N}}', () => {
      const result = resolveTemplateVars('{{date.now+1}}', CTX);
      const expected = new Date(2026, 6, 7, 14, 30, 0).toISOString();
      expect(result).toBe(expected);
    });
  });

  describe('bt.* namespace prefix', () => {
    it('maps bt.date, bt.file, bt.system, bt.config, bt.vault, bt.frontmatter identically', () => {
      expect(resolveTemplateVars('{{bt.date.today}}', CTX)).toBe('2026-07-06');
      expect(resolveTemplateVars('{{bt.file.title}}', CTX)).toBe('My Note');
      expect(resolveTemplateVars('{{bt.system.uuid}}', CTX)).toMatch(/^[0-9a-f-]{36}$/);
      expect(resolveTemplateVars('{{bt.config.language}}', CTX)).toBe('en');
      expect(resolveTemplateVars('{{bt.vault.name}}', CTX)).toBe('TestVault');
      expect(resolveTemplateVars('{{bt.frontmatter.author}}', CTX)).toBe('Alice');
    });
  });

  describe('file module', () => {
    it('resolves title with both {{file.title}} and {{title}} alias', () => {
      expect(resolveTemplateVars('{{file.title}}', CTX)).toBe('My Note');
      expect(resolveTemplateVars('{{title}}', CTX)).toBe('My Note');
    });

    it('extracts path, folder, name, and ext from a nested path', () => {
      expect(resolveTemplateVars('{{file.path}}', CTX)).toBe('projects/docs/my-note.md');
      expect(resolveTemplateVars('{{file.folder}}', CTX)).toBe('projects/docs');
      expect(resolveTemplateVars('{{file.name}}', CTX)).toBe('my-note');
      expect(resolveTemplateVars('{{file.ext}}', CTX)).toBe('.md');
    });

    it('returns "/" for folder when note is at root', () => {
      const root = { ...CTX, notePath: 'readme.md' };
      expect(resolveTemplateVars('{{file.folder}}', root)).toBe('/');
    });

    it('strips .md extension case-insensitively for file.name', () => {
      const upper = { ...CTX, notePath: 'folder/MyNote.MD' };
      expect(resolveTemplateVars('{{file.name}}', upper)).toBe('MyNote');
    });

    it('resolves file.created and file.modified to the context date', () => {
      expect(resolveTemplateVars('{{file.created}}', CTX)).toBe('2026-07-06');
      expect(resolveTemplateVars('{{file.modified}}', CTX)).toBe('2026-07-06');
    });
  });

  describe('frontmatter module', () => {
    it('resolves string values from YAML', () => {
      expect(resolveTemplateVars('{{frontmatter.author}}', CTX)).toBe('Alice');
    });

    it('joins array values with comma-space', () => {
      expect(resolveTemplateVars('{{frontmatter.tags}}', CTX)).toBe('test, demo');
    });

    it('coerces numeric values to string', () => {
      expect(resolveTemplateVars('{{frontmatter.count}}', CTX)).toBe('5');
    });

    it('coerces boolean values to string', () => {
      expect(resolveTemplateVars('{{frontmatter.draft}}', CTX)).toBe('true');
    });

    it('preserves original {{...}} when key does not exist', () => {
      expect(resolveTemplateVars('{{frontmatter.missing}}', CTX)).toBe('{{frontmatter.missing}}');
    });

    it('preserves original {{...}} when noteContent is absent', () => {
      expect(resolveTemplateVars('{{frontmatter.title}}', MINIMAL)).toBe('{{frontmatter.title}}');
    });

    it('preserves original {{...}} when content has no frontmatter block', () => {
      const noFm = { ...CTX, noteContent: '# Just a heading' };
      expect(resolveTemplateVars('{{frontmatter.title}}', noFm)).toBe('{{frontmatter.title}}');
    });

    it('handles bare {{frontmatter.}} (no key) gracefully', () => {
      expect(resolveTemplateVars('{{frontmatter.}}', CTX)).toBe('{{frontmatter.}}');
    });
  });

  describe('system module', () => {
    it('generates valid v4 UUID format', () => {
      expect(resolveTemplateVars('{{system.uuid}}', CTX)).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      );
    });

    it('generates distinct UUIDs on every invocation', () => {
      const results = new Set(
        Array.from({ length: 5 }, () => resolveTemplateVars('{{system.uuid}}', CTX))
      );
      expect(results.size).toBe(5);
    });

    it('{{uuid}} shorthand produces same format as {{system.uuid}}', () => {
      expect(resolveTemplateVars('{{uuid}}', CTX)).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('resolves timestamp to a number close to now', () => {
      const before = Date.now();
      const result = Number(resolveTemplateVars('{{system.timestamp}}', CTX));
      const after = Date.now();
      expect(result).toBeGreaterThanOrEqual(before);
      expect(result).toBeLessThanOrEqual(after);
    });

    it('returns {{clipboard}} placeholder for system.clipboard', () => {
      expect(resolveTemplateVars('{{system.clipboard}}', CTX)).toBe('{{clipboard}}');
    });

    it('returns unknown for unrecognized system key', () => {
      expect(resolveTemplateVars('{{system.nothing}}', CTX)).toBe('{{system.nothing}}');
    });
  });

  describe('config module', () => {
    it('reads config values from context', () => {
      expect(resolveTemplateVars('{{config.dateFormat}}', CTX)).toBe('yyyy-MM-dd');
      expect(resolveTemplateVars('{{config.timeFormat}}', CTX)).toBe('24h');
      expect(resolveTemplateVars('{{config.language}}', CTX)).toBe('en');
      expect(resolveTemplateVars('{{config.vaultName}}', CTX)).toBe('TestVault');
    });

    it('falls back to sensible defaults when context fields are omitted', () => {
      expect(resolveTemplateVars('{{config.dateFormat}}', MINIMAL)).toBe('yyyy-MM-dd');
      expect(resolveTemplateVars('{{config.timeFormat}}', MINIMAL)).toBe('24h');
      expect(resolveTemplateVars('{{config.language}}', MINIMAL)).toBe('en');
      expect(resolveTemplateVars('{{config.vaultName}}', MINIMAL)).toBe('');
    });
  });

  describe('vault module', () => {
    it('reads vault name and note count from context', () => {
      expect(resolveTemplateVars('{{vault.name}}', CTX)).toBe('TestVault');
      expect(resolveTemplateVars('{{vault.noteCount}}', CTX)).toBe('42');
    });

    it('defaults to empty name and 0 count when context fields omitted', () => {
      expect(resolveTemplateVars('{{vault.name}}', MINIMAL)).toBe('');
      expect(resolveTemplateVars('{{vault.noteCount}}', MINIMAL)).toBe('0');
    });
  });

  describe('cursor marker', () => {
    it('replaces {{cursor}} with CURSOR_MARKER sentinel', () => {
      expect(resolveTemplateVars('a {{cursor}} b', CTX)).toBe(`a ${CURSOR_MARKER} b`);
    });

    it('replaces only the first {{cursor}} when multiple exist', () => {
      const result = resolveTemplateVars('{{cursor}} mid {{cursor}}', CTX);
      const count = result.split(CURSOR_MARKER).length - 1;
      expect(count).toBe(2);
    });
  });

  describe('whitespace control ({{- }})', () => {
    it('strips whitespace between text and tag', () => {
      expect(resolveTemplateVars('Hello   {{- date.today}}', CTX)).toBe('Hello2026-07-06');
    });

    it('strips leading whitespace when nothing precedes', () => {
      expect(resolveTemplateVars('   {{- date.today}}', CTX)).toBe('2026-07-06');
    });

    it('strips newlines as whitespace', () => {
      expect(resolveTemplateVars('line1\n{{- date.today}}', CTX)).toBe('line12026-07-06');
    });

    it('preserves {{-expr}} if the variable is unknown', () => {
      const result = resolveTemplateVars('x {{- nope.key}}', CTX);
      expect(result).toContain('nope.key');
    });
  });

  describe('custom date format ({{date:FORMAT}})', () => {
    it('formats with custom date pattern', () => {
      expect(resolveTemplateVars('{{date:YYYY/MM/DD}}', CTX)).toBe('2026/07/06');
    });

    it('formats with compound pattern including weekday', () => {
      expect(resolveTemplateVars('{{date:YYYY-MM-DD ddd}}', CTX)).toBe('2026-07-06 Mon');
    });

    it('works with bt. prefix', () => {
      expect(resolveTemplateVars('{{bt.date:YYYY}}', CTX)).toBe('2026');
    });
  });

  describe('value token', () => {
    it('resolves {{value}} from context', () => {
      const ctx = { ...CTX, value: 'captured text' };
      expect(resolveTemplateVars('Got: {{value}}', ctx)).toBe('Got: captured text');
    });

    it('preserves {{value}} when not in context', () => {
      expect(resolveTemplateVars('{{value}}', CTX)).toBe('{{value}}');
    });
  });

  describe('edge cases and integration', () => {
    it('returns input unchanged when there are no template vars', () => {
      const text = '# Hello World\n\nJust regular markdown.';
      expect(resolveTemplateVars(text, CTX)).toBe(text);
    });

    it('returns empty string when input is empty', () => {
      expect(resolveTemplateVars('', CTX)).toBe('');
    });

    it('preserves unrecognized {{...}} expressions verbatim', () => {
      expect(resolveTemplateVars('{{nope}}', CTX)).toBe('{{nope}}');
      expect(resolveTemplateVars('{{foo.bar.baz}}', CTX)).toBe('{{foo.bar.baz}}');
    });

    it('resolves a realistic multi-module template exactly', () => {
      const template =
        '---\ndate: "{{date.today}}"\nauthor: "{{frontmatter.author}}"\nid: "{{system.uuid}}"\n---\n\n# {{title}}\n\nVault: {{vault.name}} ({{vault.noteCount}} notes)\nFormat: {{config.dateFormat}}\n\n{{cursor}}';
      const result = resolveTemplateVars(template, CTX);
      expect(result).toMatch(/^---\ndate: "2026-07-06"/);
      expect(result).toContain('author: "Alice"');
      expect(result).toMatch(/id: "[0-9a-f-]{36}"/);
      expect(result).toContain('# My Note');
      expect(result).toContain('Vault: TestVault (42 notes)');
      expect(result).toContain('Format: yyyy-MM-dd');
      expect(result).toContain(CURSOR_MARKER);
    });

    it('handles adjacent vars with no separator', () => {
      expect(resolveTemplateVars('{{date.year}}{{date.month}}{{date.day}}', CTX)).toBe('20260706');
    });

    it('is case-insensitive for variable keys', () => {
      expect(resolveTemplateVars('{{DATE.TODAY}}', CTX)).toBe('2026-07-06');
      expect(resolveTemplateVars('{{File.Title}}', CTX)).toBe('My Note');
      expect(resolveTemplateVars('{{BT.Date.Today}}', CTX)).toBe('2026-07-06');
    });

    it('handles vars with extra whitespace inside braces', () => {
      expect(resolveTemplateVars('{{  date.today  }}', CTX)).toBe('2026-07-06');
      expect(resolveTemplateVars('{{ file.title }}', CTX)).toBe('My Note');
    });
  });
});
