import { describe, it, expect } from 'vitest';
import { generateId, generatePrefixedId } from '../id';

describe('generateId', () => {
  it('returns a valid UUID v4 format', () => {
    const id = generateId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('generates unique IDs on successive calls', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });

  it('returns a string', () => {
    expect(typeof generateId()).toBe('string');
  });
});

describe('generatePrefixedId', () => {
  it('prefixes with the given string', () => {
    const id = generatePrefixedId('layer');
    expect(id.startsWith('layer_')).toBe(true);
  });

  it('contains a UUID after the prefix', () => {
    const id = generatePrefixedId('grp');
    const uuid = id.slice('grp_'.length);
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('generates unique prefixed IDs', () => {
    const ids = new Set(Array.from({ length: 50 }, () => generatePrefixedId('el')));
    expect(ids.size).toBe(50);
  });

  it('handles empty prefix', () => {
    const id = generatePrefixedId('');
    expect(id.startsWith('_')).toBe(true);
  });
});
