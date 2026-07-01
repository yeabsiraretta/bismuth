import { describe, it, expect } from 'vitest';
import {
  validateValue, coerceValue,
  missingProperties, isComplete, completionPercent,
} from '../services/capture';
import type { PropertyDefinition } from '../types';

function propDef(overrides: Partial<PropertyDefinition> = {}): PropertyDefinition {
  return {
    id: 'p1', name: 'test', type: 'number',
    order: 0, ...overrides,
  };
}

describe('validateValue', () => {
  it('accepts valid number', () => {
    expect(validateValue(42, 'number').valid).toBe(true);
  });

  it('rejects non-number', () => {
    expect(validateValue('abc', 'number').valid).toBe(false);
  });

  it('enforces min/max constraints', () => {
    expect(validateValue(0, 'number', { min: 1 }).valid).toBe(false);
    expect(validateValue(11, 'number', { max: 10 }).valid).toBe(false);
    expect(validateValue(5, 'number', { min: 1, max: 10 }).valid).toBe(true);
  });

  it('enforces allowed values for text', () => {
    expect(validateValue('good', 'text', { allowedValues: ['good', 'bad'] }).valid).toBe(true);
    expect(validateValue('meh', 'text', { allowedValues: ['good', 'bad'] }).valid).toBe(false);
  });

  it('accepts valid date', () => {
    expect(validateValue('2026-01-15', 'date').valid).toBe(true);
    expect(validateValue('not-a-date', 'date').valid).toBe(false);
  });

  it('accepts booleans for checkbox', () => {
    expect(validateValue(true, 'checkbox').valid).toBe(true);
    expect(validateValue('true', 'checkbox').valid).toBe(true);
  });

  it('accepts empty values', () => {
    expect(validateValue('', 'number').valid).toBe(true);
    expect(validateValue(null, 'text').valid).toBe(true);
  });
});

describe('coerceValue', () => {
  it('coerces string to number', () => {
    expect(coerceValue('42', 'number')).toBe(42);
  });

  it('coerces to boolean', () => {
    expect(coerceValue('true', 'checkbox')).toBe(true);
    expect(coerceValue('false', 'checkbox')).toBe(false);
  });

  it('splits comma-separated list', () => {
    expect(coerceValue('a, b, c', 'list')).toEqual(['a', 'b', 'c']);
  });

  it('returns undefined for empty', () => {
    expect(coerceValue('', 'number')).toBeUndefined();
  });

  it('slices date to 10 chars', () => {
    expect(coerceValue('2026-01-15T10:30:00', 'date')).toBe('2026-01-15');
  });
});

describe('missingProperties', () => {
  it('finds missing properties', () => {
    const defs = [propDef({ name: 'a' }), propDef({ name: 'b' })];
    const fm = { a: 5 };
    const missing = missingProperties(fm, defs);
    expect(missing).toHaveLength(1);
    expect(missing[0].name).toBe('b');
  });

  it('treats empty string as missing', () => {
    const defs = [propDef({ name: 'x' })];
    expect(missingProperties({ x: '' }, defs)).toHaveLength(1);
  });
});

describe('isComplete', () => {
  it('returns true when all filled', () => {
    const defs = [propDef({ name: 'a' }), propDef({ name: 'b' })];
    expect(isComplete({ a: 1, b: 2 }, defs)).toBe(true);
  });

  it('returns false when some missing', () => {
    const defs = [propDef({ name: 'a' }), propDef({ name: 'b' })];
    expect(isComplete({ a: 1 }, defs)).toBe(false);
  });
});

describe('completionPercent', () => {
  it('returns percentage filled', () => {
    const defs = [propDef({ name: 'a' }), propDef({ name: 'b' }), propDef({ name: 'c' }), propDef({ name: 'd' })];
    expect(completionPercent({ a: 1, b: 2 }, defs)).toBe(50);
  });

  it('returns 100 for empty definitions', () => {
    expect(completionPercent({}, [])).toBe(100);
  });
});
