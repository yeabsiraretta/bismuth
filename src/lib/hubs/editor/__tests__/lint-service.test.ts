import { describe, expect, it, vi } from 'vitest';

vi.mock('@/hubs/core/stores/vault-store.svelte', () => ({
  getNotes: () => [
    { title: 'Existing Note', path: 'existing-note.md', modifiedAt: 0, createdAt: 0, size: 0 },
    { title: 'Another', path: 'another.md', modifiedAt: 0, createdAt: 0, size: 0 },
  ],
}));

import { lintMarkdown, lintSummary } from '@/hubs/editor/services/lint-service';

describe('lintMarkdown', () => {
  it('detects heading level jumps', () => {
    const content = '# H1\n\n### H3';
    const diags = lintMarkdown(content);
    const jump = diags.find((d) => d.rule === 'heading-increment');
    expect(jump).toBeDefined();
    expect(jump!.message).toContain('h1 to h3');
  });

  it('allows sequential heading increments', () => {
    const content = '# H1\n\n## H2\n\n### H3';
    const diags = lintMarkdown(content);
    const jumps = diags.filter((d) => d.rule === 'heading-increment');
    expect(jumps).toHaveLength(0);
  });

  it('detects empty headings', () => {
    const content = '## \n\nSome text';
    const diags = lintMarkdown(content);
    const empty = diags.find((d) => d.rule === 'no-empty-heading');
    expect(empty).toBeDefined();
  });

  it('detects trailing whitespace', () => {
    const content = 'Hello   \nWorld';
    const diags = lintMarkdown(content);
    const trailing = diags.find((d) => d.rule === 'no-trailing-whitespace');
    expect(trailing).toBeDefined();
    expect(trailing!.line).toBe(1);
  });

  it('detects excessive blank lines', () => {
    const content = 'Line 1\n\n\n\nLine 2';
    const diags = lintMarkdown(content);
    const blanks = diags.filter((d) => d.rule === 'no-excessive-blanks');
    expect(blanks.length).toBeGreaterThan(0);
  });

  it('detects broken wikilinks', () => {
    const content = 'See [[Nonexistent Note]] for details.';
    const diags = lintMarkdown(content, 'test.md');
    const broken = diags.find((d) => d.rule === 'no-broken-wikilinks');
    expect(broken).toBeDefined();
    expect(broken!.message).toContain('Nonexistent Note');
  });

  it('does not flag valid wikilinks', () => {
    const content = 'See [[Existing Note]] for details.';
    const diags = lintMarkdown(content, 'test.md');
    const broken = diags.filter((d) => d.rule === 'no-broken-wikilinks');
    expect(broken).toHaveLength(0);
  });

  it('skips wikilink check when notePath is omitted', () => {
    const content = 'See [[Nonexistent]] link.';
    const diags = lintMarkdown(content);
    const broken = diags.filter((d) => d.rule === 'no-broken-wikilinks');
    expect(broken).toHaveLength(0);
  });

  it('returns empty array for clean content', () => {
    const content = '# Title\n\nSome clean paragraph.';
    const diags = lintMarkdown(content);
    expect(diags).toHaveLength(0);
  });
});

describe('lintSummary', () => {
  it('returns "No issues" for empty array', () => {
    expect(lintSummary([])).toBe('No issues');
  });

  it('summarizes errors and warnings', () => {
    const diags = [
      { line: 1, column: 1, severity: 'error' as const, message: '', rule: '' },
      { line: 2, column: 1, severity: 'warning' as const, message: '', rule: '' },
      { line: 3, column: 1, severity: 'warning' as const, message: '', rule: '' },
      { line: 4, column: 1, severity: 'info' as const, message: '', rule: '' },
    ];
    const summary = lintSummary(diags);
    expect(summary).toContain('1 error');
    expect(summary).toContain('2 warnings');
    expect(summary).toContain('1 info');
  });

  it('handles singular counts', () => {
    const diags = [{ line: 1, column: 1, severity: 'warning' as const, message: '', rule: '' }];
    expect(lintSummary(diags)).toBe('1 warning');
  });
});
