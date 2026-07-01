import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatDate, formatRelative } from '../date';

describe('formatDate', () => {
  it('formats a valid ISO date with yyyy-MM-dd', () => {
    expect(formatDate('2026-01-15T10:30:00Z', 'yyyy-MM-dd')).toBe('2026-01-15');
  });

  it('formats with time pattern', () => {
    // date-fns converts to local time, so just verify a valid HH:mm shape
    const result = formatDate('2026-06-10T14:30:00Z', 'HH:mm');
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });

  it('formats with complex pattern', () => {
    const result = formatDate('2026-03-05T09:00:00Z', 'MMM d, yyyy');
    expect(result).toBe('Mar 5, 2026');
  });

  it('returns empty string for null', () => {
    expect(formatDate(null, 'yyyy-MM-dd')).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(formatDate(undefined, 'yyyy-MM-dd')).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(formatDate('', 'yyyy-MM-dd')).toBe('');
  });

  it('returns empty string for invalid date', () => {
    expect(formatDate('not-a-date', 'yyyy-MM-dd')).toBe('');
  });
});

describe('formatRelative', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-10T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for less than 1 minute ago', () => {
    expect(formatRelative('2026-06-10T11:59:30Z')).toBe('just now');
  });

  it('returns minutes ago', () => {
    expect(formatRelative('2026-06-10T11:55:00Z')).toBe('5m ago');
  });

  it('returns hours ago', () => {
    expect(formatRelative('2026-06-10T09:00:00Z')).toBe('3h ago');
  });

  it('returns days ago', () => {
    expect(formatRelative('2026-06-08T12:00:00Z')).toBe('2d ago');
  });

  it('returns formatted date for over 30 days', () => {
    expect(formatRelative('2026-04-01T12:00:00Z')).toBe('Apr 1, 2026');
  });

  it('returns empty string for null', () => {
    expect(formatRelative(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(formatRelative(undefined)).toBe('');
  });

  it('returns empty string for invalid date', () => {
    expect(formatRelative('garbage')).toBe('');
  });
});
