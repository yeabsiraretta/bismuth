/**
 * Unit tests for token extractor.
 */

import { describe, it, expect } from 'vitest';
import { extractTokens } from '../tokenExtractor';
import type { CanvasVariable } from '@/features/canvas/types';

const mockVariables: CanvasVariable[] = [
  {
    id: 'v1',
    name: 'primary',
    type: 'color',
    collection: 'Colors',
    values: { light: '#3b82f6', dark: '#60a5fa' },
    description: 'Brand color',
  },
  {
    id: 'v2',
    name: 'secondary',
    type: 'color',
    collection: 'Colors',
    values: { light: '#6b7280', dark: '#9ca3af' },
    description: undefined,
  },
  {
    id: 'v3',
    name: 'm',
    type: 'number',
    collection: 'Spacing',
    values: { default: 16 },
    description: 'Medium spacing',
  },
] as unknown as CanvasVariable[];

describe('extractTokens', () => {
  it('groups variables by collection', () => {
    const result = extractTokens(mockVariables);
    expect(result.collections).toHaveLength(2);
    expect(result.collections.map((c) => c.name)).toContain('Colors');
    expect(result.collections.map((c) => c.name)).toContain('Spacing');
  });

  it('produces correct token count per collection', () => {
    const result = extractTokens(mockVariables);
    const colors = result.collections.find((c) => c.name === 'Colors');
    const spacing = result.collections.find((c) => c.name === 'Spacing');
    expect(colors?.tokens).toHaveLength(2);
    expect(spacing?.tokens).toHaveLength(1);
  });

  it('maps token type correctly', () => {
    const result = extractTokens(mockVariables);
    const colors = result.collections.find((c) => c.name === 'Colors')!;
    expect(colors.tokens[0].type).toBe('color');
    const spacing = result.collections.find((c) => c.name === 'Spacing')!;
    expect(spacing.tokens[0].type).toBe('number');
  });

  it('generates css_var with collection prefix', () => {
    const result = extractTokens(mockVariables);
    const colors = result.collections.find((c) => c.name === 'Colors')!;
    expect(colors.tokens[0].css_var).toBe('--colors-primary');
  });

  it('preserves multi-mode values', () => {
    const result = extractTokens(mockVariables);
    const colors = result.collections.find((c) => c.name === 'Colors')!;
    expect(colors.tokens[0].values).toEqual({ light: '#3b82f6', dark: '#60a5fa' });
  });

  it('returns empty collections for empty input', () => {
    const result = extractTokens([]);
    expect(result.collections).toHaveLength(0);
  });
});
