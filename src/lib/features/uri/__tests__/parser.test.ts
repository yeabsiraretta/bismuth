import { describe, it, expect } from 'vitest';
import { parseAdvancedUri, buildAdvancedUri } from '../parser';

describe('parseAdvancedUri', () => {
  it('returns null for non-bismuth URIs', () => {
    expect(parseAdvancedUri('https://example.com')).toBeNull();
    expect(parseAdvancedUri('obsidian://open?vault=test')).toBeNull();
    expect(parseAdvancedUri('')).toBeNull();
  });

  it('returns null for unknown actions', () => {
    expect(parseAdvancedUri('bismuth://foobar?vault=test')).toBeNull();
    expect(parseAdvancedUri('bismuth://')).toBeNull();
  });

  it('parses open action with filepath', () => {
    const result = parseAdvancedUri('bismuth://open?vault=MyVault&filepath=notes/todo.md');
    expect(result).not.toBeNull();
    expect(result!.action).toBe('open');
    expect(result!.vault).toBe('MyVault');
    expect(result!.filepath).toBe('notes/todo.md');
  });

  it('parses open action with heading', () => {
    const result = parseAdvancedUri('bismuth://open?vault=MyVault&filepath=my-file&heading=Goals');
    expect(result!.heading).toBe('Goals');
  });

  it('parses open action with block reference', () => {
    const result = parseAdvancedUri('bismuth://open?filepath=note.md&block=abc123');
    expect(result!.block).toBe('abc123');
  });

  it('parses edit action with data and mode', () => {
    const result = parseAdvancedUri(
      'bismuth://edit?filepath=note.md&data=Hello%20World&mode=append'
    );
    expect(result!.action).toBe('edit');
    expect(result!.data).toBe('Hello World');
    expect(result!.mode).toBe('append');
  });

  it('parses edit action with clipboard flag', () => {
    const result = parseAdvancedUri('bismuth://edit?filepath=note.md&clipboard=true&mode=prepend');
    expect(result!.clipboard).toBe(true);
    expect(result!.mode).toBe('prepend');
  });

  it('parses create action', () => {
    const result = parseAdvancedUri('bismuth://create?filepath=new-note.md&data=Initial%20content');
    expect(result!.action).toBe('create');
    expect(result!.filepath).toBe('new-note.md');
    expect(result!.data).toBe('Initial content');
  });

  it('parses daily action', () => {
    const result = parseAdvancedUri('bismuth://daily?vault=MyVault&clipboard=true&mode=append');
    expect(result!.action).toBe('daily');
    expect(result!.clipboard).toBe(true);
    expect(result!.mode).toBe('append');
  });

  it('parses command action', () => {
    const result = parseAdvancedUri(
      'bismuth://command?vault=MyVault&commandid=workspace%3Aexport-pdf'
    );
    expect(result!.action).toBe('command');
    expect(result!.commandid).toBe('workspace:export-pdf');
  });

  it('parses search action', () => {
    const result = parseAdvancedUri('bismuth://search?query=project%20plan');
    expect(result!.action).toBe('search');
    expect(result!.query).toBe('project plan');
  });

  it('parses searchreplace action', () => {
    const result = parseAdvancedUri(
      'bismuth://searchreplace?filepath=note.md&search=old&replace=new&regex=true'
    );
    expect(result!.action).toBe('searchreplace');
    expect(result!.search).toBe('old');
    expect(result!.replace).toBe('new');
    expect(result!.regex).toBe(true);
  });

  it('parses frontmatter read action', () => {
    const result = parseAdvancedUri('bismuth://frontmatter?filepath=note.md&frontmatterkey=status');
    expect(result!.action).toBe('frontmatter');
    expect(result!.frontmatterkey).toBe('status');
    expect(result!.data).toBeUndefined();
  });

  it('parses frontmatter write action', () => {
    const result = parseAdvancedUri(
      'bismuth://frontmatter?filepath=note.md&frontmatterkey=tags&data=%5B%22a%22%2C%22b%22%5D'
    );
    expect(result!.frontmatterkey).toBe('tags');
    expect(result!.data).toBe('["a","b"]');
  });

  it('parses canvas action with viewport', () => {
    const result = parseAdvancedUri('bismuth://canvas?canvasid=abc&x=100&y=200&zoom=1.5');
    expect(result!.action).toBe('canvas');
    expect(result!.canvasid).toBe('abc');
    expect(result!.x).toBe(100);
    expect(result!.y).toBe(200);
    expect(result!.zoom).toBe(1.5);
  });

  it('parses workspace action', () => {
    const result = parseAdvancedUri('bismuth://workspace?workspace=writing');
    expect(result!.action).toBe('workspace');
    expect(result!.workspace).toBe('writing');
  });

  it('parses bookmark action', () => {
    const result = parseAdvancedUri('bismuth://bookmark?bookmark=Research');
    expect(result!.action).toBe('bookmark');
    expect(result!.bookmark).toBe('Research');
  });

  it('parses annotate action', () => {
    const result = parseAdvancedUri('bismuth://annotate?filepath=papers/arxiv.pdf');
    expect(result!.action).toBe('annotate');
    expect(result!.filepath).toBe('papers/arxiv.pdf');
  });

  it('parses boolean flags correctly', () => {
    const result = parseAdvancedUri(
      'bismuth://open?filepath=note.md&ifnotexists=true&newpane=true'
    );
    expect(result!.ifnotexists).toBe(true);
    expect(result!.newpane).toBe(true);
  });

  it('defaults boolean flags to false', () => {
    const result = parseAdvancedUri('bismuth://open?filepath=note.md');
    expect(result!.clipboard).toBe(false);
    expect(result!.regex).toBe(false);
    expect(result!.ifnotexists).toBe(false);
    expect(result!.newpane).toBe(false);
  });

  it('parses viewmode parameter', () => {
    const result = parseAdvancedUri('bismuth://open?filepath=note.md&viewmode=preview');
    expect(result!.viewmode).toBe('preview');
  });

  it('ignores invalid viewmode', () => {
    const result = parseAdvancedUri('bismuth://open?filepath=note.md&viewmode=invalid');
    expect(result!.viewmode).toBeUndefined();
  });

  it('ignores invalid write mode', () => {
    const result = parseAdvancedUri('bismuth://edit?filepath=note.md&mode=invalid');
    expect(result!.mode).toBeUndefined();
  });

  it('preserves raw query params', () => {
    const result = parseAdvancedUri('bismuth://open?filepath=note.md&custom=value&another=test');
    expect(result!.raw['custom']).toBe('value');
    expect(result!.raw['another']).toBe('test');
  });

  it('handles URI-encoded values', () => {
    const result = parseAdvancedUri(
      'bismuth://open?filepath=my%20folder/my%20note.md&heading=Section%201'
    );
    expect(result!.filepath).toBe('my folder/my note.md');
    expect(result!.heading).toBe('Section 1');
  });

  it('handles action with no query params', () => {
    const result = parseAdvancedUri('bismuth://daily');
    expect(result).not.toBeNull();
    expect(result!.action).toBe('daily');
    expect(result!.vault).toBeUndefined();
  });

  it('parses line number', () => {
    const result = parseAdvancedUri('bismuth://open?filepath=note.md&line=42');
    expect(result!.line).toBe(42);
  });
});

describe('buildAdvancedUri', () => {
  it('builds a simple open URI', () => {
    const uri = buildAdvancedUri('open', { vault: 'MyVault', filepath: 'note.md' });
    expect(uri).toBe('bismuth://open?vault=MyVault&filepath=note.md');
  });

  it('encodes special characters', () => {
    const uri = buildAdvancedUri('open', { filepath: 'my folder/note.md' });
    expect(uri).toContain('my%20folder%2Fnote.md');
  });

  it('omits undefined and false values', () => {
    const uri = buildAdvancedUri('edit', {
      filepath: 'note.md',
      clipboard: false,
      mode: undefined,
    });
    expect(uri).toBe('bismuth://edit?filepath=note.md');
  });

  it('omits empty string values', () => {
    const uri = buildAdvancedUri('open', { filepath: 'note.md', heading: '' });
    expect(uri).toBe('bismuth://open?filepath=note.md');
  });

  it('includes true boolean values', () => {
    const uri = buildAdvancedUri('edit', { filepath: 'note.md', clipboard: true });
    expect(uri).toContain('clipboard=true');
  });

  it('includes numeric values', () => {
    const uri = buildAdvancedUri('canvas', { canvasid: 'abc', x: 100, zoom: 1.5 });
    expect(uri).toContain('x=100');
    expect(uri).toContain('zoom=1.5');
  });

  it('builds URI with no params', () => {
    const uri = buildAdvancedUri('daily', {});
    expect(uri).toBe('bismuth://daily');
  });

  it('roundtrips through parse', () => {
    const original = { vault: 'Test', filepath: 'notes/todo.md', heading: 'Goals' };
    const uri = buildAdvancedUri('open', original);
    const parsed = parseAdvancedUri(uri);
    expect(parsed!.action).toBe('open');
    expect(parsed!.vault).toBe('Test');
    expect(parsed!.heading).toBe('Goals');
  });
});
