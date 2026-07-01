/**
 * Unit tests for the JSON diff engine.
 */

import { describe, it, expect } from 'vitest';
import { computeDiff, computeDocumentDiff } from '../diffEngine';

describe('computeDiff', () => {
  it('returns empty ops for identical objects', () => {
    const obj = { a: 1, b: 'hello' };
    expect(computeDiff(obj, obj)).toEqual([]);
  });

  it('detects added keys', () => {
    const ops = computeDiff({ a: 1 }, { a: 1, b: 2 });
    expect(ops).toEqual([{ op: 'add', path: '/b', value: 2 }]);
  });

  it('detects removed keys', () => {
    const ops = computeDiff({ a: 1, b: 2 }, { a: 1 });
    expect(ops).toEqual([{ op: 'remove', path: '/b' }]);
  });

  it('detects replaced values', () => {
    const ops = computeDiff({ a: 1 }, { a: 2 });
    expect(ops).toEqual([{ op: 'replace', path: '/a', value: 2 }]);
  });

  it('handles nested objects', () => {
    const ops = computeDiff({ a: { b: 1 } }, { a: { b: 2 } });
    expect(ops).toEqual([{ op: 'replace', path: '/a/b', value: 2 }]);
  });

  it('handles array additions', () => {
    const ops = computeDiff({ arr: [1, 2] }, { arr: [1, 2, 3] });
    expect(ops).toEqual([{ op: 'add', path: '/arr/2', value: 3 }]);
  });

  it('handles array removals', () => {
    const ops = computeDiff({ arr: [1, 2, 3] }, { arr: [1, 2] });
    expect(ops).toEqual([{ op: 'remove', path: '/arr/2' }]);
  });

  it('handles null to value', () => {
    const ops = computeDiff(null, { a: 1 });
    expect(ops).toEqual([{ op: 'add', path: '/a', value: 1 }]);
  });

  it('handles type change', () => {
    const ops = computeDiff({ a: 'string' }, { a: 42 });
    expect(ops).toEqual([{ op: 'replace', path: '/a', value: 42 }]);
  });
});

describe('computeDocumentDiff', () => {
  it('produces summary with correct counts', () => {
    const a = { name: 'old', count: 1 };
    const b = { name: 'new', count: 1, extra: true };
    const result = computeDocumentDiff(a, b, 1, 2);
    expect(result.from_version).toBe(1);
    expect(result.to_version).toBe(2);
    expect(result.summary.changed).toBe(1); // name replaced
    expect(result.summary.added).toBe(1); // extra added
    expect(result.summary.removed).toBe(0);
  });

  it('returns zero ops for identical payloads', () => {
    const payload = { x: [1, 2, 3] };
    const result = computeDocumentDiff(payload, payload, 1, 1);
    expect(result.operations).toHaveLength(0);
    expect(result.summary).toEqual({ added: 0, removed: 0, changed: 0 });
  });
});
