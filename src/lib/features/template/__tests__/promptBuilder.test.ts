import { describe, it, expect } from 'vitest';
import {
  buildPrompt,
  truncateContext,
  estimateTokens,
  buildContextFromNote,
  stripFrontmatter,
  contextPreview,
} from '../services/promptBuilder';
import type { SmartTemplate, PromptContext } from '../types/smartTemplate';

const mockContext: PromptContext = {
  noteTitle: 'My Note',
  notePath: '/vault/My Note.md',
  content: 'This is the note content about important topics.',
  isSelection: false,
  additionalNotes: [],
};

const mockTemplate: SmartTemplate = {
  name: 'Create summary',
  content: 'Summarize the following note concisely.',
  source: 'builtin',
  description: 'Summarize the note',
};

describe('buildPrompt', () => {
  it('builds prompt with context and template', () => {
    const result = buildPrompt(mockContext, [mockTemplate], '', 8000);
    expect(result.text).toContain('## Instructions');
    expect(result.text).toContain('Summarize the following note');
    expect(result.text).toContain('## Context — Note: My Note');
    expect(result.text).toContain('important topics');
    expect(result.templateNames).toEqual(['Create summary']);
    expect(result.charCount).toBe(result.text.length);
    expect(result.estimatedTokens).toBeGreaterThan(0);
  });

  it('builds prompt without templates', () => {
    const result = buildPrompt(mockContext, [], '', 8000);
    expect(result.text).not.toContain('## Instructions');
    expect(result.text).toContain('## Context');
    expect(result.templateNames).toEqual([]);
  });

  it('includes additional instructions', () => {
    const result = buildPrompt(mockContext, [], 'Use bullet points', 8000);
    expect(result.text).toContain('## Additional Instructions');
    expect(result.text).toContain('Use bullet points');
  });

  it('merges multiple templates in order', () => {
    const t2: SmartTemplate = { name: 'Action items', content: 'Extract action items.', source: 'builtin' };
    const result = buildPrompt(mockContext, [mockTemplate, t2], '', 8000);
    const instrIdx = result.text.indexOf('Summarize');
    const actionIdx = result.text.indexOf('Extract action');
    expect(instrIdx).toBeLessThan(actionIdx);
    expect(result.templateNames).toEqual(['Create summary', 'Action items']);
  });

  it('includes additional notes', () => {
    const ctx: PromptContext = {
      ...mockContext,
      additionalNotes: [{ title: 'Ref Note', content: 'Reference data.' }],
    };
    const result = buildPrompt(ctx, [], '', 8000);
    expect(result.text).toContain('## Additional Context — Ref Note');
    expect(result.text).toContain('Reference data');
  });

  it('labels selection context correctly', () => {
    const ctx: PromptContext = { ...mockContext, isSelection: true };
    const result = buildPrompt(ctx, [], '', 8000);
    expect(result.text).toContain('Selected Text');
  });

  it('records builtAt timestamp', () => {
    const result = buildPrompt(mockContext, [], '', 8000);
    expect(result.builtAt).toMatch(/^\d{4}-\d{2}-\d{2}/);
  });
});

describe('truncateContext', () => {
  it('returns short text unchanged', () => {
    expect(truncateContext('short', 100)).toBe('short');
  });

  it('truncates long text', () => {
    const long = 'x'.repeat(200);
    const result = truncateContext(long, 100);
    expect(result.length).toBeLessThanOrEqual(150);
    expect(result).toContain('[... content truncated');
  });

  it('breaks at paragraph boundary when possible', () => {
    const text = 'First paragraph.\n\nSecond paragraph that is much longer and goes on.';
    const result = truncateContext(text, 40);
    expect(result).toContain('[... content truncated');
  });
});

describe('estimateTokens', () => {
  it('estimates ~4 chars per token', () => {
    expect(estimateTokens('twelve chars')).toBe(3);
  });

  it('handles empty string', () => {
    expect(estimateTokens('')).toBe(0);
  });
});

describe('buildContextFromNote', () => {
  it('builds context from full note', () => {
    const ctx = buildContextFromNote('Title', '/path', 'content');
    expect(ctx.noteTitle).toBe('Title');
    expect(ctx.content).toBe('content');
    expect(ctx.isSelection).toBe(false);
  });

  it('uses selection when provided', () => {
    const ctx = buildContextFromNote('Title', '/path', 'full content', 'selected part');
    expect(ctx.content).toBe('selected part');
    expect(ctx.isSelection).toBe(true);
  });
});

describe('stripFrontmatter', () => {
  it('strips YAML frontmatter', () => {
    const content = '---\ntitle: Test\ntags: [a]\n---\n\n# Heading\n\nBody text';
    expect(stripFrontmatter(content)).toBe('# Heading\n\nBody text');
  });

  it('returns content unchanged if no frontmatter', () => {
    expect(stripFrontmatter('Just content')).toBe('Just content');
  });
});

describe('contextPreview', () => {
  it('returns first N lines', () => {
    const content = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6';
    const preview = contextPreview(content, 3);
    expect(preview).toBe('Line 1\nLine 2\nLine 3\n…');
  });

  it('returns all lines if fewer than max', () => {
    const content = 'Line 1\nLine 2';
    expect(contextPreview(content, 5)).toBe('Line 1\nLine 2');
  });
});
